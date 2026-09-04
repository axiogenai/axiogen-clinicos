import { useState } from 'react';
import { Plus, Pill, FlaskConical, Lightbulb, AlertTriangle, X, Check, Eye } from 'lucide-react';
import type { CaseTemplate, TemplateMedicine } from '../data/templates';
import MedicineEditorRow from './MedicineEditorRow';
import MedicineSearchModal from './MedicineSearchModal';
import { parsePrescriptionSentence } from '../utils/sentenceParser';
import { useClinic } from '../context/ClinicContext';

interface TemplateEditorProps {
  template: CaseTemplate;
  onSave: (template: CaseTemplate) => void;
  onCancel: () => void;
  onPreview: () => void;
}

const COMMON_INVESTIGATIONS = [
  'CBC', 'LFT', 'RFT', 'BSL (Fasting)', 'BSL (PP)',
  'Lipid Profile', 'Thyroid Profile', 'Urine Routine',
  'KOH Mount', 'Skin Biopsy', 'Patch Test', "Wood's Lamp Exam"
];

export default function TemplateEditor({ template, onSave, onCancel, onPreview }: TemplateEditorProps) {
  const { addCustomFrequency } = useClinic();
  const [formData, setFormData] = useState<CaseTemplate>(() => ({
    id: template?.id || `tpl_${Date.now()}`,
    name: template?.name || '',
    description: template?.description || '',
    medicines: template?.medicines || [],
    investigationsAdvised: template?.investigationsAdvised || [],
    counsellingPoints: template?.counsellingPoints || [],
    isFavorite: template?.isFavorite || false,
    createdDate: template?.createdDate || new Date().toISOString().split('T')[0],
    updatedDate: template?.updatedDate || new Date().toISOString().split('T')[0],
  }));
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [customInv, setCustomInv] = useState('');
  const [customAdvice, setCustomAdvice] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sentenceInput, setSentenceInput] = useState('');

  // Instant local sentence parser — type "dolo 500 sakali ratri 15 days" and press Enter
  const handleSentenceAdd = () => {
    const raw = sentenceInput.trim();
    if (!raw) return;

    setSentenceInput('');

    try {
      const parsed = parsePrescriptionSentence(raw);

      const medicineName = parsed?.formattedMedicineName || raw;
      const frequency = parsed?.frequency || '';
      const duration = parsed?.duration || '7 Days';

      if (frequency) {
        addCustomFrequency(frequency);
      }

      const newMed: TemplateMedicine & { medicineName: string } = {
        medicineId: `med_${Date.now()}`,
        medicineName: medicineName,
        dosage: '',
        frequency,
        duration,
      };

      setFormData((prev: CaseTemplate) => ({
        ...prev,
        medicines: [...prev.medicines, newMed],
      }));
    } catch (err) {
      console.warn('Template add failed:', err);
      const fallbackMed: TemplateMedicine & { medicineName: string } = {
        medicineId: `custom_${Date.now()}`,
        medicineName: raw,
        dosage: '',
        frequency: '',
        duration: '7 Days',
      };
      setFormData((prev: CaseTemplate) => ({
        ...prev,
        medicines: [...prev.medicines, fallbackMed],
      }));
    }
  };

  const handleAddMedicineFromModal = (med: TemplateMedicine & { medicineName: string }) => {
    if (replacingIndex !== null && replacingIndex >= 0 && replacingIndex < formData.medicines.length) {
      // In-place replace: keeps exact position and order intact!
      const updated = [...formData.medicines];
      updated[replacingIndex] = {
        ...updated[replacingIndex],
        medicineId: med.medicineId || updated[replacingIndex].medicineId,
        medicineName: med.medicineName,
        dosage: med.dosage || updated[replacingIndex].dosage || '',
        frequency: med.frequency || updated[replacingIndex].frequency || '',
        duration: med.duration || updated[replacingIndex].duration || '7 Days',
        count: med.count !== undefined ? med.count : updated[replacingIndex].count,
      };
      setFormData((prev: CaseTemplate) => ({
        ...prev,
        medicines: updated,
      }));
      setReplacingIndex(null);
    } else {
      // Normal add to bottom
      setFormData((prev: CaseTemplate) => ({
        ...prev,
        medicines: [...prev.medicines, med],
      }));
    }
    setShowSearchModal(false);
  };

  const handleUpdateMedicine = (index: number, field: keyof TemplateMedicine, value: any) => {
    if (field === 'frequency' && typeof value === 'string' && value.trim().length > 1) {
      addCustomFrequency(value.trim());
    }
    const updated = [...formData.medicines];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev: CaseTemplate) => ({ ...prev, medicines: updated }));
  };

  const handleRemoveMedicine = (index: number) => {
    setFormData((prev: CaseTemplate) => ({
      ...prev,
      medicines: prev.medicines.filter((_: TemplateMedicine, i: number) => i !== index),
    }));
  };

  const handleMoveMedicine = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.medicines.length) return;
    const updated = [...formData.medicines];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFormData((prev: CaseTemplate) => ({ ...prev, medicines: updated }));
  };

  const toggleInvestigation = (inv: string) => {
    setFormData((prev: CaseTemplate) => {
      const current = prev.investigationsAdvised || [];
      const exists = current.includes(inv);
      return {
        ...prev,
        investigationsAdvised: exists
          ? current.filter((i: string) => i !== inv)
          : [...current, inv],
      };
    });
  };

  const handleAddCustomInv = () => {
    if (!customInv.trim()) return;
    const current = formData.investigationsAdvised || [];
    if (!current.includes(customInv.trim())) {
      setFormData((prev: CaseTemplate) => ({
        ...prev,
        investigationsAdvised: [...(prev.investigationsAdvised || []), customInv.trim()],
      }));
    }
    setCustomInv('');
  };

  const handleAddCounsellingPoint = () => {
    if (!customAdvice.trim()) return;
    setFormData((prev: CaseTemplate) => ({
      ...prev,
      counsellingPoints: [...(prev.counsellingPoints || []), customAdvice.trim()],
    }));
    setCustomAdvice('');
  };

  const handleRemoveCounsellingPoint = (index: number) => {
    setFormData((prev: CaseTemplate) => ({
      ...prev,
      counsellingPoints: (prev.counsellingPoints || []).filter((_: string, i: number) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (formData.medicines.length === 0) {
      newErrors.medicines = 'At least one medicine is required in a template';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      ...formData,
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      updatedDate: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 pb-20">
      
      {/* Header Info Panel */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b border-gray-100 pb-2.5 sm:pb-3">
          {template.id ? 'Edit Template' : 'Create New Prescription Template'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Template Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Acne - Mild Protocol"
              className={`w-full p-2.5 border rounded-lg text-xs sm:text-sm ${
                errors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:ring-indigo-500'
              }`}
            />
            {errors.name && <span className="text-xs text-red-500 mt-1 block">{errors.name}</span>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. For mild papular acne cases"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-xs sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Medicines Manager */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
              <Pill className="w-4 h-4 text-indigo-600" />
              Prescribed Drugs Formulary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure default medications, dosages, and durations.</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setReplacingIndex(null);
              setShowSearchModal(true);
            }}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>

        {/* AI Sentence Input */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-2.5">
          <input
            type="text"
            value={sentenceInput}
            onChange={(e) => setSentenceInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleSentenceAdd();
              }
            }}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-gray-800 font-medium min-w-0"
            placeholder="Type here and press Enter to add..."
          />
          <button
            type="button"
            onClick={handleSentenceAdd}
            disabled={!sentenceInput.trim()}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>

        {errors.medicines && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errors.medicines}</span>
          </div>
        )}

        <div className="space-y-2.5 sm:space-y-3">
          {formData.medicines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50 text-xs sm:text-sm">
              No medicines added yet. Type a sentence above or click "+ Add Medicine" to start.
            </div>
          ) : (
            formData.medicines.map((item: TemplateMedicine, idx: number) => (
              <MedicineEditorRow
                key={`${item.medicineId}-${idx}`}
                item={item}
                index={idx}
                onUpdate={handleUpdateMedicine}
                onRemove={handleRemoveMedicine}
                onSearchReplace={(i) => {
                  setReplacingIndex(i);
                  setShowSearchModal(true);
                }}
                onMoveUp={(i) => handleMoveMedicine(i, 'up')}
                onMoveDown={(i) => handleMoveMedicine(i, 'down')}
                isFirst={idx === 0}
                isLast={idx === formData.medicines.length - 1}
              />
            ))
          )}
        </div>
      </div>

      {/* Investigations & Counselling Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Investigations Checklist */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-3.5 sm:space-y-4">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            Investigations Advised
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
            {COMMON_INVESTIGATIONS.map((inv: string) => (
              <label key={inv} className="flex items-center gap-2 cursor-pointer text-gray-700 text-xs">
                <input
                  type="checkbox"
                  checked={(formData.investigationsAdvised || []).includes(inv)}
                  onChange={() => toggleInvestigation(inv)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                {inv}
              </label>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={customInv}
              onChange={(e) => setCustomInv(e.target.value)}
              placeholder="Custom test (e.g. Dermoscopy)..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-xs min-w-0"
            />
            <button
              type="button"
              onClick={handleAddCustomInv}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Test
            </button>
          </div>
        </div>

        {/* Counselling Advice */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm space-y-3.5 sm:space-y-4">
          <h3 className="font-bold text-gray-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            Patient Counselling Points
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(formData.counsellingPoints || []).map((point: string, idx: number) => (
              <div key={idx} className="flex items-start justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs gap-2">
                <span className="text-gray-800 font-medium flex-1">{point}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCounsellingPoint(idx)}
                  className="text-gray-400 hover:text-red-500 p-1 shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={customAdvice}
              onChange={(e) => setCustomAdvice(e.target.value)}
              placeholder="Custom advice (e.g. Apply sunscreen)..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-xs min-w-0"
            />
            <button
              type="button"
              onClick={handleAddCounsellingPoint}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Point
            </button>
          </div>
        </div>
      </div>

      {/* Actions / Buttons Footer (Responsive) */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <button
          type="button"
          onClick={onPreview}
          className="px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> Live Preview
        </button>

        <div className="flex gap-2.5 sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors text-center"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Save Template
          </button>
        </div>
      </div>

      {/* Formulary Search Modal for Adding or Replacing In-Place */}
      {showSearchModal && (
        <MedicineSearchModal
          onAdd={handleAddMedicineFromModal}
          onClose={() => {
            setShowSearchModal(false);
            setReplacingIndex(null);
          }}
        />
      )}
    </form>
  );
}
