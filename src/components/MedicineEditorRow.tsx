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
        
        <select
          value={item.frequency}
          onChange={(e) => onUpdate(index, 'frequency', e.target.value)}
          className="w-full sm:w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white"
        >
          <option value="Once daily">Once daily</option>
          <option value="Twice daily">Twice daily</option>
          <option value="Thrice daily">Thrice daily</option>
          <option value="Four times daily">Four times daily</option>
          <option value="Once weekly">Once weekly</option>
          <option value="As needed">As needed</option>
          <option value="At bedtime">At bedtime</option>
          <option value="Before breakfast">Before breakfast</option>
          <option value="After meals">After meals</option>
          <option value="SOS">SOS</option>
        </select>
        
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
