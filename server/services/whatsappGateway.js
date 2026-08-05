const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const pino = require('pino');

const AUTH_FOLDER = path.join(__dirname, '..', 'whatsapp_auth_info');

let sock = null;
let qrCodeDataUrl = '';
let connectionStatus = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
let connectedPhone = '';
let isInitializing = false;
let reconnectTimer = null;

function cleanupSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
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
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }),
      browser: ['ClinicOS', 'Chrome', '1.0.0'],
      connectTimeoutMs: 30000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeDataUrl = await QRCode.toDataURL(qr);
          connectionStatus = 'qr_ready';
          console.log('📱 WhatsApp Gateway: New QR Code generated!');
        } catch (err) {
          console.error('Error generating QR Data URL:', err);
        }
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        
        console.log(`📱 WhatsApp Gateway closed (statusCode: ${statusCode}, loggedOut: ${isLoggedOut})`);
        
        qrCodeDataUrl = '';
        connectionStatus = 'disconnected';
        connectedPhone = '';
        isInitializing = false;

        if (isLoggedOut || statusCode === 401) {
          console.log('🗑️ WhatsApp session explicitly logged out. Wiping credentials...');
          if (fs.existsSync(AUTH_FOLDER)) {
            try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
          }
        }

        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          if (connectionStatus === 'disconnected' && !isInitializing) {
            initWhatsAppGateway();
          }
        }, 5000);
      } else if (connection === 'open') {
        connectionStatus = 'connected';
        qrCodeDataUrl = '';
        connectedPhone = sock?.user?.id ? sock.user.id.split(':')[0] : 'Connected Phone';
        isInitializing = false;
        console.log(`✅ WhatsApp Gateway CONNECTED as +${connectedPhone}`);
      }
    });
  } catch (err) {
    console.error('Failed to init WASocket:', err);
    connectionStatus = 'disconnected';
    qrCodeDataUrl = '';
  } finally {
    isInitializing = false;
  }
}

function getGatewayStatus() {
  if (connectionStatus === 'disconnected' && !isInitializing) {
    initWhatsAppGateway();
  }
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

  let cleanNumber = toPhone.replace(/\D/g, '');
  if (cleanNumber.length === 10) {
    cleanNumber = `91${cleanNumber}`;
  }
  const jid = `${cleanNumber}@s.whatsapp.net`;

  const result = await sock.sendMessage(jid, { text: messageText });
  return result;
}

async function logoutGateway() {
  cleanupSocket();
  connectionStatus = 'disconnected';
  qrCodeDataUrl = '';
  connectedPhone = '';

  if (fs.existsSync(AUTH_FOLDER)) {
    try { fs.rmSync(AUTH_FOLDER, { recursive: true, force: true }); } catch (e) {}
  }

  setTimeout(() => initWhatsAppGateway(true), 1000);
}

// Auto-initialize on boot
initWhatsAppGateway().catch(() => {});

module.exports = {
  initWhatsAppGateway,
  getGatewayStatus,
  sendWhatsAppMessage,
  logoutGateway
};
