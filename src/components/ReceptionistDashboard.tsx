import { useState } from 'react';
import { UserPlus, ArrowLeft, BookOpen, ListOrdered, Users } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import QueueStatistics from './QueueStatistics';
import QueueList from './QueueList';
import PatientSearch from './PatientSearch';
import PatientRegistrationForm from './PatientRegistrationForm';
import PatientDetailsModal from './PatientDetailsModal';
import DailyPatientRegister from './DailyPatientRegister';
import type { Patient, QueueItem } from '../data/patients';

export default function ReceptionistDashboard() {
  const { patients, queue, setToast, updateQueueStatus, removeFromQueue, registerAndEnqueue } = useClinic();
  
  const [view, setView] = useState<'queue' | 'register' | 'opd-register'>('queue');
  const [selectedPatientForForm, setSelectedPatientForForm] = useState<Patient | null>(null);
  const [activeModalQueueItem, setActiveModalQueueItem] = useState<QueueItem | null>(null);

  const handleSelectPatientFromSearch = (patient: Patient) => {
    setSelectedPatientForForm(patient);
    setView('register');
  };

  const handleNewPatientClick = () => {
    setSelectedPatientForForm(null);
    setView('register');
  };

  const handleFormSubmit = (data: any) => {
    registerAndEnqueue(data, selectedPatientForForm || undefined);
    setView('queue');
    setSelectedPatientForForm(null);
  };

  const handleRemoveQueueItem = (queueId: string) => {
    const item = queue.find(q => q.queueId === queueId);
    if (window.confirm(`Remove ${item?.name || 'this patient'} from today's queue?`)) {
      removeFromQueue(queueId);
      setToast({ type: 'info', message: 'Patient removed from queue.' });
    }
  };

  const handleStatusChange = (queueId: string, newStatus: QueueItem['status']) => {
    updateQueueStatus(queueId, newStatus);
    const item = queue.find(q => q.queueId === queueId);
    setToast({
      type: 'success',
      message: `${item?.name || 'Patient'} marked as ${newStatus.replace('-', ' ')}.`,
    });
  };

  const modalPatient = activeModalQueueItem 
    ? patients.find(p => p.id === activeModalQueueItem.patientId)
    : undefined;

  return (
    <div className="space-y-5">

      {/* ── Top Header ── */}
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e4e2e1] bg-[#f8f6f0] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center">
              <Users className="w-4.5 h-4.5 text-[#047857]" />
            </div>
            <div>
              <h2 className="text-base font-serif font-bold text-[#1a1c1a]">Reception Desk</h2>
              <p className="text-[11px] text-[#7c766d] mt-0.5">
                Check-in patients · Manage live queue · Daily OPD Register
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {view !== 'opd-register' ? (
              <button
                onClick={() => setView('opd-register')}
                className="btn-secondary text-xs"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>OPD Register</span>
              </button>
            ) : (
              <button
                onClick={() => setView('queue')}
                className="btn-secondary text-xs"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Live Queue</span>
              </button>
            )}

            {view === 'queue' ? (
              <button
                onClick={handleNewPatientClick}
                className="btn-primary text-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Patient to Queue</span>
              </button>
            ) : view === 'register' ? (
              <button
                onClick={() => { setView('queue'); setSelectedPatientForForm(null); }}
                className="btn-secondary text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Queue</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Statistics — only visible in queue/register views */}
        {view !== 'opd-register' && (
          <div className="px-6 py-4">
            <QueueStatistics queue={queue} />
          </div>
        )}
      </div>

      {/* ── Main View Area ── */}
      {view === 'opd-register' ? (
        <DailyPatientRegister />
      ) : (
        <>
          {view === 'queue' ? (
            <QueueList 
              queue={queue} 
              patients={patients}
              onStatusChange={handleStatusChange}
              onRemove={handleRemoveQueueItem}
              onViewDetails={(item) => setActiveModalQueueItem(item)}
            />
          ) : (
            <div className="space-y-5">
              <div className="section-card">
                <PatientSearch 
                  patients={patients}
                  onSelectPatient={handleSelectPatientFromSearch}
                  onNewPatient={handleNewPatientClick}
                />
              </div>

              <PatientRegistrationForm 
                selectedPatient={selectedPatientForForm}
                onSubmit={handleFormSubmit}
                onCancel={() => { setView('queue'); setSelectedPatientForForm(null); }}
                onClearSelected={() => setSelectedPatientForForm(null)}
                onSelectExistingPatient={(patient) => setSelectedPatientForForm(patient)}
              />
            </div>
          )}
        </>
      )}

      {/* Patient Details Modal */}
      {activeModalQueueItem && (
        <PatientDetailsModal 
          queueItem={activeModalQueueItem}
          patient={modalPatient}
          onClose={() => setActiveModalQueueItem(null)}
        />
      )}
    </div>
  );
}
