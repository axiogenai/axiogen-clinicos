const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Medicine = sequelize.define('Medicine', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  productId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  brand: {
    type: DataTypes.STRING,
    allowNull: true
  },
  strength: {
    type: DataTypes.STRING,
    allowNull: true
  },
  form: {
    type: DataTypes.STRING,
    allowNull: true
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  frequency: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.STRING,
    allowNull: true
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true
  },
  stockQty: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiryDate: {
    type: DataTypes.STRING,
    allowNull: true
  },
  availability: {
    type: DataTypes.STRING,
    defaultValue: 'In Stock'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
});

module.exports = Medicine;
