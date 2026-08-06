import { useState, useEffect } from 'react';
import { X, Calendar, Pill, FileText, Clock, Copy, Check } from 'lucide-react';
import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';
import { api } from '../api/client';

interface Props {
  patient: Patient;
  onClose: () => void;
  onLoadPrescription?: (pastCasePaper: CasePaper) => void;
}

export default function PatientEMRHistoryModal({ patient, onClose, onLoadPrescription }: Props) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
        const records = await api.getCasePapers(patient.id);
        if (records && Array.isArray(records)) {
          setHistory(records);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error('Failed to load patient history:', err);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [patient.id]);

  const handleCopy = (paper: any) => {
    if (onLoadPrescription) {
      onLoadPrescription(paper);
      setCopiedId(paper.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1c1a]/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-[#e4e2e1] animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="bg-[#047857] text-white p-4 sm:p-5 flex justify-between items-start shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-200" />
              <h3 className="text-lg font-serif font-bold text-white">{patient.name}</h3>
            </div>
            <p className="text-xs text-emerald-100 mt-1">
              {patient.age} Yrs / {patient.gender === 'M' ? 'Male' : 'Female'} · {patient.phone} · {patient.village || 'N/A'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-[#faf9f6]">
          
          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-[#e4e2e1]">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#7c766d] font-bold block">Patient Permanent ID</span>
              <span className="text-xs font-mono font-bold text-[#1a1c1a]">{patient.id}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-[#7c766d] font-bold block">Total Past Visits</span>
              <span className="text-xs font-bold text-[#047857] bg-[#ecfdf5] px-2.5 py-0.5 rounded-full border border-[#a7f3d0]">
                {history.length} Visits Recorded
              </span>
            </div>
          </div>

          {patient.allergies && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-800 font-semibold">
              ⚠️ Allergies: {patient.allergies}
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-[#7c766d] text-sm animate-pulse flex flex-col items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-[#047857] animate-spin" />
              <span>Fetching complete EMR visit history from database...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-[#7c766d] text-sm bg-white rounded-xl border border-[#e4e2e1] p-6">
              <FileText className="w-8 h-8 text-[#cdc6ba] mx-auto mb-2" />
              <p className="font-bold text-[#1a1c1a]">No Previous Case Papers Found</p>
              <p className="text-xs mt-1 text-[#7c766d]">This is the patient's first recorded digital consultation.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => {
                const medicines = Array.isArray(item.medicines) 
                  ? item.medicines 
                  : (typeof item.medicines === 'string' ? JSON.parse(item.medicines || '[]') : []);

                const investigations = Array.isArray(item.investigationsAdvised) 
                  ? item.investigationsAdvised 
                  : (typeof item.investigationsAdvised === 'string' ? JSON.parse(item.investigationsAdvised || '[]') : []);

                return (
                  <div key={item.id || index} className="bg-white rounded-xl border border-[#e4e2e1] p-4 shadow-sm space-y-3 hover:border-[#a7f3d0] transition-colors">
                    
                    {/* Visit Header */}
                    <div className="flex justify-between items-center pb-2 border-b border-[#f2eee3]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#047857]" />
                        <span className="font-serif font-bold text-[#1a1c1a] text-sm">
                          Visit on {item.date || 'N/A'}
                        </span>
                        {index === 0 && (
                          <span className="bg-[#ecfdf5] text-[#047857] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#a7f3d0]">
                            Most Recent Visit
                          </span>
                        )}
                      </div>

                      {onLoadPrescription && (
                        <button
                          type="button"
                          onClick={() => handleCopy(item)}
                          className="btn-secondary text-xs py-1 px-2.5 flex items-center gap-1.5"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-bold">Loaded into Today!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#047857]" />
                              <span>Use as Today's Base</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Complaint & Past History */}
                    {item.complaint && (
                      <div className="text-xs">
                        <span className="font-bold text-[#7c766d]">Chief Complaint: </span>
                        <span className="text-[#1a1c1a] font-medium">{item.complaint}</span>
                      </div>
                    )}

                    {/* Prescribed Medicines */}
                    {medicines.length > 0 && (
                      <div className="space-y-1.5 bg-[#f8f6f0] p-3 rounded-lg border border-[#e4e2e1]">
                        <div className="text-[10px] uppercase font-bold text-[#7c766d] tracking-wider flex items-center gap-1">
                          <Pill className="w-3 h-3 text-[#047857]" />
                          Prescribed Medicines ({medicines.length}):
                        </div>
                        <div className="divide-y divide-[#e4e2e1]">
                          {medicines.map((m: any, idx: number) => (
                            <div key={idx} className="py-1 text-xs flex justify-between items-center">
                              <span className="font-semibold text-[#1a1c1a]">
                                {m.name || m.medicineName || 'Medicine'} {m.dosage ? `(${m.dosage})` : ''}
                              </span>
                              <span className="text-[11px] text-[#4b463e] bg-white px-2 py-0.5 rounded border border-[#e4e2e1]">
                                {m.frequency || '1-0-1'} · {m.duration || '7 Days'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Investigations */}
                    {investigations.length > 0 && (
                      <div className="text-xs text-[#4b463e]">
                        <span className="font-bold text-[#7c766d]">Advised Tests: </span>
                        <span>{investigations.join(', ')}</span>
                      </div>
                    )}

                    {/* Follow Up */}
                    {item.followUpDate && (
                      <div className="text-[11px] text-[#047857] font-semibold text-right">
                        Follow-up scheduled: {item.followUpDate}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-white p-4 border-t border-[#e4e2e1] flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-5"
          >
            Close EMR History
          </button>
        </div>

      </div>
    </div>
  );
}
