import { useState, useRef, useEffect } from 'react';
import { Sparkles, Pill, FlaskConical, Lightbulb, Calendar, ArrowLeft, Printer, Trash2, Database, CheckCircle2 } from 'lucide-react';
import type { Patient } from '../data/patients';
import { medicines as initialLocalMedicines } from '../data/medicines';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import type { CasePaper, CasePaperMedicine } from '../types';
import MedicineImportModal from './MedicineImportModal';

interface CasepaperFormProps {
  patient: Patient;
  queueId?: string | null;
  casePaper: CasePaper;
  onUpdateCasePaper: (cp: CasePaper) => void;
  onPrintPreview: () => void;
  onBack: () => void;
}

const FREQUENCIES = [
  'Once daily', 'Twice daily', 'Thrice daily', 'Four times daily',
  'Once weekly', 'As needed', 'At bedtime', 'Before breakfast', 'After meals', 'SOS'
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

export default function CasepaperForm({ patient, queueId, casePaper, onUpdateCasePaper, onPrintPreview, onBack }: CasepaperFormProps) {
  const { templates, queue, updateQueueStatus, setToast } = useClinic();
  const [searchQuery, setSearchQuery] = useState('');
  const [dbMedicines, setDbMedicines] = useState<any[]>(initialLocalMedicines);
  const [filteredMedicines, setFilteredMedicines] = useState<any[]>(initialLocalMedicines);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMedicineImportOpen, setIsMedicineImportOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch and normalize medicines from backend API
  const loadMedicines = async () => {
    try {
      const fetched = await api.getMedicines();
      if (fetched && fetched.length > 0) {
        const normalized = fetched.map((m: any, idx: number) => ({
          id: m.id || m.productId || `med_${idx}`,
          name: m.name || m['Medicine Name'] || m.productId || `Medicine #${idx + 1}`,
          brand: m.brand || m['Brand'] || '',
          strength: m.strength || m['Strength'] || '',
          form: m.form || m['Form'] || 'Tablet',
          category: m.category || m['Category'] || 'General',
          defaultFrequency: m.frequency || m.defaultFrequency || 'Twice daily',
          defaultDuration: m.duration || m.defaultDuration || '7 Days',
        }));
        setDbMedicines(normalized);
        setFilteredMedicines(normalized);
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    loadMedicines();
  }, []);

  // Real-time search matching name, brand, strength, form, category, product ID
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredMedicines(dbMedicines);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const matches = dbMedicines.filter((m) => {
        const nameMatch = (m.name || '').toLowerCase().includes(lowerQuery);
        const brandMatch = (m.brand || '').toLowerCase().includes(lowerQuery);
        const strengthMatch = (m.strength || '').toLowerCase().includes(lowerQuery);
        const formMatch = (m.form || '').toLowerCase().includes(lowerQuery);
        const categoryMatch = (m.category || '').toLowerCase().includes(lowerQuery);
        const idMatch = (m.id || '').toLowerCase().includes(lowerQuery);
        return nameMatch || brandMatch || strengthMatch || formMatch || categoryMatch || idMatch;
      });
      setFilteredMedicines(matches);
    }
    setHighlightedIndex(-1);
  }, [searchQuery, dbMedicines]);

  const applyTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    const newMedicines = template.medicines.map(tm => {
      const med = dbMedicines.find(m => m.id === tm.medicineId);
      return {
        medicineId: tm.medicineId,
        name: tm.medicineName || (med ? med.name : 'Unknown Medicine'),
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
    const med = dbMedicines.find(m => m.id === medicineId);
    if (!med) return;

    const newMedicine: CasePaperMedicine = {
      medicineId: med.id,
      name: med.name,
      dosage: `${med.strength || ''} ${med.form || ''}`.trim(),
      frequency: med.defaultFrequency || 'Twice daily',
      duration: med.defaultDuration || '7 Days',
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
      if (i === index) return { ...m, [field]: value };
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

  const handleSaveAndPrintPreview = async () => {
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
    } catch {
      // Local sync
    }

    onPrintPreview();
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
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#faf9f6] p-5 rounded-2xl border border-[#e4e2e1] shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 bg-[#f2eee3] hover:bg-[#e8e2d2] rounded-xl border border-[#cdc6ba] transition-colors text-[#4b463e]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#1a1c1a]">{patient.name}</h2>
            <p className="text-xs text-[#7c766d]">
              {patient.age} Yrs / {patient.gender} • Phone: {patient.phone} • Village: {patient.village || 'N/A'}
            </p>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setIsMedicineImportOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5"
          >
            <Database className="w-4 h-4 text-emerald-100" />
            <span>Import Medicines (CSV/Excel)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT SIDEBAR: PATIENT HISTORY */}
        <div className="space-y-6">
          <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1]">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm">Patient History</h3>
            
            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-[#4b463e] font-semibold mb-1 block">Chief Complaint</label>
              <textarea 
                value={casePaper.complaint}
                onChange={(e) => onUpdateCasePaper({ ...casePaper, complaint: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
                rows={2}
              />
            </div>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-[#4b463e] font-semibold mb-1 block">Past History</label>
              <textarea 
                value={casePaper.pastHistory}
                onChange={(e) => onUpdateCasePaper({ ...casePaper, pastHistory: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-gray-50"
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-red-600 font-semibold mb-1 block">Allergies</label>
              <textarea 
                value={casePaper.allergies}
                onChange={(e) => onUpdateCasePaper({ ...casePaper, allergies: e.target.value })}
                className="w-full p-2 border border-red-200 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm bg-red-50 text-red-700"
                placeholder="No known allergies"
                rows={2}
              />
            </div>
          </div>

          {patient.pastVisits && patient.pastVisits.length > 0 && (
            <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1]">
              <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm">Past Visits</h3>
              <div className="space-y-3">
                {patient.pastVisits.map((visit, i) => (
                  <div key={i} className="flex justify-between items-start text-sm pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-gray-800">{visit.diagnosis}</div>
                      <div className="text-xs text-gray-500">Template: {visit.template}</div>
                    </div>
                    <div className="text-gray-400 whitespace-nowrap ml-2">{visit.date}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DOCTOR WORKSPACE */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* Templates */}
          <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1]">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#047857]" />
              Prescription Templates
            </h3>
            <div className="flex flex-wrap gap-2">
              {templates.map(t => (
                <button 
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t.id)}
                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Prescription */}
          <div className="bg-[#faf9f6] p-6 rounded-xl shadow-sm border border-[#e4e2e1]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif font-bold text-[#1a1c1a] text-lg flex items-center gap-2">
                <Pill className="w-5 h-5 text-[#047857]" />
                Rx (Prescription)
              </h3>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                {dbMedicines.length} Medicines Active
              </span>
            </div>
            
            <div className="relative mb-6">
              <input 
                ref={searchInputRef}
                type="text" 
                placeholder={`Search ${dbMedicines.length} medicines by name, brand, strength, form, category...`} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm text-sm"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                onFocus={() => setShowSearchDropdown(true)}
                onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                onKeyDown={handleSearchKeyDown}
              />
              
              {showSearchDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-auto">
                  {filteredMedicines.length > 0 ? (
                    filteredMedicines.slice(0, 100).map((med, idx) => (
                      <div 
                        key={med.id}
                        className={`p-3 cursor-pointer border-b border-gray-100 last:border-0 ${highlightedIndex === idx ? 'bg-indigo-50' : 'hover:bg-gray-50'}`}
                        onMouseDown={(e) => { e.preventDefault(); addMedicine(med.id); }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{med.name}</span>
                          {med.category && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                              {med.category}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {med.brand ? `Brand: ${med.brand} • ` : ''}{med.strength || ''} • {med.form || 'Tablet'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No medicines matching "{searchQuery}". Click "+ Import Medicines (CSV/Excel)" to add items.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {casePaper.medicines.length === 0 ? (
                <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-xs">
                  No medicines added yet. Search above or click "+ Import Medicines (CSV/Excel)".
                </div>
              ) : (
                casePaper.medicines.map((med, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="font-bold text-gray-800 text-sm min-w-[160px]">
                      {med.name}
                    </div>

                    <input 
                      type="text" 
                      placeholder="Dosage (e.g. 150mg)" 
                      value={med.dosage}
                      onChange={(e) => updateMedicineField(index, 'dosage', e.target.value)}
                      className="p-1.5 border border-gray-300 rounded text-xs w-full sm:w-28 bg-white"
                    />

                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedicineField(index, 'frequency', e.target.value)}
                      className="p-1.5 border border-gray-300 rounded text-xs w-full sm:w-36 bg-white"
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <input 
                      type="text" 
                      placeholder="Duration (e.g. 7 Days)" 
                      value={med.duration}
                      onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                      className="p-1.5 border border-gray-300 rounded text-xs w-full sm:w-28 bg-white"
                    />

                    <button 
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="text-red-600 hover:text-red-700 p-1.5 rounded hover:bg-red-50 sm:ml-auto transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Investigations */}
          <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1]">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-[#047857]" />
              Investigations Advised
            </h3>
            <div className="flex flex-wrap gap-2">
              {INVESTIGATIONS.map(inv => {
                const isSelected = (casePaper.investigationsAdvised || []).includes(inv);
                return (
                  <button 
                    key={inv}
                    type="button"
                    onClick={() => toggleInvestigation(inv)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                      isSelected 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {inv}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counselling */}
          <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1]">
            <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#047857]" />
              Patient Counselling Checklist
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {COUNSELLING.map(item => {
                const isChecked = (casePaper.counsellingDone || []).includes(item);
                return (
                  <label key={item} className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input 
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCounselling(item)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Follow up Date */}
          <div className="bg-[#faf9f6] p-5 rounded-xl shadow-sm border border-[#e4e2e1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#047857]" />
              <div>
                <div className="font-serif font-bold text-[#1a1c1a] text-sm">Follow-up Date</div>
                <div className="text-xs text-gray-500">Select scheduled return date for patient</div>
              </div>
            </div>

            <input 
              type="date"
              value={casePaper.followUpDate}
              onChange={(e) => onUpdateCasePaper({ ...casePaper, followUpDate: e.target.value })}
              className="p-2 border border-gray-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50"
            />
          </div>

          {/* Bottom Consultation Action Bar */}
          <div className="bg-[#faf9f6] p-5 rounded-2xl shadow-md border border-[#e4e2e1] flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#f2eee3] hover:bg-[#e8e2d2] text-[#4b463e] font-bold text-xs rounded-xl border border-[#cdc6ba] transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Patient Queue</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveAndComplete}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#1a1c1a] hover:bg-[#2d2d2d] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Complete Consultation & Save</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPrintPreview}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#065f46] hover:to-[#047857] text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <Printer className="w-4 h-4 text-white" />
                <span>Print Prescription & Preview</span>
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

    </div>
  );
}
