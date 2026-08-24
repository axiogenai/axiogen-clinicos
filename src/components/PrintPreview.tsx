import { useState, useEffect, useRef, useCallback } from 'react';

import {

  ArrowLeft, Printer, Settings, FileText,

  ZoomIn, ZoomOut, Languages, Check, ChevronDown, ChevronUp

} from 'lucide-react';

import { useClinic } from '../context/ClinicContext';

import PrintTemplate, { type PrintLanguage } from './PrintTemplate';

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



const LANGS: { key: PrintLanguage; label: string }[] = [

  { key: 'marathi', label: 'मराठी' },

  { key: 'english', label: 'Eng' },

  { key: 'kannada', label: 'ಕನ್ನಡ' },

];



export default function PrintPreview({ patient, casePaper, onBack, onReturnToQueue }: PrintPreviewProps) {

  const { clinicSettings, updateClinicSettings, setToast } = useClinic();

  const [zoom, setZoom]                         = useState(55);

  const [hideHeader, setHideHeader]             = useState(false);

  const [printOnStationery, setPrintOnStationery] = useState(false);

  const [selectedLanguage, setSelectedLanguage] = useState<PrintLanguage>('marathi');

  const [isSettingsOpen, setIsSettingsOpen]     = useState(false);

  const [drawerOpen, setDrawerOpen]             = useState(false); // mobile drawer

  const barRef       = useRef<HTMLDivElement>(null);

  const canvasRef    = useRef<HTMLDivElement>(null);

  const printPageRef = useRef<HTMLDivElement>(null);



  const iframePrint = useCallback(() => {

    const el = printPageRef.current;

    if (!el) { window.print(); return; }

    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))

      .map(s => s.outerHTML)

      .join('\n');

    const html = el.innerHTML;

    const iframe = document.createElement('iframe');

    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:220mm;height:270mm;border:0;visibility:hidden;';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;

    if (!doc) { document.body.removeChild(iframe); window.print(); return; }

    doc.open();

    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${styles}<style>@page{size:220mm 270mm;margin:0}html,body{margin:0;padding:0;width:220mm;height:270mm;background:#fff;overflow:hidden}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;color-adjust:exact!important}.rx-paper-root{width:220mm!important;min-width:220mm!important;max-width:220mm!important;height:270mm!important;min-height:270mm!important;max-height:270mm!important;margin:0!important;padding:0!important;overflow:hidden!important;box-sizing:border-box!important}</style></head><body><div class="rx-paper-root print-page" style="width:220mm;height:270mm;overflow:hidden;box-sizing:border-box;margin:0;padding:0;background:#fff">${html}</div></body></html>`);

    doc.close();

    setTimeout(() => {

      try {

        iframe.contentWindow?.focus();

        iframe.contentWindow?.print();

      } finally {

        setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 2000);

      }

    }, 600);

  }, []);



  const fitToScreen = useCallback(() => {

    if (!canvasRef.current) return;

    const barH   = barRef.current?.offsetHeight ?? 80;

    const availH = window.innerHeight - barH - 12;

    const availW = canvasRef.current.offsetWidth - 12;

    if (availH > 0 && availW > 0) {

      const fit = Math.min((availH / A4_H) * 100, (availW / A4_W) * 100, 100);

      setZoom(Math.max(Math.floor(fit), 20));

    }

  }, []);



  useEffect(() => {

    document.body.style.overflow = 'hidden';

    const t = setTimeout(fitToScreen, 60);

    window.addEventListener('resize', fitToScreen);

    return () => {

      document.body.style.overflow = '';

      clearTimeout(t);

      window.removeEventListener('resize', fitToScreen);

    };

  }, [fitToScreen]);



  useEffect(() => { setTimeout(fitToScreen, 80); }, [drawerOpen, fitToScreen]);



  const scale  = zoom / 100;



  /* ── Desktop pill helper ── */

  const pill = (active: boolean, onClick: () => void, label: React.ReactNode, activeColor = 'bg-[#047857] text-white') => (

    <button type="button" onClick={onClick}

      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap border

        ${active ? `${activeColor} border-transparent shadow-sm` : 'bg-white text-[#4b463e] border-[#d6d3ce] hover:bg-[#f2eee3]'}`}

    >

      {active && <Check className="w-2.5 h-2.5 shrink-0" />}

      {label}

    </button>

  );



  /* ── Mobile drawer pill ── */

  const drawerPill = (active: boolean, onClick: () => void, label: React.ReactNode) => (

    <button type="button" onClick={onClick}

      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 border

        ${active ? 'bg-[#047857] text-white border-transparent shadow-sm' : 'bg-white text-[#4b463e] border-[#cdc6ba] hover:bg-[#f2eee3]'}`}

    >

      {active && <Check className="w-3 h-3" />}

      {label}

    </button>

  );



  const sep = <div className="w-px h-4 bg-[#d6d3ce] shrink-0" />;



  return (

    <div id="print-preview-root" className="fixed inset-0 z-50 bg-[#eeeae0] flex flex-col overflow-hidden">



      {/* ════════════════════════════════════════════════════

          DESKTOP TOOLBAR  (hidden on mobile, shown md+)

      ════════════════════════════════════════════════════ */}

      <div ref={barRef} className="shrink-0 bg-white border-b border-[#e4e2e1] shadow-sm">



        {/* ── DESKTOP Row 1 ── */}

        <div className="hidden md:flex items-center gap-2 px-4 h-12 border-b border-[#f0ede6]">

          <button type="button" onClick={onBack}

            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2eee3] border border-[#d6d3ce] text-[#4b463e] text-xs font-semibold hover:bg-[#e8e4da] transition-colors shrink-0">

            <ArrowLeft className="w-3.5 h-3.5" />

            Back

          </button>



          {sep}



          <div className="inline-flex items-center gap-1 shrink-0">

            <button type="button" onClick={() => setZoom(p => Math.max(20, p - 5))}

              className="p-1 rounded text-[#7c766d] hover:text-[#1a1c1a] hover:bg-[#f2eee3] transition-colors">

              <ZoomOut className="w-3.5 h-3.5" />

            </button>

            <input type="range" min="20" max="100" value={zoom}

              onChange={e => setZoom(Number(e.target.value))}

              className="w-24 accent-[#047857] cursor-pointer" />

            <button type="button" onClick={() => setZoom(p => Math.min(100, p + 5))}

              className="p-1 rounded text-[#7c766d] hover:text-[#1a1c1a] hover:bg-[#f2eee3] transition-colors">

              <ZoomIn className="w-3.5 h-3.5" />

            </button>

            <span className="font-mono text-[10px] text-[#047857] font-bold w-7 text-center">{zoom}%</span>

          </div>



          <div className="flex-1" />



          <button type="button"

            onClick={() => { setToast({ type: 'info', message: 'Select "Save as PDF" in the print dialog.' }); iframePrint(); }}

            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2eee3] border border-[#d6d3ce] text-[#4b463e] text-xs font-semibold hover:bg-[#e8e4da] transition-colors shrink-0">

            <FileText className="w-3.5 h-3.5 text-red-500" />

            Save PDF

          </button>



          <button type="button"

            onClick={() => { iframePrint(); if (onReturnToQueue) setTimeout(onReturnToQueue, 2000); else setTimeout(onBack, 2000); }}

            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#047857] hover:bg-[#064e3b] text-white text-xs font-bold transition-colors shadow-sm shrink-0">

            <Printer className="w-3.5 h-3.5" />

            Print Prescription

          </button>



          {onReturnToQueue && (

            <button type="button" onClick={onReturnToQueue}

              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f2eee3] border border-[#d6d3ce] text-[#4b463e] text-xs font-semibold hover:bg-[#e8e4da] transition-colors shrink-0">

              Done &amp; Close

            </button>

          )}

        </div>



        {/* ── DESKTOP Row 2 — options pill bar ── */}

        <div className="hidden md:flex items-center gap-2 px-4 h-10">

          <div className="inline-flex items-center gap-1 shrink-0">

            <Languages className="w-3 h-3 text-[#7c766d] shrink-0" />

            {LANGS.map(l => <span key={l.key}>{pill(selectedLanguage === l.key, () => setSelectedLanguage(l.key), l.label)}</span>)}

          </div>

          {sep}

          <div className="inline-flex items-center gap-1 shrink-0">

            {pill((clinicSettings.templateVariant || 'a4') === 'a4', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'a4' }, false), 'A4')}

            {pill(clinicSettings.templateVariant === 'dermatology', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'dermatology' }, false), 'Dermatology')}

            {pill(clinicSettings.templateVariant === 'general', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'general' }, false), 'General')}

          </div>

          {sep}

          {pill(printOnStationery, () => {

             const next = !printOnStationery;

             setPrintOnStationery(next);

             setHideHeader(next);

           }, printOnStationery ? '📄 On Pre-printed Pad' : '📑 On Plain Paper', 'bg-blue-600 text-white')}

          {sep}

          {pill(hideHeader, () => setHideHeader(h => !h), hideHeader ? '📄 No Header' : '📑 Full Header', 'bg-amber-600 text-white')}

          {sep}

          <button type="button" onClick={() => setIsSettingsOpen(true)}

            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-[#4b463e] border border-[#d6d3ce] hover:bg-[#f2eee3] transition-colors shrink-0">

            <Settings className="w-3 h-3 text-[#047857]" />

            Branding

          </button>

        </div>



        {/* ════════════════════════════════════════════════════

            MOBILE TOOLBAR  (shown below md, hidden on desktop)

        ════════════════════════════════════════════════════ */}



        {/* ── Mobile Row 1 ── */}

        <div className="md:hidden flex items-center justify-between gap-2 px-3 py-2.5">



          {/* Left: Back + Zoom */}

          <div className="flex items-center gap-2 min-w-0">

            <button type="button" onClick={onBack}

              className="p-2 rounded-xl bg-[#f2eee3] border border-[#cdc6ba] text-[#4b463e] hover:bg-[#e4e2e1] transition-colors shrink-0">

              <ArrowLeft className="w-4 h-4" />

            </button>



            <div className="inline-flex items-center gap-1 shrink-0 bg-[#f2eee3]/80 px-2 py-1.5 rounded-xl border border-[#e4e2e1]">

              <ZoomOut className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer shrink-0"

                onClick={() => setZoom(p => Math.max(20, p - 5))} />

              <input type="range" min="20" max="100" value={zoom}

                onChange={e => setZoom(Number(e.target.value))}

                className="w-20 accent-[#047857] cursor-pointer" />

              <ZoomIn className="w-3.5 h-3.5 text-[#7c766d] cursor-pointer shrink-0"

                onClick={() => setZoom(p => Math.min(100, p + 5))} />

              <span className="font-mono text-[10px] text-[#047857] font-bold w-7 text-center shrink-0">{zoom}%</span>

            </div>

          </div>



          {/* Right: Print + Options toggle */}

          <div className="flex items-center gap-2 shrink-0">

            <button type="button"

              onClick={() => { iframePrint(); if (onReturnToQueue) setTimeout(onReturnToQueue, 2000); else setTimeout(onBack, 2000); }}

              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#047857] hover:bg-[#064e3b] text-white text-xs font-bold transition-colors shadow shrink-0">

              <Printer className="w-4 h-4" />

              <span>Print</span>

            </button>



            <button type="button"

              onClick={() => setDrawerOpen(o => !o)}

              className={`p-2 rounded-xl border transition-colors shrink-0

                ${drawerOpen ? 'bg-[#047857] text-white border-[#047857]' : 'bg-[#f2eee3] text-[#4b463e] border-[#cdc6ba]'}`}>

              {drawerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}

            </button>

          </div>

        </div>



        {/* ── Mobile Drawer ── */}

        {drawerOpen && (

          <div className="md:hidden border-t border-[#e4e2e1] px-3 pb-3 pt-2.5 space-y-3 bg-[#fafaf8]">

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d] mb-1.5 flex items-center gap-1">

                <Languages className="w-3 h-3" /> Language

              </p>

              <div className="flex flex-wrap gap-1.5">

                {LANGS.map(l => <span key={l.key}>{drawerPill(selectedLanguage === l.key, () => setSelectedLanguage(l.key), l.label)}</span>)}

              </div>

            </div>

            <div>

              <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c766d] mb-1.5">Template</p>

              <div className="flex flex-wrap gap-1.5">

                {drawerPill((clinicSettings.templateVariant || 'a4') === 'a4', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'a4' }, false), 'A4 (Default)')}

                {drawerPill(clinicSettings.templateVariant === 'dermatology', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'dermatology' }, false), 'T1 — Dermatology')}

                {drawerPill(clinicSettings.templateVariant === 'general', () => updateClinicSettings({ ...clinicSettings, templateVariant: 'general' }, false), 'T2 — General')}

              </div>

            </div>

             <div className="flex flex-wrap gap-1.5 pt-0.5 border-t border-[#e4e2e1]">

               <button type="button" onClick={() => {

                 const next = !printOnStationery;

                 setPrintOnStationery(next);

                 setHideHeader(next);

               }}

                 className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all

                   ${printOnStationery ? 'bg-blue-100 text-blue-900 border-blue-300' : 'bg-white text-[#4b463e] border-[#cdc6ba]'}`}>

                 {printOnStationery ? '📄 Pre-printed Pad' : '📑 Plain Paper'}

               </button>

               <button type="button" onClick={() => setHideHeader(h => !h)}

                 className={`px-3 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all

                   ${hideHeader ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-white text-[#4b463e] border-[#cdc6ba]'}`}>

                 {hideHeader ? '📄 No Header' : '📑 Full Header'}

               </button>

              <button type="button" onClick={() => setIsSettingsOpen(true)}

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#cdc6ba] text-[#4b463e] hover:bg-[#f2eee3] transition-colors">

                <Settings className="w-3.5 h-3.5 text-[#047857]" />

                Branding

              </button>

              <button type="button"

                onClick={() => { setToast({ type: 'info', message: 'Select "Save as PDF" in the print dialog.' }); iframePrint(); }}

                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#cdc6ba] text-red-700 hover:bg-red-50 transition-colors">

                <FileText className="w-3.5 h-3.5" />

                Save as PDF

              </button>

              {onReturnToQueue && (

                <button type="button" onClick={onReturnToQueue}

                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-[#cdc6ba] text-[#4b463e] hover:bg-[#f2eee3] transition-colors">

                  Done &amp; Close

                </button>

              )}

            </div>

          </div>

        )}

      </div>



      {/* ════════════════ PREVIEW CANVAS ════════════════ */}

      <div ref={canvasRef}

        className="flex-1 w-full flex items-start sm:items-center justify-center overflow-auto p-2">

        <div

          className="shadow-2xl border border-slate-300/60 rounded-sm bg-white overflow-hidden"

          style={{ width: A4_W * scale, height: A4_H * scale, flexShrink: 0 }}

        >

          <div

            ref={printPageRef}

            className="print-page bg-white"

            style={{ width: A4_W, height: A4_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}

          >

            <PrintTemplate

              patient={patient}

              casePaper={casePaper}

              clinicSettings={clinicSettings}

              hideHeader={hideHeader}

              language={selectedLanguage}

              printOnStationery={printOnStationery}

            />

          </div>

        </div>

      </div>



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

