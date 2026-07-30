import { useState, useEffect } from 'react';
import { Activity, Stethoscope, Zap, LogOut, UserCheck, BookOpen } from 'lucide-react';
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
        date: savedCasePaper.date || new Date().toISOString().split('T')[0],
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800 mb-4">
              <Stethoscope className="w-6 h-6 text-amber-700" />
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-1 font-serif">
              Re-Consultation Confirmation
            </h3>
            
            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              Patient <strong className="text-slate-900">{reconsultTarget.patient.name}</strong>'s consultation is already marked as <span className="text-emerald-700 font-bold">Completed</span> for today. Do you want to re-consult or update their clinical casepaper?
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReconsultTarget(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-300"
              >
                Cancel
              </button>
              
              <button
                type="button"
                onClick={handleConfirmReconsult}
                className="px-5 py-2 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-white text-xs font-bold rounded-xl shadow-md transition-all"
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
          onPrintPreview={() => setView('print')}
          onBack={() => setView('queue')}
        />
      )}
      
      {view === 'print' && selectedPatient && casePaper && (
        <PrintPreview 
          patient={selectedPatient}
          casePaper={casePaper}
          onBack={() => setView('form')}
        />
      )}
    </div>
  );
}

function MainApp() {
  const { user, token, logout, toast, setToast } = useClinic();
  const [tab, setTab] = useState<TabState>('doctor');

  useEffect(() => {
    if (user?.role === 'receptionist') {
      setTab('receptionist');
    } else if (user?.role === 'doctor' || user?.role === 'admin') {
      setTab('doctor');
    }
  }, [user]);

  if (!user || !token) {
    return <LoginView onSuccess={() => {}} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f2eee3] to-[#e8e2d2] text-[#1a1c1a] font-sans antialiased">
      
      {/* Frosted Glass Header Bar */}
      <header className="app-header bg-white/80 backdrop-blur-md border-b border-[#e4e2e1] shadow-sm sticky top-0 z-40 no-print">
        <div className="w-full px-6 sm:px-10 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Mark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-[#1a1c1a] flex items-center justify-center text-[#faf9f6] shadow-sm">
              <Activity className="w-5 h-5 text-[#faf9f6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#1a1c1a] tracking-tight leading-none">ClinicOS</h1>
                <span className="bg-[#f2eee3] text-[#4b463e] text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#cdc6ba]">PRO EMR</span>
              </div>
              <div className="text-xs text-[#7c766d] font-medium mt-0.5">Shinagare Skin & Cosmetic Clinic</div>
            </div>
          </div>

          {/* Role-Based Nav Tabs Switcher */}
          {(user.role === 'doctor' || user.role === 'admin') && (
            <div className="flex items-center gap-1 bg-[#f2eee3]/80 p-1 rounded-xl border border-[#e4e2e1]">
              <button
                onClick={() => setTab('doctor')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  tab === 'doctor'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <Stethoscope className="w-3.5 h-3.5" />
                <span>Doctor Workspace</span>
              </button>

              <button
                onClick={() => setTab('register')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  tab === 'register'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Daily OPD Register</span>
              </button>

              <button
                onClick={() => setTab('templates')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  tab === 'templates'
                    ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md shadow-emerald-950/20'
                    : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${tab === 'templates' ? 'text-amber-300 fill-amber-300' : 'text-amber-600 fill-amber-600'}`} />
                <span>Template Builder</span>
              </button>
            </div>
          )}

          {/* User Session Badge & Logout */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 bg-[#f2eee3] px-3 py-1 rounded-xl border border-[#cdc6ba] text-xs">
              <UserCheck className="w-4 h-4 text-[#047857]" />
              <div className="text-left hidden sm:block">
                <div className="font-bold text-[#1a1c1a] leading-none">{user.name}</div>
                <div className="text-[9px] uppercase font-extrabold text-[#7c766d] mt-0.5">
                  {user.role === 'doctor' ? '👨‍⚕️ Consultant' : '📋 Receptionist'}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-[#7c766d] hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full px-6 sm:px-10 py-8">
        {tab === 'receptionist' && <ReceptionistDashboard />}
        {tab === 'doctor' && (user.role === 'doctor' || user.role === 'admin') && <DoctorDashboardView />}
        {tab === 'register' && <DailyPatientRegister />}
        {tab === 'templates' && (user.role === 'doctor' || user.role === 'admin') && (
          <TemplateDashboard onUseTemplateInEMR={() => setTab('doctor')} />
        )}
      </main>

      {/* Global Executive Toast Notification */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
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
