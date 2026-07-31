import { Users, Clock, Stethoscope, CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';

interface QueueViewProps {
  queue: QueueItem[];
  patients: Patient[];
  onSelectPatient: (queueItem: QueueItem, patient: Patient) => void;
}

export default function QueueView({ queue, patients, onSelectPatient }: QueueViewProps) {
  const getPatient = (id: string) => patients.find(p => p.id === id);

  const waiting = queue.filter(q => q.status === 'waiting').length;
  const consulting = queue.filter(q => q.status === 'in-consultation').length;
  const completed = queue.filter(q => q.status === 'completed').length;

  return (
    <div className="space-y-5">

      {/* Doctor Queue Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card stat-card-blue flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#eff6ff] flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5 text-[#3b82f6]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c766d]">Waiting</p>
            <p className="text-2xl font-black text-[#1d4ed8] leading-none">{waiting}</p>
          </div>
        </div>
        <div className="stat-card stat-card-amber flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#fffbeb] flex items-center justify-center shrink-0">
            <Stethoscope className="w-4.5 h-4.5 text-[#f59e0b]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c766d]">In Room</p>
            <p className="text-2xl font-black text-[#b45309] leading-none">{consulting}</p>
          </div>
        </div>
        <div className="stat-card stat-card-green flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#f0fdf4] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-[#059669]" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#7c766d]">Done</p>
            <p className="text-2xl font-black text-[#166534] leading-none">{completed}</p>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-[#faf9f6] rounded-2xl shadow-sm border border-[#e4e2e1] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e4e2e1] flex justify-between items-center bg-[#f8f6f0]">
          <h2 className="text-base font-serif font-bold text-[#1a1c1a] flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-[#047857]" />
            <span>Today's Consultation Queue</span>
          </h2>
          <span className="bg-[#ecfdf5] text-[#047857] py-1 px-3 rounded-full text-[11px] font-bold flex items-center gap-1.5 border border-[#a7f3d0]">
            <Users className="w-3 h-3 text-[#065f46]" />
            {queue.length} Patients
          </span>
        </div>
        
        <div className="w-full overflow-x-auto">
          <table className="clinic-table min-w-[720px]">
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '50px' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '32%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '16%' }} />
            </colgroup>

            <thead>
              <tr>
                <th className="text-center">#</th>
                <th className="text-center">Time</th>
                <th>Patient</th>
                <th>Chief Complaint</th>
                <th className="text-center">Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>

            <tbody>
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
                    className="cursor-pointer group"
                  >
                    <td className="text-center">
                      <span className="w-6 h-6 rounded-full bg-[#f2eee3] border border-[#cdc6ba] text-[#7c766d] font-mono text-[10px] font-bold inline-flex items-center justify-center">
                        {index + 1}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="text-[#7c766d] font-semibold text-xs">{item.timeAdded}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f2eee3] to-[#e8e2d2] border border-[#cdc6ba] flex items-center justify-center shrink-0">
                          <span className="text-[11px] font-extrabold text-[#4b463e]">{patient.name.charAt(0)}</span>
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-bold text-[#1a1c1a] text-sm truncate group-hover:text-[#047857] transition-colors">
                            {patient.name}
                          </div>
                          <div className="text-[11px] text-[#7c766d]">{patient.age}y · {patient.gender === 'M' ? 'Male' : 'Female'}</div>
                        </div>
                      </div>
                    </td>
                    <td title={item.complaint}>
                      <span className="text-[#4b463e] text-sm font-medium truncate block">{item.complaint}</span>
                    </td>
                    <td className="text-center whitespace-nowrap">
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
                    </td>
                    <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {(isWaiting || isConsulting) ? (
                        <button
                          type="button"
                          onClick={() => onSelectPatient(item, patient)}
                          className="btn-primary ml-auto"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Consult</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelectPatient(item, patient)}
                          className="inline-flex items-center gap-1.5 ml-auto bg-[#f8f6f0] hover:bg-[#f2eee3] text-[#4b463e] border border-[#e4e2e1] hover:border-[#cdc6ba] px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#7c766d]" />
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
    </div>
  );
}
