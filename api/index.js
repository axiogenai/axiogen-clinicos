const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

// Load env from server/.env
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const { sequelize } = require('../server/models');
const errorHandler = require('../server/middleware/errorHandler');

const authRoutes = require('../server/routes/auth');
const patientRoutes = require('../server/routes/patients');
const queueRoutes = require('../server/routes/queue');
const medicineRoutes = require('../server/routes/medicines');
const templateRoutes = require('../server/routes/templates');
const casePaperRoutes = require('../server/routes/casePapers');
const clinicRoutes = require('../server/routes/clinic');
const whatsappRoutes = require('../server/routes/whatsapp');

const app = express();

// Middlewares
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Cache headers for read-heavy endpoints
app.use('/api/medicines', (req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
  next();
});
app.use('/api/templates', (req, res, next) => {
  if (req.method === 'GET') res.set('Cache-Control', 'public, max-age=30');
  next();
});

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
  res.json({ status: 'healthy', timestamp: new Date(), app: 'ClinicOS Vercel Serverless' });
});

// Error handling
app.use(errorHandler);

// Sync DB on cold start (no alter in production)
let dbSynced = false;
const ensureDb = async () => {
  if (!dbSynced) {
    try {
      await sequelize.sync({ alter: false });
      dbSynced = true;
    } catch (err) {
      console.warn('Vercel serverless DB sync skipped (using live Oracle VM DB):', err.message);
    }
  }
};

module.exports = async (req, res) => {
  await ensureDb();
  app(req, res);
};
