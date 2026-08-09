import { useState, useEffect } from 'react';
import { Stethoscope, Zap, LogOut, BookOpen } from 'lucide-react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import type { Patient, QueueItem } from './data/patients';
import type { CasePaper } from './types';
import QueueView from './components/QueueView';
import CasepaperForm from './components/CasepaperForm';

import PrintPreview from './components/PrintPreview';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import TemplateDashboard from './components/TemplateDashboard';
import DailyPatientRegister from './components/DailyPatientRegister';
import { api } from './api/client';
import LoginView from './components/LoginView';
import Toast from './components/Toast';
import WhatsAppGatewayModal from './components/WhatsAppGatewayModal';
import DoctorPasscodeModal from './components/DoctorPasscodeModal';

import logoImg from './assets/logo-symbol.png';

type TabState = 'receptionist' | 'doctor' | 'templates' | 'register';
type DoctorViewState = 'queue' | 'form' | 'print';

function DoctorDashboardView() {
  const { patients, queue, updateQueueStatus } = useClinic();
  const [view, setView] = useState<DoctorViewState>('queue');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
  const [casePaper, setCasePaper] = useState<CasePaper | null>(null);
  const [reconsultTarget, setReconsultTarget] = useState<{ queueItem: QueueItem; patient: Patient } | null>(null);

  const startConsultation = async (queueItem: QueueItem, patient: Patient, forceReconsult = false) => {
    setSelectedPatient(patient);
    setSelectedQueueId(queueItem.queueId);

    // Only set status to in-consultation if not completed, or if forceReconsult requested
    if (queueItem.status !== 'completed' || forceReconsult) {
      updateQueueStatus(queueItem.queueId, 'in-consultation');
    }

    // Check for saved case paper in backend DB or localStorage
    let savedCasePaper: CasePaper | null = null;
    try {
      const cached = localStorage.getItem(`clinicos_saved_casepaper_${patient.id}`);
      if (cached) {
        savedCasePaper = JSON.parse(cached);
      }
    } catch {}

    if (!savedCasePaper) {
      try {
        const savedList = await api.getCasePapers(patient.id);
        if (savedList && savedList.length > 0) {
          const latest = savedList[0];
          savedCasePaper = {
            patientId: patient.id,
            date: latest.date || new Date().toISOString().split('T')[0],
            templateId: latest.templateId || '',
            complaint: latest.complaint || queueItem.complaint,
            pastHistory: latest.pastHistory || patient.pastHistory || '',
            allergies: latest.allergies || patient.allergies || '',
            medicines: latest.medicines || [],
            investigationsAdvised: latest.investigationsAdvised || [],
            counsellingDone: latest.counsellingDone || [],
            followUpDate: latest.followUpDate || '',
          };
        }
      } catch {}
    }

    if (savedCasePaper) {
      setCasePaper({
        patientId: patient.id,
        date: new Date().toISOString().split('T')[0],
        templateId: savedCasePaper.templateId || '',
        complaint: savedCasePaper.complaint || queueItem.complaint,
        pastHistory: savedCasePaper.pastHistory || patient.pastHistory || '',
        allergies: savedCasePaper.allergies || patient.allergies || '',
        medicines: savedCasePaper.medicines || [],
        investigationsAdvised: savedCasePaper.investigationsAdvised || [],
        counsellingDone: savedCasePaper.counsellingDone || [],
        followUpDate: savedCasePaper.followUpDate || '',
      });
    } else {
      const date = new Date();
      const followUpDate = new Date();
      followUpDate.setDate(date.getDate() + 7);

      setCasePaper({
        patientId: patient.id,
        date: date.toISOString().split('T')[0],
        templateId: '',
        complaint: queueItem.complaint,
        pastHistory: patient.pastHistory || '',
        allergies: patient.allergies || '',
        medicines: [],
        investigationsAdvised: [],
        counsellingDone: [],
        followUpDate: followUpDate.toISOString().split('T')[0],
      });
    }

    setView('form');
  };

  const handleSelectPatient = (queueItem: QueueItem, patient: Patient) => {
    if (queueItem.status === 'completed') {
      setReconsultTarget({ queueItem, patient });
    } else {
      startConsultation(queueItem, patient);
    }
  };

  const handleConfirmReconsult = () => {
    if (reconsultTarget) {
      startConsultation(reconsultTarget.queueItem, reconsultTarget.patient, true);
      setReconsultTarget(null);
    }
  };

  const handleUpdateCasePaper = (cp: CasePaper) => {
    setCasePaper(cp);
  };

  return (
    <div>
      {view === 'queue' && (
        <QueueView 
          queue={queue} 
          patients={patients} 
          onSelectPatient={handleSelectPatient} 
        />
      )}

      {/* Re-Consultation Confirmation Modal */}
      {reconsultTarget && (
        <div className="fixed inset-0 z-50 bg-[#1a1c1a]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e4e2e1]">
            <div className="w-11 h-11 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center mb-4">
              <Stethoscope className="w-5 h-5 text-[#b45309]" />
            </div>
            
            <h3 className="text-base font-serif font-bold text-[#1a1c1a] mb-1">
              Re-Consultation
            </h3>
            
            <p className="text-xs text-[#7c766d] leading-relaxed mb-5">
              <strong className="text-[#1a1c1a]">{reconsultTarget.patient.name}</strong>'s consultation is already marked as{' '}
              <span className="text-[#166534] font-bold">Completed</span> for today. Re-open their clinical casepaper?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setReconsultTarget(null)}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmReconsult}
                className="btn-primary text-xs"
              >
                Re-Consult Patient
              </button>
            </div>
          </div>
        </div>
      )}
      
      {view === 'form' && selectedPatient && casePaper && (
        <CasepaperForm 
          patient={selectedPatient}
          queueId={selectedQueueId}
          casePaper={casePaper}
          onUpdateCasePaper={handleUpdateCasePaper}
          onBack={() => setView('queue')}
        />
      )}
      
      {view === 'print' && selectedPatient && casePaper && (
        <PrintPreview
          patient={selectedPatient}
          casePaper={casePaper}
          onBack={() => setView('form')}
          onReturnToQueue={() => {
            setView('queue');
            setSelectedPatient(null);
            setSelectedQueueId(null);
            setCasePaper(null);
          }}
        />
      )}

    </div>
  );
}

function MainApp() {
  const { user, token, logout, toast, setToast } = useClinic();
  const [tab, setTab] = useState<TabState>('doctor');
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('clinicos_doctor_passcode_unlocked') === 'true';
  });

  useEffect(() => {
    if (user?.role === 'receptionist') {
      setTab('receptionist');
    } else if (user?.role === 'doctor' || user?.role === 'admin') {
      setTab('doctor');
    }

    if (sessionStorage.getItem('clinicos_doctor_passcode_unlocked') === 'true') {
      setIsPasscodeUnlocked(true);
    }
  }, [user]);

  if (!user || !token) {
    return <LoginView onSuccess={() => {}} />;
  }

  const isDoctor = user.role === 'doctor' || user.role === 'admin';

  const handlePasscodeUnlock = () => {
    setIsPasscodeUnlocked(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('clinicos_doctor_passcode_unlocked');
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#faf9f6] via-[#f8f6f2] to-[#f4f2eb] text-[#1a1c1a] font-sans antialiased">

      {/* ── Doctor Passcode Lock Screen (Session Protected) ── */}
      {isDoctor && !isPasscodeUnlocked && (
        <DoctorPasscodeModal
          onUnlock={handlePasscodeUnlock}
          onLogout={handleLogout}
        />
      )}

      {/* ── WhatsApp Gateway Modal ── */}
      <WhatsAppGatewayModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />
      
      {/* ── Frosted Glass Header ── */}
      <header className="app-header bg-white/90 backdrop-blur-md border-b border-[#e4e2e1] shadow-sm sticky top-0 z-40 no-print">
        <div className="w-full px-4 sm:px-8 min-h-[60px] py-2 sm:py-0 flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-4">
          
          <div className="w-full sm:w-auto flex items-center justify-between gap-3">
            {/* Brand Mark */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img
                src={logoImg}
                alt="Shinagare Skin & Cosmetic Clinic Logo"
                className="h-9 w-auto object-contain shrink-0 drop-shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base sm:text-[17px] font-serif font-bold text-[#1a1c1a] tracking-tight leading-none">ClinicOS</span>
                  <span className="bg-[#f2eee3] text-[#4b463e] text-[9px] font-black px-1.5 py-0.5 rounded border border-[#cdc6ba] tracking-wide">PRO EMR</span>
                </div>
                <div className="text-[10px] text-[#7c766d] font-medium mt-0.5 leading-none">Shinagare Skin & Cosmetic Clinic</div>
              </div>
            </div>

            {/* Mobile User Badge + Logout */}
            <div className="flex sm:hidden items-center gap-2 shrink-0">
              {isDoctor && (
                <button
                  onClick={() => setIsWhatsAppModalOpen(true)}
                  title="WhatsApp Gateway"
                  className="px-2 py-1 text-xs font-bold bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <span>📱 WA</span>
                </button>
              )}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs ${isDoctor ? 'bg-[#ecfdf5] border-[#a7f3d0]' : 'bg-[#f0f9ff] border-[#bae6fd]'}`}>
                <span className={`font-bold text-[11px] ${isDoctor ? 'text-[#064e3b]' : 'text-[#1d4ed8]'}`}>{user.name.split(' ')[0]}</span>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-[#7c766d] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Role-Based Nav Tabs */}
          {isDoctor && (
            <nav className="w-full sm:w-auto flex items-center justify-center gap-1 bg-[#f2eee3]/80 p-1 rounded-xl border border-[#e4e2e1] no-scrollbar">
              <button
                onClick={() => setTab('doctor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial whitespace-nowrap ${
                  tab === 'doctor'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Workspace</span>
              </button>

              <button
                onClick={() => setTab('register')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial whitespace-nowrap ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Register</span>
              </button>

              <button
                onClick={() => setTab('templates')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial whitespace-nowrap ${
                  tab === 'templates'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${tab === 'templates' ? 'text-amber-300 fill-amber-300' : 'text-amber-600 fill-amber-500'}`} />
                <span>Templates</span>
              </button>
            </nav>
          )}

          {/* Desktop User Badge + WhatsApp QR + Logout */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            {isDoctor && (
              <button
                onClick={() => setIsWhatsAppModalOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] hover:bg-[#d1fae5] shadow-sm cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                <span>WhatsApp QR</span>
              </button>
            )}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs ${isDoctor ? 'bg-[#ecfdf5] border-[#a7f3d0]' : 'bg-[#f0f9ff] border-[#bae6fd]'}`}>
              <div>
                <div className={`font-bold text-xs ${isDoctor ? 'text-[#064e3b]' : 'text-[#1d4ed8]'}`}>{user.name}</div>
                <div className="text-[10px] text-[#7c766d] uppercase font-bold tracking-wider">{user.role === 'doctor' ? 'Consultant' : user.role === 'admin' ? 'Admin' : 'Receptionist'}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-[#7c766d] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="w-full px-3 sm:px-5 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
        {tab === 'receptionist' && <ReceptionistDashboard />}
        {tab === 'doctor' && isDoctor && <DoctorDashboardView />}
        {tab === 'register' && <DailyPatientRegister />}
        {tab === 'templates' && isDoctor && (
          <TemplateDashboard onUseTemplateInEMR={() => setTab('doctor')} />
        )}
      </main>

      {/* Global Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── Footer ── */}
      <footer className="w-full mt-auto border-t border-[#e4e2e1] bg-[#faf9f6]">
        <div className="px-3 sm:px-5 lg:px-8 py-3 flex items-center justify-center gap-1.5">
          <span className="text-[11px] text-[#9c9590]">Made by</span>
          <a
            href="https://team.axiogen.in"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-[#047857] hover:text-[#065f46] hover:underline transition-colors"
          >
            team.axiogen.in
          </a>
          <span className="text-[11px] text-[#9c9590]">· © {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <ClinicProvider>
      <MainApp />
    </ClinicProvider>
  );
}
