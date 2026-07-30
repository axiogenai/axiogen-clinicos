const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const storagePath = process.env.DB_STORAGE 
  ? path.resolve(__dirname, '..', process.env.DB_STORAGE) 
  : path.resolve(__dirname, '../database.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: storagePath,
  logging: false, // Set to console.log for SQL debug
  define: {
    timestamps: true,
    underscored: true
  }
});

module.exports = sequelize;
