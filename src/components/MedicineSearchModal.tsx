import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, ArrowRight, Plus, Loader2 } from 'lucide-react';
import type { Medicine } from '../data/medicines';
import type { TemplateMedicine } from '../data/templates';
import { api } from '../api/client';

interface MedicineSearchModalProps {
  onAdd: (med: TemplateMedicine & { medicineName: string }) => void;
  onClose: () => void;
}

const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Thrice daily', 'Four times daily',
  '१ गोळी सकाळी १ गोळी रात्री घेणे', '१/२ गोळी सकाळी घेणे', 'उपाशीपोटी घेणे', 'जेवणानंतर घेणे', 'दर सोमवारी १ गोळी घेणे', 'दर बुधवारी १ गोळी घेणे', 'दर शनिवारी १ गोळी घेणे',
  '७ दिवसानंतर चालू करणे', 'सकाळी लावणे १-२ तास ठेवणे', 'काळ्या डागावर लावणे', 'pimples (मोड्यांवर) लावणे', 'full फेस लावणे',
  'एक दिवस आड सकाळी डोक्यात लावणे (१०-१५ मिनीट ठेवणे)', 'आठवड्यातून दोनदा सकाळी डोक्यात लावणे (१० ते १५ मिनीट ठेवणे)',
  'सकाळी १ml रात्री १ml डोक्यात लावणे', 'दर बुधवारी आणि शनिवारी रात्री डोक्यात लावणे',
  'आठवड्यातून दोन वेळेस सकाळी डोके धुणे', 'एक दिवस आड सकाळी डोके धुणे',
  'सलग तीन दिवस रात्री मानेच्या खाली संपुर्ण शरीरभर लावणे', 'सकाळी आंघोळीनंतर संपुर्ण शरीरभर लावणे',
  'डोक्यात लावणे', 'चेहऱ्यावर लावणे', 'जांघेत लावणे', 'बगलेत लावणे', 'नखांना लावणे', 'तोंडात लावणे', 'ओटांवर लावणे',
  'पाठीवर लावणे', 'पोटावर लावणे', 'मांडीला लावणे', 'तळपायावर लावणे', 'तळहातावर लावणे', 'बोटांना लावणे', 'मोड्यांवर लावणे',
  'कानाला लावणे', 'कानामध्ये लावणे', 'डोळ्यावर लावणे', 'डोळ्याखाली लावणे', 'डोळ्यावरती लावणे', 'कपाळावर लावणे',
  'मानेवर लावणे', 'गळ्यावर लावणे', 'हाताला लावणे', 'लिंगावर लावणे', 'अंडकोशावर लावणे', 'गुदमार्गावर लावणे',
  'बसण्याच्या जागी लावणे', 'कोपऱ्यावर लावणे', 'कोपऱ्यामागे लावणे', 'गुडघ्यावर लावणे', 'गुडघ्यामागे लावणे',
  'मनगटाला लावणे', 'घोट्याला लावणे', 'पायाच्या बोटामध्ये लावणे', 'हाताच्या बोटामध्ये लावणे',
  'Tapering Tab: 7d (BD -> OD)', 'Tapering Tab: 5d (BD -> OD)', 'Tapering Tab: 7d (TDS -> BD -> OD)',
  'Tapering Cream: 7d (BD -> OD)', 'Tapering Cream: 5d (BD -> OD)',
  'Once weekly', 'As needed', 'At bedtime', 'Before breakfast', 'After meals', 'SOS'
];

function normalizeMed(m: any, idx: number): Medicine {
  return {
    id: m.id || m.productId || `med_${idx}`,
    name: m.name || m['Medicine Name'] || m.productId || `Medicine #${idx + 1}`,
    brand: m.brand || '',
    strength: m.strength || '',
    form: m.form || 'Tablet',
    category: m.category || 'General',
    defaultFrequency: m.frequency || m.defaultFrequency || 'Twice daily',
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
  const [frequency, setFrequency] = useState('Twice daily');
  const [duration, setDuration] = useState('7 days');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load total count + initial list on mount
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();

    // Get total count for the label
    api.getMedicineCount().then(({ count }) => setTotalCount(count)).catch(() => {});

    // Load initial list (first 50 alphabetically) to show something immediately
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
    setFrequency(med.defaultFrequency || 'Twice daily');
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
      defaultFrequency: 'Twice daily',
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in duration-200">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
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
                      <div>
                        <div className="font-semibold text-gray-900 text-sm group-hover:text-indigo-900">{med.name}</div>
                        <div className="text-xs text-gray-500">
                          {med.strength || ''} {med.form ? `• ${med.form}` : ''} {med.category ? `• ${med.category}` : ''}
                        </div>
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
              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-lg flex justify-between items-center">
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

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                  Dosage / Strength
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Frequency
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    {FREQUENCIES.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="e.g. 7 days"
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end gap-2">
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
