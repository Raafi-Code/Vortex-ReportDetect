import 'dotenv/config';

const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    anonKey: process.env.SUPABASE_ANON_KEY,
  },
  api: {
    port: parseInt(process.env.API_PORT || '3001', 10),
    key: process.env.API_KEY,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  whatsapp: {
    sessionName: process.env.SESSION_NAME || 'bni-wa-session',
  },
  storage: {
    bucket: 'whatsapp-media',
    mediaRetentionDays: 30,
  },
};

// Validate required env vars
const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export default config;
