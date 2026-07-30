const sequelize = require('../config/database');
const Clinic = require('./Clinic');
const User = require('./User');
const Patient = require('./Patient');
const Queue = require('./Queue');
const Medicine = require('./Medicine');
const Template = require('./Template');
const CasePaper = require('./CasePaper');
const AuditLog = require('./AuditLog');

// Define Relationships & Foreign Keys (with constraints: false to prevent SQLite FK locks)
Clinic.hasMany(User, { foreignKey: 'clinicId', constraints: false });
User.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });

Clinic.hasMany(Patient, { foreignKey: 'clinicId', constraints: false });
Patient.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });

Clinic.hasMany(Queue, { foreignKey: 'clinicId', constraints: false });
Queue.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });
Patient.hasMany(Queue, { foreignKey: 'patientId', constraints: false });
Queue.belongsTo(Patient, { foreignKey: 'patientId', constraints: false });

Clinic.hasMany(Template, { foreignKey: 'clinicId', constraints: false });
Template.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });
User.hasMany(Template, { foreignKey: 'doctorId', constraints: false });
Template.belongsTo(User, { foreignKey: 'doctorId', constraints: false });

Clinic.hasMany(CasePaper, { foreignKey: 'clinicId', constraints: false });
CasePaper.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });
Patient.hasMany(CasePaper, { foreignKey: 'patientId', constraints: false });
CasePaper.belongsTo(Patient, { foreignKey: 'patientId', constraints: false });
User.hasMany(CasePaper, { foreignKey: 'doctorId', constraints: false });
CasePaper.belongsTo(User, { foreignKey: 'doctorId', constraints: false });

Clinic.hasMany(AuditLog, { foreignKey: 'clinicId', constraints: false });
AuditLog.belongsTo(Clinic, { foreignKey: 'clinicId', constraints: false });
User.hasMany(AuditLog, { foreignKey: 'userId', constraints: false });
AuditLog.belongsTo(User, { foreignKey: 'userId', constraints: false });

module.exports = {
  sequelize,
  Clinic,
  User,
  Patient,
  Queue,
  Medicine,
  Template,
  CasePaper,
  AuditLog
};
