export type SupportedLanguage = 'marathi' | 'english' | 'kannada' | 'hindi';

export const MONTH_NAMES: Record<SupportedLanguage, string[]> = {
  marathi: [
    'जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून',
    'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर'
  ],
  kannada: [
    'ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್',
    'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್'
  ],
  hindi: [
    'जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून',
    'जुलाई', 'अगस्त', 'सितम्बर', 'अक्टूबर', 'नवम्बर', 'दिसम्बर'
  ],
  english: [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ]
};

/**
 * Format date into localized text with full native month names for any given date dynamically.
 * Zero hardcoding.
 */
export function formatLocalizedDate(dateString?: string, lang: SupportedLanguage = 'marathi'): string {
  if (!dateString) return '__________';
  try {
    const parts = dateString.split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(dateString);
    }
    if (isNaN(dateObj.getTime())) return dateString;

    const day = dateObj.getDate();
    const monthIndex = dateObj.getMonth(); // 0 to 11
    const year = dateObj.getFullYear();

    const monthList = MONTH_NAMES[lang] || MONTH_NAMES.marathi;
    const monthName = monthList[monthIndex] || monthList[0];

    return `${day} ${monthName} ${year}`;
  } catch {
    return dateString;
  }
}

/**
 * Format follow-up date with difference in days and localized date representation.
 */
export function formatFollowUpDate(dateString?: string, lang: SupportedLanguage = 'marathi'): string {
  if (!dateString) return '__________';
  try {
    const parts = dateString.split('-');
    let dateObj: Date;
    if (parts.length === 3) {
      dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      dateObj = new Date(dateString);
    }
    if (isNaN(dateObj.getTime())) return dateString;

    const formattedDate = formatLocalizedDate(dateString, lang);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      if (lang === 'marathi') {
        return `${diffDays} दिवस (${formattedDate})`;
      } else if (lang === 'kannada') {
        return `${diffDays} ದಿನಗಳು (${formattedDate})`;
      } else if (lang === 'hindi') {
        return `${diffDays} दिन (${formattedDate})`;
      } else {
        return `${diffDays} Days (${formattedDate})`;
      }
    } else if (diffDays === 0) {
      if (lang === 'marathi') return `आज (${formattedDate})`;
      if (lang === 'kannada') return `ಇಂದು (${formattedDate})`;
      if (lang === 'hindi') return `आज (${formattedDate})`;
      return `Today (${formattedDate})`;
    }

    return formattedDate;
  } catch {
    return dateString;
  }
}
