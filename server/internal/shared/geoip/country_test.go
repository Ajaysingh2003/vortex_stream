package geoip

import (
	"net/http/httptest"
	"testing"
)

func TestCountryTrust(t *testing.T) {
	r := httptest.NewRequest("POST", "https://api.example.com", nil)
	r.Header.Set("CF-IPCountry", "IN")
	if (&Resolver{}).Country(r) != "" {
		t.Fatal("untrusted country accepted")
	}
	if (&Resolver{trustForwardedHeaders: true}).Country(r) != "IN" {
		t.Fatal("trusted country missing")
	}
	for _, v := range []string{"XX", "T1", "bad", "1A"} {
		if normalizeCountry(v) != "" {
			t.Fatal("invalid country accepted")
		}
	}
}
