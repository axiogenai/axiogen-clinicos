import type { Patient, QueueItem } from '../data/patients';

export type PatientLang = 'marathi' | 'english' | 'hindi' | 'kannada';

/**
 * Formats patient age handling both years (adults/children) and months (babies/infants).
 * E.g.:
 *  - Baby in months: "4 Months", "1.2 Months", "3 Months", "४ महिने", "೪ ತಿಂಗಳು"
 *  - Adults in years: "28 Yrs", "28 वर्षे", "28 वर्ष", "28 ವರ್ಷ"
 */
export function formatPatientAge(
  patient?: Partial<Patient | QueueItem> | {
    age?: number | string;
    ageUnit?: 'years' | 'months';
    ageMonths?: number | string;
    notes?: string;
  } | null,
  lang: PatientLang = 'english'
): string {
  if (!patient) return '';

  let unit = patient.ageUnit;
  let monthsVal = patient.ageMonths;

  // Check notes for persistent baby age metadata tag if not explicitly set
  if (!unit && patient.notes && typeof patient.notes === 'string') {
    const match = patient.notes.match(/\[AGE_MONTHS:([^\]]+)\]/);
    if (match) {
      unit = 'months';
      monthsVal = match[1];
    }
  }

  // Baby in months
  if (unit === 'months' && monthsVal !== undefined && monthsVal !== '' && monthsVal !== null) {
    const mStr = String(monthsVal).trim();
    switch (lang) {
      case 'marathi':
        return `${mStr} महिने`;
      case 'hindi':
        return `${mStr} महीने`;
      case 'kannada':
        return `${mStr} ತಿಂಗಳು`;
      case 'english':
      default:
        return `${mStr} Months`;
    }
  }

  // Adult / child in years
  const ageVal = patient.age;
  if (ageVal !== undefined && ageVal !== null && ageVal !== '') {
    const num = Number(ageVal);
    if (!isNaN(num) && num > 0) {
      switch (lang) {
        case 'marathi':
          return `${num} वर्षे`;
        case 'hindi':
          return `${num} वर्ष`;
        case 'kannada':
          return `${num} ವರ್ಷ`;
        case 'english':
        default:
          return `${num} Yrs`;
      }
    } else if (num === 0 && monthsVal) {
      // Age is 0 in DB but baby has months
      const mStr = String(monthsVal).trim();
      return lang === 'marathi' ? `${mStr} महिने` : `${mStr} Months`;
    }
  }

  return '';
}

/**
 * Formats short age for compact tables / lists.
 * E.g. "4 M" for baby, "28 Y" for adult.
 */
export function formatShortAge(
  patient?: Partial<Patient | QueueItem> | {
    age?: number | string;
    ageUnit?: 'years' | 'months';
    ageMonths?: number | string;
    notes?: string;
  } | null
): string {
  if (!patient) return '-';

  let unit = patient.ageUnit;
  let monthsVal = patient.ageMonths;

  if (!unit && patient.notes && typeof patient.notes === 'string') {
    const match = patient.notes.match(/\[AGE_MONTHS:([^\]]+)\]/);
    if (match) {
      unit = 'months';
      monthsVal = match[1];
    }
  }

  if (unit === 'months' && monthsVal !== undefined && monthsVal !== '' && monthsVal !== null) {
    return `${monthsVal} M`;
  }

  if (patient.age !== undefined && patient.age !== null && patient.age !== '') {
    const num = Number(patient.age);
    if (!isNaN(num) && num > 0) {
      return `${num} Y`;
    }
  }

  return '-';
}

/**
 * Formats "Age / Gender" string for prescriptions and patient banners.
 * E.g.: "4 Months / Male", "1.2 Months / Female", "28 Yrs / Male", "४ महिने / पुरुष"
 */
export function formatAgeGender(
  patient?: any,
  lang: PatientLang = 'english'
): string {
  if (!patient) return '';

  const ageStr = formatPatientAge(patient, lang);
  const rawGender = patient.gender || 'M';

  const genderMap: Record<string, Record<PatientLang, string>> = {
    M: { english: 'Male', marathi: 'पुरुष', hindi: 'पुरुष', kannada: 'ಪುರುಷ' },
    F: { english: 'Female', marathi: 'स्त्री', hindi: 'स्त्री', kannada: 'ಮಹಿಳೆ' },
    Other: { english: 'Other', marathi: 'इतर', hindi: 'अन्य', kannada: 'ಇತರೆ' },
  };

  const genderText = genderMap[rawGender]?.[lang] || genderMap[rawGender]?.english || 'Male';

  if (!ageStr) return genderText;
  return `${ageStr} / ${genderText}`;
}
