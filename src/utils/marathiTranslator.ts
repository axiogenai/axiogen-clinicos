import { api } from '../api/client';

/**
 * Translates Romanized English / Hinglish / English medical text into natural Devanagari Marathi text
 * Uses Groq AI (llama-3.3-70b-versatile) with automatic fallback rules
 */
export async function translateFrequencyToMarathi(input: string): Promise<string> {
  if (!input || !input.trim()) return '';
  const text = input.trim();

  // Quick exact code shortcuts
  const lower = text.toLowerCase();
  if (lower === '1-0-1' || lower === 'bd' || lower === 'bid' || lower === 'twice daily') return 'सकाळी १ व रात्री १ घेणे';
  if (lower === '1-0-0' || lower === 'od' || lower === 'once daily') return 'सकाळी १ घेणे';
  if (lower === '0-0-1' || lower === 'hs' || lower === 'at bedtime') return 'रात्री झोपताना १ घेणे';
  if (lower === '0-1-0') return 'दुपारी १ घेणे';
  if (lower === '1-1-1' || lower === 'tds' || lower === 'tid' || lower === 'thrice daily') return 'सकाळी १, दुपारी १ व रात्री १ घेणे';
  if (lower === '1-1-1-1' || lower === 'qid' || lower === 'four times daily') return 'दिवसातून ४ वेळा घेणे';
  if (lower === 'sos') return 'त्रास झाल्यास घेणे';
  if (lower === 'stat') return 'तातडीने लगेच १ वेळा घेणे';

  // Call Groq AI translation API
  try {
    const res = await api.translateText(text, 'marathi');
    if (res && res.translatedText && res.translatedText !== '-' && res.translatedText.trim()) {
      return res.translatedText.trim();
    }
  } catch (e) {
    console.warn('Groq AI Translation network fallback:', e);
  }

  // Local fallback rule-based transliteration
  let t = text;
  t = t.replace(/\b1-0-1\b|\bbd\b|\bbid\b/gi, 'सकाळी १ व रात्री १ घेणे');
  t = t.replace(/\b1-0-0\b|\bod\b/gi, 'सकाळी १ घेणे');
  t = t.replace(/\b0-0-1\b|\bhs\b/gi, 'रात्री झोपताना १ घेणे');
  t = t.replace(/\b1-1-1\b|\btds\b|\btid\b/gi, 'सकाळी १, दुपारी १ व रात्री १ घेणे');
  t = t.replace(/sakali/gi, 'सकाळी');
  t = t.replace(/ratri/gi, 'रात्री');
  t = t.replace(/dupari/gi, 'दुपारी');
  t = t.replace(/goli/gi, 'गोळी');
  t = t.replace(/ghene/gi, 'घेणे');
  t = t.replace(/laavne|lavne/gi, 'लावणे');
  t = t.replace(/jevananantar|jevan nantar/gi, 'जेवणानंतर');
  t = t.replace(/upashi/gi, 'उपाशीपोटी');
  t = t.replace(/tapering|taper/gi, 'टेपरिंग');
  t = t.replace(/divas/gi, 'दिवस');
  t = t.replace(/cream/gi, 'क्रीम');

  return t;
}
