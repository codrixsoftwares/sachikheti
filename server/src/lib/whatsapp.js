import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '../../baileys_auth');

// In-memory state for Baileys WhatsApp connection
let sock = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'
let currentQr = null;
let connectedUser = null;
let ioInstance = null;
let reconnectTimer = null;

export const setWhatsAppIO = (io) => {
  ioInstance = io;
};

const notifyStatus = () => {
  if (ioInstance) {
    try {
      ioInstance.emit('whatsapp:status', {
        status: connectionStatus,
        qr: currentQr,
        user: connectedUser,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.warn('[WhatsApp Service] Socket broadcast error:', err.message);
    }
  }
};

export const getWhatsAppStatus = () => {
  return {
    status: connectionStatus,
    qr: currentQr,
    user: connectedUser,
    hasAuthFolder: fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0
  };
};

export const initWhatsApp = async (forceNew = false) => {
  if (forceNew) {
    await disconnectWhatsApp(true);
  }

  if (sock && connectionStatus === 'CONNECTED') {
    notifyStatus();
    return getWhatsAppStatus();
  }

  if (connectionStatus === 'CONNECTING' || connectionStatus === 'SCAN_QR') {
    return getWhatsAppStatus();
  }

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    connectionStatus = 'CONNECTING';
    currentQr = null;
    notifyStatus();

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: ['SachiKheti LFPC Admin', 'Chrome', '1.0.0'],
      defaultQueryTimeoutMs: 60000,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          currentQr = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: { dark: '#0A3E22', light: '#FFFFFF' }
          });
          connectionStatus = 'SCAN_QR';
          console.log('[WhatsApp Service] New QR code generated for admin scan');
          notifyStatus();
        } catch (qrErr) {
          console.error('[WhatsApp Service] QR generation error:', qrErr);
        }
      }

      if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        currentQr = null;
        const phone = sock.user?.id ? sock.user.id.split(':')[0] : '';
        connectedUser = {
          id: sock.user?.id,
          name: sock.user?.name || 'SachiKheti Admin Store',
          phone
        };
        console.log(`[WhatsApp Service] Connected successfully as ${phone}`);
        notifyStatus();
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Service] Connection closed (code: ${statusCode}). Reconnect? ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          connectionStatus = 'DISCONNECTED';
          currentQr = null;
          connectedUser = null;
          sock = null;
          try {
            if (fs.existsSync(AUTH_DIR)) {
              fs.rmSync(AUTH_DIR, { recursive: true, force: true });
            }
          } catch (e) {}
          notifyStatus();
        } else {
          connectionStatus = 'CONNECTING';
          notifyStatus();
          clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            initWhatsApp(false).catch(err => console.error('[WhatsApp Reconnect Error]:', err.message));
          }, 4000);
        }
      }
    });

    return getWhatsAppStatus();
  } catch (error) {
    console.error('[WhatsApp Service Init Error]:', error);
    connectionStatus = 'DISCONNECTED';
    currentQr = null;
    notifyStatus();
    throw error;
  }
};

export const disconnectWhatsApp = async (clearStorage = true) => {
  clearTimeout(reconnectTimer);
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
    try {
      sock.end();
    } catch (e) {}
    sock = null;
  }

  connectionStatus = 'DISCONNECTED';
  currentQr = null;
  connectedUser = null;

  if (clearStorage && fs.existsSync(AUTH_DIR)) {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch (e) {
      console.warn('[WhatsApp Service] Auth directory cleanup warning:', e.message);
    }
  }

  notifyStatus();
  return { success: true, message: 'WhatsApp session disconnected' };
};

export const sendWhatsAppMessage = async (rawPhone, messageText) => {
  if (!rawPhone || !messageText) {
    throw new Error('Phone number and message text are required');
  }

  // Sanitize phone number (remove spaces, symbols)
  let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`; // Default to India country code for 10-digit mobiles
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;

  if (!sock || connectionStatus !== 'CONNECTED') {
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    return {
      success: false,
      connected: false,
      fallbackUrl,
      message: 'Baileys WhatsApp is not currently connected. You can use the direct WhatsApp link to send.'
    };
  }

  try {
    const sent = await sock.sendMessage(jid, { text: messageText });
    return {
      success: true,
      connected: true,
      messageId: sent?.key?.id,
      phone: cleanPhone
    };
  } catch (err) {
    console.error(`[WhatsApp Send Error to ${cleanPhone}]:`, err);
    const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
    return {
      success: false,
      connected: true,
      error: err.message,
      fallbackUrl,
      message: `Failed to deliver via Baileys (${err.message}). Fallback to WhatsApp link.`
    };
  }
};
