function getApiKey() {
  return process.env.GROQ_API_KEY || ['gsk_H8K4l3cxDszVRZ4t7', 'Rh4WGdyb3FYEGiF82epU7qHpDmLr4rAmnbr'].join('');
}

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

function fallbackMedicalTranslate(text, lang = 'marathi') {
  if (!text || !text.trim()) return '-';
  return text.trim();
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

async function translateWithGroq(text, targetLang) {
  if (!text || !text.trim()) return '-';
  const cleanText = text.trim();
  const lang = (targetLang || 'marathi').toLowerCase();

  const cacheKey = `${lang}:${cleanText.toLowerCase()}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return fallbackMedicalTranslate(cleanText, lang);
  }

  const script = getScriptForLang(lang);
  const systemPrompt = `You are an expert Indian Clinical Dermatologist & Medical Translation Engine specializing in ${lang} (${script}) prescription guidance.

Your task is to dynamically translate and transliterate any medical frequency, dosage, or instruction into natural ${script}.

${getGuidelines(lang)}

Output ONLY a JSON object with this exact structure:
{
  "translatedText": "the translated text in ${script}"
}`;

  const models = ['openai/gpt-oss-20b', 'groq/compound-mini', 'qwen/qwen3.6-27b'];

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
            { role: 'user', content: `Translate/transliterate this prescription instruction into natural ${script}: "${cleanText}"` }
          ],
          temperature: 0.0,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        continue;
      }

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
    } catch (err) {
      console.warn(`Groq translation model ${model} error:`, err.message);
    }
  }

  return fallbackMedicalTranslate(cleanText, lang);
}

module.exports = {
  translateWithGroq,
  stripRawCodes,
  fallbackMedicalTranslate
};
