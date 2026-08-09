import { Trash2 } from 'lucide-react';
import type { TemplateMedicine } from '../data/templates';

interface MedicineEditorRowProps {
  item: TemplateMedicine;
  index: number;
  onUpdate: (index: number, field: keyof TemplateMedicine, value: string) => void;
  onRemove: (index: number) => void;
}

export default function MedicineEditorRow({ item, index, onUpdate, onRemove }: MedicineEditorRowProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 transition-colors">
      <div className="flex-1 w-full">
        <div className="font-medium text-sm text-gray-900 mb-2 sm:mb-0">
          {item.medicineName || 'Unknown Medicine'}
        </div>
      </div>
      
      <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto items-center">
        <input
          type="text"
          value={item.dosage}
          onChange={(e) => onUpdate(index, 'dosage', e.target.value)}
          placeholder="Dosage"
          className="w-full sm:w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        
        <input
          type="text"
          value={item.frequency}
          onChange={(e) => onUpdate(index, 'frequency', e.target.value)}
          placeholder="Frequency (e.g. Twice daily)"
          className="w-full sm:w-48 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          list={`freq-options-${index}`}
        />
        <datalist id={`freq-options-${index}`}>
          <option value="Once daily" />
          <option value="Twice daily" />
          <option value="Thrice daily" />
          <option value="१ गोळी सकाळी १ गोळी रात्री घेणे" />
          <option value="१/२ गोळी सकाळी घेणे" />
          <option value="उपाशीपोटी घेणे" />
          <option value="जेवणानंतर घेणे" />
          <option value="सकाळी लावणे" />
          <option value="रात्री लावणे" />
          <option value="चेहऱ्यावर लावणे" />
          <option value="डोक्यात लावणे" />
          <option value="Once weekly" />
          <option value="At bedtime" />
          <option value="SOS" />
        </datalist>
        
        <input
          type="text"
          value={item.duration}
          onChange={(e) => onUpdate(index, 'duration', e.target.value)}
          placeholder="Duration"
          className="w-full sm:w-24 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
        />
        
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors ml-auto sm:ml-0"
          title="Remove medicine"
        >
          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
        </button>
      </div>
    </div>
  );
}
