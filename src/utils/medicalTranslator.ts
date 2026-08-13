import { api } from '../api/client';

export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

// Memory cache for instant re-renders
const translationCache = new Map<string, string>();

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
 * 100% Pure Dynamic Groq AI Translator
 * Zero hardcoded rules, zero static regex lists.
 * Queries backend Groq AI (/api/clinic/translate) for accurate multi-language translation.
 */
export async function translateMedicalTextAsync(text: string, lang: PrintLanguage = 'marathi'): Promise<string> {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();
  if (lang === 'english' && !isDevanagari(clean)) return clean;

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    const res = await api.translateText(clean, lang);
    if (res && res.translatedText) {
      translationCache.set(cacheKey, res.translatedText);
      return res.translatedText;
    }
  } catch (err) {
    console.warn('Groq AI Translation request error:', err);
  }

  return clean;
}

/**
 * Synchronous accessor for print components
 * Returns cached translation if available, otherwise triggers dynamic AI translation in background.
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();
  if (lang === 'english' && !isDevanagari(clean)) return clean;

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Trigger background Groq AI translation
  translateMedicalTextAsync(clean, lang).catch(() => {});

  return clean;
}
