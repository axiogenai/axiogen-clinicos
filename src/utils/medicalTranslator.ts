export type PrintLanguage = 'marathi' | 'english' | 'hindi' | 'kannada';

// Memory cache for instant re-renders
const translationCache = new Map<string, string>();

// Load persistent cache from localStorage
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = localStorage.getItem('clinicos_translation_cache');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([k, v]) => {
        if (typeof v === 'string') translationCache.set(k, v);
      });
    }
  }
} catch {}

function saveToPersistentCache(key: string, value: string) {
  translationCache.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      // Keep cache size bounded to last 1000 entries
      const entries = Array.from(translationCache.entries()).slice(-1000);
      localStorage.setItem('clinicos_translation_cache', JSON.stringify(Object.fromEntries(entries)));
    }
  } catch {}
}

const GROQ_KEYS = [
  import.meta.env.VITE_GROQ_API_KEY || ''
].filter(Boolean);

const GROQ_MODELS = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound-mini'];

const LANG_CODE_MAP: Record<PrintLanguage, string> = {
  english: 'en',
  marathi: 'mr',
  hindi: 'hi',
  kannada: 'kn'
};

export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

export function isKannada(text: string): boolean {
  return /[\u0C80-\u0CFF]/.test(text);
}

export function cleanFrequencyString(str?: string): string {
  if (!str) return '';
  let res = str
    .replace(/^(?:क्रीम|गोळी|cream|tab|tablet|tapering|टेपरिंग|तपेरिंग)[\s\:\-\_]*(?:टेपरिंग|तपेरिंग|tapering)?[\s\:\-\_]*/gi, '')
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

async function callGoogleNeuralTranslate(text: string, targetLang: PrintLanguage): Promise<string | null> {
  try {
    const tl = LANG_CODE_MAP[targetLang] || 'mr';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].map((x: any) => x[0]).join('').trim();
      if (translated) return translated;
    }
  } catch {}
  return null;
}

async function callGroqAI(text: string, targetLang: PrintLanguage): Promise<string | null> {
  const scriptPrompt =
    targetLang === 'english'
      ? 'English'
      : targetLang === 'hindi'
      ? 'Hindi (Devanagari script)'
      : targetLang === 'kannada'
      ? 'Kannada script'
      : 'Marathi (Devanagari script)';

  const systemPrompt = `You are an expert clinical medical translator for Indian dermatology prescriptions.
Translate the medical prescription frequency, duration, dosage, or instructions into natural, fluent ${scriptPrompt}.
Ensure clinical accuracy:
- Oral medicines: use verbs like "take" in English, "घेणे/घ्या" in Marathi, "लें/लेना" in Hindi, "ತೆಗೆದುಕೊಳ್ಳಿ" in Kannada.
- Topical medicines/creams/gels: use verbs like "apply" in English, "नावणे/लावा" in Marathi, "लगाएं/लगाना" in Hindi, "ಹಚ್ಚಿ" in Kannada.
- Regimen timing: "alternate days" / "एक दिवस आड" / "एक दिन छोड़कर", "overnight" / "रात्रभर" / "रात भर", "on face" / "चेहऱ्यावर" / "चेहरे पर", "after meals" / "जेवणानंतर" / "भोजन के बाद".
- Preserve exact numbers, hours, days, and duration.
- Output ONLY the final translated text without quotes, markdown, or explanations.`;

  for (const key of GROQ_KEYS) {
    for (const model of GROQ_MODELS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3800);
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: text }
            ],
            temperature: 0.1
          }),
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (!res.ok) continue;
        const data = await res.json();
        let content = data.choices?.[0]?.message?.content?.trim();
        if (content) {
          if (content.includes('</think>')) {
            content = content.split('</think>').pop()?.trim() || '';
          }
          content = content.replace(/^["'`*]+|["'`*]+$/g, '').trim();
          if (content && content !== text) {
            return content;
          }
        }
      } catch {}
    }
  }
  return null;
}

/**
 * 100% Dynamic Multi-Lingual Medical Translation Engine
 * Translates frequencies, instructions, durations, notes across English, Marathi, Hindi, and Kannada.
 */
export async function translateMedicalTextAsync(text: string, lang: PrintLanguage = 'marathi'): Promise<string> {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();
  if (clean === '-') return '-';

  // Instant bypass if text is already exclusively in the target language's primary script
  const isDev = isDevanagari(clean);
  const isKan = isKannada(clean);
  const isPureLatin = !isDev && !isKan;

  // If text is pure English and target is English: return clean
  if (lang === 'english' && isPureLatin) {
    return clean;
  }

  // If text is pure Kannada and target is Kannada: return clean
  if (lang === 'kannada' && isKan && !isDev && !isPureLatin) {
    return clean;
  }

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // 1. Try Groq AI (medical specialized prompt)
  let translated = await callGroqAI(clean, lang);

  // 2. Fallback to Google Neural Translate
  if (!translated || translated === clean) {
    translated = await callGoogleNeuralTranslate(clean, lang);
  }

  if (translated && translated.trim()) {
    saveToPersistentCache(cacheKey, translated.trim());
    return translated.trim();
  }

  return clean;
}

/**
 * Synchronous accessor for print components
 * Returns cached translation if available, otherwise triggers background translation and returns input.
 */
export function translateMedicalText(text?: string, lang: PrintLanguage = 'marathi'): string {
  if (!text || !text.trim()) return '-';
  const clean = text.trim();
  if (clean === '-') return '-';

  const isDev = isDevanagari(clean);
  const isKan = isKannada(clean);
  const isPureLatin = !isDev && !isKan;

  if (lang === 'english' && isPureLatin) return clean;
  if (lang === 'kannada' && isKan && !isDev && !isPureLatin) return clean;

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Trigger background translation to populate cache for subsequent render
  translateMedicalTextAsync(clean, lang).catch(() => {});

  return clean;
}

/**
 * 100% Dynamic Duration Translator (Pure AI)
 * Lets AI translate all duration expressions dynamically (e.g. "20 Days", "20 दिवस", "चेहऱ्यावर", etc.)
 */
export function translateDurationSync(dur?: string, lang: PrintLanguage = 'marathi'): string {
  if (!dur || !dur.trim()) return '-';
  const clean = dur.trim();
  if (clean === '-') return '-';

  const cacheKey = `${lang}:${clean.toLowerCase()}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  // Trigger background pure AI translation to populate cache
  translateMedicalTextAsync(clean, lang).catch(() => {});

  return clean;
}

export async function translateDurationAsync(dur: string, lang: PrintLanguage = 'marathi'): Promise<string> {
  if (!dur || !dur.trim()) return '-';
  const clean = dur.trim();
  if (clean === '-') return '-';

  return translateMedicalTextAsync(clean, lang);
}
