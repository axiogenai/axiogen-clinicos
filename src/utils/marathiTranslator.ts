import { api } from '../api/client';

function fixMarathiGrammar(str: string): string {
  if (!str) return '';
  return str
    .replace(/दुपारी\s+([\u0966-\u096F\d]+)\s+वेळा/gi, 'दिवसातून $1 वेळा')
    .replace(/दुपारी\s+तीन\s+वेळा/gi, 'दिवसातून ३ वेळा')
    .replace(/दुपारी\s+दोन\s+वेळा/gi, 'दिवसातून २ वेळा')
    .replace(/दुपारी\s+एक\s+वेळ/gi, 'दिवसातून १ वेळ');
}

/**
 * Translates Romanized English / Hinglish / Marathi in Latin script into natural Devanagari Marathi text dynamically using AI
 */
export async function translateFrequencyToMarathi(input: string): Promise<string> {
  if (!input || !input.trim()) return '';
  const text = input.trim();

  // If input is ALREADY Devanagari script, return fixed grammar
  if (/^[\u0900-\u097F\s\d\:\-\_\,\.\(\)\/]+$/.test(text) && /[\u0900-\u097F]/.test(text)) {
    return fixMarathiGrammar(text);
  }

  // Call dynamic translation API
  try {
    const res = await api.translateText(text, 'marathi');
    if (res && res.translatedText && res.translatedText !== '-' && res.translatedText.trim()) {
      return fixMarathiGrammar(res.translatedText.trim());
    }
  } catch (e) {
    // fallback
  }

  return fixMarathiGrammar(text);
}
