import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireAdmin } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.join(__dirname, '../../data/store-settings.json');

const defaultBillDesign = {
  companyName: 'ਸੱਚੀ ਖੇਤੀ | SachiKheti (LFPC Ltd.)',
  tagline: 'Direct Farmer Prosperity • Certified Natural Produce & Farm Machinery',
  gstin: 'FSSAI: 20822005001234 | GSTIN: 06AABCL1234E1Z5',
  address: 'VPO Bhirdana, District Fatehabad, Haryana - 125050',
  phone: '+91 8360253372',
  email: 'support@sachikheti.com',
  billTitle: 'TAX INVOICE / CASH MEMO',
  accentColor: '#15733E', // Forest Green
  themeName: 'forest',
  showLogo: true,
  showSignature: true,
  termsNotes: '1. Certified direct farm produce & agricultural machinery custom hiring.\n2. Goods once delivered are verified fresh.\n3. Thank you for supporting indigenous farmers!',
  authorizedSignatoryTitle: 'Authorized Store Manager (LFPC Ltd.)',

  // Rental & Custom Hiring Configuration
  rentalBillTitle: 'AGRICULTURAL MACHINERY CUSTOM HIRING & RENTAL AGREEMENT',
  defaultRentalTenure: '1 Acre',
  defaultPenaltyPerHour: 250, // ₹250 per extra hour
  defaultPenaltyPerAcre: 500, // ₹500 per extra acre
  defaultGracePeriod: '1 Hour',
  defaultSecurityDeposit: 0,
  rentalTermsNotes: '1. Machinery is delivered in verified operational condition.\n2. Overdue usage beyond tenure incurs penalty at agreed rates.\n3. Fuel/Diesel & routine operational care is the responsibility of the hirer unless specified.\n4. Hirer is responsible for accidental damage caused by negligence.'
};

export const getStoreBillDesign = () => readSettings();

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

export default router;
