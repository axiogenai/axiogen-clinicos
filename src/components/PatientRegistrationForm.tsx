import { useState, useMemo } from 'react';
import { UserCheck, UserPlus, Phone, MapPin, AlertCircle, AlertTriangle, ArrowRight, Plus, CreditCard, Banknote, QrCode, Check, Clock } from 'lucide-react';
import type { Patient } from '../data/patients';
import { useClinic } from '../context/ClinicContext';

interface Props {
  selectedPatient: Patient | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onClearSelected: () => void;
  onSelectExistingPatient?: (patient: Patient) => void;
}

export default function PatientRegistrationForm({ selectedPatient, onSubmit, onCancel, onClearSelected, onSelectExistingPatient }: Props) {
  const { patients, queue } = useClinic();

  const [formData, setFormData] = useState({
    name: selectedPatient?.name || '',
    age: selectedPatient?.age?.toString() || '',
    gender: selectedPatient?.gender || 'M',
    phone: selectedPatient?.phone || '',
    village: selectedPatient?.village || '',
    chiefComplaint: '',
    receptionNotes: '',
    pastMedicalHistory: 'No known allergies',
    allergies: '',
    paymentStatus: 'paid' as 'paid' | 'unpaid',
    paymentMode: 'cash' as 'cash' | 'online',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Real-time Duplicate Mobile Check
  const duplicatePatient = useMemo(() => {
    if (selectedPatient) return null;
    const clean = formData.phone.replace(/\D/g, '');
    if (clean.length === 10) {
      return patients.find(p => p.phone === clean);
    }
    return null;
  }, [formData.phone, patients, selectedPatient]);

  // Real-time Duplicate Queue Entry Check
  const isAlreadyInQueue = useMemo(() => {
    const targetPatientId = selectedPatient?.id || duplicatePatient?.id;
    const cleanPhone = formData.phone.replace(/\D/g, '');

    return queue.some(q => {
      if (q.status === 'completed') return false;
      if (targetPatientId && q.patientId === targetPatientId) return true;
      if (cleanPhone && cleanPhone.length === 10 && q.phone === cleanPhone) return true;
      return false;
    });
  }, [selectedPatient, duplicatePatient, formData.phone, queue]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPatient) {
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
    }

    if (isAlreadyInQueue) {
      newErrors.queue = 'Patient is already in today’s active consultation queue!';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#faf9f6] border border-[#e4e2e1] rounded-2xl shadow-sm overflow-hidden">
      
      {/* Form Header */}
      <div className="px-6 py-4 bg-[#f8f6f0] border-b border-[#e4e2e1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-serif font-bold text-[#1a1c1a] flex items-center gap-2">
            {selectedPatient ? (
              <>
                <UserCheck className="w-4.5 h-4.5 text-[#047857]" />
                <span>Add Existing Patient to Queue</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4.5 h-4.5 text-[#047857]" />
                <span>Register New Patient & Add to Queue</span>
              </>
            )}
          </h2>
          <p className="text-[11px] text-[#7c766d] mt-0.5">
            {selectedPatient
              ? "Review patient demographics and enter today's chief complaint."
              : 'Enter new patient registration details for clinic records.'}
          </p>
        </div>

        {selectedPatient && (
          <button 
            type="button" 
            onClick={onClearSelected} 
            className="btn-secondary text-xs"
          >
            Change Patient
          </button>
        )}
      </div>

      <div className="p-6 space-y-6">

        {/* Duplicate Queue Alert Banner */}
        {isAlreadyInQueue && (
          <div className="p-3.5 bg-[#fef2f2] border border-[#fecaca] rounded-xl flex items-center gap-2.5 text-xs text-[#991b1b] shadow-sm">
            <AlertCircle className="w-4 h-4 text-[#dc2626] shrink-0" />
            <span><strong className="font-bold">Duplicate Blocked:</strong> Patient is already in today's active OPD consultation queue!</span>
          </div>
        )}

        {/* Duplicate Mobile Patient Alert Banner */}
        {duplicatePatient && (
          <div className="p-3.5 bg-[#fffbeb] border border-[#fde68a] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#92400e] shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-[#b45309] shrink-0" />
              <div>
                <span className="font-bold text-[#b45309]">Existing Patient Match:</span> Patient <strong className="text-[#78350f]">{duplicatePatient.name}</strong> ({duplicatePatient.age} YRS · {duplicatePatient.village || 'N/A'}) is already registered with mobile <strong className="text-[#78350f]">{duplicatePatient.phone}</strong>.
              </div>
            </div>
            {onSelectExistingPatient && (
              <button
                type="button"
                onClick={() => onSelectExistingPatient(duplicatePatient)}
                className="px-3.5 py-1.5 bg-[#b45309] hover:bg-[#92400e] text-white font-bold rounded-lg shrink-0 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <span>Select Existing Patient</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Mode 1: Selected Existing Patient Summary */}
        {selectedPatient ? (
          <div className="p-4 bg-[#ecfdf5] border border-[#a7f3d0] rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#064e3b] to-[#047857] text-[#ecfdf5] font-bold flex items-center justify-center text-sm shadow-sm">
                {selectedPatient.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-[#1a1c1a] text-sm">{selectedPatient.name}</p>
                <p className="text-[11px] text-[#047857] font-semibold">{selectedPatient.age} yrs · {selectedPatient.gender === 'M' ? 'Male' : 'Female'} · ID: {selectedPatient.id}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#4b463e]">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#047857]" />
                <span className="font-semibold text-[#1a1c1a]">{selectedPatient.phone}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#7c766d]" />
                <span>{selectedPatient.village}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Mode 2: Full Registration Inputs */
          <div>
            <p className="form-label mb-3 text-[#047857]">— Patient Demographics —</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Ramesh Kulkarni"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
                {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Age (Optional)</label>
                  <input 
                     type="number" 
                    className={`form-input ${errors.age ? 'error' : ''}`}
                    placeholder="Years"
                    value={formData.age} 
                    onChange={e => setFormData({...formData, age: e.target.value})} 
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>}
                </div>

                <div>
                  <label className="form-label">Gender <span className="text-red-500">*</span></label>
                  <select 
                    className="form-input"
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value as 'M' | 'F'})}
                  >
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">Phone Number <span className="text-red-500">*</span> (10 Digits)</label>
                <input 
                  type="tel" 
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="e.g. 9876543210"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
              </div>

              <div>
                <label className="form-label">Village / Town <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  className={`form-input ${errors.village ? 'error' : ''}`}
                  placeholder="e.g. Shirur, Pune"
                  value={formData.village} 
                  onChange={e => setFormData({...formData, village: e.target.value})} 
                />
                {errors.village && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.village}</p>}
              </div>

              <div>
                <label className="form-label">Past Medical History</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  placeholder="Known conditions (e.g. Hypertension, Diabetes)..."
                  value={formData.pastMedicalHistory} 
                  onChange={e => setFormData({...formData, pastMedicalHistory: e.target.value})} 
                />
              </div>

              <div>
                <label className="form-label">Known Allergies</label>
                <textarea 
                  className="form-input"
                  rows={2}
                  placeholder="Known drug/food allergies (e.g. Sulfa, Penicillin)..."
                  value={formData.allergies} 
                  onChange={e => setFormData({...formData, allergies: e.target.value})} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Today's Visit Details */}
        <div className="space-y-4 pt-4 border-t border-[#e4e2e1]">
          <p className="form-label text-[#047857]">— Today's Visit —</p>
          <div>
            <label className="form-label">Chief Complaint (Optional)</label>
            <input 
              type="text" 
              className="form-input"
              placeholder="e.g. Itching and rash on arms for 5 days" 
              value={formData.chiefComplaint} 
              onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} 
            />
          </div>

          <div>
            <label className="form-label">Receptionist Notes (Optional)</label>
            <textarea 
              className="form-input"
              rows={2}
              placeholder="Any extra notes before doctor consultation (e.g. Emergency walk-in, VIP)..." 
              value={formData.receptionNotes} 
              onChange={e => setFormData({...formData, receptionNotes: e.target.value})} 
            />
          </div>

          {/* Payment Details */}
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
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                      formData.paymentStatus === 'paid'
                        ? 'bg-[#047857] text-white shadow-sm'
                        : 'text-[#4b463e] hover:text-[#1a1c1a]'
                    }`}
                  >
                    <Check className="w-3 h-3" />
                    <span>Paid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentStatus: 'unpaid' })}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1 ${
                      formData.paymentStatus === 'unpaid'
                        ? 'bg-amber-600 text-white shadow-sm'
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
                        ? 'bg-[#064e3b] text-white shadow-sm'
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
                        ? 'bg-blue-600 text-white shadow-sm'
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

        {/* Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onClick={onCancel} 
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>Add to Queue</span>
          </button>
        </div>

      </div>
    </form>
  );
}
