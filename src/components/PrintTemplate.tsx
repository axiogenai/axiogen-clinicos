import type { Patient } from '../data/patients';
import type { CasePaper } from '../types';
import type { ClinicSettings } from '../data/clinicSettings';

interface PrintTemplateProps {
  patient: Patient;
  casePaper: CasePaper;
  clinicSettings: ClinicSettings;
  hideHeader?: boolean;
}

// Automatic Marathi translation helpers for Frequency & Duration on Print
export const toMarathiFrequency = (freq?: string): string => {
  if (!freq) return '-';
  let str = freq.trim();

  // 1. Remove duplicate (HS) if text already contains Marathi 'रात्री झोपताना'
  if (/रात्री\s*झोपताना/i.test(str)) {
    str = str.replace(/\(\s*hs\s*\)/gi, '').replace(/\bhs\b/gi, '').trim();
  }

  // 2. Translate Latin Abbreviations in parentheses
  str = str
    .replace(/\(\s*bd\s*\)/gi, '(दिवसातून २ वेळा)')
    .replace(/\(\s*od\s*\)/gi, '(दिवसातून १ वेळ)')
    .replace(/\(\s*hs\s*\)/gi, '(रात्री झोपताना)')
    .replace(/\(\s*tds\s*\)/gi, '(दिवसातून ३ वेळा)')
    .replace(/\(\s*sos\s*\)/gi, '(गरज भासल्यास)');

  // 3. Exact match shortcuts for simple codes
  const lower = str.toLowerCase();
  if (lower === '1-0-0' || lower === '0-1-0' || lower === '0-0-1' || lower === 'once daily' || lower === 'once a day' || lower === 'od') {
    return `${str} (दिवसातून १ वेळ)`;
  }
  if (lower === '1-0-1' || lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') {
    return '1-0-1 (दिवसातून २ वेळा - सकाळी व रात्री)';
  }
  if (lower === '1-1-1' || lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') {
    return '1-1-1 (दिवसातून ३ वेळा - सकाळी, दुपारी व रात्री)';
  }

  // 4. Comprehensive phrase replacements (longest phrases first)
  str = str
    .replace(/use during morning bath daily/gi, 'रोज सकाळी आंघोळीच्या वेळी वापरावे')
    .replace(/during morning bath daily/gi, 'रोज सकाळी आंघोळीच्या वेळी')
    .replace(/during morning bath/gi, 'सकाळी आंघोळीच्या वेळी')
    .replace(/morning bath/gi, 'सकाळी आंघोळीच्या वेळी')
    .replace(/nightly application/gi, 'दररोज रात्री लावावे')
    .replace(/clean & dry area/gi, 'स्वच्छ व वाळलेल्या जागेवर')
    .replace(/clean and dry area/gi, 'स्वच्छ व वाळलेल्या जागेवर')
    .replace(/on affected area/gi, 'बाधित त्वचेवर')
    .replace(/affected area/gi, 'बाधित जागेवर')
    .replace(/before food/gi, 'जेवणाआधी')
    .replace(/after food/gi, 'जेवणानंतर')
    .replace(/before meals/gi, 'जेवणाआधी')
    .replace(/after meals/gi, 'जेवणानंतर')
    .replace(/after meal/gi, 'जेवणानंतर')
    .replace(/once daily/gi, 'दिवसातून १ वेळ')
    .replace(/twice daily/gi, 'दिवसातून २ वेळा')
    .replace(/thrice daily/gi, 'दिवसातून ३ वेळा')
    .replace(/at bedtime/gi, 'रात्री झोपताना')
    .replace(/every morning/gi, 'रोज सकाळी')
    .replace(/once a week/gi, 'आठवड्यातून एकदा')
    .replace(/alternate day/gi, 'एक दिवस आड')
    .replace(/as needed/gi, 'गरज भासल्यास')
    .replace(/apply/gi, 'लावावे')
    .replace(/application/gi, 'लावावे')
    .replace(/use/gi, 'वापरावे')
    .replace(/daily/gi, 'दररोज')
    .replace(/nightly/gi, 'दररोज रात्री');

  return str;
};

export const toMarathiDuration = (dur?: string): string => {
  if (!dur) return '-';
  const d = dur.trim();

  // Convert digits to Marathi Devanagari numerals (0-9 -> ०-९)
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

export default function PrintTemplate({ patient, casePaper, clinicSettings, hideHeader = false }: PrintTemplateProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '__________';
    try {
      return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(dateString));
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

  const doc1 = doctors[0] || {
    name: 'डॉ. प्रियांका प्रमोद शिनगारे',
    title: 'BHMS, FCHD (MUHS)',
    subTitle: '(Consultant Homeopathy Dermatologist)',
    regNo: 'Reg. No. 73338',
    specialty: 'त्वचारोग तज्ज्ञ',
  };

  const doc2 = doctors[1] || {
    name: 'डॉ. प्रमोद सुरेश शिनगारे',
    title: 'MD (Ayu) - D.Dermatology (Ay.)',
    subTitle: '(MUHS)',
    regNo: 'Reg. No. I-87218-A',
    specialty: 'त्वचारोग व सौंदर्य विशेषज्ञ',
  };

  const isGeneralPad = templateVariant === 'general';

  return (
    <div
      className="rx-paper-root"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        height: '297mm',
        maxHeight: '297mm',
        backgroundColor: '#ffffff',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        fontSize: '11px',
        lineHeight: 1.15,
        overflow: 'hidden',
        pageBreakAfter: 'avoid' as any,
        pageBreakInside: 'avoid' as any,
      }}
    >
      {/* ══════════════════════════════════════════════════════ */}
      {/* SHARED HEADER SECTION (EXACT MATCH TO BOTH TEMPLATES)  */}
      {/* ══════════════════════════════════════════════════════ */}
      <div 
        className="clinic-print-header" 
        style={{ 
          paddingTop: '10mm', 
          marginBottom: '4px',
          visibility: hideHeader ? 'hidden' : 'visible',
          height: hideHeader ? '35mm' : 'auto',
        }}
      >
        {/* Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '6px' }}>
          {clinicSettings.logoUrl ? (
            <img
              src={clinicSettings.logoUrl}
              alt="Clinic Logo"
              style={{
                height: '54px',
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
                height: '54px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
              }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontSize: '42px',
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
                color: '#442E4A',
                fontFamily: "'Mukta', 'Poppins', sans-serif",
                lineHeight: 1,
                paddingTop: '6px',
              }}
            >
              {clinicNameEn || 'स्किन & कॉस्मेटीक क्लिनिक'}
            </span>
          </div>
        </div>

        {/* Doctors & Timings Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 10px',
            marginBottom: '4px',
            fontSize: '11.5px',
            lineHeight: 1.15,
          }}
        >
          {/* Doctor 1 (Left) */}
          <div style={{ textAlign: 'left', width: '33%' }}>
            <div style={{ color: '#29558c', fontWeight: 700, fontSize: '16px', fontFamily: "'Mukta', sans-serif", marginBottom: '1px' }}>
              {doc1.name}
            </div>
            {doc1.title && <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#222' }}>{doc1.title}</div>}
            {doc1.subTitle && <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#222' }}>{doc1.subTitle}</div>}
            {doc1.regNo && <div style={{ fontSize: '9.5px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc1.regNo}</div>}
            {doc1.specialty && <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '11px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc1.specialty}</div>}
          </div>

          {/* Timings (Center) */}
          <div
            style={{
              width: '33%',
              textAlign: 'center',
              fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
              fontWeight: 500,
              fontSize: '11.5px',
              color: '#222',
              lineHeight: 1.2,
            }}
          >
            <div style={{ whiteSpace: 'pre-line' }}>
              {'✤ वेळ : ' + (openingHours || 'सकाळी १० ते सायं. ६ पर्यंत') + '\n✤ ' + (closedDay || 'दर रविवारी बंद राहिल.')}
            </div>
            <div style={{ fontWeight: 700, fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif", marginTop: '2px', fontSize: '13.5px' }}>
              Mo. {phone || '7249727104 / 9657727104'}
            </div>
          </div>

          {/* Doctor 2 (Right) */}
          <div style={{ textAlign: 'right', width: '33%' }}>
            <div style={{ color: '#29558c', fontWeight: 700, fontSize: '16px', fontFamily: "'Mukta', sans-serif", marginBottom: '1px' }}>
              {doc2.name}
            </div>
            {doc2.title && <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#222' }}>{doc2.title}</div>}
            {doc2.subTitle && <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#222' }}>{doc2.subTitle}</div>}
            {doc2.regNo && <div style={{ fontSize: '9.5px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc2.regNo}</div>}
            {doc2.specialty && <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '11px', fontWeight: 700, marginTop: '1px', color: '#222' }}>{doc2.specialty}</div>}
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
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          {address || 'एस.टी.स्टँड जवळ, राजाराम चित्र मंदिर समोर, कल्याणी बझार वरती गाळा नं. 6, पेठ वडगांव'}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* PATIENT INFO DEMOGRAPHICS                              */}
      {/* ══════════════════════════════════════════════════════ */}
      <div
        style={{
          padding: '6px 12px',
          borderBottom: '2px solid #a53b3b',
          position: 'relative',
          fontFamily: "'Mukta', sans-serif",
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <div style={{ width: '65%', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>पेशंटचे नाव :</span>
            <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.1em', paddingLeft: '6px', fontWeight: 700, color: '#111' }}>
              {patient.name}
            </span>
          </div>
          <div style={{ width: '30%', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>दिनांक :</span>
            <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.1em', paddingLeft: '6px', fontWeight: 700, color: '#111' }}>
              {formatDate(casePaper.date)}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ width: '65%', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>गाव :</span>
            <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.1em', paddingLeft: '6px', fontWeight: 700, color: '#111' }}>
              {patient.village || '___________'}
            </span>
          </div>
          <div style={{ width: '30%', display: 'flex', alignItems: 'baseline' }}>
            <span style={{ marginRight: '5px', whiteSpace: 'nowrap' }}>वय :</span>
            <span style={{ flex: 1, borderBottom: '1px solid #333', minHeight: '1.1em', paddingLeft: '6px', fontWeight: 700, color: '#111' }}>
              {patient.age} Yrs / {patient.gender}
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* OPTION A: TEMPLATE 2 - GENERAL MEDICINE PAD LAYOUT     */}
      {/* ══════════════════════════════════════════════════════ */}
      {isGeneralPad ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              borderTop: '3px double #a53b3b',
              padding: '12px 20px',
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Top of Body: Logo and Date */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <svg width="50" height="50" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                  <path d="M 33 32 C 41 24, 46 24, 47.5 25.5" stroke="#2d773f" strokeWidth="4" strokeLinecap="round" fill="none" />
                  <path d="M 67 32 C 59 24, 54 24, 52.5 25.5" stroke="#2d773f" strokeWidth="4" strokeLinecap="round" fill="none" />
                </svg>
              </div>

              <div style={{ fontWeight: 600, fontSize: '0.85rem', fontFamily: "'Inter', sans-serif", color: '#333', marginTop: '10px' }}>
                Date : {formatDate(casePaper.date)}
              </div>
            </div>

            {/* Medicines Rx Table */}
            <div style={{ marginTop: '10px', flex: 1 }}>
              {casePaper.medicines && casePaper.medicines.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #333', fontWeight: 700 }}>
                      <th style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'center', width: '30px' }}>#</th>
                      <th style={{ border: '1px solid #333', padding: '4px 10px', textAlign: 'left' }}>Medicine Name</th>
                      <th style={{ border: '1px solid #333', padding: '4px 10px', textAlign: 'left', width: '85px' }}>Dosage</th>
                      <th style={{ border: '1px solid #333', padding: '4px 10px', textAlign: 'left', width: '120px' }}>Frequency</th>
                      <th style={{ border: '1px solid #333', padding: '4px 10px', textAlign: 'left', width: '80px' }}>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {casePaper.medicines.map((med, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #333', height: '26px' }}>
                        <td style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11.5px' }}>{index + 1}</td>
                        <td style={{ border: '1px solid #333', padding: '4px 10px', fontWeight: 700, color: '#111' }}>{med.name}</td>
                        <td style={{ border: '1px solid #333', padding: '4px 10px', color: '#333' }}>{med.dosage}</td>
                        <td style={{ border: '1px solid #333', padding: '4px 10px', fontWeight: 600, color: '#222' }}>{toMarathiFrequency(med.frequency)}</td>
                        <td style={{ border: '1px solid #333', padding: '4px 10px', color: '#333' }}>{toMarathiDuration(med.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ flex: 1, minHeight: '200px' }} />
              )}

              {casePaper.counsellingDone && casePaper.counsellingDone.length > 0 && (
                <div style={{ marginTop: '10px', fontSize: '11px', fontWeight: 600 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Special Advice / Instructions:</div>
                  <div>{casePaper.counsellingDone.join(' • ')}</div>
                </div>
              )}
            </div>
          </div>

          {/* Template 2 Footer */}
          <footer style={{ borderTop: 'none', padding: '6px 20px 12px 20px', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
            <div style={{ textAlign: 'right', marginBottom: '2px', fontWeight: 700, fontSize: '0.85rem', color: '#222' }}>
              पुढील भेटीची दि. : {formatDate(casePaper.followUpDate)}
            </div>
            <div style={{ borderTop: '1px solid #111', paddingTop: '6px', fontSize: '0.95rem', display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ color: '#7b2a2a', fontWeight: 700, fontSize: '1.3rem', fontFamily: "'Amita', 'Karma', serif" }}>
                श्री मेडिकल
              </span>
              <span style={{ fontWeight: 600, fontFamily: "'Mukta', sans-serif", color: '#333' }}>
                {pharmacyInfo || 'एस.टी. स्टँडजवळ, कल्याणी बाजारच्यावरती, गाळा नं. ७, पेठ वडगाव.'}
              </span>
            </div>
          </footer>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════ */
        /* OPTION B: TEMPLATE 1 - DERMATOLOGY / DETAILED PAD      */
        /* ══════════════════════════════════════════════════════ */
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div
            style={{
              display: 'flex',
              flex: 1,
              position: 'relative',
              borderTop: '3px double #a53b3b',
              overflow: 'hidden',
            }}
          >
            {/* ─── LEFT SIDEBAR (22%) ─── */}
            <aside
              style={{
                width: '22%',
                borderRight: '3px double #a53b3b',
                padding: '6px 8px',
                fontFamily: "'Inter', sans-serif",
                fontSize: '10px',
                fontWeight: 500,
                boxSizing: 'border-box',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              {/* Past History */}
              {sections.showPastHistory !== false && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                    Past History
                  </div>
                  <div style={{ fontSize: '10px', marginBottom: '2px', color: '#555' }}>(DM/HTN/Thyroid/Autoimmune)</div>
                  <div style={{ fontWeight: 600, color: '#111', paddingLeft: '2px' }}>
                    {casePaper.pastHistory || 'Nil'}
                  </div>
                </div>
              )}

              <div style={{ borderBottom: '1px solid #222', margin: '4px 0', width: '100%' }} />

              {/* Drug History / Allergy History */}
              {sections.showDrugHistory !== false && (
                <div style={{ marginBottom: '4px' }}>
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                    Drug History/Allergy History
                  </div>
                  <div style={{ fontWeight: 600, color: '#7c2222', paddingLeft: '2px', fontSize: '9.5px' }}>
                    {casePaper.allergies || 'Nil (NKDA)'}
                  </div>
                </div>
              )}

              <div style={{ borderBottom: '1px solid #222', margin: '4px 0', width: '100%' }} />

              {/* Investigations Advised */}
              {sections.showInvestigations !== false && (
                <div style={{ marginBottom: '3px' }}>
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, marginBottom: '1px', background: '#fff', fontSize: '9.5px' }}>
                    Investigations Advised
                  </div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '1px', marginBottom: '1px', fontWeight: 600, fontSize: '9.5px' }}>
                    <span>■ CBC</span>
                    <span>■ LFT</span>
                    <span>■ BSL®</span>
                  </div>
                  <div style={{ marginBottom: '2px', fontWeight: 600, fontSize: '9.5px' }}>
                    <span>■ Serum Creatinine</span>
                  </div>

                  {casePaper.investigationsAdvised && casePaper.investigationsAdvised.length > 0 && (
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#1e3a8a', marginBottom: '2px' }}>
                      Advised: {casePaper.investigationsAdvised.join(', ')}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '2px' }}>
                    <span>Done on</span>
                    <span style={{ flex: 1, borderBottom: '1px solid #555', height: '0.9em', marginLeft: '4px' }} />
                  </div>

                  <div style={{ marginTop: '3px', display: 'flex', alignItems: 'baseline' }}>
                    <span style={{ border: '1px solid #7c2222', padding: '0 3px', marginRight: '3px', fontWeight: 600, fontSize: '9.5px' }}>CBC-</span>
                    <span style={{ color: '#7c2222', fontWeight: 600, marginLeft: '6px', fontSize: '9.5px' }}>Hb-</span>
                    <span style={{ marginLeft: '18px', fontSize: '9.5px' }}>WBC-</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '1px', fontSize: '9.5px' }}>
                    <span>Platelet Count-</span>
                  </div>

                  <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />

                  <div>
                    <span style={{ border: '1px solid #7c2222', padding: '0 3px', marginRight: '3px', fontWeight: 600, fontSize: '9.5px' }}>LFT-</span>
                  </div>

                  <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />

                  <div>
                    <span style={{ border: '1px solid #7c2222', padding: '0 3px', marginRight: '3px', fontWeight: 600, fontSize: '9.5px' }}>BSL® -</span>
                  </div>

                  <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />

                  <div>
                    <span style={{ border: '1px solid #7c2222', padding: '0 3px', marginRight: '3px', fontWeight: 600, fontSize: '9.5px' }}>Serum Creatinine-</span>
                  </div>

                  <div style={{ borderBottom: '1px solid #222', margin: '3px 0', width: '100%' }} />

                  <div style={{ display: 'flex', alignItems: 'baseline', marginTop: '3px', fontWeight: 600, fontSize: '10px' }}>
                    <span>Next LAB Due Date :</span>
                  </div>
                </div>
              )}

              {/* Provisional/Final Diagnosis */}
              <div style={{ marginTop: '4px', marginBottom: '6px' }}>
                <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 6px', color: '#444', fontWeight: 600, background: '#fff', fontSize: '10px' }}>
                  Provisional/Final Diagnosis
                </div>
                <div style={{ fontWeight: 700, color: '#111', marginTop: '2px', paddingLeft: '2px', fontSize: '11px' }}>
                  {casePaper.complaint}
                </div>
              </div>

              <div style={{ borderBottom: '1px solid #222', margin: '4px 0', width: '100%' }} />

              {/* Patient Counselling Documentation */}
              {sections.showCounselling !== false && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', fontWeight: 600, lineHeight: 1.1, color: '#1e3a8a', background: '#fff', fontSize: '9.5px' }}>
                    Patient Counselling<br />Documentation
                  </div>
                  <div style={{ marginTop: '4px' }}>
                    {[
                      'Verbal consent taken',
                      'Diagnosis Explained',
                      'Risk&side effects explained',
                      'Monitoring Plan Explained',
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', fontSize: '10px' }}>
                        <span>{item}</span>
                        <span style={{ border: '1px solid #333', width: '12px', height: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700 }}>✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderBottom: '1px solid #222', margin: '4px 0', width: '100%' }} />

              {/* Warning Explained */}
              {sections.showWarnings !== false && (
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'inline-block', border: '1px solid #7c2222', padding: '1px 5px', color: '#444', fontWeight: 600, background: '#fff', fontSize: '9.5px' }}>
                    Warning Explained-
                  </div>
                  <div style={{ fontSize: '9.5px', lineHeight: 1.15, marginTop: '2px' }}>
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
                  width: '135px',
                  height: '135px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  fontSize: '6.4px',
                  lineHeight: 1.05,
                  margin: '4px auto 2px',
                  padding: '10px 8px',
                  fontWeight: 600,
                  color: '#111',
                  boxSizing: 'border-box',
                }}
              >
                <strong style={{ fontSize: '7.2px', display: 'block', marginBottom: '1px' }}>DRUG VERBAL CONSENT</strong>
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
            </aside>

            {/* ─── RIGHT MAIN AREA (Rx + Medicines) (78%) ─── */}
            <main style={{ width: '78%', padding: '10px 14px', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxSizing: 'border-box' }}>
              <div>
                {/* Top Rx Title & Caduceus Emblem Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', paddingRight: '4px' }}>
                  <div style={{ fontSize: '28px', fontFamily: "'EB Garamond', Georgia, serif", fontWeight: 800, fontStyle: 'italic', color: '#111' }}>
                    Rx
                  </div>
                  <svg width="38" height="42" viewBox="0 0 100 110" fill="none" xmlns="http://www.w3.org/2000/svg">
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
                    <path d="M 33 32 C 41 24, 46 24, 47.5 25.5" stroke="#2d773f" strokeWidth="4" strokeLinecap="round" fill="none" />
                    <path d="M 67 32 C 59 24, 54 24, 52.5 25.5" stroke="#2d773f" strokeWidth="4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>

                {/* Medicines Rx Table */}
                {(() => {
                  const minRows = 6;
                  const currentCount = casePaper.medicines ? casePaper.medicines.length : 0;
                  const emptyCount = Math.max(0, minRows - currentCount);

                  return (
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #333', fontSize: '11.5px' }}>
                      <thead>
                        <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #333', fontWeight: 700 }}>
                          <th style={{ border: '1px solid #333', padding: '5px 6px', textAlign: 'center', width: '48px' }}>Sr. No.</th>
                          <th style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left' }}>Medicine Name</th>
                          <th style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left', width: '75px' }}>Dosage</th>
                          <th style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left', width: '200px' }}>Frequency</th>
                          <th style={{ border: '1px solid #333', padding: '5px 8px', textAlign: 'left', width: '75px' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {casePaper.medicines &&
                          casePaper.medicines.map((med, index) => (
                            <tr key={index} style={{ borderBottom: '1px solid #333' }}>
                              <td style={{ border: '1px solid #333', padding: '6px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px' }}>{index + 1}</td>
                              <td style={{ border: '1px solid #333', padding: '6px 8px', fontWeight: 700, color: '#111', lineHeight: '1.3' }}>{med.name}</td>
                              <td style={{ border: '1px solid #333', padding: '6px 8px', color: '#333', lineHeight: '1.3' }}>{med.dosage}</td>
                              <td style={{ border: '1px solid #333', padding: '6px 8px', fontWeight: 600, color: '#222', lineHeight: '1.3' }}>{toMarathiFrequency(med.frequency)}</td>
                              <td style={{ border: '1px solid #333', padding: '6px 8px', color: '#333', lineHeight: '1.3' }}>{toMarathiDuration(med.duration)}</td>
                            </tr>
                          ))}
                        {Array.from({ length: emptyCount }).map((_, i) => (
                          <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #333', height: '24px' }}>
                            <td style={{ border: '1px solid #333', padding: '3px 6px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', color: '#ccc' }}>{currentCount + i + 1}</td>
                            <td style={{ border: '1px solid #333', padding: '3px 8px' }}></td>
                            <td style={{ border: '1px solid #333', padding: '3px 8px' }}></td>
                            <td style={{ border: '1px solid #333', padding: '3px 8px' }}></td>
                            <td style={{ border: '1px solid #333', padding: '3px 8px' }}></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}

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
                  position: 'absolute',
                  bottom: '2px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  color: '#222',
                }}
              >
                <span style={{ width: '60%' }}>Patient Signature - </span>
                <span>Follow up - {formatDate(casePaper.followUpDate)}</span>
              </div>
            </main>
          </div>

          {/* Template 1 Footer */}
          <footer
            style={{
              borderTop: '2px solid #a53b3b',
              padding: '4px 10px 6px',
              fontSize: '9.5px',
              fontWeight: 600,
              lineHeight: 1.15,
            }}
          >
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

            <div style={{ fontFamily: "'Mukta', sans-serif", fontSize: '11.5px', marginTop: '3px', lineHeight: 1.25 }}>
              - त्वचा विकाराची औषधे इतर औषधांप्रमाणे महाग असू शकतात. - चिठ्ठीमधील औषधे दिलेल्या अवधीसाठीच आहेत.<br />
              - काही विकार बरे होण्यास वेळ लागतो. तसेच काही विकार औषधानंतर काही प्रमाणात वाढतात व त्यानंतर बरे होतात.
            </div>

            {pharmacyInfo && (
              <div style={{ textAlign: 'center', fontWeight: 700, fontSize: '11px', paddingTop: '3px', borderTop: '1px solid #333', marginTop: '3px' }}>
                {pharmacyInfo}
              </div>
            )}
          </footer>
        </div>
      )}
    </div>
  );
}
