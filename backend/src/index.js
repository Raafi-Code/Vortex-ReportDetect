import { connectWhatsApp } from './whatsapp.js';
import { handleIncomingMessage } from './messageHandler.js';
import { startServer } from './api/server.js';
import { startCleanupCron } from './cleanup.js';

console.log('');
console.log('╔══════════════════════════════════════════╗');
console.log('║   BNI WhatsApp Report Detect v1.0.0     ║');
console.log('║   Message Monitor & Auto-Forward        ║');
console.log('╚══════════════════════════════════════════╝');
console.log('');

async function main() {
  try {
    // 1. Start API Server
    startServer();

    // 2. Start media cleanup cron job
    startCleanupCron();

    // 3. Connect to WhatsApp
    console.log('📱 Initializing WhatsApp connection...');
    await connectWhatsApp(handleIncomingMessage);

  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Received SIGTERM. Shutting down...');
  process.exit(0);
});

main();
