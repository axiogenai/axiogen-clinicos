/**
 * Pure Groq AI Medical Translator
 * Zero hardcoded dictionaries or static rule tables.
 * 100% of translations are generated dynamically by Groq AI.
 */

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

export function cleanFrequencyString(str?: string): string {
  if (!str) return '';
  return str.trim();
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
 * Pure pass-through: No hardcoded dictionary. Groq AI handles 100% of translations.
 */
export function translateMedicalText(text?: string, _lang: PrintLanguage = 'marathi'): string {
  if (!text) return '-';
  return text.trim();
}
