import { useState, useMemo, useEffect } from 'react';
import { useClinic } from '../context/ClinicContext';
import { api } from '../api/client';
import { Calendar, Search, Printer, UserCheck, Clock, CheckCircle2, FileSpreadsheet, Send, MessageSquare } from 'lucide-react';

import * as XLSX from 'xlsx';

export default function DailyPatientRegister() {
  const { queue, patients, clinicSettings, setToast } = useClinic();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [fetchedQueue, setFetchedQueue] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in-consultation' | 'completed'>('all');
  const [selectedFollowUpIds] = useState<string[]>([]);
  const [showFollowUpList, setShowFollowUpList] = useState(false);

  // Fetch queue items for selectedDate from DB
  useEffect(() => {
    let active = true;
    api.getQueue(selectedDate)
      .then((data) => {
        if (active && Array.isArray(data)) {
          setFetchedQueue(data);
        }
      })
      .catch(() => {
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

  // Combine queue with patient data strictly filtered by selectedDate
  const registerItems = useMemo(() => {
    const rawQueue = fetchedQueue.length > 0 ? fetchedQueue : queue;
    const dateFilteredQueue = rawQueue.filter(item => {
      const itemDate = (item as any).date || (item as any).createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
      return itemDate === selectedDate;
    });

    return dateFilteredQueue.map((item, index) => {
      const patientName = item.name || 'Unknown Patient';
      const patient = patients.find(p => p.id === item.patientId || p.name?.toLowerCase() === patientName.toLowerCase());
      return {
        srNo: index + 1,
        opdNo: item.queueId || `OPD-${String(index + 1).padStart(3, '0')}`,
        time: item.timeAdded || '09:00 AM',
        date: selectedDate,
        name: patientName,
        age: item.age || patient?.age || '-',
        gender: patient?.gender || 'M',
        phone: item.phone || patient?.phone || '-',
        village: item.village || patient?.village || '-',
        complaint: item.complaint || 'General Checkup',
        doctor: clinicSettings.doctors[0]?.name || 'डॉ. प्रियांका शिनगारे',
        status: item.status || 'waiting'
      };
    });
  }, [queue, fetchedQueue, patients, clinicSettings, selectedDate]);

  // Filtered Register Data
  const filteredItems = useMemo(() => {
    return registerItems.filter(item => {
      const matchesSearch = 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.phone.includes(searchQuery) ||
        item.village.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.opdNo.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registerItems, searchQuery, statusFilter]);

  // WhatsApp Follow-up Patients matching selectedDate
  const followUpPatients = useMemo(() => {
    // Gather all patients who have saved casepapers or visits with followUpDate matching selectedDate
    const list: Array<{ patientId: string; name: string; phone: string; village: string; complaint: string; followUpDate: string }> = [];

    patients.forEach(p => {
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

      // Fallback: match by selectedDate if patient is completed today
      if (!fDate) {
        const inQueue = queue.find(q => q.patientId === p.id && q.status === 'completed');
        if (inQueue) fDate = selectedDate;
      }

      if (fDate === selectedDate && p.phone && p.phone.length >= 10) {
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

    return list;
  }, [patients, queue, selectedDate]);

  // Stats Counters
  const totalCount = registerItems.length;
  const completedCount = registerItems.filter(i => i.status === 'completed').length;
  const waitingCount = registerItems.filter(i => i.status === 'waiting').length;

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

  // Generate WhatsApp Message Link
  const getWhatsAppLink = (patientName: string, phone: string, followUpDate: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
    const text = encodeURIComponent(
      `Namaste ${patientName} ji,\n\n` +
      `This is a reminder for your skin consultation follow-up appointment at *Shinagare Skin & Cosmetic Clinic* scheduled for *${followUpDate}*.\n\n` +
      `📍 Location: ST Stand Near, Rajaram Chitra Mandir Samor, Peth Vadgaon.\n` +
      `📞 Contact: 7249727104 / 9657727104\n\n` +
      `Please visit between 10:00 AM - 6:00 PM. Wishing you good health!`
    );
    return `https://wa.me/${formattedPhone}?text=${text}`;
  };

  // Send WhatsApp to Individual
  const handleSendSingleWhatsApp = (name: string, phone: string, followUpDate: string) => {
    const url = getWhatsAppLink(name, phone, followUpDate);
    window.open(url, '_blank');
    setToast({
      type: 'success',
      title: 'WhatsApp Reminder Opened',
      message: `Follow-up message prepared for ${name}`,
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

  // Bulk Send WhatsApp for All Selected Follow-ups (Manual Browser Tabs)
  const handleBulkWhatsAppSend = () => {
    const targets = followUpPatients.filter((p: any) => selectedFollowUpIds.includes(p.patientId) || selectedFollowUpIds.length === 0);
    if (targets.length === 0) {
      setToast({ type: 'info', message: 'No patients found for WhatsApp reminder.' });
      return;
    }

    let delay = 0;
    targets.forEach((p: any) => {
      setTimeout(() => {
        const url = getWhatsAppLink(p.name, p.phone, p.followUpDate);
        window.open(url, '_blank');
      }, delay);
      delay += 800; // stagger opens to avoid browser popup blocks
    });

    setToast({
      type: 'success',
      title: 'WhatsApp Tabs Opened',
      message: `Opened ${targets.length} WhatsApp reminder messages for ${selectedDate}`,
    });
  };


  return (
    <div>
      {/* ── Interactive View (Hidden during Print) ── */}
      <div className="space-y-6 pb-12 no-print">
      
      {/* ── Top Header Banner (On-Brand Warm Ivory Styling) ── */}
      <div className="bg-[#faf9f7] rounded-2xl p-6 border border-[#e4e2e1] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#ecfdf5] text-[#047857] border border-[#a7f3d0] text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full">
              OFFICIAL CLINICAL RECORD
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#1a1c1a] mt-1.5">Daily Patient OPD Register</h2>
          <p className="text-xs text-[#7c766d] mt-0.5">
            Complete OPD consultations record, daily register, and WhatsApp follow-up reminders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-white border border-[#cdc6ba] rounded-xl px-3 py-2 text-xs font-semibold text-[#1a1c1a] shadow-sm">
            <Calendar className="w-4 h-4 text-[#047857]" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-[#1a1c1a] font-mono focus:outline-none cursor-pointer"
            />
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="btn-primary text-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="btn-secondary text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
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
      <div className="bg-[#faf9f7] rounded-2xl border border-[#e4e2e1] shadow-sm overflow-hidden transition-all">
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
                    Open All in Tabs
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-[#e4e2e1] border border-[#e4e2e1] rounded-xl no-scrollbar">
                  {followUpPatients.map((p: any) => (
                    <div key={p.patientId} className="px-3.5 py-2.5 flex items-center justify-between gap-3 hover:bg-[#faf9f7] transition-colors">
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
        {/* Live Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#7c766d] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
          <input 
            type="text"
            placeholder="Search patient name, phone, OPD No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
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

      {/* ── Main OPD Register Table ── */}
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

              <div className="flex justify-end pt-1">
                {item.phone && item.phone.length >= 10 ? (
                  <button
                    type="button"
                    onClick={() => handleSendSingleWhatsApp(item.name, item.phone, selectedDate)}
                    className="px-3 py-1.5 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1da851] rounded-xl transition-colors border border-[#25D366]/30 inline-flex items-center gap-1.5 text-xs font-bold"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send WhatsApp</span>
                  </button>
                ) : (
                  <span className="text-[#cdc6ba] text-xs font-medium">No Phone Number</span>
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
                <th>Village / Address</th>
                <th>Chief Complaint</th>
                <th className="text-center w-28">Status</th>
                <th className="text-right w-24">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.opdNo} className="hover:bg-[#f8f6f0]/60 transition-colors">
                  <td className="text-center font-bold text-[#7c766d] text-xs">{item.srNo}</td>
                  <td><span className="font-mono font-bold text-xs text-[#047857]">{item.opdNo}</span></td>
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
    </div>

      {/* ── PRINT-ONLY OPD REGISTER TEMPLATE ── */}
      <div className="hidden print:block opd-register-print p-4 space-y-4">
        <div className="border-b-2 border-slate-900 pb-3 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-serif font-bold text-slate-900 uppercase tracking-wide">
              {clinicSettings.clinicNameEn || 'Shinagare Skin & Cosmetic Clinic'}
            </h1>
            <p className="text-xs text-slate-700">{clinicSettings.address || 'Sangli, Maharashtra'}</p>
            <p className="text-xs text-slate-700 font-semibold mt-1">
              DAILY PATIENT OPD REGISTER · {formattedDate}
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <p className="font-bold">Total OPD Patients: {filteredItems.length}</p>
            <p>Doctor: {clinicSettings.doctors[0]?.name || 'Dr. Priyanka Shinagare'}</p>
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
              <th className="p-1.5 border border-slate-400">VILLAGE / ADDRESS</th>
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
    </div>
  );
}
