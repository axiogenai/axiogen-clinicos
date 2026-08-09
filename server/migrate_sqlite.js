const s = require('./config/database');
async function run() {
  const cols = [
    'ALTER TABLE users ADD COLUMN reset_otp VARCHAR(255)',
    'ALTER TABLE users ADD COLUMN reset_otp_expires TIMESTAMP',
    'ALTER TABLE users ADD COLUMN passcode VARCHAR(255)',
    'ALTER TABLE Users ADD COLUMN reset_otp VARCHAR(255)',
    'ALTER TABLE Users ADD COLUMN reset_otp_expires TIMESTAMP',
    'ALTER TABLE Users ADD COLUMN passcode VARCHAR(255)'
  ];
  for (const c of cols) {
    try {
      await s.query(c);
      console.log('✅ Executed:', c);
    } catch (e) {
      console.log('ℹ️ Notice:', e.message);
    }
  }
  process.exit(0);
}
run();
