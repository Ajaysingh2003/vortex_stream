package service

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"net/netip"
	"strings"
	"testing"
	"time"

	"github.com/ajaysingh2003/vortex-stream/internal/api/domain"
	"github.com/google/uuid"
	"gorm.io/datatypes"
)

func testBox(t *testing.T) *SecretBox {
	t.Helper()
	box, err := secretBox(base64.StdEncoding.EncodeToString(make([]byte, 32)))
	if err != nil {
		t.Fatal(err)
	}
	return box
}
func TestCredentialsAuthenticatedEncryption(t *testing.T) {
	box := testBox(t)
	a, err := box.Seal("test-secret-never-returned")
	if err != nil {
		t.Fatal(err)
	}
	b, _ := box.Seal("test-secret-never-returned")
	if a == b || strings.Contains(a, "test-secret") {
		t.Fatal("nonrandom or plaintext encryption")
	}
	plain, err := box.Open(a)
	if err != nil || plain != "test-secret-never-returned" {
		t.Fatal("roundtrip failed")
	}
	raw, _ := base64.StdEncoding.DecodeString(a)
	raw[len(raw)-1] ^= 1
	if _, err = box.Open(base64.StdEncoding.EncodeToString(raw)); err == nil {
		t.Fatal("tampered credential accepted")
	}
}
func TestPublicDestinationsOnly(t *testing.T) {
	for _, url := range []string{"http://example.com", "https://localhost/x", "https://127.0.0.1", "https://169.254.169.254/", "https://10.0.0.1", "https://user:pass@example.com", "https://example.com:8443", "https://example.com/#x"} {
		if validateEndpoint(url) == nil {
			t.Errorf("accepted %s", url)
		}
	}
	if validateEndpoint("https://crm.example.com/leads") != nil {
		t.Fatal("public endpoint rejected")
	}
	for _, ip := range []string{"::1", "::ffff:127.0.0.1", "100.64.0.1", "192.168.1.1", "2001:db8::1", "fc00::1", "198.18.0.1"} {
		if publicIP(netip.MustParseAddr(ip)) {
			t.Errorf("allowed private/reserved %s", ip)
		}
	}
	if !publicIP(netip.MustParseAddr("8.8.8.8")) {
		t.Fatal("public IP rejected")
	}
}
func TestRetryAndCSV(t *testing.T) {
	for _, code := range []int{200, 204, 400, 401, 408, 425, 429, 500, 503} {
		r := responseResult(&http.Response{StatusCode: code, Header: http.Header{"Retry-After": []string{"120"}}})
		want := code == 408 || code == 425 || code == 429 || code >= 500
		if r.Retry != want {
			t.Errorf("HTTP %d retry=%v", code, r.Retry)
		}
		if want && r.RetryAfter != 120*time.Second {
			t.Fatal("retry-after not honored")
		}
	}
	for _, value := range []string{"=SUM(A1)", " +cmd", "\t@formula", "-2"} {
		if SafeCSV(value) != "'"+value {
			t.Errorf("unsafe CSV %q", value)
		}
	}
	if SafeCSV("alice@example.com") != "alice@example.com" {
		t.Fatal("ordinary value changed")
	}
}

type roundTrip func(*http.Request) (*http.Response, error)

func (f roundTrip) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func TestWebhookSignatureAndStableEvent(t *testing.T) {
	box := testBox(t)
	secret := "synthetic-signing-secret"
	encrypted, _ := box.Seal(secret)
	integration := domain.LeadIntegration{ID: uuid.New(), VideoID: uuid.New(), Kind: "webhook", Endpoint: "https://crm.example.com/leads", SecretCipher: encrypted, Version: 1}
	job, err := makeDelivery(integration, &domain.LeadFormSubmission{ID: uuid.New(), FormVersion: 2}, false)
	if err != nil {
		t.Fatal(err)
	}
	sender := &Sender{Secrets: box, Client: &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		body, _ := io.ReadAll(r.Body)
		if r.Header.Get("X-Rowley-Signature") != signature(secret, r.Header.Get("X-Rowley-Timestamp"), body) {
			t.Fatal("signature mismatch")
		}
		if r.Header.Get("Idempotency-Key") != job.ID.String() {
			t.Fatal("unstable event ID")
		}
		return &http.Response{StatusCode: 204, Body: io.NopCloser(strings.NewReader("")), Header: http.Header{}}, nil
	})}}
	if result := sender.Send(context.Background(), integration, job); result.Error != "" {
		t.Fatal(result)
	}
}
func TestHubSpotUpdatesOnlyMappedProperties(t *testing.T) {
	box := testBox(t)
	encrypted, _ := box.Seal("synthetic-private-token")
	emailID, nameID := uuid.New(), uuid.New()
	integration := domain.LeadIntegration{Kind: "hubspot", SecretCipher: encrypted, Mapping: datatypes.JSONMap{emailID.String(): "email", nameID.String(): "firstname"}}
	job, _ := makeDelivery(integration, &domain.LeadFormSubmission{ID: uuid.New(), Answers: []domain.LeadFormAnswer{{FieldID: emailID, Value: "qa@example.com", Type: "text"}, {FieldID: uuid.New(), Value: "private-unmapped-answer", Type: "text"}}}, false)
	calls := 0
	sender := &Sender{Secrets: box, Client: &http.Client{Transport: roundTrip(func(r *http.Request) (*http.Response, error) {
		calls++
		body := ""
		if calls == 1 {
			if r.Method != "GET" {
				t.Fatal("expected lookup")
			}
			body = `{"id":"123"}`
		} else {
			if r.Method != "PATCH" || !strings.HasSuffix(r.URL.Path, "/123") {
				t.Fatal("expected contact patch")
			}
			var payload struct {
				Properties map[string]string `json:"properties"`
			}
			if json.NewDecoder(r.Body).Decode(&payload) != nil || len(payload.Properties) != 1 || payload.Properties["email"] != "qa@example.com" {
				t.Fatal("missing fields must not clear existing properties")
			}
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}}, nil
	})}}
	if result := sender.Send(context.Background(), integration, job); result.Error != "" || calls != 2 {
		t.Fatal(result, calls)
	}
}
