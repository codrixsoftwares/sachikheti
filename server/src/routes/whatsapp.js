import express from 'express';
import {
  initWhatsApp,
  getWhatsAppStatus,
  syncWhatsApp,
  resetWhatsApp,
  disconnectWhatsApp,
  sendWhatsAppMessage,
  sendWhatsAppDocument
} from '../lib/whatsapp.js';
import { generateInvoicePDF } from '../lib/pdfGenerator.js';
import { getStoreBillDesign } from './settings.js';
import prisma from '../prisma.js';
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

// POST /api/whatsapp/send-bill-pdf - Generate PDF Invoice/Rental Agreement & send via Baileys document attachment
router.post('/send-bill-pdf', requireAdmin, async (req, res) => {
  try {
    const { phone, orderId, billData: clientBillData, billDesignOverride } = req.body;

    let targetBillData = clientBillData;

    // If orderId is provided, fetch order record from DB
    if (!targetBillData && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order record not found' });
      }
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
      } catch (e) {
        items = [];
      }
      targetBillData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        address: order.address,
        city: order.city,
        pincode: order.pincode,
        items,
        totalAmount: order.totalAmount,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        notes: order.notes,
        date: order.createdAt,
      };
    }

    if (!targetBillData) {
      return res.status(400).json({ success: false, message: 'Valid bill or order details are required' });
    }

    const recipientPhone = phone || targetBillData.customerPhone;
    if (!recipientPhone) {
      return res.status(400).json({ success: false, message: 'Customer phone number is required to send bill' });
    }

    // Merge global store bill design with any runtime overrides
    const storeDesign = getStoreBillDesign();
    const effectiveDesign = { ...storeDesign, ...(billDesignOverride || {}) };

    // Generate high-resolution official PDF
    const pdfBuffer = await generateInvoicePDF(targetBillData, effectiveDesign);

    const safeOrderNum = (targetBillData.orderNumber || 'BILL').replace(/[^a-zA-Z0-9_-]/g, '_');
    const fileName = `SachiKheti_Invoice_${safeOrderNum}.pdf`;

    const items = Array.isArray(targetBillData.items) ? targetBillData.items : [];
    const isRental = targetBillData.billType === 'rental' || items.some((it) => {
      const u = (it.unit || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return it.isRental || it.isForRent || u.includes('acre') || u.includes('hour') || t.includes('tractor') || t.includes('leveler');
    });

    const docTitle = isRental ? 'Machinery Rental Agreement & Bill' : 'Tax Invoice / Cash Memo';
    const captionText =
      `🌾 *${effectiveDesign.companyName}* 🌾\n` +
      `📄 *${docTitle}* #${targetBillData.orderNumber}\n` +
      `👤 *Farmer:* ${targetBillData.customerName}\n` +
      `💰 *Total Amount:* ₹${Number(targetBillData.totalAmount || 0).toLocaleString('en-IN')}\n` +
      `💳 *Payment:* ${targetBillData.paymentMethod} (${(targetBillData.paymentStatus || 'PAID').toUpperCase()})\n` +
      (isRental && targetBillData.rentalDetails?.tenure ? `🚜 *Tenure:* ${targetBillData.rentalDetails.tenure}\n` : '') +
      (isRental && targetBillData.rentalDetails?.penaltyRate ? `⚠️ *Overdue Penalty:* ${targetBillData.rentalDetails.penaltyRate}\n` : '') +
      `----------------------------------------\n` +
      `📎 Please find your official computer-generated PDF bill attached.\n` +
      `📞 ${effectiveDesign.phone} | 📍 ${effectiveDesign.address}`;

    const sendResult = await sendWhatsAppDocument(recipientPhone, pdfBuffer, fileName, captionText);

    res.json({
      ...sendResult,
      fileName,
      pdfSize: pdfBuffer.length,
      orderNumber: targetBillData.orderNumber,
      message: sendResult.success ? `✓ Official PDF bill #${targetBillData.orderNumber} sent directly to WhatsApp (+${recipientPhone})!` : sendResult.message,
    });
  } catch (err) {
    console.error('[Send Bill PDF Route Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to generate and deliver PDF bill: ' + err.message });
  }
});

// POST /api/whatsapp/preview-pdf - Preview or download PDF invoice directly in browser
router.post('/preview-pdf', requireAdmin, async (req, res) => {
  try {
    const { billData, billDesignOverride } = req.body;
    if (!billData) {
      return res.status(400).json({ success: false, message: 'Bill data is required' });
    }
    const storeDesign = getStoreBillDesign();
    const effectiveDesign = { ...storeDesign, ...(billDesignOverride || {}) };
    const pdfBuffer = await generateInvoicePDF(billData, effectiveDesign);

    const safeOrderNum = (billData.orderNumber || 'Invoice').replace(/[^a-zA-Z0-9_-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="SachiKheti_${safeOrderNum}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
