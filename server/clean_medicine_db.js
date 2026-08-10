const { sequelize, Medicine } = require('./models');

function cleanMedicineName(rawName, rawForm = '') {
  if (!rawName) return '';
  let name = rawName.trim();

  // 1. Remove all nested/repeated bracket postfixes e.g. (Tablet 10 TAB...), (Cipla), (Sun Pharma), (Tablet), (Tab)
  let prev;
  do {
    prev = name;
    name = name.replace(/\s*\([^)]*\)?/gi, '');
  } while (name !== prev);

  // Remove trailing orphan closing brackets or opening brackets
  name = name.replace(/[\(\)]+/g, ' ');

  // 2. Strip company / manufacturer suffixes if separated by dashes or commas or spaces
  name = name.replace(/[\s\-\,]+(sun pharma|cipla|lupin|torrent|glenmark|mankind|alkem|intas|abbott|zydus|micro labs|ipca|cadila|dr reddy|pfizer|glaxo|sanofi|bayer|macleods|leeford|hetero|emcure|cachet|blue cross|apex|aristo|troikaa|biocon|astrazeneca)\b.*/gi, '');

  // 3. Strip packing quantities e.g. "10 TAB", "10 TAB S", "10'S", "15'S", "1X10", "10 CAPS", "10 STRIP", "100 ML", "15 ML", "20 GM", "50 GM", "1 KIT"
  name = name.replace(/\b\d+\s*(x\d+|\'s|s|tab|tabs|tablet|tablets|cap|caps|capsule|capsules|strip|strips|ml|gm|gram|grams|kit|kits|vial|vials|amp|ampoule|amp-2ml|amp-1ml)\b.*/gi, '');

  // 4. Strip duplicate form words at end e.g. "Tablet", "Capsule", "Tab", "Cap", "Syp", "Inj", "Cream", "Gel", "Lotion", "Ointment"
  name = name.replace(/\b(Tablet|Tablets|Capsule|Capsules|Tab|Cap|Syp|Inj|Cream|Ointment|Lotion|Gel|Soap|Drops|Powder)\b.*/gi, '');

  // 5. Clean up multiple spaces, dots, and trailing symbols
  name = name.replace(/\s+/g, ' ').replace(/^[\s\-./\\]+/, '').replace(/[\s\-./\\:]+$/, '').trim();

  // 6. Formatting: Fix Tab./Cap./Syp. prefix if needed
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

  let finalTitle = name;
  if (prefix && !finalTitle.toLowerCase().startsWith(prefix.toLowerCase())) {
    if (!/^(tab|cap|syp|inj|cream|lotion|gel|soap|drops)\.?\s+/i.test(finalTitle)) {
      finalTitle = `${prefix} ${finalTitle}`;
    }
  }

  // Final Proper Case formatting
  finalTitle = finalTitle.split(' ').map(w => {
    if (!w) return '';
    if (/^\d+[A-Z%]*$/i.test(w) || /^[A-Z]{2,4}$/.test(w) || w === 'Tab.' || w === 'Cap.' || w === 'Syp.' || w === 'Inj.') return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');

  return finalTitle.trim();
}

async function cleanMedicineDatabase() {
  await sequelize.sync();
  console.log('🧹 Cleaning medicine names in Database (stripping company names, packing quantities, and brackets)...');

  const meds = await Medicine.findAll();
  let count = 0;
  const samples = [];

  const t = await sequelize.transaction();
  try {
    for (const m of meds) {
      const old = m.name;
      const clean = cleanMedicineName(m.name, m.form);

      if (clean && clean !== old) {
        count++;
        m.name = clean;
        await m.save({ transaction: t });

        if (samples.length < 30) {
          samples.push({ old, clean });
        }
      }
    }
    await t.commit();
    console.log(`✅ Cleaned ${count} medicine names in the database!`);
    console.log('\n--- Before & After Cleaning Samples ---');
    samples.forEach((s, idx) => {
      console.log(`${String(idx + 1).padStart(2, ' ')}. [OLD]: "${s.old}"\n    [CLEAN]: "${s.clean}"\n`);
    });
  } catch (err) {
    await t.rollback();
    console.error('❌ Cleaning failed:', err);
  }
}

module.exports = { cleanMedicineName };

if (require.main === module) {
  cleanMedicineDatabase().then(() => process.exit(0));
}
