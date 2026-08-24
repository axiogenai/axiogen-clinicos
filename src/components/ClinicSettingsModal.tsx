import { useState } from 'react';
import { X, Plus, Trash2, Check, Settings, Palette, Eye } from 'lucide-react';
import type { ClinicSettings, DoctorInfo } from '../data/clinicSettings';

interface Props {
  settings: ClinicSettings;
  onSave: (settings: ClinicSettings) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { name: 'Clinic Green', hex: '#7CB342' },
  { name: 'Royal Indigo', hex: '#4F46E5' },
  { name: 'Medical Teal', hex: '#0D9488' },
  { name: 'Ocean Blue', hex: '#0284C7' },
  { name: 'Deep Slate', hex: '#334155' },
  { name: 'Crimson Rose', hex: '#E11D48' },
];

export default function ClinicSettingsModal({ settings, onSave, onClose }: Props) {
  const [formData, setFormData] = useState<ClinicSettings>({ ...settings });
  const [newDoc, setNewDoc] = useState<DoctorInfo>({ id: '', name: '', title: '', regNo: '' });

  const handleAddDoctor = () => {
    if (!newDoc.name.trim()) return;
    const docToAdd = {
      ...newDoc,
      id: `doc_${Date.now()}`,
    };
    setFormData((prev) => ({
      ...prev,
      doctors: [...prev.doctors, docToAdd],
    }));
    setNewDoc({ id: '', name: '', title: '', regNo: '' });
  };

  const handleRemoveDoctor = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((d) => d.id !== id),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col my-auto">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Clinic Header & Branding Settings</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          
          {/* Template Style Selector */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-900">
              Active Prescription Pad Layout
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, templateVariant: 'a4' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  (formData.templateVariant || 'a4') === 'a4'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">📄 A4 Template (Default)</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Exact A4 full bleed, balanced fonts & spacing</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, templateVariant: 'dermatology' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  formData.templateVariant === 'dermatology'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">📑 Template 1: Dermatology Pad</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Original pad layout, sidebar & stamps</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, templateVariant: 'general' })}
                className={`p-3 rounded-lg text-left border transition-all ${
                  formData.templateVariant === 'general'
                    ? 'bg-white border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                <div className="font-bold text-xs text-slate-900">📋 Template 2: General Pad</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Clean open layout, minimal text list</div>
              </button>
            </div>
          </div>

          {/* Clinic Names */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Name (Marathi / Local)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 font-serif"
                value={formData.clinicNameHi}
                onChange={(e) => setFormData({ ...formData, clinicNameHi: e.target.value })}
                placeholder="उदा. शिनगारे स्किन & कॉस्मेटिक क्लिनिक"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Clinic Name (English)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.clinicNameEn}
                onChange={(e) => setFormData({ ...formData, clinicNameEn: e.target.value })}
                placeholder="e.g. Shingare Skin & Cosmetic Clinic"
              />
            </div>
          </div>

          {/* Doctors Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Doctors & Consultants List
            </label>

            <div className="space-y-2">
              {formData.doctors.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{doc.name}</div>
                    <div className="text-[11px] text-slate-500">{doc.title} • {doc.regNo}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveDoctor(doc.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Doctor Subform */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <input
                type="text"
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Doctor Name"
                value={newDoc.name}
                onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
              />
              <input
                type="text"
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Degree / Designation"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Reg No."
                  value={newDoc.regNo}
                  onChange={(e) => setNewDoc({ ...newDoc, regNo: e.target.value })}
                />
                <button
                  type="button"
                  onClick={handleAddDoctor}
                  className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Address Line
              </label>
              <textarea
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Phone Numbers
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 mb-2"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                Opening Hours
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                value={formData.openingHours}
                onChange={(e) => setFormData({ ...formData, openingHours: e.target.value })}
              />
            </div>
          </div>

          {/* Header Theme Color */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-600" />
              <span>Prescription Header Accent Color</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.hex}
                  type="button"
                  onClick={() => setFormData({ ...formData, headerBgColor: preset.hex })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 transition-transform active:scale-95 ${
                    formData.headerBgColor === preset.hex ? 'ring-2 ring-offset-2 ring-indigo-600 shadow-md' : 'opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: preset.hex }}
                >
                  {formData.headerBgColor === preset.hex && <Check className="w-3.5 h-3.5 text-white" />}
                  <span>{preset.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sections Toggle */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Visible Prescription Sections</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showPastHistory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showPastHistory: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Past Medical History</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showDrugHistory}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showDrugHistory: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Drug & Allergy History</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showInvestigations}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showInvestigations: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Investigations Advised</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showCounselling}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showCounselling: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Counselling Checklist</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showFollowUp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showFollowUp: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Follow-Up Appointment Box</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.sections.showSignature}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sections: { ...formData.sections, showSignature: e.target.checked },
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Dual Signature Lines</span>
              </label>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save & Apply Settings</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
