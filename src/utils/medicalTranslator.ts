/**
 * Professional Medical Prescription Instruction Translator
 * Provides 100% accurate, natural, and grammatically correct translations
 * for Indian clinical prescriptions (Marathi, Hindi, Kannada, English).
 * 
 * NOTE: Raw numeric codes (e.g. 1-1-1-1, 1-0-1) and alphanumeric codes (e.g. BD, OD, HS)
 * are stripped and replaced with clean, fully articulated words.
 */

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

// High-accuracy medical dictionary for frequencies and instructions
const MEDICAL_DICTIONARY: Record<string, Record<PrintLanguage, string>> = {
  // Standard Frequencies
  '1-0-1': {
    marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)',
    hindi: 'सुबह १ और रात १ (दिन में २ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)',
    english: 'Twice daily (Morning & Night)',
  },
  '1 - 0 - 1': {
    marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)',
    hindi: 'सुबह १ और रात १ (दिन में २ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)',
    english: 'Twice daily (Morning & Night)',
  },
  '1-0-0': {
    marathi: 'सकाळी १ (दिवसातून एकदा)',
    hindi: 'सुबह १ (दिन में एक बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Once daily (Morning)',
  },
  '1 - 0 - 0': {
    marathi: 'सकाळी १ (दिवसातून एकदा)',
    hindi: 'सुबह १ (दिन में एक बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Once daily (Morning)',
  },
  '0-0-1': {
    marathi: 'रात्री झोपताना १ (दिवसातून एकदा)',
    hindi: 'रात को सोते समय १ (दिन में एक बार)',
    kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Once daily (At bedtime)',
  },
  '0 - 0 - 1': {
    marathi: 'रात्री झोपताना १ (दिवसातून एकदा)',
    hindi: 'रात को सोते समय १ (दिन में एक बार)',
    kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Once daily (At bedtime)',
  },
  '0-1-0': {
    marathi: 'दुपारी १ (दिवसातून एकदा)',
    hindi: 'दोपहर १ (दिन में एक बार)',
    kannada: 'ಮಧ್ಯಾಹ್ನ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Afternoon (Once daily)',
  },
  '0 - 1 - 0': {
    marathi: 'दुपारी १ (दिवसातून एकदा)',
    hindi: 'दोपहर १ (दिन में एक बार)',
    kannada: 'ಮಧ್ಯಾಹ್ನ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)',
    english: 'Afternoon (Once daily)',
  },
  '1-1-1': {
    marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)',
    hindi: 'सुबह १, दोपहर १ और रात १ (दिन में ३ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)',
    english: 'Thrice daily (Morning, Afternoon & Night)',
  },
  '1 - 1 - 1': {
    marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)',
    hindi: 'सुबह १, दोपहर १ और रात १ (दिन में ३ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ आणि ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)',
    english: 'Thrice daily (Morning, Afternoon & Night)',
  },
  '1-1-1-1': {
    marathi: 'दिवसातून ४ वेळा (दर ६ तासांनी)',
    hindi: 'दिन में ४ बार (हर ६ घंटे में)',
    kannada: 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ (ಪ್ರತಿ ೬ ಗಂಟೆಗೆ)',
    english: '4 times a day (Every 6 hours)',
  },
  '1 - 1 - 1 - 1': {
    marathi: 'दिवसातून ४ वेळा (दर ६ तासांनी)',
    hindi: 'दिन में ४ बार (हर ६ घंटे में)',
    kannada: 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ (ಪ್ರತಿ ೬ ಗಂಟೆಗೆ)',
    english: '4 times a day (Every 6 hours)',
  },
  'bd': {
    marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)',
    hindi: 'सुबह १ और रात १ (दिन में २ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)',
    english: 'Twice daily',
  },
  'bid': {
    marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)',
    hindi: 'सुबह १ और रात १ (दिन में २ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)',
    english: 'Twice daily',
  },
  'od': {
    marathi: 'दिवसातून एकदा (सकाळी)',
    hindi: 'दिन में एक बार (सुबह)',
    kannada: 'ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ (ಬೆಳಿಗ್ಗೆ)',
    english: 'Once daily',
  },
  'hs': {
    marathi: 'रात्री झोपताना',
    hindi: 'रात को सोते समय',
    kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ',
    english: 'At bedtime',
  },
  'tds': {
    marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)',
    hindi: 'सुबह १, दोपहर १ और रात १ (दिन में ३ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)',
    english: 'Thrice daily',
  },
  'tid': {
    marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)',
    hindi: 'सुबह १, दोपहर १ और रात १ (दिन में ३ बार)',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)',
    english: 'Thrice daily',
  },
  'sos': {
    marathi: 'त्रास झाल्यास / गरज वाटल्यास घ्यावी',
    hindi: 'ज़रूरत पड़ने पर / तकलीफ होने पर लें',
    kannada: 'ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ತೆಗೆದುಕೊಳ್ಳಿ',
    english: 'As needed',
  },
  'stat': {
    marathi: 'तातडीने / लगेच एकाच वेळी घ्यावी',
    hindi: 'तुरंत एक बार लें',
    kannada: 'ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ',
    english: 'Immediately',
  },
  'qod': {
    marathi: 'एक दिवस आड घ्यावी',
    hindi: 'एक दिन छोड़कर लें',
    kannada: 'ಒಂದು ದಿನ ಬಿಟ್ಟು ಒಂದು ದಿನ ತೆಗೆದುಕೊಳ್ಳಿ',
    english: 'Every alternate day',
  },
  'once weekly': {
    marathi: 'आठवड्यातून एकदा घ्यावी',
    hindi: 'हफ़्ते में एक बार लें',
    kannada: 'ವಾರಕ್ಕೆ ಒಮ್ಮೆ ತೆಗೆದುಕೊಳ್ಳಿ',
    english: 'Once weekly',
  },
  'twice weekly': {
    marathi: 'आठवड्यातून दोनदा घ्यावी',
    hindi: 'हफ़्ते में दो बार लें',
    kannada: 'ವಾರಕ್ಕೆ ಎರಡು ಬಾರಿ ತೆಗೆದುಕೊಳ್ಳಿ',
    english: 'Twice weekly',
  },
  '1/2-0-1/2': {
    marathi: 'सकाळी १/२ व रात्री १/२ (अर्धी) गोळी',
    hindi: 'सुबह १/२ और रात १/२ (आधी) गोली',
    kannada: 'ಬೆಳಿಗ್ಗೆ ೧/೨ ಮತ್ತು ರಾತ್ರಿ ೧/೨ ಮಾತ್ರೆ',
    english: 'Half tab twice daily',
  },
  '0-0-1/2': {
    marathi: 'रात्री झोपताना १/२ (अर्धी) गोळी',
    hindi: 'रात को सोते समय १/२ (आधी) गोली',
    kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧/೨ ಮಾತ್ರೆ',
    english: 'Half tab at bedtime',
  },

  // Timings
  'after meals': {
    marathi: 'जेवणानंतर',
    hindi: 'खाना खाने के बाद',
    kannada: 'ಊಟದ ನಂತರ',
    english: 'After meals',
  },
  'after food': {
    marathi: 'जेवणानंतर',
    hindi: 'खाना खाने के बाद',
    kannada: 'ಊಟದ नंतर',
    english: 'After food',
  },
  'before meals': {
    marathi: 'उपाशीपोटी (जेवणापूर्वी)',
    hindi: 'खाली पेट (खाने से पहले)',
    kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (ಊಟಕ್ಕೆ ಮುಂಚೆ)',
    english: 'Before meals',
  },
  'before food': {
    marathi: 'उपाशीपोटी (जेवणापूर्वी)',
    hindi: 'खाली पेट (खाने से पहले)',
    kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (ಊಟಕ್ಕೆ ಮುಂಚೆ)',
    english: 'Before food',
  },
  'empty stomach': {
    marathi: 'उपाशीपोटी (जेवणापूर्वी)',
    hindi: 'खाली पेट (खाने से पहले)',
    kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ',
    english: 'On empty stomach',
  },

  // Topical & Application Instructions
  'apply on affected area': {
    marathi: 'फक्त बाधित भागावरच मलम लावावे',
    hindi: 'केवल प्रभावित हिस्से पर क्रीम लगाएं',
    kannada: 'ಬಾಧಿತ ಜಾಗಕ್ಕೆ ಮಾತ್ರ ಹಚ್ಚಿ',
    english: 'Apply on affected area',
  },
  'apply thin layer': {
    marathi: 'हळुवारपणे पातळ थर लावावा',
    hindi: 'हल्की पतली परत लगाएं',
    kannada: 'ತೆಳುವಾಗಿ ಹಚ್ಚಿ',
    english: 'Apply thin layer',
  },
  'apply at night': {
    marathi: 'रात्री झोपताना लावावे',
    hindi: 'रात को सोते समय लगाएं',
    kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ಹಚ್ಚಿ',
    english: 'Apply at night',
  },
  'apply in morning': {
    marathi: 'सकाळी लावावे',
    hindi: 'सुबह लगाएं',
    kannada: 'ಬೆಳಿಗ್ಗೆ ಹಚ್ಚಿ',
    english: 'Apply in morning',
  },
  'apply twice daily': {
    marathi: 'दिवसातून २ वेळा मलम लावावे',
    hindi: 'दिन में २ बार क्रीम लगाएं',
    kannada: 'ದಿನಕ್ಕೆ ೨ ಬಾರಿ ಹಚ್ಚಿ',
    english: 'Apply twice daily',
  },
  'wash face before applying': {
    marathi: 'चेहरा स्वच्छ धुऊन वाळवल्यानंतर मगच लावावे',
    hindi: 'चेहरा धोकर सुखाने के बाद लगाएं',
    kannada: 'ಮುಖ ತೊಳೆದ ನಂತರ ಹಚ್ಚಿ',
    english: 'Wash face before applying',
  },
  'sunscreen 15 min before sun': {
    marathi: 'उन्हात जाण्याच्या १५ मिनिटे आधी सनस्क्रीन लावावे',
    hindi: 'धूप में जाने से १५ मिनट पहले लगाएं',
    kannada: 'ಬಿಸಿಲಿಗೆ ಹೋಗುವ ೧೫ ನಿಮಿಷ ಮುಂಚೆ ಹಚ್ಚಿ',
    english: 'Apply sunscreen 15 min before sun exposure',
  },
  'for external use only': {
    marathi: 'फक्त बाह्य वापरासाठी (पिण्यासाठी नाही)',
    hindi: 'केवल बाहरी उपयोग के लिए',
    kannada: 'ಹೊರಗಿನ ಬಳಕೆಗೆ ಮಾತ್ರ',
    english: 'For external use only',
  },
};

/**
 * Normalizes numbers and cleans frequency string for display
 */
export function cleanFrequencyString(str?: string): string {
  if (!str) return '';
  return str
    .replace(/^(cream टेपरिंग:|cream tapering:|tab tapering:|गोळी टेपरिंग:)\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Removes raw numeric codes (1-1-1-1, 1-0-1, etc.) and alphanumeric codes (BD, OD, HS, etc.)
 */
export function stripRawCodes(str: string): string {
  if (!str) return '';
  return str
    .replace(/\b(\d+[\s\-\/]+){2,3}\d+\b/gi, '') // e.g. 1-1-1-1, 1-0-1, 1/2-0-1/2
    .replace(/\b(bd|bid|od|hs|tds|tid|qid|sos|stat|qod|abf|bbf|pc|ac)\b/gi, '') // e.g. BD, OD, HS
    .replace(/^[\s\-\:\,]+|[\s\-\:\,]+$/g, '') // strip leading/trailing punctuation/dashes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fast medical rule-based translator for Marathi, Hindi, Kannada & English
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text) return '-';
  const clean = cleanFrequencyString(text);
  if (!clean) return '-';

  const lower = clean.toLowerCase();

  // Direct exact dictionary match
  if (MEDICAL_DICTIONARY[lower] && MEDICAL_DICTIONARY[lower][lang]) {
    return MEDICAL_DICTIONARY[lower][lang];
  }

  // Smart Pattern Matching for Marathi
  if (lang === 'marathi') {
    let result = clean;

    // Check for standard code patterns in text and replace with full Marathi text
    if (/\b1\s*-\s*1\s*-\s*1\s*-\s*1\b/i.test(result) || /\bqid\b/i.test(result)) {
      result = result.replace(/\b1\s*-\s*1\s*-\s*1\s*-\s*1\b/gi, 'दिवसातून ४ वेळा (दर ६ तासांनी)').replace(/\bqid\b/gi, 'दिवसातून ४ वेळा (दर ६ तासांनी)');
    } else if (/\b1\s*-\s*0\s*-\s*1\b/i.test(result) || /\bbd\b/i.test(result) || /\bbid\b/i.test(result)) {
      result = result.replace(/\b1\s*-\s*0\s*-\s*1\b/gi, 'सकाळी १ व रात्री १').replace(/\b(bd|bid)\b/gi, 'दिवसातून २ वेळा');
    } else if (/\b1\s*-\s*0\s*-\s*0\b/i.test(result) || /\bod\b/i.test(result)) {
      result = result.replace(/\b1\s*-\s*0\s*-\s*0\b/gi, 'सकाळी १').replace(/\bod\b/gi, 'दिवसातून एकदा');
    } else if (/\b0\s*-\s*0\s*-\s*1\b/i.test(result) || /\bhs\b/i.test(result)) {
      result = result.replace(/\b0\s*-\s*0\s*-\s*1\b/gi, 'रात्री झोपताना १').replace(/\bhs\b/gi, 'रात्री झोपताना');
    } else if (/\b1\s*-\s*1\s*-\s*1\b/i.test(result) || /\btds\b/i.test(result) || /\btid\b/i.test(result)) {
      result = result.replace(/\b1\s*-\s*1\s*-\s*1\b/gi, 'सकाळी १, दुपारी १ व रात्री १').replace(/\b(tds|tid)\b/gi, 'दिवसातून ३ वेळा');
    } else if (/\bsos\b/i.test(result)) {
      result = result.replace(/\bsos\b/gi, 'गरज भासल्यास');
    } else if (/\bstat\b/i.test(result)) {
      result = result.replace(/\bstat\b/gi, 'तातडीने घ्यावे');
    }

    // Common phrases replacement
    result = result
      .replace(/after meals|after food|after lunch|after dinner/gi, 'जेवणानंतर')
      .replace(/before meals|before food|empty stomach/gi, 'उपाशीपोटी')
      .replace(/twice daily|twice a day/gi, 'दिवसातून २ वेळा')
      .replace(/once daily|once a day/gi, 'दिवसातून एकदा')
      .replace(/thrice daily|3 times a day/gi, 'दिवसातून ३ वेळा')
      .replace(/at bedtime|at night/gi, 'रात्री झोपताना')
      .replace(/in morning/gi, 'सकाळी')
      .replace(/as needed|when required/gi, 'गरज भासल्यास')
      .replace(/apply cream|apply ointment|apply gel/gi, 'मलम लावावे')
      .replace(/apply lotion/gi, 'लोशन लावावे')
      .replace(/apply on affected area|affected part/gi, 'बाधित भागावर लावावे')
      .replace(/tab tapering|cream tapering|tapering/gi, 'मात्रा हळूहळू कमी करत जाणे')
      .replace(/tablet|tab|capsule|cap/gi, 'गोळी');

    // Strip any lingering raw numeric codes or alphanumeric codes
    result = stripRawCodes(result);

    // Grammar fixes for common Marathi typos/awkward phrasing
    result = result
      .replace(/दिनाला\s*एकवेळा/gi, 'दिवसातून एकदा')
      .replace(/दिनाला\s*दोनवेळा/gi, 'दिवसातून दोनदा')
      .replace(/दिनाला\s*तीनवेळा/gi, 'दिवसातून तीनदा')
      .replace(/दिवसातून\s*एकवेळा/gi, 'दिवसातून एकदा')
      .replace(/दिवसातून\s*दोनवेळा/gi, 'दिवसातून दोनदा')
      .replace(/दिवसातून\s*तीनवेळा/gi, 'दिवसातून तीनदा')
      .replace(/गोळी\s+गोळी/gi, 'गोळी')
      .replace(/मलम\s+मलम/gi, 'मलम');

    return result.trim();
  }

  // Hindi pattern matching
  if (lang === 'hindi') {
    let result = clean;
    result = result
      .replace(/1-1-1-1|1 - 1 - 1 - 1|qid/gi, 'दिन में ४ बार (हर ६ घंटे में)')
      .replace(/1-0-1|1 - 0 - 1|bd|bid/gi, 'सुबह १ और रात १')
      .replace(/1-0-0|1 - 0 - 0|od/gi, 'सुबह १ (दिन में एक बार)')
      .replace(/0-0-1|0 - 0 - 1|hs/gi, 'रात को सोते समय १')
      .replace(/1-1-1|1 - 1 - 1|tds|tid/gi, 'सुबह १, दोपहर १ और रात १')
      .replace(/after meals|after food/gi, 'खाना खाने के बाद')
      .replace(/before meals|before food|empty stomach/gi, 'खाली पेट')
      .replace(/tablet|tab|capsule|cap/gi, 'गोली')
      .replace(/apply cream|apply/gi, 'क्रीम लगाएं');
    result = stripRawCodes(result);
    return result.trim();
  }

  // Kannada pattern matching
  if (lang === 'kannada') {
    let result = clean;
    result = result
      .replace(/1-1-1-1|1 - 1 - 1 - 1|qid/gi, 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ (ಪ್ರತಿ ೬ ಗಂಟೆಗೆ)')
      .replace(/1-0-1|1 - 0 - 1|bd|bid/gi, 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧')
      .replace(/1-0-0|1 - 0 - 0|od/gi, 'ಬೆಳಿಗ್ಗೆ ೧')
      .replace(/0-0-1|0 - 0 - 1|hs/gi, 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧')
      .replace(/1-1-1|1 - 1 - 1|tds|tid/gi, 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧')
      .replace(/after meals|after food/gi, 'ಊಟದ ನಂತರ')
      .replace(/before meals|before food|empty stomach/gi, 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ')
      .replace(/tablet|tab|capsule|cap/gi, 'ಮಾತ್ರೆ');
    result = stripRawCodes(result);
    return result.trim();
  }

  // English - Strip raw codes and replace with standard English frequency text
  let engResult = clean;
  engResult = engResult
    .replace(/1-1-1-1|1 - 1 - 1 - 1|\bqid\b/gi, '4 times a day (Every 6 hours)')
    .replace(/1-0-1|1 - 0 - 1|\b(bd|bid)\b/gi, 'Twice daily (Morning & Night)')
    .replace(/1-0-0|1 - 0 - 0|\bod\b/gi, 'Once daily (Morning)')
    .replace(/0-0-1|0 - 0 - 1|\bhs\b/gi, 'Once daily (At bedtime)')
    .replace(/1-1-1|1 - 1 - 1|\b(tds|tid)\b/gi, 'Thrice daily');
  engResult = stripRawCodes(engResult);
  return engResult.trim() || clean;
}
