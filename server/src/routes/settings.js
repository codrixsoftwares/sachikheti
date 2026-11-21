import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/store-settings.json');

const defaultBillDesign = {
  companyName: 'LAMMA FARMER PRODUCER COMPANY LIMITED',
  brandName: 'ਸੱਚੀ ਖੇਤੀ | SachiKheti (LFPC Ltd.)',
  tagline: 'Direct Farmer Prosperity • Certified Natural Produce & Farm Machinery',
  cin: 'U01611PB2025PTC066073',
  pan: 'AAGCL5404L',
  tan: 'JLDL01772B',
  gstin: '03AAGCL5404L1Z5',
  address: 'VPO Kamalpura, Near Kalgidhar Stadium Jagraon, Kamalpura, Ludhiana - 142030, Punjab',
  phone: '+91 8360253372',
  email: 'support@sachikheti.com',
  billTitle: 'TAX INVOICE / CASH MEMO',
  accentColor: '#15733E', // Forest Green
  themeName: 'forest',
  showLogo: true,
  showSignature: true,
  termsNotes: '1. Certified direct farm produce & agricultural machinery custom hiring.\n2. Goods once delivered are verified fresh.\n3. Thank you for supporting indigenous farmers!',
  authorizedSignatoryTitle: 'Authorized Signatory (Lamma Farmer Producer Company Limited)',

  // Rental & Custom Hiring Configuration
  rentalBillTitle: 'AGRICULTURAL MACHINERY CUSTOM HIRING & RENTAL AGREEMENT',
  defaultRentalTenure: '1 Acre',
  defaultPenaltyPerHour: 250, // ₹250 per extra hour
  defaultPenaltyPerAcre: 500, // ₹500 per extra acre
  defaultGracePeriod: '1 Hour',
  defaultSecurityDeposit: 0,
  rentalTermsNotes: '1. Machinery is delivered in verified operational condition.\n2. Overdue usage beyond tenure incurs penalty at agreed rates.\n3. Fuel/Diesel & routine operational care is the responsibility of the hirer unless specified.\n4. Hirer is responsible for accidental damage caused by negligence.'
};

const defaultPaymentGateway = {
  razorpayEnabled: false,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  razorpayWebhookSecret: '',
};

export const defaultStoreContact = {
  phone: '8360253372',
  displayPhone: '+91 8360253372',
  whatsappNumber: '8360253372',
  email: 'support@sachikheti.com',
  address: 'VPO Kamalpura, Near Kalgidhar Stadium Jagraon, Kamalpura, Ludhiana - 142030, Punjab',
  facebookUrl: 'https://www.facebook.com/share/1XymBg6n78/?mibextid=wwXIfr',
  instagramUrl: 'https://www.instagram.com/sachi_kheti?evlk=MWJuaXc1MGk4NGo3aw%3D%3D&utm_source=qr',
};

export const getStoreContact = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultStoreContact, ...(parsed.contact || {}) };
    }
  } catch (err) {
    console.warn('[Settings] Failed to read contact settings:', err.message);
  }
  return defaultStoreContact;
};

export const saveStoreContact = (contactData) => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let current = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (e) {}
  }
  current.contact = {
    ...defaultStoreContact,
    ...(current.contact || {}),
    ...contactData,
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  return current.contact;
};

export const getStoreBillDesign = () => readSettings();

export const getPaymentGatewaySettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultPaymentGateway, ...(parsed.paymentGateway || {}) };
    }
  } catch (err) {
    console.warn('[Settings] Failed to read payment gateway settings, using defaults:', err.message);
  }
  return defaultPaymentGateway;
};

export const savePaymentGatewaySettings = (gatewayData) => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let current = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (e) {}
  }
  const existing = current.paymentGateway || defaultPaymentGateway;
  const keySecretToSave = gatewayData.razorpayKeySecret && gatewayData.razorpayKeySecret.trim() !== ''
    ? gatewayData.razorpayKeySecret.trim()
    : (existing.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET || '');

  current.paymentGateway = {
    ...defaultPaymentGateway,
    ...existing,
    ...gatewayData,
    razorpayKeySecret: keySecretToSave,
    razorpayEnabled: Boolean(gatewayData.razorpayEnabled),
  };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  return current.paymentGateway;
};

const readSettings = () => {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return { ...defaultBillDesign, ...(parsed.billDesign || {}) };
    }
  } catch (err) {
    console.warn('[Settings] Failed to read settings file, using defaults:', err.message);
  }
  return defaultBillDesign;
};

const saveSettings = (billDesign) => {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  let current = {};
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      current = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
    } catch (e) {}
  }
  current.billDesign = { ...defaultBillDesign, ...(current.billDesign || {}), ...billDesign };
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(current, null, 2), 'utf-8');
  return current.billDesign;
};

const router = express.Router();

// GET /api/settings/bill-design
router.get('/bill-design', (req, res) => {
  const billDesign = readSettings();
  res.json({ success: true, data: billDesign });
});

// PUT /api/settings/bill-design
router.put('/bill-design', requireAdmin, (req, res) => {
  try {
    const updated = saveSettings(req.body);
    const io = req.app.get('io');
    if (io) {
      io.emit('settings:bill-design-updated', updated);
    }
    res.json({ success: true, data: updated, message: 'Bill design template saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings/payment-gateway
router.get('/payment-gateway', (req, res) => {
  const settings = getPaymentGatewaySettings();
  res.json({
    success: true,
    data: {
      razorpayEnabled: Boolean(settings.razorpayEnabled),
      razorpayKeyId: settings.razorpayKeyId || '',
      hasKeySecret: Boolean(settings.razorpayKeySecret && settings.razorpayKeySecret.trim()),
      razorpayWebhookSecret: settings.razorpayWebhookSecret || '',
    },
  });
});

// PUT /api/settings/payment-gateway (Admin only)
router.put('/payment-gateway', requireAdmin, (req, res) => {
  try {
    const { razorpayEnabled, razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret } = req.body;

    if (razorpayEnabled) {
      if (!razorpayKeyId || !razorpayKeyId.trim()) {
        return res.status(400).json({ success: false, message: 'Razorpay Key ID is required to enable online payments.' });
      }
      const existing = getPaymentGatewaySettings();
      const hasSecret = (razorpayKeySecret && razorpayKeySecret.trim()) || (existing.razorpayKeySecret && existing.razorpayKeySecret.trim());
      if (!hasSecret) {
        return res.status(400).json({ success: false, message: 'Razorpay Key Secret is required to enable online payments.' });
      }
    }

    const updated = savePaymentGatewaySettings({
      razorpayEnabled,
      razorpayKeyId: (razorpayKeyId || '').trim(),
      razorpayKeySecret: (razorpayKeySecret || '').trim(),
      razorpayWebhookSecret: (razorpayWebhookSecret || '').trim(),
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('settings:payment-gateway-updated', {
        razorpayEnabled: updated.razorpayEnabled,
        razorpayKeyId: updated.razorpayEnabled ? updated.razorpayKeyId : '',
      });
    }

    res.json({
      success: true,
      message: updated.razorpayEnabled
        ? '✓ Razorpay Payment Gateway activated successfully!'
        : '✓ Online payments disabled. Store will operate in Cash on Delivery mode.',
      data: {
        razorpayEnabled: updated.razorpayEnabled,
        razorpayKeyId: updated.razorpayKeyId,
        hasKeySecret: Boolean(updated.razorpayKeySecret),
        razorpayWebhookSecret: updated.razorpayWebhookSecret,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/settings/contact (Public)
router.get('/contact', (req, res) => {
  const contact = getStoreContact();
  res.json({ success: true, data: contact });
});

// PUT /api/settings/contact (Admin only)
router.put('/contact', requireAdmin, (req, res) => {
  try {
    const updated = saveStoreContact(req.body);
    const io = req.app.get('io');
    if (io) {
      io.emit('settings:contact-updated', updated);
    }
    res.json({
      success: true,
      message: '✓ Store contact details & social links updated successfully!',
      data: updated,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
