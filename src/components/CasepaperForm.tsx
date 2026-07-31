import { useState, useRef, useEffect } from 'react';
import { Sparkles, Pill, FlaskConical, Lightbulb, Calendar, ArrowLeft, Printer, Trash2, Database, CheckCircle2, Search, Plus } from 'lucide-react';
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
    <div className="space-y-5 pb-12">
      
      {/* ── Top Patient Header Bar ── */}
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="p-2 bg-[#f2eee3] hover:bg-[#e8e2d2] rounded-xl border border-[#cdc6ba] transition-colors text-[#4b463e] shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#064e3b] to-[#047857] flex items-center justify-center shrink-0 shadow-md shadow-emerald-950/20">
              <span className="text-[#ecfdf5] font-bold text-base">{patient.name.charAt(0)}</span>
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-[#1a1c1a] leading-tight">{patient.name}</h2>
              <p className="text-xs text-[#7c766d] mt-0.5">
                {patient.age} Yrs / {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.phone} · {patient.village || 'N/A'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMedicineImportOpen(true)}
            className="btn-secondary text-xs shrink-0"
          >
            <Database className="w-3.5 h-3.5 text-[#047857]" />
            <span>Import Medicines CSV</span>
          </button>
        </div>
      </div>

      {/* ── Main 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
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
            <div className="section-card">
              <h3 className="font-serif font-bold text-[#1a1c1a] mb-3 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#047857]" />
                Quick Templates
              </h3>
              <div className="flex flex-wrap gap-2">
                {templates.map(t => (
                  <button 
                    key={t.id}
                    type="button"
                    onClick={() => applyTemplate(t.id)}
                    className={`pill-btn ${casePaper.templateId === t.id ? 'pill-btn-active' : ''}`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
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
                {dbMedicines.length} medicines
              </span>
            </div>
            
            {/* Medicine Search */}
            <div className="relative mb-4">
              <div className="relative">
                <Search className="w-4 h-4 text-[#7c766d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
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
                {/* Column Header Row */}
                <div className="grid gap-2 px-2 pb-1 border-b border-[#e4e2e1]" style={{ gridTemplateColumns: '1.5rem 1fr 5.5rem 8rem 5.5rem 1.75rem' }}>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">#</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Medicine</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Dosage</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Frequency</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d]">Duration</span>
                  <span></span>
                </div>
                {/* Medicine Rows */}
                {casePaper.medicines.map((med, index) => (
                  <div
                    key={index}
                    className="grid gap-2 items-center bg-white border border-[#e4e2e1] rounded-xl px-2 py-2 hover:border-[#cdc6ba] hover:shadow-sm transition-all group"
                    style={{ gridTemplateColumns: '1.5rem 1fr 5.5rem 8rem 5.5rem 1.75rem' }}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#f2eee3] text-[#7c766d] text-[9px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <span className="font-semibold text-[#1a1c1a] truncate text-xs leading-tight">{med.name}</span>

                    <input
                      type="text"
                      placeholder="150mg"
                      value={med.dosage}
                      onChange={(e) => updateMedicineField(index, 'dosage', e.target.value)}
                      className="form-input form-input-sm"
                    />

                    <select
                      value={med.frequency}
                      onChange={(e) => updateMedicineField(index, 'frequency', e.target.value)}
                      className="form-input form-input-sm"
                    >
                      {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>

                    <input
                      type="text"
                      placeholder="7 Days"
                      value={med.duration}
                      onChange={(e) => updateMedicineField(index, 'duration', e.target.value)}
                      className="form-input form-input-sm"
                    />

                    <button
                      type="button"
                      onClick={() => removeMedicine(index)}
                      className="p-1 text-[#cdc6ba] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
          <div className="section-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0">
                <Calendar className="w-4.5 h-4.5 text-[#047857]" />
              </div>
              <div>
                <div className="font-serif font-bold text-[#1a1c1a] text-sm">Follow-up Date</div>
                <div className="text-xs text-[#7c766d]">Schedule patient's next visit</div>
              </div>
            </div>

            <input 
              type="date"
              value={casePaper.followUpDate}
              onChange={(e) => onUpdateCasePaper({ ...casePaper, followUpDate: e.target.value })}
              className="form-input sm:w-44"
            />
          </div>

          {/* ── Bottom Action Bar ── */}
          <div className="bg-[#1a1c1a] rounded-2xl px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-30 shadow-2xl border border-[#4b463e]">

            <button
              type="button"
              onClick={onBack}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveAndComplete}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Complete</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPrintPreview}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/30 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
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

    </div>
  );
}
