const fs = require('fs');

const path = 'src/components/PrintTemplate.tsx';
let fileContent = fs.readFileSync(path, 'utf8');

// Replace translateFrequency function cleanly
const newTranslateFreq = `export const translateFrequency = (freq?: string, medName?: string, lang: PrintLanguage = 'marathi'): string => {
  if (!freq) return '-';
  let str = freq.trim();

  // Strip out Latin abbreviation suffixes (BD, OD, TDS, QID, SOS, HS)
  str = str
    .replace(/\\(\\s*hs\\s*\\)/gi, '').replace(/\\bhs\\b/gi, '')
    .replace(/\\(\\s*bd\\s*\\)/gi, '').replace(/\\bbd\\b/gi, '')
    .replace(/\\(\\s*od\\s*\\)/gi, '').replace(/\\bod\\b/gi, '')
    .replace(/\\(\\s*tds\\s*\\)/gi, '').replace(/\\btds\\b/gi, '')
    .replace(/\\(\\s*qid\\s*\\)/gi, '').replace(/\\bqid\\b/gi, '')
    .replace(/\\(\\s*sos\\s*\\)/gi, '').replace(/\\bsos\\b/gi, '')
    .replace(/[\\(\\)]/g, '')
    .trim();

  const lower = str.toLowerCase();
  const isCream = !!(medName && (
    medName.toLowerCase().includes('cream') ||
    medName.toLowerCase().includes('gel') ||
    medName.toLowerCase().includes('ointment') ||
    medName.toLowerCase().includes('soap') ||
    medName.toLowerCase().includes('lotion') ||
    medName.toLowerCase().includes('shampoo') ||
    medName.toLowerCase().includes('drops') ||
    medName.toLowerCase().includes('spray')
  ));

  // --- ENGLISH ---
  if (lang === 'english') {
    if (lower.includes('tapering cream') || (lower.includes('taper') && isCream)) {
      return lower.includes('5d')
        ? '5 Days Apply Morning & Afternoon\\n➔ After 5 Days Apply Morning'
        : '7 Days Apply Morning & Afternoon\\n➔ After 7 Days Apply Morning';
    }
    if (lower.includes('tapering tab') || (lower.includes('taper') && !isCream)) {
      if (lower.includes('5d')) return '5 Days 1 Tab Morning & Night\\n➔ After 5 Days 1 Tab Morning';
      if (lower.includes('tds')) return '7 Days 1 Tab Morning, Afternoon & Night\\n➔ 7 Days 1 Tab Morning & Night\\n➔ 7 Days 1 Tab Morning';
      return '7 Days 1 Tab Morning & Night\\n➔ After 7 Days 1 Tab Morning';
    }
    if (lower === 'once daily' || lower === 'once a day' || lower === 'od' || lower === '') return 'Once daily';
    if (lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') return 'Twice daily - Morning & Night';
    if (lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') return 'Thrice daily - Morning, Afternoon & Night';
    if (lower === 'four times daily' || lower === 'qid') return '4 times daily';
    if (lower === 'once weekly' || lower.includes('weekly')) return 'Once weekly';
    if (lower.includes('bedtime') || lower.includes('at night')) return 'At bedtime';
    if (lower.includes('breakfast') || lower.includes('before meals')) return 'Before meals';
    if (lower.includes('after meal')) return 'After meals';
    if (lower.includes('as needed') || lower.includes('sos')) return 'As needed';
    if (lower.includes('apply') && lower.includes('clean') && lower.includes('dry')) return 'Apply on Clean & Dry area';
    if (lower.includes('morning bath') || lower.includes('bath daily')) return 'Use during morning bath daily';
    if (lower.includes('apply') && (lower.includes('morning') || lower.includes('night'))) return freq;
    return freq;
  }

  // --- HINDI ---
  if (lang === 'hindi') {
    if (lower.includes('tapering cream') || (lower.includes('taper') && isCream)) {
      return lower.includes('5d')
        ? '५ दिन सुबह - दोपहर लगाएं\\n➔ ५ दिन बाद: सुबह लगाएं'
        : '७ दिन सुबह - दोपहर लगाएं\\n➔ ७ दिन बाद: सुबह लगाएं';
    }
    if (lower.includes('tapering tab') || (lower.includes('taper') && !isCream)) {
      if (lower.includes('5d')) return '५ दिन सुबह १, रात १ गोली\\n➔ ५ दिन बाद: सुबह १ गोली लें';
      if (lower.includes('tds')) return '७ दिन सुबह १, दोपहर १, रात १ गोली\\n➔ ७ दिन सुबह १, रात १ गोली\\n➔ ७ दिन बाद: सुबह १ गोली लें';
      return '७ दिन सुबह १, रात १ गोली\\n➔ ७ दिन बाद: सुबह १ गोली लें';
    }
    if (lower === 'once daily' || lower === 'once a day' || lower === 'od' || lower === '') return 'दिन में १ बार';
    if (lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') return 'दिन में २ बार - सुबह और रात';
    if (lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') return 'दिन में ३ बार - सुबह, दोपहर और रात';
    if (lower === 'four times daily' || lower === 'qid') return 'दिन में ४ बार';
    if (lower.includes('bedtime') || lower.includes('night')) return 'रात को सोते समय';
    if (lower.includes('breakfast')) return 'नाश्ते से पहले';
    if (lower.includes('as needed') || lower.includes('sos')) return 'जरूरत पड़ने पर';
    return freq;
  }

  // --- KANNADA ---
  if (lang === 'kannada') {
    if (lower.includes('tapering cream') || (lower.includes('taper') && isCream)) {
      return lower.includes('5d')
        ? '೫ ದಿನ ಬೆಳಿಗ್ಗೆ - ಮಧ್ಯಾಹ್ನ ಹಚ್ಚಿ\\n➔ ೫ ದಿನಗಳ ನಂತರ: ಬೆಳಿಗ್ಗೆ ಹಚ್ಚಿ'
        : '೭ ದಿನ ಬೆಳಿಗ್ಗೆ - ಮಧ್ಯಾಹ್ನ ಹಚ್ಚಿ\\n➔ ೭ ದಿನಗಳ ನಂತರ: ಬೆಳಿಗ್ಗೆ ಹಚ್ಚಿ';
    }
    if (lower.includes('tapering tab') || (lower.includes('taper') && !isCream)) {
      if (lower.includes('5d')) return '೫ ದಿನ ಬೆಳಿಗ್ಗೆ ೧, ರಾತ್ರಿ ೧ ಮಾತ್ರೆ\\n➔ ೫ ದಿನಗಳ ನಂತರ: ಬೆಳಿಗ್ಗೆ ೧ ಮಾತ್ರೆ';
      if (lower.includes('tds')) return '೭ ದಿನ ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧, ರಾತ್ರಿ ೧ ಮಾತ್ರೆ\\n➔ ೭ ದಿನ ಬೆಳಿಗ್ಗೆ ೧, ರಾತ್ರಿ ೧ ಮಾತ್ರೆ\\n➔ ೭ ದಿನಗಳ ನಂತರ: ಬೆಳಿಗ್ಗೆ ೧ ಮಾತ್ರೆ';
      return '೭ ದಿನ ಬೆಳಿಗ್ಗೆ ೧, ರಾತ್ರಿ ೧ ಮಾತ್ರೆ\\n➔ ೭ ದಿನಗಳ ನಂತರ: ಬೆಳಿಗ್ಗೆ ೧ ಮಾತ್ರೆ';
    }
    if (lower === 'once daily' || lower === 'once a day' || lower === 'od' || lower === '') return 'ದಿನಕ್ಕೆ ೧ ಬಾರಿ';
    if (lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') return 'ದಿನಕ್ಕೆ ೨ ಬಾರಿ - ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ';
    if (lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') return 'ದಿನಕ್ಕೆ ೩ ಬಾರಿ - ಬೆಳಿಗ್ಗೆ, ಮಧ್ಯಾಹ್ನ ಮತ್ತು ರಾತ್ರಿ';
    if (lower === 'four times daily' || lower === 'qid') return 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ';
    if (lower === 'once weekly' || lower.includes('weekly')) return 'ವಾರಕ್ಕೆ ೧ ಬಾರಿ';
    if (lower.includes('bedtime') || lower.includes('at night')) return 'ರಾತ್ರಿ ಮಲಗುವಾಗ';
    if (lower.includes('breakfast') || lower.includes('before meals')) return 'ತಿಂಡಿಗೆ ಮುಂಚೆ';
    if (lower.includes('after meal')) return 'ಊಟದ ನಂತರ';
    if (lower.includes('as needed') || lower.includes('sos')) return 'ಅಗತ್ಯವಿದ್ದಾಗ';
    if (lower.includes('apply') && lower.includes('clean') && lower.includes('dry')) return 'ಶುದ್ಧ ಮತ್ತು ಒಣ ಚರ್ಮಕ್ಕೆ ಹಚ್ಚಿ';
    if (lower.includes('morning bath') || lower.includes('bath daily')) return 'ಬೆಳಿಗ್ಗೆ ಸ್ನಾನ ಮಾಡುವಾಗ ಉಪಯೋಗಿಸಿ';
    return freq;
  }

  // --- MARATHI (Default) ---
  if (lower.includes('tapering cream') || (lower.includes('taper') && isCream)) {
    if (lower.includes('5d')) return '५ दिवस सकाळी - दुपारी लावणे\\n➔ ५ दिवसानंतर -> सकाळी लावणे';
    return '७ दिवस सकाळी - दुपारी लावणे\\n➔ ७ दिवसानंतर -> सकाळी लावणे';
  }
  if (lower.includes('tapering tab') || (lower.includes('taper') && !isCream)) {
    if (lower.includes('5d')) return '५ दिवस सकाळी १, रात्री १ गोळी\\n➔ ५ दिवसानंतर -> सकाळी १ गोळी घेणे';
    if (lower.includes('tds')) return '७ दिवस सकाळी १, दुपारी १, रात्री १ गोळी\\n➔ ७ दिवस सकाळी १, रात्री १ गोळी\\n➔ ७ दिवसानंतर -> सकाळी १ गोळी घेणे';
    return '७ दिवस सकाळी १, रात्री १ गोळी\\n➔ ७ दिवसानंतर -> सकाळी १ गोळी घेणे';
  }

  if (isCream) {
    if (lower === 'once daily' || lower === 'once a day' || lower === 'od' || lower === '') return 'सकाळी लावणे';
    if (lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') return 'सकाळी व रात्री लावणे';
    if (lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') return 'सकाळी, दुपारी व रात्री लावणे';
    if (lower === 'four times daily' || lower === 'qid') return 'दिवसातून ४ वेळा लावणे';
  } else {
    if (lower === 'once daily' || lower === 'once a day' || lower === 'od' || lower === '') return 'सकाळी १';
    if (lower === 'twice daily' || lower === 'twice a day' || lower === 'bd') return 'सकाळी १, रात्री १';
    if (lower === 'thrice daily' || lower === 'thrice a day' || lower === 'tds') return 'सकाळी १, दुपारी १, रात्री १';
    if (lower === 'four times daily' || lower === 'qid') return 'सकाळी १, दुपारी १, संध्याकाळी १, रात्री १';
  }

  if (lower === 'once weekly' || lower.includes('weekly')) return 'आठवड्यातून १ वेळ';
  if (lower.includes('bedtime') || lower.includes('at night')) return 'रात्री झोपताना';
  if (lower.includes('breakfast') || lower.includes('before meals')) return 'सकाळी उपाशीपोटी / जेवणापूर्वी';
  if (lower.includes('after meal')) return 'जेवणानंतर';
  if (lower.includes('as needed') || lower.includes('sos')) return 'गरज असेल तेव्हा';
  // Topical / soap instructions
  if (lower.includes('apply') && lower.includes('clean') && lower.includes('dry')) return 'स्वच्छ व कोरड्या भागावर लावणे';
  if (lower.includes('morning bath') || lower.includes('bath daily')) return 'सकाळी अंघोळ करताना वापरणे';
  if (lower.includes('apply') && lower.includes('morning') && lower.includes('night')) return 'सकाळी व रात्री लावणे';
  if (lower.includes('apply') && lower.includes('morning')) return 'सकाळी लावणे';
  if (lower.includes('apply') && lower.includes('night')) return 'रात्री लावणे';
  if (lower.includes('apply') && lower.includes('twice')) return 'दिवसातून २ वेळा लावणे';
  if (lower.includes('apply') && lower.includes('once')) return 'दिवसातून १ वेळ लावणे';
  if (lower.includes('apply')) return 'लावणे';

  return str.replace(/[\\(\\)]/g, '').trim();
};

export const renderFrequencyCell = (freq?: string, medName?: string, lang: PrintLanguage = 'marathi') => {
  const primaryRaw = translateFrequency(freq, medName, lang);
  const formatMultiline = (text: string) => {
    if (!text) return text;
    if ((text.includes('➔') || text.includes('->')) && !text.includes('\\n')) {
      return text.replace(/\\s*(➔|->)\\s*/g, '\\n➔ ');
    }
    return text;
  };

  const primaryText = formatMultiline(primaryRaw);

  if (lang === 'marathi') {
    return <div style={{ whiteSpace: 'pre-line', lineHeight: '1.35' }}>{primaryText}</div>;
  }
  const marathiText = formatMultiline(translateFrequency(freq, medName, 'marathi'));
  return (
    <div style={{ lineHeight: '1.25' }}>
      <div style={{ whiteSpace: 'pre-line' }}>{primaryText}</div>
      <div style={{ fontSize: '9.5px', color: '#555', fontWeight: 500, marginTop: '2px', whiteSpace: 'pre-line' }}>
        (मराठी: {marathiText})
      </div>
    </div>
  );
};`;

// Replace from export const translateFrequency down to end of renderFrequencyCell
const startIdx = fileContent.indexOf('export const translateFrequency');
const endMarker = 'export const toMarathiFrequency';
const endIdx = fileContent.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const updatedContent = fileContent.slice(0, startIdx) + newTranslateFreq + '\n\n' + fileContent.slice(endIdx);
  fs.writeFileSync(path, updatedContent, 'utf8');
  console.log('Successfully updated PrintTemplate.tsx');
} else {
  console.error('Could not find start/end markers', { startIdx, endIdx });
}
