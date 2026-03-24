import "dotenv/config";

function parseTrustProxy(value) {
  if (value == null) return false;

  const normalized = String(value).trim().toLowerCase();
  if (!normalized || normalized === "false") return false;

  // Keep backward compatibility if previously set to "true"
  // (not recommended for production behind untrusted networks)
  if (normalized === "true") return true;

  // Recommended for reverse-proxy deployments: numeric hop count (e.g. "1")
  if (/^\d+$/.test(normalized)) {
    return Number.parseInt(normalized, 10);
  }

  // Allow common trusted proxy presets
  const allowedPresets = new Set(["loopback", "linklocal", "uniquelocal"]);
  const parts = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 0 && parts.every((part) => allowedPresets.has(part))) {
    return parts.join(", ");
  }

  // Fail-safe: disable trust proxy for invalid values
  return false;
}

const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  api: {
    port: parseInt(process.env.API_PORT || "3001", 10),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  },
  auth: {
    allowedEmail: (process.env.ALLOWED_LOGIN_EMAIL || "vortex.admin@gmail.com")
      .trim()
      .toLowerCase(),
  },
  whatsapp: {
    sessionName: process.env.SESSION_NAME || "wa-session",
  },
  storage: {
    bucket: process.env.STORAGE_BUCKET || "whatsapp-media",
    mediaRetentionDays: parseInt(process.env.MEDIA_RETENTION_DAYS || "30", 10),
    signedUrlExpiresIn: parseInt(
      process.env.MEDIA_SIGNED_URL_EXPIRES_IN || "900",
      10,
    ),
  },
  security: {
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
      maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "300", 10),
      authMaxRequests: parseInt(
        process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || "60",
        10,
      ),
    },
  },
};

// Validate required env vars
const required = ["SUPABASE_URL", "SUPABASE_SERVICE_KEY", "SUPABASE_ANON_KEY"];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export default config;
