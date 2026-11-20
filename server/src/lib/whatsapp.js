import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import QRCode from 'qrcode';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH_DIR = path.join(__dirname, '../../baileys_auth');

// ==========================================
// SINGLE-DEVICE BAILEYS SESSION MANAGER
// ==========================================
// Strictly one active WhatsApp connection per server instance.
// Guarded with state tracking and clean teardown mechanics.

let sock = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'SCAN_QR' | 'CONNECTED'
let currentQr = null;
let qrGeneratedAt = null;
let connectedUser = null;
let lastSyncedAt = null;
let ioInstance = null;
let reconnectTimer = null;
let isInitializing = false;
let connectionAttempts = 0;

export const setWhatsAppIO = (io) => {
  ioInstance = io;
};

// Real-time broadcast to all connected Admin dashboards
const notifyStatus = () => {
  if (ioInstance) {
    try {
      ioInstance.emit('whatsapp:status', getWhatsAppStatus());
    } catch (err) {
      console.warn('[WhatsApp Service] Socket broadcast error:', err.message);
    }
  }
};

export const getWhatsAppStatus = () => {
  const isOnline = Boolean(sock && connectionStatus === 'CONNECTED');
  return {
    status: connectionStatus,
    qr: currentQr,
    qrGeneratedAt,
    user: connectedUser,
    isOnline,
    lastSyncedAt: lastSyncedAt || (isOnline ? new Date().toISOString() : null),
    sessionMode: 'SINGLE_ACTIVE_DEVICE',
    hasAuthFolder: fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0,
    timestamp: new Date().toISOString(),
  };
};

// Safe and complete teardown of any active socket
const teardownExistingSocket = async (closeSession = true) => {
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (sock) {
    try {
      sock.ev?.removeAllListeners('connection.update');
      sock.ev?.removeAllListeners('creds.update');
    } catch (e) {}

    if (closeSession) {
      try {
        sock.ws?.close();
      } catch (e) {}
      try {
        sock.end(new Error('Session closed for single-device enforcement'));
      } catch (e) {}
    }
    sock = null;
  }
};

// Clean removal of stored Baileys credentials
const wipeAuthStorage = () => {
  if (fs.existsSync(AUTH_DIR)) {
    try {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    } catch (e) {
      console.warn('[WhatsApp Service] Auth directory cleanup warning:', e.message);
    }
  }
};

/**
 * Initialize single active WhatsApp session
 * @param {boolean} forceNew - If true, wipes credentials and requests fresh QR
 */
export const initWhatsApp = async (forceNew = false) => {
  if (isInitializing) {
    return getWhatsAppStatus();
  }

  isInitializing = true;

  try {
    if (forceNew) {
      await teardownExistingSocket(true);
      wipeAuthStorage();
      connectionStatus = 'DISCONNECTED';
      currentQr = null;
      connectedUser = null;
    }

    // If socket is already alive and connected, verify and return
    if (sock && connectionStatus === 'CONNECTED') {
      lastSyncedAt = new Date().toISOString();
      notifyStatus();
      isInitializing = false;
      return getWhatsAppStatus();
    }

    // Teardown any dangling socket before spawning new single session
    await teardownExistingSocket(true);

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
      syncFullHistory: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Handle QR Code rotation
      if (qr) {
        try {
          currentQr = await QRCode.toDataURL(qr, {
            margin: 2,
            scale: 7,
            color: { dark: '#0A3E22', light: '#FFFFFF' },
          });
          qrGeneratedAt = new Date().toISOString();
          connectionStatus = 'SCAN_QR';
          console.log('[WhatsApp Single-Session] New QR code generated for admin scan');
          notifyStatus();
        } catch (qrErr) {
          console.error('[WhatsApp Single-Session] QR generation error:', qrErr);
        }
      }

      // Handle successful connection
      if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        currentQr = null;
        qrGeneratedAt = null;
        connectionAttempts = 0;
        lastSyncedAt = new Date().toISOString();

        const phone = sock.user?.id ? sock.user.id.split(':')[0] : '';
        connectedUser = {
          id: sock.user?.id,
          name: sock.user?.name || 'SachiKheti Admin Store',
          phone,
          platform: 'Baileys Multi-Device (Single Dedicated Server Session)',
        };

        console.log(`[WhatsApp Single-Session] Connection opened successfully. Verified as +${phone}`);
        notifyStatus();
      }

      // Handle disconnection
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[WhatsApp Single-Session] Connection closed (code: ${statusCode}). Auto-reconnect: ${shouldReconnect}`);

        if (statusCode === DisconnectReason.loggedOut) {
          connectionStatus = 'DISCONNECTED';
          currentQr = null;
          qrGeneratedAt = null;
          connectedUser = null;
          sock = null;
          wipeAuthStorage();
          notifyStatus();
        } else {
          connectionStatus = 'CONNECTING';
          notifyStatus();

          clearTimeout(reconnectTimer);
          // Exponential backoff up to 10s
          connectionAttempts++;
          const delay = Math.min(connectionAttempts * 2000, 10000);

          reconnectTimer = setTimeout(() => {
            initWhatsApp(false).catch((err) =>
              console.error('[WhatsApp Single-Session Reconnect Error]:', err.message)
            );
          }, delay);
        }
      }
    });

    isInitializing = false;
    return getWhatsAppStatus();
  } catch (error) {
    console.error('[WhatsApp Single-Session Init Error]:', error);
    connectionStatus = 'DISCONNECTED';
    currentQr = null;
    isInitializing = false;
    notifyStatus();
    throw error;
  }
};

/**
 * Sync & Refresh Connection Status
 * Probes the live socket and broadcasts verified status to all admins
 */
export const syncWhatsApp = async () => {
  lastSyncedAt = new Date().toISOString();

  if (!sock) {
    // If auth files exist, attempt a clean resume
    if (fs.existsSync(AUTH_DIR) && fs.readdirSync(AUTH_DIR).length > 0) {
      await initWhatsApp(false);
    } else {
      connectionStatus = 'DISCONNECTED';
    }
  } else {
    // Check if WebSocket is open
    const isWsOpen = sock.ws?.readyState === 1; // 1 = OPEN
    if (isWsOpen && sock.user) {
      connectionStatus = 'CONNECTED';
      const phone = sock.user.id ? sock.user.id.split(':')[0] : '';
      connectedUser = {
        id: sock.user.id,
        name: sock.user.name || 'SachiKheti Admin Store',
        phone,
        platform: 'Baileys Multi-Device (Single Dedicated Server Session)',
      };
    } else if (!isWsOpen && connectionStatus === 'CONNECTED') {
      connectionStatus = 'CONNECTING';
      // Trigger auto-reconnect
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => initWhatsApp(false), 1500);
    }
  }

  notifyStatus();
  return {
    success: true,
    message: 'WhatsApp session synchronized with server',
    ...getWhatsAppStatus(),
  };
};

/**
 * Hard Reset WhatsApp Session
 * Tears down active connection, deletes credentials from disk, and generates fresh QR
 */
export const resetWhatsApp = async () => {
  console.log('[WhatsApp Single-Session] Performing complete hard reset...');
  await teardownExistingSocket(true);
  wipeAuthStorage();
  connectionStatus = 'DISCONNECTED';
  currentQr = null;
  qrGeneratedAt = null;
  connectedUser = null;
  lastSyncedAt = null;
  connectionAttempts = 0;
  notifyStatus();

  // Immediately initiate fresh connection to produce brand-new QR code
  const freshStatus = await initWhatsApp(false);
  return {
    success: true,
    message: 'Session hard reset complete. Fresh QR code generated.',
    ...freshStatus,
  };
};

/**
 * Graceful Disconnect / Logout
 * Informs WhatsApp servers, removes device pairing, and resets local state
 */
export const disconnectWhatsApp = async () => {
  console.log('[WhatsApp Single-Session] Disconnecting session...');
  clearTimeout(reconnectTimer);
  reconnectTimer = null;

  if (sock) {
    try {
      await sock.logout();
    } catch (e) {}
    try {
      sock.end();
    } catch (e) {}
    sock = null;
  }

  wipeAuthStorage();
  connectionStatus = 'DISCONNECTED';
  currentQr = null;
  qrGeneratedAt = null;
  connectedUser = null;
  lastSyncedAt = null;
  connectionAttempts = 0;

  notifyStatus();
  return {
    success: true,
    message: 'WhatsApp session disconnected and device unlinked successfully.',
    ...getWhatsAppStatus(),
  };
};

/**
 * Send WhatsApp text message via Baileys single session
 */
export const sendWhatsAppMessage = async (rawPhone, messageText) => {
  if (!rawPhone || !messageText) {
    throw new Error('Phone number and message text are required');
  }

  let cleanPhone = String(rawPhone).replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const jid = `${cleanPhone}@s.whatsapp.net`;
  const fallbackUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  if (!sock || connectionStatus !== 'CONNECTED') {
    return {
      success: false,
      connected: false,
      fallbackUrl,
      message: 'Baileys WhatsApp is not currently connected. You can use the direct WhatsApp link to send.',
    };
  }

  try {
    const sent = await sock.sendMessage(jid, { text: messageText });
    lastSyncedAt = new Date().toISOString();
    return {
      success: true,
      connected: true,
      messageId: sent?.key?.id,
      phone: cleanPhone,
    };
  } catch (err) {
    console.error(`[WhatsApp Single-Session Send Error to ${cleanPhone}]:`, err);
    return {
      success: false,
      connected: true,
      error: err.message,
      fallbackUrl,
      message: `Failed to deliver via Baileys (${err.message}). Fallback to WhatsApp link.`,
    };
  }
};
