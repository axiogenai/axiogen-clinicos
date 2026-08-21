const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Patient = sequelize.define('Patient', {
  id: {
    type: DataTypes.STRING, // e.g. PT0001
    primaryKey: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  gender: {
    type: DataTypes.STRING,
    defaultValue: 'M'
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  village: {
    type: DataTypes.STRING,
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
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  validity: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Patient registration validity / expiry date (YYYY-MM-DD)'
  },
  casePaperNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'case_paper_no',
    comment: 'Custom physical casepaper or clinic book number'
  }
});

module.exports = Patient;
