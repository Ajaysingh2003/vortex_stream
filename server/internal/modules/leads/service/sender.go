package service

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"net/http"
	"net/mail"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
)

type SendResult struct {
	Status     int
	Error      string
	Retry      bool
	RetryAfter time.Duration
}
type Sender struct {
	Client  *http.Client
	Secrets *SecretBox
}

func NewSender(box *SecretBox) *Sender { return &Sender{Client: safeClient(), Secrets: box} }
func signature(secret, timestamp string, payload []byte) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(timestamp + "."))
	mac.Write(payload)
	return "v1=" + hex.EncodeToString(mac.Sum(nil))
}
func responseResult(response *http.Response) SendResult {
	status := response.StatusCode
	result := SendResult{Status: status}
	if status >= 200 && status < 300 {
		return result
	}
	result.Error = "Destination returned HTTP " + strconv.Itoa(status) + ". Check the connection credentials and field mapping."
	result.Retry = status == 408 || status == 425 || status == 429 || status >= 500
	if value := response.Header.Get("Retry-After"); value != "" {
		if seconds, err := strconv.Atoi(value); err == nil && seconds > 0 {
			result.RetryAfter = time.Duration(min(seconds, 86400)) * time.Second
		} else if date, err := http.ParseTime(value); err == nil {
			result.RetryAfter = min(max(time.Until(date), 0), 24*time.Hour)
		}
	}
	return result
}
func (s *Sender) request(ctx context.Context, method, endpoint, secret string, payload []byte) ([]byte, SendResult) {
	request, err := http.NewRequestWithContext(ctx, method, endpoint, bytes.NewReader(payload))
	if err != nil {
		return nil, SendResult{Error: "Invalid destination."}
	}
	request.Header.Set("Content-Type", "application/json")
	request.Header.Set("Authorization", "Bearer "+secret)
	response, err := s.Client.Do(request)
	if err != nil {
		return nil, SendResult{Error: "Unable to reach destination securely. Check the endpoint and connectivity.", Retry: true}
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	result := responseResult(response)
	if err != nil {
		result.Error = "Unable to read destination response."
		result.Retry = true
	}
	return body, result
}
func (s *Sender) Send(ctx context.Context, integration domain.LeadIntegration, job domain.LeadDelivery) SendResult {
	secret, err := s.Secrets.Open(integration.SecretCipher)
	if err != nil {
		return SendResult{Error: "Connection credentials cannot be decrypted. Check the server key."}
	}
	if integration.Kind == "hubspot" {
		return s.hubspot(ctx, integration, job, secret)
	}
	if integration.Kind != "webhook" {
		return SendResult{Error: "Unsupported integration provider."}
	}
	if err := validateEndpoint(integration.Endpoint); err != nil {
		return SendResult{Error: "Destination must be a public HTTPS endpoint."}
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, integration.Endpoint, bytes.NewReader(job.Payload))
	if err != nil {
		return SendResult{Error: "Invalid webhook endpoint."}
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "Rowley-Leads/1.0")
	req.Header.Set("X-Rowley-Delivery", job.ID.String())
	req.Header.Set("Idempotency-Key", job.ID.String())
	req.Header.Set("X-Rowley-Timestamp", timestamp)
	req.Header.Set("X-Rowley-Signature", signature(secret, timestamp, job.Payload))
	response, err := s.Client.Do(req)
	if err != nil {
		return SendResult{Error: "Unable to reach webhook securely. Check public DNS and connectivity.", Retry: true}
	}
	defer response.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(response.Body, 64<<10))
	return responseResult(response)
}
func mappedProperties(mapping map[string]interface{}, event Event) (map[string]string, error) {
	properties := map[string]string{}
	for _, answer := range event.Data.Answers {
		property, ok := mapping[answer.FieldID.String()].(string)
		if !ok || property == "" {
			continue
		}
		value := answer.Value
		if answer.Type == "checkbox" {
			var values []string
			if err := json.Unmarshal([]byte(value), &values); err != nil {
				return nil, err
			}
			value = strings.Join(values, ";")
		}
		properties[property] = value
	}
	email := strings.TrimSpace(properties["email"])
	address, err := mail.ParseAddress(email)
	if err != nil || address.Address != email {
		return nil, bad(400, "The submitted lead does not contain a valid mapped email address.")
	}
	properties["email"] = email
	return properties, nil
}
func (s *Sender) hubspot(ctx context.Context, integration domain.LeadIntegration, job domain.LeadDelivery, secret string) SendResult {
	const base = "https://api.hubapi.com/crm/v3"
	if job.IsTest {
		_, result := s.request(ctx, http.MethodGet, base+"/properties/contacts/email", secret, nil)
		return result
	}
	var event Event
	if err := json.Unmarshal(job.Payload, &event); err != nil {
		return SendResult{Error: "Invalid saved delivery payload."}
	}
	properties, err := mappedProperties(integration.Mapping, event)
	if err != nil {
		return SendResult{Error: "Lead is missing a valid mapped email address. Update the mapping and retry."}
	}
	payload, err := json.Marshal(map[string]interface{}{"properties": properties})
	if err != nil {
		return SendResult{Error: "Invalid CRM field mapping."}
	}
	lookup := base + "/objects/contacts/" + url.PathEscape(properties["email"]) + "?idProperty=email"
	// Read then PATCH preserves unrelated contact properties. A racing create (409) is looked up again.
	for attempt := 0; attempt < 2; attempt++ {
		body, result := s.request(ctx, http.MethodGet, lookup, secret, nil)
		if result.Status == 404 {
			_, created := s.request(ctx, http.MethodPost, base+"/objects/contacts", secret, payload)
			if created.Status == 409 {
				continue
			}
			return created
		}
		if result.Error != "" {
			return result
		}
		var contact struct {
			ID string `json:"id"`
		}
		if json.Unmarshal(body, &contact) != nil || contact.ID == "" {
			return SendResult{Error: "HubSpot returned an invalid contact response.", Retry: true}
		}
		_, updated := s.request(ctx, http.MethodPatch, base+"/objects/contacts/"+url.PathEscape(contact.ID), secret, payload)
		return updated
	}
	return SendResult{Error: "Contact changed concurrently. Delivery will retry.", Retry: true}
}
