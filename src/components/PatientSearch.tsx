import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, UserPlus, X, Trash2 } from 'lucide-react';
import type { Patient } from '../data/patients';
import { useClinic } from '../context/ClinicContext';

interface Props {
  patients: Patient[];
  onSelectPatient: (patient: Patient) => void;
  onNewPatient: () => void;
}

/**
 * Strict Prefix-First Search Indexer with Alphabetical Sorting:
 * - "a" -> "Aadi", "Aakash", "Abhi", "Abhijeet", "Abhishek", "Aditya"...
 * - "ab" -> "Abhi", "Abhijeet", "Abhishek"...
 */
export function filterAndSortPatients(patients: Patient[], rawQuery: string): Patient[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  const isNumeric = /^\d+$/.test(query);

  if (isNumeric) {
    const prefixPhone = patients.filter(p => (p.phone || '').startsWith(query));
    const containsPhone = patients.filter(p => !(p.phone || '').startsWith(query) && (p.phone || '').includes(query));
    const idMatches = patients.filter(p => (p.id || '').toLowerCase().includes(query));
    return [...prefixPhone, ...containsPhone, ...idMatches];
  }

  const nameStartsWith: Patient[] = [];
  const wordStartsWith: Patient[] = [];
  const villageStartsWith: Patient[] = [];
  const substringMatches: Patient[] = [];

  for (const p of patients) {
    const nameLower = (p.name || '').trim().toLowerCase();
    const villageLower = (p.village || '').trim().toLowerCase();
    const phone = p.phone || '';

    if (nameLower.startsWith(query)) {
      nameStartsWith.push(p);
    } else {
      const words = nameLower.split(/[\s\.\-]+/).filter(Boolean);
      if (words.some(w => w.startsWith(query))) {
        wordStartsWith.push(p);
      } else if (villageLower.startsWith(query)) {
        villageStartsWith.push(p);
      } else if (query.length >= 3 && (nameLower.includes(query) || villageLower.includes(query) || phone.includes(query))) {
        substringMatches.push(p);
      }
    }
  }

  // Strict Alphabetical Sort within each priority tier
  const sortAlpha = (a: Patient, b: Patient) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });

  nameStartsWith.sort(sortAlpha);
  wordStartsWith.sort(sortAlpha);
  villageStartsWith.sort(sortAlpha);
  substringMatches.sort(sortAlpha);

  // When user types 1 or 2 letters (e.g. "a", "ab"), ONLY show starting prefix matches!
  if (query.length <= 2) {
    return [...nameStartsWith, ...wordStartsWith];
  }

  return [...nameStartsWith, ...wordStartsWith, ...villageStartsWith, ...substringMatches];
}

export default function PatientSearch({ patients, onSelectPatient, onNewPatient }: Props) {
  const { deletePatient } = useClinic();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => filterAndSortPatients(patients, query), [patients, query]);

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
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900">{patient.name} <span className="text-gray-500 font-normal text-xs ml-2">{patient.age}y / {patient.gender}</span></p>
                    <p className="text-sm text-gray-500 mt-0.5">{patient.phone} • {patient.village}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {patient.pastVisits && patient.pastVisits.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {patient.pastVisits.length} past visits
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`⚠️ Permanently delete patient '${patient.name}' (ID: ${patient.id}) from database registers?`)) {
                          deletePatient(patient.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Permanently delete patient from DB"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
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
