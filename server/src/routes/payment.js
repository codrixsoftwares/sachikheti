import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import { getPaymentGatewaySettings } from './settings.js';

dotenv.config();

const router = express.Router();

const getActiveRazorpayClient = () => {
  const settings = getPaymentGatewaySettings();
  if (!settings.razorpayEnabled) {
    return null;
  }
  const keyId = settings.razorpayKeyId || process.env.RAZORPAY_KEY_ID;
  const keySecret = settings.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return null;
  }
  try {
    return {
      instance: new Razorpay({ key_id: keyId, key_secret: keySecret }),
      keyId,
      keySecret,
    };
  } catch (err) {
    console.warn('[Razorpay] Client initialization error:', err.message);
    return null;
  }
};

// POST /api/payment/razorpay/create-order
router.post('/create-order', async (req, res) => {
  try {
    const settings = getPaymentGatewaySettings();
    if (!settings.razorpayEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Online payments are currently disabled by store administration.',
      });
    }

    const client = getActiveRazorpayClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'Razorpay payment gateway credentials not properly configured on server.',
      });
    }

    const { amount, currency = 'INR', receipt } = req.body;
    if (!amount) {
      return res.status(400).json({ success: false, message: 'Order amount is required.' });
    }

    const options = {
      amount: Math.round(Number(amount) * 100), // convert rupees to paise
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    };

    const order = await client.instance.orders.create(options);
    return res.json({
      success: true,
      order,
      key: client.keyId,
    });
  } catch (error) {
    console.error('Razorpay create-order error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to initiate Razorpay payment' });
  }
});

// POST /api/payment/razorpay/verify
router.post('/verify', async (req, res) => {
  try {
    const settings = getPaymentGatewaySettings();
    if (!settings.razorpayEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Online payments are currently disabled by store administration.',
      });
    }

    const client = getActiveRazorpayClient();
    if (!client) {
      return res.status(500).json({
        success: false,
        message: 'Payment gateway secret not configured on server.',
      });
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required Razorpay payment verification fields.',
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', client.keySecret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({
        success: true,
        verified: true,
        paymentId: razorpay_payment_id,
        message: 'Payment 100% verified successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature. Verification failed.',
      });
    }
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: 'Error verifying payment' });
  }
});

export default router;
