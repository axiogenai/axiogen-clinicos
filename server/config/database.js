const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let sequelize;

const dbUrl = process.env.DATABASE_URL || process.env.DB_URL;

if (dbUrl) {
  // Production Cloud PostgreSQL (Render, Supabase, Neon, Railway, AWS RDS)
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'false' ? false : {
        require: true,
        rejectUnauthorized: false // required for cloud databases with SSL
      }
    },
    logging: false,
    define: {
      timestamps: true,
      underscored: true
    }
  });
  console.log('🐘 Configured for Cloud PostgreSQL Database');
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
  console.log('📦 Configured for Local SQLite Database');
}

module.exports = sequelize;
