import { useState } from 'react';
import { UserCheck, UserPlus, Phone, MapPin, AlertCircle, Plus } from 'lucide-react';
import type { Patient } from '../data/patients';

interface Props {
  selectedPatient: Patient | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  onClearSelected: () => void;
}

export default function PatientRegistrationForm({ selectedPatient, onSubmit, onCancel, onClearSelected }: Props) {
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedPatient) {
      if (!formData.name.trim()) newErrors.name = 'Full name is required';
      if (!formData.age.trim() || isNaN(Number(formData.age))) newErrors.age = 'Valid age is required';
      if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Valid 10-digit phone number required';
      if (!formData.village.trim()) newErrors.village = 'Village/Town is required';
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Age <span className="text-red-500">*</span></label>
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
