process.env.TZ = 'Asia/Kolkata';
const express = require('express');
const app = express();
app.set('trust proxy', 1);


const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const queueRoutes = require('./routes/queue');
const medicineRoutes = require('./routes/medicines');
const templateRoutes = require('./routes/templates');
const casePaperRoutes = require('./routes/casePapers');
const clinicRoutes = require('./routes/clinic');
const whatsappRoutes = require('./routes/whatsapp');
const registerRoutes = require('./routes/register');
const { initBackgroundScheduler } = require('./services/whatsappService');
const { initWhatsAppGateway } = require('./services/whatsappGateway');

// Start automated background scheduler & boot WhatsApp session
initBackgroundScheduler();
initWhatsAppGateway().catch(err => console.error('❌ Failed to boot WhatsApp Gateway:', err));

// Middlewares
app.use(compression()); // Gzip all responses - reduces payload size by 70-80%
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cache static/read-heavy endpoints for 30s to reduce repeated DB hits
app.use('/api/medicines', (req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
  next();
});
app.use('/api/templates', (req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
  next();
});

// Rate Limiters
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: { error: 'Too many requests from this IP. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 login/register requests per 15 minutes
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply Rate Limiters
app.use('/api', apiLimiter);
app.use('/api/auth', authLimiter);

// Serve static public files and built frontend assets
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../dist')));
app.use('/assets', express.static(path.join(__dirname, '../dist/assets')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/case-papers', casePaperRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/register', registerRoutes);

// SPA Client Catch-all Routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    const indexPath = path.join(__dirname, '../dist/index.html');
    const fs = require('fs');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  next();
});


// Oracle Cloud Auto-Update / Deployment Webhook
app.all('/api/deploy-pull', (req, res) => {
  const { exec } = require('child_process');
  console.log('🔄 [ORACLE DEPLOYMENT] Triggering git pull & server restart...');
  exec('git pull origin main', { cwd: path.join(__dirname, '..') }, (err, stdout, stderr) => {
    if (err) {
      console.error('❌ Git pull failed:', err);
      return res.status(500).json({ error: err.message, stderr });
    }
    console.log('✅ Git pull successful:', stdout);
    res.json({ message: 'Git pull successful. Restarting server...', stdout });
    setTimeout(() => {
      process.exit(0); // PM2 will automatically restart process
    }, 1000);
  });
});

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), app: 'ClinicOS Full-Stack API' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  try {
    await sequelize.authenticate();
    // Execute safe column migrations
    const dialect = sequelize.getDialect();
    if (dialect === 'postgres') {
      await sequelize.query(`
        ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_otp" VARCHAR(255);
        ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_otp_expires" TIMESTAMP WITH TIME ZONE;
        ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_o_t_p" VARCHAR(255);
        ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_o_t_p_expires" TIMESTAMP WITH TIME ZONE;
        ALTER TABLE IF EXISTS "Queues" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(255) DEFAULT 'paid';
        ALTER TABLE IF EXISTS "Queues" ADD COLUMN IF NOT EXISTS "payment_mode" VARCHAR(255) DEFAULT 'cash';
        ALTER TABLE IF EXISTS "opd_registers" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(255) DEFAULT 'paid';
        ALTER TABLE IF EXISTS "opd_registers" ADD COLUMN IF NOT EXISTS "payment_mode" VARCHAR(255) DEFAULT 'cash';
        ALTER TABLE IF EXISTS "queues" ADD COLUMN IF NOT EXISTS "payment_status" VARCHAR(255) DEFAULT 'paid';
        ALTER TABLE IF EXISTS "queues" ADD COLUMN IF NOT EXISTS "payment_mode" VARCHAR(255) DEFAULT 'cash';
        ALTER TABLE IF EXISTS "patients" ADD COLUMN IF NOT EXISTS "validity" DATE;
      `).catch(err => console.warn('Database column migration notice:', err.message));
    } else if (dialect === 'sqlite') {
      await sequelize.query(`ALTER TABLE Queues ADD COLUMN paymentStatus VARCHAR(255) DEFAULT 'paid';`).catch(() => {});
      await sequelize.query(`ALTER TABLE Queues ADD COLUMN paymentMode VARCHAR(255) DEFAULT 'cash';`).catch(() => {});
      await sequelize.query(`ALTER TABLE opd_registers ADD COLUMN payment_status VARCHAR(255) DEFAULT 'paid';`).catch(() => {});
      await sequelize.query(`ALTER TABLE opd_registers ADD COLUMN payment_mode VARCHAR(255) DEFAULT 'cash';`).catch(() => {});
      await sequelize.query(`ALTER TABLE patients ADD COLUMN validity DATE;`).catch(() => {});
    }

    await sequelize.sync({ alter: false });

    // Initialize WhatsApp Automated Festival & Follow-Up Engine
    const { initBackgroundScheduler } = require('./services/whatsappService');
    initBackgroundScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 ClinicOS Express Backend Server running on http://localhost:${PORT} [Prod: ${isProd}]`);
    });
  } catch (err) {
    console.error('❌ Database connection / sync error:', err);
  }
}

startServer();
