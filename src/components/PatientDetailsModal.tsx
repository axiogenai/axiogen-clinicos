import { useState } from 'react';
import { X, AlertTriangle, Phone, MapPin, Clock, Edit2, Save, User, FileText, Activity } from 'lucide-react';
import type { Patient, QueueItem, PastVisit } from '../data/patients';
import { useClinic } from '../context/ClinicContext';

interface Props {
  queueItem: QueueItem;
  patient?: Patient;
  onClose: () => void;
}

export default function PatientDetailsModal({ queueItem, patient, onClose }: Props) {
  const { updatePatientDetails } = useClinic();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: queueItem.name || patient?.name || '',
    age: queueItem.age || patient?.age || 0,
    gender: (queueItem.gender || patient?.gender || 'M') as 'M' | 'F' | 'Other',
    phone: queueItem.phone || patient?.phone || '',
    village: queueItem.village || patient?.village || '',
    complaint: queueItem.complaint || '',
    notes: queueItem.notes || '',
    pastHistory: patient?.pastHistory || 'No known allergies',
    allergies: patient?.allergies || ''
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updatePatientDetails(
        patient?.id || queueItem.patientId || '',
        queueItem.queueId,
        formData
      );
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to update patient:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: queueItem.name || patient?.name || '',
      age: queueItem.age || patient?.age || 0,
      gender: (queueItem.gender || patient?.gender || 'M') as 'M' | 'F' | 'Other',
      phone: queueItem.phone || patient?.phone || '',
      village: queueItem.village || patient?.village || '',
      complaint: queueItem.complaint || '',
      notes: queueItem.notes || '',
      pastHistory: patient?.pastHistory || 'No known allergies',
      allergies: patient?.allergies || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#cdc6ba] transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-white p-5 flex justify-between items-start">
          <div className="flex-1 mr-2">
            {!isEditing ? (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold font-serif tracking-tight">{formData.name || 'Unknown Patient'}</h3>
                  <span className="bg-emerald-800/80 border border-emerald-400/30 text-[11px] font-bold px-2 py-0.5 rounded-full text-emerald-100 uppercase tracking-wider">
                    {queueItem.status}
                  </span>
                </div>
                <div className="text-emerald-100 text-xs mt-1 font-medium flex items-center gap-2">
                  <span>{formData.age ? `${formData.age} yrs` : 'Age N/A'}</span>
                  <span>•</span>
                  <span>{formData.gender === 'M' ? 'Male' : formData.gender === 'F' ? 'Female' : 'Other'}</span>
                  <span>•</span>
                  <span className="font-mono text-emerald-200/90">Queue ID: {queueItem.queueId}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-200" />
                <h3 className="text-lg font-bold font-serif">Edit Patient Information</h3>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {!isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="bg-white/15 hover:bg-white/25 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-white/20 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                title="Edit Patient Details"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="text-emerald-100 hover:text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {!isEditing ? (
          /* ── VIEW MODE ── */
          <div className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            
            {/* Essential Info Badges */}
            <div className="grid grid-cols-2 gap-3 bg-[#fbf9f5] p-3.5 rounded-xl border border-[#e4e2e1] text-sm">
              <div>
                <span className="text-[11px] text-[#7c766d] block uppercase font-bold tracking-wider">Phone</span>
                <span className="font-bold text-[#1a1c1a] flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-[#047857]" />
                  {formData.phone || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#7c766d] block uppercase font-bold tracking-wider">Village / City</span>
                <span className="font-bold text-[#1a1c1a] flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#047857]" />
                  {formData.village || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#7c766d] block uppercase font-bold tracking-wider">Time Added</span>
                <span className="font-semibold text-[#4b463e] flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#7c766d]" />
                  {queueItem.timeAdded}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#7c766d] block uppercase font-bold tracking-wider">Queue Status</span>
                <span className="font-bold text-[#047857] capitalize">{queueItem.status.replace('-', ' ')}</span>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <h4 className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-amber-600" />
                <span>Chief Complaint</span>
              </h4>
              <div className="bg-amber-50/80 border border-amber-200 text-amber-950 p-3 rounded-xl text-sm font-medium">
                {formData.complaint || 'No complaint entered'}
              </div>
            </div>

            {/* Receptionist Notes */}
            {formData.notes && (
              <div>
                <h4 className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Receptionist Notes</span>
                </h4>
                <div className="bg-gray-50 border border-gray-200 text-[#4b463e] p-3 rounded-xl text-sm italic">
                  "{formData.notes}"
                </div>
              </div>
            )}

            {/* Past History & Allergies */}
            <div>
              <h4 className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider mb-1.5">Past History</h4>
              <div className="text-sm font-medium text-[#1a1c1a] bg-[#fbf9f5] border border-[#e4e2e1] p-3 rounded-xl">
                {formData.pastHistory || 'No known allergies'}
              </div>
            </div>

            {formData.allergies && (
              <div>
                <h4 className="text-[11px] font-bold text-red-600 uppercase tracking-wider mb-1.5">Known Allergies</h4>
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{formData.allergies}</span>
                </div>
              </div>
            )}

            {/* Past Visits (if any) */}
            {patient?.pastVisits && patient.pastVisits.length > 0 && (
              <div>
                <h4 className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider mb-2">
                  Past Visit History ({patient.pastVisits.length})
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {patient.pastVisits.map((visit: PastVisit, idx: number) => (
                    <div key={idx} className="bg-[#fbf9f5] p-2.5 rounded-xl border border-[#e4e2e1] text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-[#1a1c1a]">{visit.diagnosis}</div>
                        <div className="text-[#7c766d] text-[11px]">Template: {visit.template}</div>
                      </div>
                      <div className="text-[#7c766d] font-semibold text-[11px]">{visit.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          /* ── EDIT MODE ── */
          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
            
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1">Patient Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Patil"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a] font-semibold"
                />
              </div>
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Age (Years)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                  placeholder="e.g. 28"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'Other' })}
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                >
                  <option value="M">Male (पुरुष)</option>
                  <option value="F">Female (स्त्री)</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {/* Phone & Village */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Mobile Phone Number</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit mobile"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a] font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Village / City (गाव)</label>
                <div className="relative">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    placeholder="e.g. Peth Vadgaon / Top"
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                  />
                </div>
              </div>
            </div>

            {/* Chief Complaint */}
            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1">Chief Complaint (तक्रार)</label>
              <textarea
                rows={2}
                value={formData.complaint}
                onChange={(e) => setFormData({ ...formData, complaint: e.target.value })}
                placeholder="e.g. चेहऱ्यावर मुरुमे व डाग, खाज येणे..."
                className="w-full p-2.5 text-sm bg-amber-50/50 border border-amber-300/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-amber-950 font-medium"
              />
            </div>

            {/* Receptionist Notes */}
            <div>
              <label className="block text-xs font-bold text-[#4b463e] mb-1">Receptionist Notes (Internal)</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any special remarks or follow-up note..."
                className="w-full px-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
              />
            </div>

            {/* Allergies & Past History */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Known Allergies</label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g. Sulfa, Penicillin"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4b463e] mb-1">Past Medical History</label>
                <input
                  type="text"
                  value={formData.pastHistory}
                  onChange={(e) => setFormData({ ...formData, pastHistory: e.target.value })}
                  placeholder="e.g. No known allergies / HTN"
                  className="w-full px-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                />
              </div>
            </div>

          </form>
        )}

        {/* Footer */}
        <div className="bg-[#fbf9f5] px-6 py-3.5 border-t border-[#e4e2e1] flex items-center justify-between">
          {!isEditing ? (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Patient Details</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-white hover:bg-gray-100 text-[#4b463e] border border-[#cdc6ba] rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleCancel}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-[#7c766d] hover:text-[#1a1c1a] border border-[#cdc6ba] rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="px-5 py-2 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-950/20 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
