const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('⚠️ [GROQ TRANSLATOR]: GROQ_API_KEY is not defined in your environment (.env).');
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

function fallbackMedicalTranslate(text) {
  if (!text) return '-';
  return text.trim();
}

function getGuidelines(lang) {
  if (lang === 'hindi') {
    return `STRICT MEDICAL TRANSLATION GUIDELINES FOR HINDI:
1. CLINICAL FREQUENCIES (NO BRACKET EXPLANATIONS):
   - "1-0-1" or "BD" / "BID" -> "सुबह १ और रात १"
   - "1-0-0" or "OD" -> "सुबह १"
   - "0-0-1" or "HS" -> "रात को सोते समय १"
   - "0-1-0" -> "दोपहर १"
   - "1-1-1" or "TDS" / "TID" -> "सुबह १, दोपहर १ और रात १"
   - "1-1-1-1" or "QID" -> "दिन में ४ बार"
   - "SOS" -> "ज़रूरत होने पर / तकलीफ होने पर"
   - "STAT" -> "तुरंत एक बार"
   - "QOD" -> "एक दिन छोड़कर"

2. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "भोजन के बाद"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "खाली पेट"
   - "At Bedtime" -> "रात को सोते समय"
   - "Apply" / "Topical" -> "लगाएं"
   - "On dark spots" -> "काले धब्बों पर लगाएं"
   - "On pimples" -> "मुहांसों पर लगाएं"
   - "Full face" -> "पूरे चेहरे पर लगाएं"
   - "On scalp" -> "सिर पर लगाएं"
   - "Wash hair" -> "सिर धोएं"

3. GRAMMAR & POLITE CLINICAL VERBS:
   - Use correct Hindi polite/honorific verb suffixes ("लगाएं", "सेवन करें", "धोएं").
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS" in the final translation.
   - NEVER output bracketed explanations like (दिन में २ बार).
   - If the input is already in Devanagari/Hindi script, refine it into 100% grammatically flawless, natural Hindi.`;
  }

  if (lang === 'kannada') {
    return `STRICT MEDICAL TRANSLATION GUIDELINES FOR KANNADA:
1. CLINICAL FREQUENCIES (NO BRACKET EXPLANATIONS):
   - "1-0-1" or "BD" / "BID" -> "ಬೆಳಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧"
   - "1-0-0" or "OD" -> "ಬೆಳಗ್ಗೆ ೧"
   - "0-0-1" or "HS" -> "ರಾತ್ರಿ ಮಲಗುವಾಗ ೧"
   - "0-1-0" -> "ಮಧ್ಯಾಹ್ನ ೧"
   - "1-1-1" or "TDS" / "TID" -> "ಬೆಳಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧"
   - "1-1-1-1" or "QID" -> "ದಿನಕ್ಕೆ ೪ ಬಾರಿ"
   - "SOS" -> "ಅಗತ್ಯವಿದ್ದಾಗ"
   - "STAT" -> "ತಕ್ಷಣವೇ ಒಂದು ಬಾರಿ"
   - "QOD" -> "ಒಂದು ದಿನ ಬಿಟ್ಟು ಒಂದು ದಿನ"

2. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "ಊಟದ ನಂತರ"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ"
   - "At Bedtime" -> "ರಾತ್ರಿ ಮಲಗುವಾಗ"
   - "Apply" / "Topical" -> "ಹಚ್ಚಬೇಕು"
   - "On dark spots" -> "ಕಪ್ಪು ಕಲೆಗಳ ಮೇಲೆ ಹಚ್ಚಬೇಕು"
   - "On pimples" -> "ಮೊಡವೆಗಳ ಮೇಲೆ ಹಚ್ಚಬೇಕು"
   - "Full face" -> "ಮುಖ ಪೂರ್ತಿ ಹಚ್ಚಬೇಕು"
   - "On scalp" -> "ತಲೆಗೆ ಹಚ್ಚಬೇಕು"
   - "Wash hair" -> "ತಲೆ ತೊಳೆಯಬೇಕು"

3. GRAMMAR & POLITE CLINICAL VERBS:
   - Use correct Kannada polite/honorific verb suffixes ("ತೆಗೆದುಕೊಳ್ಳಬೇಕು", "ಹಚ್ಚಬೇಕು", "ತೊಳೆಯಬೇಕು").
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS" in the final translation.
   - NEVER output bracketed explanations like (ದಿನಕ್ಕೆ ೨ ಬಾರಿ).
   - If the input is already in Kannada script, refine it into 100% grammatically flawless, natural Kannada.`;
  }

  // Default: Marathi
  return `STRICT MEDICAL TRANSLATION GUIDELINES FOR MARATHI:
1. CLINICAL FREQUENCIES (STRICTLY NO BRACKET EXPLANATIONS LIKE "(दिवसातून २ वेळा)" OR "(दिवसातून एकदा)"):
   - "1-0-1" or "BD" / "BID" / "Twice daily" -> "सकाळी १ व रात्री १ घेणे"
   - "1-0-0" or "OD" / "Once daily" -> "सकाळी १ घेणे"
   - "0-0-1" or "HS" / "At bedtime" -> "रात्री झोपताना १ घेणे"
   - "0-1-0" -> "दुपारी १ घेणे"
   - "1-1-1" or "TDS" / "TID" / "Thrice daily" -> "सकाळी १, दुपारी १ व रात्री १ घेणे"
   - "1-1-1-1" or "QID" / "Four times daily" -> "दिवसातून ४ वेळा घेणे"
   - "SOS" -> "त्रास झाल्यास घेणे"
   - "STAT" -> "तातडीने लगेच १ वेळा घेणे"
   - "QOD" -> "एक दिवस आड घेणे"
   - "Once weekly" -> "आठवड्यातून एकदा घेणे"

2. TAPERING INSTRUCTIONS:
   - "Tapering Tab: 7d (BD -> OD)" / "Tapering Tab: 7d" -> "गोळी टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे"
   - "Tapering Cream: 7d (BD -> OD)" / "Tapering Cream: 7d" -> "क्रीम टेपरिंग: ७ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे"
   - "Tapering Tab: 5d (BD -> OD)" / "Tapering Tab: 5d" -> "गोळी टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे"
   - "Tapering Cream: 5d (BD -> OD)" / "Tapering Cream: 5d" -> "क्रीम टेपरिंग: ५ दिवस सकाळी-रात्री नंतर फक्त सकाळी लावणे"
   - "Tapering Tab: 7d (TDS -> BD -> OD)" -> "गोळी टेपरिंग: ७ दिवस तीनदा नंतर दोनदा नंतर एकदा घेणे"

3. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "जेवणानंतर घेणे"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "सकाळी उपाशीपोटी घेणे"
   - "At Bedtime" -> "रात्री झोपताना घेणे"
   - "Apply" / "Topical" -> "लावावे"
   - "On dark spots" -> "काळ्या डागांवर लावणे"
   - "On pimples" -> "pimples (मोड्यांवर) लावणे"
   - "Full face" -> "संपूर्ण चेहऱ्यावर लावणे"
   - "On scalp" -> "डोक्यात लावणे"
   - "Wash hair" -> "डोके (केस) धुवावे"

4. CRITICAL NEGATIVE CONSTRAINTS:
   - DO NOT USE BRACKETS like "(दिवसातून २ वेळा)", "(दिवसातून एकदा)", "(दिवसातून ३ वेळा)", "(दर ६ तासांनी)" or "(BD -> OD)".
   - Return ONLY the clean, natural Marathi medical text.
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS".
   - If the input is already in Devanagari/Marathi script, keep it intact and clean.`;
}

async function translateWithGroq(text, targetLang) {
  if (!text || !text.trim()) return '-';
  const cleanText = text.trim();
  const lang = (targetLang || 'marathi').toLowerCase();

  const cacheKey = `${lang}:${cleanText}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  if (!apiKey) {
    console.warn('⚠️ GROQ_API_KEY missing in .env - returning raw text');
    return cleanText;
  }

  try {
    const systemPrompt = `You are an elite Senior Indian Clinical Dermatologist & Medical Translation Engine specializing in Marathi, Hindi, Kannada, and English patient prescription guidance.

Your goal is to translate medical prescription frequencies, dosages, and instructions into 100% natural, grammatically flawless, culturally appropriate, and clear ${lang} text for patient reading.

${getGuidelines(lang)}

OUTPUT FORMAT:
- Return ONLY the final translated string in ${lang}.
- Do NOT add quotes, markdown formatting, explanations, or preambles.
- NEVER include bracketed frequency explanations like "(दिवसातून २ वेळा)".`;

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
          { role: 'user', content: `Translate this prescription text into ${lang}: "${cleanText}"` }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      console.error(`❌ Groq API Error: ${response.status} ${response.statusText}`);
      return cleanText;
    }

    const data = await response.json();
    let translated = data.choices?.[0]?.message?.content?.trim();

    if (!translated) return cleanText;

    // Clean any unwanted AI conversational artifacts or quotes
    translated = translated.replace(/^["']|["']$/g, '').trim();

    // Strip any bracketed explanation like (दिवसातून २ वेळा)
    translated = translated.replace(/\s*\((?:दिवसातून|दिन में|दिसून|दर|प्रति|दिन|times|वेळा)[^)]*\)?/gi, '').trim();

    cache.set(cacheKey, translated);
    return translated;
  } catch (err) {
    console.error('❌ Groq API Network Exception:', err.message);
    return cleanText;
  }
}

module.exports = {
  translateWithGroq,
  stripRawCodes,
  fallbackMedicalTranslate
};
