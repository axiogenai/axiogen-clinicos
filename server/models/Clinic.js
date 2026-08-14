const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Clinic = sequelize.define('Clinic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nameEn: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'Clinics'
  },
  nameHi: {
    type: DataTypes.STRING,
    allowNull: true
  },
  logoUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  openingHours: {
    type: DataTypes.STRING,
    allowNull: true
  },
  closedDay: {
    type: DataTypes.STRING,
    allowNull: true
  },
  headerBgColor: {
    type: DataTypes.STRING,
    defaultValue: '#7CB342'
  },
  headerTextColor: {
    type: DataTypes.STRING,
    defaultValue: '#FFFFFF'
  },
  pharmacyInfo: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  customFrequencies: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: []
  },
  sections: {
    type: DataTypes.JSON,
    defaultValue: {
      showPastHistory: true,
      showDrugHistory: true,
      showInvestigations: true,
      showCounselling: true,
      showWarnings: true,
      showFollowUp: true,
      showSignature: true
    }
  }
});

module.exports = Clinic;
