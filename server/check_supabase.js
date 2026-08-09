const { Sequelize } = require('sequelize');
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

async function check() {
  const s = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    dialectOptions: { ssl: { require: true, rejectUnauthorized: false } },
    logging: false
  });

  try {
    await s.authenticate();
    console.log('✅ Connected to Supabase');

    const [tables] = await s.query("SELECT tablename FROM pg_tables WHERE schemaname='public'");
    console.log('Tables:', tables.map(t => t.tablename));

    for (const t of tables) {
      const [c] = await s.query(`SELECT COUNT(*) as cnt FROM "${t.tablename}"`);
      console.log(`  ${t.tablename}: ${c[0].cnt} rows`);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await s.close();
    process.exit(0);
  }
}
check();
