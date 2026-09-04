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
    case 'hindi':
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
  const isJunkPackSize = /^\d+\s*['"`;&]?\s*s?$/i.test(strength) || /[\d\`'\,\-\;\:]+\s*(s|tab|tabs|cap|caps|strip|strips|kit|kits|vial|amp|nos|unit)/i.test(strength) || /^\d+$/i.test(strength);
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
    <div style={{ whiteSpace: 'pre-line', lineHeight: '1.3', fontSize: '11px', fontWeight: 600, color: '#222' }}>
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
    if (isFollowUp) {
      return formatFollowUpDate(dateString, language);
    }
    return formatLocalizedDate(dateString, language);
  };

  const {
    clinicNameHi,
    clinicNameEn,
    phone,
    address,
    openingHours,
    closedDay,
    headerBgColor,
    pharmacyInfo,
    doctors = [],
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
      {/* 1. TOP CLINIC HEADER (Left: 8mm, Right: 8mm, Top: 3.5mm)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <header
        className="clinic-print-header"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          paddingTop: '10mm',
          paddingLeft: '8mm',
          paddingRight: '20mm',
          visibility: hideHeader || printOnStationery ? 'hidden' : 'visible',
          marginBottom: '2mm',
        }}
      >
        {/* Brand Banner: Logo + Main Hindi Title + Sub-brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '2px',
          }}
        >
          {clinicSettings.logoUrl ? (
            <img
              src={clinicSettings.logoUrl}
              alt="Logo"
              style={{
                height: '44px',
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
                height: '44px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '40px',
                fontWeight: 800,
                color: '#93231f',
                fontFamily: "'DV-TTYogesh', 'Shivaji', 'Amita', 'Karma', serif",
                lineHeight: 1,
              }}
            >
              {clinicNameHi || 'शिनगारे'}
            </span>
            <span
              style={{
                fontSize: '21px',
                fontWeight: 700,
                color: '#3b2c63',
                fontFamily: "'Mukta', 'Poppins', sans-serif",
                lineHeight: 1,
                paddingTop: '2px',
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
            marginBottom: '3px',
            fontSize: '10.5px',
            lineHeight: 1.15,
          }}
        >
          {/* Doctor 1 (Left Column) */}
          <div style={{ textAlign: 'left', width: '34%', paddingRight: '2mm', boxSizing: 'border-box' }}>
            <div
              style={{
                color: '#29558c',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: "'Mukta', sans-serif",
                lineHeight: 1.15,
                marginBottom: '1px',
                letterSpacing: '0.2px',
              }}
            >
              {doc1.name}
            </div>
            {doc1.title && (
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#222', lineHeight: 1.2 }}>
                {doc1.title}
              </div>
            )}
            {doc1.subTitle && (
              <div style={{ fontSize: '8.5px', fontWeight: 600, color: '#444', lineHeight: 1.15, marginTop: '1px', whiteSpace: 'nowrap', letterSpacing: '-0.1px' }}>
                {doc1.subTitle}
              </div>
            )}
            {doc1.regNo && (
              <div style={{ fontSize: '9.5px', fontWeight: 700, marginTop: '1px', color: '#111' }}>
                {doc1.regNo}
              </div>
            )}
            {doc1.specialty && (
              <div
                style={{
                  fontFamily: "'Mukta', sans-serif",
                  fontSize: '11px',
                  fontWeight: 800,
                  marginTop: '1px',
                  color: '#111',
                }}
              >
                {doc1.specialty.replace('तज्ज्ञ', 'तज्ञ').replace('विशेषज्ञ', 'विशेष तज्ञ')}
              </div>
            )}
          </div>

          {/* Timings (Center Column) */}
          <div
            style={{
              width: '32%',
              textAlign: 'center',
              fontFamily: "Arial, 'Helvetica Neue', sans-serif",
              fontWeight: 500,
              fontSize: '10.5px',
              color: '#222',
              lineHeight: 1.25,
              padding: '0 2px',
              boxSizing: 'border-box',
            }}
          >
            <div>✤ वेळ : {openingHours || 'सकाळी १० ते सायं. ६ पर्यंत'}</div>
            <div>✤ {closedDay || 'दर रविवारी बंद राहिल.'}</div>
            <div
              style={{
                fontWeight: 800,
                marginTop: '1px',
                fontSize: '12.5px',
                color: '#111',
              }}
            >
              Mo. {phone || '7249727104 / 9657727104'}
            </div>
          </div>

          {/* Doctor 2 (Right Column) */}
          <div style={{ textAlign: 'right', width: '34%', paddingLeft: '2mm', boxSizing: 'border-box' }}>
            <div
              style={{
                color: '#29558c',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: "'Mukta', sans-serif",
                lineHeight: 1.15,
                marginBottom: '1px',
                letterSpacing: '0.2px',
              }}
            >
              {doc2.name}
            </div>
            {doc2.title && (
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#222', lineHeight: 1.2 }}>
                {doc2.title}
              </div>
            )}
            {doc2.subTitle && (
              <div style={{ fontSize: '8.5px', fontWeight: 600, color: '#444', lineHeight: 1.15, marginTop: '1px', whiteSpace: 'nowrap' }}>
                {doc2.subTitle}
              </div>
            )}
            {doc2.regNo && (
              <div style={{ fontSize: '9.5px', fontWeight: 700, marginTop: '1px', color: '#111' }}>
                {doc2.regNo}
              </div>
            )}
            {doc2.specialty && (
              <div
                style={{
                  fontFamily: "'Mukta', sans-serif",
                  fontSize: '11px',
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
            padding: '2.5px 0',
            fontFamily: "'Mukta', sans-serif",
            fontSize: '11.5px',
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: '0.1px',
          }}
        >
          {address || 'एस.टी. स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वस्ती गाळा नं. 6, पेठ वडगांव'}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* 2. PATIENT DEMOGRAPHICS (Left: 8mm, Right: 8mm) (~18mm H)   */}
      {/* ══════════════════════════════════════════════════════════ */}
      <section
        style={{
          width: '100%',
          boxSizing: 'border-box',
          paddingLeft: '8mm',
          paddingRight: '20mm',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '2mm',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
            {/* Row 1: Name & Date */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', width: '100%', minHeight: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '1 1 65%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.name}
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
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {patient.name || ' '}
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
                <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.date}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '13px',
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
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', width: '100%', minHeight: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '8px',
                  flex: '1 1 65%',
                  minWidth: 0,
                }}
              >
                <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.village}
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
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {patient.village || ' '}
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
                <span style={{ whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600, color: '#222', lineHeight: '1.2' }}>
                  {labels.age}
                </span>
                <span
                  style={{
                    flex: 1,
                    borderBottom: '1px solid #333',
                    paddingLeft: '6px',
                    paddingBottom: '1px',
                    fontWeight: 700,
                    fontSize: '13px',
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
        {/* ── Left Sidebar (marginLeft: 8mm, width: 48mm, evenly distributed across 100% height) ── */}
        <aside
          style={{
            marginLeft: '8mm',
            width: '48mm',
            minWidth: '48mm',
            maxWidth: '48mm',
            height: '100%',
            borderRight: printOnStationery ? 'none' : '3px double #a53b3b',
            padding: '2mm 2.5mm 2mm 0',
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
                  fontSize: '11px',
                  fontWeight: 700,
                  marginTop: '2px',
                  color: '#111',
                  lineHeight: 1.25,
                }}
              >
                {casePaper.investigationsAdvised && casePaper.investigationsAdvised.length > 0 ? (
                  casePaper.investigationsAdvised.map((inv: any, idx: number) => {
                    const text = typeof inv === 'string' ? inv : inv.name || inv.investigation || '';
                    return (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ fontSize: '10px' }}>■</span> {text}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '10px' }}>■</span> CBC <span style={{ fontSize: '10px' }}>■</span> LFT <span style={{ fontSize: '10px' }}>■</span> BSL®
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span style={{ fontSize: '10px' }}>■</span> Serum Creatinine
                    </div>
                  </>
                )}
              </div>
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 4. Provisional Diagnosis */}
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
                marginTop: '2px',
                minHeight: '14px',
              }}
            >
              {cleanClinicalText((casePaper as any).diagnosis || (casePaper as any).notes || casePaper.complaint)}
            </div>
            <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
          </div>

          {/* 5. Patient Counselling Documentation */}
          {sections.showCounselling !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #2563eb',
                  padding: '2px 6px',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#1e40af',
                  background: '#eff6ff',
                  display: 'inline-block',
                }}
              >
                Patient Counselling Documentation
              </div>
              <div style={{ fontSize: '10.5px', marginTop: '2px', lineHeight: 1.3, color: '#333' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Verbal consent taken</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>☑</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Diagnosis Explained</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>☑</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Risk&amp;side effects explained</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>☑</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Monitoring Plan Explained</span>
                  <span style={{ fontWeight: 700, color: '#047857' }}>☑</span>
                </div>
              </div>
              <div style={{ borderBottom: '1px solid #222', width: '100%', marginTop: '2px' }} />
            </div>
          )}

          {/* 6. Warning Explained Box */}
          {sections.showWarnings !== false && (
            <div>
              <div
                style={{
                  border: '1px solid #991b1b',
                  padding: '1.5px 5px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: '#991b1b',
                  background: '#fef2f2',
                  display: 'inline-block',
                }}
              >
                Warning Explained-
              </div>
              <div
                style={{
                  fontSize: '9.5px',
                  color: '#444',
                  marginTop: '1.5px',
                  lineHeight: 1.15,
                }}
              >
                Fever/Mouth Ulcer/ Breathlessness/ Yellowish Eyes-Stop drug &amp; Report immediately.
              </div>
            </div>
          )}

          {/* 7. DRUG VERBAL CONSENT Round Stamp */}
          <div style={{ display: 'flex', justifyContent: 'center', margin: '1mm 0 0 0' }}>
            <div
              style={{
                width: '38mm',
                height: '38mm',
                borderRadius: '50%',
                border: '1.5px dashed #444',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                padding: '2px',
                boxSizing: 'border-box',
                background: '#fff',
              }}
            >
              <div
                style={{
                  fontSize: '8.5px',
                  fontWeight: 800,
                  color: '#111',
                  letterSpacing: '0.2px',
                  lineHeight: 1,
                  marginBottom: '1px',
                }}
              >
                DRUG VERBAL CONSENT
              </div>
              <div
                style={{
                  fontSize: '6px',
                  color: '#333',
                  lineHeight: 1.08,
                  fontWeight: 600,
                  padding: '0 2px',
                }}
              >
                Dx &amp; Indication explained.
                <br />
                Risks: Hepatotoxicity, Severe
                <br />
                anemia, Hemolysis, Dapsone
                <br />
                syndrome, Infection risk,
                <br />
                Severe cutaneous adverse
                <br />
                reactions (SJS/TEN),
                <br />
                Teratogenicity discussed.
                <br />
                Monitoring &amp; alternatives.
                <br />
                Pt verbalised understanding
                <br />
                &amp; consented.
              </div>
            </div>
          </div>
        </aside>

        {/* ── Right Main Area: Rx Symbol + Dynamic Medicine Table + Follow-up ── */}
        <main
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            paddingLeft: '3.5mm',
            paddingRight: '20mm',
            paddingTop: '1mm',
            paddingBottom: '1mm',
            boxSizing: 'border-box',
            overflow: 'hidden',
          }}
        >
          {/* Top Rx & Medical Symbol */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1mm',
                paddingRight: '2mm',
              }}
            >
              <span
                style={{
                  fontSize: '28px',
                  fontFamily: "'Playfair Display', 'Times New Roman', serif",
                  fontWeight: 800,
                  fontStyle: 'italic',
                  color: '#111',
                  lineHeight: 1,
                  visibility: printOnStationery ? 'hidden' : 'visible',
                }}
              >
                ℞
              </span>
              <span
                style={{
                  fontSize: '18px',
                  color: '#047857',
                  lineHeight: 1,
                  visibility: printOnStationery ? 'hidden' : 'visible',
                }}
              >
                ⚕
              </span>
            </div>

            {/* Dynamic Medicine Table */}
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                border: '1px solid #111',
                fontSize: '11px',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: '#fff',
                    borderBottom: '1px solid #111',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    textAlign: 'left',
                  }}
                >
                  <th
                    style={{
                      width: '32px',
                      padding: '3px 2px',
                      textAlign: 'center',
                      borderRight: '1px solid #111',
                      color: '#000',
                    }}
                  >
                    {headers.srNo}
                  </th>
                  <th
                    style={{
                      padding: '3px 6px',
                      borderRight: '1px solid #111',
                      color: '#000',
                    }}
                  >
                    {headers.medName}
                  </th>
                  <th
                    style={{
                      padding: '3px 6px',
                      borderRight: '1px solid #111',
                      color: '#000',
                    }}
                  >
                    {headers.freq}
                  </th>
                  <th
                    style={{
                      width: '68px',
                      padding: '3px 4px',
                      textAlign: 'center',
                      borderRight: '1px solid #111',
                      color: '#000',
                    }}
                  >
                    {headers.duration}
                  </th>
                  <th
                    style={{
                      width: '36px',
                      padding: '3px 2px',
                      textAlign: 'center',
                      color: '#991b1b',
                    }}
                  >
                    {headers.count}
                  </th>
                </tr>
              </thead>
              <tbody>
                {casePaper.medicines && casePaper.medicines.length > 0 ? (
                  casePaper.medicines.map((med, idx) => {
                    const durationStr = med.duration ? translateDuration(med.duration, language) : '-';
                    const medName = getPrintMedicineName(med);
                    const isLast = idx === casePaper.medicines.length - 1;
                    const calculatedCount = calculateMedicineCount(med);

                    return (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: isLast ? 'none' : '1px solid #111',
                          verticalAlign: 'top',
                          lineHeight: 1.25,
                        }}
                      >
                        <td
                          style={{
                            padding: '4px 2px',
                            textAlign: 'center',
                            borderRight: '1px solid #111',
                            fontWeight: 700,
                            fontSize: '11.5px',
                          }}
                        >
                          {idx + 1}
                        </td>
                        <td
                          style={{
                            padding: '3px 5px',
                            borderRight: '1px solid #111',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            color: '#000',
                          }}
                        >
                          {medName}
                        </td>
                        <td
                          style={{
                            padding: '3px 5px',
                            borderRight: '1px solid #111',
                            fontSize: '11px',
                            color: '#111',
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
                            padding: '3px 3px',
                            textAlign: 'center',
                            borderRight: '1px solid #111',
                            fontSize: '11px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {durationStr}
                        </td>
                        <td
                          style={{
                            padding: '3px 2px',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            color: '#000',
                          }}
                        >
                          {calculatedCount}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        padding: '16px',
                        textAlign: 'center',
                        color: '#666',
                        fontStyle: 'italic',
                      }}
                    >
                      No medicines prescribed
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Bottom Row: Patient Signature & Follow-up */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: printOnStationery ? 'none' : '1px dashed #666',
              paddingTop: '2mm',
              marginTop: '2mm',
              fontSize: '13px',
              fontWeight: 600,
              color: '#111',
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
      {/* 4. FOOTER SECTION (Left: 8mm, Right: 8mm, Bottom: 3mm)      */}
      {/* ══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          width: '100%',
          borderTop: printOnStationery ? 'none' : '2px solid #a53b3b',
          paddingTop: '2mm',
          paddingBottom: '20mm',
          paddingLeft: '8mm',
          paddingRight: '20mm',
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
                  ☑ Methotrexate- weekly dosing explained &amp; overdose risk etc. Explained.
                </div>
                <div style={{ marginBottom: '1px' }}>
                  ☑ JAK inhibitors - DVT/PE warning explained &amp; leukopenia etc. Explained.
                </div>
                <div style={{ marginBottom: '1px' }}>
                  ☑ DAPSONE - DAPSONE syndrome, organ toxicity, Jaundice risk etc. Explained
                </div>
              </div>
              <div style={{ flex: '0 0 38%' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                  <span>☑ </span>
                  <span style={{ lineHeight: 1.15 }}>
                    Azathioprine-related myelosuppression &amp;<br />
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
