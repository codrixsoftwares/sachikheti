import express from 'express';
import {
  initWhatsApp,
  getWhatsAppStatus,
  disconnectWhatsApp,
  sendWhatsAppMessage
} from '../lib/whatsapp.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
  try {
    const status = getWhatsAppStatus();
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/start - initiate Baileys QR generation
router.post('/start', requireAdmin, async (req, res) => {
  try {
    const forceNew = Boolean(req.body.forceNew);
    const status = await initWhatsApp(forceNew);
    res.json({ success: true, ...status });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/disconnect - logout / reset session
router.post('/disconnect', requireAdmin, async (req, res) => {
  try {
    const result = await disconnectWhatsApp(true);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/send - send message to customer (e.g. bill or receipt)
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
