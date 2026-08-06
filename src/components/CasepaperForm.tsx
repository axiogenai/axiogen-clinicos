import { useState, useRef, useEffect, useMemo } from 'react';
import { Pill, FlaskConical, Lightbulb, Calendar, ArrowLeft, Printer, Trash2, Database, CheckCircle2, Search, Plus, X, ChevronDown } from 'lucide-react';
import type { Patient } from '../data/patients';
import { medicines as initialLocalMedicines } from '../data/medicines';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import type { CasePaper, CasePaperMedicine } from '../types';
import MedicineImportModal from './MedicineImportModal';
import ReprintPreview from './ReprintPreview';

import { calculateMedicineCount } from '../utils/countCalculator';

interface CasepaperFormProps {
  patient: Patient;
  queueId?: string | null;
  casePaper: CasePaper;
  onUpdateCasePaper: (cp: CasePaper) => void;
  onBack: () => void;
}

const FREQUENCIES = [
  'Once daily',
  'Twice daily',
  'Thrice daily',
  'Four times daily',
  '१ गोळी सकाळी १ गोळी रात्री घेणे',
  '१/२ गोळी सकाळी घेणे',
  'उपाशीपोटी घेणे',
  'जेवणानंतर घेणे',
  'दर सोमवारी १ गोळी घेणे',
  'दर बुधवारी १ गोळी घेणे',
  'दर शनिवारी १ गोळी घेणे',
  '७ दिवसानंतर चालू करणे',
  'सकाळी लावणे १-२ तास ठेवणे',
  'काळ्या डागावर लावणे',
  'pimples (मोड्यांवर) लावणे',
  'full फेस लावणे',
  'एक दिवस आड सकाळी डोक्यात लावणे (१०-१५ मिनीट ठेवणे)',
  'आठवड्यातून दोनदा सकाळी डोक्यात लावणे (१० ते १५ मिनीट ठेवणे)',
  'सकाळी १ml रात्री १ml डोक्यात लावणे',
  'दर बुधवारी आणि शनिवारी रात्री डोक्यात लावणे',
  'आठवड्यातून दोन वेळेस सकाळी डोके धुणे',
  'एक दिवस आड सकाळी डोके धुणे',
  'सलग तीन दिवस रात्री मानेच्या खाली संपुर्ण शरीरभर लावणे',
  'सकाळी आंघोळीनंतर संपुर्ण शरीरभर लावणे',
  'डोक्यात लावणे',
  'चेहऱ्यावर लावणे',
  'जांघेत लावणे',
  'बगलेत लावणे',
  'नखांना लावणे',
  'तोंडात लावणे',
  'ओटांवर लावणे',
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
  'हाताच्या बोटामध्ये लावणे',
  'गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे',
  'गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे',
  'cream टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'cream टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे',
  'दर सोमवारी, बुधवारी, शनिवारी १ गोळी घेणे',
  'Once weekly',
  'As needed',
  'At bedtime',
  'Before breakfast',
  'After meals',
  'SOS'
];

// English alias keywords for each Marathi frequency (for romanized search support)
const FREQ_ALIASES: Record<string, string> = {
  'Once daily':                                                              'once daily od morning',
  'Twice daily':                                                             'twice daily bd morning night',
  'Thrice daily':                                                            'thrice daily tds three times',
  'Four times daily':                                                        'four times qid',
  '१ गोळी सकाळी १ गोळी रात्री घेणे':                                       'goli sakali ratri morning night tablet 1 1',
  '१/२ गोळी सकाळी घेणे':                                                   'half goli sakali morning tablet 0.5',
  'उपाशीपोटी घेणे':                                                         'upashi empty stomach fasting ghene',
  'जेवणानंतर घेणे':                                                         'jevan jevananantar after meals food ghene',
  'दर सोमवारी १ गोळी घेणे':                                                 'somvar somvari monday goli weekly tablet',
  'दर बुधवारी १ गोळी घेणे':                                                 'budhvar budhvari wednesday goli weekly tablet',
  'दर शनिवारी १ गोळी घेणे':                                                 'shanivar shanivari saturday goli weekly tablet',
  '७ दिवसानंतर चालू करणे':                                                  '7 divas nantar saat after days start',
  'सकाळी लावणे १-२ तास ठेवणे':                                             'sakali laavne morning apply thas cream',
  'काळ्या डागावर लावणे':                                                    'kalya dag dark spot laavne apply',
  'pimples (मोड्यांवर) लावणे':                                              'pimple modya acne laavne apply',
  'full फेस लावणे':                                                          'full face chehara laavne apply',
  'एक दिवस आड सकाळी डोक्यात लावणे (१०-१५ मिनीट ठेवणे)':                   'alternate day aad sakali doke dokyat head laavne',
  'आठवड्यातून दोनदा सकाळी डोक्यात लावणे (१० ते १५ मिनीट ठेवणे)':          'aathavda twice week doke dokyat head sakali laavne',
  'सकाळी १ml रात्री १ml डोक्यात लावणे':                                    'sakali ratri ml doke dokyat head morning night laavne',
  'दर बुधवारी आणि शनिवारी रात्री डोक्यात लावणे':                           'budhvari shanivari ratri doke dokyat head wednesday saturday night laavne',
  'आठवड्यातून दोन वेळेस सकाळी डोके धुणे':                                  'aathavda twice week sakali doke wash dhune',
  'एक दिवस आड सकाळी डोके धुणे':                                            'alternate day aad sakali doke wash dhune',
  'सलग तीन दिवस रात्री मानेच्या खाली संपुर्ण शरीरभर लावणे':               'salag teen 3 divas ratri mane khali sharir body laavne continuous',
  'सकाळी आंघोळीनंतर संपुर्ण शरीरभर लावणे':                                 'sakali aanghol bath sharir body laavne morning',
  'डोक्यात लावणे':                                                           'doke dokyat head laavne apply',
  'चेहऱ्यावर लावणे':                                                         'chehara chehra face laavne apply',
  'जांघेत लावणे':                                                            'jangha jane groin laavne apply',
  'बगलेत लावणे':                                                             'bagal armpit laavne apply',
  'नखांना लावणे':                                                            'nakha nail laavne apply',
  'तोंडात लावणे':                                                            'tond mouth laavne apply',
  'ओटांवर लावणे':                                                            'otha lip laavne apply',
  'पाठीवर लावणे':                                                            'pathi back laavne apply',
  'पोटावर लावणे':                                                            'pot stomach belly laavne apply',
  'मांडीला लावणे':                                                           'mandi thigh laavne apply',
  'तळपायावर लावणे':                                                          'talpaya sole foot laavne apply',
  'तळहातावर लावणे':                                                          'talhat palm laavne apply',
  'बोटांना लावणे':                                                           'bota finger laavne apply',
  'मोड्यांवर लावणे':                                                         'modya pimple acne laavne apply',
  'कानाला लावणे':                                                            'kan kana ear laavne apply',
  'कानामध्ये लावणे':                                                         'kanamadhe ear inside laavne apply',
  'डोळ्यावर लावणे':                                                          'dola dolya eye laavne apply',
  'डोळ्याखाली लावणे':                                                        'dolya khali under eye laavne apply',
  'डोळ्यावरती लावणे':                                                        'dolya varti above eye laavne apply',
  'कपाळावर लावणे':                                                           'kapal forehead laavne apply',
  'मानेवर लावणे':                                                            'mana neck laavne apply',
  'गळ्यावर लावणे':                                                           'galya throat neck laavne apply',
  'हाताला लावणे':                                                            'hat arm hand laavne apply',
  'लिंगावर लावणे':                                                           'linga penis laavne apply',
  'अंडकोशावर लावणे':                                                         'andkosh scrotum laavne apply',
  'गुदमार्गावर लावणे':                                                        'gudha anal laavne apply',
  'बसण्याच्या जागी लावणे':                                                   'basne jagi sitting area laavne apply',
  'कोपऱ्यावर लावणे':                                                         'kopara elbow laavne apply',
  'कोपऱ्यामागे लावणे':                                                       'kopara mage behind elbow laavne apply',
  'गुडघ्यावर लावणे':                                                         'gudha gudgha knee laavne apply',
  'गुडघ्यामागे लावणे':                                                       'gudha gudgha mage behind knee laavne apply',
  'मनगटाला लावणे':                                                           'mangat wrist laavne apply',
  'घोट्याला लावणे':                                                          'ghota ankle laavne apply',
  'पायाच्या बोटामध्ये लावणे':                                                'paya bota toe finger laavne apply',
  'हाताच्या बोटामध्ये लावणे':                                                'hat bota finger laavne apply',
  'गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे':               'tapering taper goli 7 divas sakali ratri nantar',
  'गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे':               'tapering taper goli 5 divas sakali ratri nantar',
  'गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे':                 'tapering taper goli 7 divas tinada donada ekda nantar',
  'cream टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे':             'tapering taper cream 7 divas sakali ratri nantar',
  'cream टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे':             'tapering taper cream 5 divas sakali ratri nantar',
  'दर सोमवारी, बुधवारी, शनिवारी १ गोळी घेणे':                              'somvari budhvari shanivari monday wednesday saturday goli weekly',
  'Once weekly':                                                             'once weekly week',
  'As needed':                                                              'as needed sos prn',
  'At bedtime':                                                             'bedtime night ratri zhopane',
  'Before breakfast':                                                       'before breakfast upashi',
  'After meals':                                                            'after meals jevan',
  'SOS':                                                                    'sos as needed emergency',
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
  const { templates, queue, updateQueueStatus, setToast } = useClinic();
  const [searchQuery, setSearchQuery] = useState('');
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
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [freqOpenIndex, setFreqOpenIndex] = useState<number | null>(null);
  const [freqInputDisplay, setFreqInputDisplay] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const templateSearchRef = useRef<HTMLDivElement>(null);

  const selectFollowUpDays = (days: number) => {
    if (days === 0) {
      onUpdateCasePaper({ ...casePaper, followUpDate: '' });
      return;
    }
    const today = new Date();
    today.setDate(today.getDate() + days);
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    onUpdateCasePaper({ ...casePaper, followUpDate: `${yyyy}-${mm}-${dd}` });
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
    defaultFrequency: m.frequency || m.defaultFrequency || 'Twice daily',
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

  // Server-side search with debounce (searches all 42,032 medicines on Supabase)
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

    if (searchQuery.trim() === '') {
      setFilteredMedicines(dbMedicines);
      setIsSearching(false);
      setHighlightedIndex(-1);
      return;
    }

    setIsSearching(true);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await api.searchMedicines(searchQuery.trim());
        if (results && results.length > 0) {
          const normalized = results.map(normalizeMedicine);

          // Sort: prefix matches first
          const lowerQuery = searchQuery.toLowerCase().trim();
          const getCoreName = (fullName: string) =>
            (fullName || '').replace(/^(Tab\.|Cap\.|Syp\.|Inj\.|Cream|Gel \/ Ointment|Lotion|Ointment|Soap|Drops|Powder)\s*/i, '').toLowerCase().trim();

          normalized.sort((a, b) => {
            const aCore = getCoreName(a.name);
            const bCore = getCoreName(b.name);
            const aCoreStarts = aCore.startsWith(lowerQuery);
            const bCoreStarts = bCore.startsWith(lowerQuery);
            if (aCoreStarts && !bCoreStarts) return -1;
            if (!aCoreStarts && bCoreStarts) return 1;
            return aCore.localeCompare(bCore);
          });

          setFilteredMedicines(normalized);
        } else {
          setFilteredMedicines([]);
        }
      } catch {
        // Fallback to local filter
        const lq = searchQuery.toLowerCase().trim();
        setFilteredMedicines(dbMedicines.filter(m =>
          (m.name || '').toLowerCase().includes(lq) ||
          (m.brand || '').toLowerCase().includes(lq)
        ));
      }
      setIsSearching(false);
      setHighlightedIndex(-1);
    }, 250); // 250ms debounce

    return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
  }, [searchQuery, dbMedicines]);
  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newMedicines = template.medicines.map(tm => {
      const med = filteredMedicines.find(m => m.id === tm.medicineId) || dbMedicines.find(m => m.id === tm.medicineId);
      return {
        medicineId: tm.medicineId,
        name: tm.medicineName || (tm as any).name || (med ? med.name : 'Unknown Medicine'),
        dosage: tm.dosage || (med ? `${med.strength || ''} (${med.form || 'Tablet'})` : ''),
        frequency: tm.frequency || (med ? med.defaultFrequency || 'Twice daily' : 'Twice daily'),
        duration: tm.duration || (med ? med.defaultDuration || '7 Days' : '7 Days'),
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

  const addMedicine = (medicineId: string) => {
    const med = filteredMedicines.find(m => m.id === medicineId) || dbMedicines.find(m => m.id === medicineId);
    if (!med) return;

    let fullName = med.name.trim();
    if (med.strength && !fullName.toLowerCase().includes(med.strength.toLowerCase())) {
      fullName = `${fullName} ${med.strength}`;
    }

    const freq = med.defaultFrequency || 'Twice daily';
    const dur = med.defaultDuration || '7 Days';
    const autoCount = calculateMedicineCount({ name: fullName, frequency: freq, duration: dur });

    const newMedicine: CasePaperMedicine = {
      medicineId: med.id,
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
        } else if (field === 'frequency' || field === 'duration') {
          nextMed.isManualCount = false;
          delete nextMed.count;
          nextMed.count = calculateMedicineCount(nextMed);
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

  const handleSaveAndComplete = async () => {
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
    }
  };

  const handleSaveAndPrintPreview = () => {
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
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSearchDropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < filteredMedicines.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredMedicines.length) {
        addMedicine(filteredMedicines[highlightedIndex].id);
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
            <button
              type="button"
              onClick={() => setIsMedicineImportOpen(true)}
              className="btn-secondary text-xs shrink-0 ml-auto sm:hidden"
            >
              <Database className="w-3.5 h-3.5 text-[#047857]" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMedicineImportOpen(true)}
            className="btn-secondary text-xs shrink-0 hidden sm:flex"
          >
            <Database className="w-3.5 h-3.5 text-[#047857]" />
            <span>Import Medicines CSV</span>
          </button>
        </div>
      </div>

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        
        {/* ── LEFT SIDEBAR: PATIENT HISTORY ── */}
        <div className="space-y-5">

          {/* Patient History Card */}
          <div className="section-card">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-4 text-sm flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full bg-[#047857] inline-block"></span>
              Patient History
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="form-label">Chief Complaint</label>
                <textarea 
                  value={casePaper.complaint}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, complaint: e.target.value })}
                  className="form-input"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label">Past History</label>
                <textarea 
                  value={casePaper.pastHistory}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, pastHistory: e.target.value })}
                  className="form-input"
                  rows={2}
                />
              </div>

              <div>
                <label className="form-label form-label-red">⚠ Allergies</label>
                <textarea 
                  value={casePaper.allergies}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, allergies: e.target.value })}
                  className="form-input border-red-200 bg-[#fff5f5] focus:border-red-400 text-red-800"
                  placeholder="No known allergies"
                  rows={2}
                />
              </div>
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
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-xl max-h-64 overflow-auto">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.slice(0, 100).map((med, idx) => (
                      <div 
                        key={med.id}
                        className={`px-4 py-2.5 cursor-pointer border-b border-[#f2eee3] last:border-0 transition-colors ${highlightedIndex === idx ? 'bg-[#ecfdf5]' : 'hover:bg-[#f8f6f0]'}`}
                        onMouseDown={(e) => { e.preventDefault(); addMedicine(med.id); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1a1c1a] text-sm">{med.name}</span>
                          {med.category && (
                            <span className="text-[10px] bg-[#f2eee3] text-[#4b463e] px-2 py-0.5 rounded-md font-semibold border border-[#cdc6ba]">
                              {med.category}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#7c766d] mt-0.5">
                          {med.brand ? `${med.brand} · ` : ''}{med.strength || ''} {med.form || 'Tablet'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-[#7c766d] text-sm">
                      No matches for "<strong>{searchQuery}</strong>". Use Import CSV to add medicines.
                    </div>
                  )}
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
                        value={(med.dosage && !med.name.toLowerCase().includes(med.dosage.toLowerCase())) ? `${med.name} ${med.dosage}` : med.name}
                        onChange={(e) => updateMedicineField(index, 'name', e.target.value)}
                        className="form-input form-input-sm font-semibold text-[#1a1c1a]"
                        placeholder="Medicine Name & Strength"
                      />
                      {/* Frequency — free-text input + suggestions */}
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={freqOpenIndex === index ? freqInputDisplay : (med.frequency || '')}
                          placeholder="Frequency"
                          onFocus={() => {
                            setFreqInputDisplay('');
                            setFreqOpenIndex(index);
                          }}
                          onChange={(e) => {
                            setFreqInputDisplay(e.target.value);
                            setFreqOpenIndex(index);
                          }}
                          className="form-input form-input-sm text-xs w-full"
                        />
                        {freqOpenIndex === index && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl" style={{ zIndex: 9999, width: '260px', maxHeight: '260px', overflowY: 'auto' }}>
                            {FREQUENCIES.filter(f => freqMatchesSearch(f, freqInputDisplay)).map(f => (
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
                      <input
                        type="text"
                        placeholder="7 Days"
                        value={med.duration}
                        onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                        className="form-input form-input-sm"
                      />
                      <input
                        type="text"
                        placeholder="Count"
                        value={calculateMedicineCount(med)}
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
                        value={(med.dosage && !med.name.toLowerCase().includes(med.dosage.toLowerCase())) ? `${med.name} ${med.dosage}` : med.name}
                        onChange={(e) => updateMedicineField(index, 'name', e.target.value)}
                        className="form-input form-input-sm font-semibold text-[#1a1c1a] w-full"
                        placeholder="Medicine Name & Strength"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        {/* Mobile Frequency — free-text input + suggestions */}
                        <div className="relative col-span-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={freqOpenIndex === index ? freqInputDisplay : (med.frequency || '')}
                            placeholder="Frequency"
                            onFocus={() => {
                              setFreqInputDisplay('');
                              setFreqOpenIndex(index);
                            }}
                            onChange={(e) => {
                              setFreqInputDisplay(e.target.value);
                              setFreqOpenIndex(index);
                            }}
                            className="form-input form-input-sm text-xs w-full"
                          />
                          {freqOpenIndex === index && (
                            <div className="absolute left-0 top-full mt-1 bg-white border border-[#e4e2e1] rounded-xl shadow-2xl" style={{ zIndex: 9999, width: '260px', maxHeight: '260px', overflowY: 'auto' }}>
                              {FREQUENCIES.filter(f => freqMatchesSearch(f, freqInputDisplay)).map(f => (
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
                        <input
                          type="text"
                          placeholder="Duration (e.g. 7 Days)"
                          value={med.duration}
                          onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                          className="form-input form-input-sm"
                        />
                        <input
                          type="text"
                          placeholder="Count"
                          value={calculateMedicineCount(med)}
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
                  <div className="text-xs text-[#7c766d]">Select direct days or custom date for patient's next visit</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                className="text-xs text-[#047857] hover:underline font-bold flex items-center gap-1 self-end sm:self-auto"
              >
                {showCustomDatePicker ? '← Use Quick Presets' : '📅 Custom Date Picker'}
              </button>
            </div>

            {!showCustomDatePicker ? (
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
            ) : (
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={casePaper.followUpDate || ''}
                  onChange={(e) => onUpdateCasePaper({ ...casePaper, followUpDate: e.target.value })}
                  className="form-input w-full sm:w-56"
                />
                {casePaper.followUpDate && (
                  <button
                    type="button"
                    onClick={() => onUpdateCasePaper({ ...casePaper, followUpDate: '' })}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}
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

    </div>
  );
}
