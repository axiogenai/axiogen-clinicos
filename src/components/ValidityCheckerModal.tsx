import { useState, useMemo } from 'react';
import { X, Search, CheckCircle2, AlertCircle, Clock, RefreshCw, ShieldCheck, User, Phone, MapPin, BookOpen, Smartphone } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';

interface Props {
  onClose: () => void;
}

function ValidityBadge({ validity }: { validity?: string }) {
  if (!validity) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
        <AlertCircle className="w-3.5 h-3.5 text-stone-500 shrink-0" />
        <span>No validity record</span>
      </span>
    );
  }
  const expiry = new Date(validity);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((expiry.getTime() - today.getTime()) / 86400000);
  const fmt = expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
        <span>Expired on {fmt}</span>
      </span>
    );
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Expiring in {daysLeft} day{daysLeft !== 1 ? 's' : ''} ({fmt})</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
      <span>Valid till {fmt}</span>
    </span>
  );
}

export default function ValidityCheckerModal({ onClose }: Props) {
  const { patients, refreshPatients } = useClinic();
  const [query, setQuery] = useState('');
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    
    // Search across casePaperNo, name, phone, village
    return patients.filter(p => 
      (p.casePaperNo && p.casePaperNo.toLowerCase().includes(q)) ||
      (p.name && p.name.toLowerCase().includes(q)) ||
      (p.phone && p.phone.includes(q)) ||
      (p.village && p.village.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    ).slice(0, 25);
  }, [patients, query]);

  const handleRenew = async (patientId: string) => {
    setRenewingId(patientId);
    try {
      await api.renewPatient(patientId, 2);
      if (typeof refreshPatients === 'function') {
        await refreshPatients();
      }
    } catch (e) {
      console.error('Renew failed', e);
    } finally {
      setRenewingId(null);
    }
  };

  const getStatusType = (validity?: string) => {
    if (!validity) return 'none';
    const daysLeft = Math.ceil((new Date(validity).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
    if (daysLeft < 0) return 'expired';
    if (daysLeft <= 7) return 'expiring';
    return 'valid';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-[#faf9f6] rounded-2xl shadow-2xl border border-[#e4e2e1] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e4e2e1] bg-[#f8f6f0] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5 text-[#047857]" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1a1c1a]">Patient Validity Checker</h2>
              <p className="text-[11px] text-[#7c766d]">Search by phone number, patient name, or village</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-[#f2eee3] text-[#7c766d] hover:text-[#1a1c1a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-[#e4e2e1] bg-white shrink-0">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c766d]" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter name, 10-digit mobile number, or village..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-[#e4e2e1] bg-[#faf9f6] text-sm text-[#1a1c1a] placeholder-[#7c766d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#047857]/20 focus:border-[#047857] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7c766d] hover:text-[#1a1c1a] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#e4e2e1]">
          {query.trim().length < 2 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                <Search className="w-5 h-5 text-[#7c766d]" />
              </div>
              <div>
                <p className="text-[#1a1c1a] font-bold text-sm">Search for a Patient</p>
                <p className="text-[#7c766d] text-xs mt-1">Type at least 2 characters to check registration validity status</p>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 gap-3 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#f2eee3] border border-[#e4e2e1] flex items-center justify-center">
                <User className="w-5 h-5 text-[#7c766d]" />
              </div>
              <div>
                <p className="text-[#1a1c1a] font-bold text-sm">No Matching Patients Found</p>
                <p className="text-[#7c766d] text-xs mt-1">Try searching with a different name, phone number, or village</p>
              </div>
            </div>
          ) : (
            results.map(p => {
              const status = getStatusType(p.validity);
              const isRenewing = renewingId === p.id;
              return (
                <div
                  key={p.id}
                  className={`px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    status === 'expired' ? 'bg-red-50/25 hover:bg-red-50/40' :
                    status === 'expiring' ? 'bg-amber-50/25 hover:bg-amber-50/40' : 'hover:bg-[#f8f6f0]'
                  }`}
                >
                  {/* Patient Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1a1c1a] text-sm truncate">{p.name}</span>
                      <span className="text-[11px] text-[#7c766d] font-medium shrink-0">
                        {p.age}y · {p.gender === 'M' ? 'Male' : 'Female'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#7c766d] mb-2">
                      {p.casePaperNo ? (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#fef3c7] text-[#92400e] border border-[#fde68a]">
                          <BookOpen className="w-3 h-3 text-[#b45309]" />
                          <span>Case No: {p.casePaperNo}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0]">
                          <Smartphone className="w-3 h-3 text-[#047857]" />
                          <span>Mobile: {p.phone || 'N/A'}</span>
                        </span>
                      )}
                      {p.casePaperNo && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-[#047857] shrink-0" />
                          <span>{p.phone || 'N/A'}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#7c766d] shrink-0" />
                        <span>{p.village || 'N/A'}</span>
                      </span>
                    </div>
                    <ValidityBadge validity={p.validity} />
                  </div>

                  {/* Renew Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isRenewing}
                      onClick={() => handleRenew(p.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3.5 rounded-xl border transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === 'expired'
                          ? 'bg-red-600 text-white border-red-600 hover:bg-red-700 shadow-red-600/10'
                          : status === 'expiring'
                          ? 'bg-amber-600 text-white border-amber-600 hover:bg-amber-700 shadow-amber-600/10'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                      }`}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRenewing ? 'animate-spin' : ''}`} />
                      <span>{isRenewing ? 'Renewing…' : status === 'expired' ? 'Renew (+2 Mo)' : 'Extend (+2 Mo)'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="px-6 py-3 border-t border-[#e4e2e1] bg-[#f8f6f0] shrink-0 flex items-center justify-between">
            <p className="text-[11px] text-[#7c766d]">
              Showing {results.length} matching patient{results.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[11px] text-[#047857] font-medium">
              Default renewal: +2 months
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
