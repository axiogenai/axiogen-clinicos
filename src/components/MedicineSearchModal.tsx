import { useState, useRef, useEffect } from 'react';
import { X, Search, ArrowRight, Plus } from 'lucide-react';
import type { Medicine } from '../data/medicines';
import type { TemplateMedicine } from '../data/templates';

interface MedicineSearchModalProps {
  medicines: Medicine[];
  onAdd: (med: TemplateMedicine & { medicineName: string }) => void;
  onClose: () => void;
}

const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Thrice daily', 'Four times daily',
  'Once weekly', 'As needed', 'At bedtime', 'Before breakfast', 'After meals', 'SOS'
];

export default function MedicineSearchModal({ medicines, onAdd, onClose }: MedicineSearchModalProps) {
  const [search, setSearch] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Twice daily');
  const [duration, setDuration] = useState('7 days');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const filtered = search.trim() === ''
    ? []
    : medicines.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.strength.toLowerCase().includes(search.toLowerCase()) ||
        m.form.toLowerCase().includes(search.toLowerCase())
      );

  const handleSelectMed = (med: Medicine) => {
    setSelectedMed(med);
    setDosage(`${med.strength} (${med.form})`);
    setFrequency(med.defaultFrequency || 'Twice daily');
    setDuration(med.defaultDuration || '7 days');
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Search Drug Formulary
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Type medicine name (e.g. Amoxicillin, Doxycycline)..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="mt-3 max-h-60 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg">
                {filtered.length > 0 ? (
                  filtered.map((med) => (
                    <div
                      key={med.id}
                      onClick={() => handleSelectMed(med)}
                      className="p-3 hover:bg-indigo-50 cursor-pointer transition-colors flex justify-between items-center"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{med.name}</div>
                        <div className="text-xs text-gray-500">{med.strength} • {med.form}</div>
                      </div>
                      <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                        <span>Select</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-400">
                    {search ? 'No matching medicines found.' : 'Start typing to search drug database...'}
                  </div>
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
