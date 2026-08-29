const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sequelize;

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (dbUrl) {
  // Production Cloud PostgreSQL (Supabase, Neon, Railway, AWS RDS)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false
      },
      connectTimeout: 30000,    // 30s connect timeout (handles Supabase wake-up)
      statement_timeout: 30000, // 30s statement timeout
    },
    logging: false,
    pool: {
      max: 10,
      min: 1,        // Keep at least 1 connection warm
      acquire: 30000, // 30s to acquire connection (was default 10s, too short for Supabase wake-up)
      idle: 10000,
      evict: 60000,  // Check and evict stale connections every 60s
    },
    retry: {
      max: 3,        // Retry failed queries up to 3 times
      match: [
        /ConnectionError/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /ECONNRESET/,
        /ETIMEDOUT/,
        /ECONNREFUSED/,
        /connection terminated/,
        /Client has encountered a connection error/,
      ],
    },
    define: {
      timestamps: true,
      underscored: true
    }
  });
  console.log('🐘 Configured for Cloud PostgreSQL Database (with retry & keep-alive)');

  // ── Supabase Keep-Alive Heartbeat ──
  // Ping every 4 minutes to prevent Supabase free tier from auto-pausing
  const HEARTBEAT_INTERVAL = 4 * 60 * 1000; // 4 minutes
  setInterval(async () => {
    try {
      await sequelize.query('SELECT 1 AS heartbeat');
    } catch (err) {
      console.warn('💓 DB heartbeat failed (will auto-retry):', err.message);
      // Try to reconnect
      try {
        await sequelize.authenticate();
        console.log('💓 DB reconnected after heartbeat failure');
      } catch (reconnectErr) {
        console.error('💓 DB reconnect failed:', reconnectErr.message);
      }
    }
  }, HEARTBEAT_INTERVAL);

} else {
  // Local Development SQLite
  const storagePath = process.env.DB_STORAGE 
    ? path.resolve(__dirname, '..', process.env.DB_STORAGE) 
    : path.resolve(__dirname, '../database.sqlite');

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storagePath,
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
  sequelize.query('PRAGMA journal_mode=WAL;').catch(err => {
    console.error('⚠️ Failed to enable SQLite WAL mode:', err);
  });
  console.log('📦 Configured for Local SQLite Database (WAL Mode enabled)');
}

module.exports = sequelize;
