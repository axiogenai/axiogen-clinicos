import { Users, Clock, Stethoscope, CheckCircle2, FileText, ArrowRight } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';

interface QueueViewProps {
  queue: QueueItem[];
  patients: Patient[];
  onSelectPatient: (queueItem: QueueItem, patient: Patient) => void;
}

export default function QueueView({ queue, patients, onSelectPatient }: QueueViewProps) {
  const getPatient = (id: string) => patients.find(p => p.id === id);

  return (
    <div className="bg-[#faf9f6] rounded-2xl shadow-sm border border-[#e4e2e1] overflow-hidden">
      <div className="px-6 py-4 border-b border-[#e4e2e1] flex justify-between items-center bg-[#f8f6f0]">
        <h2 className="text-base font-serif font-bold text-[#1a1c1a] flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#047857]" />
          <span>Today's Patient Consultation Queue</span>
        </h2>
        <span className="bg-[#ecfdf5] text-[#047857] py-1 px-3.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-[#a7f3d0]">
          <Users className="w-3.5 h-3.5 text-[#065f46]" />
          {queue.length} Patients
        </span>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse table-fixed min-w-[800px]">
          <colgroup>
            <col style={{ width: '5%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '30%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '15%' }} />
          </colgroup>

          <thead className="bg-[#f2eee3] border-b border-[#e4e2e1] text-[#6b7280] uppercase tracking-wider text-[11px] font-bold select-none">
            <tr>
              <th className="px-3 py-3.5 text-center">#</th>
              <th className="px-3 py-3.5 text-left">Time</th>
              <th className="px-3 py-3.5 text-left">Patient Details</th>
              <th className="px-3 py-3.5 text-left">Chief Complaint</th>
              <th className="px-3 py-3.5 text-center">Status</th>
              <th className="px-3 py-3.5 text-right">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e4e2e1]/60">
            {queue.map((item, index) => {
              const patient = getPatient(item.patientId);
              if (!patient) return null;
              
              const isWaiting = item.status === 'waiting';
              const isConsulting = item.status === 'in-consultation';
              const isCompleted = item.status === 'completed';

              return (
                <tr 
                  key={item.queueId} 
                  onClick={() => onSelectPatient(item, patient)}
                  className="hover:bg-[#ecfdf5]/40 cursor-pointer transition-colors group"
                >
                  <td className="px-3 py-3.5 text-center text-[#7c766d] font-mono text-xs">{index + 1}</td>
                  <td className="px-3 py-3.5 text-[#4b463e] font-semibold text-xs">{item.timeAdded}</td>
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold text-[#1a1c1a] text-sm truncate group-hover:text-[#047857] transition-colors">
                        {patient.name}
                      </span>
                      <span className="text-[11px] bg-[#f2eee3] text-[#4b463e] px-2 py-0.5 rounded-md font-bold border border-[#cdc6ba] shrink-0">
                        {patient.age}y / {patient.gender}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-[#4b463e] truncate" title={item.complaint}>
                    <span className="truncate text-xs sm:text-sm">{item.complaint}</span>
                  </td>
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-none ${
                      isWaiting ? 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]' : 
                      isConsulting ? 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]' : 
                      'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]'
                    }`}>
                      {isWaiting && <Clock className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />}
                      {isConsulting && <Stethoscope className="w-3.5 h-3.5 text-[#854d0e] shrink-0" />}
                      {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-[#166534] shrink-0" />}
                      <span className="capitalize">{item.status.replace('-', ' ')}</span>
                    </span>
                  </td>
                  <td className="px-3 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    {isWaiting || isConsulting ? (
                      <button
                        type="button"
                        onClick={() => onSelectPatient(item, patient)}
                        className="bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] px-4 py-2 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ml-auto shadow-md shadow-emerald-950/20 active:scale-95"
                      >
                        <Stethoscope className="w-3.5 h-3.5 text-[#ecfdf5]" />
                        <span>Consult</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectPatient(item, patient)}
                        className="bg-[#eff6ff] hover:bg-[#dbeafe] text-[#1e40af] border border-[#bfdbfe] hover:border-[#1e40af] px-3.5 py-1.5 rounded-xl font-bold transition-all text-xs flex items-center gap-1.5 ml-auto shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#1d4ed8]" />
                        <span>Open EMR</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {queue.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="bg-[#f8f6f0] p-4 rounded-full border border-[#e4e2e1]">
                      <Users className="w-8 h-8 text-[#7c766d]" />
                    </div>
                    <div className="text-[#4b463e] font-semibold text-sm">
                      No patients in the queue today.
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
