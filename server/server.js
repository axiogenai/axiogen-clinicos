const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
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

const app = express();

// Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/case-papers', casePaperRoutes);
app.use('/api/clinic', clinicRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date(), app: 'ClinicOS Full-Stack API' });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 ClinicOS Express Backend Server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Database connection / sync error:', err);
});
