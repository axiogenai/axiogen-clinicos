import { useState, useMemo } from 'react';
import { useClinic } from '../context/ClinicContext';
import { Calendar, Search, Printer, UserCheck, Clock, CheckCircle2, FileSpreadsheet, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function DailyPatientRegister() {
  const { queue, patients, clinicSettings } = useClinic();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'waiting' | 'in-consultation' | 'completed'>('all');

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
    const dateFilteredQueue = queue.filter(item => {
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
  }, [queue, patients, clinicSettings, selectedDate]);

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
    
    // Auto column width
    worksheet['!cols'] = [
      { wch: 8 },  // SR
      { wch: 12 }, // OPD No
      { wch: 12 }, // Time
      { wch: 24 }, // Name
      { wch: 12 }, // Age/Gender
      { wch: 14 }, // Phone
      { wch: 20 }, // Village
      { wch: 35 }, // Complaint
      { wch: 25 }, // Doctor
      { wch: 15 }  // Status
    ];

    XLSX.writeFile(workbook, `Daily_OPD_Register_${selectedDate}.xlsx`);
  };

  // Print Register
  const handlePrintRegister = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Selector */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full font-mono">
              OFFICIAL CLINICAL RECORD
            </span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-white mt-1">Daily Patient OPD Register</h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete record of registered patients, OPD consultations, and clinic visits.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Date Picker */}
          <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-white font-mono focus:outline-none cursor-pointer"
            />
          </div>

          {/* Export Excel Button */}
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2 border border-emerald-600"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrintRegister}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs border border-slate-700 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Register</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-[#e4e2e1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{totalCount}</div>
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Patients Today</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#e4e2e1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-800">{completedCount}</div>
            <div className="text-xs text-emerald-600 font-semibold uppercase tracking-wider">Completed Consultations</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-[#e4e2e1] shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-800">{waitingCount}</div>
            <div className="text-xs text-amber-600 font-semibold uppercase tracking-wider">In Waiting Queue</div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-xl p-4 border border-[#e4e2e1] shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        {/* Live Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, phone, village..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
          {(['all', 'waiting', 'in-consultation', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Register Data Table */}
      <div className="bg-white rounded-xl border border-[#e4e2e1] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <span>OPD Log Register — {formattedDate}</span>
          </h3>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Showing {filteredItems.length} of {registerItems.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                <th className="px-4 py-3 text-center w-12">#</th>
                <th className="px-4 py-3">OPD Token</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Patient Name</th>
                <th className="px-4 py-3">Demographics</th>
                <th className="px-4 py-3">Village</th>
                <th className="px-4 py-3">Chief Complaint</th>
                <th className="px-4 py-3">Consulting Doctor</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.srNo} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 text-center font-mono font-bold text-slate-400">{item.srNo}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">{item.opdNo}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{item.time}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {item.age} Y / {item.gender} • <span className="font-mono text-slate-500">{item.phone}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">{item.village}</td>
                    <td className="px-4 py-3 text-slate-800 max-w-xs truncate">{item.complaint}</td>
                    <td className="px-4 py-3 text-slate-700 font-semibold">{item.doctor}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        item.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'in-consultation'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No patient records found in register for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
