const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');
const fs = require('fs');

async function runSupabaseMigration() {
  console.log('🚀 ===================================================');
  console.log('📦  ClinicOS -> Supabase PostgreSQL Bulk Migrator    ');
  console.log('===================================================');

  const supabaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!supabaseUrl || !supabaseUrl.startsWith('postgres')) {
    console.error('\n❌ ERROR: No Supabase DATABASE_URL provided!');
    process.exit(1);
  }

  // 1. Connect to Local SQLite
  const sqlitePath = path.resolve(__dirname, 'database.sqlite');
  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ Local SQLite database.sqlite not found at:', sqlitePath);
    process.exit(1);
  }

  // 2. Connect to Supabase PostgreSQL
  console.log('🔌 Connecting to Supabase PostgreSQL...');
  const supabaseSequelize = new Sequelize(supabaseUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false,
    define: { timestamps: true, underscored: true }
  });

  try {
    await supabaseSequelize.authenticate();
    console.log('✅ Connected to Supabase PostgreSQL successfully!');

    // Initialize models for SQLite first to fetch data
    const sqliteModels = require('./models');
    
    // Sync schemas on Supabase
    console.log('⚙️ Creating database tables & schema on Supabase...');
    const { sequelize, ...ModelList } = require('./models');
    
    for (const key of Object.keys(ModelList)) {
      ModelList[key].init(ModelList[key].rawAttributes, {
        sequelize: supabaseSequelize,
        modelName: ModelList[key].name,
        tableName: ModelList[key].tableName,
        timestamps: true,
        underscored: true
      });
    }

    await supabaseSequelize.sync({ force: false, alter: true });
    console.log('✅ Supabase database schema ready!');

    const models = ['Clinic', 'User', 'Patient', 'Queue', 'Medicine', 'Template', 'CasePaper', 'AuditLog'];

    for (const modelName of models) {
      console.log(`\n📦 Migrating table [${modelName}]...`);
      
      const TargetModel = ModelList[modelName];
      const existingSupabaseCount = await TargetModel.count();

      if (existingSupabaseCount > 0 && modelName === 'Medicine') {
        console.log(`  ℹ️ [Medicine] already has ${existingSupabaseCount} records in Supabase. Skipping re-insertion.`);
        continue;
      }

      // Query raw records from SQLite
      const [records] = await sqliteModels.sequelize.query(`SELECT * FROM ${TargetModel.tableName}`);
      if (!records || records.length === 0) {
        console.log(`  ℹ️ No records found for ${modelName} in SQLite.`);
        continue;
      }

      console.log(`  Found ${records.length} records in SQLite. Processing & inserting into Supabase...`);

      const cleanRecords = records.map(r => {
        const item = { ...r };

        if (item.id === null || item.id === undefined) delete item.id;
        if (item.queueId === null || item.queueId === undefined) delete item.queueId;
        if (item.queue_id === null || item.queue_id === undefined) delete item.queue_id;

        if (modelName !== 'Medicine') {
          item.clinicId = item.clinicId || item.clinic_id || 1;
        }

        if (modelName === 'User') {
          item.clinicId = item.clinicId || item.clinic_id || 1;
          if (item.password_hash && !item.passwordHash) item.passwordHash = item.password_hash;
          if (item.sub_title && !item.subTitle) item.subTitle = item.sub_title;
          if (item.reg_no && !item.regNo) item.regNo = item.reg_no;
          if (item.is_active !== undefined && item.isActive === undefined) item.isActive = item.is_active;
        }

        if (modelName === 'Queue') {
          if (!item.queueId && item.queue_id) item.queueId = item.queue_id;
          if (!item.patientId && item.patient_id) item.patientId = item.patient_id;
        }

        if (modelName === 'Clinic') {
          item.nameEn = item.nameEn || item.name_en || 'Clinics';
          item.nameHi = item.nameHi || item.name_hi || '';
          item.logoUrl = item.logoUrl || item.logo_url || '';
          item.address = item.address || '';
          item.phone = item.phone || '';
          item.headerBgColor = item.headerBgColor || item.header_bg_color || '#7CB342';
          item.headerTextColor = item.headerTextColor || item.header_text_color || '#FFFFFF';
          if (typeof item.sections === 'string') {
            try { item.sections = JSON.parse(item.sections); } catch (e) {}
          }
        }

        if (modelName === 'CasePaper') {
          if (typeof item.medicines === 'string') {
            try { item.medicines = JSON.parse(item.medicines); } catch (e) { item.medicines = []; }
          }
          if (typeof item.investigations_advised === 'string') {
            try { item.investigationsAdvised = JSON.parse(item.investigations_advised); } catch (e) { item.investigationsAdvised = []; }
          }
          if (typeof item.counselling_done === 'string') {
            try { item.counsellingDone = JSON.parse(item.counselling_done); } catch (e) { item.counsellingDone = []; }
          }
          if (!item.patientId && item.patient_id) item.patientId = item.patient_id;
          if (!item.doctorId && item.doctor_id) item.doctorId = item.doctor_id;
          if (!item.queueId && item.queue_id) item.queueId = item.queue_id;
          if (!item.templateId && item.template_id) item.templateId = item.template_id;
          if (!item.followUpDate && item.follow_up_date) item.followUpDate = item.follow_up_date;
        }

        return item;
      });

      const chunkSize = 1000;
      let insertedCount = 0;

      for (let i = 0; i < cleanRecords.length; i += chunkSize) {
        const chunk = cleanRecords.slice(i, i + chunkSize);
        await TargetModel.bulkCreate(chunk, { ignoreDuplicates: true });
        insertedCount += chunk.length;
        if (insertedCount % 5000 === 0 || insertedCount >= cleanRecords.length) {
          console.log(`    Migrated ${insertedCount} / ${cleanRecords.length} [${modelName}] rows...`);
        }
      }

      const supabaseCount = await TargetModel.count();
      console.log(`  🎉 ${modelName} migration complete! Supabase record count: ${supabaseCount}`);
    }

    // Add search indexes on Supabase Medicines table
    console.log('\n⚡ Building search indexes on Supabase Medicines table...');
    await supabaseSequelize.query('CREATE INDEX IF NOT EXISTS idx_supabase_medicines_name ON medicines(name);');
    await supabaseSequelize.query('CREATE INDEX IF NOT EXISTS idx_supabase_medicines_brand ON medicines(brand);');

    console.log('\n===================================================');
    console.log('🎉 MIGRATION SUCCESSFUL! All data is now live on Supabase!');
    console.log('===================================================\n');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await supabaseSequelize.close();
  }
}

runSupabaseMigration();
