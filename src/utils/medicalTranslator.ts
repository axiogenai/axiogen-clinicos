/**
 * Medical Translator with bidirectional Marathi <-> English <-> Hindi <-> Kannada support
 */

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

export function cleanFrequencyString(str?: string): string {
  if (!str) return '';
  let res = str
    .replace(/^(?:क्रीम|गोळी|cream|tab|tablet|tapering|टेपरिंग|तपेरिंग)[\s\:\-\_]*(?:टेपरिंग|तपेरिंग|tapering)?[\s\:\-\_]*/gi, '')
    .replace(/\s*\((?:दिवसातून|दिन में|दिसून|दर|प्रति|दिन|times|वेळा)[^)]*\)?/gi, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\(.*$/g, '')
    .trim();

  return res.replace(/^[\:\-\s]+/, '').trim();
}

export function stripRawCodes(str: string): string {
  if (!str) return '';
  return str
    .replace(/\b(\d+[\s\-\/]+){2,3}\d+\b/gi, '')
    .replace(/\b(bd|bid|od|hs|tds|tid|qid|sos|stat|qod|abf|bbf|pc|ac)\b/gi, '')
    .replace(/^[\s\-\:\,\(\)]+|[\s\-\:\,\(\)]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Medical Translator with Instant Robust Bidirectional Dictionaries
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();

  if (lang === 'kannada') {
    if (/सकाळी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-0-1|bd|bid/i.test(clean)) return 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧';
    if (/सकाळी\s*[1१]\s*घेणे|1-0-0|od|once daily/i.test(clean)) return 'ಬೆಳಿಗ್ಗೆ ೧';
    if (/रात्री\s*[1१]\s*घेणे|रात्री\s*झोपताना|0-0-1|hs|at bedtime/i.test(clean)) return 'ರಾತ್ರಿ ೧';
    if (/दुपारी\s*[1१]\s*घेणे|0-1-0/i.test(clean)) return 'ಮಧ್ಯಾಹ್ನ ೧';
    if (/सकाळी\s*[1१],\s*दुपारी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-1-1|tds|tid/i.test(clean)) return 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧';
    if (/दिवसातून\s*[4४]\s*वेळा\s*घेणे|1-1-1-1|qid/i.test(clean)) return 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ';
    if (/उपाशीपोटी|before meals|ac/i.test(clean)) return 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ';
    if (/जेवणानंतर|after meals|pc/i.test(clean)) return 'ಊಟದ ನಂತರ';
    if (/त्रास\s*झाल्यास|sos/i.test(clean)) return 'ಅಗತ್ಯವಿದ್ದಾಗ (SOS)';
    return clean;
  }

  if (lang === 'english') {
    if (/सकाळी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-0-1|bd|bid/i.test(clean)) return '1-0-1 (1 Morning & 1 Night)';
    if (/सकाळी\s*[1१]\s*घेणे|1-0-0|od|once daily/i.test(clean)) return '1-0-0 (1 Morning)';
    if (/रात्री\s*[1१]\s*घेणे|रात्री\s*झोपताना|0-0-1|hs|at bedtime/i.test(clean)) return '0-0-1 (1 Night at Bedtime)';
    if (/दुपारी\s*[1१]\s*घेणे|0-1-0/i.test(clean)) return '0-1-0 (1 Afternoon)';
    if (/सकाळी\s*[1१],\s*दुपारी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-1-1|tds|tid/i.test(clean)) return '1-1-1 (1 Morning, 1 Afternoon & 1 Night)';
    if (/दिवसातून\s*[4४]\s*वेळा\s*घेणे|1-1-1-1|qid/i.test(clean)) return '1-1-1-1 (4 Times Daily)';
    if (/उपाशीपोटी|before meals|ac/i.test(clean)) return 'Before Breakfast (Empty Stomach)';
    if (/जेवणानंतर|after meals|pc/i.test(clean)) return 'After Meals';
    if (/त्रास\s*झाल्यास|sos/i.test(clean)) return 'As Needed (SOS)';
    return clean;
  }

  if (lang === 'hindi') {
    if (/सकाळी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-0-1|bd|bid/i.test(clean)) return 'सुबह १ और रात १';
    if (/सकाळी\s*[1१]\s*घेणे|1-0-0|od|once daily/i.test(clean)) return 'सुबह १';
    if (/रात्री\s*[1१]\s*घेणे|रात्री\s*झोपताना|0-0-1|hs|at bedtime/i.test(clean)) return 'रात को सोते समय १';
    if (/दुपारी\s*[1१]\s*घेणे|0-1-0/i.test(clean)) return 'दोपहर १';
    if (/सकाळी\s*[1१],\s*दुपारी\s*[1१]\s*व\s*रात्री\s*[1१]\s*घेणे|1-1-1|tds|tid/i.test(clean)) return 'सुबह १, दोपहर १ और रात १';
    if (/दिवसातून\s*[4४]\s*वेळा\s*घेणे|1-1-1-1|qid/i.test(clean)) return 'दिन में ४ बार';
    if (/उपाशीपोटी|before meals|ac/i.test(clean)) return 'खाली पेट';
    if (/जेवणानंतर|after meals|pc/i.test(clean)) return 'भोजन के बाद';
    if (/त्रास\s*झाल्यास|sos/i.test(clean)) return 'ज़रूरत पड़ने पर (SOS)';
    return clean;
  }

  // Marathi (default)
  if (lang === 'marathi') {
    if (/1-0-1|bd|bid|twice daily/i.test(clean)) return 'सकाळी १ व रात्री १ घेणे';
    if (/1-0-0|od|once daily/i.test(clean)) return 'सकाळी १ घेणे';
    if (/0-0-1|hs|at bedtime/i.test(clean)) return 'रात्री झोपताना १ घेणे';
    if (/0-1-0/i.test(clean)) return 'दुपारी १ घेणे';
    if (/1-1-1|tds|tid|thrice daily/i.test(clean)) return 'सकाळी १, दुपारी १ व रात्री १ घेणे';
    if (/1-1-1-1|qid|four times daily/i.test(clean)) return 'दिवसातून ४ वेळा घेणे';
    if (/sos/i.test(clean)) return 'त्रास झाल्यास घेणे';
    if (/after meals?|after food|pc/i.test(clean)) return 'जेवणानंतर घेणे';
    if (/before meals?|before food|empty stomach|ac/i.test(clean)) return 'सकाळी उपाशीपोटी घेणे';
    return clean;
  }

  return clean;
}
