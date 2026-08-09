const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  clinicId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM('admin', 'doctor', 'receptionist'),
    defaultValue: 'receptionist'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true
  },
  subTitle: {
    type: DataTypes.STRING,
    allowNull: true
  },
  regNo: {
    type: DataTypes.STRING,
    allowNull: true
  },
  specialty: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  resetOTP: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'reset_otp'
  },
  resetOTPExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'reset_otp_expires'
  },
  passcode: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'clinic123'
  }
});

User.beforeCreate(async (user) => {
  if (user.passwordHash && !user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash') && !user.passwordHash.startsWith('$2a$') && !user.passwordHash.startsWith('$2b$')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 10);
  }
});

User.prototype.verifyPassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = User;
