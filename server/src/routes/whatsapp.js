import express from 'express';
import {
  initWhatsApp,
  getWhatsAppStatus,
  syncWhatsApp,
  resetWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppMessage
} from '../lib/whatsapp.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/whatsapp/status - get single-device connection status
router.get('/status', (req, res) => {
  try {
    const status = getWhatsAppStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/start - initiate single Baileys session / generate QR code
router.post('/start', requireAdmin, async (req, res) => {
  try {
    const forceNew = Boolean(req.body.forceNew);
    const status = await initWhatsApp(forceNew);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/sync - probe live Baileys socket & broadcast verified status
router.post('/sync', requireAdmin, async (req, res) => {
  try {
    const result = await syncWhatsApp();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/reset - hard reset session, wipe storage & generate fresh QR
router.post('/reset', requireAdmin, async (req, res) => {
  try {
    const result = await resetWhatsApp();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/disconnect - graceful logout & clean session teardown
router.post('/disconnect', requireAdmin, async (req, res) => {
  try {
    const result = await disconnectWhatsApp();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/send - send bill or order notification
router.post('/send', requireAdmin, async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ success: false, message: 'Phone and message are required.' });
    }

    const result = await sendWhatsAppMessage(phone, message);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
