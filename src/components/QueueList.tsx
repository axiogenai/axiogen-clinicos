import { Phone, MapPin, Clock, Stethoscope, Check, X, ArrowRight, Eye, Trash2 } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';

interface Props {
  queue: QueueItem[];
  patients: Patient[];
  onStatusChange: (queueId: string, status: QueueItem['status']) => void;
  onRemove: (queueId: string) => void;
  onViewDetails: (queueItem: QueueItem) => void;
}

export default function QueueList({
  queue,
  patients,
  onStatusChange,
  onRemove,
  onViewDetails,
}: Props) {
  const getPatient = (id: string) => patients.find(p => p.id === id);

  // Auto-sort: waiting first, in-consultation, completed, cancelled
  const sortedQueue = [...queue].sort((a, b) => {
    const statusOrder: Record<string, number> = {
      'waiting': 1,
      'in-consultation': 2,
      'completed': 3,
      'cancelled': 4,
    };
    return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5);
  });

  return (
    <div className="bg-[#faf9f6] rounded-2xl shadow-sm border border-[#e4e2e1] overflow-hidden">
      
      {/* Table Header Banner */}
      <div className="px-6 py-4 border-b border-[#e4e2e1] bg-[#f8f6f0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-serif font-bold text-[#1a1c1a]">Today's Live Patient Queue</h2>
          <span className="bg-[#f3e8ff] text-[#5b21b6] text-xs font-bold px-3 py-0.5 rounded-full border border-[#e9d5ff]">
            {queue.length} Total
          </span>
        </div>
        <span className="text-xs text-[#7c766d] font-medium hidden sm:inline-block">
          Auto-sorted: Waiting room patients on top
        </span>
      </div>

      {/* Fixed Table with Pixel-Perfect Column Lock */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse table-fixed min-w-[900px]">
          <colgroup>
            <col style={{ width: '44px' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '18%' }} />
            <col style={{ width: '22%' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '130px' }} />
            <col style={{ width: '210px' }} />
          </colgroup>
          
          <thead className="bg-[#f2eee3] border-b border-[#e4e2e1] text-[#6b7280] uppercase tracking-wider text-[11px] font-bold select-none">
            <tr>
              <th className="px-3 py-3.5 text-center">#</th>
              <th className="px-3 py-3.5 text-left">Patient Details</th>
              <th className="px-3 py-3.5 text-left">Contact & Location</th>
              <th className="px-3 py-3.5 text-left">Chief Complaint</th>
              <th className="px-3 py-3.5 text-left">Time Added</th>
              <th className="px-3 py-3.5 text-center">Status</th>
              <th className="px-3 py-3.5 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#e4e2e1]/60">
            {sortedQueue.map((item, index) => {
              const patient = getPatient(item.patientId);
              const name = item.name || patient?.name || 'Unknown';
              const age = item.age || patient?.age;
              const gender = item.gender || patient?.gender;
              const phone = item.phone || patient?.phone || 'N/A';
              const village = item.village || patient?.village || 'N/A';

              const isWaiting = item.status === 'waiting';
              const isConsulting = item.status === 'in-consultation';
              const isCompleted = item.status === 'completed';

              return (
                <tr key={item.queueId} className="hover:bg-[#f3e8ff]/30 transition-colors group">
                  
                  {/* # Index */}
                  <td className="px-3 py-3.5 text-center text-[#7c766d] font-mono text-xs font-medium">
                    {index + 1}
                  </td>
                  
                  {/* Patient Name & Demographics */}
                  <td className="px-3 py-3.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="font-bold text-[#1a1c1a] text-sm truncate group-hover:text-[#5b21b6] transition-colors">
                        {name}
                      </span>
                      {age && (
                        <span className="text-[11px] bg-[#f2eee3] text-[#4b463e] px-2 py-0.5 rounded-md font-bold border border-[#cdc6ba] shrink-0">
                          {age}y / {gender}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Phone & Village */}
                  <td className="px-3 py-3.5 text-xs text-[#4b463e]">
                    <div className="flex items-center gap-1.5 font-medium text-[#1a1c1a] truncate">
                      <Phone className="w-3.5 h-3.5 text-[#5b21b6] shrink-0" />
                      <span className="truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#7c766d] mt-0.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-[#7c766d] shrink-0" />
                      <span className="truncate">{village}</span>
                    </div>
                  </td>

                  {/* Complaint & Notes */}
                  <td className="px-3 py-3.5" title={item.complaint}>
                    <div className="font-medium text-[#4b463e] text-xs sm:text-sm truncate">
                      {item.complaint}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-[#7c766d] truncate mt-0.5">
                        Note: {item.notes}
                      </div>
                    )}
                  </td>

                  {/* Time Added */}
                  <td className="px-3 py-3.5 text-[#4b463e] font-semibold text-xs whitespace-nowrap">
                    {item.timeAdded}
                  </td>

                  {/* Status Badge */}
                  <td className="px-3 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-none ${
                      isWaiting ? 'bg-[#f0f9ff] text-[#0369a1] border-[#bae6fd]' :
                      isConsulting ? 'bg-[#fefce8] text-[#854d0e] border-[#fef08a]' :
                      isCompleted ? 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]' :
                      'bg-[#f2eee3] text-[#6b7280] border-[#cdc6ba]'
                    }`}>
                      {item.status === 'waiting' && (
                        <>
                          <Clock className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
                          <span>Waiting</span>
                        </>
                      )}
                      {item.status === 'in-consultation' && (
                        <>
                          <Stethoscope className="w-3.5 h-3.5 text-[#854d0e] shrink-0" />
                          <span>In Room</span>
                        </>
                      )}
                      {item.status === 'completed' && (
                        <>
                          <Check className="w-3.5 h-3.5 text-[#166534] shrink-0" />
                          <span>Completed</span>
                        </>
                      )}
                      {item.status === 'cancelled' && (
                        <>
                          <X className="w-3.5 h-3.5 text-[#7c766d] shrink-0" />
                          <span>Cancelled</span>
                        </>
                      )}
                    </span>
                  </td>

                  {/* Actions Column (Fixed Width Workflow Slot) */}
                  <td className="px-3 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Fixed 96px width slot for primary action button */}
                      <div className="w-24 flex justify-end shrink-0">
                        {isWaiting && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(item.queueId, 'in-consultation')}
                            className="bg-gradient-to-r from-[#4c1d95] to-[#6b21a8] hover:from-[#3b0764] hover:to-[#581c87] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-md shadow-purple-950/20 transition-all flex items-center justify-center gap-1 w-full"
                          >
                            <span>In Room</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {isConsulting && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(item.queueId, 'completed')}
                            className="bg-gradient-to-r from-[#065f46] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-white text-xs font-bold px-2.5 py-1.5 rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1 w-full"
                          >
                            <span>Done</span>
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Details Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#5b21b6] text-xs font-bold px-3 py-1.5 rounded-xl border border-[#ddd6fe] transition-colors flex items-center gap-1 shadow-sm shrink-0"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#6b21a8]" />
                        <span>Details</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.queueId)}
                        className="bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] p-1.5 rounded-xl transition-colors border border-[#fecdd3] shrink-0"
                        title="Remove from Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#e11d48]" />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}

            {queue.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-[#7c766d] text-sm">
                  No patients in today's queue yet. Click "+ Add Patient to Queue" above to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
