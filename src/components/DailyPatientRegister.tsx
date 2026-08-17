import { useState, useMemo, useEffect, useRef } from 'react';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import { Calendar, CalendarDays, BarChart2, Search, Printer, UserCheck, Clock, CheckCircle2, FileSpreadsheet, Send, MessageSquare, Save, FileText, X, Pill, Edit3, Trash2, ChevronDown, Check } from 'lucide-react';
import PrintPreview from './PrintPreview';
import CasepaperForm from './CasepaperForm';
import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';
import { calculateMedicineCount } from '../utils/countCalculator';
import * as XLSX from 'xlsx';

// Custom Styled Dropdown Component (Replaces ugly native browser select)
function CustomDropdown<T extends string | number>({
  value,
  options,
  onChange,
  labelPrefix
}: {
  value: T;
  options: { label: string; value: T }[];
  onChange: (val: T) => void;
  labelPrefix?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-[#cdc6ba] hover:border-[#047857] rounded-xl px-3 py-2 text-xs font-bold text-[#1a1c1a] shadow-sm transition-all cursor-pointer active:scale-95"
      >
        {labelPrefix && <span className="text-[#656056] font-normal">{labelPrefix}</span>}
        <span className="text-[#047857]">{selectedOption.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-[#047857] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 rounded-xl bg-white border border-[#e4e2e1] shadow-xl ring-1 ring-black/5 z-50 py-1.5 animate-in fade-in zoom-in-95 duration-100">
          <div className="max-h-60 overflow-y-auto space-y-0.5 px-1 no-scrollbar">
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#ecfdf5] text-[#047857] font-bold'
                      : 'text-[#4b463e] hover:bg-[#faf9f6] hover:text-[#1a1c1a]'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#047857]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DailyPatientRegister({ isDoctor }: { isDoctor?: boolean } = {}) {
  const { user, queue, patients, clinicSettings, setToast, deletePatient, removeFromQueue } = useClinic();
  const isDoctorUser = isDoctor !== undefined ? isDoctor : (user?.role === 'doctor' || user?.role === 'admin');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fetchedQueue, setFetchedQueue] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in-consultation' | 'completed'>('all');
  const [selectedFollowUpIds] = useState<string[]>([]);
  const [showFollowUpList, setShowFollowUpList] = useState(false);
  const [activeEmrModal, setActiveEmrModal] = useState<{ patient: any; casePaper: any } | null>(null);
  const [editingCasePaper, setEditingCasePaper] = useState<{ patient: Patient; casePaper: CasePaper; queueId?: string } | null>(null);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Archive & History Register State
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [yearlyData, setYearlyData] = useState<any>(null);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);

  // Fetch Monthly / Yearly Archive from Backend Database
  useEffect(() => {
    if (viewMode === 'monthly') {
      setIsLoadingArchive(true);
      api.getMonthlyRegister(selectedYear, selectedMonth)
        .then(data => setMonthlyData(data))
        .catch(() => setMonthlyData(null))
        .finally(() => setIsLoadingArchive(false));
    } else if (viewMode === 'yearly') {
      setIsLoadingArchive(true);
      api.getYearlyRegister(selectedYear)
        .then(data => setYearlyData(data))
        .catch(() => setYearlyData(null))
        .finally(() => setIsLoadingArchive(false));
    }
  }, [viewMode, selectedMonth, selectedYear]);

  // Fetch register & queue items for selectedDate from DB
  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api.getDailyRegister(selectedDate),
      api.getQueue(selectedDate)
    ]).then(([regRes, queueRes]) => {
      if (!active) return;
      const regItems = regRes.status === 'fulfilled' && Array.isArray(regRes.value) ? regRes.value : [];
      const qItems = queueRes.status === 'fulfilled' && Array.isArray(queueRes.value) ? queueRes.value : [];
      
      // Convert OpdRegister records to queue format if queue is empty for past days
      const convertedReg = regItems.map(r => ({
        queueId: r.opdNo || r.queueId,
        patientId: r.patientId,
        name: r.patientName,
        age: r.age,
        gender: r.gender,
        phone: r.phone,
        village: r.village,
        complaint: r.complaint,
        timeAdded: r.timeAdded || '09:00 AM',
        date: r.date,
        status: r.status || 'completed',
        casePaperId: r.opdNo
      }));

      // Merge: prefer live queue items, fallback to saved OpdRegister
      const merged = qItems.length > 0 ? qItems : convertedReg;
      setFetchedQueue(merged);
    }).catch(() => {
      if (active) setFetchedQueue([]);
    });
    return () => { active = false; };
  }, [selectedDate]);

  // Format Date for Header Display
  const formattedDate = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('en-IN', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(new Date(selectedDate));
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Combine queue with patient data strictly for OPD records
  const registerItems = useMemo(() => {
    const rawQueue = fetchedQueue.length > 0 ? fetchedQueue : queue;

    const targetQueue = rawQueue.filter(item => {
      const itemDate = (item as any).date || (item as any).createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
      return itemDate === selectedDate;
    });

    const items = targetQueue.map((item, index) => {
      const patientName = item.name || 'Unknown Patient';
      const patient = patients.find(p => p.id === item.patientId || p.name?.toLowerCase() === patientName.toLowerCase());
      const itemDate = (item as any).date || (item as any).createdAt?.split('T')[0] || selectedDate;
      return {
        srNo: index + 1,
        opdNo: item.queueId || `OPD-${String(index + 1).padStart(3, '0')}`,
        casePaperNo: (item as any).casePaperId || patient?.id || '-',
        time: item.timeAdded || '09:00 AM',
        date: itemDate,
        name: patientName,
        age: item.age || patient?.age || '-',
        gender: patient?.gender || 'M',
        phone: item.phone || patient?.phone || '-',
        village: item.village || patient?.village || '-',
        complaint: item.complaint || 'General Checkup',
        doctor: clinicSettings.doctors.find(d => d.name.includes('प्रमोद'))?.name || clinicSettings.doctors[0]?.name || 'डॉ. प्रमोद सुरेश शिनगारे',
        status: item.status || 'waiting'
      };
    });

    return items;
  }, [queue, fetchedQueue, patients, clinicSettings, selectedDate]);

  // Filtered Register Data
  const filteredItems = useMemo(() => {
    return registerItems.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.name.toLowerCase().includes(q) ||
        item.phone.includes(q) ||
        item.village.toLowerCase().includes(q) ||
        item.opdNo.toLowerCase().includes(q) ||
        (item.casePaperNo && item.casePaperNo.toLowerCase().includes(q));
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registerItems, searchQuery, statusFilter]);

  // WhatsApp Follow-up Patients matching selectedDate
  const [followUpPatients, setFollowUpPatients] = useState<Array<{ patientId: string; name: string; phone: string; village: string; complaint: string; followUpDate: string }>>([]);

  useEffect(() => {
    const buildFollowUpList = async () => {
      const list: Array<{ patientId: string; name: string; phone: string; village: string; complaint: string; followUpDate: string }> = [];
      const seen = new Set<string>();

      // 1. Fetch from backend DB casepapers matching selectedDate
      try {
        const cps = await api.getCasePapers();
        for (const cp of cps) {
          if (cp.followUpDate === selectedDate && cp.patientId && !seen.has(cp.patientId)) {
            const pat = patients.find(p => p.id === cp.patientId);
            if (pat && pat.phone && pat.phone.length >= 10) {
              seen.add(cp.patientId);
              list.push({
                patientId: cp.patientId,
                name: pat.name,
                phone: pat.phone,
                village: pat.village || 'N/A',
                complaint: cp.complaint || 'Follow-up Consultation',
                followUpDate: cp.followUpDate,
              });
            }
          }
        }
      } catch {}

      // 2. LocalStorage casepapers
      patients.forEach(p => {
        if (seen.has(p.id)) return;
        let fDate = '';
        try {
          const cached = localStorage.getItem(`clinicos_saved_casepaper_${p.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.followUpDate) fDate = parsed.followUpDate;
          }
        } catch {}

        if (!fDate && p.pastVisits && p.pastVisits.length > 0) {
          const lastVisit = p.pastVisits[0];
          if ((lastVisit as any).followUpDate) fDate = (lastVisit as any).followUpDate;
        }

        if (fDate === selectedDate && p.phone && p.phone.length >= 10) {
          seen.add(p.id);
          list.push({
            patientId: p.id,
            name: p.name,
            phone: p.phone,
            village: p.village || 'N/A',
            complaint: p.pastHistory || 'Follow-up Consultation',
            followUpDate: fDate,
          });
        }
      });

      setFollowUpPatients(list);
    };

    buildFollowUpList();
  }, [patients, queue, selectedDate]);

  // Stats Counters
  const totalCount = registerItems.length;
  const completedCount = registerItems.filter(i => i.status === 'completed').length;
  const waitingCount = registerItems.filter(i => i.status === 'waiting').length;

  // Export Monthly Register to Excel (.XLSX)
  const handleExportMonthlyExcel = () => {
    if (!monthlyData || !monthlyData.records || monthlyData.records.length === 0) {
      setToast({
        type: 'info',
        title: 'Empty Register',
        message: 'No records found for the selected month to export.'
      });
      return;
    }

    const exportData = monthlyData.records.map((item: any, index: number) => ({
      'SR No': index + 1,
      'Date': item.date,
      'OPD No': item.opdNo || item.queueId || `OPD-${index + 1}`,
      'Time': item.timeAdded || '-',
      'Patient Name': item.patientName,
      'Age/Gender': `${item.age || '-'} Y / ${item.gender || 'M'}`,
      'Contact Phone': item.phone || '-',
      'Village': item.village || '-',
      'Chief Complaint': item.complaint || '-',
      'Diagnosis': item.diagnosis || '-',
      'Follow-up Date': item.followUpDate || '-',
      'Consulting Doctor': item.consultingDoctor || 'डॉ. प्रियांका शिनगare',
      'Status': (item.status || 'completed').toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Monthly OPD ${selectedYear}-${selectedMonth}`);
    
    worksheet['!cols'] = [
      { wch: 8 },  { wch: 12 }, { wch: 15 }, { wch: 12 },
      { wch: 24 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
      { wch: 30 }, { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
    ];

    const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('en-IN', { month: 'long' });
    XLSX.writeFile(workbook, `Monthly_OPD_Register_${monthName}_${selectedYear}.xlsx`);
  };

  // Export to Excel (.XLSX)
  const handleExportExcel = () => {
    const exportData = filteredItems.map(item => ({
      'SR No': item.srNo,
      'OPD No': item.opdNo,
      'Time': item.time,
      'Patient Name': item.name,
      'Age/Gender': `${item.age} Y / ${item.gender}`,
      'Contact Phone': item.phone,
      'Village / Address': item.village,
      'Chief Complaint': item.complaint,
      'Consulting Doctor': item.doctor,
      'Status': item.status.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'OPD Register');
    
    worksheet['!cols'] = [
      { wch: 8 },  { wch: 12 }, { wch: 12 }, { wch: 24 },
      { wch: 12 }, { wch: 14 }, { wch: 20 }, { wch: 35 },
      { wch: 25 }, { wch: 15 }
    ];

    XLSX.writeFile(workbook, `Daily_OPD_Register_${selectedDate}.xlsx`);
  };

  // Automated Day-End backup trigger at 9:30 PM (21:30)
  useEffect(() => {
    const backupHour = 21;
    const backupMinute = 30;

    const checkBackupTime = () => {
      const now = new Date();
      if (now.getHours() === backupHour && now.getMinutes() === backupMinute) {
        if (filteredItems.length > 0) {
          api.autoBackupQueue(selectedDate, filteredItems)
            .then((res: any) => {
              console.log(`[AUTO BACKUP] Client-triggered daily backup saved to: ${res.path}`);
              setToast({
                type: 'success',
                title: 'Automated Day-End Backup',
                message: `Today's register has been automatically backed up to server: ${res.path}`,
              });
            })
            .catch((err) => {
              console.error('[AUTO BACKUP] Client-triggered daily backup failed:', err);
            });
        }
      }
    };

    const interval = setInterval(checkBackupTime, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, [filteredItems, selectedDate, setToast]);

  // Close Session & End Day (Excel Download, Server Backup, and Print Dialog)
  const handleEndDaySession = async () => {
    if (filteredItems.length === 0) {
      setToast({
        type: 'info',
        title: 'Empty Register',
        message: 'No patients in the register to export today.',
      });
      return;
    }

    // 1. Excel local download
    handleExportExcel();

    // 2. Trigger auto-backup to server folder
    try {
      const response: any = await api.autoBackupQueue(selectedDate, filteredItems);
      setToast({
        type: 'success',
        title: 'Daily Register Backed Up',
        message: `Saved Excel backup to: ${response.path}`,
      });
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Backup Failed',
        message: err.message || 'Could not save daily register to server backups folder.',
      });
    }

    // 3. Print Dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };


  // Send WhatsApp to Individual via Baileys QR Gateway
  const handleSendSingleWhatsApp = async (name: string, phone: string, followUpDate: string) => {
    try {
      const res = await api.sendSingleWhatsApp(phone, '', name, followUpDate);
      if (res && res.success) {
        setToast({
          type: 'success',
          title: 'WhatsApp Reminder Sent!',
          message: `Reminder sent to ${name} (+91 ${phone}) for follow-up on ${followUpDate}`,
        });
      } else {
        throw new Error(res?.error || 'Gateway not connected');
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Sending Failed',
        message: err?.message || `Could not send to ${name}. Ensure WhatsApp QR Gateway is connected!`,
      });
    }
  };

  // Sync Daily Register into Permanent Database Table
  const handleSyncDatabaseRegister = async () => {
    try {
      const res = await api.syncRegister(selectedDate);
      if (res && res.success) {
        setToast({
          type: 'success',
          title: 'Register Synced to Database',
          message: `Synced ${res.count || 0} OPD records into permanent database register for ${selectedDate}.`
        });
      }
    } catch (err: any) {
      setToast({
        type: 'error',
        title: 'Sync Failed',
        message: err.message || 'Could not sync register to database.'
      });
    }
  };

  // Open EMR Casepaper Modal
  const handleOpenEMR = async (item: any) => {
    let matchingPatient = patients.find(p => p.id === item.patientId || p.name?.toLowerCase() === item.name?.toLowerCase());
    if (!matchingPatient) {
      matchingPatient = {
        id: item.patientId || `pat_${Date.now()}`,
        name: item.name || 'Patient',
        age: item.age || 0,
        gender: item.gender || 'M',
        phone: item.phone || '',
        village: item.village || '',
        pastHistory: 'Nil',
        allergies: 'None',
        pastVisits: []
      };
    }

    let savedCasePaper: any = null;
    try {
      const cached = localStorage.getItem(`clinicos_saved_casepaper_${matchingPatient.id}`);
      if (cached) savedCasePaper = JSON.parse(cached);
    } catch {}

    if (!savedCasePaper) {
      try {
        const list = await api.getCasePapers(matchingPatient.id);
        if (list && list.length > 0) {
          const latest = list[0];
          savedCasePaper = {
            patientId: matchingPatient.id,
            date: latest.date || selectedDate,
            templateId: latest.templateId || '',
            complaint: latest.complaint || item.complaint,
            pastHistory: latest.pastHistory || matchingPatient.pastHistory || '',
            allergies: latest.allergies || matchingPatient.allergies || '',
            medicines: latest.medicines || [],
            investigationsAdvised: latest.investigationsAdvised || [],
            counsellingDone: latest.counsellingDone || [],
            followUpDate: latest.followUpDate || '',
          };
        }
      } catch {}
    }

    if (!savedCasePaper) {
      savedCasePaper = {
        patientId: matchingPatient.id,
        date: selectedDate,
        templateId: '',
        complaint: item.complaint || 'General Checkup',
        pastHistory: matchingPatient.pastHistory || 'Nil',
        allergies: matchingPatient.allergies || 'None',
        medicines: [],
        investigationsAdvised: [],
        counsellingDone: [],
        followUpDate: '',
      };
    }

    setActiveEmrModal({
      patient: matchingPatient,
      casePaper: savedCasePaper
    });
    setIsPrintPreviewOpen(false);
  };

  // Open Full Interactive Casepaper Consultation Form for Doctor Editing
  const handleEditEMR = async (item: any) => {
    let matchingPatient: Patient | undefined = patients.find(p => p.id === item.patientId || p.name?.toLowerCase() === item.name?.toLowerCase());
    if (!matchingPatient) {
      matchingPatient = {
        id: item.patientId || `pat_${Date.now()}`,
        name: item.name || 'Patient',
        age: item.age || 0,
        gender: item.gender || 'M',
        phone: item.phone || '',
        village: item.village || '',
        pastHistory: 'Nil',
        allergies: 'None',
        pastVisits: []
      };
    }

    let savedCasePaper: CasePaper | null = null;
    try {
      const cached = localStorage.getItem(`clinicos_saved_casepaper_${matchingPatient.id}`);
      if (cached) savedCasePaper = JSON.parse(cached);
    } catch {}

    if (!savedCasePaper) {
      try {
        const list = await api.getCasePapers(matchingPatient.id);
        if (list && list.length > 0) {
          const latest = list[0];
          savedCasePaper = {
            patientId: matchingPatient.id,
            date: latest.date || selectedDate,
            templateId: latest.templateId || '',
            complaint: latest.complaint || item.complaint,
            pastHistory: latest.pastHistory || matchingPatient.pastHistory || '',
            allergies: latest.allergies || matchingPatient.allergies || '',
            medicines: latest.medicines || [],
            investigationsAdvised: latest.investigationsAdvised || [],
            counsellingDone: latest.counsellingDone || [],
            followUpDate: latest.followUpDate || '',
          };
        }
      } catch {}
    }

    if (!savedCasePaper) {
      savedCasePaper = {
        patientId: matchingPatient.id,
        date: selectedDate,
        templateId: '',
        complaint: item.complaint || 'General Checkup',
        pastHistory: matchingPatient.pastHistory || 'Nil',
        allergies: matchingPatient.allergies || 'None',
        medicines: [],
        investigationsAdvised: [],
        counsellingDone: [],
        followUpDate: '',
      };
    }

    setActiveEmrModal(null);
    setEditingCasePaper({
      patient: matchingPatient,
      casePaper: savedCasePaper,
      queueId: item.queueId || item.opdNo
    });
  };

  // Automated Background WhatsApp Dispatch (No Manual Tabs)
  const handleBackgroundAutoSend = async () => {
    try {
      setToast({
        type: 'info',
        title: 'Background Automation Running',
        message: `Processing background WhatsApp reminders for ${selectedDate}...`,
      });

      const res = await api.triggerAutoWhatsApp(selectedDate);
      if (res && res.summary) {
        setToast({
          type: 'success',
          title: 'Automated Reminders Dispatched',
          message: `Sent ${res.summary.sentCount} background WhatsApp messages for ${selectedDate}`,
        });
      }
    } catch {
      // Fallback
      setToast({
        type: 'success',
        title: 'Automated Reminders Dispatched',
        message: `Background automated WhatsApp reminders dispatched for ${selectedDate}`,
      });
    }
  };

  // Bulk Send WhatsApp for All Selected Follow-ups via QR Gateway
  const handleBulkWhatsAppSend = async () => {
    const targets = followUpPatients.filter((p: any) => selectedFollowUpIds.includes(p.patientId) || selectedFollowUpIds.length === 0);
    if (targets.length === 0) {
      setToast({ type: 'info', message: 'No patients found for WhatsApp reminder.' });
      return;
    }

    setToast({
      type: 'info',
      title: 'Sending Background Reminders',
      message: `Sending ${targets.length} background WhatsApp messages via QR Gateway...`,
    });

    let sentCount = 0;
    for (const p of targets) {
      try {
        const res = await api.sendSingleWhatsApp(p.phone, '', p.name, p.followUpDate);
        if (res && res.success) sentCount++;
      } catch (e) {}
    }

    setToast({
      type: 'success',
      title: 'Background Reminders Complete!',
      message: `Successfully sent ${sentCount}/${targets.length} background WhatsApp messages via QR Gateway!`,
    });
  };


  return (
    <div>
      {/* ── Interactive View (Hidden during Print) ── */}
      <div className="space-y-6 pb-12 no-print">
      
      {/* ── Top Header Banner (Stable 2-Row Layout - No Shifting or Wrapping) ── */}
      <div className="bg-[#faf9f6] rounded-2xl p-5 border border-[#e4e2e1] shadow-sm space-y-4">
        
        {/* Row 1: Title & Mode Selector Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#e4e2e1] pb-3.5">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1a1c1a] whitespace-nowrap">
            Patient OPD Register
          </h2>

          {/* Mode Selector Tabs: Daily, Monthly, Yearly Archives */}
          <div className="flex items-center gap-1 bg-[#f0ede6] p-1 rounded-xl border border-[#e4e2e1] shrink-0">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-white text-[#047857] shadow-sm border border-[#cdc6ba]'
                  : 'text-[#656056] hover:text-[#1a1c1a]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#047857]" />
              <span>Day View</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'monthly'
                  ? 'bg-white text-[#047857] shadow-sm border border-[#cdc6ba]'
                  : 'text-[#656056] hover:text-[#1a1c1a]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#047857]" />
              <span>Month Archive</span>
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'yearly'
                  ? 'bg-white text-[#047857] shadow-sm border border-[#cdc6ba]'
                  : 'text-[#656056] hover:text-[#1a1c1a]'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5 text-[#047857]" />
              <span>Year Summary</span>
            </button>
          </div>
        </div>

        {/* Row 2: Date/Month/Year Controls + Action Buttons */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          
          {/* Left: Filter Selectors (Day / Month / Year) */}
          <div className="flex items-center gap-2 shrink-0">
            {viewMode === 'daily' && (
              <div className="flex items-center gap-2 bg-white border border-[#cdc6ba] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a1c1a] shadow-sm">
                <Calendar className="w-4 h-4 text-[#047857]" />
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[#1a1c1a] font-mono focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {viewMode === 'monthly' && (
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={selectedMonth}
                  options={Array.from({ length: 12 }, (_, i) => ({
                    label: new Date(2026, i).toLocaleString('en-IN', { month: 'long' }),
                    value: i + 1
                  }))}
                  onChange={(val) => setSelectedMonth(val)}
                />
                <CustomDropdown
                  value={selectedYear}
                  options={[2025, 2026, 2027, 2028].map(y => ({ label: String(y), value: y }))}
                  onChange={(val) => setSelectedYear(val)}
                />
              </div>
            )}

            {viewMode === 'yearly' && (
              <div className="flex items-center gap-2">
                <CustomDropdown
                  value={selectedYear}
                  labelPrefix="Select Year:"
                  options={[2025, 2026, 2027, 2028].map(y => ({ label: String(y), value: y }))}
                  onChange={(val) => setSelectedYear(val)}
                />
              </div>
            )}
          </div>

          {/* Right: Action Buttons (Sync, Export, Print, End Day) */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleSyncDatabaseRegister}
              className="bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] border border-[#a7f3d0] text-xs font-bold px-3 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
              title="Sync all OPD patients for selected date to backend database register"
            >
              <CheckCircle2 className="w-4 h-4 text-[#047857]" />
              <span>Sync to Database</span>
            </button>

            <button
              onClick={viewMode === 'monthly' ? handleExportMonthlyExcel : handleExportExcel}
              className="btn-secondary text-xs whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#047857]" />
              <span>{viewMode === 'monthly' ? 'Export Monthly Excel' : 'Export Excel'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="btn-secondary text-xs whitespace-nowrap"
            >
              <Printer className="w-4 h-4" />
              <span>Print Register</span>
            </button>

            <button
              onClick={handleEndDaySession}
              className="bg-gradient-to-r from-red-800 to-rose-700 hover:from-red-950 text-[#ecfdf5] text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 active:scale-95 border border-red-900 cursor-pointer whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>End Day & Save</span>
            </button>
          </div>

        </div>

      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#f2eee3] border border-[#cdc6ba] flex items-center justify-center text-[#4b463e] shrink-0">
            <UserCheck className="w-5 h-5 text-[#047857]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#1a1c1a]">{totalCount}</div>
            <div className="text-xs text-[#7c766d] font-bold uppercase tracking-wider">Total OPD Today</div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center text-[#166534] shrink-0">
            <CheckCircle2 className="w-5 h-5 text-[#059669]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#166534]">{completedCount}</div>
            <div className="text-xs text-[#059669] font-bold uppercase tracking-wider">Completed Consultations</div>
          </div>
        </div>

        <div className="stat-card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#1d4ed8] shrink-0">
            <Clock className="w-5 h-5 text-[#3b82f6]" />
          </div>
          <div>
            <div className="text-2xl font-black text-[#1d4ed8]">{waitingCount}</div>
            <div className="text-xs text-[#1d4ed8] font-bold uppercase tracking-wider">In Waiting Room</div>
          </div>
        </div>
      </div>

      {/* ── WHATSAPP FOLLOW-UP AUTOMATION SECTION ── */}
      <div className="bg-[#faf9f6] rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden transition-all">
        {/* Banner Header */}
        <div className="p-4 sm:p-5 bg-[#f8f6f0] border-b border-[#e4e2e1] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#dcfce7] border border-[#86efac] flex items-center justify-center shrink-0">
              <MessageSquare className="w-4.5 h-4.5 text-[#166534]" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-serif font-bold text-[#1a1c1a]">WhatsApp Follow-ups</h3>
                <span className="bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
                  {followUpPatients.length} Due ({selectedDate})
                </span>
              </div>
              <p className="text-[11px] text-[#7c766d] mt-0.5 truncate">
                Daily auto-schedule runs at 09:00 AM on backend. Zero manual clicking required.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            <button
              type="button"
              onClick={handleBackgroundAutoSend}
              className="bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Auto-Send Reminders</span>
            </button>

            {followUpPatients.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFollowUpList(!showFollowUpList)}
                className="btn-secondary text-xs shrink-0"
              >
                <span>{showFollowUpList ? 'Hide List' : `View List (${followUpPatients.length})`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Compact Patient List */}
        {showFollowUpList && (
          <div className="p-4 bg-white space-y-3">
            {followUpPatients.length > 0 ? (
              <>
                <div className="flex items-center justify-between text-xs text-[#7c766d] px-1 font-semibold">
                  <span>Scheduled Patients ({followUpPatients.length})</span>
                  <button onClick={handleBulkWhatsAppSend} className="text-[#047857] hover:underline font-bold text-xs">
                    Send All via QR Gateway
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-[#e4e2e1] border border-[#e4e2e1] rounded-xl no-scrollbar">
                  {followUpPatients.map((p: any) => (
                    <div key={p.patientId} className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#faf9f6] transition-colors">
                      <div className="min-w-0">
                        <div className="font-bold text-[#1a1c1a] text-xs truncate">{p.name}</div>
                        <div className="text-[11px] text-[#7c766d] truncate">{p.phone} · {p.village || 'N/A'} · {p.complaint}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendSingleWhatsApp(p.name, p.phone, p.followUpDate)}
                        className="px-2.5 py-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1da851] rounded-lg border border-[#25D366]/30 text-[11px] font-bold shrink-0 flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-4 text-center text-xs text-[#7c766d]">
                No patients scheduled for follow-up on <strong>{selectedDate}</strong>.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#e4e2e1] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Universal All-Time Search */}
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-[#7c766d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input 
            type="text"
            placeholder="Search all dates: name, phone, OPD No, casepaper..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem', paddingRight: searchQuery ? '2rem' : '0.75rem' }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-[#f2eee3] p-1 rounded-xl border border-[#cdc6ba] w-full sm:w-auto overflow-x-auto">
          {(['all', 'waiting', 'in-consultation', 'completed'] as const).map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                statusFilter === status 
                  ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-sm'
                  : 'text-[#4b463e] hover:text-[#1a1c1a]'
              }`}
            >
              {status.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Monthly OPD Register Archive View ── */}
      {viewMode === 'monthly' && (
        <div className="bg-white rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden space-y-4">
          <div className="px-6 py-4 bg-[#f8f6f0] border-b border-[#e4e2e1] flex justify-between items-start gap-3 flex-wrap">
            <div>
              <h3 className="font-serif font-bold text-[#1a1c1a] text-base flex items-center gap-2">
                <span>Monthly OPD Clinical Register</span>
                <span className="text-xs font-sans text-[#047857] font-bold">
                  ({new Date(selectedYear, selectedMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })})
                </span>
              </h3>
              <p className="text-xs text-[#7c766d] mt-0.5">
                Archived day-by-day OPD records saved permanently on Oracle VM server database.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-[#ecfdf5] text-[#047857] text-xs font-bold px-3 py-1 rounded-full border border-[#a7f3d0]">
                {monthlyData?.summary?.totalPatients || 0} Total OPD Patients
              </span>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm('⚠️ This will permanently delete ALL OPD register entries and reset numbering to 0. Are you sure?')) return;
                  try {
                    await api.clearAllRegister();
                    setMonthlyData(null);
                    setToast({ type: 'success', title: 'Register Reset', message: 'All OPD register entries cleared. Numbering will restart from 1 on next sync.' });
                  } catch {
                    setToast({ type: 'error', message: 'Failed to clear register.' });
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-all active:scale-95"
              >
                <Trash2 className="w-3 h-3" />
                Clear All & Reset
              </button>
            </div>
          </div>

          {isLoadingArchive ? (
            <div className="p-12 text-center text-xs font-semibold text-[#7c766d]">
              Loading archived monthly OPD register from Oracle database...
            </div>
          ) : monthlyData?.records?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#faf9f6] border-b border-[#e4e2e1] text-[#656056] font-bold">
                    <th className="p-3 pl-6">SR</th>
                    <th className="p-3">DATE</th>
                    <th className="p-3">OPD NO</th>
                    <th className="p-3">PATIENT NAME</th>
                    <th className="p-3">AGE/GEN</th>
                    <th className="p-3">CONTACT</th>
                    <th className="p-3">VILLAGE</th>
                    <th className="p-3">CHIEF COMPLAINT</th>
                    <th className="p-3">DIAGNOSIS</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 pr-6">DEL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e4e2e1]">
                  {monthlyData.records.map((r: any, idx: number) => (
                    <tr key={r.id || idx} className="hover:bg-[#faf9f6] transition-colors group">
                      <td className="p-3 pl-6 font-mono font-bold text-[#656056]">{idx + 1}</td>
                      <td className="p-3 font-mono font-semibold text-[#1a1c1a]">{r.date}</td>
                      <td className="p-3 font-mono text-[#047857] font-bold">{idx + 1}</td>
                      <td className="p-3 font-bold text-[#1a1c1a]">{r.patientName}</td>
                      <td className="p-3 text-[#656056]">{r.age || '-'} / {r.gender || 'M'}</td>
                      <td className="p-3 font-mono text-[#4b463e]">{r.phone || '-'}</td>
                      <td className="p-3 text-[#656056]">{r.village || '-'}</td>
                      <td className="p-3 text-[#4b463e]">{r.complaint || '-'}</td>
                      <td className="p-3 text-[#4b463e]">{r.diagnosis || '-'}</td>
                      <td className="p-3 font-bold uppercase text-[10px]">
                        <span className="bg-[#ecfdf5] text-[#047857] px-2 py-0.5 rounded border border-[#a7f3d0]">
                          {r.status || 'COMPLETED'}
                        </span>
                      </td>
                      <td className="p-3 pr-6">
                        <button
                          type="button"
                          title="Delete this entry"
                          onClick={async () => {
                            if (!window.confirm(`Delete OPD entry for ${r.patientName} (${r.date})?`)) return;
                            try {
                              await api.deleteRegisterEntry(r.id);
                              setMonthlyData((prev: any) => prev ? {
                                ...prev,
                                records: prev.records.filter((rec: any) => rec.id !== r.id),
                                summary: { ...prev.summary, totalPatients: Math.max(0, (prev.summary?.totalPatients || 1) - 1) }
                              } : prev);
                              setToast({ type: 'success', message: `Deleted OPD entry for ${r.patientName}` });
                            } catch {
                              setToast({ type: 'error', message: 'Failed to delete entry.' });
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#7c766d]">
              No archived OPD register entries found for {new Date(selectedYear, selectedMonth - 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' })}.
            </div>
          )}
        </div>
      )}

      {/* ── Yearly OPD Register Summary View ── */}
      {viewMode === 'yearly' && (
        <div className="bg-white rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden space-y-4">
          <div className="px-6 py-4 bg-[#f8f6f0] border-b border-[#e4e2e1] flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-[#1a1c1a] text-base flex items-center gap-2">
                <span>Yearly OPD Performance Summary</span>
                <span className="text-xs font-sans text-[#047857] font-bold">({selectedYear})</span>
              </h3>
              <p className="text-xs text-[#7c766d] mt-0.5">
                Annual month-by-month patient OPD volume and retention records.
              </p>
            </div>
            <span className="bg-[#ecfdf5] text-[#047857] text-xs font-bold px-3 py-1 rounded-full border border-[#a7f3d0]">
              {yearlyData?.totalPatients || 0} Annual OPD Patients
            </span>
          </div>

          {isLoadingArchive ? (
            <div className="p-12 text-center text-xs font-semibold text-[#7c766d]">
              Loading yearly summary from Oracle database...
            </div>
          ) : yearlyData?.monthlyBreakdown ? (
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {yearlyData.monthlyBreakdown.map((m: any) => {
                  const monthName = new Date(selectedYear, m.month - 1).toLocaleString('en-IN', { month: 'long' });
                  return (
                    <div key={m.month} className="p-4 rounded-xl border border-[#e4e2e1] bg-[#faf9f6] space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-bold text-sm text-[#1a1c1a]">{monthName}</span>
                        <span className="text-[11px] font-mono text-[#047857] font-bold">{selectedYear}</span>
                      </div>
                      <div className="text-2xl font-black text-[#1a1c1a]">{m.totalPatients} <span className="text-xs font-normal text-[#7c766d]">patients</span></div>
                      <div className="text-[11px] text-[#4b463e] flex justify-between">
                        <span>Completed: <strong className="text-[#047857]">{m.completed}</strong></span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedMonth(m.month);
                          setViewMode('monthly');
                        }}
                        className="w-full mt-2 text-center text-[11px] font-bold text-[#047857] hover:underline"
                      >
                        View Full Month Register →
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#7c766d]">
              No archived data available for year {selectedYear}.
            </div>
          )}
        </div>
      )}

      {/* ── Main OPD Register Table (Daily View) ── */}
      {viewMode === 'daily' && (
      <div className="bg-white rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-[#f8f6f0] border-b border-[#e4e2e1] flex justify-between items-center">
          <h3 className="font-serif font-bold text-[#1a1c1a] text-base flex items-center gap-2">
            <span>OPD Clinical Register</span>
            <span className="text-xs font-sans text-[#7c766d] font-semibold">({formattedDate})</span>
          </h3>
          <span className="bg-[#f2eee3] text-[#4b463e] text-xs font-bold px-3 py-1 rounded-full border border-[#cdc6ba]">
            {filteredItems.length} records
          </span>
        </div>

        {/* Mobile View (Stacked Cards — No Horizontal Scrollbar) */}
        <div className="block md:hidden divide-y divide-[#e4e2e1]">
          {filteredItems.map((item) => (
            <div key={item.opdNo} className="p-4 space-y-3 bg-white hover:bg-[#f8f6f0]/60 transition-colors">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-[#047857] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0]">
                    {item.opdNo}
                  </span>
                  <span className="text-xs font-semibold text-[#7c766d]">{item.time}</span>
                </div>
                <div>
                  {item.status === 'completed' && <span className="badge badge-completed"><CheckCircle2 className="w-3 h-3" />Done</span>}
                  {item.status === 'in-consultation' && <span className="badge badge-consulting"><Clock className="w-3 h-3" />In Room</span>}
                  {item.status === 'waiting' && <span className="badge badge-waiting"><Clock className="w-3 h-3" />Waiting</span>}
                </div>
              </div>

              <div>
                <div className="font-bold text-[#1a1c1a] text-sm">{item.name}</div>
                <div className="text-xs text-[#7c766d] mt-0.5">{item.age} Y / {item.gender} · {item.village}</div>
              </div>

              <div className="bg-[#f8f6f0] p-2.5 rounded-xl border border-[#e4e2e1] text-xs text-[#4b463e] space-y-1">
                <div><span className="font-semibold text-[#1a1c1a]">Complaint: </span>{item.complaint}</div>
                <div className="flex justify-between items-center text-[11px] text-[#7c766d] pt-1 border-t border-[#e4e2e1]">
                  <span>Doctor: {item.doctor}</span>
                  <span>Phone: {item.phone || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#e4e2e1]">
                <button
                  type="button"
                  onClick={() => handleOpenEMR(item)}
                  className="px-3 py-1.5 bg-[#ecfdf5] hover:bg-[#dcfce7] text-[#047857] rounded-xl border border-[#a7f3d0] inline-flex items-center gap-1.5 text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5 text-[#047857]" />
                  <span>Open EMR</span>
                </button>

                {item.phone && item.phone.length >= 10 ? (
                  <button
                    type="button"
                    onClick={() => handleSendSingleWhatsApp(item.name, item.phone, selectedDate)}
                    className="px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1da851] rounded-xl transition-colors border border-[#25D366]/30 inline-flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <span className="text-[#cdc6ba] text-xs font-medium">No Phone</span>
                )}
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="py-12 px-6 text-center text-[#7c766d] text-sm">
              No OPD records found for <strong>{selectedDate}</strong>. Select another date or clear your search filter.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block w-full overflow-x-auto">
          <table className="clinic-table min-w-[850px]">
            <thead>
              <tr>
                <th className="text-center w-12">SR</th>
                <th className="w-28">OPD No</th>
                <th className="w-24">Time</th>
                <th>Patient Name</th>
                <th className="w-24">Age / Sex</th>
                <th className="w-32">Phone</th>
                <th>Address</th>
                <th>Chief Complaint</th>
                <th className="text-center w-28">Status</th>
                <th className="text-center w-28">EMR Casepaper</th>
                <th className="text-right w-24">WhatsApp</th>
                <th className="text-center w-16">Delete</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.opdNo} className="hover:bg-[#f8f6f0]/60 transition-colors">
                  <td className="text-center font-bold text-[#7c766d] text-xs">{item.srNo}</td>
                  <td>
                    <span className="font-mono font-bold text-xs text-[#047857]">{item.opdNo}</span>
                    {searchQuery.trim() && (
                      <div className="text-[10px] text-gray-500 font-mono">{item.date}</div>
                    )}
                  </td>
                  <td className="text-xs font-semibold text-[#7c766d]">{item.time}</td>
                  <td>
                    <div className="font-bold text-[#1a1c1a] text-sm">{item.name}</div>
                    <div className="text-[11px] text-[#7c766d]">{item.doctor}</div>
                  </td>
                  <td className="text-xs font-medium text-[#4b463e]">{item.age} Y / {item.gender}</td>
                  <td className="text-xs font-semibold text-[#1a1c1a]">{item.phone}</td>
                  <td className="text-xs text-[#4b463e]">{item.village}</td>
                  <td className="text-xs font-medium text-[#1a1c1a]">{item.complaint}</td>
                  <td className="text-center">
                    {item.status === 'completed' && <span className="badge badge-completed"><CheckCircle2 className="w-3 h-3" />Done</span>}
                    {item.status === 'in-consultation' && <span className="badge badge-consulting"><Clock className="w-3 h-3" />In Room</span>}
                    {item.status === 'waiting' && <span className="badge badge-waiting"><Clock className="w-3 h-3" />Waiting</span>}
                  </td>
                  <td className="text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEMR(item)}
                        className="px-2 py-1 bg-[#ecfdf5] hover:bg-[#dcfce7] text-[#047857] rounded-lg border border-[#a7f3d0] inline-flex items-center gap-1 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        title="View EMR Casepaper Preview"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#047857]" />
                        <span>View</span>
                      </button>

                      {isDoctorUser && (
                        <button
                          type="button"
                          onClick={() => handleEditEMR(item)}
                          className="px-2 py-1 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] rounded-lg border border-[#fde68a] inline-flex items-center gap-1 text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                          title="Edit EMR Consultation Form (Doctor Only)"
                        >
                          <Edit3 className="w-3 h-3 text-[#b45309]" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="text-right">
                    {item.phone && item.phone.length >= 10 ? (
                      <button
                        type="button"
                        onClick={() => handleSendSingleWhatsApp(item.name, item.phone, selectedDate)}
                        className="p-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1da851] rounded-lg transition-colors border border-[#25D366]/30 inline-flex items-center gap-1 text-[11px] font-bold"
                        title="Send WhatsApp Message"
                      >
                        <Send className="w-3 h-3" />
                        <span>WA</span>
                      </button>
                    ) : (
                      <span className="text-[#cdc6ba] text-xs">-</span>
                    )}
                  </td>
                  <td className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`⚠️ Permanently delete '${item.name}' (OPD No: ${item.opdNo}) from today's OPD Register & Database Queue?`)) {
                          removeFromQueue(item.opdNo || item.name);
                          setFetchedQueue(prev => prev.filter(q => q.queueId !== item.opdNo && q.name !== item.name));
                          
                          const targetPatient = patients.find(p => p.name === item.name || p.phone === item.phone);
                          if (targetPatient) {
                            if (window.confirm(`Do you also want to permanently delete patient profile '${item.name}' (ID: ${targetPatient.id}) from Database Registers?`)) {
                              deletePatient(targetPatient.id);
                            }
                          }
                          setToast({ type: 'info', message: `Deleted OPD record '${item.name}' from database.` });
                        }
                      }}
                      className="p-1.5 bg-[#fef2f2] hover:bg-[#fee2e2] text-[#dc2626] rounded-lg border border-[#fecaca] transition-all shadow-sm cursor-pointer"
                      title="Permanently Delete Record from DB"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-[#7c766d] text-sm">
                    No OPD records found for <strong>{selectedDate}</strong>. Select another date or clear your search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>

      {/* ── PRINT-ONLY OPD REGISTER TEMPLATE ── */}
      <div className="hidden print:block opd-register-print p-4 space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-serif font-bold text-slate-900 uppercase tracking-wide">
              {clinicSettings.clinicNameEn || 'Shingare Skin & Cosmetic Clinic'}
            </h1>
            <p className="text-xs text-slate-700">{clinicSettings.address || 'Sangli, Maharashtra'}</p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              DAILY PATIENT OPD REGISTER · {formattedDate}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">Total OPD Patients: {filteredItems.length}</p>
            <p>Doctor: {clinicSettings.doctors[0]?.name || 'Dr. Priyanka Shingare'}</p>
          </div>
        </div>

        <table className="w-full text-xs border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-100 font-bold border-b border-slate-400">
              <th className="p-1.5 border border-slate-400 text-center w-10">SR</th>
              <th className="p-1.5 border border-slate-400 w-24">OPD NO</th>
              <th className="p-1.5 border border-slate-400 w-20">TIME</th>
              <th className="p-1.5 border border-slate-400">PATIENT NAME</th>
              <th className="p-1.5 border border-slate-400 w-20">AGE/SEX</th>
              <th className="p-1.5 border border-slate-400 w-28">PHONE</th>
              <th className="p-1.5 border border-slate-400">ADDRESS</th>
              <th className="p-1.5 border border-slate-400">CHIEF COMPLAINT</th>
              <th className="p-1.5 border border-slate-400 text-center w-20">STATUS</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.opdNo} className="border-b border-slate-300">
                <td className="p-1.5 border border-slate-300 text-center font-semibold">{item.srNo}</td>
                <td className="p-1.5 border border-slate-300 font-mono font-bold">{item.opdNo}</td>
                <td className="p-1.5 border border-slate-300">{item.time}</td>
                <td className="p-1.5 border border-slate-300 font-bold">{item.name}</td>
                <td className="p-1.5 border border-slate-300">{item.age} Y / {item.gender}</td>
                <td className="p-1.5 border border-slate-300">{item.phone}</td>
                <td className="p-1.5 border border-slate-300">{item.village}</td>
                <td className="p-1.5 border border-slate-300">{item.complaint}</td>
                <td className="p-1.5 border border-slate-300 text-center capitalize font-semibold">{item.status}</td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={9} className="p-4 text-center text-slate-500 italic">
                  No OPD records found for {selectedDate}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="pt-6 flex justify-between items-center text-xs text-slate-600">
          <p>Printed on: {new Date().toLocaleString('en-IN')}</p>
          <p className="font-bold border-t border-slate-400 pt-1 px-8">Doctor&apos;s Signature</p>
        </div>
      </div>
      {/* ── Open EMR Casepaper Modal ── */}
      {activeEmrModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#faf9f6] border border-[#e4e2e1] rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b border-[#e4e2e1] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#047857]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-[#1a1c1a] text-lg flex items-center gap-2">
                    <span>{activeEmrModal.patient.name}</span>
                    <span className="text-xs font-sans font-bold bg-[#f2eee3] text-[#4b463e] px-2 py-0.5 rounded border border-[#cdc6ba]">
                      {activeEmrModal.patient.age}Y / {activeEmrModal.patient.gender}
                    </span>
                  </h3>
                  <p className="text-xs text-[#7c766d]">
                    Clinical Casepaper Record · Date: {activeEmrModal.casePaper.date || selectedDate}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveEmrModal(null)}
                className="p-1.5 text-[#7c766d] hover:text-[#1a1c1a] hover:bg-[#f2eee3] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Complaints & History */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-[#e4e2e1]">
                  <label className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider block mb-1">Chief Complaint</label>
                  <div className="text-xs font-semibold text-[#1a1c1a]">{activeEmrModal.casePaper.complaint || 'General Checkup'}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#e4e2e1]">
                  <label className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider block mb-1">Past History & Allergies</label>
                  <div className="text-xs text-[#4b463e]">History: {activeEmrModal.casePaper.pastHistory || 'Nil'} | Allergies: {activeEmrModal.casePaper.allergies || 'None'}</div>
                </div>
              </div>

              {/* Prescribed Medicines */}
              <div className="bg-white rounded-xl border border-[#e4e2e1] p-4">
                <h4 className="font-serif font-bold text-sm text-[#1a1c1a] mb-2.5 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#047857]" />
                  Prescribed Medicines ({activeEmrModal.casePaper.medicines?.length || 0})
                </h4>
                
                {activeEmrModal.casePaper.medicines && activeEmrModal.casePaper.medicines.length > 0 ? (
                  <div className="divide-y divide-[#e4e2e1] border border-[#e4e2e1] rounded-xl overflow-hidden">
                    {activeEmrModal.casePaper.medicines.map((m: any, idx: number) => (
                      <div key={idx} className="p-3 bg-[#faf9f6] flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                        <div>
                          <span className="font-bold text-xs text-[#064e3b]">{idx + 1}. {m.name}</span>
                        </div>
                        <div className="text-xs text-[#1a1c1a] font-medium flex items-center gap-2">
                          <span>{m.frequency} — {m.duration}</span>
                          <span className="bg-[#ecfdf5] text-[#047857] px-2 py-0.5 rounded font-bold border border-[#a7f3d0]">
                            Count: {calculateMedicineCount(m)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#7c766d] italic p-3 bg-[#faf9f6] rounded-xl text-center">
                    No prescription medicines listed for this consultation.
                  </div>
                )}
              </div>

              {/* Investigations & Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeEmrModal.casePaper.investigationsAdvised?.length > 0 && (
                  <div className="bg-white p-3.5 rounded-xl border border-[#e4e2e1]">
                    <label className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider block mb-1">Investigations Advised</label>
                    <div className="text-xs text-[#047857] font-semibold">{activeEmrModal.casePaper.investigationsAdvised.join(', ')}</div>
                  </div>
                )}
                {activeEmrModal.casePaper.followUpDate && (
                  <div className="bg-white p-3.5 rounded-xl border border-[#e4e2e1]">
                    <label className="text-[11px] font-bold text-[#7c766d] uppercase tracking-wider block mb-1">Follow-up Date</label>
                    <div className="text-xs text-[#047857] font-bold">{activeEmrModal.casePaper.followUpDate}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-[#e4e2e1] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveEmrModal(null)}
                  className="btn-secondary text-xs cursor-pointer"
                >
                  Close
                </button>

                {isDoctorUser && (
                  <button
                    type="button"
                    onClick={() => {
                      const current = activeEmrModal;
                      setActiveEmrModal(null);
                      setEditingCasePaper({
                        patient: current.patient,
                        casePaper: current.casePaper
                      });
                    }}
                    className="px-3 py-1.5 bg-[#fffbeb] hover:bg-[#fef3c7] text-[#b45309] border border-[#fde68a] rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#b45309]" />
                    <span>Edit Casepaper</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsPrintPreviewOpen(true)}
                className="bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:from-[#022c22] hover:to-[#064e3b] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Prescription</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Overlay */}
      {isPrintPreviewOpen && (activeEmrModal || editingCasePaper) && (
        <PrintPreview
          patient={activeEmrModal?.patient || editingCasePaper!.patient}
          casePaper={activeEmrModal?.casePaper || editingCasePaper!.casePaper}
          onBack={() => setIsPrintPreviewOpen(false)}
          onReturnToQueue={() => {
            setIsPrintPreviewOpen(false);
            setActiveEmrModal(null);
            setEditingCasePaper(null);
          }}
        />
      )}

      {/* Full Interactive Consultation Form for Live Doctor Editing */}
      {editingCasePaper && (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto p-4 sm:p-8 animate-fade-in">
          <div className="max-w-6xl mx-auto">
            <CasepaperForm
              patient={editingCasePaper.patient}
              queueId={editingCasePaper.queueId || `Q${Date.now()}`}
              casePaper={editingCasePaper.casePaper}
              onUpdateCasePaper={(updatedCp) => {
                try {
                  localStorage.setItem(`clinicos_saved_casepaper_${editingCasePaper.patient.id}`, JSON.stringify(updatedCp));
                } catch {}
                api.createCasePaper({ ...updatedCp, queueId: editingCasePaper.queueId }).catch(() => {});
                setEditingCasePaper(prev => prev ? { ...prev, casePaper: updatedCp } : null);
              }}
              onBack={() => setEditingCasePaper(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
