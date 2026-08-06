import { useState, useEffect, useRef } from 'react';
import { Search, UserPlus, X } from 'lucide-react';
import type { Patient } from '../data/patients';

interface Props {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

export default function PatientSearch({ patients, onSelectPatient, onNewPatient }: Props) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = query.trim() ? patients.filter(p => 
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.phone.includes(query) ||
    p.village.toLowerCase().includes(query.toLowerCase())
  ) : [];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') setIsOpen(true);
      return;
    }
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < filtered.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < filtered.length) {
        onSelectPatient(filtered[activeIndex]);
        setIsOpen(false);
        setQuery('');
      } else if (activeIndex === filtered.length || filtered.length === 0) {
        onNewPatient();
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-2xl" ref={wrapperRef}>
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
        <input
          type="text"
          className="w-full pr-10 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
          style={{ paddingLeft: '2.5rem' }}
          placeholder="Search patients by name, phone, or village..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
          <ul className="max-h-80 overflow-y-auto">
            {filtered.map((patient, idx) => (
              <li
                key={patient.id}
                className={`px-4 py-3 cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50 ${activeIndex === idx ? 'bg-indigo-50' : ''}`}
                onClick={() => {
                  onSelectPatient(patient);
                  setIsOpen(false);
                  setQuery('');
                }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name} <span className="text-gray-500 font-normal text-xs ml-2">{patient.age}y / {patient.gender}</span></p>
                    <p className="text-sm text-gray-500 mt-0.5">{patient.phone} • {patient.village}</p>
                  </div>
                  {patient.pastVisits && patient.pastVisits.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {patient.pastVisits.length} past visits
                    </span>
                  )}
                </div>
              </li>
            ))}
            <li
              className={`px-4 py-3 cursor-pointer text-indigo-600 font-medium hover:bg-indigo-50 transition-colors flex items-center gap-2 ${activeIndex === filtered.length ? 'bg-indigo-50' : ''}`}
              onClick={() => {
                onNewPatient();
                setIsOpen(false);
              }}
            >
              <UserPlus className="w-4 h-4" />
              <span>Register New Patient "{query}"</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
