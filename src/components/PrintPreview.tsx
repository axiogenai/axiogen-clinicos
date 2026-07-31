import { useState, useEffect, useRef, useCallback } from 'react';
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
  onReturnToQueue?: () => void;
}

const A4_W = 794;
const A4_H = 1123;

export default function PrintPreview({ patient, casePaper, onBack, onReturnToQueue }: PrintPreviewProps) {

  const { clinicSettings, updateClinicSettings, setToast } = useClinic();
  const [zoom, setZoom] = useState(55);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const fitToScreen = useCallback(() => {
    if (!canvasRef.current) return;
    const barH = barRef.current?.offsetHeight ?? 52;
    // Available height: full window height minus toolbar height minus 24px margin
    const availH = window.innerHeight - barH - 24;
    // Available width: canvas width minus 32px padding
    const availW = canvasRef.current.offsetWidth - 32;
    
    if (availH > 0 && availW > 0) {
      const zH = (availH / A4_H) * 100;
      const zW = (availW / A4_W) * 100;
      const fitZoom = Math.min(zH, zW, 100);
      setZoom(Math.max(Math.floor(fitZoom), 25));
    }
  }, []);

  useEffect(() => {
    // Lock body scroll while in preview mode
    document.body.style.overflow = 'hidden';
    
    const t = setTimeout(fitToScreen, 50);
    window.addEventListener('resize', fitToScreen);
    return () => {
      document.body.style.overflow = '';
      clearTimeout(t);
      window.removeEventListener('resize', fitToScreen);
    };
  }, [fitToScreen]);

  const scale = zoom / 100;

  return (
    /* Fullscreen fixed overlay — covers 100% of viewport with ZERO scrollbars */
    <div className="fixed inset-0 z-50 bg-[#f2eee3] flex flex-col overflow-hidden">

      {/* ── Top Control Bar ── */}
      <div 
        ref={barRef} 
        className="shrink-0 bg-white border-b border-[#e4e2e1] px-5 py-2.5 shadow-sm flex flex-wrap items-center justify-between gap-3"
      >
        {/* Left: Back Button */}
        <button 
          type="button" 
          onClick={onBack} 
          className="btn-secondary text-xs shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to EMR</span>
        </button>

        {/* Center: Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Zoom */}
          <div className="flex items-center gap-1.5 bg-[#f2eee3]/70 px-3 py-1.5 rounded-lg border border-[#e4e2e1] text-xs">
            <ZoomOut 
              className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer hover:text-[#1a1c1a]" 
              onClick={() => setZoom(p => Math.max(25, p - 5))} 
            />
            <input 
              type="range" 
              min="25" 
              max="100" 
              value={zoom} 
              onChange={e => setZoom(Number(e.target.value))} 
              className="w-20 accent-[#047857] cursor-pointer" 
            />
            <ZoomIn 
              className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer hover:text-[#1a1c1a]" 
              onClick={() => setZoom(p => Math.min(100, p + 5))} 
            />
            <span className="font-mono text-[#047857] font-bold w-8 text-right">{zoom}%</span>
          </div>

          {/* Template Variant Buttons */}
          <div className="flex items-center gap-1 bg-[#f2eee3] p-1 rounded-lg border border-[#cdc6ba]">
            <button 
              type="button" 
              onClick={() => updateClinicSettings({ ...clinicSettings, templateVariant: 'dermatology' }, false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${(clinicSettings.templateVariant || 'dermatology') === 'dermatology' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#4b463e]'}`}
            >
              Template 1 (Dermatology)
            </button>
            <button 
              type="button" 
              onClick={() => updateClinicSettings({ ...clinicSettings, templateVariant: 'general' }, false)}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${clinicSettings.templateVariant === 'general' ? 'bg-[#047857] text-white shadow-sm' : 'text-[#4b463e]'}`}
            >
              Template 2 (General)
            </button>
          </div>

          {/* Branding Settings Button */}
          <button 
            type="button" 
            onClick={() => setIsSettingsOpen(true)} 
            className="btn-secondary text-xs"
          >
            <Settings className="w-3.5 h-3.5 text-[#047857]" />
            <span>Branding</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            type="button" 
            onClick={() => { 
              window.print(); 
              setToast({ type: 'info', message: 'Select "Save as PDF" in the print dialog.' }); 
              if (onReturnToQueue) onReturnToQueue(); else onBack();
            }} 
            className="btn-secondary text-xs"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>Save PDF</span>
          </button>

          <button 
            type="button" 
            onClick={() => {
              window.print();
              if (onReturnToQueue) onReturnToQueue(); else onBack();
            }} 
            className="btn-primary text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Print Prescription</span>
          </button>
        </div>

      </div>

      {/* ── Main Preview Canvas: Auto-fits PDF on screen, ZERO scrollbars ── */}
      <div 
        ref={canvasRef} 
        className="flex-1 w-full flex items-center justify-center overflow-hidden p-3"
      >
        <div 
          className="shadow-2xl border border-slate-300 rounded-sm bg-white overflow-hidden transition-all duration-150 ease-out"
          style={{ 
            width: A4_W * scale, 
            height: A4_H * scale,
            flexShrink: 0,
          }}
        >
          <div
            className="print-page bg-white"
            style={{ 
              width: A4_W, 
              height: A4_H, 
              transform: `scale(${scale})`, 
              transformOrigin: 'top left' 
            }}
          >
            <PrintTemplate patient={patient} casePaper={casePaper} clinicSettings={clinicSettings} />
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <ClinicSettingsModal 
          settings={clinicSettings} 
          onSave={s => updateClinicSettings(s, true)} 
          onClose={() => setIsSettingsOpen(false)} 
        />
      )}
    </div>
  );
}
