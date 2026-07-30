import { useState } from 'react';
import { ArrowLeft, Printer, Settings, FileText, ZoomIn, ZoomOut } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import PrintTemplate from './PrintTemplate';
import ClinicSettingsModal from './ClinicSettingsModal';
import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';

interface PrintPreviewProps {
  patient: Patient;
  casePaper: CasePaper;
  onBack: () => void;
}

export default function PrintPreview({ patient, casePaper, onBack }: PrintPreviewProps) {
  const { clinicSettings, updateClinicSettings, setToast } = useClinic();
  const [zoom, setZoom] = useState(100);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.print();
    setToast({
      type: 'info',
      message: 'In the system print dialog, select "Save as PDF" to export your prescription.',
    });
  };

  return (
    <div className="flex flex-col items-center min-h-screen py-4 bg-[#f2eee3]">
      
      {/* Clean Top Action Bar (no-print) */}
      <div className="w-full bg-white border-b border-[#e4e2e1] px-6 py-3 shadow-sm no-print sticky top-16 z-30 mb-6 flex flex-wrap items-center justify-between gap-4">
        
        {/* Back Button */}
        <button 
          type="button"
          onClick={onBack}
          className="text-[#4b463e] hover:text-[#1a1c1a] font-semibold px-3.5 py-1.5 rounded-lg hover:bg-[#f2eee3] transition-colors flex items-center gap-2 text-xs border border-[#cdc6ba]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to EMR</span>
        </button>
        
        {/* Center: Zoom & Branding Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#f2eee3]/70 px-3 py-1.5 rounded-lg border border-[#e4e2e1] text-xs">
            <ZoomOut className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer hover:text-[#1a1c1a]" onClick={() => setZoom(prev => Math.max(50, prev - 10))} />
            <input 
              type="range"
              min="50"
              max="150"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-24 accent-[#047857] cursor-pointer"
            />
            <ZoomIn className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer hover:text-[#1a1c1a]" onClick={() => setZoom(prev => Math.min(150, prev + 10))} />
            <span className="font-mono text-[#047857] font-bold ml-1">{zoom}%</span>
          </div>

          {/* Template Switcher Bar */}
          <div className="flex items-center gap-1 bg-[#f2eee3] p-1 rounded-lg border border-[#cdc6ba]">
            <button
              type="button"
              onClick={() => updateClinicSettings({ ...clinicSettings, templateVariant: 'dermatology' }, false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                (clinicSettings.templateVariant || 'dermatology') === 'dermatology'
                  ? 'bg-[#047857] text-white shadow-sm'
                  : 'text-[#4b463e] hover:text-[#1a1c1a]'
              }`}
            >
              📄 Template 1 (Dermatology Pad)
            </button>
            <button
              type="button"
              onClick={() => updateClinicSettings({ ...clinicSettings, templateVariant: 'general' }, false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                clinicSettings.templateVariant === 'general'
                  ? 'bg-[#047857] text-white shadow-sm'
                  : 'text-[#4b463e] hover:text-[#1a1c1a]'
              }`}
            >
              📋 Template 2 (General Pad)
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="bg-[#f2eee3] hover:bg-[#e8e2d2] text-[#1a1c1a] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 border border-[#cdc6ba]"
          >
            <Settings className="w-3.5 h-3.5 text-[#047857]" />
            <span>Customize Branding & Colors</span>
          </button>
        </div>

        {/* Right: PDF & Print Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="bg-white hover:bg-[#f8f6f0] text-[#4b463e] px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-[#cdc6ba] shadow-sm"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>Save PDF</span>
          </button>

          <button 
            type="button"
            onClick={handlePrint}
            className="bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] px-5 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-emerald-950/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Prescription</span>
          </button>
        </div>

      </div>

      {/* A4 Paper Viewport Container */}
      <div className="w-full max-w-[210mm] overflow-x-auto flex justify-center pb-12">
        <div 
          className="print-page bg-white text-slate-900 p-0 w-[210mm] h-[297mm] max-h-[297mm] shadow-2xl border border-slate-300 rounded-sm print:shadow-none print:border-none print:p-0 print:m-0 overflow-hidden"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
          }}
        >
          <PrintTemplate 
            patient={patient}
            casePaper={casePaper}
            clinicSettings={clinicSettings}
          />
        </div>
      </div>

      {/* Clinic Settings Modal */}
      {isSettingsOpen && (
        <ClinicSettingsModal 
          settings={clinicSettings}
          onSave={(s) => updateClinicSettings(s, true)}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

    </div>
  );
}
