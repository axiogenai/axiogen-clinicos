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
          placeholder="वारंवारता (उदा. सकाळी १ व रात्री १)"
          className="w-full sm:w-56 px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          list={`freq-options-${index}`}
        />
        <datalist id={`freq-options-${index}`}>
          <option value="सकाळी १ व रात्री १ घेणे" />
          <option value="सकाळी १ घेणे" />
          <option value="रात्री १ घेणे" />
          <option value="दुपारी १ घेणे" />
          <option value="सकाळी १, दुपारी १ व रात्री १ घेणे" />
          <option value="दिवसातून ४ वेळा घेणे" />
          <option value="१ गोळी सकाळी १ गोळी रात्री घेणे" />
          <option value="१/२ गोळी सकाळी घेणे" />
          <option value="उपाशीपोटी घेणे" />
          <option value="जेवणानंतर घेणे" />
          <option value="गोळी टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे" />
          <option value="गोळी टेपरिंग: १ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: २ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ३ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ४ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ५ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ६ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ८ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: ९ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="गोळी टेपरिंग: १० दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे" />
          <option value="क्रीम टेपरिंग: १ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: २ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ४ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ६ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ८ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: ९ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="क्रीम टेपरिंग: १० दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे" />
          <option value="दर सोमवारी १ गोळी घेणे" />
          <option value="दर बुधवारी १ गोळी घेणे" />
          <option value="दर शनिवारी १ गोळी घेणे" />
          <option value="आठवड्यातून एकदा घेणे" />
          <option value="रात्री झोपताना घेणे" />
          <option value="सकाळी उपाशीपोटी घेणे" />
          <option value="गरज असेल तेव्हा घेणे" />
          <option value="त्रास झाल्यास घेणे (SOS)" />
          <option value="सकाळी लावणे १-२ तास ठेवणे" />
          <option value="काळ्या डागावर लावणे" />
          <option value="pimples (मोड्यांवर) लावणे" />
          <option value="full फेस लावणे" />
          <option value="डोक्यात लावणे" />
          <option value="चेहऱ्यावर लावणे" />
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
