export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: 'Tablet' | 'Capsule' | 'Cream' | 'Ointment' | 'Gel' | 'Lotion' | 'Shampoo' | 'Solution' | 'Drops' | 'Injection' | 'Syrup' | 'Powder' | 'Soap';
  defaultFrequency: string;
  defaultDuration: string;
}

export const medicines: Medicine[] = [
  // Antibiotics
  { id: 'med_ab_01', name: 'Amoxicillin', strength: '500mg', form: 'Capsule', defaultFrequency: 'Thrice daily', defaultDuration: '5 Days' },
  { id: 'med_ab_02', name: 'Azithromycin', strength: '500mg', form: 'Tablet', defaultFrequency: 'Once daily', defaultDuration: '3 Days' },
  { id: 'med_ab_03', name: 'Doxycycline', strength: '100mg', form: 'Capsule', defaultFrequency: 'Twice daily', defaultDuration: '14 Days' },
  { id: 'med_ab_04', name: 'Cephalexin', strength: '500mg', form: 'Capsule', defaultFrequency: 'Twice daily', defaultDuration: '5 Days' },
  { id: 'med_ab_05', name: 'Erythromycin', strength: '250mg', form: 'Tablet', defaultFrequency: 'Four times daily', defaultDuration: '7 Days' },
  { id: 'med_ab_06', name: 'Clarithromycin', strength: '250mg', form: 'Tablet', defaultFrequency: 'Twice daily', defaultDuration: '7 Days' },
  { id: 'med_ab_07', name: 'Linezolid', strength: '600mg', form: 'Tablet', defaultFrequency: 'Twice daily', defaultDuration: '7 Days' },
  { id: 'med_ab_08', name: 'Clindamycin', strength: '300mg', form: 'Capsule', defaultFrequency: 'Thrice daily', defaultDuration: '5 Days' },
  { id: 'med_ab_09', name: 'Minocycline', strength: '50mg', form: 'Capsule', defaultFrequency: 'Once daily', defaultDuration: '30 Days' },
  
  // Antifungals
  { id: 'med_af_01', name: 'Fluconazole', strength: '150mg', form: 'Tablet', defaultFrequency: 'Once weekly', defaultDuration: '4 Weeks' },
  { id: 'med_af_02', name: 'Itraconazole', strength: '100mg', form: 'Capsule', defaultFrequency: 'Twice daily', defaultDuration: '2 Weeks' },
  { id: 'med_af_03', name: 'Terbinafine', strength: '250mg', form: 'Tablet', defaultFrequency: 'Once daily', defaultDuration: '4 Weeks' },
  { id: 'med_af_04', name: 'Griseofulvin', strength: '250mg', form: 'Tablet', defaultFrequency: 'Twice daily', defaultDuration: '4 Weeks' },
  { id: 'med_af_05', name: 'Clotrimazole', strength: '1%', form: 'Cream', defaultFrequency: 'Twice daily', defaultDuration: '2 Weeks' },
  { id: 'med_af_06', name: 'Ketoconazole', strength: '2%', form: 'Shampoo', defaultFrequency: 'Twice a week', defaultDuration: '4 Weeks' },
  { id: 'med_af_07', name: 'Luliconazole', strength: '1%', form: 'Cream', defaultFrequency: 'Once daily', defaultDuration: '2 Weeks' },
  { id: 'med_af_08', name: 'Ketoconazole', strength: '2%', form: 'Cream', defaultFrequency: 'Twice daily', defaultDuration: '2 Weeks' },
  { id: 'med_af_09', name: 'Econazole', strength: '1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '2 Weeks' },
  { id: 'med_af_10', name: 'Miconazole', strength: '2%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '2 Weeks' },
  { id: 'med_af_11', name: 'Amorolfine', strength: '5%', form: 'Solution', defaultFrequency: 'Once weekly', defaultDuration: '3 Months' },
  { id: 'med_af_12', name: 'Ciclopirox', strength: '8%', form: 'Solution', defaultFrequency: 'Once weekly', defaultDuration: '3 Months' },
  
  // Antihistamines
  { id: 'med_ah_01', name: 'Cetirizine', strength: '10mg', form: 'Tablet', defaultFrequency: 'OD (HS)', defaultDuration: '5 Days' },
  { id: 'med_ah_02', name: 'Levocetirizine', strength: '5mg', form: 'Tablet', defaultFrequency: 'OD (HS)', defaultDuration: '5 Days' },
  { id: 'med_ah_03', name: 'Fexofenadine', strength: '120mg', form: 'Tablet', defaultFrequency: 'OD (1-0-0)', defaultDuration: '5 Days' },
  { id: 'med_ah_04', name: 'Hydroxyzine', strength: '25mg', form: 'Tablet', defaultFrequency: 'OD (HS)', defaultDuration: '5 Days' },
  { id: 'med_ah_05', name: 'Desloratadine', strength: '5mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  { id: 'med_ah_06', name: 'Bilastine', strength: '20mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  { id: 'med_ah_07', name: 'Ebastine', strength: '10mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  { id: 'med_ah_08', name: 'Rupatadine', strength: '10mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  
  // Steroids
  { id: 'med_st_01', name: 'Prednisolone', strength: '10mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  { id: 'med_st_02', name: 'Methylprednisolone', strength: '8mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '5 Days' },
  { id: 'med_st_03', name: 'Betamethasone', strength: '0.1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '1 Week' },
  { id: 'med_st_04', name: 'Clobetasol', strength: '0.05%', form: 'Cream', defaultFrequency: 'OD', defaultDuration: '2 Weeks' },
  { id: 'med_st_05', name: 'Mometasone', strength: '0.1%', form: 'Cream', defaultFrequency: 'OD', defaultDuration: '2 Weeks' },
  { id: 'med_st_06', name: 'Hydrocortisone', strength: '1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '1 Week' },
  { id: 'med_st_07', name: 'Halobetasol', strength: '0.05%', form: 'Ointment', defaultFrequency: 'OD', defaultDuration: '2 Weeks' },
  { id: 'med_st_08', name: 'Desonide', strength: '0.05%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '1 Week' },
  { id: 'med_st_09', name: 'Fluticasone', strength: '0.05%', form: 'Cream', defaultFrequency: 'OD', defaultDuration: '2 Weeks' },
  
  // Retinoids & Acne Meds
  { id: 'med_rt_01', name: 'Isotretinoin', strength: '20mg', form: 'Capsule', defaultFrequency: 'OD (1-0-0)', defaultDuration: '30 Days' },
  { id: 'med_rt_02', name: 'Tretinoin', strength: '0.025%', form: 'Cream', defaultFrequency: 'OD (HS)', defaultDuration: '30 Days' },
  { id: 'med_rt_03', name: 'Adapalene', strength: '0.1%', form: 'Gel', defaultFrequency: 'OD (HS)', defaultDuration: '30 Days' },
  { id: 'med_ac_01', name: 'Benzoyl Peroxide', strength: '2.5%', form: 'Gel', defaultFrequency: 'OD (HS)', defaultDuration: '30 Days' },
  { id: 'med_ac_02', name: 'Clindamycin', strength: '1%', form: 'Gel', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_ac_03', name: 'Nadifloxacin', strength: '1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_ac_04', name: 'Azelaic Acid', strength: '10%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  
  // Hair meds
  { id: 'med_hr_01', name: 'Minoxidil', strength: '5%', form: 'Solution', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_hr_02', name: 'Finasteride', strength: '1mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_hr_03', name: 'Biotin', strength: '5mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_hr_04', name: 'Zinc Acetate', strength: '50mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  
  // Immunomodulators & Antivirals
  { id: 'med_im_01', name: 'Tacrolimus', strength: '0.1%', form: 'Ointment', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_im_02', name: 'Cyclosporine', strength: '50mg', form: 'Capsule', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_im_03', name: 'Pimecrolimus', strength: '1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_av_01', name: 'Acyclovir', strength: '400mg', form: 'Tablet', defaultFrequency: 'TDS', defaultDuration: '7 Days' },
  { id: 'med_av_02', name: 'Valacyclovir', strength: '1000mg', form: 'Tablet', defaultFrequency: 'TDS', defaultDuration: '7 Days' },
  { id: 'med_av_03', name: 'Famciclovir', strength: '250mg', form: 'Tablet', defaultFrequency: 'TDS', defaultDuration: '7 Days' },
  { id: 'med_av_04', name: 'Imiquimod', strength: '5%', form: 'Cream', defaultFrequency: 'Thrice a week', defaultDuration: '4 Weeks' },
  
  // Topicals
  { id: 'med_tp_01', name: 'Fusidic Acid', strength: '2%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '7 Days' },
  { id: 'med_tp_02', name: 'Mupirocin', strength: '2%', form: 'Ointment', defaultFrequency: 'BD', defaultDuration: '7 Days' },
  { id: 'med_tp_03', name: 'Silver Sulfadiazine', strength: '1%', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '7 Days' },
  { id: 'med_tp_04', name: 'Calamine', strength: '8%', form: 'Lotion', defaultFrequency: 'SOS', defaultDuration: '14 Days' },
  { id: 'med_tp_05', name: 'Permethrin', strength: '5%', form: 'Cream', defaultFrequency: 'Single Application', defaultDuration: '1 Day' },
  { id: 'med_tp_06', name: 'Salicylic Acid', strength: '6%', form: 'Ointment', defaultFrequency: 'OD', defaultDuration: '14 Days' },
  { id: 'med_tp_07', name: 'Hydroquinone', strength: '4%', form: 'Cream', defaultFrequency: 'OD (HS)', defaultDuration: '30 Days' },
  
  // Misc
  { id: 'med_ms_01', name: 'Sunscreen', strength: 'SPF 50', form: 'Lotion', defaultFrequency: 'BD (Daytime)', defaultDuration: '30 Days' },
  { id: 'med_ms_02', name: 'Moisturizer', strength: 'Ceramide-based', form: 'Cream', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_ms_03', name: 'Salicylic Acid', strength: '2%', form: 'Soap', defaultFrequency: 'BD', defaultDuration: '30 Days' },
  { id: 'med_ms_04', name: 'Coal Tar', strength: '1%', form: 'Shampoo', defaultFrequency: 'Twice a week', defaultDuration: '30 Days' },
  { id: 'med_ms_05', name: 'Ketoconazole+ZPTO', strength: '2%+1%', form: 'Shampoo', defaultFrequency: 'Twice a week', defaultDuration: '30 Days' },
  
  // Vitamins & Supplements
  { id: 'med_vt_01', name: 'Vitamin D3', strength: '60000 IU', form: 'Capsule', defaultFrequency: 'Once weekly', defaultDuration: '8 Weeks' },
  { id: 'med_vt_02', name: 'Iron + Folic Acid', strength: '100mg+1.5mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_vt_03', name: 'Calcium', strength: '500mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_vt_04', name: 'Vitamin C', strength: '500mg', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_vt_05', name: 'Vitamin E', strength: '400mg', form: 'Capsule', defaultFrequency: 'OD', defaultDuration: '30 Days' },
  { id: 'med_vt_06', name: 'Multivitamin', strength: 'Standard', form: 'Tablet', defaultFrequency: 'OD', defaultDuration: '30 Days' }
];
