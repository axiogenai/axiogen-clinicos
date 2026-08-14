import { useState, useRef, useEffect } from 'react';
import { Trash2, Languages, Loader2 } from 'lucide-react';
import type { TemplateMedicine } from '../data/templates';
import { translateFrequencyToMarathi } from '../utils/marathiTranslator';

interface MedicineEditorRowProps {
  item: TemplateMedicine;
  index: number;
  onUpdate: (index: number, field: keyof TemplateMedicine, value: string) => void;
  onRemove: (index: number) => void;
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
  'आठवड्यातून एकदा घेणे',
  'रात्री झोपताना घेणे',
  'सकाळी उपाशीपोटी घेणे',
  'गरज असेल तेव्हा घेणे',
  'त्रास झाल्यास घेणे (SOS)',
  'सकाळी लावणे १-२ तास ठेवणे',
  'काळ्या डागावर लावणे',
  'pimples (मोड्यांवर) लावणे',
  'full फेस लावणे',
  'डोक्यात लावणे',
  'चेहऱ्यावर लावणे'
];

export default function MedicineEditorRow({ item, index, onUpdate, onRemove }: MedicineEditorRowProps) {
  const [translating, setTranslating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAiTranslate = async () => {
    if (!item.frequency || !item.frequency.trim()) return;
    setTranslating(true);
    try {
      const translated = await translateFrequencyToMarathi(item.frequency);
      if (translated) {
        onUpdate(index, 'frequency', translated);
      }
    } catch {
      /* silent */
    } finally {
      setTranslating(false);
      setShowDropdown(false);
    }
  };

  const filteredFrequencies = FREQUENCIES.filter(f =>
    !item.frequency || f.toLowerCase().includes(item.frequency.toLowerCase())
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:border-gray-300 transition-colors space-y-2.5 sm:space-y-0 sm:flex sm:items-center sm:gap-3">
      {/* Top Header on Mobile: Medicine Name + Delete button */}
      <div className="flex items-center justify-between gap-2 w-full sm:flex-1 min-w-0">
        <div className="font-bold text-xs sm:text-sm text-gray-900 truncate">
          {item.medicineName || 'Unknown Medicine'}
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
          title="Remove medicine"
        >
          <Trash2 className="w-4 h-4 text-red-500" />
        </button>
      </div>
      
      {/* Frequency & Duration Controls */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <div className="relative flex-1 sm:w-64 flex items-center" ref={dropdownRef}>
          <input
            type="text"
            value={item.frequency}
            onChange={(e) => {
              onUpdate(index, 'frequency', e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAiTranslate();
              }
            }}
            placeholder="Frequency (sakali 1 goli)"
            className="w-full px-2.5 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg pr-9 focus:ring-emerald-500 focus:border-emerald-500"
          />
          <button
            type="button"
            title="मराठी भाषांतर"
            onClick={handleAiTranslate}
            disabled={translating}
            className="absolute right-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1 rounded transition-colors z-10 shrink-0"
          >
            {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Languages className="w-3.5 h-3.5" />}
          </button>

          {showDropdown && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-56 overflow-y-auto py-1">
              {item.frequency && !/^[\u0900-\u097F\s\d\:\-\_\,]+$/.test(item.frequency) && (
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleAiTranslate();
                  }}
                  className="w-full text-left px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-b border-emerald-100 flex items-center justify-between text-xs font-medium"
                >
                  <span className="flex items-center gap-1.5">
                    <Languages className="w-3.5 h-3.5 text-emerald-700" />
                    <span>मराठीत रूपांतर करा: "{item.frequency}"</span>
                  </span>
                  <span className="bg-emerald-200 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded font-bold">मराठी</span>
                </button>
              )}
              {filteredFrequencies.length > 0 ? (
                filteredFrequencies.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onUpdate(index, 'frequency', f);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-800 hover:bg-emerald-50 hover:text-emerald-900 transition-colors"
                  >
                    {f}
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-gray-400 italic">No matching frequencies</div>
              )}
            </div>
          )}
        </div>

        <div className="relative shrink-0">
          <input
            type="text"
            value={item.duration}
            onChange={(e) => onUpdate(index, 'duration', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const val = (item.duration || '').trim();
                if (/^\d+$/.test(val)) {
                  onUpdate(index, 'duration', `${val} Days`);
                }
              }
            }}
            placeholder="Duration (7 Days)"
            className="w-28 sm:w-32 px-2.5 py-1.5 text-xs sm:text-sm font-semibold border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
