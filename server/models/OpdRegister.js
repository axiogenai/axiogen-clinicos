const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OpdRegister = sequelize.define('OpdRegister', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  date: {
    type: DataTypes.STRING, // YYYY-MM-DD
    allowNull: false
  },
  year: {
    type: DataTypes.INTEGER, // e.g. 2026
    allowNull: false
  },
  month: {
    type: DataTypes.INTEGER, // 1 - 12
    allowNull: false
  },
  day: {
    type: DataTypes.INTEGER, // 1 - 31
    allowNull: false
  },
  srNo: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  opdNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  queueId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'M'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  village: {
    type: DataTypes.STRING,
    allowNull: true
  },
  complaint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  diagnosis: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  medicines: {
    type: DataTypes.JSON,
    allowNull: true
  },
  investigations: {
    type: DataTypes.JSON,
    allowNull: true
  },
  counselling: {
    type: DataTypes.JSON,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  consultingDoctor: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'डॉ. प्रियांका शिनगारे'
  },
  timeAdded: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'waiting' // waiting, in-consultation, completed, cancelled
  }
}, {
  tableName: 'opd_registers',
  timestamps: true,
  underscored: true
});

module.exports = OpdRegister;
