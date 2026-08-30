const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

const AUTH_FOLDER = process.env.WHATSAPP_AUTH_PATH || path.join(__dirname, '..', 'whatsapp_auth_info');

let sock = null;
let qrCodeDataUrl = '';
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let connectedPhone = '';
let isInitializing = false;
let reconnectTimer = null;
let qrTimeoutTimer = null;

function hasStoredCredentials() {
  const credsPath = path.join(AUTH_FOLDER, 'creds.json');
  return fs.existsSync(credsPath);
}

function cleanupSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (qrTimeoutTimer) {
    clearTimeout(qrTimeoutTimer);
    qrTimeoutTimer = null;
  }
  if (sock) {
    try {
      sock.ev.removeAllListeners('connection.update');
      sock.ev.removeAllListeners('creds.update');
      sock.end(undefined);
    } catch (e) {}
    sock = null;
  }
}

async function initWhatsAppGateway(forceFresh = false) {
  if (isInitializing) return;
  isInitializing = true;

  if (connectionStatus === 'connected' && !forceFresh) {
    isInitializing = false;
    return;
  }

  connectionStatus = 'connecting';
  qrCodeDataUrl = '';

  cleanupSocket();

  try {
    if (forceFresh && fs.existsSync(AUTH_FOLDER)) {
      try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
    }

    if (!fs.existsSync(AUTH_FOLDER)) {
      fs.mkdirSync(AUTH_FOLDER, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: false, // Don't spam terminal logs with massive ASCII QR
      logger: pino({ level: 'silent' }),
      browser: Browsers.macOS('Desktop'),
      connectTimeoutMs: 30000,
      defaultQueryTimeoutMs: 30000,
      keepAliveIntervalMs: 60000,
      retryRequestDelayMs: 5000,
      markOnlineOnConnect: false,
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qr);
          connectionStatus = 'qr_ready';
          console.log('📱 WhatsApp Gateway: QR Code ready for scan');

          // Auto-stop QR generation after 3 minutes of no scan to protect CPU/RAM
          if (qrTimeoutTimer) clearTimeout(qrTimeoutTimer);
          qrTimeoutTimer = setTimeout(() => {
            if (connectionStatus === 'qr_ready') {
              console.log('⏳ WhatsApp QR code timed out. Idle until user opens WhatsApp modal.');
              cleanupSocket();
              connectionStatus = 'disconnected';
              qrCodeDataUrl = '';
            }
          }, 180000); // 3 minutes
        } catch (err) {
          console.error('Error generating QR Data URL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isExplicitLogout = statusCode === DisconnectReason.loggedOut;
        
        console.log(`📱 WhatsApp Gateway connection closed (statusCode: ${statusCode}, explicitLogout: ${isExplicitLogout})`);
        
        qrCodeDataUrl = '';
        connectionStatus = 'disconnected';
        connectedPhone = '';
        isInitializing = false;

        if (isExplicitLogout) {
          console.log('🗑️ Explicit user logout detected. Wiping stored credentials...');
          if (fs.existsSync(AUTH_FOLDER)) {
            try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
          }
        }

        // CRITICAL FIX: Only auto-reconnect if we ALREADY HAVE saved session credentials!
        // Never auto-reconnect in an infinite loop when waiting for initial QR scan!
        if (hasStoredCredentials() && !isExplicitLogout) {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = setTimeout(() => {
            if (connectionStatus === 'disconnected' && !isInitializing) {
              console.log('🔄 Reconnecting WhatsApp Gateway using saved session credentials...');
              initWhatsAppGateway();
            }
          }, 10000); // 10s backoff (not 3s aggressive loop)
        } else {
          console.log('📱 WhatsApp Gateway idle. Waiting for user interaction.');
        }
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        qrCodeDataUrl = '';
        connectedPhone = sock?.user?.id ? sock.user.id.split(':')[0] : 'Connected Phone';
        isInitializing = false;
        console.log(`✅ WhatsApp Gateway CONNECTED as +${connectedPhone}`);
      }
    });
  } catch (err) {
    console.error('Failed to init WASocket:', err.message);
    connectionStatus = 'disconnected';
    qrCodeDataUrl = '';
  } finally {
    isInitializing = false;
  }
}

// Auto-boot ONLY if previously authenticated credentials exist
function bootIfSavedSessionExists() {
  if (hasStoredCredentials()) {
    console.log('📱 Saved WhatsApp session found. Initializing gateway...');
    initWhatsAppGateway();
  } else {
    console.log('📱 No saved WhatsApp session. Gateway idle (0% CPU impact).');
  }
}

function getGatewayStatus() {
  return {
    status: connectionStatus,
    qrCodeDataUrl,
    phone: connectedPhone
  };
}

async function sendWhatsAppMessage(toPhone, messageText) {
  if (connectionStatus !== 'connected' || !sock) {
    throw new Error('WhatsApp Gateway is not connected. Please scan the QR code first.');
  }

  const rawClean = toPhone.replace(/\D/g, '');
  if (rawClean.length < 10) {
    throw new Error('Invalid phone number: minimum 10 digits required');
  }
  const cleanNumber = `91${rawClean.slice(-10)}`;
  const jid = `${cleanNumber}@s.whatsapp.net`;

  const result = await sock.sendMessage(jid, { text: messageText });
  return result;
}

async function logoutGateway() {
  cleanupSocket();
  if (fs.existsSync(AUTH_FOLDER)) {
    try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
  }
  connectionStatus = 'disconnected';
  qrCodeDataUrl = '';
  connectedPhone = '';
  return { success: true, message: 'Logged out successfully' };
}

module.exports = {
  initWhatsAppGateway,
  bootIfSavedSessionExists,
  getGatewayStatus,
  sendWhatsAppMessage,
  logoutGateway
};
