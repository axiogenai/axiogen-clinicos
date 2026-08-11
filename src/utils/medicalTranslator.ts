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
 * Medical Translator with Instant Bidirectional Dictionaries
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();

  if (lang === 'english') {
    let t = clean;
    // Translate Marathi phrases to English
    t = t.replace(/सकाळी १ व रात्री १ घेणे|१ गोळी सकाळी १ गोळी रात्री घेणे/g, '1-0-1 (1 Morning & 1 Night)');
    t = t.replace(/सकाळी १ घेणे/g, '1-0-0 (1 Morning)');
    t = t.replace(/रात्री १ घेणे|रात्री झोपताना घेणे|रात्री झोपताना/g, '0-0-1 (1 Night at Bedtime)');
    t = t.replace(/दुपारी १ घेणे/g, '0-1-0 (1 Afternoon)');
    t = t.replace(/सकाळी १, दुपारी १ व रात्री १ घेणे/g, '1-1-1 (1 Morning, 1 Afternoon & 1 Night)');
    t = t.replace(/दिवसातून ४ वेळा घेणे/g, '1-1-1-1 (4 Times Daily)');
    t = t.replace(/१\/२ गोळी सकाळी घेणे/g, '1/2 Tablet in Morning');
    t = t.replace(/उपाशीपोटी घेणे|सकाळी उपाशीपोटी घेणे/g, 'Before Breakfast (Empty Stomach)');
    t = t.replace(/जेवणानंतर घेणे/g, 'After Meals');
    t = t.replace(/गरज असेल तेव्हा घेणे|त्रास झाल्यास घेणे \(SOS\)|त्रास झाल्यास घेणे/g, 'As Needed (SOS)');
    t = t.replace(/pimples \(मोड्यांवर\) लावणे|मोड्यांवर लावणे/g, 'Apply on Pimples');
    t = t.replace(/काळ्या डागांवर लावणे|काळ्या डागावर लावणे/g, 'Apply on Dark Spots');
    t = t.replace(/संपूर्ण चेहऱ्यावर लावणे|full फेस लावणे/g, 'Apply on Full Face');
    t = t.replace(/डोक्यात लावणे/g, 'Apply on Scalp');
    t = t.replace(/केस \(डोके\) धुवावे|डोके धुणे/g, 'Wash Hair');
    t = t.replace(/सकाळी लावणे १-२ तास ठेवणे/g, 'Apply in Morning for 1-2 Hours');
    t = t.replace(/आठवड्यातून दोनदा/g, 'Twice a Week');
    t = t.replace(/एक दिवस आड/g, 'Alternate Days');
    return t;
  }

  if (lang === 'marathi') {
    let t = clean;
    t = t.replace(/\b1-0-1\b|\bbd\b|\bbid\b|\btwice daily\b/gi, 'सकाळी १ व रात्री १ घेणे');
    t = t.replace(/\b1-0-0\b|\bod\b|\bonce daily\b/gi, 'सकाळी १ घेणे');
    t = t.replace(/\b0-0-1\b|\bhs\b|\bat bedtime\b/gi, 'रात्री झोपताना १ घेणे');
    t = t.replace(/\b0-1-0\b/gi, 'दुपारी १ घेणे');
    t = t.replace(/\b1-1-1\b|\btds\b|\btid\b|\bthrice daily\b/gi, 'सकाळी १, दुपारी १ व रात्री १ घेणे');
    t = t.replace(/\b1-1-1-1\b|\bqid\b|\bfour times daily\b/gi, 'दिवसातून ४ वेळा घेणे');
    t = t.replace(/\bsos\b/gi, 'त्रास झाल्यास घेणे');
    t = t.replace(/\bstat\b/gi, 'तातडीने लगेच १ वेळा घेणे');

    t = t.replace(/after meals?|after food|pc/gi, 'जेवणानंतर घेणे');
    t = t.replace(/before meals?|before food|before breakfast|empty stomach|ac/gi, 'सकाळी उपाशीपोटी घेणे');
    t = t.replace(/at bedtime/gi, 'रात्री झोपताना घेणे');
    t = t.replace(/apply on pimples/gi, 'pimples (मोड्यांवर) लावणे');
    t = t.replace(/apply on dark spots/gi, 'काळ्या डागांवर लावणे');
    t = t.replace(/full face/gi, 'संपूर्ण चेहऱ्यावर लावणे');
    t = t.replace(/on scalp/gi, 'डोक्यात लावणे');
    t = t.replace(/wash hair/gi, 'केस (डोके) धुवावे');
    return t;
  }

  if (lang === 'hindi') {
    let t = clean;
    t = t.replace(/\b1-0-1\b|\bbd\b|\bbid\b|\btwice daily\b|सकाळी १ व रात्री १ घेणे/gi, 'सुबह १ और रात १');
    t = t.replace(/\b1-0-0\b|\bod\b|\bonce daily\b|सकाळी १ घेणे/gi, 'सुबह १');
    t = t.replace(/\b0-0-1\b|\bhs\b|\bat bedtime\b|रात्री झोपताना १ घेणे|रात्री १ घेणे/gi, 'रात को सोते समय १');
    t = t.replace(/\b0-1-0\b|दुपारी १ घेणे/gi, 'दोपहर १');
    t = t.replace(/\b1-1-1\b|\btds\b|\btid\b|\bthrice daily\b|सकाळी १, दुपारी १ व रात्री १ घेणे/gi, 'सुबह १, दोपहर १ और रात १');
    t = t.replace(/after meals?|after food|pc|जेवणानंतर घेणे/gi, 'भोजन के बाद');
    t = t.replace(/before meals?|before food|empty stomach|ac|उपाशीपोटी घेणे/gi, 'खाली पेट');
    return t;
  }

  if (lang === 'kannada') {
    let t = clean;
    t = t.replace(/\b1-0-1\b|\bbd\b|\bbid\b|\btwice daily\b|सकाळी १ व रात्री १ घेणे/gi, 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧');
    t = t.replace(/\b1-0-0\b|\bod\b|\bonce daily\b|सकाळी १ घेणे/gi, 'ಬೆಳಿಗ್ಗೆ ೧');
    t = t.replace(/\b0-0-1\b|\bhs\b|\bat bedtime\b|रात्री झोपताना १ घेणे/gi, 'ರಾತ್ರಿ ೧');
    t = t.replace(/after meals?|after food|pc|जेवणानंतर घेणे/gi, 'ಊಟದ ನಂತರ');
    t = t.replace(/before meals?|before food|empty stomach|ac|उपाशीपोटी घेणे/gi, 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ');
    return t;
  }

  return clean;
}
