package geoip

import (
	"net"
	"net/http"
	"os"
	"strings"

	"github.com/oschwald/geoip2-golang"
)

// Resolver determines a coarse country code for an incoming request. It never
// accepts country data from the analytics payload itself.
type Resolver struct {
	database              *geoip2.Reader
	trustForwardedHeaders bool
}

func New() (*Resolver, error) {
	resolver := &Resolver{
		trustForwardedHeaders: strings.EqualFold(os.Getenv("TRUST_PROXY_HEADERS"), "true"),
	}

	databasePath := os.Getenv("GEOIP_COUNTRY_DB_PATH")
	if databasePath == "" {
		return resolver, nil
	}

	database, err := geoip2.Open(databasePath)
	if err != nil {
		return nil, err
	}
	resolver.database = database
	return resolver, nil
}

func (r *Resolver) Country(request *http.Request) string {
	// Cloudflare sets this at the edge and it is safer than trusting arbitrary
	// X-Forwarded-For values. Only enable this when the API is behind Cloudflare.
	if country := normalizeCountry(request.Header.Get("CF-IPCountry")); r != nil && r.trustForwardedHeaders && country != "" {
		return country
	}

	if r == nil || r.database == nil {
		return ""
	}

	ip := request.RemoteAddr
	if r.trustForwardedHeaders {
		if forwardedIP := request.Header.Get("X-Forwarded-For"); forwardedIP != "" {
			ip = strings.TrimSpace(strings.Split(forwardedIP, ",")[0])
		} else if realIP := request.Header.Get("X-Real-IP"); realIP != "" {
			ip = strings.TrimSpace(realIP)
		}
	}
	host, _, err := net.SplitHostPort(ip)
	if err == nil {
		ip = host
	}
	parsedIP := net.ParseIP(strings.TrimSpace(ip))
	if parsedIP == nil {
		return ""
	}
	record, err := r.database.Country(parsedIP)
	if err != nil {
		return ""
	}
	return normalizeCountry(record.Country.IsoCode)
}

func (r *Resolver) Close() error {
	if r == nil || r.database == nil {
		return nil
	}
	return r.database.Close()
}

func normalizeCountry(value string) string {
	value = strings.ToUpper(strings.TrimSpace(value))
	if value == "T1" || value == "XX" || len(value) != 2 || value[0] < 'A' || value[0] > 'Z' || value[1] < 'A' || value[1] > 'Z' {
		return ""
	}
	return value
}
