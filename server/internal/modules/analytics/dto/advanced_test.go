package dto

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestValidateCapabilities(t *testing.T) {
	vID := uuid.New()
	isPreview := true

	tests := []struct {
		name      string
		endpoint  string
		filters   FilterParams
		expectErr bool
	}{
		{
			name:     "valid summary filters",
			endpoint: "summary",
			filters: FilterParams{
				Country:   "US",
				Referrer:  "google.com",
				Device:    "desktop",
				Browser:   "Chrome",
				OS:        "macOS",
				UTMSource: "google",
				VideoID:   &vID,
				IsPreview: &isPreview,
			},
			expectErr: false,
		},
		{
			name:      "summary with invalid cta_id",
			endpoint:  "summary",
			filters:   FilterParams{CTAID: "cta-123"},
			expectErr: true,
		},
		{
			name:     "valid ctas filters",
			endpoint: "ctas",
			filters: FilterParams{
				CTAID:       "cta-123",
				VideoID:     &vID,
				Country:     "US",
				Device:      "mobile",
				UTMCampaign: "summer2026",
			},
			expectErr: false,
		},
		{
			name:      "ctas with invalid browser",
			endpoint:  "ctas",
			filters:   FilterParams{Browser: "Chrome"},
			expectErr: true,
		},
		{
			name:     "valid chapters filters",
			endpoint: "chapters",
			filters: FilterParams{
				ChapterID: "ch-intro",
				VideoID:   &vID,
			},
			expectErr: false,
		},
		{
			name:      "chapters with invalid country",
			endpoint:  "chapters",
			filters:   FilterParams{Country: "US"},
			expectErr: true,
		},
		{
			name:     "valid captions filters",
			endpoint: "captions",
			filters: FilterParams{
				SubtitleTrackID: "en-subs",
				VideoID:         &vID,
			},
			expectErr: false,
		},
		{
			name:      "captions with invalid referrer",
			endpoint:  "captions",
			filters:   FilterParams{Referrer: "youtube.com"},
			expectErr: true,
		},
		{
			name:     "valid heatmap filters",
			endpoint: "heatmap",
			filters: FilterParams{
				MediaRevisionID: "rev-2",
				VideoID:         &vID,
			},
			expectErr: false,
		},
		{
			name:      "heatmap with invalid device",
			endpoint:  "heatmap",
			filters:   FilterParams{Device: "mobile"},
			expectErr: true,
		},
		{
			name:     "valid funnels filters",
			endpoint: "funnels",
			filters: FilterParams{
				VideoID:     &vID,
				Country:     "GB",
				Device:      "desktop",
				UTMCampaign: "launch",
			},
			expectErr: false,
		},
		{
			name:      "funnels with invalid cta_id",
			endpoint:  "funnels",
			filters:   FilterParams{CTAID: "cta-bad"},
			expectErr: true,
		},
		{
			name:     "valid session-metrics filters",
			endpoint: "session-metrics",
			filters: FilterParams{
				VideoID: &vID,
				Country: "US",
				Device:  "tablet",
				Browser: "Safari",
				OS:      "iOS",
			},
			expectErr: false,
		},
		{
			name:      "session-metrics with invalid utm_source",
			endpoint:  "session-metrics",
			filters:   FilterParams{UTMSource: "newsletter"},
			expectErr: true,
		},
		{
			name:     "valid quality filters",
			endpoint: "quality",
			filters: FilterParams{
				VideoID: &vID,
				Country: "CA",
				Device:  "desktop",
				Browser: "Firefox",
				OS:      "Windows",
			},
			expectErr: false,
		},
		{
			name:      "quality with invalid surface",
			endpoint:  "quality",
			filters:   FilterParams{Surface: "embed"},
			expectErr: true,
		},
		{
			name:      "unknown endpoint defaults to pass",
			endpoint:  "nonexistent-endpoint",
			filters:   FilterParams{Country: "US", Device: "mobile"},
			expectErr: false,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateCapabilities(tc.endpoint, tc.filters)
			if (err != nil) != tc.expectErr {
				t.Fatalf("endpoint %s: expected err=%v, got %v", tc.endpoint, tc.expectErr, err)
			}
		})
	}
}

func TestCursorEncodingDecoding(t *testing.T) {
	now := time.Now().Truncate(time.Second).UTC()
	cursor := EncodeCursor(25, now, "views", "desc")
	if cursor == "" {
		t.Fatal("encoded cursor should not be empty")
	}

	payload, err := DecodeCursor(cursor)
	if err != nil {
		t.Fatalf("failed to decode valid cursor: %v", err)
	}
	if payload == nil {
		t.Fatal("expected decoded payload, got nil")
	}
	if payload.Offset != 25 {
		t.Errorf("expected offset 25, got %d", payload.Offset)
	}
	if payload.AsOf != now.Unix() {
		t.Errorf("expected asOf %d, got %d", now.Unix(), payload.AsOf)
	}
	if payload.Sort != "views" || payload.Order != "desc" {
		t.Errorf("unexpected sort/order: %s %s", payload.Sort, payload.Order)
	}

	// Empty cursor
	emptyPayload, err := DecodeCursor("")
	if err != nil || emptyPayload != nil {
		t.Fatalf("empty cursor should return nil, nil; got %v, %v", emptyPayload, err)
	}

	// Invalid base64
	_, err = DecodeCursor("!!!not-base-64!!!")
	if err == nil {
		t.Fatal("expected error for invalid base64")
	}

	// Invalid JSON
	invalidJSONCursor := "aGVsbG8=" // "hello" in base64
	_, err = DecodeCursor(invalidJSONCursor)
	if err == nil {
		t.Fatal("expected error for invalid JSON payload")
	}

	// Negative offset
	negativeJSONCursor := "eyJvIjotNX0" // {"o":-5} in base64
	_, err = DecodeCursor(negativeJSONCursor)
	if err == nil {
		t.Fatal("expected error for negative offset")
	}
}

func TestEscapeCSVCell(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"", ""},
		{"=SUM(A1:B1)", "'=SUM(A1:B1)"},
		{"+12345", "'+12345"},
		{"-500", "'-500"},
		{"@dangerous_formula", "'@dangerous_formula"},
		{"\ttab_prefixed", "'\ttab_prefixed"},
		{"\rcarriage_prefixed", "'\rcarriage_prefixed"},
		{"Normal Text", "Normal Text"},
		{"user@example.com", "user@example.com"},
		{"12345", "12345"},
	}

	for _, c := range cases {
		got := EscapeCSVCell(c.input)
		if got != c.expected {
			t.Errorf("EscapeCSVCell(%q) = %q; expected %q", c.input, got, c.expected)
		}
	}
}

func TestSafeOrigin(t *testing.T) {
	cases := []struct {
		input    string
		expected string
	}{
		{"https://vortex.stream/video/abc?query=1#frag", "https://vortex.stream"},
		{"http://localhost:3000/embed", "http://localhost:3000"},
		{"ftp://files.example.com", ""},
		{"javascript:alert(1)", ""},
		{"data:text/html,abc", ""},
		{"invalid-url", ""},
		{"", ""},
	}

	for _, c := range cases {
		got := SafeOrigin(c.input)
		if got != c.expected {
			t.Errorf("SafeOrigin(%q) = %q; expected %q", c.input, got, c.expected)
		}
	}
}
