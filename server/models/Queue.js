const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Queue = sequelize.define('Queue', {
  queueId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  patientId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  village: {
    type: DataTypes.STRING,
    allowNull: true
  },
  timeAdded: {
    type: DataTypes.STRING,
    allowNull: true
  },
  complaint: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  date: {
    type: DataTypes.STRING,
    defaultValue: () => new Date().toISOString().split('T')[0]
  },
  status: {
    type: DataTypes.ENUM('waiting', 'in-consultation', 'in_consultation', 'completed', 'cancelled'),
    defaultValue: 'waiting'
  },
  paymentStatus: {
    type: DataTypes.STRING,
    defaultValue: 'unpaid'
  },
  paymentMode: {
    type: DataTypes.STRING,
    defaultValue: 'cash'
  },
  casePaperNo: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'case_paper_no'
  }
});

module.exports = Queue;
