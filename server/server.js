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

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/case-papers', casePaperRoutes);
app.use('/api/clinic', clinicRoutes);
app.use('/api/whatsapp', whatsappRoutes);


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
    // Execute safe column migrations for production PostgreSQL (table name: users)
    await sequelize.query(`
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_otp" VARCHAR(255);
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_otp_expires" TIMESTAMP WITH TIME ZONE;
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_o_t_p" VARCHAR(255);
      ALTER TABLE IF EXISTS "users" ADD COLUMN IF NOT EXISTS "reset_o_t_p_expires" TIMESTAMP WITH TIME ZONE;
    `).catch(err => console.warn('Database column migration notice:', err.message));

    await sequelize.sync({ alter: false });

    app.listen(PORT, () => {
      console.log(`🚀 ClinicOS Express Backend Server running on http://localhost:${PORT} [Prod: ${isProd}]`);
    });
  } catch (err) {
    console.error('❌ Database connection / sync error:', err);
  }
}

startServer();
