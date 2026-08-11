import React, { useState } from 'react';
import { X, Plus, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';

interface AddCustomMedicineModalProps {
  initialName?: string;
  onClose: () => void;
  onSuccess: (newMedicine: any) => void;
}

const FORM_OPTIONS = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Ointment/Gel',
  'Cream',
  'Drops',
  'Lotion',
  'Powder',
  'Surgical',
  'General Medicine'
];

export default function AddCustomMedicineModal({
  initialName = '',
  onClose,
  onSuccess,
}: AddCustomMedicineModalProps) {
  const [name, setName] = useState(initialName.trim());
  const [form, setForm] = useState('Tablet');
  const [strength, setStrength] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Medicine name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name: name.trim(),
        form: form || 'Tablet',
        strength: strength.trim(),
        brand: '',
        category: 'General Medicine',
        availability: true,
      };

      const created = await api.createMedicine(payload);
      onSuccess(created);
      onClose();
    } catch (err: any) {
      console.error('Failed to create custom medicine:', err);
      setError(err?.message || 'Failed to save custom medicine to database');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 animate-in fade-in duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Add New Custom Drug</h3>
              <p className="text-xs text-slate-500">Save drug to database for permanent future use</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Medicine Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Paracetamol 500"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Form Type
              </label>
              <select
                value={form}
                onChange={(e) => setForm(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {FORM_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Strength / Dosage
              </label>
              <input
                type="text"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
                placeholder="e.g. 500MG, 10ML"
                className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Drug to DB</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
