import { useState, useMemo } from 'react';
import { Users, Clock, Stethoscope, CheckCircle2, ArrowRight, FileText, Phone, MapPin, Search, X, Trash2, UserPlus, RefreshCw, AlertCircle, BookOpen } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';
import { filterAndSortPatients } from './PatientSearch';
import PatientEMRHistoryModal from './PatientEMRHistoryModal';
import ConfirmModal from './ConfirmModal';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';

interface QueueViewProps {
  queue: QueueItem[];
  patients: Patient[];
  onSelectPatient: (queueItem: QueueItem, patient: Patient) => void;
}

const EMPTY_FORM = { name: '', age: '', gender: 'M' as 'M' | 'F' | 'Other', phone: '', village: '', complaint: '' };

export default function QueueView({ queue, patients, onSelectPatient }: QueueViewProps) {
  const { deletePatient, registerAndEnqueue, patients: allPatients, refreshPatients, addToQueue } = useClinic();
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedEMRPatient, setSelectedEMRPatient] = useState<Patient | null>(null);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regForm, setRegForm] = useState(EMPTY_FORM);
  const [regErrors, setRegErrors] = useState<Record<string, string>>({});
  const [regLoading, setRegLoading] = useState(false);
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null);

  // Duplicate phone check
  const duplicatePatient = useMemo(() => {
    const clean = regForm.phone.replace(/\D/g, '');
    if (clean.length === 10) return allPatients.find(p => p.phone === clean) || null;
    return null;
  }, [regForm.phone, allPatients]);

  const handleRegSubmit = async (consultNow: boolean) => {
    const errors: Record<string, string> = {};
    const name = regForm.name.trim();
    if (!name || name.length < 2) errors.name = 'Full name required';
    if (regForm.age && (isNaN(Number(regForm.age)) || Number(regForm.age) < 0 || Number(regForm.age) > 120)) {
      errors.age = 'Age must be between 0 and 120';
    }
    if (Object.keys(errors).length > 0) { setRegErrors(errors); return; }

    setRegLoading(true);
    try {
      const patientData = {
        name,
        age: regForm.age ? Number(regForm.age) : 0,
        gender: regForm.gender || 'M',
        phone: regForm.phone.replace(/\D/g, ''),
        village: (regForm.village || '').trim(),
        complaint: (regForm.complaint || '').trim(),
      };
      const result = await registerAndEnqueue(patientData, duplicatePatient || undefined);
      setRegForm(EMPTY_FORM);
      setRegErrors({});
      setShowRegisterModal(false);

      if (consultNow && result && result.queueItem && result.patient) {
        onSelectPatient(result.queueItem, result.patient);
      }
    } catch { /* silent */ } finally {
      setRegLoading(false);
    }
  };

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const waiting = queue.filter(q => q.status === 'waiting').length;
  const consulting = queue.filter(q => q.status === 'in-consultation').length;
  const completed = queue.filter(q => q.status === 'completed').length;

  // Doctor View: In Room (in-consultation) at top, then Waiting patients in FIFO order, then Completed at bottom
  const displayQueue = useMemo(() => {
    return [...queue].sort((a, b) => {
      const getWeight = (status: string) => {
        if (status === 'in-consultation' || status === 'in_consultation') return 1;
        if (status === 'waiting') return 2;
        return 3;
      };
      const wA = getWeight(a.status);
      const wB = getWeight(b.status);
      if (wA !== wB) return wA - wB;

      // Secondary: FIFO order (earliest registered patient first)
      return (a.queueId || '').localeCompare(b.queueId || '');
    });
  }, [queue]);

  const searchedPatients = useMemo(() => {
    return filterAndSortPatients(patients, patientSearchQuery);
  }, [patients, patientSearchQuery]);

  return (
    <div className="space-y-5">

      {/* Doctor Queue Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="stat-card stat-card-blue p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 overflow-hidden">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#3b82f6]" />
          </div>
          <div className="min-w-0 w-full">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7c766d] truncate">Waiting</p>
            <p className="text-lg sm:text-2xl font-black text-[#1d4ed8] leading-none mt-0.5">{waiting}</p>
          </div>
        </div>

        <div className="stat-card stat-card-amber p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 overflow-hidden">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#fffbeb] flex items-center justify-center shrink-0">
            <Stethoscope className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#f59e0b]" />
          </div>
          <div className="min-w-0 w-full">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7c766d] truncate">In Room</p>
            <p className="text-lg sm:text-2xl font-black text-[#b45309] leading-none mt-0.5">{consulting}</p>
          </div>
        </div>

        <div className="stat-card stat-card-green p-2.5 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3 overflow-hidden">
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 text-[#059669]" />
          </div>
          <div className="min-w-0 w-full">
            <p className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-[#7c766d] truncate">Done</p>
            <p className="text-lg sm:text-2xl font-black text-[#166534] leading-none mt-0.5">{completed}</p>
          </div>
        </div>
      </div>

      {/* ── Quick Register New Patient (Doctor-side) ── */}
      <div className="bg-[#f0fdf4] border border-[#a7f3d0] rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shadow-sm">
        <div>
          <h2 className="text-sm font-serif font-bold text-[#064e3b] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#047857]" />
            Register New Patient — Doctor's Room
          </h2>
          <p className="text-[11px] text-[#4b7c68] mt-0.5">Walk-in or direct consultation — register and start immediately</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowRegisterModal(true); setRegForm(EMPTY_FORM); setRegErrors({}); }}
          className="btn-primary shrink-0"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* ── Search Returning Patient & View EMR History Bar ── */}
      <div className="bg-[#faf9f6] p-4 rounded-2xl border border-[#e4e2e1] shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-sm font-serif font-bold text-[#1a1c1a] flex items-center gap-2">
              <Search className="w-4 h-4 text-[#047857]" />
              <span>Search Returning Patient & Past EMR History</span>
            </h2>
            <p className="text-[11px] text-[#7c766d] mt-0.5">
              Type patient name, phone, or village to view past visit prescriptions & history (saved forever)
            </p>
          </div>
          <span className="text-[10px] bg-[#ecfdf5] text-[#047857] px-2.5 py-1 rounded-full font-bold border border-[#a7f3d0]">
            {patients.length} Registered Patients
          </span>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-[#7c766d] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Type patient name, mobile number, village or ID..."
            value={patientSearchQuery}
            onChange={(e) => setPatientSearchQuery(e.target.value)}
            className="form-input text-xs sm:text-sm pr-10 py-2.5 w-full bg-white"
            style={{ paddingLeft: '2.5rem' }}
          />
          {patientSearchQuery && (
            <button
              onClick={() => setPatientSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7c766d] hover:text-[#1a1c1a]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search Results list */}
        {patientSearchQuery.trim() && (
          <div className="bg-white border border-[#e4e2e1] rounded-xl shadow-lg max-h-72 overflow-y-auto divide-y divide-[#f2eee3]">
            {searchedPatients.length > 0 ? (
              searchedPatients.map((p) => {
                const existingQueueItem = queue.find(q => q.patientId === p.id || (q.name && q.name.trim().toLowerCase() === p.name.trim().toLowerCase()));
                const isAlreadyInQueue = Boolean(existingQueueItem);
                const qItem: QueueItem = existingQueueItem || {
                  queueId: `Q${Date.now()}`,
                  patientId: p.id,
                  name: p.name,
                  age: p.age,
                  phone: p.phone,
                  village: p.village,
                  timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
                  complaint: p.pastHistory || '',
                  status: 'waiting',
                  paymentStatus: 'unpaid',
                  paymentMode: 'cash',
                  casePaperNo: p.casePaperNo,
                };

                return (
                  <div key={p.id} className="p-3 hover:bg-[#faf9f6] flex flex-col gap-2 transition-colors">
                    {/* Patient Info Row */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div>
                        <div className="font-bold text-[#1a1c1a] text-sm">{p.name}</div>
                        <div className="text-xs text-[#7c766d] mt-0.5 flex flex-wrap items-center gap-2">
                          <span>{p.age} Yrs / {p.gender === 'M' ? 'Male' : 'Female'}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-[#047857]" />
                            <span>{p.phone || 'N/A'}</span>
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7c766d]" />
                            <span>{p.village || 'N/A'}</span>
                          </span>
                        </div>
                        {/* Validity Badge & Queue Status */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          {(() => {
                            if (!p.validity) return null;
                            const expiry = new Date(p.validity);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            const fmt = expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                            if (daysLeft < 0) return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                                <AlertCircle className="w-3 h-3 text-red-600 shrink-0" />
                                <span>Expired on {fmt}</span>
                              </span>
                            );
                            if (daysLeft <= 7) return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>Expiring in {daysLeft} day{daysLeft !== 1 ? 's' : ''} ({fmt})</span>
                              </span>
                            );
                            return (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>Valid till {fmt}</span>
                              </span>
                            );
                          })()}

                          {existingQueueItem && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                              existingQueueItem.status === 'in-consultation'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : existingQueueItem.status === 'completed'
                                ? 'bg-gray-100 text-gray-700 border border-gray-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>In Queue ({existingQueueItem.status === 'in-consultation' ? 'In Room' : existingQueueItem.status === 'completed' ? 'Completed' : 'Waiting'})</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedEMRPatient(p)}
                          className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#047857]" />
                          <span>View EMR History</span>
                        </button>

                        {!isAlreadyInQueue && (
                          <button
                            type="button"
                            onClick={() => {
                              addToQueue(qItem);
                            }}
                            className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center border-[#047857] text-[#047857] hover:bg-[#ecfdf5]"
                            title="Add patient to today's queue"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Add to Queue</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onSelectPatient(qItem, p)}
                          className="btn-primary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Start Consultation</span>
                        </button>

                        {/* Renew Validity Button */}
                        <button
                          type="button"
                          disabled={renewingId === p.id}
                          onClick={async () => {
                            setRenewingId(p.id);
                            try {
                              await api.renewPatient(p.id, 2);
                              if (typeof refreshPatients === 'function') await refreshPatients();
                            } catch (e) {
                              console.error('Renew failed', e);
                            } finally {
                              setRenewingId(null);
                            }
                          }}
                          className="flex items-center gap-1 text-xs py-1.5 px-3 rounded-xl border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 disabled:opacity-50 transition-all"
                          title="Renew validity by 2 months"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${renewingId === p.id ? 'animate-spin' : ''}`} />
                          <span>{renewingId === p.id ? 'Renewing…' : 'Renew'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setConfirmAction({
                              title: 'Delete Patient Record',
                              message: `⚠️ Are you sure you want to permanently delete patient '${p.name}' (ID: ${p.id}) from database registers?`,
                              onConfirm: () => {
                                deletePatient(p.id);
                              }
                            });
                          }}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-red-200 cursor-pointer"
                          title="Delete Patient Record from DB"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-[#7c766d]">
                No registered patient found matching "<strong>{patientSearchQuery}</strong>".
              </div>
            )}
          </div>
        )}
      </div>

      {/* Queue Table */}
      <div className="bg-[#faf9f6] rounded-2xl shadow-sm border border-[#e4e2e1] overflow-hidden">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#e4e2e1] flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 bg-[#f8f6f0]">
          <h2 className="text-sm sm:text-base font-serif font-bold text-[#1a1c1a] flex items-center gap-2 min-w-0">
            <Clock className="w-4 h-4 text-[#047857] shrink-0" />
            <span className="truncate">Today's Consultation Queue</span>
          </h2>
          <span className="bg-[#ecfdf5] text-[#047857] py-1 px-3 rounded-full text-[10px] sm:text-[11px] font-bold flex items-center gap-1.5 border border-[#a7f3d0] shrink-0">
            <Users className="w-3 h-3 text-[#065f46]" />
            {queue.length} Patients
          </span>
        </div>
        
        {/* Mobile View (Stacked Cards — No Horizontal Scrollbar) */}
        <div className="block md:hidden divide-y divide-[#e4e2e1]">
          {displayQueue.map((item, index) => {
            const patient = getPatient(item.patientId) || {
              id: item.patientId || item.queueId,
              name: item.name || 'Patient',
              age: item.age || 0,
              gender: (item.gender || 'M') as 'M' | 'F',
              phone: item.phone || '',
              village: item.village || '',
              pastHistory: '',
              allergies: '',
              pastVisits: []
            };

            const isWaiting = item.status === 'waiting';
            const isConsulting = item.status === 'in-consultation';
            const isCompleted = item.status === 'completed';
            const casePaper = item.casePaperNo || patient.casePaperNo;

            return (
              <div 
                key={item.queueId}
                onClick={() => onSelectPatient(item, patient)}
                className="p-4 space-y-3 bg-[#faf9f6] cursor-pointer hover:bg-[#f8f6f0] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-[#f2eee3] border border-[#cdc6ba] text-[#7c766d] font-mono text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[#1a1c1a] text-sm truncate">{patient.name}</div>
                      <div className="text-[11px] text-[#7c766d] flex items-center gap-1.5 flex-wrap">
                        <span>{patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'}</span>
                        {casePaper && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 border border-amber-200">
                            <BookOpen className="w-2.5 h-2.5 text-amber-700" />
                            #{casePaper}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {isWaiting && (
                      <span className="badge badge-waiting">
                        <Clock className="w-3 h-3" />Waiting
                      </span>
                    )}
                    {isConsulting && (
                      <span className="badge badge-consulting">
                        <Stethoscope className="w-3 h-3" />In Room
                      </span>
                    )}
                    {isCompleted && (
                      <span className="badge badge-completed">
                        <CheckCircle2 className="w-3 h-3" />Done
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-[#f8f6f0] p-2.5 rounded-xl border border-[#e4e2e1] text-xs text-[#4b463e] space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-[#7c766d]">
                    <span>Time Added: {item.timeAdded}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#1a1c1a]">Complaint: </span>
                    <span>{item.complaint}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-1" onClick={(e) => e.stopPropagation()}>
                  {(isWaiting || isConsulting) ? (
                    <button
                      type="button"
                      onClick={() => onSelectPatient(item, patient)}
                      className="btn-primary w-full justify-center"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Start Consultation</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onSelectPatient(item, patient)}
                      className="inline-flex items-center justify-center gap-1.5 w-full bg-[#f8f6f0] hover:bg-[#f2eee3] text-[#4b463e] border border-[#e4e2e1] hover:border-[#cdc6ba] px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#7c766d]" />
                      <span>Open EMR</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {queue.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                  <Users className="w-6 h-6 text-[#cdc6ba]" />
                </div>
                <div>
                  <p className="text-[#4b463e] font-semibold text-sm">No patients in queue today</p>
                  <p className="text-[#7c766d] text-xs mt-1">Ask reception to add patients to today's OPD</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="clinic-table w-full min-w-[850px]">
            <thead>
              <tr>
                <th className="text-center w-12">Sr. No.</th>
                <th className="text-center w-24">Time</th>
                <th className="text-left w-56">Patient</th>
                <th className="text-left w-48">Contact & Location</th>
                <th className="text-center w-36">Case Paper No.</th>
                <th className="text-center">Chief Complaint</th>
                <th className="text-center w-32">Status</th>
                <th className="text-right w-40">Action</th>
              </tr>
            </thead>

            <tbody>
              {displayQueue.map((item, index) => {
                const patient = getPatient(item.patientId) || {
                  id: item.patientId || item.queueId,
                  name: item.name || 'Patient',
                  age: item.age || 0,
                  gender: (item.gender || 'M') as 'M' | 'F',
                  phone: item.phone || '',
                  village: item.village || '',
                  pastHistory: '',
                  allergies: '',
                  pastVisits: []
                };
                
                const isWaiting = item.status === 'waiting';
                const isConsulting = item.status === 'in-consultation';
                const isCompleted = item.status === 'completed';
                const casePaper = item.casePaperNo || patient.casePaperNo;

                return (
                  <tr 
                    key={item.queueId} 
                    onClick={() => onSelectPatient(item, patient)}
                    className="cursor-pointer group hover:bg-[#f8f6f0]/60 transition-colors"
                  >
                    <td className="text-center font-mono font-semibold text-xs text-[#7c766d]">
                      {index + 1}
                    </td>
                    <td className="text-center">
                      <span className="text-[#7c766d] font-semibold text-xs whitespace-nowrap">{item.timeAdded}</span>
                    </td>
                    <td className="text-left">
                      <div className="flex flex-col text-left">
                        <div className="font-bold text-[#1a1c1a] text-sm truncate group-hover:text-[#047857] transition-colors">
                          {patient.name}
                        </div>
                        <div className="text-[11px] text-[#7c766d] truncate">{patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'}</div>
                      </div>
                    </td>
                    <td className="text-left">
                      <div className="flex items-center gap-1.5 font-semibold text-[#1a1c1a] text-xs truncate mb-0.5">
                        <Phone className="w-3 h-3 text-[#047857] shrink-0" />
                        <span className="truncate">{item.phone || patient.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#7c766d] text-xs truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.village || patient.village || 'N/A'}</span>
                      </div>
                    </td>
                    {/* Case Paper Number */}
                    <td className="text-center">
                      {casePaper ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs">
                          <BookOpen className="w-3 h-3 text-amber-700 shrink-0" />
                          <span>#{casePaper}</span>
                        </span>
                      ) : (
                        <span className="text-[#7c766d] text-xs font-mono">—</span>
                      )}
                    </td>
                    <td className="text-center" title={item.complaint || 'No complaint listed'}>
                      <span className="text-[#4b463e] text-sm font-medium truncate block text-center">{item.complaint || '—'}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex justify-center">
                        {isWaiting && (
                          <span className="badge badge-waiting">
                            <Clock className="w-3 h-3" />Waiting
                          </span>
                        )}
                        {isConsulting && (
                          <span className="badge badge-consulting">
                            <Stethoscope className="w-3 h-3" />In Room
                          </span>
                        )}
                        {isCompleted && (
                          <span className="badge badge-completed">
                            <CheckCircle2 className="w-3 h-3" />Done
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        {(isWaiting || isConsulting) ? (
                          <button
                            type="button"
                            onClick={() => onSelectPatient(item, patient)}
                            className="btn-primary"
                          >
                            <Stethoscope className="w-3.5 h-3.5" />
                            <span>Consult</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onSelectPatient(item, patient)}
                            className="inline-flex items-center gap-1.5 bg-[#f8f6f0] hover:bg-[#f2eee3] text-[#4b463e] border border-[#e4e2e1] hover:border-[#cdc6ba] px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#7c766d]" />
                            <span>Open EMR</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                        <Users className="w-7 h-7 text-[#cdc6ba]" />
                      </div>
                      <div>
                        <p className="text-[#4b463e] font-semibold text-sm">No patients in queue today</p>
                        <p className="text-[#7c766d] text-xs mt-1">Ask reception to add patients to today's OPD</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEMRPatient && (
        <PatientEMRHistoryModal
          patient={selectedEMRPatient}
          onClose={() => setSelectedEMRPatient(null)}
          onLoadPrescription={(pastPaper) => {
            const qItem: QueueItem = {
              queueId: `Q_TEMP_${selectedEMRPatient.id}`,
              patientId: selectedEMRPatient.id,
              name: selectedEMRPatient.name,
              age: selectedEMRPatient.age,
              phone: selectedEMRPatient.phone,
              village: selectedEMRPatient.village,
              timeAdded: 'Direct Consultation',
              complaint: pastPaper.complaint || 'Follow-up Consultation',
              status: 'waiting'
            };
            onSelectPatient(qItem, selectedEMRPatient);
            setSelectedEMRPatient(null);
          }}
        />
      )}

      {/* ── Quick Patient Registration Modal (Doctor-side) ── */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-[#1a1c1a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#e4e2e1] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#e4e2e1] bg-[#f0fdf4] flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-serif font-bold text-[#064e3b] text-base flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Register New Patient
                </h3>
                <p className="text-[11px] text-[#4b7c68] mt-0.5">Direct from Doctor's Room</p>
              </div>
              <button onClick={() => setShowRegisterModal(false)} className="text-[#7c766d] hover:text-[#1a1c1a] p-1 rounded-lg shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Duplicate Warning */}
              {duplicatePatient && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                  <span className="font-bold">⚠️ Existing patient found:</span> {duplicatePatient.name} · {duplicatePatient.age}y · {duplicatePatient.phone}<br />
                  <span className="text-amber-700">Proceeding will add them to queue using existing record.</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#4b463e] mb-1">Patient Name *</label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={e => setRegForm(f => ({ ...f, name: e.target.value.replace(/[^a-zA-Z\s\.\-']/g, '') }))}
                  placeholder="Full name"
                  className={`form-input w-full text-sm ${regErrors.name ? 'border-red-400 bg-red-50' : ''}`}
                />
                {regErrors.name && <span className="text-xs text-red-500 mt-0.5 block">{regErrors.name}</span>}
              </div>

              {/* Age & Gender Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Age Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4b463e] mb-1">Age (2 Digits) *</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    value={regForm.age}
                    onChange={e => setRegForm(f => ({ ...f, age: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                    placeholder="उदा. 28"
                    className={`form-input w-full text-sm font-semibold ${regErrors.age ? 'border-red-400 bg-red-50' : ''}`}
                  />
                  {regErrors.age && <span className="text-xs text-red-500 mt-0.5 block">{regErrors.age}</span>}
                </div>

                {/* Gender Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4b463e] mb-1">Gender</label>
                  <div className="flex gap-2">
                    {[
                      { val: 'M' as const, label: 'Male' },
                      { val: 'F' as const, label: 'Female' }
                    ].map(g => (
                      <button
                        key={g.val}
                        type="button"
                        onClick={() => setRegForm(f => ({ ...f, gender: g.val }))}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                          regForm.gender === g.val
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

              {/* Village/City & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Village / City */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4b463e] mb-1">Village / City</label>
                  <input
                    type="text"
                    value={regForm.village}
                    onChange={e => setRegForm(f => ({ ...f, village: e.target.value.replace(/[^a-zA-Z\s\.\-']/g, '') }))}
                    placeholder="उदा. पेठ वडगांव"
                    className="form-input w-full text-sm font-medium"
                  />
                </div>

                {/* Mobile Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#4b463e] mb-1">Mobile Number (10 Digits)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={regForm.phone}
                    onChange={e => setRegForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    placeholder="10-digit mobile number"
                    className="form-input w-full text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-4 bg-[#faf9f6] border-t border-[#e4e2e1] flex flex-col sm:flex-row gap-2 shrink-0">
              <button
                type="button"
                disabled={regLoading}
                onClick={() => handleRegSubmit(false)}
                className="btn-secondary flex-1 justify-center text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                {regLoading ? 'Registering...' : 'Add to Queue Only'}
              </button>
              <button
                type="button"
                disabled={regLoading}
                onClick={() => handleRegSubmit(true)}
                className="btn-primary flex-1 justify-center text-xs"
              >
                <Stethoscope className="w-3.5 h-3.5" />
                {regLoading ? 'Please wait...' : 'Register & Consult Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          isOpen={!!confirmAction}
          title={confirmAction.title}
          message={confirmAction.message}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmAction.onConfirm}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
