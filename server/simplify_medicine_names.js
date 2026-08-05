const { sequelize, Medicine } = require('./models');

function simplifyMedicine(rawName, rawForm, rawStrength) {
  if (!rawName) return '';
  let name = rawName.trim();

  // 1. Strip raw pack sizes from title e.g. "15ML", "100ML", "15'S", "10'S", "1KIT", "20GM", "50GM", "100GM", "10ML", "2ML"
  name = name.replace(/\b\d+\s*('S|S|ML|GM|KIT|VIAL|AMP|AMP-2ML|AMP-1ML)\b/gi, '').trim();

  // 2. Strip duplicate form words at end like "Tab", "Cap", "Syp", "Inj", "Cream", "Gel", "Lotion", "Drops", "Powder"
  name = name.replace(/\b(Tab\.|Cap\.|Syp\.|Inj\.|Tab|Cap|Syp|Inj|Cream|Ointment|Lotion|Gel|Soap|Drops|Powder)\b/gi, '').trim();

  // 3. Clean up multiple spaces and dashes
  name = name.replace(/\s+/g, ' ').replace(/^[\s\-./\\]+/, '').replace(/[\s\-./\\]+$/, '').trim();

  // 4. Proper Case name
  name = name.split(' ').map(w => {
    if (!w) return '';
    if (/^\d+[A-Z%]+$/i.test(w) || /^[A-Z]{2,4}$/.test(w)) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');

  // 5. Build clean clinical title: [Prefix] [Clean Name] [Strength]
  let prefix = '';
  const f = (rawForm || '').toLowerCase();
  if (f.includes('tablet')) prefix = 'Tab.';
  else if (f.includes('capsule')) prefix = 'Cap.';
  else if (f.includes('syrup')) prefix = 'Syp.';
  else if (f.includes('injection')) prefix = 'Inj.';
  else if (f.includes('cream')) prefix = 'Cream';
  else if (f.includes('lotion')) prefix = 'Lotion';
  else if (f.includes('ointment') || f.includes('gel')) prefix = 'Gel / Ointment';
  else if (f.includes('soap')) prefix = 'Soap';
  else if (f.includes('drop')) prefix = 'Drops';

  let finalTitle = name;
  if (prefix && !finalTitle.toLowerCase().startsWith(prefix.toLowerCase())) {
    finalTitle = `${prefix} ${finalTitle}`;
  }

  return finalTitle.trim();
}

async function runSimplifier() {
  await sequelize.sync();
  console.log('🚀 Simplifying medicine names into clean clinical format...');

  const meds = await Medicine.findAll();
  let count = 0;
  const samples = [];

  const t = await sequelize.transaction();
  try {
    for (const m of meds) {
      const old = m.name;
      const clean = simplifyMedicine(m.name, m.form, m.strength);

      if (clean && clean !== old) {
        count++;
        m.name = clean;
        await m.save({ transaction: t });

        if (samples.length < 25) {
          samples.push({ old, clean });
        }
      }
    }
    await t.commit();
    console.log(`✅ Successfully simplified ${count} medicine names into clean clinical format!`);
    console.log('\n--- Before & After Simplification ---');
    samples.forEach((s, idx) => {
      console.log(`${String(idx + 1).padStart(2, ' ')}. [OLD]: "${s.old}"  👉  [CLEAN]: "${s.clean}"`);
    });
  } catch (err) {
    await t.rollback();
    console.error(err);
  }
}

runSimplifier().then(() => process.exit(0));
