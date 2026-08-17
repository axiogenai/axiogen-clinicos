import { Phone, MapPin, Clock, Stethoscope, Check, X, ArrowRight, Eye, Trash2, Banknote, QrCode } from 'lucide-react';
import type { Patient, QueueItem } from '../data/patients';
import { useClinic } from '../context/ClinicContext';

interface Props {
  queue: QueueItem[];
  patients: Patient[];
  onStatusChange: (queueId: string, status: QueueItem['status']) => void;
  onRemove: (queueId: string) => void;
  onViewDetails: (queueItem: QueueItem) => void;
}

function PaymentPill({
  item,
  onUpdate
}: {
  item: QueueItem;
  onUpdate: (queueId: string, status: 'paid' | 'unpaid', mode?: 'cash' | 'online') => void;
}) {
  const isPaid = item.paymentStatus !== 'unpaid';
  const mode = item.paymentMode || 'cash';

  const handleCyclePayment = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPaid) {
      // Unpaid -> Paid (Cash)
      onUpdate(item.queueId, 'paid', 'cash');
    } else if (mode === 'cash') {
      // Paid (Cash) -> Paid (Online)
      onUpdate(item.queueId, 'paid', 'online');
    } else {
      // Paid (Online) -> Unpaid
      onUpdate(item.queueId, 'unpaid', 'cash');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCyclePayment}
      title="Click to cycle payment: Cash → Online → Unpaid"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all shadow-sm active:scale-95 cursor-pointer whitespace-nowrap select-none ${
        !isPaid
          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
          : mode === 'online'
          ? 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
      }`}
    >
      {!isPaid ? (
        <>
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Unpaid</span>
        </>
      ) : mode === 'online' ? (
        <>
          <QrCode className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span>Paid (Online)</span>
        </>
      ) : (
        <>
          <Banknote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Paid (Cash)</span>
        </>
      )}
    </button>
  );
}

export default function QueueList({
  queue,
  patients,
  onStatusChange,
  onRemove,
  onViewDetails,
}: Props) {
  const { updateQueuePayment } = useClinic();
  const getPatient = (id: string) => patients.find(p => p.id === id);

  // Receptionist View: Pure Normal FIFO (First-In, First-Out by arrival order)
  const sortedQueue = [...queue];

  const getStatusBadge = (status: QueueItem['status']) => {
    switch (status) {
      case 'waiting':
        return (
          <span className="badge badge-waiting">
            <Clock className="w-3 h-3 shrink-0" />
            Waiting
          </span>
        );
      case 'in-consultation':
        return (
          <span className="badge badge-consulting">
            <Stethoscope className="w-3 h-3 shrink-0" />
            In Room
          </span>
        );
      case 'completed':
        return (
          <span className="badge badge-completed">
            <Check className="w-3 h-3 shrink-0" />
            Done
          </span>
        );
      case 'cancelled':
        return (
          <span className="badge badge-cancelled">
            <X className="w-3 h-3 shrink-0" />
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const renderPaymentControl = (item: QueueItem) => {
    return <PaymentPill item={item} onUpdate={updateQueuePayment} />;
  };

  return (
    <div className="bg-[#faf9f6] rounded-2xl shadow-sm border border-[#e4e2e1] overflow-hidden">
      
      {/* Table Header Banner */}
      <div className="px-6 py-4 border-b border-[#e4e2e1] bg-[#f8f6f0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-base font-serif font-bold text-[#1a1c1a] truncate">Today's Live Patient Queue</h2>
          <span className="bg-[#f2eee3] text-[#4b463e] text-[11px] font-bold px-3 py-0.5 rounded-full border border-[#cdc6ba] shrink-0">
            {queue.length} patients
          </span>
        </div>
        <span className="text-[11px] text-[#7c766d] font-medium hidden sm:inline-block bg-[#f2eee3] px-3 py-1 rounded-lg border border-[#e4e2e1] shrink-0">
          Waiting → first
        </span>
      </div>

      {/* Fixed Table with Pixel-Perfect Column Lock */}
      {/* Mobile Stacked Card View (No Horizontal Scrollbar) */}
      <div className="block md:hidden divide-y divide-[#e4e2e1]">
        {sortedQueue.map((item, index) => {
          const patient = getPatient(item.patientId);
          const name = item.name || patient?.name || 'Unknown';
          const age = item.age || patient?.age;
          const gender = item.gender || patient?.gender;
          const phone = item.phone || patient?.phone || 'N/A';
          const village = item.village || patient?.village || 'N/A';

          const isWaiting = item.status === 'waiting';
          const isConsulting = item.status === 'in-consultation';

          return (
            <div key={item.queueId} className="p-4 space-y-3 bg-[#faf9f6]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-[#f2eee3] border border-[#cdc6ba] text-[#7c766d] font-mono text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-[#1a1c1a] text-sm truncate">{name}</div>
                    {age && <div className="text-[11px] text-[#7c766d]">{age}y · {gender === 'M' ? 'Male' : 'Female'}</div>}
                  </div>
                </div>
                <div className="shrink-0">{getStatusBadge(item.status)}</div>
              </div>

              <div className="bg-[#f8f6f0] p-2.5 rounded-xl border border-[#e4e2e1] text-xs text-[#4b463e] space-y-1.5">
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1 truncate">
                    <Phone className="w-3 h-3 text-[#047857] shrink-0" />
                    <span className="truncate">{phone}</span>
                  </div>
                  <div className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 text-[#7c766d] shrink-0" />
                    <span className="truncate">{village}</span>
                  </div>
                </div>
                <div>
                  <span className="font-semibold text-[#1a1c1a]">Complaint: </span>
                  <span>{item.complaint || '—'}</span>
                </div>
                {item.notes && <div className="text-[11px] italic text-[#7c766d]">{item.notes}</div>}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#7c766d] font-medium">{item.timeAdded}</span>
                  {renderPaymentControl(item)}
                </div>
                <div className="flex items-center gap-1.5">
                  {isWaiting && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.queueId, 'in-consultation')}
                      className="bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                    >
                      <span>Send In</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                  {isConsulting && (
                    <button
                      type="button"
                      onClick={() => onStatusChange(item.queueId, 'completed')}
                      className="bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Done</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onViewDetails(item)}
                    className="bg-[#f8f6f0] text-[#4b463e] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#e4e2e1]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(item.queueId)}
                    className="bg-[#fff1f2] text-[#e11d48] p-1.5 rounded-xl border border-[#fecdd3]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {queue.length === 0 && (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                <Clock className="w-6 h-6 text-[#cdc6ba]" />
              </div>
              <div>
                <p className="text-[#4b463e] font-semibold text-sm">No patients in today's queue yet</p>
                <p className="text-[#7c766d] text-xs mt-1">Click "+ Add Patient to Queue" to get started</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="clinic-table w-full min-w-[920px]">
          <thead>
            <tr>
              <th className="text-center w-12">Sr. No.</th>
              <th className="text-left w-60">Patient Details</th>
              <th className="text-left w-52">Contact & Location</th>
              <th className="text-center">Chief Complaint</th>
              <th className="text-center w-24">Time</th>
              <th className="text-center w-32">Payment</th>
              <th className="text-center w-32">Status</th>
              <th className="text-right w-44">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedQueue.map((item, index) => {
              const patient = getPatient(item.patientId);
              const name = item.name || patient?.name || 'Unknown';
              const age = item.age || patient?.age;
              const gender = item.gender || patient?.gender;
              const phone = item.phone || patient?.phone || 'N/A';
              const village = item.village || patient?.village || 'N/A';

              const isWaiting = item.status === 'waiting';
              const isConsulting = item.status === 'in-consultation';

              return (
                <tr key={item.queueId} className="group">
                  
                  {/* # Index */}
                  <td className="text-center font-mono font-semibold text-xs text-[#7c766d]">
                    {index + 1}
                  </td>
                  
                  {/* Patient Name & Demographics */}
                  <td className="text-left">
                    <div className="flex flex-col text-left">
                      <div className="font-bold text-[#1a1c1a] text-sm truncate group-hover:text-[#047857] transition-colors">
                        {name}
                      </div>
                      {age && (
                        <div className="text-[11px] text-[#7c766d] font-medium truncate">
                          {age}y · {gender === 'M' ? 'Male' : 'Female'}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Phone & Village */}
                  <td className="text-left">
                    <div className="flex items-center gap-1.5 font-semibold text-[#1a1c1a] text-xs truncate mb-0.5">
                      <Phone className="w-3 h-3 text-[#047857] shrink-0" />
                      <span className="truncate">{phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#7c766d] text-xs truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{village}</span>
                    </div>
                  </td>

                  {/* Complaint & Notes */}
                  <td className="text-center" title={item.complaint || 'No complaint listed'}>
                    <div className="font-medium text-[#4b463e] text-xs truncate text-center">
                      {item.complaint || '—'}
                    </div>
                    {item.notes && (
                      <div className="text-[11px] text-[#7c766d] truncate mt-0.5 italic">
                        {item.notes}
                      </div>
                    )}
                  </td>

                  {/* Time Added */}
                  <td className="text-center">
                    <span className="text-[#4b463e] font-semibold text-xs whitespace-nowrap">{item.timeAdded}</span>
                  </td>

                  {/* Payment Control */}
                  <td className="text-center">
                    {renderPaymentControl(item)}
                  </td>

                  {/* Status Badge */}
                  <td className="text-center">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Actions Column */}
                  <td className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      
                      {/* Primary workflow action */}
                      <div className="w-[90px] flex justify-end shrink-0">
                        {isWaiting && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(item.queueId, 'in-consultation')}
                            className="bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-1 w-full active:scale-95"
                          >
                            <span>Send In</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}

                        {isConsulting && (
                          <button
                            type="button"
                            onClick={() => onStatusChange(item.queueId, 'completed')}
                            className="bg-[#f0fdf4] hover:bg-[#dcfce7] text-[#166534] border border-[#bbf7d0] text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 w-full"
                          >
                            <Check className="w-3 h-3" />
                            <span>Done</span>
                          </button>
                        )}
                      </div>

                      {/* Details Button */}
                      <button
                        type="button"
                        onClick={() => onViewDetails(item)}
                        className="bg-[#f8f6f0] hover:bg-[#f2eee3] text-[#4b463e] text-xs font-bold px-2.5 py-1.5 rounded-xl border border-[#e4e2e1] hover:border-[#cdc6ba] transition-colors flex items-center gap-1 shadow-sm shrink-0"
                        title="View Full Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#7c766d]" />
                        <span>View</span>
                      </button>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemove(item.queueId)}
                        className="bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] p-1.5 rounded-xl transition-colors border border-[#fecdd3] hover:border-[#fca5a5] shrink-0"
                        title="Remove from Queue"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>
                  </td>

                </tr>
              );
            })}

            {queue.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-14 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                      <Clock className="w-7 h-7 text-[#cdc6ba]" />
                    </div>
                    <div>
                      <p className="text-[#4b463e] font-semibold text-sm">No patients in today's queue yet</p>
                      <p className="text-[#7c766d] text-xs mt-1">Click "+ Add Patient to Queue" to get started</p>
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
