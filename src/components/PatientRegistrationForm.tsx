import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  UserPlus, 
  Phone, 
  MapPin, 
  AlertCircle, 
  AlertTriangle, 
  ArrowRight, 
  Plus, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Check, 
  Clock, 
  Search, 
  X, 
  CheckCircle2, 
  RefreshCw,
  Users
} from 'lucide-react';
import type { Patient } from '../data/patients';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import { filterAndSortPatients } from './PatientSearch';

interface Props {
  selectedPatient: Patient | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onClearSelected: () => void;
  onSelectExistingPatient?: (patient: Patient) => void;
}

export default function PatientRegistrationForm({ 
  selectedPatient, 
  onSubmit, 
  onCancel, 
  onClearSelected, 
  onSelectExistingPatient 
}: Props) {
  const { patients, queue, refreshPatients } = useClinic();

  // Mode: 'existing' = Search & Add Existing Patient, 'new' = Register New Patient
  const [activeTab, setActiveTab] = useState<'existing' | 'new'>(selectedPatient ? 'existing' : 'existing');
  const [searchQuery, setSearchQuery] = useState('');
  const [chosenPatient, setChosenPatient] = useState<Patient | null>(selectedPatient);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  // Field Refs for Auto-Focus Sequence on Enter Key
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const ageInputRef = useRef<HTMLInputElement>(null);
  const genderSelectRef = useRef<HTMLButtonElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const villageInputRef = useRef<HTMLInputElement>(null);
  const historyInputRef = useRef<HTMLTextAreaElement>(null);
  const allergiesInputRef = useRef<HTMLTextAreaElement>(null);
  const complaintInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  // Auto-focus on tab switch
  useEffect(() => {
    if (activeTab === 'existing') {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    } else {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [activeTab]);

  // Sync when selectedPatient prop changes
  useEffect(() => {
    if (selectedPatient) {
      setChosenPatient(selectedPatient);
      setActiveTab('existing');
      setTimeout(() => complaintInputRef.current?.focus(), 50);
    }
  }, [selectedPatient]);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'M' as 'M' | 'F' | 'Other',
    phone: '',
    village: '',
    chiefComplaint: '',
    receptionNotes: '',
    pastMedicalHistory: 'No known allergies',
    allergies: '',
    paymentStatus: 'unpaid' as 'paid' | 'unpaid',
    paymentMode: 'cash' as 'cash' | 'online',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time search for existing patients
  const searchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2) return [];
    return filterAndSortPatients(patients, q).slice(0, 15);
  }, [patients, searchQuery]);

  // Real-time Duplicate Mobile Check for New Patient mode
  const duplicatePatient = useMemo(() => {
    if (activeTab === 'existing' || chosenPatient) return null;
    const clean = formData.phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return patients.find(p => p.phone === clean);
    }
    return null;
  }, [formData.phone, patients, activeTab, chosenPatient]);

  // Check if chosen patient or target is already in today's active queue
  const isAlreadyInQueue = useMemo(() => {
    const targetPatientId = chosenPatient?.id || duplicatePatient?.id;
    const cleanPhone = (activeTab === 'existing' && chosenPatient ? chosenPatient.phone : formData.phone).replace(/\D/g, '');

    return queue.some(q => {
      if (q.status === 'completed') return false;
      if (targetPatientId && q.patientId === targetPatientId) return true;
      if (cleanPhone && cleanPhone.length === 10 && q.phone === cleanPhone) return true;
      return false;
    });
  }, [chosenPatient, duplicatePatient, formData.phone, queue, activeTab]);

  const handleRenewValidity = async (patientId: string) => {
    setRenewingId(patientId);
    try {
      await api.renewPatient(patientId, 2);
      if (typeof refreshPatients === 'function') {
        await refreshPatients();
      }
    } catch (e) {
      console.error('Renew failed', e);
    } finally {
      setRenewingId(null);
    }
  };

  // Helper for Enter key progression
  const handleKeyDown = (e: React.KeyboardEvent, nextRef?: React.RefObject<any>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      }
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (activeTab === 'new') {
      const trimmedName = formData.name.trim();
      if (!trimmedName || trimmedName.length < 2) {
        newErrors.name = 'Full name is required (at least 2 characters)';
      } else if (!/^[a-zA-Z\s\.\-']+$/.test(trimmedName)) {
        newErrors.name = 'Patient name should only contain letters, spaces, dots or hyphens';
      }

      const cleanPhone = formData.phone.replace(/\D/g, '');
      if (!cleanPhone || cleanPhone.length !== 10) {
        newErrors.phone = 'Valid 10-digit mobile number required';
      } else if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
        newErrors.phone = 'Mobile number must start with 6, 7, 8, or 9 (valid Indian mobile)';
      }

      if (formData.age.trim()) {
        const numAge = Number(formData.age);
        if (isNaN(numAge) || !Number.isInteger(numAge) || numAge < 0 || numAge > 120) {
          newErrors.age = 'Age must be a valid whole number between 0 and 120';
        }
      }

      const trimmedVillage = formData.village.trim();
      if (!trimmedVillage || trimmedVillage.length < 2) {
        newErrors.village = 'Village/Town name is required (at least 2 characters)';
      }

      if (duplicatePatient) {
        newErrors.phone = `A patient with mobile ${formData.phone} is already registered (${duplicatePatient.name})`;
      }
    } else {
      if (!chosenPatient) {
        newErrors.patient = 'Please search and select an existing patient first, or switch to Register New Patient.';
      }
    }

    if (isAlreadyInQueue) {
      newErrors.queue = 'Patient is already in today’s active consultation queue!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (activeTab === 'existing' && chosenPatient) {
      onSubmit({
        ...chosenPatient,
        chiefComplaint: formData.chiefComplaint,
        complaint: formData.chiefComplaint,
        receptionNotes: formData.receptionNotes,
        notes: formData.receptionNotes,
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode,
      });
    } else {
      onSubmit({
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age, 10) : 0,
        gender: formData.gender,
        phone: formData.phone.replace(/\D/g, ''),
        village: formData.village.trim(),
        pastHistory: formData.pastMedicalHistory,
        allergies: formData.allergies,
        chiefComplaint: formData.chiefComplaint,
        complaint: formData.chiefComplaint,
        receptionNotes: formData.receptionNotes,
        notes: formData.receptionNotes,
        paymentStatus: formData.paymentStatus,
        paymentMode: formData.paymentMode,
      });
    }
  };

  const renderValidityBadge = (validity?: string) => {
    if (!validity) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
          <AlertCircle className="w-3 h-3 text-stone-500 shrink-0" />
          <span>No validity date</span>
        </span>
      );
    }
    const expiry = new Date(validity);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
    const fmt = expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    if (daysLeft < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
          <span>Expired on {fmt}</span>
        </span>
      );
    }
    if (daysLeft <= 7) {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span>Expiring in {daysLeft}d ({fmt})</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
        <span>Valid till {fmt}</span>
      </span>
    );
  };

  return (
    <div className="bg-[#faf9f6] border border-[#e4e2e1] rounded-2xl shadow-sm overflow-hidden">
      
      {/* ── 2 Main Options Tabs ── */}
      <div className="bg-[#f8f6f0] border-b border-[#e4e2e1] p-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-[#f2eee3] p-1 border border-[#cdc6ba] w-full sm:w-auto">
          {/* Option 1: Existing Patient */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('existing');
              setErrors({});
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'existing'
                ? 'bg-white text-[#047857] shadow-sm border border-[#e4e2e1]'
                : 'text-[#7c766d] hover:text-[#1a1c1a]'
            }`}
          >
            <Users className="w-4 h-4 text-[#047857]" />
            <span>Option 1: Existing Patient (Add to Queue)</span>
          </button>

          {/* Option 2: Register New Patient */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('new');
              setChosenPatient(null);
              setErrors({});
            }}
            className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'new'
                ? 'bg-white text-[#047857] shadow-sm border border-[#e4e2e1]'
                : 'text-[#7c766d] hover:text-[#1a1c1a]'
            }`}
          >
            <UserPlus className="w-4 h-4 text-[#047857]" />
            <span>Option 2: Register New Patient</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="btn-secondary text-xs"
        >
          Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* Duplicate Queue Alert */}
        {isAlreadyInQueue && (
          <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center gap-2.5 text-xs text-[#991b1b] shadow-xs">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span><strong className="font-bold">Duplicate Warning:</strong> This patient is already in today's active consultation queue!</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* OPTION 1: EXISTING PATIENT SEARCH & SELECT             */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'existing' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#1a1c1a] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Search Existing Patient</span>
                </label>
                <span className="text-[11px] text-[#7c766d]">Type name, 10-digit mobile, or village (Press Enter to navigate)</span>
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c766d]" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    if (chosenPatient && e.target.value) {
                      setChosenPatient(null);
                    }
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (searchResults.length > 0) {
                        setChosenPatient(searchResults[0]);
                        setSearchQuery(searchResults[0].name);
                        setTimeout(() => complaintInputRef.current?.focus(), 50);
                      }
                    }
                  }}
                  placeholder="e.g. Ramesh, 9876543210, or Peth Vadgaon..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#e4e2e1] bg-white text-sm text-[#1a1c1a] placeholder-[#7c766d] focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setChosenPatient(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7c766d] hover:text-[#1a1c1a]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Dropdown List */}
            {searchQuery.trim().length >= 2 && !chosenPatient && (
              <div className="border border-[#e4e2e1] rounded-xl bg-white shadow-md overflow-hidden max-h-64 overflow-y-auto divide-y divide-[#e4e2e1]">
                {searchResults.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#7c766d]">
                    <p className="font-semibold text-[#1a1c1a]">No registered patient found for "{searchQuery}"</p>
                    <p className="mt-1">Is this a first-time visitor?</p>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('new');
                        setFormData(prev => ({ ...prev, name: searchQuery }));
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#047857] text-white text-xs font-bold rounded-lg hover:bg-[#064e3b] transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register "{searchQuery}" as New Patient</span>
                    </button>
                  </div>
                ) : (
                  searchResults.map(p => {
                    const inQ = queue.some(q => q.status !== 'completed' && q.patientId === p.id);
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setChosenPatient(p);
                          setSearchQuery(p.name);
                          setTimeout(() => complaintInputRef.current?.focus(), 50);
                        }}
                        className="p-3 hover:bg-[#f8f6f0] cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#1a1c1a] flex items-center gap-2">
                            <span>{p.name}</span>
                            <span className="text-xs text-[#7c766d] font-normal">({p.age}y · {p.gender === 'M' ? 'Male' : 'Female'})</span>
                          </div>
                          <div className="text-xs text-[#7c766d] flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#047857]" />{p.phone}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.village || 'N/A'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {renderValidityBadge(p.validity)}
                          {inQ ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              In Queue
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-[#047857] flex items-center gap-1">
                              <span>Select</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Selected Patient Card */}
            {chosenPatient ? (
              <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#064e3b] to-[#047857] text-[#ecfdf5] font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                    {chosenPatient.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-[#1a1c1a] text-sm">{chosenPatient.name}</p>
                      <span className="text-[11px] text-[#047857] font-semibold">({chosenPatient.age} yrs · {chosenPatient.gender === 'M' ? 'Male' : 'Female'})</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#4b463e] mt-1">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-[#047857]" />{chosenPatient.phone}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[#7c766d]" />{chosenPatient.village || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {renderValidityBadge(chosenPatient.validity)}
                  <button
                    type="button"
                    disabled={renewingId === chosenPatient.id}
                    onClick={() => handleRenewValidity(chosenPatient.id)}
                    className="flex items-center gap-1 text-[11px] font-bold py-1 px-2.5 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-all cursor-pointer"
                    title="Renew validity by 2 months"
                  >
                    <RefreshCw className={`w-3 h-3 ${renewingId === chosenPatient.id ? 'animate-spin' : ''}`} />
                    <span>{renewingId === chosenPatient.id ? '…' : 'Renew (+2 Mo)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setChosenPatient(null);
                      setSearchQuery('');
                      onClearSelected();
                    }}
                    className="text-xs text-[#7c766d] hover:text-[#1a1c1a] underline ml-2 cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            ) : (
              !searchQuery && (
                <div className="p-6 bg-[#f8f6f0] border border-dashed border-[#cdc6ba] rounded-xl text-center">
                  <Search className="w-8 h-8 text-[#7c766d] mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-[#1a1c1a]">Search a returning patient above</p>
                  <p className="text-xs text-[#7c766d] mt-1">Or if this is a first-time visitor, switch to Option 2: Register New Patient</p>
                </div>
              )
            )}

            {errors.patient && (
              <p className="text-red-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.patient}</p>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* OPTION 2: REGISTER NEW PATIENT FORM                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'new' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#e4e2e1] pb-2">
              <p className="form-label text-[#047857] flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-[#047857]" />
                <span>New Patient Registration Demographics</span>
              </p>
              <span className="text-[11px] text-[#7c766d]">Press <strong>Enter</strong> to jump to next field</span>
            </div>

            {/* Duplicate Mobile Alert */}
            {duplicatePatient && (
              <div className="p-3.5 bg-[#fffbeb] border border-[#fde68a] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400e] shadow-xs">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4.5 h-4.5 text-[#b45309] shrink-0" />
                  <div>
                    <span className="font-bold text-[#b45309]">Existing Patient Match:</span> Patient <strong className="text-[#78350f]">{duplicatePatient.name}</strong> ({duplicatePatient.age} YRS · {duplicatePatient.village || 'N/A'}) is already registered with mobile <strong className="text-[#78350f]">{duplicatePatient.phone}</strong>.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setChosenPatient(duplicatePatient);
                    setActiveTab('existing');
                    if (onSelectExistingPatient) onSelectExistingPatient(duplicatePatient);
                  }}
                  className="px-3.5 py-1.5 bg-[#b45309] hover:bg-[#92400e] text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
                >
                  <span>Select & Add to Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                <input 
                  ref={nameInputRef}
                  type="text" 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  onKeyDown={e => handleKeyDown(e, ageInputRef)}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Age (Optional)</label>
                  <input 
                    ref={ageInputRef}
                    type="number" 
                    className={`form-input ${errors.age ? 'error' : ''}`}
                    placeholder="Years"
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})} 
                    onKeyDown={e => handleKeyDown(e, genderSelectRef)}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>}
                </div>

                <div>
                  <label className="form-label">Gender <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                    {[
                      { val: 'M' as const, label: 'Male' },
                      { val: 'F' as const, label: 'Female' }
                    ].map(g => (
                      <button
                        key={g.val}
                        type="button"
                        ref={g.val === formData.gender ? genderSelectRef : undefined}
                        onClick={() => setFormData({ ...formData, gender: g.val })}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            phoneInputRef.current?.focus();
                          } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                            e.preventDefault();
                            setFormData({ ...formData, gender: g.val === 'M' ? 'F' : 'M' });
                          }
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          formData.gender === g.val
                            ? 'bg-[#047857] text-white border-[#047857] shadow-xs'
                            : 'bg-white text-[#4b463e] border-[#e4e2e1] hover:bg-[#faf9f6]'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label">Phone Number <span className="text-red-500">*</span> (10 Digits)</label>
                <input 
                  ref={phoneInputRef}
                  type="tel" 
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="e.g. 9876543210"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  onKeyDown={e => handleKeyDown(e, villageInputRef)}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
              </div>

              <div>
                <label className="form-label">Village / Town <span className="text-red-500">*</span></label>
                <input 
                  ref={villageInputRef}
                  type="text" 
                  className={`form-input ${errors.village ? 'error' : ''}`}
                  placeholder="e.g. Shirur, Pune"
                  value={formData.village} 
                  onChange={e => setFormData({...formData, village: e.target.value})} 
                  onKeyDown={e => handleKeyDown(e, complaintInputRef)}
                />
                {errors.village && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.village}</p>}
              </div>

              <div>
                <label className="form-label">Past Medical History</label>
                <textarea 
                  ref={historyInputRef}
                  className="form-input"
                  rows={2}
                  placeholder="Known conditions (e.g. Hypertension, Diabetes)..."
                  value={formData.pastMedicalHistory} 
                  onChange={e => setFormData({...formData, pastMedicalHistory: e.target.value})} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      allergiesInputRef.current?.focus();
                    }
                  }}
                />
              </div>

              <div>
                <label className="form-label">Known Allergies</label>
                <textarea 
                  ref={allergiesInputRef}
                  className="form-input"
                  rows={2}
                  placeholder="Known drug/food allergies (e.g. Sulfa, Penicillin)..."
                  value={formData.allergies} 
                  onChange={e => setFormData({...formData, allergies: e.target.value})} 
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      complaintInputRef.current?.focus();
                    }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TODAY'S VISIT & PAYMENT (Common to Both Modes)         */}
        {/* ═══════════════════════════════════════════════════════ */}
        <div className="space-y-4 pt-4 border-t border-[#e4e2e1]">
          <p className="form-label text-[#047857]">— Today's Visit Details —</p>
          
          <div>
            <label className="form-label">Chief Complaint (Optional)</label>
            <input 
              ref={complaintInputRef}
              type="text" 
              className="form-input"
              placeholder="e.g. Itching and rash on arms for 5 days" 
              value={formData.chiefComplaint} 
              onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} 
              onKeyDown={e => handleKeyDown(e, notesInputRef)}
            />
          </div>

          <div>
            <label className="form-label">Receptionist Notes (Optional)</label>
            <textarea 
              ref={notesInputRef}
              className="form-input"
              rows={2}
              placeholder="Any extra notes before doctor consultation (e.g. Emergency walk-in, VIP)..." 
              value={formData.receptionNotes} 
              onChange={e => setFormData({...formData, receptionNotes: e.target.value})} 
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitButtonRef.current?.focus();
                }
              }}
            />
          </div>

          {/* Payment Section */}
          <div className="bg-[#f8f6f0] p-3.5 rounded-xl border border-[#e4e2e1] space-y-2.5">
            <label className="form-label text-[#047857] flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <CreditCard className="w-4 h-4 text-[#047857]" />
                Consultation Fee Payment
              </span>
              <span className="text-[11px] font-normal text-[#7c766d]">Receptionist Desk</span>
            </label>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-[#4b463e] block mb-1">Payment Status</label>
                <div className="flex rounded-lg bg-white border border-[#cdc6ba] p-0.5">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentStatus: 'paid' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      formData.paymentStatus === 'paid'
                        ? 'bg-[#047857] text-white shadow-xs'
                        : 'text-[#4b463e] hover:text-[#1a1c1a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentStatus: 'unpaid' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      formData.paymentStatus === 'unpaid'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'text-[#4b463e] hover:text-[#1a1c1a]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>Unpaid</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-[#4b463e] block mb-1">Payment Mode</label>
                <div className="flex rounded-lg bg-white border border-[#cdc6ba] p-0.5">
                  <button
                    type="button"
                    disabled={formData.paymentStatus === 'unpaid'}
                    onClick={() => setFormData({ ...formData, paymentMode: 'cash' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                      formData.paymentMode === 'cash' && formData.paymentStatus === 'paid'
                        ? 'bg-[#064e3b] text-white shadow-xs'
                        : 'text-[#4b463e] hover:text-[#1a1c1a] disabled:opacity-40'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    disabled={formData.paymentStatus === 'unpaid'}
                    onClick={() => setFormData({ ...formData, paymentMode: 'online' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                      formData.paymentMode === 'online' && formData.paymentStatus === 'paid'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-[#4b463e] hover:text-[#1a1c1a] disabled:opacity-40'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Online (UPI)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-[#e4e2e1]">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            ref={submitButtonRef}
            type="submit" 
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>
              {activeTab === 'existing' ? "Add to Today's Queue" : "Register & Add to Queue"}
            </span>
          </button>
        </div>

      </form>
    </div>
  );
}
