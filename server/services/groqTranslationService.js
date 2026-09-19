const GROQ_KEYS = [
  process.env.GROQ_API_KEY
].filter(k => k && k !== 'your_groq_api_key_here' && k.length > 20);

const cache = new Map();

function stripRawCodes(str) {
  if (!str) return '';
  return str
    .replace(/\b(\d+[\s\-\/]+){2,3}\d+\b/gi, '')
    .replace(/\b(bd|bid|od|hs|tds|tid|qid|sos|stat|qod|abf|bbf|pc|ac)\b/gi, '')
    .replace(/^[\s\-\:\,\(\)]+|[\s\-\:\,\(\)]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const LANG_CODE_MAP = {
  english: 'en',
  marathi: 'mr',
  hindi: 'hi',
  kannada: 'kn'
};

async function callGoogleTranslate(text, targetLang = 'marathi') {
  try {
    const tl = LANG_CODE_MAP[targetLang.toLowerCase()] || 'mr';
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    if (data && data[0] && Array.isArray(data[0])) {
      const translated = data[0].map(x => x[0]).join('').trim();
      if (translated) return translated;
    }
  } catch {}
  return text;
}

function getScriptForLang(lang) {
  const l = (lang || '').toLowerCase();
  if (l === 'kannada') return 'Kannada script';
  if (l === 'english') return 'English script';
  if (l === 'hindi') return 'Hindi (Devanagari) script';
  return 'Marathi (Devanagari) script';
}

function getGuidelines(lang) {
  const script = getScriptForLang(lang);
  return `STRICT TRANSLATION & TRANSLITERATION INSTRUCTIONS FOR ${lang.toUpperCase()}:
1. PURE DYNAMIC MEDICAL TRANSLATION:
   - Translate or transliterate the exact medical frequency, timing, dosage, or tapering instruction into natural ${script}.
   - PRESERVE EXACT VERBS AND INTENT:
     * Oral intake: "take", "घेणे", "लें", "ತೆಗೆದುಕೊಳ್ಳಿ"
     * Application: "apply", "नावणे", "नाव", "लावणे", "अप्लाई करें", "ಹಚ್ಚಿ"
   - PRESERVE ACCURATE REGIMEN & DURATION:
     * Keep numbers, days, frequency, and tapering steps 100% accurate (e.g. "7 days 3 times then 2 times then 1 time").
2. CONSTRAINTS:
   - Output ONLY the final translated text in ${script}.
   - Do NOT add quotes, preamble, conversational filler, or explanations.`;
}

async function translateWithGroq(text, targetLang = 'marathi') {
  if (!text || !text.trim()) return '-';
  const cleanText = text.trim();
  const lang = (targetLang || 'marathi').toLowerCase();

  const cacheKey = `${lang}:${cleanText.toLowerCase()}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const script = getScriptForLang(lang);
  const systemPrompt = `You are an expert Indian Clinical Dermatologist & Medical Translation Engine specializing in ${lang} (${script}) prescription guidance.

Your task is to dynamically translate and transliterate any medical frequency, dosage, or instruction into natural ${script}.

${getGuidelines(lang)}

Output ONLY a JSON object with this exact structure:
{
  "translatedText": "the translated text in ${script}"
}`;

  const models = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound-mini'];

  for (const apiKey of GROQ_KEYS) {
    for (const model of models) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'ClinicOS-Prescription-Engine/1.0'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Translate this prescription instruction into natural ${script} JSON format: "${cleanText}"` }
            ],
            temperature: 0.1,
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) continue;

        const data = await response.json();
        let rawContent = data.choices?.[0]?.message?.content?.trim();
        if (!rawContent) continue;

        let translated = '';
        try {
          const parsed = JSON.parse(rawContent);
          translated = parsed.translatedText || Object.values(parsed)[0];
        } catch {
          translated = rawContent;
        }

        if (typeof translated === 'string') {
          if (translated.includes('</think>')) {
            translated = translated.split('</think>').pop().trim();
          }
          translated = translated.replace(/^["'`*]+|["'`*]+$/g, '').trim();
        }

        if (translated && typeof translated === 'string' && translated.trim()) {
          cache.set(cacheKey, translated.trim());
          return translated.trim();
        }
      } catch (err) {}
    }
  }

  // Fallback to Google Neural Translate
  const fallback = await callGoogleTranslate(cleanText, lang);
  if (fallback && fallback.trim()) {
    cache.set(cacheKey, fallback.trim());
    return fallback.trim();
  }

  return cleanText;
}

module.exports = {
  translateWithGroq,
  stripRawCodes
};
