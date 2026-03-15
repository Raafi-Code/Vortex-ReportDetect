import { Router } from 'express';
import { getConnectionStatus, getQRCode, disconnectWhatsApp } from '../../whatsapp.js';
import { cleanupOldMedia } from '../../cleanup.js';
import QRCode from 'qrcode';

const router = Router();

/**
 * GET /api/status
 * Get WhatsApp connection status
 */
router.get('/', async (req, res) => {
  const status = getConnectionStatus();
  const qrRaw = getQRCode();

  let qrDataUrl = null;
  if (qrRaw) {
    try {
      qrDataUrl = await QRCode.toDataURL(qrRaw, { width: 300 });
    } catch (err) {
      console.error('QR generation error:', err.message);
    }
  }

  res.json({
    success: true,
    data: {
      status,
      qrCode: qrDataUrl,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * POST /api/status/disconnect
 * Disconnect WhatsApp
 */
router.post('/disconnect', async (req, res) => {
  try {
    await disconnectWhatsApp();
    res.json({ success: true, message: 'WhatsApp disconnected' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/status/cleanup
 * Manually trigger media cleanup
 */
router.post('/cleanup', async (req, res) => {
  try {
    await cleanupOldMedia();
    res.json({ success: true, message: 'Cleanup completed' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
