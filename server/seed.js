const { sequelize, Clinic, User, Patient, Queue, Medicine, Template, CasePaper } = require('./models');

async function seedDatabase() {
  try {
    console.log('Syncing database schema...');
    await sequelize.sync({ force: true });
    console.log('Database schema synced successfully.');

    // 1. Create Default Clinic
    const clinic = await Clinic.create({
      id: 1,
      nameEn: 'स्किन & कॉस्मेटीक क्लिनिक',
      nameHi: 'शिनगारे',
      logoUrl: '',
      address: 'एस.टी.स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. 6, पेठ वडगांव',
      phone: '7249727104 / 9657727104',
      openingHours: 'सकाळी १० ते सायं. ६ पर्यंत',
      closedDay: 'दर रविवारी बंद राहिल.',
      headerBgColor: '#89b740',
      headerTextColor: '#FFFFFF',
      pharmacyInfo: ''
    });

    // 2. Create Doctors & Staff Users
    const bcrypt = require('bcryptjs');

    const doc1 = await User.create({
      clinicId: 1,
      email: 'shingare.pramod17@gmail.com',
      passwordHash: bcrypt.hashSync('clinic123', 10),
      name: 'डॉ. प्रमोद सुरेश शिनगारे',
      phone: '9561896943',
      role: 'doctor',
      title: 'MD (Ayu) - D.Dermatology (Ay.)',
      subTitle: '(MUHS)',
      regNo: 'Reg. No. I-87218-A',
      specialty: 'त्वचारोग व सौंदर्य विशेष तज्ज्ञ'
    });

    const doc2 = await User.create({
      clinicId: 1,
      email: 'priyanka@shingareclinic.com',
      passwordHash: bcrypt.hashSync('doctor123', 10),
      name: 'डॉ. प्रियांका प्रमोद शिनगारे',
      phone: '7249727104',
      role: 'doctor',
      title: 'BHMS, FCHD (MUHS)',
      subTitle: '(Consultant Homeopathy Dermatologist)',
      regNo: 'Reg. No. 73338',
      specialty: 'त्वचारोग तज्ज्ञ'
    });

    const doc3 = await User.create({
      clinicId: 1,
      email: 'pramod@shingareclinic.com',
      passwordHash: bcrypt.hashSync('clinic123', 10),
      name: 'डॉ. प्रमोद सुरेश शिनगारे',
      phone: '9561896943',
      role: 'doctor',
      title: 'MD (Ayu) - D.Dermatology (Ay.)',
      subTitle: '(MUHS)',
      regNo: 'Reg. No. I-87218-A',
      specialty: 'त्वचारोग व सौंदर्य विशेष तज्ज्ञ'
    });

    const receptionist = await User.create({
      clinicId: 1,
      email: 'shingareskinclinic@gmail.com',
      passwordHash: bcrypt.hashSync('reception123', 10),
      name: 'Reception Desk',
      phone: '7972884083',
      role: 'receptionist'
    });

    // 3. Create Sample Medicines
    await Medicine.bulkCreate([
      { id: 'm1', name: 'Tab. Itraconazole 200mg', dosage: '200mg', frequency: '1-0-1 (BD) After Meals', duration: '14 Days', category: 'Antifungal' },
      { id: 'm2', name: 'Luliconazole 1% Cream', dosage: '1%', frequency: 'Apply 1-0-1 (BD) Clean & Dry area', duration: '21 Days', category: 'Topical Antifungal' },
      { id: 'm3', name: 'Tab. Levocetirizine 5mg', dosage: '5mg', frequency: '0-0-1 (HS) At Bedtime', duration: '10 Days', category: 'Antihistamine' },
      { id: 'm4', name: 'Ketoconazole Soap 2%', dosage: '2%', frequency: 'Use during morning bath daily', duration: '30 Days', category: 'Medicated Soap' },
      { id: 'm5', name: 'Tab. Doxycycline 100mg', dosage: '100mg', frequency: '1-0-1 (BD) After Meals', duration: '14 Days', category: 'Antibiotic' },
      { id: 'm6', name: 'Adapalene 0.1% Gel', dosage: '0.1%', frequency: 'Nightly application (HS)', duration: '30 Days', category: 'Acne Topical' },
      { id: 'm7', name: 'Clindamycin 1% Gel', dosage: '1%', frequency: 'Morning application (OD)', duration: '30 Days', category: 'Acne Topical' },
      { id: 'm8', name: 'Salicylic Acid Face Wash 2%', dosage: '2%', frequency: 'Twice daily face wash', duration: '30 Days', category: 'Cleanser' },
      { id: 'm9', name: 'Clobetasol Propionate 0.05%', dosage: '0.05%', frequency: 'Apply 1-0-1 (BD) Thin layer', duration: '7 Days', category: 'Corticosteroid' },
      { id: 'm10', name: 'Emollient Cream (Ceramide)', dosage: 'Apply liberal', frequency: '3 to 4 times daily', duration: '60 Days', category: 'Moisturizer' }
    ]);

    // 4. Create Initial Patients
    await Patient.bulkCreate([
      {
        id: 'PT0001',
        clinicId: 1,
        name: 'Sunita Deshmukh',
        age: 38,
        gender: 'F',
        phone: '9822012345',
        village: 'Peth Vadgaon',
        pastHistory: 'Hypertension (Controlled on Telmisartan 40mg)',
        allergies: 'No known drug allergies (NKDA)'
      },
      {
        id: 'PT0002',
        clinicId: 1,
        name: 'Aditya Patil',
        age: 26,
        gender: 'M',
        phone: '9764512389',
        village: 'Shirala, Sangli',
        pastHistory: 'DM Type 2',
        allergies: 'Penicillin'
      },
      {
        id: 'PT0003',
        clinicId: 1,
        name: 'Pooja Chavan',
        age: 19,
        gender: 'F',
        phone: '9921045678',
        village: 'Warna Nagar',
        pastHistory: 'Nil',
        allergies: 'Nil'
      }
    ]);

    // 5. Create Initial Queue
    const todayDate = new Date().toISOString().split('T')[0];

    await Queue.bulkCreate([
      {
        queueId: 'Q001',
        clinicId: 1,
        patientId: 'PT0001',
        name: 'Sunita Deshmukh',
        age: 38,
        phone: '9822012345',
        village: 'Peth Vadgaon',
        date: todayDate,
        timeAdded: '09:30 AM',
        complaint: 'Severe itching & ringworm on abdomen since 3 weeks',
        status: 'completed'
      },
      {
        queueId: 'Q002',
        clinicId: 1,
        patientId: 'PT0002',
        name: 'Aditya Patil',
        age: 26,
        phone: '9764512389',
        village: 'Shirala, Sangli',
        date: todayDate,
        timeAdded: '10:15 AM',
        complaint: 'Facial acne vulgaris & blackheads',
        status: 'completed'
      },
      {
        queueId: 'Q003',
        clinicId: 1,
        patientId: 'PT0003',
        name: 'Pooja Chavan',
        age: 19,
        phone: '9921045678',
        village: 'Warna Nagar',
        date: todayDate,
        timeAdded: '10:45 AM',
        complaint: 'Eczema patches on neck and elbows',
        status: 'completed'
      }
    ]);

    // 6. Create Clinical Templates
    const today = new Date().toISOString().split('T')[0];

    await Template.bulkCreate([
      {
        id: 'tpl_1',
        clinicId: 1,
        doctorId: doc1.id,
        name: 'Fungal Infection (Tinea Cruris / Corporis)',
        category: 'Infectious Dermatology',
        description: 'Standard 14-day oral & topical antifungal protocol for ringworm infections.',
        isFavorite: true,
        createdDate: today,
        updatedDate: today,
        medicines: [
          { medicineId: 'm1', name: 'Tab. Itraconazole 200mg', dosage: '200mg', frequency: '1-0-1 (BD) After Meals', duration: '14 Days' },
          { medicineId: 'm2', name: 'Luliconazole 1% Cream', dosage: '1%', frequency: 'Apply 1-0-1 (BD) Clean & Dry area', duration: '21 Days' },
          { medicineId: 'm3', name: 'Tab. Levocetirizine 5mg', dosage: '5mg', frequency: '0-0-1 (HS) At Bedtime', duration: '10 Days' },
          { medicineId: 'm4', name: 'Ketoconazole Soap 2%', dosage: '2%', frequency: 'Use during morning bath daily', duration: '30 Days' }
        ],
        investigationsAdvised: ['CBC', 'LFT', 'BSL(R)'],
        counsellingDone: [
          'Avoid sharing towels or soap with family members',
          'Wear loose cotton clothing and keep affected skin dry',
          'Complete full 14 days anti-fungal course even if rash fades'
        ]
      },
      {
        id: 'tpl_2',
        clinicId: 1,
        doctorId: doc1.id,
        name: 'Acne Vulgaris (Grade II/III)',
        category: 'Cosmetic Dermatology',
        description: 'Combination retinoid & topical antibiotic protocol for inflammatory acne.',
        isFavorite: true,
        createdDate: today,
        updatedDate: today,
        medicines: [
          { medicineId: 'm5', name: 'Tab. Doxycycline 100mg', dosage: '100mg', frequency: '1-0-1 (BD) After Meals', duration: '14 Days' },
          { medicineId: 'm6', name: 'Adapalene 0.1% Gel', dosage: '0.1%', frequency: 'Nightly application (HS)', duration: '30 Days' },
          { medicineId: 'm7', name: 'Clindamycin 1% Gel', dosage: '1%', frequency: 'Morning application (OD)', duration: '30 Days' },
          { medicineId: 'm8', name: 'Salicylic Acid Face Wash 2%', dosage: '2%', frequency: 'Twice daily face wash', duration: '30 Days' }
        ],
        investigationsAdvised: ['CBC', 'Serum Creatinine'],
        counsellingDone: [
          'Do not squeeze or pick facial pimples',
          'Apply sunscreen before sun exposure',
          'Expect mild dry lips in early treatment phase'
        ]
      },
      {
        id: 'tpl_3',
        clinicId: 1,
        doctorId: doc2.id,
        name: 'Atopic Eczema / Contact Dermatitis',
        category: 'Inflammatory Dermatology',
        description: 'Short-course topical steroid + barrier repair emollient protocol.',
        isFavorite: false,
        createdDate: today,
        updatedDate: today,
        medicines: [
          { medicineId: 'm9', name: 'Clobetasol Propionate 0.05%', dosage: '0.05%', frequency: 'Apply 1-0-1 (BD) Thin layer', duration: '7 Days' },
          { medicineId: 'm10', name: 'Emollient Cream (Ceramide)', dosage: 'Apply liberal', frequency: '3 to 4 times daily', duration: '60 Days' },
          { medicineId: 'm3', name: 'Tab. Levocetirizine 5mg', dosage: '5mg', frequency: '0-0-1 (HS) At Bedtime', duration: '14 Days' }
        ],
        investigationsAdvised: ['CBC', 'IgE Levels'],
        counsellingDone: [
          'Apply moisturizer immediately after bathing on damp skin',
          'Avoid harsh scented soaps and hot water baths',
          'Use steroid cream strictly for maximum 7 days'
        ]
      }
    ]);

    console.log('Database seeded successfully with initial clinic, doctor accounts, patients, queue, and templates!');
    process.exit(0);
  } catch (err) {
    console.error('Failed to seed database:', err);
    process.exit(1);
  }
}

seedDatabase();
