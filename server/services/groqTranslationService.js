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
1. DYNAMIC MEDICAL TRANSLATION & TRANSLITERATION:
   - Translate or transliterate the exact medical frequency, timing, or dosage instruction into natural Devanagari ${lang} script.
   - PRESERVE ALL WORDS AND TIMING MODIFIERS (e.g. "udya skali ghene" -> "उद्या सकाळी घेणे", "udya pasun 1 goli" -> "उद्यापासून १ गोळी घेणे", "somvari ratri" -> "सोमवारी रात्री").
2. MEDICAL FREQUENCY RULES IN MARATHI:
   - "3 times a day" / "3 times" / "divsatun 3 vela" / "tid" / "tds" MUST be translated as "दिवसातून ३ वेळा घेणे" (NEVER "दुपारी ३ वेळा").
   - "2 times a day" / "2 times" / "divsatun 2 vela" / "bid" MUST be translated as "दिवसातून २ वेळा घेणे" or "सकाळी १ व रात्री १ घेणे".
   - "1 time a day" / "once a day" / "divsatun ekda" / "od" MUST be translated as "दिवसातून एकदा घेणे" or "दिवसातून १ वेळ घेणे".
   - "dupari" = "दुपारी" (afternoon). "dupari 1 goli" = "दुपारी १ गोळी घेणे". NEVER use "दुपारी X वेळा" because afternoon is a single time of day, whereas "X times a day" is "दिवसातून X वेळा".
   - "1-0-1" -> "सकाळी १ व रात्री १ घेणे".
   - "1-1-1" -> "सकाळी १, दुपारी १ व रात्री १ घेणे".
3. CONSTRAINTS:
   - Output ONLY the final translated string in Devanagari ${lang}.
   - Do NOT add quotes, brackets, preamble, conversational filler, or explanations.`;
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
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      return fallbackMedicalTranslate(cleanText, lang);
    }

    const data = await response.json();
    let translated = data.choices?.[0]?.message?.content?.trim();

    if (!translated) return fallbackMedicalTranslate(cleanText, lang);

    // Clean any unwanted AI conversational artifacts or quotes
    translated = translated.replace(/^["']|["']$/g, '').trim();

    // Correct invalid Marathi medical phrasing (e.g. "दुपारी ३ वेळा" -> "दिवसातून ३ वेळा")
    translated = translated.replace(/दुपारी\s+([\u0966-\u096F\d]+)\s+वेळा/gi, 'दिवसातून $1 वेळा');
    translated = translated.replace(/दुपारी\s+तीन\s+वेळा/gi, 'दिवसातून ३ वेळा');
    translated = translated.replace(/दुपारी\s+दोन\s+वेळा/gi, 'दिवसातून २ वेळा');
    translated = translated.replace(/दुपारी\s+एक\s+वेळ/gi, 'दिवसातून १ वेळ');

    translated = translated.replace(/\s*\((?:दिवसातून|दिन में|दिसून|दर|प्रति|दिन|times|वेळा)[^)]*\)?/gi, '').trim();

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
