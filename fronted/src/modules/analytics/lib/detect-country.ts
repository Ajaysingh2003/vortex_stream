/**
 * Detect client ISO 3166-1 alpha-2 country code using browser environment.
 * Evaluates IANA timezone mapping first, then falls back to Intl.Locale and navigator language.
 */

const TIMEZONE_TO_COUNTRY: Record<string, string> = {
  // South Asia
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  "Asia/Colombo": "LK",
  "Asia/Kathmandu": "NP",
  "Asia/Dhaka": "BD",
  "Asia/Karachi": "PK",

  // East & Southeast Asia
  "Asia/Tokyo": "JP",
  "Asia/Seoul": "KR",
  "Asia/Shanghai": "CN",
  "Asia/Chongqing": "CN",
  "Asia/Urumqi": "CN",
  "Asia/Hong_Kong": "HK",
  "Asia/Taipei": "TW",
  "Asia/Singapore": "SG",
  "Asia/Bangkok": "TH",
  "Asia/Jakarta": "ID",
  "Asia/Kuala_Lumpur": "MY",
  "Asia/Manila": "PH",
  "Asia/Ho_Chi_Minh": "VN",
  "Asia/Phnom_Penh": "KH",
  "Asia/Yangon": "MM",

  // Middle East & Central Asia
  "Asia/Dubai": "AE",
  "Asia/Riyadh": "SA",
  "Asia/Jerusalem": "IL",
  "Asia/Tel_Aviv": "IL",
  "Asia/Qatar": "QA",
  "Asia/Kuwait": "KW",
  "Asia/Bahrain": "BH",
  "Asia/Muscat": "OM",
  "Asia/Beirut": "LB",
  "Asia/Amman": "JO",
  "Asia/Baghdad": "IQ",
  "Asia/Tehran": "IR",
  "Asia/Tashkent": "UZ",
  "Asia/Almaty": "KZ",

  // Europe
  "Europe/London": "GB",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Rome": "IT",
  "Europe/Madrid": "ES",
  "Europe/Amsterdam": "NL",
  "Europe/Brussels": "BE",
  "Europe/Vienna": "AT",
  "Europe/Zurich": "CH",
  "Europe/Stockholm": "SE",
  "Europe/Oslo": "NO",
  "Europe/Helsinki": "FI",
  "Europe/Copenhagen": "DK",
  "Europe/Dublin": "IE",
  "Europe/Warsaw": "PL",
  "Europe/Prague": "CZ",
  "Europe/Budapest": "HU",
  "Europe/Bucharest": "RO",
  "Europe/Athens": "GR",
  "Europe/Lisbon": "PT",
  "Europe/Istanbul": "TR",
  "Europe/Moscow": "RU",
  "Europe/Kyiv": "UA",
  "Europe/Kiev": "UA",
  "Europe/Belgrade": "RS",
  "Europe/Sofia": "BG",
  "Europe/Zagreb": "HR",
  "Europe/Bratislava": "SK",

  // North America
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Los_Angeles": "US",
  "America/Phoenix": "US",
  "America/Detroit": "US",
  "America/Anchorage": "US",
  "America/Honolulu": "US",
  "America/Boise": "US",
  "America/Indianapolis": "US",
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Montreal": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Mexico_City": "MX",
  "America/Cancun": "MX",
  "America/Monterrey": "MX",
  "America/Tijuana": "MX",

  // South & Central America
  "America/Sao_Paulo": "BR",
  "America/Rio_Branco": "BR",
  "America/Manaus": "BR",
  "America/Belem": "BR",
  "America/Fortaleza": "BR",
  "America/Recife": "BR",
  "America/Cuiaba": "BR",
  "America/Buenos_Aires": "AR",
  "America/Cordoba": "AR",
  "America/Bogota": "CO",
  "America/Santiago": "CL",
  "America/Lima": "PE",
  "America/Caracas": "VE",
  "America/Montevideo": "UY",
  "America/Panama": "PA",
  "America/Costa_Rica": "CR",

  // Oceania
  "Australia/Sydney": "AU",
  "Australia/Melbourne": "AU",
  "Australia/Brisbane": "AU",
  "Australia/Perth": "AU",
  "Australia/Adelaide": "AU",
  "Australia/Darwin": "AU",
  "Australia/Hobart": "AU",
  "Pacific/Auckland": "NZ",
  "Pacific/Fiji": "FJ",

  // Africa
  "Africa/Johannesburg": "ZA",
  "Africa/Cairo": "EG",
  "Africa/Lagos": "NG",
  "Africa/Nairobi": "KE",
  "Africa/Casablanca": "MA",
  "Africa/Accra": "GH",
  "Africa/Addis_Ababa": "ET",
  "Africa/Algiers": "DZ",
  "Africa/Tunis": "TN",
};

const CACHE_KEY = "rowley.analytics.geo_country";
const CACHE_TIME_KEY = "rowley.analytics.geo_country_ts";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function isValidCountryCode(code: unknown): code is string {
  return typeof code === "string" && /^[A-Z]{2}$/.test(code.trim().toUpperCase());
}

/**
 * Fallback heuristic based on system timezone and locale.
 * Used when network-based GeoIP lookup is unavailable or fails.
 */
export function detectFallbackCountry(): string {
  if (typeof window === "undefined") return "";

  try {
    // 1. Check IANA timezone
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_TO_COUNTRY[tz]) {
      return TIMEZONE_TO_COUNTRY[tz];
    }
  } catch {
    // ignore
  }

  try {
    // 2. Check Intl.Locale
    if (typeof Intl !== "undefined" && typeof Intl.Locale === "function") {
      const locale = new Intl.Locale(navigator.language);
      if (locale.region && locale.region.length === 2) {
        return locale.region.toUpperCase();
      }
    }
  } catch {
    // ignore
  }

  try {
    // 3. Check navigator.language format e.g. "en-IN" -> "IN"
    const lang = navigator.language || (navigator.languages && navigator.languages[0]);
    if (lang && lang.includes("-")) {
      const parts = lang.split("-");
      const region = parts[parts.length - 1].toUpperCase();
      if (isValidCountryCode(region)) {
        return region;
      }
    }
  } catch {
    // ignore
  }

  return "";
}

/**
 * Synchronous getter returning cached network country or timezone fallback.
 */
export function getCachedClientCountry(): string {
  if (typeof window === "undefined") return "";

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (isValidCountryCode(cached)) {
      return cached.toUpperCase();
    }
  } catch {
    // ignore storage access errors
  }

  return detectFallbackCountry();
}

/**
 * Asynchronously resolves the viewer's network/VPN country using public GeoIP services.
 * Automatically caches the result in sessionStorage.
 */
export async function resolveClientCountry(forceRefresh = false): Promise<string> {
  if (typeof window === "undefined") return "";

  // 1. Check valid cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      const cachedTs = Number(sessionStorage.getItem(CACHE_TIME_KEY)) || 0;
      if (isValidCountryCode(cached) && Date.now() - cachedTs < CACHE_TTL_MS) {
        return cached.toUpperCase();
      }
    } catch {
      // ignore
    }
  }

  // 2. Query primary lightweight GeoIP endpoint (api.country.is)
  try {
    const res = await fetch("https://api.country.is", {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      const code = data?.country?.trim()?.toUpperCase();
      if (isValidCountryCode(code)) {
        try {
          sessionStorage.setItem(CACHE_KEY, code);
          sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch {
          // ignore
        }
        return code;
      }
    }
  } catch {
    // try fallback
  }

  // 3. Secondary fallback GeoIP endpoint (ipwho.is)
  try {
    const res = await fetch("https://ipwho.is/", {
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });
    if (res.ok) {
      const data = await res.json();
      const code = (data?.country_code || data?.country)?.trim()?.toUpperCase();
      if (isValidCountryCode(code)) {
        try {
          sessionStorage.setItem(CACHE_KEY, code);
          sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        } catch {
          // ignore
        }
        return code;
      }
    }
  } catch {
    // try fallback
  }

  // 4. Fallback to timezone/locale heuristic
  const fallback = detectFallbackCountry();
  if (fallback) {
    try {
      sessionStorage.setItem(CACHE_KEY, fallback);
      sessionStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch {
      // ignore
    }
  }
  return fallback;
}

export function detectClientCountry(): string {
  return getCachedClientCountry();
}

