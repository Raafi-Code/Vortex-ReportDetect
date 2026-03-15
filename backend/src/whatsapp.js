import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import path from 'path';
import fs from 'fs';
import qrcodeTerminal from 'qrcode-terminal';
import config from './config.js';

const logger = pino({ level: 'silent' });

let sock = null;
let qrCode = null;
let connectionStatus = 'disconnected'; // disconnected | connecting | open

/**
 * Get current WhatsApp socket instance
 */
export function getSocket() {
  return sock;
}

/**
 * Get current QR code data (base64 string for frontend display)
 */
export function getQRCode() {
  return qrCode;
}

/**
 * Get current connection status
 */
export function getConnectionStatus() {
  return connectionStatus;
}

/**
 * Initialize WhatsApp connection with Baileys
 * @param {Function} onMessage - callback for incoming messages
 */
export async function connectWhatsApp(onMessage) {
  const sessionDir = path.resolve(`./sessions/${config.whatsapp.sessionName}`);

  // Ensure session directory exists
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ['BNI-ReportDetect', 'Chrome', '120.0.0'],
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  // Connection update events
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = 'connecting';
      console.log('📱 QR Code generated. Scan with WhatsApp to connect.');
      qrcodeTerminal.generate(qr, { small: true }, (qrImage) => {
        console.log(qrImage);
      });
    }

    if (connection === 'close') {
      connectionStatus = 'disconnected';
      qrCode = null;

      const error = lastDisconnect?.error;
      const statusCode = error instanceof Boom ? error.output?.statusCode : null;

      if (statusCode === DisconnectReason.loggedOut) {
        console.log('🚫 Logged out. Clearing session and restarting...');
        // Clear session data
        if (fs.existsSync(sessionDir)) {
          fs.rmSync(sessionDir, { recursive: true, force: true });
        }
        // Reconnect after clearing session
        setTimeout(() => connectWhatsApp(onMessage), 3000);
      } else {
        console.log(`⚠️ Connection closed (code: ${statusCode}). Reconnecting in 5s...`);
        setTimeout(() => connectWhatsApp(onMessage), 5000);
      }
    }

    if (connection === 'open') {
      connectionStatus = 'open';
      qrCode = null;
      console.log('✅ WhatsApp connected successfully!');
    }
  });

  // Save credentials on update
  sock.ev.on('creds.update', saveCreds);

  // Listen for incoming messages
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    for (const msg of messages) {
      // Skip status updates and own messages
      if (msg.key.remoteJid === 'status@broadcast') continue;
      if (msg.key.fromMe) continue;

      // Only process group messages
      if (!msg.key.remoteJid?.endsWith('@g.us')) continue;

      try {
        await onMessage(sock, msg);
      } catch (err) {
        console.error('❌ Error processing message:', err.message);
      }
    }
  });

  return sock;
}

/**
 * Get all groups the bot is part of
 */
export async function getAllGroups() {
  if (!sock || connectionStatus !== 'open') {
    return [];
  }

  try {
    const groups = await sock.groupFetchAllParticipating();
    return Object.values(groups).map((group) => ({
      jid: group.id,
      name: group.subject,
      participants: group.participants?.length || 0,
      creation: group.creation,
      desc: group.desc || '',
    }));
  } catch (err) {
    console.error('❌ Error fetching groups:', err.message);
    return [];
  }
}

/**
 * Disconnect WhatsApp
 */
export async function disconnectWhatsApp() {
  if (sock) {
    await sock.logout();
    sock = null;
    connectionStatus = 'disconnected';
    qrCode = null;
  }
}
