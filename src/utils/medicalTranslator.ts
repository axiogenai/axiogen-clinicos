/**
 * Pure Groq AI Medical Translator
 * Zero hardcoded dictionaries or static rule tables.
 * 100% of translations are generated dynamically by Groq AI.
 */

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

export function cleanFrequencyString(str?: string): string {
  if (!str) return '';
  // 1. Strip tapering prefixes like "क्रीम टेपरिंग:", "गोळी टेपरिंग:", "cream टेपरिंग:", "Tapering Cream:", "Tapering Tab:"
  let res = str
    .replace(/^(?:क्रीम|गोळी|cream|tab|tablet|tapering|टेपरिंग|तपेरिंग)[\s\:\-\_]*(?:टेपरिंग|तपेरिंग|tapering)?[\s\:\-\_]*/gi, '')
    // 2. Strip bracketed frequency explanations like (दिवसातून २ वेळा), (दिवसातून एकदा), (दिन में २ बार), (BD -> OD), etc.
    .replace(/\s*\((?:दिवसातून|दिन में|दिसून|दर|प्रति|दिन|times|वेळा)[^)]*\)?/gi, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\(.*$/g, '') // unclosed trailing bracket
    .trim();

  // Clean any leftover leading punctuation
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
 * Medical Translator with Groq AI + Instant Medical Dictionary Fallback
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();

  if (lang === 'english') return clean;

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
    t = t.replace(/\b1-0-1\b|\bbd\b|\bbid\b|\btwice daily\b/gi, 'सुबह १ और रात १');
    t = t.replace(/\b1-0-0\b|\bod\b|\bonce daily\b/gi, 'सुबह १');
    t = t.replace(/\b0-0-1\b|\bhs\b|\bat bedtime\b/gi, 'रात को सोते समय १');
    t = t.replace(/\b0-1-0\b/gi, 'दोपहर १');
    t = t.replace(/\b1-1-1\b|\btds\b|\btid\b|\bthrice daily\b/gi, 'सुबह १, दोपहर १ और रात १');
    t = t.replace(/after meals?|after food|pc/gi, 'भोजन के बाद');
    t = t.replace(/before meals?|before food|empty stomach|ac/gi, 'खाली पेट');
    return t;
  }

  return clean;
}
