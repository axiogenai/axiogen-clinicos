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
    if (!formData.chiefComplaint.trim()) newErrors.chiefComplaint = 'Chief complaint is required';
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
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
      
      {/* Form Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            {selectedPatient ? (
              <>
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Add Existing Patient to Queue</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-indigo-600" />
                <span>Register New Patient & Add to Queue</span>
              </>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {selectedPatient ? 'Review patient demographics and enter today\'s chief complaint.' : 'Enter new patient registration details for clinic records.'}
          </p>
        </div>

        {selectedPatient && (
          <button 
            type="button" 
            onClick={onClearSelected} 
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            Change Selected Patient
          </button>
        )}
      </div>

      {/* Mode 1: Selected Existing Patient Summary */}
      {selectedPatient ? (
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {selectedPatient.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{selectedPatient.name}</p>
              <p className="text-xs text-indigo-700 font-medium">{selectedPatient.age} Yrs • {selectedPatient.gender === 'M' ? 'Male' : 'Female'} • ID: {selectedPatient.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-500" />
              <span className="font-medium text-slate-800">{selectedPatient.phone}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{selectedPatient.village}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Full Registration Inputs */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.name ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
              placeholder="e.g. Ramesh Kulkarni"
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            {errors.name && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input 
                type="number" 
                className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.age ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
                placeholder="Years"
                value={formData.age} 
                onChange={e => setFormData({...formData, age: e.target.value})} 
              />
              {errors.age && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.age}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                value={formData.gender} 
                onChange={e => setFormData({...formData, gender: e.target.value as 'M' | 'F'})}
              >
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Phone Number <span className="text-red-500">*</span> (10 Digits)
            </label>
            <input 
              type="tel" 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
              placeholder="e.g. 9876543210"
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
              Village / Town <span className="text-red-500">*</span>
            </label>
            <input 
              type="text" 
              className={`w-full px-3 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.village ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
              placeholder="e.g. Shirur, Pune"
              value={formData.village} 
              onChange={e => setFormData({...formData, village: e.target.value})} 
            />
            {errors.village && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.village}</p>}
          </div>

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Past Medical History</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
                rows={2} 
                placeholder="Known conditions (e.g. Hypertension, Diabetes)..."
                value={formData.pastMedicalHistory} 
                onChange={e => setFormData({...formData, pastMedicalHistory: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Allergies</label>
              <textarea 
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
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
      <div className="space-y-4 pt-2 border-t border-slate-100">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
            Chief Complaint <span className="text-red-500">*</span>
          </label>
          <input 
            type="text" 
            className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${errors.chiefComplaint ? 'border-red-500 bg-red-50' : 'border-slate-300'}`} 
            placeholder="e.g. Itching and rash on arms for 5 days" 
            value={formData.chiefComplaint} 
            onChange={e => setFormData({...formData, chiefComplaint: e.target.value})} 
          />
          {errors.chiefComplaint && <p className="text-red-500 text-xs mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.chiefComplaint}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Receptionist Notes (Optional)</label>
          <textarea 
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" 
            rows={2} 
            placeholder="Any extra notes before doctor consultation (e.g. Emergency walk-in, VIP)..." 
            value={formData.receptionNotes} 
            onChange={e => setFormData({...formData, receptionNotes: e.target.value})} 
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
        <button 
          type="button" 
          onClick={onCancel} 
          className="px-5 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Patient to Queue</span>
        </button>
      </div>

    </form>
  );
}
