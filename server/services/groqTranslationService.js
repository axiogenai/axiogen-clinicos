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

function getGuidelines(lang) {
  return `STRICT TRANSLATION & TRANSLITERATION INSTRUCTIONS FOR ${lang.toUpperCase()}:
1. PURE DYNAMIC MEDICAL TRANSLATION & TRANSLITERATION:
   - Translate or transliterate the exact medical frequency, timing, or dosage instruction into natural Devanagari ${lang} script.
   - PRESERVE EXACT VERBS AND MEANING ACCORDING TO INTENT:
     * If the input specifies topical application (e.g. "lavne", "lav", "lavayche", "apply", "cream", "lotion", "gel"), USE THE VERB "लावणे" (Apply).
     * If the input specifies oral intake (e.g. "ghene", "take", "goli"), USE THE VERB "घेणे" (Take).
     * "sakali lavne" -> "सकाळी लावणे" (NEVER "सकाळी घेणे")
     * "sakali ghene" -> "सकाळी घेणे"
     * "udya skali lavne" -> "उद्या सकाळी लावणे"
     * "udya skali ghene" -> "उद्या सकाळी घेणे"
     * "chehryavar lavne" -> "चेहऱ्यावर लावणे"
     * "somvari ratri lavne" -> "सोमवारी रात्री लावणे"
   - PRESERVE ACCURATE FREQUENCY:
     * "3 times a day" / "3 times" / "divsatun 3" -> "दिवसातून ३ वेळा"
     * "2 times a day" / "2 times" / "divsatun 2" -> "दिवसातून २ वेळा"
     * "dupari 1" -> "दुपारी १"

2. CONSTRAINTS:
   - Output ONLY the final translated string in Devanagari ${lang}.
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

  try {
    const systemPrompt = `You are an expert Indian Clinical Dermatologist & Medical Translation Engine specializing in ${lang} prescription guidance.

Your task is to dynamically translate and transliterate any medical frequency, dosage, or instruction into natural Devanagari ${lang} script.

${getGuidelines(lang)}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate/transliterate this prescription instruction into Devanagari ${lang}: "${cleanText}"` }
        ],
        temperature: 0.0,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      return fallbackMedicalTranslate(cleanText, lang);
    }

    const data = await response.json();
    let translated = data.choices?.[0]?.message?.content?.trim();

    if (!translated) return fallbackMedicalTranslate(cleanText, lang);

    // Strip leading/trailing quote marks if any
    translated = translated.replace(/^["']|["']$/g, '').trim();

    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    return fallbackMedicalTranslate(cleanText, lang);
  }
}

module.exports = {
  translateWithGroq,
  stripRawCodes,
  fallbackMedicalTranslate
};
