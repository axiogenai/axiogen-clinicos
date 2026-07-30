import { useState } from 'react';
import { UserPlus, ArrowLeft, BookOpen, ListOrdered } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#faf9f6] p-5 rounded-xl border border-[#e4e2e1] shadow-sm">
        <div>
          <h2 className="text-xl font-bold font-serif text-[#1a1c1a]">Reception Desk & OPD Register</h2>
          <p className="text-xs text-[#7c766d]">
            Check-in patients, manage live queue, and maintain official Daily Patient Register logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {view !== 'opd-register' ? (
            <button
              onClick={() => setView('opd-register')}
              className="px-4 py-2.5 bg-[#f2eee3] text-[#4b463e] border border-[#cdc6ba] hover:bg-[#e8e2d2] rounded-lg font-bold text-xs shadow-sm transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4 text-[#4b463e]" />
              <span>View Daily OPD Register</span>
            </button>
          ) : (
            <button
              onClick={() => setView('queue')}
              className="px-4 py-2.5 bg-[#f2eee3] text-[#4b463e] border border-[#cdc6ba] hover:bg-[#e8e2d2] rounded-lg font-bold text-xs transition-all flex items-center gap-2"
            >
              <ListOrdered className="w-4 h-4 text-[#4b463e]" />
              <span>Back to Live Queue</span>
            </button>
          )}

          {view === 'queue' ? (
            <button
              onClick={handleNewPatientClick}
              className="px-5 py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] text-white hover:opacity-90 rounded-lg font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Patient to Queue</span>
            </button>
          ) : view === 'register' ? (
            <button
              onClick={() => { setView('queue'); setSelectedPatientForForm(null); }}
              className="px-4 py-2 bg-[#f2eee3] text-[#4b463e] border border-[#cdc6ba] hover:bg-[#e8e2d2] rounded-lg font-medium text-xs transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Queue</span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Main View Area */}
      {view === 'opd-register' ? (
        <DailyPatientRegister />
      ) : (
        <>
          {/* Queue Statistics KPI Row */}
          <QueueStatistics queue={queue} />

          {view === 'queue' ? (
            <QueueList 
              queue={queue} 
              patients={patients}
              onStatusChange={handleStatusChange}
              onRemove={handleRemoveQueueItem}
              onViewDetails={(item) => setActiveModalQueueItem(item)}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-[#faf9f6] p-5 rounded-xl border border-[#e4e2e1] shadow-sm">
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
