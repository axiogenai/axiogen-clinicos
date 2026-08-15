import { Star, FlaskConical, ArrowLeft, ArrowRight } from 'lucide-react';
import type { CaseTemplate, TemplateMedicine } from '../data/templates';
import { toMarathiFrequency, toMarathiDuration } from './PrintTemplate';

interface TemplatePreviewProps {
  template: CaseTemplate;
  onBack: () => void;
  onUseInEMR?: () => void;
}

export default function TemplatePreview({ template, onBack, onUseInEMR }: TemplatePreviewProps) {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            {template.isFavorite && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            )}
          </div>
          {template.description && (
            <p className="text-xs text-gray-500 mt-1">{template.description}</p>
          )}
        </div>

        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Editing</span>
        </button>
      </div>

      {/* Styled Printable Prescription Card */}
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-md space-y-6">
        
        {/* Prescription Header */}
        <div className="border-b border-gray-200 pb-4 text-center">
          <div className="text-xl font-bold text-indigo-900">शिनगारे स्किन & कॉस्मेटीक क्लिनिक</div>
          <div className="text-xs text-gray-600 font-medium">डॉ. प्रियांका प्रमोद शिनगारे | BHMS, FCHD, CCHC, CCMP (MUHS) | (Consultant Homeopathy Dermatologist & Cosmetologist)</div>
          <div className="text-[11px] text-gray-400 mt-1">Prescription Template Preview</div>
        </div>

        {/* Prescription Section */}
        <div>
          <h3 className="font-bold text-indigo-800 text-sm uppercase tracking-wider mb-3">
            Rx (Prescribed Medications)
          </h3>
          
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase font-semibold">
                <tr>
                  <th className="p-3 w-12 text-center">#</th>
                  <th className="p-3">Medicine & Strength</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {template.medicines.map((med: TemplateMedicine, idx: number) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="p-3 text-center font-mono text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-gray-900">{med.medicineName || med.medicineId}</td>
                    <td className="p-3 font-medium text-indigo-700">{med.dosage}</td>
                    <td className="p-3 font-medium text-gray-800">{toMarathiFrequency(med.frequency)}</td>
                    <td className="p-3 font-medium text-gray-800">{toMarathiDuration(med.duration)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Investigations Section */}
        {(template.investigationsAdvised?.length || 0) > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">
              Investigations Advised
            </h3>
            <div className="flex flex-wrap gap-2">
              {template.investigationsAdvised?.map((inv: string, idx: number) => (
                <span key={idx} className="bg-amber-50 text-amber-900 border border-amber-200 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-amber-600" />
                  <span>{inv}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Counselling Advice Section */}
        {(template.counsellingPoints?.length || 0) > 0 && (
          <div>
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-wider mb-2">
              Counselling & Advice
            </h3>
            <ul className="list-disc list-inside space-y-1 text-xs text-gray-700">
              {template.counsellingPoints?.map((point: string, idx: number) => (
                <li key={idx} className="leading-relaxed">{point}</li>
              ))}
            </ul>
          </div>
        )}

      </div>

      {/* Action Footer Bar */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Edit Template</span>
        </button>

        {onUseInEMR && (
          <button
            onClick={onUseInEMR}
            className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
          >
            <span>Use Template in Doctor Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
