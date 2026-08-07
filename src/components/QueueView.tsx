import { useState } from 'react';
import { Users, Clock, Stethoscope, CheckCircle2, ArrowRight, FileText, Phone, MapPin, Search, X, Trash2 } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';
import PatientEMRHistoryModal from './PatientEMRHistoryModal';
import { useClinic } from '../context/ClinicContext';

interface QueueViewProps {
  queue: QueueItem[];
  patients: Patient[];
  onSelectPatient: (queueItem: QueueItem, patient: Patient) => void;
}

export default function QueueView({ queue, patients, onSelectPatient }: QueueViewProps) {
  const { deletePatient } = useClinic();
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [selectedEMRPatient, setSelectedEMRPatient] = useState<Patient | null>(null);

  const getPatient = (id: string) => patients.find(p => p.id === id);

  const waiting = queue.filter(q => q.status === 'waiting').length;
  const consulting = queue.filter(q => q.status === 'in-consultation').length;
  const completed = queue.filter(q => q.status === 'completed').length;

  const searchedPatients = patientSearchQuery.trim() ? patients.filter(p =>
    p.name.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.phone.includes(patientSearchQuery) ||
    p.village.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(patientSearchQuery.toLowerCase())
  ) : [];

  return (
    <div className="space-y-5">

      {/* Doctor Queue Stats Bar */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
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
                const existingQueueItem = queue.find(q => q.patientId === p.id || q.name === p.name);
                const qItem: QueueItem = existingQueueItem || {
                  queueId: `Q_TEMP_${p.id}`,
                  patientId: p.id,
                  name: p.name,
                  age: p.age,
                  phone: p.phone,
                  village: p.village,
                  timeAdded: 'Direct Consultation',
                  complaint: 'Returning Patient Visit',
                  status: 'waiting'
                };

                return (
                  <div key={p.id} className="p-3 hover:bg-[#faf9f6] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-colors">
                    <div>
                      <div className="font-bold text-[#1a1c1a] text-sm">{p.name}</div>
                      <div className="text-xs text-[#7c766d] mt-0.5">
                        {p.age} Yrs / {p.gender === 'M' ? 'Male' : 'Female'} · 📞 {p.phone} · 📍 {p.village || 'N/A'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setSelectedEMRPatient(p)}
                        className="btn-secondary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#047857]" />
                        <span>View EMR History</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onSelectPatient(qItem, p)}
                        className="btn-primary text-xs py-1.5 px-3 flex-1 sm:flex-initial justify-center"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Start Consultation</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`⚠️ Are you sure you want to permanently delete patient '${p.name}' (ID: ${p.id}) from database registers?`)) {
                            deletePatient(p.id);
                          }
                        }}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-red-200 cursor-pointer"
                        title="Delete Patient Record from DB"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
          {queue.map((item, index) => {
            const patient = getPatient(item.patientId) || {
              id: item.patientId || item.queueId,
              name: item.name || 'Patient',
              age: item.age || 0,
              gender: (item.gender || 'M') as 'M' | 'F',
              phone: item.phone || '',
              village: item.village || '',
              pastHistory: 'No known allergies',
              allergies: '',
              pastVisits: []
            };

            const isWaiting = item.status === 'waiting';
            const isConsulting = item.status === 'in-consultation';
            const isCompleted = item.status === 'completed';

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
                      <div className="text-[11px] text-[#7c766d]">{patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'}</div>
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
          <table className="clinic-table w-full min-w-[750px]">
            <thead>
              <tr>
                <th className="text-center w-12">Sr. No.</th>
                <th className="text-center w-28">Time</th>
                <th className="text-left w-64">Patient</th>
                <th className="text-left w-56">Contact & Location</th>
                <th className="text-center">Chief Complaint</th>
                <th className="text-center w-36">Status</th>
                <th className="text-right w-44">Action</th>
              </tr>
            </thead>

            <tbody>
              {queue.map((item, index) => {
                const patient = getPatient(item.patientId) || {
                  id: item.patientId || item.queueId,
                  name: item.name || 'Patient',
                  age: item.age || 0,
                  gender: (item.gender || 'M') as 'M' | 'F',
                  phone: item.phone || '',
                  village: item.village || '',
                  pastHistory: 'No known allergies',
                  allergies: '',
                  pastVisits: []
                };
                
                const isWaiting = item.status === 'waiting';
                const isConsulting = item.status === 'in-consultation';
                const isCompleted = item.status === 'completed';

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
    </div>
  );
}
