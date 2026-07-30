import { X, AlertTriangle, Phone, MapPin, Clock } from 'lucide-react';
import type { Patient, QueueItem, PastVisit } from '../data/patients';

interface Props {
  queueItem: QueueItem;
  patient?: Patient;
  onClose: () => void;
}

export default function PatientDetailsModal({ queueItem, patient, onClose }: Props) {
  const name = queueItem.name || patient?.name || 'Unknown Patient';
  const age = queueItem.age || patient?.age;
  const gender = queueItem.gender || patient?.gender;
  const phone = queueItem.phone || patient?.phone || 'N/A';
  const village = queueItem.village || patient?.village || 'N/A';

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
        
        {/* Header */}
        <div className="bg-indigo-900 text-white p-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{name}</h3>
            <div className="text-indigo-200 text-xs mt-1">
              {age} yrs • {gender} • Queue ID: {queueItem.queueId}
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-indigo-300 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm">
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Phone</span>
              <span className="font-medium text-gray-900 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                {phone}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Village</span>
              <span className="font-medium text-gray-900 flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                {village}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Time Added</span>
              <span className="font-medium text-gray-900 flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                {queueItem.timeAdded}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-semibold">Queue Status</span>
              <span className="font-bold text-indigo-700 capitalize">{queueItem.status.replace('-', ' ')}</span>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Chief Complaint</h4>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-sm font-medium">
              {queueItem.complaint}
            </div>
          </div>

          {queueItem.notes && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Receptionist Notes</h4>
              <div className="bg-gray-100 text-gray-800 p-3 rounded-lg text-sm italic">
                "{queueItem.notes}"
              </div>
            </div>
          )}

          {patient && (
            <>
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Past History</h4>
                <div className="text-sm text-gray-800">{patient.pastHistory || 'No past history specified'}</div>
              </div>

              {patient.allergies && (
                <div>
                  <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Known Allergies</h4>
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>{patient.allergies}</span>
                  </div>
                </div>
              )}

              {patient.pastVisits && patient.pastVisits.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Past Visit History ({patient.pastVisits.length})</h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {patient.pastVisits.map((visit: PastVisit, idx: number) => (
                      <div key={idx} className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs flex justify-between">
                        <div>
                          <div className="font-semibold text-gray-900">{visit.diagnosis}</div>
                          <div className="text-gray-500">Template: {visit.template}</div>
                        </div>
                        <div className="text-gray-400 font-medium">{visit.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
