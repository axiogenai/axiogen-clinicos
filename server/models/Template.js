const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'General'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  updatedDate: {
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
  }
});

module.exports = Template;
