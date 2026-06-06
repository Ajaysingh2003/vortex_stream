package config

import "os"

const (
	TierFree     = "free"
	TierStarter  = "starter"
	TierPro      = "pro"
	TierBusiness = "business"
)

type PlanLimits struct {
	Name                string
	MaxStorageBytes     int64
	MaxBandwidthBytes   int64
	MaxPlaybackMinutes  int
	MaxWorkspaces       int
	AllowCustomBranding bool
	AllowSubtitles      bool
	Analytics           bool
	HLSQualities        []string
	MaxChannel          int
	VideoChapter        bool
	LeadCapture         bool
}

type PriceDetails struct {
	PriceID string `json:"price_id"`
	Amount  int    `json:"amount"`
}

type Plan struct {
	Name        string
	Description string
	// 🟩 Maps intervals ("monthly", "quarterly", "annually") straight to their pricing tokens
	BillingCycles map[string]PriceDetails
	Limits        PlanLimits
}

var Plans = map[string]Plan{
	TierFree: {
		Name:        "Free",
		Description: "Test our video infrastructure with 1,000 free minutes.",
		BillingCycles: map[string]PriceDetails{
			"monthly":   {PriceID: "free_tier_forever", Amount: 0},
			"quarterly": {PriceID: "free_tier_forever", Amount: 0},
			"annually":  {PriceID: "free_tier_forever", Amount: 0},
		},
		Limits: PlanLimits{
			Name:                "Free Sandbox",
			MaxStorageBytes:     5 * 1024 * 1024 * 1024, // 5 GB
			MaxPlaybackMinutes:  1000,
			MaxBandwidthBytes:   50 * 1024 * 1024 * 1024, // 50 GB
			MaxWorkspaces:       1,
			Analytics:           false,
			HLSQualities:        []string{"360p", "720p"},
			AllowSubtitles:      false,
			AllowCustomBranding: false,
			MaxChannel:          1,
			VideoChapter:        false,
			LeadCapture:         false,
		},
	},
	TierStarter: {
		Name:        "Starter",
		Description: "Unlock advanced analytics and stream 10,000 monthly minutes",
		BillingCycles: map[string]PriceDetails{
			"monthly":   {PriceID: os.Getenv("STRIPE_STARTER_MONTHLY_ID"), Amount: 19},
			"quarterly": {PriceID: os.Getenv("STRIPE_STARTER_QUARTERLY_ID"), Amount: 105},
			"annually":  {PriceID: os.Getenv("STRIPE_STARTER_ANNUAL_ID"), Amount: 200},
		},
		Limits: PlanLimits{
			Name:                "Starter Growth",
			MaxStorageBytes:     5 * 1024 * 1024 * 1024,
			MaxPlaybackMinutes:  10000,
			MaxBandwidthBytes:   1000 * 1024 * 1024 * 1024,
			MaxWorkspaces:       3,
			Analytics:           true,
			HLSQualities:        []string{"360p", "480p", "720p"},
			AllowSubtitles:      true,
			AllowCustomBranding: false,
			MaxChannel:          3,
			VideoChapter:        true,
			LeadCapture:         true,
		},
	}, // 🟩 FIXED: Removed the extra structural closing braces that broke your code here
	TierPro: {
		Name:        "Pro",
		Description: "Unlocks custom branding and 22,000 monthly playback minutes.",
		BillingCycles: map[string]PriceDetails{
			"monthly":   {PriceID: os.Getenv("STRIPE_PRO_MONTHLY_ID"), Amount: 39},
			"quarterly": {PriceID: os.Getenv("STRIPE_PRO_QUARTERLY_ID"), Amount: 209},
			"annually":  {PriceID: os.Getenv("STRIPE_PRO_ANNUAL_ID"), Amount: 419},
		},
		Limits: PlanLimits{
			Name:                "Professional Pro",
			MaxStorageBytes:     600 * 1024 * 1024 * 1024,
			MaxPlaybackMinutes:  22000,
			MaxBandwidthBytes:   1000 * 1024 * 1024 * 1024,
			MaxWorkspaces:       10,
			Analytics:           true,
			HLSQualities:        []string{"360p", "480p", "720p", "1080p"},
			AllowSubtitles:      true,
			AllowCustomBranding: true,
			MaxChannel:          10,
			VideoChapter:        true,
			LeadCapture:         true,
		},
	},
	TierBusiness: {
		Name:        "Business",
		Description: "Enterprise-scale infrastructure with 50,000 monthly playback minutes.",
		BillingCycles: map[string]PriceDetails{
			"monthly":   {PriceID: os.Getenv("STRIPE_BUSINESS_MONTHLY_ID"), Amount: 99},
			"quarterly": {PriceID: os.Getenv("STRIPE_BUSINESS_QUARTERLY_ID"), Amount: 534},
			"annually":  {PriceID: os.Getenv("STRIPE_BUSINESS_ANNUAL_ID"), Amount: 950},
		},
		Limits: PlanLimits{
			Name:                "Enterprise Scale",
			MaxStorageBytes:     2 * 1024 * 1024 * 1024 * 1024, // 2 TB
			MaxPlaybackMinutes:  50000,
			MaxBandwidthBytes:   3000 * 1024 * 1024 * 1024, // 3 TB
			MaxWorkspaces:       50,
			Analytics:           true,
			HLSQualities:        []string{"360p", "480p", "720p", "1080p"},
			AllowSubtitles:      true,
			AllowCustomBranding: true,
			MaxChannel:          30,
			VideoChapter:        true,
			LeadCapture:         true,
		},
	},
}

func GetPlan(key string) Plan {
	if plan, ok := Plans[key]; ok {
		return plan
	}
	return Plans[TierFree]
}

func GetPlanFromPriceID(priceID string) string {
	if priceID == "" {
		return TierFree
	}

	// Scan through all tier containers
	for tierKey, plan := range Plans {
		for _, cycleDetails := range plan.BillingCycles {
			if cycleDetails.PriceID == priceID {
				return tierKey
			}
		}
	}

	return TierFree
}
