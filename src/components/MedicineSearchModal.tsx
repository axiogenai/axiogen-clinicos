import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, ArrowRight, Plus, Loader2, Languages } from 'lucide-react';
import type { Medicine } from '../data/medicines';
import type { TemplateMedicine } from '../data/templates';
import { api } from '../api/client';
import { translateFrequencyToMarathi } from '../utils/marathiTranslator';

interface MedicineSearchModalProps {
  onAdd: (med: TemplateMedicine & { medicineName: string }) => void;
  onClose: () => void;
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

const DURATIONS = [
  '3 Days',
  '5 Days',
  '7 Days',
  '10 Days',
  '14 Days',
  '15 Days',
  '21 Days',
  '1 Month',
  '2 Months',
  '3 Months',
  '4 Weeks',
  '6 Weeks'
];

function freqMatchesSearch(freq: string, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase().trim();
  if (freq.toLowerCase().includes(q)) return true;
  const aliases = FREQ_ALIASES[freq];
  if (aliases && aliases.includes(q)) return true;
  return false;
}

function normalizeMed(m: any, idx: number): Medicine {
  return {
    id: m.id || m.productId || `med_${idx}`,
    name: m.name || m['Medicine Name'] || m.productId || `Medicine #${idx + 1}`,
    brand: m.brand || '',
    strength: m.strength || '',
    form: m.form || 'Tablet',
    category: m.category || 'General',
    defaultFrequency: m.frequency || m.defaultFrequency || 'सकाळी १ व रात्री १ घेणे',
    defaultDuration: m.duration || m.defaultDuration || '7 Days',
  };
}

export default function MedicineSearchModal({ onAdd, onClose }: MedicineSearchModalProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Medicine[]>([]);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('सकाळी १ व रात्री १ घेणे');
  const [freqInput, setFreqInput] = useState('');
  const [freqOpen, setFreqOpen] = useState(false);
  const [duration, setDuration] = useState('7 Days');
  const [durOpen, setDurOpen] = useState(false);
  const [translatingFreq, setTranslatingFreq] = useState(false);

  const handleAiTranslateFrequency = async (customText?: string) => {
    const textToTranslate = customText !== undefined ? customText : (freqInput || frequency);
    if (!textToTranslate || !textToTranslate.trim()) return;
    setTranslatingFreq(true);
    try {
      const translated = await translateFrequencyToMarathi(textToTranslate);
      if (translated) {
        setFrequency(translated);
        setFreqInput(translated);
      }
    } catch {
      /* fallback */
    } finally {
      setTranslatingFreq(false);
      setFreqOpen(false);
    }
  };

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load total count + initial list on mount
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();

    api.getMedicineCount().then(({ count }) => setTotalCount(count)).catch(() => {});

    setLoading(true);
    api.searchMedicines('').then((data: any[]) => {
      setResults(data.map(normalizeMed));
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  // Server-side search with debounce
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data: any[] = await api.searchMedicines(query.trim());
        setResults(data.map(normalizeMed));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
  }, []);

  const handleSelectMed = (med: Medicine) => {
    setSelectedMed(med);
    setDosage(med.strength ? `${med.strength} (${med.form || 'Tablet'})` : (med.form || 'Tablet'));
    setFrequency(med.defaultFrequency || 'सकाळी १ व रात्री १ घेणे');
    setDuration(med.defaultDuration || '7 Days');
  };

  const handleAddCustomDrug = () => {
    if (!search.trim()) return;
    const customMed: Medicine = {
      id: `custom_${Date.now()}`,
      name: search.trim(),
      strength: '',
      form: 'Tablet',
      category: 'General',
      defaultFrequency: 'सकाळी १ व रात्री १ घेणे',
      defaultDuration: '7 Days',
    };
    handleSelectMed(customMed);
  };

  const handleConfirmAdd = () => {
    if (!selectedMed) return;
    onAdd({
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      dosage,
      frequency,
      duration,
    });
  };

  const countLabel = totalCount !== null ? `${totalCount.toLocaleString()} Available` : 'Loading...';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Container with overflow-visible so dropdowns float outside cleanly */}
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200 animate-in fade-in duration-200 relative">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-2xl">
          <h3 className="font-bold text-gray-900 text-base">Add Medicine to Template</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {!selectedMed ? (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Search Drug Formulary ({countLabel})
                </label>
                {search.trim() && (
                  <button
                    type="button"
                    onClick={handleAddCustomDrug}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add as Custom Drug</span>
                  </button>
                )}
              </div>
              <div className="relative">
                {loading
                  ? <Loader2 className="w-4 h-4 text-indigo-400 absolute left-3 top-3.5 animate-spin" />
                  : <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                }
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search from all 42,000+ medicines..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {results.length > 0 ? (
                  results.map((med, idx) => (
                    <div
                      key={med.id || idx}
                      onClick={() => handleSelectMed(med)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center group"
                    >
                      <div className="w-full pr-4">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-semibold text-gray-900 text-sm group-hover:text-indigo-900">{med.name}</span>
                          {med.category && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">
                              {med.category}
                            </span>
                          )}
                        </div>
                        {(() => {
                          const parts = [];
                          const s = (med.strength || '').trim();
                          if (s && !/^\d+[\,\']?\s*(s|tab|tabs|cap|caps|strip|strips|kit|kits|vial|amp)$/i.test(s) && !/^\d+$/i.test(s)) parts.push(s);
                          if (med.form) parts.push(med.form);
                          const text = parts.join(' • ');
                          return text ? <div className="text-xs text-gray-500 mt-0.5">{text}</div> : null;
                        })()}
                      </div>
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))
                ) : !loading ? (
                  <div className="p-5 text-center space-y-2">
                    <div className="text-xs text-gray-500">No match found for "{search}".</div>
                    <button
                      type="button"
                      onClick={handleAddCustomDrug}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add "{search}" to Template</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-5 text-center text-xs text-gray-400">Searching...</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-xl flex justify-between items-center">
                <div>
                  <div className="font-bold text-indigo-900 text-sm">{selectedMed.name}</div>
                  <div className="text-xs text-indigo-700">{selectedMed.strength} • {selectedMed.form}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMed(null)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                >
                  Change Drug
                </button>
              </div>

              {/* Frequency & Duration Inputs */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Frequency Dropdown & Custom Editing + Groq AI */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Frequency
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      value={freqOpen ? freqInput : frequency}
                      placeholder="Search or type custom frequency..."
                      onFocus={() => { setFreqInput(frequency || ''); setFreqOpen(true); setDurOpen(false); }}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFreqInput(val);
                        setFrequency(val);
                        setFreqOpen(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAiTranslateFrequency(freqInput);
                        }
                      }}
                      className="w-full p-2.5 pr-10 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <button
                      type="button"
                      title="मराठी भाषांतर"
                      onClick={() => handleAiTranslateFrequency(freqInput || frequency)}
                      disabled={translatingFreq}
                      className="absolute right-2 text-emerald-600 hover:text-emerald-700 p-1 rounded hover:bg-emerald-50 transition-colors z-10 shrink-0"
                    >
                      {translatingFreq ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                    </button>
                  </div>
                  {freqOpen && (
                    <div 
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto divide-y divide-gray-50" 
                      style={{ zIndex: 99999, width: '100%', minWidth: '280px', maxHeight: '220px' }}
                    >
                      {freqInput.trim() && !/[\u0900-\u097F]/.test(freqInput) && (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            handleAiTranslateFrequency(freqInput);
                          }}
                          className="px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer flex items-center justify-between gap-2 border-b border-emerald-200"
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            <Languages className="w-3.5 h-3.5 shrink-0" />
                            <span>मराठीत रूपांतर करा: "{freqInput}"</span>
                          </span>
                          <span className="text-[10px] font-sans font-extrabold uppercase bg-emerald-600 text-white px-1.5 py-0.5 rounded">मराठी</span>
                        </div>
                      )}
                      {FREQUENCIES.filter(f => freqMatchesSearch(f, freqInput)).map(f => (
                        <div
                          key={f}
                          onMouseDown={(e) => { 
                            e.preventDefault(); 
                            setFrequency(f); 
                            setFreqOpen(false); 
                            setFreqInput(''); 
                          }}
                          className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                            frequency === f ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-gray-800 hover:bg-indigo-50'
                          }`}
                        >
                          {f}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duration Dropdown */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onFocus={() => { setDurOpen(true); setFreqOpen(false); }}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 7 Days"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                  />
                  {durOpen && (
                    <div 
                      className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-y-auto divide-y divide-gray-50" 
                      style={{ zIndex: 99999, width: '100%', minWidth: '160px', maxHeight: '220px' }}
                    >
                      {DURATIONS.map(d => (
                        <div
                          key={d}
                          onMouseDown={(e) => { 
                            e.preventDefault(); 
                            setDuration(d); 
                            setDurOpen(false); 
                          }}
                          className={`px-3 py-2 text-xs cursor-pointer transition-colors ${
                            duration === d ? 'bg-[#ecfdf5] text-[#047857] font-semibold' : 'text-gray-800 hover:bg-indigo-50'
                          }`}
                        >
                          {d}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          {selectedMed && (
            <button
              type="button"
              onClick={handleConfirmAdd}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Add to Template
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
