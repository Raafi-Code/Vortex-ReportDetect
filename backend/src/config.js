import "dotenv/config";

const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  api: {
    port: parseInt(process.env.API_PORT || "3001", 10),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    trustProxy: process.env.TRUST_PROXY === "true",
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
