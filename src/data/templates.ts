export interface TemplateMedicine {
  medicineId: string;
  medicineName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  count?: string | number;
  isManualCount?: boolean;
}

export interface CaseTemplate {
  id: string;
  doctorId?: string;
  name: string;
  description?: string;
  medicines: TemplateMedicine[];
  investigationsAdvised: string[];
  counsellingPoints: string[];
  isFavorite?: boolean;
  createdDate?: string;
  updatedDate?: string;
}

export const templates: CaseTemplate[] = [
  {
    id: 'tpl_01',
    name: 'Acne - Mild',
    description: 'Standard protocol for mild acne',
    isFavorite: true,
    createdDate: '2026-07-20',
    medicines: [
      { medicineId: 'med_ab_03', dosage: '100mg', frequency: 'सकाळी १ व रात्री १ घेणे', duration: '14 Days' }, // Doxycycline
      { medicineId: 'med_rt_03', dosage: '0.1%', frequency: 'रात्री झोपताना लावणे', duration: '30 Days' }, // Adapalene Gel
      { medicineId: 'med_ac_02', dosage: '1%', frequency: 'सकाळी १ व रात्री १ लावणे', duration: '30 Days' }, // Clindamycin Gel
      { medicineId: 'med_ms_01', dosage: 'SPF 50', frequency: 'सकाळी लावणे', duration: '30 Days' } // Sunscreen
    ],
    investigationsAdvised: [],
    counsellingPoints: [
      'Avoid popping or squeezing pimples.',
      'Use sunscreen daily, reapply every 3 hours outdoors.',
      'Apply Adapalene at night, use a pea-sized amount for the entire face.'
    ]
  },
  {
    id: 'tpl_02',
    name: 'Acne - Severe',
    description: 'Protocol for severe cystic acne',
    isFavorite: false,
    createdDate: '2026-07-20',
    medicines: [
      { medicineId: 'med_rt_01', dosage: '20mg', frequency: 'सकाळी १ घेणे', duration: '30 Days' }, // Isotretinoin
      { medicineId: 'med_ms_01', dosage: 'SPF 50', frequency: 'सकाळी लावणे', duration: '30 Days' }, // Sunscreen
      { medicineId: 'med_ms_02', dosage: 'मलम', frequency: 'सकाळी व रात्री लावणे', duration: '30 Days' } // Moisturizer
    ],
    investigationsAdvised: ['Lipid Profile', 'Liver Function Test (LFT)'],
    counsellingPoints: [
      'Strictly avoid pregnancy while on Isotretinoin and for 1 month after stopping.',
      'Expect dry lips and skin; use moisturizer frequently.',
      'Follow up with blood test reports next month.'
    ]
  },
  {
    id: 'tpl_03',
    name: 'Fungal Infection (Skin)',
    description: 'Treatment for Tinea Corporis / Cruris',
    isFavorite: true,
    createdDate: '2026-07-20',
    medicines: [
      { medicineId: 'med_af_03', dosage: '250mg', frequency: 'सकाळी १ घेणे', duration: '4 Weeks' }, // Terbinafine
      { medicineId: 'med_af_07', dosage: '1%', frequency: 'सकाळी लावणे', duration: '2 Weeks' }, // Luliconazole cream
      { medicineId: 'med_ah_01', dosage: '10mg', frequency: 'रात्री झोपताना घेणे', duration: '5 Days' } // Cetirizine
    ],
    investigationsAdvised: [],
    counsellingPoints: [
      'Keep the affected area clean and dry.',
      'Do not share towels or clothes.',
      'Iron clothes inside out after washing.'
    ]
  },
  {
    id: 'tpl_04',
    name: 'Hair Fall',
    description: 'General management for androgenetic alopecia',
    isFavorite: false,
    createdDate: '2026-07-20',
    medicines: [
      { medicineId: 'med_hr_01', dosage: '5%', frequency: 'सकाळी १ml रात्री १ml डोक्यात लावणे', duration: '3 Months' }, // Minoxidil
      { medicineId: 'med_hr_02', dosage: '1mg', frequency: 'सकाळी १ घेणे', duration: '3 Months' }, // Finasteride
      { medicineId: 'med_hr_03', dosage: '5mg', frequency: 'सकाळी १ घेणे', duration: '3 Months' }, // Biotin
      { medicineId: 'med_hr_04', dosage: '50mg', frequency: 'सकाळी १ घेणे', duration: '3 Months' } // Zinc
    ],
    investigationsAdvised: ['CBC', 'Thyroid Profile (TSH)', 'Serum Ferritin'],
    counsellingPoints: [
      'Apply Minoxidil directly to the scalp, not just the hair.',
      'Initial shedding of hair may occur in the first few weeks of Minoxidil use.',
      'Maintain a healthy, protein-rich diet.'
    ]
  },
  {
    id: 'tpl_05',
    name: 'Eczema / Dermatitis',
    description: 'Topical management for Atopic Dermatitis',
    isFavorite: false,
    createdDate: '2026-07-20',
    medicines: [
      { medicineId: 'med_st_05', dosage: '0.1%', frequency: 'रात्री लावणे', duration: '2 Weeks' }, // Mometasone cream
      { medicineId: 'med_ah_01', dosage: '10mg', frequency: 'रात्री झोपताना घेणे', duration: '7 Days' }, // Cetirizine
      { medicineId: 'med_ms_02', dosage: 'मलम', frequency: 'सकाळी व रात्री लावणे', duration: '30 Days' }, // Moisturizer
      { medicineId: 'med_im_01', dosage: '0.1%', frequency: 'सकाळी १ व रात्री १ लावणे', duration: '30 Days' } // Tacrolimus
    ],
    investigationsAdvised: [],
    counsellingPoints: [
      'Avoid hot water baths; use lukewarm water.',
      'Moisturize immediately after bathing while the skin is slightly damp.',
      'Avoid scratching to prevent secondary infections.'
    ]
  }
];
