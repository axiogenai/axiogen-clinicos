const { User, sequelize } = require('./models');
const bcrypt = require('bcryptjs');

async function updateDbPasswords() {
  const hash = await bcrypt.hash('clinic123', 10);
  
  const rec = await User.findOne({
    where: { email: 'shingareskinclinic@gmail.com' }
  });
  if (rec) {
    rec.passwordHash = hash;
    await rec.save();
    console.log('Updated shingareskinclinic@gmail.com password in DB to clinic123');
  }

  const docHash = await bcrypt.hash('adi.patil#1', 10);
  const doc = await User.findOne({
    where: { email: 'shingare.pramod17@gmail.com' }
  });
  if (doc) {
    doc.passwordHash = docHash;
    await doc.save();
    console.log('Updated shingare.pramod17@gmail.com password in DB');
  }
}

updateDbPasswords().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
