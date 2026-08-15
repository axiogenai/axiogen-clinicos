import { useState, useRef, useEffect, useMemo } from 'react';
import { Pill, FlaskConical, Lightbulb, Calendar, ArrowLeft, Printer, Trash2, CheckCircle2, Search, Plus, X, ChevronDown, FileText, Languages, Loader2, Sparkles } from 'lucide-react';
import type { Patient } from '../data/patients';
import { medicines as initialLocalMedicines } from '../data/medicines';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import type { CasePaper, CasePaperMedicine } from '../types';
import MedicineImportModal from './MedicineImportModal';
import ReprintPreview from './ReprintPreview';
import PatientEMRHistoryModal from './PatientEMRHistoryModal';
import AddCustomMedicineModal from './AddCustomMedicineModal';
import ConfirmModal from './ConfirmModal';

import { calculateMedicineCount } from '../utils/countCalculator';
import { translateFrequencyToMarathi } from '../utils/marathiTranslator';
import { parsePrescriptionSentence, parseSentenceWithGroqAI } from '../utils/sentenceParser';

interface CasepaperFormProps {
  patient: Patient;
  queueId?: string | null;
  casePaper: CasePaper;
  onUpdateCasePaper: (cp: CasePaper) => void;
  onBack: () => void;
}

const FREQUENCIES = [
  'सकाळी १ व रात्री १ घेणे',
  'सकाळी १ घेणे',
  'रात्री १ घेणे',
  'दुपारी १ घेणे',
  'सकाळी १, दुपारी १ व रात्री १ घेणे',
  'दिवसातून ४ वेळा घेणे',
  '१ गोळी सकाळी १ गोळी रात्री घेणे',
  '१/२ गोळी सकाळी घेणे',
  'उपाशीपोटी घेणे',
  'जेवणानंतर घेणे',
  'गोळी टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: १ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: २ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ३ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ४ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ५ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ६ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ८ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: ९ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'गोळी टेपरिंग: १० दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'क्रीम टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'क्रीम टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'दर सोमवारी १ गोळी घेणे',
  'दर बुधवारी १ गोळी घेणे',
  'दर शनिवारी १ गोळी घेणे',
  'दर सोमवारी, बुधवारी, शनिवारी १ गोळी घेणे',
  'आठवड्यातून एकदा घेणे',
  'रात्री झोपताना घेणे',
  'सकाळी उपाशीपोटी घेणे',
  'गरज असेल तेव्हा घेणे',
  'त्रास झाल्यास घेणे (SOS)',
  '७ दिवसानंतर चालू करणे',
  'सकाळी लावणे १-२ तास ठेवणे',
  'काळ्या डागावर लावणे',
  'pimples (मोड्यांवर) लावणे',
  'full फेस लावणे',
  'एक दिवस आड सकाळी डोक्यात लावणे (१०-१५ मिनिट ठेवणे)',
  'आठवड्यातून दोनदा सकाळी डोक्यात लावणे (१० ते १५ मिनिट ठेवणे)',
  'सकाळी १ml रात्री १ml डोक्यात लावणे',
  'दर बुधवारी आणि शनिवारी रात्री डोक्यात लावणे',
  'आठवड्यातून दोन वेळेस सकाळी डोके धुणे',
  'एक दिवस आड सकाळी डोके धुणे',
  'सलग तीन दिवस रात्री मानेच्या खाली संपूर्ण शरीरभर लावणे',
  'सकाळी आंघोळीनंतर संपूर्ण शरीरभर लावणे',
  'डोक्यात लावणे',
  'चेहऱ्यावर लावणे',
  'जांघेत लावणे',
  'बगलेत लावणे',
  'नखांना लावणे',
  'तोंडात लावणे',
  'ओठांवर लावणे',
  'पाठीवर लावणे',
  'पोटावर लावणे',
  'मांडीला लावणे',
  'तळपायावर लावणे',
  'तळहातावर लावणे',
  'बोटांना लावणे',
  'मोड्यांवर लावणे',
  'कानाला लावणे',
  'कानामध्ये लावणे',
  'डोळ्यावर लावणे',
  'डोळ्याखाली लावणे',
  'डोळ्यावरती लावणे',
  'कपाळावर लावणे',
  'मानेवर लावणे',
  'गळ्यावर लावणे',
  'हाताला लावणे',
  'लिंगावर लावणे',
  'अंडकोशावर लावणे',
  'गुदमार्गावर लावणे',
  'बसण्याच्या जागी लावणे',
  'कोपऱ्यावर लावणे',
  'कोपऱ्यामागे लावणे',
  'गुडघ्यावर लावणे',
  'गुडघ्यामागे लावणे',
  'मनगटाला लावणे',
  'घोट्याला लावणे',
  'पायाच्या बोटामध्ये लावणे',
  'हाताच्या बोटामध्ये लावणे'
];

// English alias keywords for each Marathi frequency (for romanized search support)
const FREQ_ALIASES: Record<string, string> = {
  'सकाळी १ व रात्री १ घेणे': 'twice daily bd morning night 1-0-1 101 sakali ratri goli ghene',
  'सकाळी १ घेणे': 'once daily od morning 1-0-0 100 sakali goli ghene',
  'रात्री १ घेणे': 'night once od 0-0-1 001 ratri ghene',
  'दुपारी १ घेणे': 'afternoon noon 0-1-0 010 dupari ghene',
  'सकाळी १, दुपारी १ व रात्री १ घेणे': 'thrice daily tds tid three times 1-1-1 111 sakali dupari ratri goli ghene',
  'दिवसातून ४ वेळा घेणे': 'four times qid 4 times divsatun 4 vela ghene 1-1-1-1',
  '१ गोळी सकाळी १ गोळी रात्री घेणे': 'goli sakali ratri morning night tablet 1 1 bd twice',
  '१/२ गोळी सकाळी घेणे': 'half goli sakali morning tablet 0.5',
  'उपाशीपोटी घेणे': 'upashi empty stomach fasting ghene before breakfast ac',
  'जेवणानंतर घेणे': 'jevan jevananantar after meals food ghene pc',
  'गोळी टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 1 divas ek sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 2 divas don sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 3 divas teen sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 4 divas char sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 5 divas paach sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 6 divas saha sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 7 divas saat sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 8 divas aath sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 9 divas nau sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे': 'tapering taper goli 10 divas dahaa sakali ratri nantar bd od tablet',
  'गोळी टेपरिंग: १ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 1 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: २ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 2 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ३ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 3 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ४ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 4 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ५ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 5 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ६ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 6 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 7 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ८ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 8 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: ९ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 9 divas tinada donada ekda nantar tds bd od',
  'गोळी टेपरिंग: १० दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे': 'tapering taper goli 10 divas tinada donada ekda nantar tds bd od',
  'क्रीम टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 1 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 2 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 3 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 4 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 5 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 6 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 7 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 8 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 9 divas sakali ratri nantar bd od laavne',
  'क्रीम टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे': 'tapering taper cream 10 divas sakali ratri nantar bd od laavne',
  'दर सोमवारी १ गोळी घेणे': 'somvar somvari monday goli weekly tablet',
  'दर बुधवारी १ गोळी घेणे': 'budhvar budhvari wednesday goli weekly tablet',
  'दर शनिवारी १ गोळी घेणे': 'shanivar shanivari saturday goli weekly tablet',
  'दर सोमवारी, बुधवारी, शनिवारी १ गोळी घेणे': 'somvari budhvari shanivari monday wednesday saturday goli weekly',
  'आठवड्यातून एकदा घेणे': 'once weekly week aathvadyatun ekda',
  'रात्री झोपताना घेणे': 'at bedtime night ratri zhoptana hs',
  'सकाळी उपाशीपोटी घेणे': 'before breakfast upashi morning',
  'गरज असेल तेव्हा घेणे': 'as needed sos prn garaj asel tevh',
  'त्रास झाल्यास घेणे (SOS)': 'sos emergency tras jhalyas as needed',
  '७ दिवसानंतर चालू करणे': '7 divas nantar saat after days start',
  'सकाळी लावणे १-२ तास ठेवणे': 'sakali laavne morning apply thas cream',
  'काळ्या डागावर लावणे': 'kalya dag dark spot laavne apply',
  'pimples (मोड्यांवर) लावणे': 'pimple modya acne laavne apply',
  'full फेस लावणे': 'full face chehara laavne apply',
  'एक दिवस आड सकाळी डोक्यात लावणे (१०-१५ मिनिट ठेवणे)': 'alternate day aad sakali doke dokyat head laavne',
  'आठवड्यातून दोनदा सकाळी डोक्यात लावणे (१० ते १५ मिनिट ठेवणे)': 'aathavda twice week doke dokyat head sakali laavne',
  'सकाळी १ml रात्री १ml डोक्यात लावणे': 'sakali ratri ml doke dokyat head morning night laavne',
  'दर बुधवारी आणि शनिवारी रात्री डोक्यात लावणे': 'budhvari shanivari ratri doke dokyat head wednesday saturday night laavne',
  'आठवड्यातून दोन वेळेस सकाळी डोके धुणे': 'aathavda twice week sakali doke wash dhune',
  'एक दिवस आड सकाळी डोके धुणे': 'alternate day aad sakali doke wash dhune',
  'सलग तीन दिवस रात्री मानेच्या खाली संपूर्ण शरीरभर लावणे': 'salag teen 3 divas ratri mane khali sharir body laavne continuous',
  'सकाळी आंघोळीनंतर संपूर्ण शरीरभर लावणे': 'sakali aanghol bath sharir body laavne morning',
  'डोक्यात लावणे': 'doke dokyat head scalp laavne apply',
  'चेहऱ्यावर लावणे': 'chehara chehra face laavne apply',
  'जांघेत लावणे': 'jangha groin laavne apply',
  'बगलेत लावणे': 'bagal armpit laavne apply',
  'नखांना लावणे': 'nakha nail laavne apply',
  'तोंडात लावणे': 'tond mouth laavne apply',
  'ओठांवर लावणे': 'otha lip laavne apply',
  'पाठीवर लावणे': 'pathi back laavne apply',
  'पोटावर लावणे': 'pot stomach belly laavne apply',
  'मांडीला लावणे': 'mandi thigh laavne apply',
  'तळपायावर लावणे': 'talpaya sole foot laavne apply',
  'तळहातावर लावणे': 'talhat palm laavne apply',
  'बोटांना लावणे': 'bota finger laavne apply',
  'मोड्यांवर लावणे': 'modya pimple acne laavne apply',
  'कानाला लावणे': 'kan ear laavne apply',
  'कानामध्ये लावणे': 'kanamadhe ear inside laavne apply',
  'डोळ्यावर लावणे': 'dola eye laavne apply',
  'डोळ्याखाली लावणे': 'dolya khali under eye laavne apply',
  'डोळ्यावरती लावणे': 'dolya varti above eye laavne apply',
  'कपाळावर लावणे': 'kapal forehead laavne apply',
  'मानेवर लावणे': 'mana neck laavne apply',
  'गळ्यावर लावणे': 'galya throat neck laavne apply',
  'हाताला लावणे': 'hat arm hand laavne apply',
  'लिंगावर लावणे': 'linga penis laavne apply',
  'अंडकोशावर लावणे': 'andkosh scrotum laavne apply',
  'गुदमार्गावर लावणे': 'gudha anal laavne apply',
  'बसण्याच्या जागी लावणे': 'basne jagi sitting area laavne apply',
  'कोपऱ्यावर लावणे': 'kopara elbow laavne apply',
  'कोपऱ्यामागे लावणे': 'kopara mage behind elbow laavne apply',
  'गुडघ्यावर लावणे': 'gudha knee laavne apply',
  'गुडघ्यामागे लावणे': 'gudha mage behind knee laavne apply',
  'मनगटाला लावणे': 'mangat wrist laavne apply',
  'घोट्याला लावणे': 'ghota ankle laavne apply',
  'पायाच्या बोटामध्ये लावणे': 'paya bota toe finger laavne apply',
  'हाताच्या बोटामध्ये लावणे': 'hat bota finger laavne apply'
};

// Smart search: matches label directly OR via English aliases
function freqMatchesSearch(freq: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (freq.toLowerCase().includes(q)) return true;
  const aliases = FREQ_ALIASES[freq];
  if (aliases && aliases.includes(q)) return true;
  return false;
}

const DURATIONS = [
  '1 Day',
  '2 Days',
  '3 Days',
  '4 Days',
  '5 Days',
  '6 Days',
  '7 Days',
  '8 Days',
  '9 Days',
  '10 Days',
  '12 Days',
  '14 Days',
  '15 Days',
  '20 Days',
  '21 Days',
  '25 Days',
  '28 Days',
  '30 Days',
  '1 Month',
  '45 Days',
  '2 Months',
  '3 Months',
  'SOS / गरज असेल तेव्हा'
];

const INVESTIGATIONS = [
  'CBC', 'LFT', 'RFT', 'BSL (Fasting)', 'BSL (PP)', 
  'Lipid Profile', 'Thyroid Profile', 'Urine Routine', 
  'KOH Mount', 'Skin Biopsy', 'Patch Test', "Wood's Lamp Exam"
];

const COUNSELLING = [
  'Risk/side effects explained',
  'Monitoring plan discussed',
  'Diet and lifestyle advised',
  'Sun protection advised',
  'Follow-up importance explained',
  'Written consent obtained'
];

export default function CasepaperForm({ patient, queueId, casePaper, onUpdateCasePaper, onBack }: CasepaperFormProps) {
  const { templates, queue, clinicSettings, addCustomFrequency, updateQueueStatus, setToast } = useClinic();
  const allFrequencies = useMemo(() => {
    const custom = clinicSettings?.customFrequencies || [];
    return Array.from(new Set([...custom, ...FREQUENCIES])).filter(Boolean);
  }, [clinicSettings?.customFrequencies]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sentenceInput, setSentenceInput] = useState('');
  const [templateSearchQuery, setTemplateSearchQuery] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [dbMedicines, setDbMedicines] = useState<any[]>(initialLocalMedicines);
  const [filteredMedicines, setFilteredMedicines] = useState<any[]>(initialLocalMedicines);
  const [totalMedicineCount, setTotalMedicineCount] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMedicineImportOpen, setIsMedicineImportOpen] = useState(false);
  const [showPrintOverlay, setShowPrintOverlay] = useState(false);
  const [showEMRModal, setShowEMRModal] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customDaysInput, setCustomDaysInput] = useState('');
  const [freqOpenIndex, setFreqOpenIndex] = useState<number | null>(null);
  const [freqInputDisplay, setFreqInputDisplay] = useState('');
  const [durOpenIndex, setDurOpenIndex] = useState<number | null>(null);
  const [translatingIndex, setTranslatingIndex] = useState<number | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const templateSearchRef = useRef<HTMLDivElement>(null);

  const handleTranslateRowFrequency = async (index: number, customText?: string) => {
    const textToTranslate = customText !== undefined ? customText : (freqInputDisplay || casePaper.medicines[index]?.frequency || '');
    if (!textToTranslate || !textToTranslate.trim()) return;
    setTranslatingIndex(index);
    try {
      const translated = await translateFrequencyToMarathi(textToTranslate);
      if (translated) {
        updateMedicineField(index, 'frequency', translated);
        setFreqInputDisplay(translated);
        if (translated) {
          addCustomFrequency(translated);
        }
        setToast({ type: 'success', title: 'मराठी रूपांतर', message: `रूपांतरित: "${translated}"` });
      }
    } catch {
      setToast({ type: 'error', message: 'भाषांतर करता आले नाही. कृपया पुन्हा प्रयत्न करा.' });
    } finally {
      setTranslatingIndex(null);
      setFreqOpenIndex(null);
    }
  };

  const selectFollowUpDays = (days: number) => {
    if (days === 0) {
      setCustomDaysInput('');
      onUpdateCasePaper({ ...casePaper, followUpDate: '' });
      return;
    }
    setCustomDaysInput(`${days} Days`);
    const today = new Date();
    today.setDate(today.getDate() + days);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onUpdateCasePaper({ ...casePaper, followUpDate: `${yyyy}-${mm}-${dd}` });
  };

  const handleDirectDaysInput = (raw: string) => {
    setCustomDaysInput(raw);
    const trimmed = raw.trim().toLowerCase();
    if (!trimmed) {
      onUpdateCasePaper({ ...casePaper, followUpDate: '' });
      return;
    }
    let days = 0;
    if (trimmed.includes('week')) {
      const match = trimmed.match(/\d+/);
      const num = match ? parseInt(match[0]) : 1;
      days = num * 7;
    } else if (trimmed.includes('month') || trimmed.includes('mo')) {
      const match = trimmed.match(/\d+/);
      const num = match ? parseInt(match[0]) : 1;
      days = num * 30;
    } else {
      const match = trimmed.match(/\d+/);
      if (match) {
        days = parseInt(match[0]);
      }
    }

    if (days > 0) {
      const today = new Date();
      today.setDate(today.getDate() + days);
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      onUpdateCasePaper({ ...casePaper, followUpDate: `${yyyy}-${mm}-${dd}` });
    }
  };

  const isPresetSelected = (currentDateStr?: string, days?: number) => {
    if (days === 0) return !currentDateStr;
    if (!currentDateStr) return false;
    const today = new Date();
    today.setDate(today.getDate() + (days || 0));
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return currentDateStr === `${yyyy}-${mm}-${dd}`;
  };

  const getFollowUpText = (dateStr?: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const target = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    if (diffDays > 0) {
      return `${diffDays} Days (${formattedDate})`;
    } else if (diffDays === 0) {
      return `Today (${formattedDate})`;
    }
    return formattedDate;
  };

  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) return templates;
    const query = templateSearchQuery.toLowerCase().trim();
    return templates.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.description?.toLowerCase().includes(query)
    );
  }, [templates, templateSearchQuery]);

  const normalizeMedicine = (m: any, idx: number) => ({
    id: m.id || m.productId || `med_${idx}`,
    name: m.name || m['Medicine Name'] || m.productId || `Medicine #${idx + 1}`,
    brand: m.brand || m['Brand'] || '',
    strength: m.strength || m['Strength'] || '',
    form: m.form || m['Form'] || 'Tablet',
    category: m.category || m['Category'] || 'General',
    defaultFrequency: m.frequency || m.defaultFrequency || '',
    defaultDuration: m.duration || m.defaultDuration || '7 Days',
  });

  const loadMedicines = async () => {
    try {
      const fetched = await api.getMedicines();
      if (fetched && fetched.length > 0) {
        const normalized = fetched.map(normalizeMedicine);
        setDbMedicines(normalized);
        setFilteredMedicines(normalized);
      }
      try {
        const countRes = await api.getMedicineCount();
        setTotalMedicineCount(countRes?.count || fetched?.length || 0);
      } catch {
        setTotalMedicineCount(fetched?.length || 0);
      }
    } catch {
      setTotalMedicineCount(initialLocalMedicines.length);
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (templateSearchRef.current && !templateSearchRef.current.contains(e.target as Node)) {
        setShowTemplateDropdown(false);
      }
    };
    const handleOutsideClickForFreq = () => {
      setFreqOpenIndex(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('click', handleOutsideClickForFreq);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('click', handleOutsideClickForFreq);
    };
  }, []);

  const parsedSentence = useMemo(() => parsePrescriptionSentence(searchQuery), [searchQuery]);

  // Instant client-side filter (0ms) + Fast debounced server search (50ms)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    const parsed = parsePrescriptionSentence(searchQuery);
    const q = (parsed.cleanedMedicineQuery || searchQuery).trim().toLowerCase();
    if (!q) {
      setFilteredMedicines(dbMedicines);
      setIsSearching(false);
      setHighlightedIndex(-1);
      return;
    }

    const getCoreName = (fullName: string) =>
      (fullName || '').replace(/^(Tab\.|Cap\.|Syp\.|Inj\.|Cream|Gel \/ Ointment|Lotion|Ointment|Soap|Drops|Powder)\s*/i, '').toLowerCase().trim();

    // 1. INSTANT LOCAL FILTER (0ms response time - Zero keypress delay!)
    const localPrefixMatches = dbMedicines.filter(m =>
      getCoreName(m.name).startsWith(q) || (m.brand || '').toLowerCase().startsWith(q) || (m.name || '').toLowerCase().startsWith(q)
    );

    const instantResults = localPrefixMatches.length > 0 ? localPrefixMatches : dbMedicines.filter(m =>
      (m.name || '').toLowerCase().includes(q) || (m.brand || '').toLowerCase().includes(q)
    );
    setFilteredMedicines(instantResults);

    // 2. FAST SERVER FETCH (50ms debounce for 42,000+ Supabase database records)
    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchMedicines(q);
        if (results && results.length > 0) {
          const normalized = results.map(normalizeMedicine);

          normalized.sort((a, b) => {
            const aCore = getCoreName(a.name);
            const bCore = getCoreName(b.name);
            const aCoreStarts = aCore.startsWith(q);
            const bCoreStarts = bCore.startsWith(q);
            if (aCoreStarts && !bCoreStarts) return -1;
            if (!aCoreStarts && bCoreStarts) return 1;
            return aCore.localeCompare(bCore);
          });

          setFilteredMedicines(normalized);
        }
      } catch {
        // Keep instant results on error
      } finally {
        setIsSearching(false);
      }
    }, 50);

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, dbMedicines]);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newMedicines = template.medicines.map(tm => {
      const med = filteredMedicines.find(m => m.id === tm.medicineId) || dbMedicines.find(m => m.id === tm.medicineId);
      const name = tm.medicineName || (tm as any).name || (med ? med.name : 'Unknown Medicine');
      const frequency = tm.frequency || (med ? med.defaultFrequency || '' : '');
      const duration = tm.duration || (med ? med.defaultDuration || '7 Days' : '7 Days');
      const count = tm.count !== undefined && tm.count !== null && tm.count !== '' ? tm.count : calculateMedicineCount({ name, frequency, duration });
      return {
        medicineId: tm.medicineId,
        name,
        dosage: tm.dosage || (med ? `${med.strength || ''} (${med.form || 'Tablet'})` : ''),
        frequency,
        duration,
        count,
        isManualCount: tm.count !== undefined && tm.count !== null && tm.count !== '',
      };
    });

    onUpdateCasePaper({
      ...casePaper,
      templateId,
      medicines: newMedicines,
      investigationsAdvised: template.investigationsAdvised || casePaper.investigationsAdvised,
      counsellingDone: template.counsellingPoints || casePaper.counsellingDone,
    });
  };

  const addMedicine = (medicineId: string, customRawSentence?: string) => {
    const sentenceToParse = customRawSentence !== undefined ? customRawSentence : searchQuery;
    const parsed = parsePrescriptionSentence(sentenceToParse);

    const med = filteredMedicines.find(m => m.id === medicineId) || dbMedicines.find(m => m.id === medicineId);

    let fullName = med ? med.name.trim() : (parsed.formattedMedicineName || 'Medicine');
    if (med && med.strength && !fullName.toLowerCase().includes(med.strength.toLowerCase())) {
      fullName = `${fullName} ${med.strength}`;
    }

    const freq = parsed.frequency || (med ? med.defaultFrequency || '' : '');
    const dur = parsed.duration || (med ? med.defaultDuration || '7 Days' : '7 Days');
    const autoCount = calculateMedicineCount({ name: fullName, frequency: freq, duration: dur });
    if (freq) {
      addCustomFrequency(freq);
    }

    const newMedicine: CasePaperMedicine = {
      medicineId: med ? med.id : `custom_${Date.now()}`,
      name: fullName,
      frequency: freq,
      duration: dur,
      count: autoCount
    };

    onUpdateCasePaper({
      ...casePaper,
      medicines: [...casePaper.medicines, newMedicine],
    });

    setSearchQuery('');
    setShowSearchDropdown(false);
    setHighlightedIndex(-1);
  };

  const addSentenceWithGroqAI = async (rawSentence: string) => {
    const sentenceToParse = rawSentence.trim();
    if (!sentenceToParse) return;

    // 1. Add a placeholder row immediately (raw text as name, loading indicator)
    const placeholderId = `groq_pending_${Date.now()}`;
    const placeholderName = sentenceToParse
      .split(' ')
      .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
      .join(' ');

    const placeholderMedicine: CasePaperMedicine = {
      medicineId: placeholderId,
      name: placeholderName,
      frequency: '⏳ AI parsing...',
      duration: '',
      count: 0
    };

    const medsWithPlaceholder = [...casePaper.medicines, placeholderMedicine];
    onUpdateCasePaper({
      ...casePaper,
      medicines: medsWithPlaceholder,
    });

    setSearchQuery('');
    setShowSearchDropdown(false);
    setHighlightedIndex(-1);

    // 2. Call Groq AI (100% dynamic, no hardcoded regex)
    let finalMedicines = medsWithPlaceholder;
    try {
      const groqParsed = await parseSentenceWithGroqAI(sentenceToParse);

      if (groqParsed) {
        const groqClean = (groqParsed.cleanedMedicineQuery || sentenceToParse).toLowerCase().trim();
        const matchedMed = dbMedicines.find(m =>
          m.name.toLowerCase().includes(groqClean) ||
          (m.brand && m.brand.toLowerCase().includes(groqClean))
        );

        let finalName = matchedMed ? matchedMed.name.trim() : (groqParsed.formattedMedicineName || sentenceToParse);
        if (matchedMed && matchedMed.strength && !finalName.toLowerCase().includes(matchedMed.strength.toLowerCase())) {
          finalName = `${finalName} ${matchedMed.strength}`;
        }

        const finalFreq = groqParsed.frequency || (matchedMed?.defaultFrequency || '');
        const finalDur = groqParsed.duration || (matchedMed?.defaultDuration || '7 Days');
        const finalCount = calculateMedicineCount({ name: finalName, frequency: finalFreq, duration: finalDur });
        if (finalFreq) {
          addCustomFrequency(finalFreq);
        }
        if (finalFreq) {
          addCustomFrequency(finalFreq);
        }

        finalMedicines = medsWithPlaceholder.map(m =>
          m.medicineId === placeholderId
            ? {
                ...m,
                medicineId: matchedMed ? matchedMed.id : placeholderId,
                name: finalName,
                frequency: finalFreq,
                duration: finalDur,
                count: finalCount
              }
            : m
        );
      } else {
        // Groq AI returned null — clear loading, keep raw name
        finalMedicines = medsWithPlaceholder.map(m =>
          m.medicineId === placeholderId
            ? { ...m, frequency: '', duration: '7 Days', count: 0 }
            : m
        );
      }
    } catch (err) {
      console.warn('Groq AI parse failed:', err);
      finalMedicines = medsWithPlaceholder.map(m =>
        m.medicineId === placeholderId
          ? { ...m, frequency: '', duration: '7 Days', count: 0 }
          : m
      );
    }

    onUpdateCasePaper({
      ...casePaper,
      medicines: finalMedicines,
    });
  };

  const removeMedicine = (index: number) => {
    const updated = casePaper.medicines.filter((_, i) => i !== index);
    onUpdateCasePaper({ ...casePaper, medicines: updated });
  };

  const updateMedicineField = (index: number, field: keyof CasePaperMedicine, value: string) => {
    const updated = casePaper.medicines.map((m, i) => {
      if (i === index) {
        const nextMed = { ...m, [field]: value };
        if (field === 'count') {
          nextMed.isManualCount = true;
          nextMed.count = value;
        } else if (field === 'frequency' || field === 'duration') {
          if (!nextMed.isManualCount) {
            nextMed.count = calculateMedicineCount(nextMed);
          }
        }
        return nextMed;
      }
      return m;
    });
    onUpdateCasePaper({ ...casePaper, medicines: updated });
  };

  const toggleInvestigation = (item: string) => {
    const current = casePaper.investigationsAdvised || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter(i => i !== item) : [...current, item];
    onUpdateCasePaper({ ...casePaper, investigationsAdvised: updated });
  };

  const toggleCounselling = (item: string) => {
    const current = casePaper.counsellingDone || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter(i => i !== item) : [...current, item];
    onUpdateCasePaper({ ...casePaper, counsellingDone: updated });
  };

  const buildCasePaperPayload = () => {
    const targetQueueItem = queue.find(q =>
      (queueId && q.queueId === queueId) ||
      q.patientId === patient.id ||
      q.name?.toLowerCase() === patient.name?.toLowerCase()
    );
    const effectiveQueueId = queueId || targetQueueItem?.queueId;

    return {
      payload: {
        patientId: patient.id,
        queueId: effectiveQueueId,
        date: casePaper.date,
        templateId: casePaper.templateId || '',
        complaint: casePaper.complaint,
        pastHistory: casePaper.pastHistory,
        allergies: casePaper.allergies,
        medicines: casePaper.medicines,
        investigationsAdvised: casePaper.investigationsAdvised,
        counsellingDone: casePaper.counsellingDone,
        followUpDate: casePaper.followUpDate,
        status: 'completed'
      },
      effectiveQueueId
    };
  };

  const executeWithValidation = async (action: () => void | Promise<void>) => {
    if (!patient || !patient.name) {
      setToast({ type: 'error', message: 'Invalid patient selected. Cannot save consultation.' });
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (casePaper.followUpDate && casePaper.followUpDate < todayStr) {
      setToast({ type: 'error', message: 'Follow-up date cannot be in the past. Please select today or a future date.' });
      return;
    }

    if ((!casePaper.medicines || casePaper.medicines.length === 0) && (!casePaper.complaint || !casePaper.complaint.trim())) {
      setConfirmAction({
        title: 'Empty Consultation',
        message: '⚠️ No medicines prescribed or chief complaint specified. Save empty consultation record anyway?',
        onConfirm: async () => {
          await action();
        }
      });
      return;
    }

    await action();
  };

  const handleSaveAndComplete = async () => {
    executeWithValidation(async () => {

    try {
      const { payload, effectiveQueueId } = buildCasePaperPayload();

      try {
        localStorage.setItem(`clinicos_saved_casepaper_${patient.id}`, JSON.stringify(payload));
      } catch {}

      await api.createCasePaper(payload);

      if (effectiveQueueId) {
        updateQueueStatus(effectiveQueueId, 'completed');
        api.updateQueueStatus(effectiveQueueId, 'completed').catch(() => {});
      }
      if (patient.id) {
        api.updateQueueStatus(patient.id, 'completed').catch(() => {});
      }
      if (patient.name) {
        api.updateQueueStatus(patient.name, 'completed').catch(() => {});
      }

      setToast({
        type: 'success',
        title: 'Consultation Complete',
        message: `Clinical casepaper for ${patient.name} saved to patient record`,
      });
      onBack();
    } catch {
      setToast({
        type: 'success',
        title: 'Consultation Saved',
        message: `Clinical casepaper for ${patient.name} updated`,
      });
      onBack();
      onBack();
    }
  });
  };

  const handleSaveAndPrintPreview = () => {
    executeWithValidation(() => {

    try {
      const { payload, effectiveQueueId } = buildCasePaperPayload();
      try { localStorage.setItem(`clinicos_saved_casepaper_${patient.id}`, JSON.stringify(payload)); } catch {}
      onUpdateCasePaper(payload);
      api.createCasePaper(payload).catch(() => {});
      if (effectiveQueueId) {
        updateQueueStatus(effectiveQueueId, 'completed');
        api.updateQueueStatus(effectiveQueueId, 'completed').catch(() => {});
      }
      if (patient.id) api.updateQueueStatus(patient.id, 'completed').catch(() => {});
      if (patient.name) api.updateQueueStatus(patient.name, 'completed').catch(() => {});
    } catch (err) {
      console.error('Save error:', err);
    }
    // Open print overlay directly inside this component
    setShowPrintOverlay(true);
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setShowSearchDropdown(true);
      setHighlightedIndex(prev => (prev < filteredMedicines.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setShowSearchDropdown(true);
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredMedicines.length) {
        addMedicine(filteredMedicines[highlightedIndex].id, searchQuery);
      } else if (searchQuery.trim()) {
        addSentenceWithGroqAI(searchQuery);
      }
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12 overflow-x-hidden">
      
      {/* ── Top Patient Header Bar ── */}
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-[#f2eee3] hover:bg-[#e8e2d2] rounded-xl border border-[#cdc6ba] transition-colors text-[#4b463e] shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#064e3b] to-[#047857] flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/20">
              <span className="text-[#ecfdf5] font-bold text-sm">{patient.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-serif font-bold text-[#1a1c1a] leading-tight truncate">{patient.name}</h2>
              <p className="text-[10px] sm:text-xs text-[#7c766d] mt-0.5 truncate">
                {patient.age} Yrs / {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.phone} · {patient.village || 'N/A'}
              </p>
            </div>
          </div>

          {/* Prescription Date (Custom Date Picker) */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-[#e4e2e1] shadow-xs">
            <Calendar className="w-4 h-4 text-[#047857] shrink-0" />
            <div className="flex flex-col">
              <label className="text-[9px] font-bold uppercase tracking-wider text-[#7c766d]">Prescription Date</label>
              <input
                type="date"
                value={casePaper.date || new Date().toISOString().split('T')[0]}
                onChange={(e) => onUpdateCasePaper({ ...casePaper, date: e.target.value })}
                className="text-xs font-bold text-[#1a1c1a] bg-transparent border-0 p-0 focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* ── LEFT SIDEBAR: CASE PAPER FIELDS ── */}
        <div className="space-y-5">
          {/* Patient History Card — Left Sidebar Case Paper Fields */}
          <div className="section-card">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-4 text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#047857] inline-block"></span>
              Case Paper Sidebar Fields
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label font-bold text-[#1a1c1a]">1. Past History (DM/HTN/Thyroid/Autoimmune)</label>
                <textarea 
                  value={casePaper.pastHistory}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, pastHistory: e.target.value })}
                  className="form-input font-medium"
                  placeholder="Diabetes Mellitus type 2"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label font-bold text-red-700">2. Drug History / Allergy History</label>
                <textarea 
                  value={casePaper.allergies}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, allergies: e.target.value })}
                  className="form-input border-red-200 bg-[#fff5f5] focus:border-red-400 text-red-800 font-medium"
                  placeholder="No known drug allergies (NKDA)"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label font-bold text-[#1e3a8a]">3. Investigations Advised</label>
                <textarea 
                  value={Array.isArray(casePaper.investigationsAdvised) ? casePaper.investigationsAdvised.join(', ') : (casePaper.investigationsAdvised || '')}
                  onChange={(e) => {
                    const val = e.target.value;
                    const items = val.split(',').map(s => s.trim()).filter(Boolean);
                    onUpdateCasePaper({ ...casePaper, investigationsAdvised: items });
                  }}
                  className="form-input text-[#1e3a8a] font-medium"
                  placeholder="Advised: CBC, LFT, BSL(R)"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label font-bold text-[#1a1c1a]">4. Provisional / Final Diagnosis</label>
                <textarea 
                  value={casePaper.complaint}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, complaint: e.target.value })}
                  className="form-input font-medium"
                  placeholder="Severe Ringworm Infection on thigh & arms since 2 weeks"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label font-bold text-[#047857]">5. Patient Counselling Documentation</label>
                <div className="space-y-1.5 bg-[#faf9f6] p-2.5 rounded-xl border border-[#e4e2e1]">
                  {COUNSELLING.map(item => {
                    const currentArr = Array.isArray(casePaper.counsellingDone) ? casePaper.counsellingDone : [];
                    const isChecked = currentArr.includes(item);
                    return (
                      <label key={item} className="flex items-center justify-between text-xs font-medium cursor-pointer p-1 hover:bg-[#f2eee3] rounded-lg">
                        <span>{item}</span>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCounselling(item)}
                          className="w-4 h-4 accent-[#047857] rounded cursor-pointer shrink-0"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEMRModal(true)}
                className="w-full mt-3 py-2 px-3 bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FileText className="w-4 h-4 text-[#047857]" />
                <span>View All Past Prescriptions & EMR</span>
              </button>
            </div>
          </div>

          {/* Past Visits */}
          {patient.pastVisits && patient.pastVisits.length > 0 && (
            <div className="section-card">
              <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-[#7c766d] inline-block"></span>
                Past Visits
              </h3>
              <div className="space-y-2.5">
                {patient.pastVisits.map((visit, i) => (
                  <div key={i} className="flex justify-between items-start text-xs pb-2.5 border-b border-[#e4e2e1] last:border-0 last:pb-0">
                    <div>
                      <div className="font-semibold text-[#1a1c1a]">{visit.diagnosis}</div>
                      <div className="text-[#7c766d] mt-0.5">Template: {visit.template}</div>
                    </div>
                    <span className="text-[#7c766d] whitespace-nowrap ml-2 bg-[#f2eee3] px-2 py-0.5 rounded-md border border-[#e4e2e1] font-medium">{visit.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT COLUMN: DOCTOR WORKSPACE ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          
          {/* ── Prescription Templates ── */}
          {templates.length > 0 && (
            <div className="section-card flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-serif font-bold text-[#1a1c1a] text-sm">Templates</span>
                <span className="text-[11px] text-[#7c766d] bg-[#f2eee3] px-2 py-0.5 rounded-full border border-[#e4e2e1]">{templates.length}</span>
              </div>

              {/* Single Combobox */}
              <div className="relative flex-1 min-w-[220px]" ref={templateSearchRef}>
                {/* Trigger / Search input — flex wrapper so icon never overlaps text */}
                <div className="form-input form-input-sm flex items-center gap-2 p-0 overflow-hidden cursor-text">
                  <Search className="w-3.5 h-3.5 text-[#7c766d] ml-2.5 shrink-0 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={`Search ${templates.length} templates...`}
                    value={templateSearchQuery}
                    onChange={(e) => {
                      setTemplateSearchQuery(e.target.value);
                      setShowTemplateDropdown(true);
                    }}
                    onFocus={() => setShowTemplateDropdown(true)}
                    className="flex-1 text-xs py-0 bg-transparent outline-none border-none min-w-0"
                    style={{ boxShadow: 'none' }}
                  />
                  {templateSearchQuery ? (
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setTemplateSearchQuery(''); setShowTemplateDropdown(false); }}
                      className="mr-2 text-[#7c766d] hover:text-[#1a1c1a] shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <ChevronDown className="w-5 h-5 text-[#4b463e] mr-2 shrink-0 pointer-events-none stroke-[2.5]" />
                  )}
                </div>


                {/* Dropdown list */}
                {showTemplateDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl overflow-hidden"
                    style={{ zIndex: 9999, maxHeight: '280px', overflowY: 'auto' }}>
                    {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                      <div
                        key={t.id}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          applyTemplate(t.id);
                          setTemplateSearchQuery(t.name);
                          setShowTemplateDropdown(false);
                        }}
                        className={`px-3 py-2.5 text-xs cursor-pointer flex items-center justify-between gap-3 transition-colors ${
                          casePaper.templateId === t.id
                            ? 'bg-[#ecfdf5] text-[#047857] font-semibold'
                            : 'text-[#1a1c1a] hover:bg-[#f7f5f0]'
                        }`}
                      >
                        <span>{t.name}</span>
                        <span className="text-[10px] text-[#7c766d] bg-[#f2eee3] px-2 py-0.5 rounded-full shrink-0">
                          {t.medicines?.length || 0} meds
                        </span>
                      </div>
                    )) : (
                      <div className="px-3 py-3 text-xs text-[#7c766d] text-center italic">No templates match "{templateSearchQuery}"</div>
                    )}
                  </div>
                )}
              </div>

              {/* Active template badge */}
              {casePaper.templateId && (() => {
                const active = templates.find(t => t.id === casePaper.templateId);
                return active ? (
                  <div className="flex items-center gap-1.5 bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] px-2.5 py-1 rounded-lg text-xs font-medium shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {active.name}
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { onUpdateCasePaper({ ...casePaper, templateId: '' }); setTemplateSearchQuery(''); }}
                      className="ml-0.5 hover:text-[#065f46]"
                    ><X className="w-3 h-3" /></button>
                  </div>
                ) : null;
              })()}
            </div>
          )}


          {/* ── Rx Prescription ── */}
          <div className="section-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-[#1a1c1a] text-base flex items-center gap-2">
                <Pill className="w-4.5 h-4.5 text-[#047857]" />
                Rx — Prescription
              </h3>
              <span className="text-[11px] font-bold text-[#047857] bg-[#ecfdf5] px-2.5 py-1 rounded-full border border-[#a7f3d0]">
                {totalMedicineCount > 0 ? totalMedicineCount.toLocaleString() : dbMedicines.length} medicines
              </span>
            </div>
            
            {/* Free-text Sentence Input Bar */}
            <div className="flex items-center gap-2 bg-[#faf9f6] border border-[#e4e2e1] rounded-xl p-2.5 mb-3">
              <input
                type="text"
                value={sentenceInput}
                onChange={(e) => setSentenceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    if (sentenceInput.trim()) {
                      addSentenceWithGroqAI(sentenceInput.trim());
                      setSentenceInput('');
                    }
                  }
                }}
                className="flex-1 bg-transparent border-none outline-none text-sm text-[#1a1c1a] font-medium"
                placeholder="Type here and press Enter to add..."
              />
              <button
                type="button"
                onClick={() => {
                  if (sentenceInput.trim()) {
                    addSentenceWithGroqAI(sentenceInput.trim());
                    setSentenceInput('');
                  }
                }}
                disabled={!sentenceInput.trim()}
                className="px-3.5 py-1.5 bg-[#047857] hover:bg-[#065f46] text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {/* Medicine Search */}
            <div className="relative mb-4">
              <div className="relative">
                <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${isSearching ? 'text-[#047857] animate-pulse' : 'text-[#7c766d]'}`} />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder={`Search medicines by name, brand, strength...`}
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  onKeyDown={handleSearchKeyDown}
                />
              </div>
              
              {showSearchDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-xl max-h-72 overflow-auto divide-y divide-[#f2eee3]">
                  {/* Dynamic Sentence Auto-Parse Quick-Add Banner */}
                  {parsedSentence.hasSentenceElements && (
                    <div
                      onMouseDown={(e) => {
                        e.preventDefault();
                        addSentenceWithGroqAI(searchQuery);
                      }}
                      className="p-3 bg-[#ecfdf5] hover:bg-[#d1fae5] border-b border-[#a7f3d0] cursor-pointer flex flex-col gap-1 text-[#047857] transition-all"
                    >
                      <div className="flex items-center justify-between font-bold text-xs">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#047857] shrink-0" />
                          <span>Auto-Parsed Sentence: <strong>{parsedSentence.formattedMedicineName}</strong></span>
                        </span>
                        <span className="text-[10px] bg-[#047857] text-white px-2 py-0.5 rounded font-sans font-extrabold uppercase shadow-sm">
                          Press Enter ↵ to Add
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#065f46] font-medium mt-0.5 flex-wrap">
                        {parsedSentence.frequency && (
                          <span className="bg-[#a7f3d0]/50 px-2 py-0.5 rounded border border-[#a7f3d0]">
                            Frequency: <strong>{parsedSentence.frequency}</strong>
                          </span>
                        )}
                        {parsedSentence.duration && (
                          <span className="bg-[#a7f3d0]/50 px-2 py-0.5 rounded border border-[#a7f3d0]">
                            Duration: <strong>{parsedSentence.duration}</strong>
                          </span>
                        )}
                        <span className="bg-[#047857]/10 text-[#047857] px-2 py-0.5 rounded border border-[#047857]/20 font-bold">
                          Calculated Count: <strong>{calculateMedicineCount({ name: parsedSentence.formattedMedicineName, frequency: parsedSentence.frequency, duration: parsedSentence.duration })}</strong>
                        </span>
                      </div>
                    </div>
                  )}

                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.map((med, idx) => (
                      <div 
                        key={med.id}
                        className={`px-4 py-2.5 cursor-pointer transition-colors ${highlightedIndex === idx ? 'bg-[#ecfdf5]' : 'hover:bg-[#f8f6f0]'}`}
                        onMouseDown={(e) => { e.preventDefault(); addMedicine(med.id, searchQuery); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1a1c1a] text-sm">{med.name}</span>
                          {med.category && (
                            <span className="text-[10px] bg-[#f2eee3] text-[#4b463e] px-2 py-0.5 rounded-md font-semibold border border-[#cdc6ba]">
                              {med.category}
                            </span>
                          )}
                        </div>
                        {(() => {
                          const parts = [];
                          const s = (med.strength || '').trim();
                          const isJunkStrength = /^\d+\s*[\'"`;&]?\s*s?$/i.test(s) || /[\d\`\'\,\-\;\:]+\s*(s|tab|tabs|cap|caps|strip|strips|kit|kits|vial|amp|nos|unit)\b/i.test(s) || /^\d+$/i.test(s) || s.includes('`') || s.includes(';');
                          if (s && !isJunkStrength && !med.name.toLowerCase().includes(s.toLowerCase())) parts.push(s);
                          if (med.form && med.form !== 'Surgical' && med.form !== 'General') parts.push(med.form);
                          const text = parts.join(' • ');
                          return text ? <div className="text-xs text-[#7c766d] mt-0.5">{text}</div> : null;
                        })()}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#7c766d] text-sm">
                      No matching drugs found for "<strong>{searchQuery}</strong>".
                    </div>
                  )}

                  {/* Add Custom Drug to Database option */}
                  <div
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setShowAddCustomModal(true);
                    }}
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 cursor-pointer flex items-center justify-between text-indigo-700 text-xs font-bold transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-4 h-4" />
                      <span>Add {searchQuery ? `"${searchQuery}"` : "New Drug"} as Custom Drug to Database</span>
                    </span>
                    <span className="text-[10px] font-sans font-extrabold uppercase bg-indigo-600 text-white px-2 py-0.5 rounded shadow-sm">
                      + Save to DB
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Rx Medicine Table */}
            {casePaper.medicines.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-[#e4e2e1] rounded-xl bg-[#faf9f6]">
                <Plus className="w-7 h-7 text-[#cdc6ba] mx-auto mb-2" />
                <p className="text-[#7c766d] text-sm font-medium">No medicines added yet</p>
                <p className="text-[#7c766d] text-xs mt-1">Search above or apply a template</p>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Column Header Row — hidden on mobile, shown on sm+ */}
                <div className="hidden sm:grid gap-2 px-2 pb-1 border-b border-[#e4e2e1]" style={{ gridTemplateColumns: '2.75rem 1fr 9rem 5.5rem 4.5rem 1.75rem' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d] text-center">Sr. No.</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Medicine</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Frequency</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Duration</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#047857]">Count</span>
                  <span></span>
                </div>
                {/* Medicine Rows */}
                {casePaper.medicines.map((med, index) => (
                  <div
                    key={index}
                    className="bg-white border border-[#e4e2e1] rounded-xl px-2 py-2 hover:border-[#cdc6ba] hover:shadow-sm transition-all group"
                  >
                    {/* Desktop: single row grid */}
                    <div className="hidden sm:grid gap-2 items-center" style={{ gridTemplateColumns: '2.75rem 1fr 9rem 5.5rem 4.5rem 1.75rem' }}>
                      <span className="w-5 h-5 rounded-full bg-[#f2eee3] text-[#7c766d] text-[9px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicineField(index, 'name', e.target.value)}
                        className="form-input form-input-sm font-semibold text-[#1a1c1a]"
                        placeholder="Medicine Name & Strength"
                      />
                      {/* Frequency — free-text custom editing + Groq AI translation + dropdown */}
                      <div className="relative flex items-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={freqOpenIndex === index ? freqInputDisplay : (med.frequency || '')}
                          placeholder="Frequency (sakali 1 goli)"
                          onFocus={() => {
                            setFreqInputDisplay(med.frequency || '');
                            setFreqOpenIndex(index);
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFreqInputDisplay(val);
                            updateMedicineField(index, 'frequency', val);
                            setFreqOpenIndex(index);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleTranslateRowFrequency(index, freqInputDisplay);
                            }
                          }}
                          className="form-input form-input-sm text-xs w-full !pr-9"
                        />
                        <button
                          type="button"
                          title="मराठी भाषांतर"
                          onClick={() => handleTranslateRowFrequency(index, freqInputDisplay || med.frequency || '')}
                          disabled={translatingIndex === index}
                          className="absolute right-1.5 text-[#047857] hover:text-[#065f46] hover:bg-[#ecfdf5] p-1 rounded transition-colors z-10 shrink-0"
                        >
                          {translatingIndex === index ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#047857]" />
                          ) : (
                            <Languages className="w-3.5 h-3.5" />
                          )}
                        </button>
                        {freqOpenIndex === index && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999, width: '280px', maxHeight: '260px', overflowY: 'auto' }}>
                            {/* Top Action Option for English/Romanized text */}
                            {freqInputDisplay.trim() && !/[\u0900-\u097F]/.test(freqInputDisplay) && (
                              <div
                                onClick={() => handleTranslateRowFrequency(index, freqInputDisplay)}
                                className="px-3 py-2 text-xs font-bold text-[#047857] bg-[#ecfdf5] hover:bg-[#d1fae5] border-b border-[#a7f3d0] cursor-pointer flex items-center justify-between gap-2"
                              >
                                <span className="flex items-center gap-1.5 truncate">
                                  <Languages className="w-3.5 h-3.5 shrink-0" />
                                  <span>मराठीत रूपांतर करा: "{freqInputDisplay}"</span>
                                </span>
                                <span className="text-[10px] font-sans font-extrabold uppercase bg-[#047857] text-white px-1.5 py-0.5 rounded">मराठी</span>
                              </div>
                            )}
                            {allFrequencies.filter((f: string) => freqMatchesSearch(f, freqInputDisplay)).map((f: string) => (
                              <div
                                key={f}
                                onClick={() => {
                                  updateMedicineField(index, 'frequency', f);
                                  setFreqOpenIndex(null);
                                  setFreqInputDisplay('');
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                  med.frequency === f ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-[#1a1c1a] hover:bg-[#f7f5f0]'
                                }`}
                              >
                                {f}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {/* Duration — input with custom days helper & dropdown */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          placeholder="उदा. 7 Days"
                          value={med.duration}
                          onFocus={() => { setDurOpenIndex(index); setFreqOpenIndex(null); }}
                          onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (med.duration || '').trim();
                              if (/^\d+$/.test(val)) {
                                updateMedicineField(index, 'duration', `${val} Days`);
                              }
                              setDurOpenIndex(null);
                            }
                          }}
                          className="form-input form-input-sm w-full font-semibold text-xs"
                        />
                        {durOpenIndex === index && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999, width: '180px', maxHeight: '240px', overflowY: 'auto' }}>
                            {/* Quick custom number helper */}
                            {med.duration && /^\d+$/.test(med.duration.trim()) && (
                              <div
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateMedicineField(index, 'duration', `${med.duration.trim()} Days`);
                                  setDurOpenIndex(null);
                                }}
                                className="px-3 py-2 text-xs font-bold text-[#047857] bg-[#ecfdf5] hover:bg-[#d1fae5] border-b border-[#a7f3d0] cursor-pointer flex items-center justify-between"
                              >
                                <span>📅 {med.duration.trim()} Days</span>
                                <span className="text-[10px] font-sans font-extrabold uppercase bg-[#047857] text-white px-1.5 py-0.5 rounded">लागू करा</span>
                              </div>
                            )}
                            {/* Quick Day Chips */}
                            <div className="p-1.5 bg-[#faf9f6] border-b border-[#e4e2e1] flex flex-wrap gap-1">
                              {[1, 2, 3, 5, 7, 10, 14, 15, 20, 30].map(days => (
                                <button
                                  key={days}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    updateMedicineField(index, 'duration', `${days} Days`);
                                    setDurOpenIndex(null);
                                  }}
                                  className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white hover:bg-[#ecfdf5] hover:text-[#047857] border border-[#e4e2e1] text-[#4b463e]"
                                >
                                  {days}d
                                </button>
                              ))}
                            </div>
                            {DURATIONS.map(d => (
                              <div
                                key={d}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  updateMedicineField(index, 'duration', d);
                                  setDurOpenIndex(null);
                                }}
                                className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                                  med.duration === d ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-[#1a1c1a] hover:bg-[#f7f5f0]'
                                }`}
                              >
                                {d}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Count"
                        value={med.count !== undefined && med.count !== null ? med.count : calculateMedicineCount(med)}
                        onChange={(e) => updateMedicineField(index, 'count', e.target.value)}
                        className="form-input form-input-sm font-bold text-center text-[#047857] bg-[#ecfdf5] border-[#a7f3d0]"
                      />
                      <button type="button" onClick={() => removeMedicine(index)}
                        className="p-1 text-[#cdc6ba] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Mobile: stacked card */}
                    <div className="sm:hidden space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="w-5 h-5 rounded-full bg-[#f2eee3] text-[#7c766d] text-[9px] font-bold flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <button type="button" onClick={() => removeMedicine(index)}
                          className="p-1 text-[#cdc6ba] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-auto">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedicineField(index, 'name', e.target.value)}
                        className="form-input form-input-sm font-semibold text-[#1a1c1a] w-full"
                        placeholder="Medicine Name & Strength"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {/* Mobile Frequency — free-text custom editing + Languages icon */}
                        <div className="relative col-span-2 flex items-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={freqOpenIndex === index ? freqInputDisplay : (med.frequency || '')}
                            placeholder="Frequency (उदा. sakali 1 goli)"
                            onFocus={() => {
                              setFreqInputDisplay(med.frequency || '');
                              setFreqOpenIndex(index);
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFreqInputDisplay(val);
                              updateMedicineField(index, 'frequency', val);
                              setFreqOpenIndex(index);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleTranslateRowFrequency(index, freqInputDisplay);
                              }
                            }}
                            className="form-input form-input-sm text-xs w-full pr-7"
                          />
                          <button
                            type="button"
                            title="मराठी भाषांतर"
                            onClick={() => handleTranslateRowFrequency(index, freqInputDisplay || med.frequency || '')}
                            disabled={translatingIndex === index}
                            className="absolute right-1 text-[#047857] hover:text-[#065f46] hover:bg-[#ecfdf5] p-1 rounded transition-colors"
                          >
                            {translatingIndex === index ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#047857]" />
                            ) : (
                              <Languages className="w-3.5 h-3.5" />
                            )}
                          </button>
                          {freqOpenIndex === index && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999, width: '280px', maxHeight: '260px', overflowY: 'auto' }}>
                              {freqInputDisplay.trim() && !/[\u0900-\u097F]/.test(freqInputDisplay) && (
                                <div
                                  onClick={() => handleTranslateRowFrequency(index, freqInputDisplay)}
                                  className="px-3 py-2 text-xs font-bold text-[#047857] bg-[#ecfdf5] hover:bg-[#d1fae5] border-b border-[#a7f3d0] cursor-pointer flex items-center justify-between gap-2"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <Languages className="w-3.5 h-3.5 shrink-0" />
                                    <span>मराठीत रूपांतर करा: "{freqInputDisplay}"</span>
                                  </span>
                                  <span className="text-[10px] font-sans font-extrabold uppercase bg-[#047857] text-white px-1.5 py-0.5 rounded">मराठी</span>
                                </div>
                              )}
                              {allFrequencies.filter((f: string) => freqMatchesSearch(f, freqInputDisplay)).map((f: string) => (
                                <div
                                  key={f}
                                  onClick={() => {
                                    updateMedicineField(index, 'frequency', f);
                                    setFreqOpenIndex(null);
                                    setFreqInputDisplay('');
                                  }}
                                  className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                                    med.frequency === f ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-[#1a1c1a] hover:bg-[#f7f5f0]'
                                  }`}
                                >
                                  {f}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            placeholder="Duration (उदा. 7 Days)"
                            value={med.duration}
                            onFocus={() => { setDurOpenIndex(index); setFreqOpenIndex(null); }}
                            onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = (med.duration || '').trim();
                                if (/^\d+$/.test(val)) {
                                  updateMedicineField(index, 'duration', `${val} Days`);
                                }
                                setDurOpenIndex(null);
                              }
                            }}
                            className="form-input form-input-sm w-full font-semibold text-xs"
                          />
                          {durOpenIndex === index && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl overflow-hidden" style={{ zIndex: 9999, width: '180px', maxHeight: '240px', overflowY: 'auto' }}>
                              {med.duration && /^\d+$/.test(med.duration.trim()) && (
                                <div
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    updateMedicineField(index, 'duration', `${med.duration.trim()} Days`);
                                    setDurOpenIndex(null);
                                  }}
                                  className="px-3 py-2 text-xs font-bold text-[#047857] bg-[#ecfdf5] hover:bg-[#d1fae5] border-b border-[#a7f3d0] cursor-pointer flex items-center justify-between"
                                >
                                  <span>📅 {med.duration.trim()} Days</span>
                                  <span className="text-[10px] font-sans font-extrabold uppercase bg-[#047857] text-white px-1.5 py-0.5 rounded">लागू करा</span>
                                </div>
                              )}
                              <div className="p-1.5 bg-[#faf9f6] border-b border-[#e4e2e1] flex flex-wrap gap-1">
                                {[1, 2, 3, 5, 7, 10, 14, 15, 20, 30].map(days => (
                                  <button
                                    key={days}
                                    type="button"
                                    onMouseDown={(e) => {
                                      e.preventDefault();
                                      updateMedicineField(index, 'duration', `${days} Days`);
                                      setDurOpenIndex(null);
                                    }}
                                    className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-white hover:bg-[#ecfdf5] hover:text-[#047857] border border-[#e4e2e1] text-[#4b463e]"
                                  >
                                    {days}d
                                  </button>
                                ))}
                              </div>
                              {DURATIONS.map(d => (
                                <div
                                  key={d}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    updateMedicineField(index, 'duration', d);
                                    setDurOpenIndex(null);
                                  }}
                                  className={`px-3 py-1.5 text-xs cursor-pointer transition-colors ${
                                    med.duration === d ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-[#1a1c1a] hover:bg-[#f7f5f0]'
                                  }`}
                                >
                                  {d}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          placeholder="Count"
                          value={med.count !== undefined && med.count !== null ? med.count : calculateMedicineCount(med)}
                          onChange={(e) => updateMedicineField(index, 'count', e.target.value)}
                          className="form-input form-input-sm font-bold text-center text-[#047857] bg-[#ecfdf5] border-[#a7f3d0]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            )}
          </div>

          {/* ── Investigations ── */}
          <div className="section-card">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#047857]" />
              Investigations Advised
              {(casePaper.investigationsAdvised?.length ?? 0) > 0 && (
                <span className="ml-auto text-[11px] bg-[#ecfdf5] text-[#047857] px-2 py-0.5 rounded-full border border-[#a7f3d0] font-bold">
                  {casePaper.investigationsAdvised!.length} selected
                </span>
              )}
            </h3>
            <div className="flex flex-wrap gap-2">
              {INVESTIGATIONS.map(inv => {
                const isSelected = (casePaper.investigationsAdvised || []).includes(inv);
                return (
                  <button 
                    key={inv}
                    type="button"
                    onClick={() => toggleInvestigation(inv)}
                    className={`pill-btn ${isSelected ? 'pill-btn-active' : ''}`}
                  >
                    {isSelected && <span className="mr-0.5">✓</span>}
                    {inv}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Counselling ── */}
          <div className="section-card">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#047857]" />
              Patient Counselling Checklist
              {(casePaper.counsellingDone?.length ?? 0) > 0 && (
                <span className="ml-auto text-[11px] bg-[#ecfdf5] text-[#047857] px-2 py-0.5 rounded-full border border-[#a7f3d0] font-bold">
                  {casePaper.counsellingDone!.length}/{COUNSELLING.length}
                </span>
              )}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COUNSELLING.map(item => {
                const isChecked = (casePaper.counsellingDone || []).includes(item);
                return (
                  <label key={item} className={`flex items-center gap-2.5 text-xs font-medium cursor-pointer p-2.5 rounded-xl border transition-all ${isChecked ? 'bg-[#ecfdf5] border-[#a7f3d0] text-[#064e3b]' : 'bg-[#faf9f6] border-[#e4e2e1] text-[#4b463e] hover:border-[#cdc6ba]'}`}>
                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${isChecked ? 'bg-[#047857] border-[#047857]' : 'bg-white border-[#cdc6ba]'}`}>
                      {isChecked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCounselling(item)}
                      className="sr-only"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* ── Follow-up Date ── */}
          <div className="section-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0">
                  <Calendar className="w-4.5 h-4.5 text-[#047857]" />
                </div>
                <div>
                  <div className="font-serif font-bold text-[#1a1c1a] text-sm flex items-center gap-2">
                    <span>Follow-up Schedule</span>
                    {casePaper.followUpDate && (
                      <span className="text-[11px] font-sans font-bold bg-[#ecfdf5] text-[#047857] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                        {getFollowUpText(casePaper.followUpDate)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-[#7c766d]">Type direct days or click quick presets (calculates date automatically)</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {/* Quick Preset Days Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {[
                  { label: '3 Days', days: 3 },
                  { label: '5 Days', days: 5 },
                  { label: '7 Days (1 Wk)', days: 7 },
                  { label: '10 Days', days: 10 },
                  { label: '15 Days (2 Wks)', days: 15 },
                  { label: '21 Days (3 Wks)', days: 21 },
                  { label: '30 Days (1 Mo)', days: 30 },
                  { label: 'No Follow-up', days: 0 },
                ].map((preset) => {
                  const isSelected = isPresetSelected(casePaper.followUpDate, preset.days);
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => selectFollowUpDays(preset.days)}
                      className={`pill-btn ${isSelected ? 'pill-btn-active' : ''}`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Direct Days Text Entry (No Date Picker Required) */}
              <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t border-[#e4e2e1]">
                <span className="text-xs font-bold text-[#4b463e] flex items-center gap-1.5 shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#047857]" />
                  Direct Days Entry:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    value={customDaysInput}
                    onChange={(e) => handleDirectDaysInput(e.target.value)}
                    placeholder="e.g. 10 or 15 days"
                    className="form-input form-input-sm w-36 text-xs font-bold text-[#047857] bg-white border-[#cdc6ba] focus:border-[#047857]"
                  />
                  {casePaper.followUpDate ? (
                    <div className="flex items-center gap-1.5 bg-[#ecfdf5] border border-[#a7f3d0] px-3 py-1 rounded-lg text-xs font-bold text-[#047857]">
                      <span>✓ {getFollowUpText(casePaper.followUpDate)}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomDaysInput('');
                          onUpdateCasePaper({ ...casePaper, followUpDate: '' });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold ml-1 text-sm leading-none"
                        title="Clear follow-up"
                      >
                        ×
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* ── Bottom Action Bar ── */}
          <div className="bg-[#1a1c1a] rounded-2xl px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 sticky bottom-3 sm:bottom-4 z-30 shadow-2xl border border-[#4b463e]">

            <button
              type="button"
              onClick={onBack}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Queue</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={handleSaveAndComplete}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Save &amp; Complete</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPrintPreview}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 shrink-0" />
                <span>Print Prescription</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bulk Medicine Import Modal */}
      {isMedicineImportOpen && (
        <MedicineImportModal 
          onClose={() => setIsMedicineImportOpen(false)} 
          onSuccess={loadMedicines}
        />
      )}

      {/* Print Preview Overlay - renders on top of everything */}
      {showPrintOverlay && (
        <ReprintPreview
          patient={patient}
          casePaper={casePaper}
          onBack={() => setShowPrintOverlay(false)}
          onReturnToQueue={() => {
            setShowPrintOverlay(false);
            onBack();
          }}
        />
      )}

      {/* Patient EMR History Modal */}
      {showEMRModal && (
        <PatientEMRHistoryModal
          patient={patient}
          onClose={() => setShowEMRModal(false)}
          onLoadPrescription={(pastCasePaper) => {
            const medicines = Array.isArray(pastCasePaper.medicines)
              ? pastCasePaper.medicines
              : (typeof pastCasePaper.medicines === 'string' ? JSON.parse(pastCasePaper.medicines || '[]') : []);

            onUpdateCasePaper({
              ...casePaper,
              complaint: pastCasePaper.complaint || casePaper.complaint,
              pastHistory: pastCasePaper.pastHistory || casePaper.pastHistory,
              allergies: pastCasePaper.allergies || casePaper.allergies,
              medicines: medicines.length > 0 ? medicines : casePaper.medicines,
              investigationsAdvised: pastCasePaper.investigationsAdvised || casePaper.investigationsAdvised,
              counsellingDone: pastCasePaper.counsellingDone || casePaper.counsellingDone,
            });
            setShowEMRModal(false);
          }}
        />
      )}

      {/* Add Custom Drug Modal */}
      {showAddCustomModal && (
        <AddCustomMedicineModal
          initialName={searchQuery}
          onClose={() => setShowAddCustomModal(false)}
          onSuccess={(newMedicine) => {
            setDbMedicines((prev) => [newMedicine, ...prev]);
            addMedicine(newMedicine.id);
            setSearchQuery('');
            setShowSearchDropdown(false);
            setToast({
              type: 'success',
              message: `✅ "${newMedicine.name}" saved to database and added to prescription!`,
            });
          }}
        />
      )}
      
      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText="Save Anyway"
          cancelText="Cancel"
          isDestructive={false}
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
