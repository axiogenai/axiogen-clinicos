const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function checkAndFixUsers() {
  const users = await User.findAll();
  console.log('Current users in DB:');
  for (const u of users) {
    const matchesReception123 = await bcrypt.compare('reception123', u.passwordHash).catch(() => u.passwordHash === 'reception123');
    const matchesClinic123 = await bcrypt.compare('clinic123', u.passwordHash).catch(() => u.passwordHash === 'clinic123');
    const matchesAdi = await bcrypt.compare('adi.patil#1', u.passwordHash).catch(() => u.passwordHash === 'adi.patil#1');
    console.log(`User: ${u.email} (${u.role}) -> matches reception123: ${matchesReception123}, matches clinic123: ${matchesClinic123}, matches adi.patil#1: ${matchesAdi}`);
  }
}

checkAndFixUsers().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
