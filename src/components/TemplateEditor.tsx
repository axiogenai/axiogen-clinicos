import { useState } from 'react';
import { Plus, Pill, FlaskConical, Lightbulb, AlertTriangle, X, Check, Eye, Loader2 } from 'lucide-react';
import type { CaseTemplate, TemplateMedicine } from '../data/templates';
import MedicineEditorRow from './MedicineEditorRow';
import MedicineSearchModal from './MedicineSearchModal';
import { parseSentenceWithGroqAI } from '../utils/sentenceParser';

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
  const [customInv, setCustomInv] = useState('');
  const [customAdvice, setCustomAdvice] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [sentenceInput, setSentenceInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Groq AI sentence parser — type "dolo 500 sakali ratri 15 days" and press Enter
  const handleSentenceAdd = async () => {
    const raw = sentenceInput.trim();
    if (!raw || isParsing) return;

    setIsParsing(true);
    setSentenceInput('');

    try {
      const parsed = await parseSentenceWithGroqAI(raw);

      const medicineName = parsed?.formattedMedicineName || raw;
      const frequency = parsed?.frequency || '';
      const duration = parsed?.duration || '7 Days';

      const newMed: TemplateMedicine & { medicineName: string } = {
        medicineId: `ai_${Date.now()}`,
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
      console.warn('Groq AI template parse failed:', err);
      // Fallback: add raw text as medicine name
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
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddMedicineFromModal = (med: TemplateMedicine & { medicineName: string }) => {
    setFormData((prev: CaseTemplate) => ({
      ...prev,
      medicines: [...prev.medicines, med],
    }));
    setShowSearchModal(false);
  };

  const handleUpdateMedicine = (index: number, field: keyof TemplateMedicine, value: string) => {
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
    <form onSubmit={handleSubmit} className="space-y-6 pb-20">
      
      {/* Header Info Panel */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
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
              className={`w-full p-2.5 border rounded-lg text-sm ${
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
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Medicines Manager */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Pill className="w-4 h-4 text-indigo-600" />
              Prescribed Drugs Formulary
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Configure default medications, dosages, and durations.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowSearchModal(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Medicine
          </button>
        </div>

        {/* AI Sentence Input */}
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2.5">
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
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 font-medium"
            placeholder="e.g. dolo 500 sakali ratri 15 days"
            disabled={isParsing}
          />
          {isParsing ? (
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
          ) : (
            <button
              type="button"
              onClick={handleSentenceAdd}
              disabled={!sentenceInput.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          )}
        </div>

        {errors.medicines && (
          <div className="bg-red-50 text-red-700 border border-red-200 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errors.medicines}</span>
          </div>
        )}

        <div className="space-y-3">
          {formData.medicines.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
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
              />
            ))
          )}
        </div>
      </div>

      {/* Investigations & Counselling Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Investigations Checklist */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-amber-600" />
            Investigations Advised
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
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
              className="flex-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={handleAddCustomInv}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Test
            </button>
          </div>
        </div>

        {/* Counselling Advice */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-emerald-600" />
            Patient Counselling Points
          </h3>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(formData.counsellingPoints || []).map((point: string, idx: number) => (
              <div key={idx} className="flex items-start justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200 text-xs">
                <span className="text-gray-800 font-medium">{point}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveCounsellingPoint(idx)}
                  className="text-gray-400 hover:text-red-600 p-0.5 rounded transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <input
              type="text"
              value={customAdvice}
              onChange={(e) => setCustomAdvice(e.target.value)}
              placeholder="e.g. Avoid direct sunlight, apply sunscreen..."
              className="flex-1 p-2 border border-gray-300 rounded-lg text-xs"
            />
            <button
              type="button"
              onClick={handleAddCounsellingPoint}
              className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Advice
            </button>
          </div>
        </div>

      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl p-2.5 sm:p-4 z-40">
        <div className="max-w-6xl mx-auto flex flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 sm:px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium text-xs sm:text-sm transition-colors shrink-0"
          >
            Cancel
          </button>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onPreview}
              className="px-2.5 sm:px-5 py-2 border border-emerald-600 text-emerald-700 hover:bg-emerald-50 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center gap-1 shrink-0"
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden xs:inline">Preview</span>
              <span className="xs:hidden">Preview</span>
            </button>
            <button
              type="submit"
              className="px-3 sm:px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold text-xs sm:text-sm shadow-md transition-colors flex items-center gap-1 shrink-0"
            >
              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Medicine Search Modal */}
      {showSearchModal && (
        <MedicineSearchModal
          onAdd={handleAddMedicineFromModal}
          onClose={() => setShowSearchModal(false)}
        />
      )}
    </form>
  );
}
