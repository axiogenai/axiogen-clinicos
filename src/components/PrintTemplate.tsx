import { useState, useEffect } from 'react';
import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';
import type { ClinicSettings } from '../data/clinicSettings';
import { calculateMedicineCount } from '../utils/countCalculator';
import { translateMedicalText, translateMedicalTextAsync, cleanFrequencyString } from '../utils/medicalTranslator';
export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';
interface PrintTemplateProps {
  patient: Patient;
  casePaper: CasePaper;
  clinicSettings: ClinicSettings;
  hideHeader?: boolean;
  language?: PrintLanguage;
  printOnStationery?: boolean;
}
export const getPatientLabels = (lang: PrintLanguage = 'marathi') => {
  switch (lang) {
    case 'english':
      return { name: 'Patient Name :', date: 'Date :', village: 'Address :', age: 'Age / Sex :' };
    case 'hindi':
      return { name: 'मरीज का नाम :', date: 'दिनांक :', village: 'पता / गांव :', age: 'आयु / लिंग :' };
    case 'kannada':
      return { name: 'ರೋಗಿಯ ಹೆಸರು :', date: 'ದಿನಾಂಕ :', village: 'ಸ್ಥಳ :', age: 'ವಯಸ್ಸು / ಲಿಂಗ :' };
    case 'marathi':
    default:
      return { name: 'पेशंटचे नाव :', date: 'दिनांक :', village: 'गाव :', age: 'वय / लिंग :' };
  }
};
export const getTableHeaders = (lang: PrintLanguage = 'marathi') => {
  switch (lang) {
    case 'english':
      return { srNo: 'Sr. No.', medName: 'Medicine Name', freq: 'Frequency & Instructions', duration: 'Duration', count: 'Count', advice: 'Counselling & Advice', investigation: 'Investigations Advised' };
    case 'hindi':
      return { srNo: 'Sr. No.', medName: 'दवा का नाम', freq: 'खुराक व निर्देश', duration: 'अवधि', count: 'कुल संख्या', advice: 'सलाह व परामर्श', investigation: 'जांच सलाह' };
    case 'kannada':
      return { srNo: 'Sr. No.', medName: 'ಔಷಧದ ಹೆಸರು', freq: 'ಪ್ರಮಾಣ ಮತ್ತು ಸೂಚನೆಗಳು', duration: 'ಅವಧಿ', count: 'ಒಟ್ಟು ಸಂಖ್ಯೆ', advice: 'ಸಲಹೆ ಮತ್ತು ಮಾರ್ಗದರ್ಶನ', investigation: 'ತನಿಖೆಗಳು' };
    case 'marathi':
    default:
      return { srNo: 'Sr. No.', medName: 'औषधाचे नाव', freq: 'मात्रा (वारंवारता) व सूचना', duration: 'कालावधी', count: 'एकूण', advice: 'सल्ला व समुपदेशन', investigation: 'तपासण्या सलाह' };
  }
};
export const translateDuration = (dur?: string, lang: PrintLanguage = 'marathi'): string => {
  if (!dur) return '-';
  const numMatch = dur.match(/\d+/);
  const num = numMatch ? numMatch[0] : '';
  const lower = dur.toLowerCase();
  if (lang === 'english') return dur;
  if (lang === 'hindi') {
    if (lower.includes('day')) return `${num} दिन`;
    if (lower.includes('week')) return `${num} हफ्ते`;
    if (lower.includes('month')) return `${num} महीना`;
    return dur;
  }
  if (lang === 'kannada') {
    if (lower.includes('day')) return `${num} ದಿನಗಳು`;
    if (lower.includes('week')) return `${num} ವಾರಗಳು`;
    if (lower.includes('month')) return `${num} ತಿಂಗಳು`;
    return dur;
  }
  // Marathi (default)
  if (lower.includes('day')) return `${num} दिवस`;
  if (lower.includes('week')) return `${num} आठवडे`;
  if (lower.includes('month')) return `${num} महिना`;
  return dur;
};
export const cleanFrequencyForPrint = (freq?: string): string => {
  return cleanFrequencyString(freq);
};
export const getPrintMedicineName = (med: any): string => {
  let name = (med.name || '').trim();
  const strength = (med.dosage || med.strength || '').trim();
  const isJunkPackSize = /^\d+\s*[\'"`;&]?\s*s?$/i.test(strength) || /[\d\`\'\,\-\;\:]+\s*(s|tab|tabs|cap|caps|strip|strips|kit|kits|vial|amp|nos|unit)\b/i.test(strength) || /^\d+$/i.test(strength);
  if (strength && !isJunkPackSize && !name.toLowerCase().includes(strength.toLowerCase())) {
    name = `${name} ${strength}`;
  }
  return name;
};
export const translateFrequency = (freq?: string, _medName?: string, lang: PrintLanguage = 'marathi'): string => {
  return translateMedicalText(freq, lang);
};
export const GroqTranslatedCell: React.FC<{
  freq?: string;
  medName?: string;
  lang: PrintLanguage;
  notes?: string;
}> = ({ freq, lang, notes }) => {
  const cleanFreq = cleanFrequencyForPrint(freq);
  const cleanNotes = (notes || '').trim();
  const fullTextToTranslate = cleanNotes
    ? (cleanFreq && cleanFreq !== '-' ? `${cleanFreq} - ${cleanNotes}` : cleanNotes)
    : cleanFreq;
  const [aiText, setAiText] = useState<string | null>(null);
  useEffect(() => {
    if (!fullTextToTranslate || fullTextToTranslate === '-') {
      setAiText(null);
      return;
    }
    let isMounted = true;
    translateMedicalTextAsync(fullTextToTranslate, lang)
      .then(translated => {
        if (isMounted && translated) {
          setAiText(translated);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [fullTextToTranslate, lang]);
  if (!fullTextToTranslate || fullTextToTranslate === '-') {
    return <span>-</span>;
  }
  const displayText = aiText || translateMedicalText(fullTextToTranslate, lang);
  return (
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3', fontSize: '11.5px', fontWeight: 600 }}>
      {displayText}
    </div>
  );
};
export const renderFrequencyCell = (freq?: string, medName?: string, lang: PrintLanguage = 'marathi', notes?: string) => {
  return <GroqTranslatedCell freq={freq} medName={medName} lang={lang} notes={notes} />;
};
export const toMarathiFrequency = (freq?: string, medName?: string): string => {
  return translateFrequency(freq, medName, 'marathi');
};
export const toMarathiDuration = (dur?: string): string => {
  if (!dur) return '-';
  const d = dur.trim();
  const toDevanagariDigits = (str: string) => {
    const map: Record<string, string> = {
      '0': '०', '1': '१', '2': '२', '3': '३', '4': '४',
      '5': '५', '6': '६', '7': '७', '8': '८', '9': '९'
    };
    return str.replace(/[0-9]/g, m => map[m] || m);
  };
  const translated = d
    .replace(/days?/gi, 'दिवस')
    .replace(/weeks?/gi, 'आठवडे')
    .replace(/months?/gi, 'महिने')
    .replace(/years?/gi, 'वर्षे')
    .replace(/continuous|till next visit/gi, 'पुढील भेटीपर्यंत');
  return toDevanagariDigits(translated);
};
export default function PrintTemplate({ patient, casePaper, clinicSettings, hideHeader = false, language = 'marathi', printOnStationery = false }: PrintTemplateProps) {
  const labels = getPatientLabels(language);
  const formatDate = (dateString?: string) => {
    if (!dateString) return '__________';
    try {
      const parts = dateString.split('-');
      let dateObj = new Date(dateString);
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
      const formatted = new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(dateObj);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateObj.setHours(0, 0, 0, 0);
      const diffTime = dateObj.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        return `${diffDays} Days (${formatted})`;
      }
      return formatted;
    } catch (e) {
      return dateString;
    }
  };
  const {
    clinicNameHi,
    clinicNameEn,
    doctors,
    address,
    phone,
    openingHours,
    closedDay,
    headerBgColor,
    pharmacyInfo,
    templateVariant = 'dermatology',
    sections = {
      showPastHistory: true,
      showDrugHistory: true,
      showInvestigations: true,
      showCounselling: true,
      showWarnings: true,
      showFollowUp: true,
      showSignature: true,
    },
  } = clinicSettings;
  const doc1 = (doctors && doctors[0] && doctors[0].name.includes('प्रमोद')) ? doctors[0] : (doctors && doctors[1] && doctors[1].name.includes('प्रमोद')) ? doctors[1] : {
    name: 'डॉ. प्रमोद सुरेश शिनगारे',
    title: 'MD (Ayu) - D.Dermatology (Ay.)',
    subTitle: '(MUHS)',
    regNo: 'Reg. No. I-87218-A',
    specialty: 'त्वचारोग व सौंदर्य विशेष तज्ज्ञ',
  };
  const doc2 = (doctors && doctors[0] && doctors[0].name.includes('प्रियांका')) ? doctors[0] : (doctors && doctors[1] && doctors[1].name.includes('प्रियांका')) ? doctors[1] : {
    name: 'डॉ. प्रियांका प्रमोद शिनगारे',
    title: 'BHMS, FCHD (MUHS)',
    subTitle: '(Consultant Homeopathy Dermatologist)',
    regNo: 'Reg. No. 73338',
    specialty: 'त्वचारोग तज्ज्ञ',
  };
  const isGeneralPad = templateVariant === 'general';
  return (
    <div
      className="rx-paper-root"
      style={{
        boxSizing: 'border-box',
        width: '220mm',
        minWidth: '220mm',
        maxWidth: '220mm',
        height: '270mm',
        minHeight: '270mm',
        maxHeight: '270mm',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        fontSize: '11px',
        lineHeight: 1.15,
        overflow: 'hidden',
        margin: 0,
        padding: 0,
        pageBreakAfter: 'avoid' as any,
        pageBreakInside: 'avoid' as any,
      }}
    >
      {/* ══════════════════════════════════════════════════════ */}
      {/* HEADER SECTION (Top Margin 9mm + Header 45mm = 54mm)   */}
      {/* ══════════════════════════════════════════════════════ */}
      {/* HEADER / TOP OFFSET: 60mm (6cm) for General A5 Pad, 54mm for Dermatology Pad */}
      <div 
        className="clinic-print-header" 
        style={{ 
          height: isGeneralPad ? '60mm' : '54mm',
          minHeight: isGeneralPad ? '60mm' : '54mm',
          maxHeight: isGeneralPad ? '60mm' : '54mm',
          paddingTop: isGeneralPad ? '0' : '9mm', 
          paddingLeft: '10mm',
          paddingRight: '10mm',
          boxSizing: 'border-box',
          visibility: isGeneralPad ? 'hidden' : ((hideHeader || printOnStationery) ? 'hidden' : 'visible'),
        }}
      >
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '4px' }}>
          {clinicSettings.logoUrl ? (
            <img
              src={clinicSettings.logoUrl}
              alt="Clinic Logo"
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain',
                mixBlendMode: 'multiply',
                display: 'block',
              }}
            />
          ) : (
            <img
              src="/logo-symbol.png"
              alt="Clinic Logo"
              style={{
                height: '48px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '38px',
                fontWeight: 700,
                color: '#93231f',
                fontFamily: "'DV-TTYogesh', 'Shivaji', 'Amita', 'Karma', serif",
                lineHeight: 1,
              }}
            >
              {clinicNameHi || 'शिनगारे'}
            </span>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 700,
                color: '#3b2c63',
                fontFamily: "'Mukta', 'Poppins', sans-serif",
                lineHeight: 1,
                paddingTop: '4px',
              }}
            >
              {(!clinicNameEn || clinicNameEn.toLowerCase().includes('clinic'))
                ? 'स्किन & कॉस्मेटीक क्लिनिक'
                : clinicNameEn}
            </span>
          </div>
        </div>
        {/* Doctors & Timings Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 5px',
            marginBottom: '3px',
            fontSize: '11px',
            lineHeight: 1.15,
          }}
        >
          {/* Doctor 1 (Left) */}
          <div style={{ textAlign: 'left', width: '33%' }}>
            <div style={{ color: '#29558c', fontWeight: 700, fontSize: '15px', fontFamily: "'Mukta', sans-serif", marginBottom: '1px' }}>
              {doc1.name}
            </div>
            {doc1.title && <div style={{ fontSize: '9px', fontWeight: 700, color: '#222' }}>{doc1.title}</div>}
            {doc1.subTitle && <div style={{ fontSize: '9px', fontWeight: 700, color: '#222' }}>{doc1.subTitle}</div>}
            {doc1.regNo && <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc1.regNo}</div>}
            {doc1.specialty && <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '10.5px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{(doc1.specialty || '').replace('विशेषज्ञ', 'विशेष तज्ज्ञ')}</div>}
          </div>
          {/* Timings (Center) */}
          <div
            style={{
              width: '33%',
              textAlign: 'center',
              fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
              fontWeight: 500,
              fontSize: '11px',
              color: '#222',
              lineHeight: 1.2,
            }}
          >
            <div style={{ whiteSpace: 'pre-line' }}>
              {'✤ वेळ : ' + (openingHours || 'सकाळी १० ते सायं. ६ पर्यंत') + '\n✤ ' + (closedDay || 'दर रविवारी बंद राहिल.')}
            </div>
            <div style={{ fontWeight: 700, fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif", marginTop: '2px', fontSize: '13px' }}>
              Mo. {phone || '7249727104 / 9657727104'}
            </div>
          </div>
          {/* Doctor 2 (Right) */}
          <div style={{ textAlign: 'right', width: '33%' }}>
            <div style={{ color: '#29558c', fontWeight: 700, fontSize: '15px', fontFamily: "'Mukta', sans-serif", marginBottom: '1px' }}>
              {doc2.name}
            </div>
            {doc2.title && <div style={{ fontSize: '9px', fontWeight: 700, color: '#222' }}>{doc2.title}</div>}
            {doc2.subTitle && <div style={{ fontSize: '9px', fontWeight: 700, color: '#222' }}>{doc2.subTitle}</div>}
            {doc2.regNo && <div style={{ fontSize: '9px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc2.regNo}</div>}
            {doc2.specialty && <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '10.5px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{(doc2.specialty || '').replace('विशेषज्ञ', 'विशेष तज्ज्ञ')}</div>}
          </div>
        </div>
        {/* Address Green Strip */}
        <div
          style={{
            background: headerBgColor || '#89b740',
            color: '#222',
            textAlign: 'center',
            padding: '2px 0',
            fontFamily: "'Mukta', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          {address || 'एस.टी.स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. 6, पेठ वडगांव'}
        </div>
      </div>
      {/* ══════════════════════════════════════════════════════ */}
      {/* PATIENT INFO DEMOGRAPHICS (y: 54mm to 70mm = 16mm H)   */}
      {/* ══════════════════════════════════════════════════════ */}
      <div
        style={{
          height: isGeneralPad ? "8mm" : "19mm",
          minHeight: isGeneralPad ? "8mm" : "19mm",
          maxHeight: isGeneralPad ? "8mm" : "19mm",
          position: "relative",
          boxSizing: "border-box",
          padding: isGeneralPad ? "0 10mm 0 10mm" : "4mm 10mm 1mm 20mm",
          borderBottom: (printOnStationery || isGeneralPad) ? "none" : "2px solid #a53b3b",
          fontFamily: "'Mukta', sans-serif",
          fontSize: "13px",
          fontWeight: 600,
        }}
      >
        {printOnStationery ? (
          /* PRE-PRINTED STATIONERY MODE: Absolute positioning on top of preprinted slots */
          <div style={{ position: "relative", width: "100%", height: "100%", fontWeight: 700, color: "#111" }}>
            {/* Name slot (x = 4.0 cm = 40mm from left edge -> inside pad container: left 20mm) */}
            <div style={{ position: "absolute", top: "5.0mm", left: "20mm", fontSize: "13px" }}>
              {patient.name}
            </div>
            {/* Date slot */}
            <div style={{ position: "absolute", top: "3.0mm", left: "138.5mm", fontSize: "12.5px" }}>
              {formatDate(casePaper.date)}
            </div>
            {/* Village slot */}
            <div style={{ position: "absolute", top: "11.0mm", left: "20mm", fontSize: "12.5px" }}>
              {patient.village || ""}
            </div>
            {/* Age/Sex slot */}
            <div style={{ position: "absolute", top: "9.2mm", left: "133mm", fontSize: "12.5px" }}>
              {patient.age} Yrs / {patient.gender === "M" ? "Male" : "Female"}
            </div>
          </div>
        ) : isGeneralPad ? (
          /* GENERAL PAD (PLAIN/STATIONERY): Only Date displayed at top right, name/age/village removed */
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", width: "100%", height: "100%" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#111" }}>
              {labels.date} {formatDate(casePaper.date)}
            </span>
          </div>
        ) : (
          /* DERMATOLOGY PLAIN PAPER: Fully Dynamic Flexbox Layout with Name, Date, Village, Age */
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", height: "100%" }}>
            {/* Row 1: Name & Date */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flex: "1 1 62%", minWidth: 0 }}>
                <span style={{ whiteSpace: "nowrap", fontSize: "12.5px", fontWeight: 600 }}>{labels.name}</span>
                <span style={{ flex: 1, borderBottom: "1px solid #333", paddingLeft: "4px", paddingBottom: "1px", fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {patient.name}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flex: "0 0 36%", minWidth: 0 }}>
                <span style={{ whiteSpace: "nowrap", fontSize: "12.5px", fontWeight: 600 }}>{labels.date}</span>
                <span style={{ flex: 1, borderBottom: "1px solid #333", paddingLeft: "4px", paddingBottom: "1px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                  {formatDate(casePaper.date)}
                </span>
              </div>
            </div>
            {/* Row 2: Village/Address & Age/Sex */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flex: "1 1 62%", minWidth: 0 }}>
                <span style={{ whiteSpace: "nowrap", fontSize: "12.5px", fontWeight: 600 }}>{labels.village}</span>
                <span style={{ flex: 1, borderBottom: "1px solid #333", paddingLeft: "4px", paddingBottom: "1px", fontWeight: 700, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {patient.village || ""}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flex: "0 0 36%", minWidth: 0 }}>
                <span style={{ whiteSpace: "nowrap", fontSize: "12.5px", fontWeight: 600 }}>{labels.age}</span>
                <span style={{ flex: 1, borderBottom: "1px solid #333", paddingLeft: "4px", paddingBottom: "1px", fontWeight: 700, color: "#111", whiteSpace: "nowrap" }}>
                  {patient.age} Yrs / {patient.gender === "M" ? "Male" : "Female"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* ══════════════════════════════════════════════════════MAIN BODY AREA (y: 70mm to 245mm = 175mm H)            */}
      {/* ══════════════════════════════════════════════════════ */}
      {isGeneralPad ? (
        /* OPTION A: TEMPLATE 2 - GENERAL MEDICINE A5 PAD (PURE TEXT, NO TABLE, NO HEADERS, NO BORDERS) */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '172mm', overflow: 'hidden', boxSizing: 'border-box' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: '6px 20mm 12px 20mm',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Date line on top right */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 700, fontSize: '13px', color: '#111' }}>
                {labels.date} {formatDate(casePaper.date)}
              </span>
            </div>

            {/* Pure Text Medicine List (No table, no borders, no Sr No header) */}
            <div style={{ marginTop: '6px', flex: 1 }}>
              {casePaper.medicines && casePaper.medicines.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {casePaper.medicines.map((med, index) => {
                    const displayName = getPrintMedicineName(med);
                    const count = calculateMedicineCount(med);
                    return (
                      <div
                        key={index}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '26px minmax(140px, 1fr) minmax(160px, auto) 80px 45px',
                          alignItems: 'baseline',
                          gap: '8px',
                          fontSize: '13px',
                          lineHeight: 1.35,
                          padding: '3px 0',
                          borderBottom: '1px dotted #e2e8f0',
                        }}
                      >
                        <span style={{ fontWeight: 700, color: '#333' }}>{index + 1}.</span>
                        <span style={{ fontWeight: 700, color: '#111' }}>{displayName}</span>
                        <span style={{ fontWeight: 600, color: '#222' }}>
                          {renderFrequencyCell(med.frequency, med.name, language, med.instructions || med.notes)}
                        </span>
                        <span style={{ color: '#444', fontSize: '12px' }}>{translateDuration(med.duration, language)}</span>
                        <span style={{ fontWeight: 700, color: '#047857', textAlign: 'right', fontSize: '12.5px' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ flex: 1, minHeight: '180px' }} />
              )}

              {casePaper.counsellingDone && casePaper.counsellingDone.length > 0 && (
                <div style={{ marginTop: '14px', fontSize: '12px', fontWeight: 600, borderTop: '1px dashed #cbd5e1', paddingTop: '8px' }}>
                  <div style={{ fontWeight: 700, marginBottom: '3px', color: '#111' }}>Special Advice / Instructions:</div>
                  <div style={{ color: '#333' }}>{casePaper.counsellingDone.join(' • ')}</div>
                </div>
              )}
            </div>

            {/* Signature & Follow-up Line */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '12px',
                color: '#222',
                marginTop: 'auto',
                paddingTop: '6px',
                paddingBottom: '2px',
                borderTop: '1px dashed #999',
              }}
            >
              <span>Patient Signature - </span>
              <span style={{ fontWeight: 700, color: '#111' }}>
                <span>Follow up - </span>
                <span>{formatDate(casePaper.followUpDate)}</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* OPTION B: TEMPLATE 1 - DERMATOLOGY / DETAILED PAD LAYOUT */
        <div style={{ display: 'flex', height: '172mm', width: '220mm', overflow: printOnStationery ? 'visible' : 'hidden', borderTop: printOnStationery ? 'none' : '3px double #a53b3b' }}>
          {/* ─── LEFT SIDEBAR (x: 20mm to 73mm = 53mm W, y: 70mm to 245mm = 175mm H) ─── */}
          <aside
            style={{
              width: '53mm',
              minWidth: '53mm',
              maxWidth: '53mm',
              marginLeft: '20mm',
              height: '172mm',
              borderRight: printOnStationery ? 'none' : '3px double #a53b3b',
              padding: '3mm 3mm',
              fontFamily: "'Inter', sans-serif",
              fontSize: '9.5px',
              fontWeight: 500,
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex',
              visibility: printOnStationery ? 'hidden' : 'visible',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            {/* Past History */}
            {sections.showPastHistory !== false && (
              <div style={{ marginBottom: '3px' }}>
                {!printOnStationery && (
                  <>
                    <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                      Past History
                    </div>
                    <div style={{ fontSize: '9px', marginBottom: '2px', color: '#555' }}>(DM/HTN/Thyroid/Autoimmune)</div>
                  </>
                )}
                {printOnStationery && <div style={{ height: '14px' }} />}
                <div style={{ fontWeight: 700, color: '#111', paddingLeft: '2px', fontSize: '10px', whiteSpace: 'pre-wrap', visibility: printOnStationery ? 'hidden' : 'visible' }}>
                  {casePaper.pastHistory || ''}
                </div>
              </div>
            )}
            {!printOnStationery && <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />}
            {/* Drug History / Allergy History */}
            {sections.showDrugHistory !== false && (
              <div style={{ marginBottom: '3px' }}>
                {!printOnStationery && (
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                    Drug History/Allergy History
                  </div>
                )}
                {printOnStationery && <div style={{ height: '10px' }} />}
                <div style={{ fontWeight: 700, color: '#7c2222', paddingLeft: '2px', fontSize: '9.5px', whiteSpace: 'pre-wrap', visibility: printOnStationery ? 'hidden' : 'visible' }}>
                  {casePaper.allergies || ''}
                </div>
              </div>
            )}
            {!printOnStationery && <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />}
            {/* Investigations Advised */}
            {sections.showInvestigations !== false && (
              <div style={{ marginBottom: '3px' }}>
                {!printOnStationery && (
                  <>
                    <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                      Investigations Advised
                    </div>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '1px', marginBottom: '1px', fontWeight: 600, fontSize: '9px' }}>
                      <span>■ CBC</span>
                      <span>■ LFT</span>
                      <span>■ BSL®</span>
                    </div>
                    <div style={{ marginBottom: '2px', fontWeight: 600, fontSize: '9px' }}>
                      <span>■ Serum Creatinine</span>
                    </div>
                  </>
                )}
                {(casePaper.investigationsAdvised && (Array.isArray(casePaper.investigationsAdvised) ? casePaper.investigationsAdvised.length > 0 : !!casePaper.investigationsAdvised)) ? (
                  <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px', marginTop: printOnStationery ? '16px' : '0' }}>
                    Advised: {Array.isArray(casePaper.investigationsAdvised) ? casePaper.investigationsAdvised.join(', ') : casePaper.investigationsAdvised}
                  </div>
                ) : null}
              </div>
            )}
            {/* Provisional/Final Diagnosis */}
            <div style={{ marginTop: '2px', marginBottom: '4px' }}>
              {!printOnStationery && (
                <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, background: '#fff', fontSize: '9.5px' }}>
                  Provisional/Final Diagnosis
                </div>
              )}
              {printOnStationery && <div style={{ height: '10px' }} />}
              <div style={{ fontWeight: 700, color: '#111', marginTop: '1px', paddingLeft: '2px', fontSize: '10.5px', whiteSpace: 'pre-wrap', visibility: printOnStationery ? 'hidden' : 'visible' }}>
                {casePaper.complaint || ''}
              </div>
            </div>
            {!printOnStationery && <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />}
            {/* Patient Counselling Documentation */}
            {sections.showCounselling !== false && (
              <div style={{ marginTop: '4px' }}>
                {!printOnStationery && (
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', fontWeight: 600, lineHeight: 1.1, color: '#1e3a8a', background: '#fff', fontSize: '9px' }}>
                    Patient Counselling<br />Documentation
                  </div>
                )}
                {!printOnStationery && (
                <div style={{ marginTop: '3px' }}>
                  {[
                    'Verbal consent taken',
                    'Diagnosis Explained',
                    'Risk&side effects explained',
                    'Monitoring Plan Explained',
                  ].map((item, i) => {
                    const isChecked = Array.isArray(casePaper.counsellingDone) ? (casePaper.counsellingDone.length === 0 || casePaper.counsellingDone.includes(item)) : true;
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', fontSize: '9.5px' }}>
                        <span>{item}</span>
                        <span style={{ border: '1px solid #333', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>
                          {isChecked ? '✓' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
                )}
              </div>
            )}
            {!printOnStationery && (
              <>
                <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />
                {/* Warning Explained */}
                {sections.showWarnings !== false && (
                  <div style={{ marginTop: '3px' }}>
                    <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, background: '#fff', fontSize: '9px' }}>
                      Warning Explained-
                    </div>
                    <div style={{ fontSize: '9px', lineHeight: 1.15, marginTop: '2px' }}>
                      Fever/Mouth Ulcer/ Breathlessness<br />
                      Yellowish Eyes-Stop drug & Report immediately.
                    </div>
                  </div>
                )}
                {/* Circular Stamp */}
                <div
                  style={{
                    border: '1.5px solid #111',
                    borderRadius: '50%',
                    width: '125px',
                    height: '125px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    textAlign: 'center',
                    fontSize: '6px',
                    lineHeight: 1.05,
                    margin: '3px auto 1px',
                    padding: '8px 6px',
                    fontWeight: 600,
                    color: '#111',
                    boxSizing: 'border-box',
                  }}
                >
                  <strong style={{ fontSize: '6.8px', display: 'block', marginBottom: '1px' }}>DRUG VERBAL CONSENT</strong>
                  Dx & indication explained.<br />
                  Risks: Hepatotoxicity, Severe<br />
                  anemia, Hemolysis, Dapsone<br />
                  syndrome, Infection risk.<br />
                  Severe cutaneous adverse<br />
                  reactions (SJS/TEN).<br />
                  Teratogenicity discussed.<br />
                  Monitoring & alternatives.<br />
                  Pt verbalized understanding<br />
                  & consented.
                </div>
              </>
            )}
          </aside>
          {/* ─── RIGHT MAIN AREA (Rx + Medicines) (x: 73mm to 218mm = 145mm W, y: 70mm to 245mm = 175mm H) ─── */}
          <main
            style={{
              width: '145mm',
              minWidth: '145mm',
              maxWidth: '145mm',
              height: '172mm',
              padding: '3mm 6mm',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
            }}
          >
            <div>
              {/* Top Rx Title & Caduceus Emblem Row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', height: '10mm', visibility: printOnStationery ? 'hidden' : 'visible' }}>
                <div style={{ fontSize: '26px', fontFamily: "'EB Garamond', Georgia, serif", fontWeight: 800, fontStyle: 'italic', color: '#111' }}>
                  Rx
                </div>
                {!printOnStationery && (
                  <svg width="34" height="38" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="47.5" y="14" width="5" height="88" rx="2.5" fill="#2d773f" />
                    <circle cx="50" cy="12" r="5" fill="#2d773f" />
                    <path d="M 46 22 C 32 10, 15 15, 8 21 C 22 26, 36 27, 46 30 Z" fill="#2d773f" />
                    <path d="M 45 27 C 32 20, 20 22, 12 27 C 24 30, 36 30, 45 32 Z" fill="#2d773f" />
                    <path d="M 54 22 C 68 10, 85 15, 92 21 C 78 26, 64 27, 54 30 Z" fill="#2d773f" />
                    <path d="M 55 27 C 68 20, 80 22, 88 27 C 76 30, 64 30, 55 32 Z" fill="#2d773f" />
                    <ellipse cx="50" cy="38" rx="18" ry="7.5" stroke="#2d773f" strokeWidth="4.5" fill="none" />
                    <ellipse cx="50" cy="54" rx="15" ry="7" stroke="#2d773f" strokeWidth="4.5" fill="none" />
                    <ellipse cx="50" cy="69" rx="12" ry="6" stroke="#2d773f" strokeWidth="4" fill="none" />
                    <ellipse cx="50" cy="82" rx="9" ry="5" stroke="#2d773f" strokeWidth="3.5" fill="none" />
                    <ellipse cx="50" cy="93" rx="6" ry="3.5" stroke="#2d773f" strokeWidth="3" fill="none" />
                  </svg>
                )}
              </div>
              {/* Pure Text Medicine Prescription List (No table borders, no headers) */}
              <div style={{ marginTop: printOnStationery ? '10mm' : '4px' }}>
                {casePaper.medicines && casePaper.medicines.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {casePaper.medicines.map((med, index) => {
                      const displayName = getPrintMedicineName(med);
                      const count = calculateMedicineCount(med);
                      return (
                        <div
                          key={index}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '22px minmax(110px, 1fr) minmax(130px, auto) 55px 35px',
                            alignItems: 'baseline',
                            gap: '6px',
                            fontSize: '11.5px',
                            lineHeight: 1.3,
                            padding: '2.5px 0',
                            borderBottom: printOnStationery ? 'none' : '1px dotted #cbd5e1',
                          }}
                        >
                          <span style={{ fontWeight: 700, color: '#333', fontFamily: 'monospace', fontSize: '11px' }}>{index + 1}.</span>
                          <span style={{ fontWeight: 700, color: '#111' }}>{displayName}</span>
                          <span style={{ fontWeight: 600, color: '#222' }}>
                            {renderFrequencyCell(med.frequency, med.name, language, med.instructions || med.notes)}
                          </span>
                          <span style={{ color: '#333', fontSize: '11px' }}>{translateDuration(med.duration, language)}</span>
                          <span style={{ fontWeight: 700, color: '#047857', textAlign: 'right', fontSize: '11.5px' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ minHeight: '120px' }} />
                )}
              </div>
              {casePaper.counsellingDone && casePaper.counsellingDone.length > 0 && (
                <div style={{ marginTop: '8px', fontSize: '10.5px', fontWeight: 600 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Special Advice:</div>
                  <div>{casePaper.counsellingDone.join(' • ')}</div>
                </div>
              )}
            </div>
            {/* Signature & Follow-up Line */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 600,
                fontSize: '11.5px',
                color: '#222',
                marginTop: 'auto',
                paddingTop: '4px',
                paddingBottom: '2px',
                borderTop: printOnStationery ? 'none' : '1px dashed #999',
              }}
            >
              <span style={{ visibility: printOnStationery ? 'hidden' : 'visible' }}>Patient Signature - </span>
              <span style={{ fontWeight: 700, color: '#111', display: 'inline-block', transform: printOnStationery ? 'translate(-12mm, 14.7mm)' : 'none' }}>
                <span style={{ visibility: printOnStationery ? 'hidden' : 'visible' }}>Follow up - </span>
                <span>{formatDate(casePaper.followUpDate)}</span>
              </span>
            </div>
          </main>
        </div>
      )}
      {/* ══════════════════════════════════════════════════════ */}
      {/* FOOTER SECTION (y: 245mm to 265mm = 20mm H, 5mm B-Margin) */}
      {/* ══════════════════════════════════════════════════════ */}
      <footer
        style={{
          height: '20mm',
          minHeight: '20mm',
          maxHeight: '20mm',
          borderTop: printOnStationery ? 'none' : '2px solid #a53b3b',
          padding: '2mm 10mm 4mm 20mm',
          fontSize: '9.5px',
          fontWeight: 600,
          lineHeight: 1.15,
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {!printOnStationery && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
              <div style={{ flex: '0 0 62%' }}>
                <div style={{ marginBottom: '1px' }}>☑ Methotrexate- weekly dosing explained & overdose risk etc. Explained.</div>
                <div style={{ marginBottom: '1px' }}>☑ JAK inhibitors - DVT/PE warning explained & leukopenia etc. Explained.</div>
                <div style={{ marginBottom: '1px' }}>☑ DAPSONE - DAPSONE syndrome, organ toxicity, Jaundice risk etc. Explained</div>
              </div>
              <div style={{ flex: '0 0 38%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span>☑ </span>
                  <span style={{ lineHeight: 1.15 }}>
                    Azathioprine-related myelosuppression &<br />
                    hair fall etc. Explained
                  </span>
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '11px', marginTop: '2px', lineHeight: 1.2 }}>
              - त्वचा विकाराची औषधे इतर औषधांप्रमाणे महाग असू शकतात. - चिठ्ठीमधील औषधे दिलेल्या अवधीसाठीच आहेत.<br />
              - काही विकार बरे होण्यास वेळ लागतो. तसेच काही विकार औषधानंतर काही प्रमाणात वाढतात व त्यानंतर बरे होतात.
            </div>
          </>
        )}
        {pharmacyInfo && (
          <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '10.5px', paddingTop: printOnStationery ? '10px' : '2px', borderTop: printOnStationery ? 'none' : '1px solid #333', marginTop: '2px' }}>
            {pharmacyInfo}
          </div>
        )}
      </footer>
    </div>
  );
}