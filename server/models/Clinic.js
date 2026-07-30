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
    allowNull: false
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
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false
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
