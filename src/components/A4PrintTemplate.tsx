import { useState, useEffect } from 'react';
import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';
import type { ClinicSettings } from '../data/clinicSettings';
import { calculateMedicineCount } from '../utils/countCalculator';
import { translateMedicalText, translateMedicalTextAsync, cleanFrequencyString } from '../utils/medicalTranslator';
import { formatLocalizedDate, formatFollowUpDate } from '../utils/dateFormatter';

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

interface A4PrintTemplateProps {
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
      return { 
        name: 'Patient Name :', 
        date: 'Date :', 
        village: 'Address :', 
        age: 'Age / Sex :',
        followUp: 'Follow up - ',
        patientSignature: 'Patient Signature - ',
      };
      return { 
        name: 'मरीज का नाम :', 
        date: 'दिनांक :', 
        village: 'पता / गांव :', 
        age: 'आयु / लिंग :',
        followUp: 'पुनर्भेट - ',
        patientSignature: 'मरीज के हस्ताक्षर - ',
      };
    case 'kannada':
      return { 
        name: 'ರೋಗಿಯ ಹೆಸರು :', 
        date: 'ದಿನಾಂಕ :', 
        village: 'ಸ್ಥಳ :', 
        age: 'ವಯಸ್ಸು / ಲಿಂಗ :',
        followUp: 'ಮರುಭೇಟಿ - ',
        patientSignature: 'ರೋಗಿಯ ಸಹಿ - ',
      };
    case 'marathi':
    default:
      return { 
        name: 'पेशंटचे नाव :', 
        date: 'दिनांक :', 
        village: 'गाव :', 
        age: 'वय / लिंग :',
        followUp: 'पुढील भेट - ',
        patientSignature: 'पेशंटची सही - ',
      };
  }
};

export const getTableHeaders = (lang: PrintLanguage = 'marathi') => {
  switch (lang) {
    case 'english':
      return { srNo: 'Sr. No.', medName: 'Medicine Name', freq: 'Frequency & Instructions', duration: 'Duration', count: 'Count' };
    case 'hindi':
      return { srNo: 'Sr. No.', medName: 'दवा का नाम', freq: 'खुराक व निर्देश', duration: 'अवधि', count: 'कुल संख्या' };
    case 'kannada':
      return { srNo: 'Sr. No.', medName: 'ಔಷಧದ ಹೆಸರು', freq: 'ಪ್ರಮಾಣ ಮತ್ತು ಸೂಚನೆಗಳು', duration: 'ಅವಧಿ', count: 'ಒಟ್ಟು ಸಂಖ್ಯೆ' };
    case 'marathi':
    default:
      return { srNo: 'Sr. No.', medName: 'औषधाचे नाव', freq: 'मात्रा (वारंवारता) व सूचना', duration: 'कालावधी', count: 'एकूण' };
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

export const getPrintMedicineName = (med: any): string => {
  let name = (med.name || '').trim();
  const strength = (med.dosage || med.strength || '').trim();
  const isJunkPackSize = /^\d+\s*[\'"`;&]?\s*s?$/i.test(strength) || /[\d\`\'\,\-\;\:]+\s*(s|tab|tabs|cap|caps|strip|strips|kit|kits|vial|amp|nos|unit)\b/i.test(strength) || /^\d+$/i.test(strength);
  if (strength && !isJunkPackSize && !name.toLowerCase().includes(strength.toLowerCase())) {
    name = `${name} ${strength}`;
  }
  return name;
};

export const GroqTranslatedCell: React.FC<{
  freq?: string;
  medName?: string;
  lang: PrintLanguage;
  notes?: string;
}> = ({ freq, lang, notes }) => {
  const cleanFreq = cleanFrequencyString(freq);
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
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.35', fontSize: '12.5px', fontWeight: 600, color: '#222' }}>
      {displayText}
    </div>
  );
};

export const renderFrequencyCell = (freq?: string, medName?: string, lang: PrintLanguage = 'marathi', notes?: string) => {
  return <GroqTranslatedCell freq={freq} medName={medName} lang={lang} notes={notes} />;
};

const cleanClinicalText = (text?: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (
    /^no known allergies$/i.test(trimmed) ||
    /^no known drug allergies/i.test(trimmed) ||
    /^walk-in consultation$/i.test(trimmed) ||
    /^walk in consultation$/i.test(trimmed) ||
    /^walk-in$/i.test(trimmed) ||
    /^walk in$/i.test(trimmed)
  ) {
    return '';
  }
  return text;
};

export default function A4PrintTemplate({
  patient,
  casePaper,
  clinicSettings,
  hideHeader = false,
  language = 'marathi',
  printOnStationery = false,
}: A4PrintTemplateProps) {
  const labels = getPatientLabels(language);
  const headers = getTableHeaders(language);

  const formatDate = (dateString?: string, isFollowUp = false) => {
    if (!dateString) return '__________';
    return isFollowUp 
      ? formatFollowUpDate(dateString, language)
      : formatLocalizedDate(dateString, language);
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
    sections = {
      showPastHistory: true,
      showDrugHistory: true,
      showInvestigations: true,
      showCounselling: true,
      showWarnings: true,
    },
  } = clinicSettings;

  const priyankaDoc = doctors?.find(
    (d: any) => d.name.includes('प्रियांका') || d.name.toLowerCase().includes('priyanka')
  );
  const pramodDoc = doctors?.find(
    (d: any) =>
      (d.name.includes('सुरेश') ||
        d.name.includes('प्रमोद सुरेश') ||
        d.name.startsWith('डॉ. प्रमोद')) &&
      !d.name.includes('प्रियांका')
  );

  const doc1Raw = priyankaDoc || (pramodDoc ? doctors?.find((d: any) => d !== pramodDoc) : doctors?.[0]);
  const doc1 = {
    name: doc1Raw?.name || 'डॉ. प्रियांका प्रमोद शिनगारे',
    title:
      doc1Raw?.title && doc1Raw.title.includes('CCHC')
        ? doc1Raw.title
        : 'BHMS, FCHD, CCHC, CCMP (MUHS)',
    subTitle:
      doc1Raw?.subTitle && doc1Raw.subTitle.includes('Cosmetologist')
        ? doc1Raw.subTitle
        : '(Consultant Homeopathy Dermatologist & Cosmetologist)',
    regNo: doc1Raw?.regNo || 'Reg. No. 73338',
    specialty: doc1Raw?.specialty || 'त्वचारोग तज्ञ',
  };

  const doc2Raw = pramodDoc || (priyankaDoc ? doctors?.find((d: any) => d !== priyankaDoc) : doctors?.[1]);
  const doc2 = {
    name: doc2Raw?.name || 'डॉ. प्रमोद सुरेश शिनगारे',
    title: doc2Raw?.title || 'MD (Ayu) - D.Dermatology (Ay.)',
    subTitle: doc2Raw?.subTitle || '(MUHS)',
    regNo: doc2Raw?.regNo || 'Reg. No. I-87218-A',
    specialty: doc2Raw?.specialty || 'त्वचारोग व सौंदर्य विशेष तज्ञ',
  };

  return (
    <div
      className="rx-paper-root rx-a4-dedicated"
      style={{
        boxSizing: 'border-box',
        width: '210mm',
        minWidth: '210mm',
        maxWidth: '210mm',
        height: '297mm',
        minHeight: '297mm',
        maxHeight: '297mm',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        color: '#222',
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
      {/* ══════════════════════════════════════════════════════════ */}
      {/* 1. TOP CLINIC HEADER (Left: 8mm, Right: 8mm, Top: 11mm)    */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header
        className="clinic-print-header"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          paddingTop: '11mm',
          paddingLeft: '8mm',
          paddingRight: '8mm',
          visibility: hideHeader || printOnStationery ? 'hidden' : 'visible',
          marginBottom: '2.5mm',
        }}
      >
        {/* Brand Banner: Logo + Main Hindi Title + Sub-brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '3px',
          }}
        >
          {clinicSettings.logoUrl ? (
            <img
              src={clinicSettings.logoUrl}
              alt="Logo"
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
              alt="Logo"
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
                fontSize: '44px',
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
                fontSize: '22px',
                fontWeight: 700,
                color: '#3b2c63',
                fontFamily: "'Mukta', 'Poppins', sans-serif",
                lineHeight: 1,
                paddingTop: '3px',
              }}
            >
              {clinicNameEn && !clinicNameEn.toLowerCase().includes('clinic')
                ? clinicNameEn
                : 'स्किन & कॉस्मेटीक क्लिनिक'}
            </span>
          </div>
        </div>

        {/* 3-Column Doctors & Timing Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '0 4px',
            marginBottom: '4px',
            fontSize: '10.5px',
            lineHeight: 1.15,
          }}
        >
          {/* Doctor 1 (Left) */}
          <div style={{ textAlign: 'left', width: '34%' }}>
            <div
              style={{
                color: '#29558c',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: "'Mukta', sans-serif",
                lineHeight: 1.1,
                marginBottom: '1px',
              }}
            >
              {doc1.name}
            </div>
            {doc1.title && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
                {doc1.title}
              </div>
            )}
            {doc1.subTitle && (
              <div style={{ fontSize: '8.8px', fontWeight: 600, color: '#333', lineHeight: 1.15, marginTop: '1px', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
                {doc1.subTitle}
              </div>
            )}
            {doc1.regNo && (
              <div style={{ fontSize: '10.5px', fontWeight: 700, marginTop: '1px', color: '#111' }}>
                {doc1.regNo}
              </div>
            )}
            {doc1.specialty && (
              <div
                style={{
                  fontFamily: "'Mukta', sans-serif",
                  fontSize: '12px',
                  fontWeight: 800,
                  marginTop: '1px',
                  color: '#111',
                }}
              >
                {doc1.specialty.replace('तज्ज्ञ', 'तज्ञ').replace('विशेषज्ञ', 'विशेष तज्ञ')}
              </div>
            )}
          </div>

          {/* Timings (Center) */}
          <div
            style={{
              width: '32%',
              textAlign: 'center',
              fontFamily: "Arial, 'Helvetica Neue', sans-serif",
              fontWeight: 500,
              fontSize: '11px',
              color: '#222',
              lineHeight: 1.2,
            }}
          >
            <div>✤ वेळ : {openingHours || 'सकाळी १० ते सायं. ६ पर्यंत'}</div>
            <div>✤ {closedDay || 'दर रविवारी बंद राहिल.'}</div>
            <div
              style={{
                fontWeight: 700,
                marginTop: '2px',
                fontSize: '13px',
                color: '#111',
              }}
            >
              Mo. {phone || '7249727104 / 9657727104'}
            </div>
          </div>

          {/* Doctor 2 (Right) */}
          <div style={{ textAlign: 'right', width: '34%' }}>
            <div
              style={{
                color: '#29558c',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: "'Mukta', sans-serif",
                lineHeight: 1.1,
                marginBottom: '1px',
              }}
            >
              {doc2.name}
            </div>
            {doc2.title && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
                {doc2.title}
              </div>
            )}
            {doc2.subTitle && (
              <div style={{ fontSize: '9px', fontWeight: 600, color: '#333', lineHeight: 1.15, marginTop: '1px', whiteSpace: 'nowrap' }}>
                {doc2.subTitle}
              </div>
            )}
            {doc2.regNo && (
              <div style={{ fontSize: '10.5px', fontWeight: 700, marginTop: '1px', color: '#111' }}>
                {doc2.regNo}
              </div>
            )}
            {doc2.specialty && (
              <div
                style={{
                  fontFamily: "'Mukta', sans-serif",
                  fontSize: '12px',
                  fontWeight: 800,
                  marginTop: '1px',
                  color: '#111',
                }}
              >
                {doc2.specialty.replace('तज्ज्ञ', 'तज्ञ').replace('विशेषज्ञ', 'विशेष तज्ञ')}
              </div>
            )}
          </div>
        </div>

        {/* Green Address Strip */}
        <div
          style={{
            background: headerBgColor || '#89b740',
            color: '#111',
            textAlign: 'center',
            padding: '3px 0',
            fontFamily: "'Mukta', sans-serif",
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '2px',
          }}
        >
          {address ||
            'एस.टी.स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. 6, पेठ वडगांव'}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. PROPERLY ALIGNED PATIENT DEMOGRAPHICS SECTION (~20mm H) */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '3.5mm 8mm 3mm 8mm',
          borderTop: printOnStationery ? 'none' : '2px solid #a53b3b',
          borderBottom: printOnStationery ? 'none' : '2px solid #a53b3b',
          fontFamily: "'Mukta', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '2.5mm',
        }}
      >
        {printOnStationery ? (
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '16mm',
              fontWeight: 700,
              color: '#111',
            }}
          >
            <div style={{ position: 'absolute', top: '1mm', left: '16mm', fontSize: '14px' }}>
              {patient.name}
            </div>
            <div style={{ position: 'absolute', top: '1mm', left: '140mm', fontSize: '13px' }}>
              {formatDate(casePaper.date)}
            </div>
            <div style={{ position: 'absolute', top: '8.5mm', left: '16mm', fontSize: '13.5px' }}>
              {patient.village || ''}
            </div>
            <div style={{ position: 'absolute', top: '8.5mm', left: '135mm', fontSize: '13px' }}>
              {patient.age} Yrs / {patient.gender === 'M' ? 'Male' : 'Female'}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {/* Row 1: Name & Date */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', width: '100%', minHeight: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '1 1 65%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13.5px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.name}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#000',
                    lineHeight: '1.2',
                    minHeight: '18px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {patient.name || '\u00A0'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '0 0 32%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13.5px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.date}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: '#000',
                    lineHeight: '1.2',
                    minHeight: '18px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatDate(casePaper.date)}
                </span>
              </div>
            </div>

            {/* Row 2: Village & Age/Sex */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', width: '100%', minHeight: '22px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '1 1 65%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13.5px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.village}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#000',
                    lineHeight: '1.2',
                    minHeight: '18px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {patient.village || '\u00A0'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '0 0 32%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13.5px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.age}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '13.5px',
                    color: '#000',
                    lineHeight: '1.2',
                    minHeight: '18px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {patient.age} Yrs / {patient.gender === 'M' ? 'Male' : 'Female'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 3. MAIN BODY SECTION (Sidebar + Wide Dynamic Rx Table)     */}
      {/* ══════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          width: '100%',
          overflow: 'hidden',
          borderTop: printOnStationery ? 'none' : '3px double #a53b3b',
        }}
      >
        {/* ── Left Sidebar (marginLeft: 8mm, width: 50mm, evenly distributed across 100% height) ── */}
        <aside
          style={{
            marginLeft: '8mm',
            width: '50mm',
            minWidth: '50mm',
            maxWidth: '50mm',
            height: '100%',
            borderRight: printOnStationery ? 'none' : '3px double #a53b3b',
            padding: '2mm 3mm 2mm 0',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            fontWeight: 500,
            visibility: printOnStationery ? 'hidden' : 'visible',
          }}
        >
          {/* 1. Past History */}
          {sections.showPastHistory !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #7c2222',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#444',
                  background: '#fff',
                  display: 'inline-block',
                }}
              >
                Past History
              </div>
              <div style={{ fontSize: '9.5px', color: '#444', marginTop: '1px' }}>
                (DM/HTN/Thyroid/Autoimmune)
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#111',
                  marginTop: '1px',
                  minHeight: '14px',
                }}
              >
                {cleanClinicalText(patient.pastHistory || casePaper.pastHistory)}
              </div>
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 2. Drug History */}
          {sections.showDrugHistory !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #7c2222',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#444',
                  background: '#fff',
                  display: 'inline-block',
                }}
              >
                Drug History/Allergy History
              </div>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#7c2222',
                  marginTop: '1px',
                  minHeight: '14px',
                }}
              >
                {cleanClinicalText(patient.allergies || casePaper.allergies)}
              </div>
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 3. Investigations Advised */}
          {sections.showInvestigations !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #7c2222',
                  padding: '2px 6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#444',
                  background: '#fff',
                  display: 'inline-block',
                }}
              >
                Investigations Advised
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '1px',
                  fontWeight: 600,
                  fontSize: '10.5px',
                  color: '#111',
                }}
              >
                <span>■ CBC</span>
                <span>■ LFT</span>
                <span>■ BSL®</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '10.5px', color: '#111', marginTop: '1px' }}>
                <span>■ Serum Creatinine</span>
              </div>
              {casePaper.investigationsAdvised && (Array.isArray(casePaper.investigationsAdvised) ? casePaper.investigationsAdvised.length > 0 : !!casePaper.investigationsAdvised) && (
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#1e3a8a',
                    marginTop: '1px',
                  }}
                >
                  Advised: {Array.isArray(casePaper.investigationsAdvised) ? casePaper.investigationsAdvised.join(', ') : casePaper.investigationsAdvised}
                </div>
              )}
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 4. Provisional/Final Diagnosis */}
          <div>
            <div
              style={{
                border: '1px solid #7c2222',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 700,
                color: '#444',
                background: '#fff',
                display: 'inline-block',
              }}
            >
              Provisional/Final Diagnosis
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: '#111',
                marginTop: '1px',
                minHeight: '14px',
              }}
            >
              {cleanClinicalText(casePaper.complaint)}
            </div>
            <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
          </div>

          {/* 5. Patient Counselling Documentation */}
          {sections.showCounselling !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #7c2222',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  lineHeight: 1.15,
                  color: '#1e3a8a',
                  background: '#fff',
                  display: 'inline-block',
                }}
              >
                Patient Counselling
                <br />
                Documentation
              </div>
              <div style={{ marginTop: '2px' }}>
                {[
                  'Verbal consent taken',
                  'Diagnosis Explained',
                  'Risk&side effects explained',
                  'Monitoring Plan Explained',
                ].map((item, i) => {
                  const isChecked = Array.isArray(casePaper.counsellingDone)
                    ? casePaper.counsellingDone.length === 0 || casePaper.counsellingDone.includes(item)
                    : true;
                  return (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1px',
                        fontSize: '10.5px',
                      }}
                    >
                      <span>{item}</span>
                      <span
                        style={{
                          border: '1px solid #333',
                          width: '12px',
                          height: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          fontWeight: 700,
                        }}
                      >
                        {isChecked ? '✓' : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 6. Warning Explained */}
          {sections.showWarnings !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #7c2222',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#444',
                  background: '#fff',
                  display: 'inline-block',
                }}
              >
                Warning Explained-
              </div>
              <div style={{ fontSize: '9.5px', lineHeight: 1.2, marginTop: '2px', color: '#111' }}>
                Fever/Mouth Ulcer/ Breathlessness
                <br />
                Yellowish Eyes-Stop drug & Report immediately.
              </div>
            </div>
          )}

          {/* 7. Drug Verbal Consent Circular Stamp - Flawlessly Centered */}
          <div
            style={{
              border: '1.5px solid #111',
              borderRadius: '50%',
              width: '144px',
              height: '144px',
              minHeight: '144px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              margin: '0 auto',
              padding: '12px 10px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ fontSize: '7.8px', fontWeight: 800, color: '#000', marginBottom: '2.5px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              DRUG VERBAL CONSENT
            </div>
            <div style={{ fontSize: '6.8px', lineHeight: 1.22, color: '#111', fontWeight: 600 }}>
              <div>Dx &amp; indication explained.</div>
              <div>Risks: Hepatotoxicity, Severe</div>
              <div>anemia, Hemolysis, Dapsone</div>
              <div>syndrome, Infection risk.</div>
              <div>Severe cutaneous adverse</div>
              <div>reactions (SJS/TEN).</div>
              <div>Teratogenicity discussed.</div>
              <div>Monitoring &amp; alternatives.</div>
              <div>Pt verbalized understanding</div>
              <div>&amp; consented.</div>
            </div>
          </div>
        </aside>

        {/* ── Right Main Rx Area (marginRight: 8mm, wide and spacious) ── */}
        <main
          style={{
            flex: 1,
            marginRight: '8mm',
            padding: '2mm 0 2mm 6mm',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div>
            {/* Rx Symbol & Caduceus Icon */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
                height: '9mm',
                visibility: printOnStationery ? 'hidden' : 'visible',
              }}
            >
              <div
                style={{
                  fontSize: '28px',
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#111',
                }}
              >
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

            {/* Medicine Table - DYNAMIC FROM casePaper.medicines (No hardcoded medicines!) */}
            <div style={{ marginTop: printOnStationery ? '4mm' : '0' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  border: '1.5px solid #444',
                  fontSize: '12.5px',
                  lineHeight: 1.35,
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: '#f8f8f8',
                      borderBottom: '1.5px solid #444',
                      fontWeight: 700,
                    }}
                  >
                    <th
                      style={{
                        border: '1px solid #555',
                        padding: '6px 2px',
                        textAlign: 'center',
                        width: '28px',
                        fontSize: '11px',
                      }}
                    >
                      {headers.srNo || 'Sr. No.'}
                    </th>
                    <th
                      style={{
                        border: '1px solid #555',
                        padding: '6px 7px',
                        textAlign: 'left',
                        width: '32%',
                        fontSize: '12px',
                      }}
                    >
                      {headers.medName}
                    </th>
                    <th
                      style={{
                        border: '1px solid #555',
                        padding: '6px 7px',
                        textAlign: 'left',
                        width: '46%',
                        fontSize: '12px',
                      }}
                    >
                      {headers.freq}
                    </th>
                    <th
                      style={{
                        border: '1px solid #555',
                        padding: '6px 5px',
                        textAlign: 'left',
                        width: '56px',
                        fontSize: '12px',
                      }}
                    >
                      {headers.duration}
                    </th>
                    <th
                      style={{
                        border: '1px solid #555',
                        padding: '6px 2px',
                        textAlign: 'center',
                        width: '38px',
                        color: '#93231f',
                        fontSize: '12.5px',
                      }}
                    >
                      {headers.count}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {casePaper.medicines && casePaper.medicines.length > 0 ? (
                    casePaper.medicines.map((med, index) => {
                      const displayName = getPrintMedicineName(med);
                      const count = calculateMedicineCount(med);
                      return (
                        <tr
                          key={index}
                          style={{
                            borderBottom: '1px solid #666',
                            minHeight: '32px',
                            height: '32px',
                          }}
                        >
                          <td
                            style={{
                              border: '1px solid #666',
                              padding: '6px 2px',
                              textAlign: 'center',
                              fontFamily: 'monospace',
                              fontSize: '11.5px',
                              color: '#333',
                            }}
                          >
                            {index + 1}
                          </td>
                          <td
                            style={{
                              border: '1px solid #666',
                              padding: '6px 7px',
                              fontWeight: 700,
                              color: '#111',
                              fontSize: '13px',
                            }}
                          >
                            {displayName}
                          </td>
                          <td
                            style={{
                              border: '1px solid #666',
                              padding: '6px 7px',
                              fontWeight: 600,
                              color: '#222',
                              fontSize: '12.5px',
                            }}
                          >
                            {renderFrequencyCell(
                              med.frequency,
                              med.name,
                              language,
                              med.instructions || med.notes
                            )}
                          </td>
                          <td
                            style={{
                              border: '1px solid #666',
                              padding: '6px 5px',
                              color: '#333',
                              fontSize: '12px',
                            }}
                          >
                            {translateDuration(med.duration, language)}
                          </td>
                          <td
                            style={{
                              border: '1px solid #666',
                              padding: '6px 2px',
                              textAlign: 'center',
                              fontWeight: 700,
                              color: '#047857',
                              fontSize: '13px',
                            }}
                          >
                            {count}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} style={{ height: '140px', border: '1px solid #666' }} />
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {casePaper.counsellingDone && casePaper.counsellingDone.length > 0 && (
              <div style={{ marginTop: '6px', fontSize: '10.5px', fontWeight: 600 }}>
                <div style={{ fontWeight: 700, marginBottom: '1px' }}>Special Advice:</div>
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
              fontSize: '12px',
              color: '#222',
              marginTop: 'auto',
              paddingTop: '5px',
              paddingBottom: '2px',
              borderTop: printOnStationery ? 'none' : '1px dashed #999',
            }}
          >
            <span style={{ visibility: printOnStationery ? 'hidden' : 'visible' }}>
              {labels.patientSignature || 'Patient Signature - '}{' '}
            </span>
            <span
              style={{
                fontWeight: 700,
                color: '#111',
                display: 'inline-block',
                transform: printOnStationery ? 'translate(-12mm, 10.7mm)' : 'none',
              }}
            >
              <span style={{ visibility: printOnStationery ? 'hidden' : 'visible' }}>
                {labels.followUp || 'Follow up - '}
              </span>
              <span>{formatDate(casePaper.followUpDate, true)}</span>
            </span>
          </div>
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 4. FOOTER SECTION (Left: 8mm, Right: 8mm) (~26mm H)        */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          width: '100%',
          borderTop: printOnStationery ? 'none' : '2px solid #a53b3b',
          paddingTop: '2.5mm',
          paddingBottom: '6mm',
          paddingLeft: '8mm',
          paddingRight: '8mm',
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
                <div style={{ marginBottom: '1px' }}>
                  ☑ Methotrexate- weekly dosing explained & overdose risk etc. Explained.
                </div>
                <div style={{ marginBottom: '1px' }}>
                  ☑ JAK inhibitors - DVT/PE warning explained & leukopenia etc. Explained.
                </div>
                <div style={{ marginBottom: '1px' }}>
                  ☑ DAPSONE - DAPSONE syndrome, organ toxicity, Jaundice risk etc. Explained
                </div>
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
            <div
              style={{
                fontFamily: "'Mukta', sans-serif",
                fontSize: '10.5px',
                marginTop: '1px',
                lineHeight: 1.2,
                color: '#222',
              }}
            >
              - त्वचा विकाराची औषधे इतर औषधांप्रमाणे महाग असू शकतात. - चिठ्ठीमधील औषधे दिलेल्या अवधीसाठीच आहेत.
              <br />
              - काही विकार बरे होण्यास वेळ लागतो. तसेच काही विकार औषधानंतर काही प्रमाणात वाढतात व त्यानंतर बरे होतात.
            </div>
          </>
        )}
        {pharmacyInfo && !pharmacyInfo.trim().startsWith('{') && !pharmacyInfo.includes('projectId') && (
          <div
            style={{
              textAlign: 'center',
              fontWeight: 700,
              fontSize: '10.5px',
              paddingTop: printOnStationery ? '8px' : '2px',
              borderTop: printOnStationery ? 'none' : '1px solid #333',
              marginTop: '2px',
              color: '#111',
            }}
          >
            {pharmacyInfo}
          </div>
        )}
      </footer>
    </div>
  );
}
