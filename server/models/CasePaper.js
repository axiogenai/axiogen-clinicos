const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CasePaper = sequelize.define('CasePaper', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  queueId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  templateId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  complaint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  pastHistory: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  allergies: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  medicines: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  investigationsAdvised: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  counsellingDone: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('draft', 'completed', 'archived'),
    defaultValue: 'completed'
  }
});

module.exports = CasePaper;
