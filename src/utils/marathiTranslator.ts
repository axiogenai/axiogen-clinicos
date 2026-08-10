import { api } from '../api/client';

/**
 * Translates Romanized English / Hinglish / Marathi in Latin script into natural Devanagari Marathi text dynamically using AI
 */
export async function translateFrequencyToMarathi(input: string): Promise<string> {
  if (!input || !input.trim()) return '';
  const text = input.trim();

  // If input is ALREADY Devanagari script, return as is
  if (/^[\u0900-\u097F\s\d\:\-\_\,\.\(\)\/]+$/.test(text) && /[\u0900-\u097F]/.test(text)) {
    return text;
  }

  // Call dynamic translation API
  try {
    const res = await api.translateText(text, 'marathi');
    if (res && res.translatedText && res.translatedText !== '-' && res.translatedText.trim()) {
      return res.translatedText.trim();
    }
  } catch (e) {
    // fallback
  }

  return text;
}
