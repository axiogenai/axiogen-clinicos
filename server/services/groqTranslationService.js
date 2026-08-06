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
1. CLINICAL FREQUENCIES:
   - "1-0-1" or "BD" / "BID" -> "सुबह १ और रात १ (दिन में २ बार)"
   - "1-0-0" or "OD" -> "सुबह १ (दिन में एक बार)"
   - "0-0-1" or "HS" -> "रात को सोते समय १ (दिन में एक बार)"
   - "0-1-0" -> "दोपहर १ (दिन में एक बार)"
   - "1-1-1" or "TDS" / "TID" -> "सुबह १, दोपहर १ और रात १ (दिन में ३ बार)"
   - "1-1-1-1" or "QID" -> "दिन में ४ बार (हर ६ घंटे में)"
   - "SOS" -> "ज़रूरत होने पर / तकलीफ होने पर"
   - "STAT" -> "तुरंत एक बार"
   - "QOD" -> "एक दिन छोड़कर"

2. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "भोजन के बाद"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "खाली पेट (भोजन से पहले)"
   - "At Bedtime" -> "रात को सोते समय"
   - "Apply" / "Topical" -> "लगाएं"
   - "On dark spots" -> "केवल काले धब्बों पर"
   - "On pimples" -> "केवल मुहांसों पर"
   - "Full face" -> "पूरे चेहरे पर"
   - "On scalp" -> "सिर पर"
   - "Wash hair" -> "सिर धोएं"

3. GRAMMAR & POLITE CLINICAL VERBS:
   - Use correct Hindi polite/honorific verb suffixes ("लगाएं", "सेवन करें", "धोएं").
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS" in the final translation.
   - If the input is already in Devanagari/Hindi script, refine it into 100% grammatically flawless, natural Hindi.`;
  }

  if (lang === 'kannada') {
    return `STRICT MEDICAL TRANSLATION GUIDELINES FOR KANNADA:
1. CLINICAL FREQUENCIES:
   - "1-0-1" or "BD" / "BID" -> "ಬೆಳಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೨ ಬಾರಿ)"
   - "1-0-0" or "OD" -> "ಬೆಳಗ್ಗೆ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)"
   - "0-0-1" or "HS" -> "ರಾತ್ರಿ ಮಲಗುವಾಗ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)"
   - "0-1-0" -> "ಮಧ್ಯಾಹ್ನ ೧ (ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ)"
   - "1-1-1" or "TDS" / "TID" -> "ಬೆಳಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧ (ದಿನಕ್ಕೆ ೩ ಬಾರಿ)"
   - "1-1-1-1" or "QID" -> "ದಿನಕ್ಕೆ ೪ ಬಾರಿ (ಪ್ರತಿ ೬ ಗಂಟೆಗೊಮ್ಮೆ)"
   - "SOS" -> "ಅಗತ್ಯವಿದ್ದಾಗ / ತೊಂದರೆ ಅನಿಸಿದಾಗ"
   - "STAT" -> "ತಕ್ಷಣವೇ ಒಂದು ಬಾರಿ"
   - "QOD" -> "ಒಂದು ದಿನ ಬಿಟ್ಟು ಒಂದು ದಿನ"

2. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "ಊಟದ ನಂತರ"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ (ಊಟಕ್ಕೆ ಮೊದಲು)"
   - "At Bedtime" -> "ರಾತ್ರಿ ಮಲಗುವಾಗ"
   - "Apply" / "Topical" -> "ಹಚ್ಚಬೇಕು"
   - "On dark spots" -> "ಕೇವಲ ಕಪ್ಪು ಕಲೆಗಳ ಮೇಲೆ ಮಾತ್ರ"
   - "On pimples" -> "ಕೇವಲ ಮೊಡವೆಗಳ ಮೇಲೆ"
   - "Full face" -> "ಮುಖ ಪೂರ್ತಿ"
   - "On scalp" -> "ತಲೆಗೆ"
   - "Wash hair" -> "ತಲೆ ತೊಳೆಯಬೇಕು"

3. GRAMMAR & POLITE CLINICAL VERBS:
   - Use correct Kannada polite/honorific verb suffixes ("ತೆಗೆದುಕೊಳ್ಳಬೇಕು", "ಹಚ್ಚಬೇಕು", "ತೊಳೆಯಬೇಕು").
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS" in the final translation.
   - If the input is already in Kannada script, refine it into 100% grammatically flawless, natural Kannada.`;
  }

  // Default: Marathi
  return `STRICT MEDICAL TRANSLATION GUIDELINES FOR MARATHI:
1. CLINICAL FREQUENCIES:
   - "1-0-1" or "BD" / "BID" -> "सकाळी १ व रात्री १ (दिवसातून २ वेळा)"
   - "1-0-0" or "OD" -> "सकाळी १ (दिवसातून एकदा)"
   - "0-0-1" or "HS" -> "रात्री झोपताना १ (दिवसातून एकदा)"
   - "0-1-0" -> "दुपारी १ (दिवसातून एकदा)"
   - "1-1-1" or "TDS" / "TID" -> "सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)"
   - "1-1-1-1" or "QID" -> "दिवसातून ४ वेळा (दर ६ तासांनी)"
   - "SOS" -> "त्रास झाल्यास / गरज वाटल्यास"
   - "STAT" -> "तातडीने लगेच १ वेळा"
   - "QOD" -> "एक दिवस आड"

2. MEAL TIMINGS & SPECIAL INSTRUCTIONS:
   - "After Meals" / "After Food" / "PC" -> "जेवणानंतर"
   - "Before Meals" / "Before Food" / "Before Breakfast" / "Empty Stomach" / "AC" -> "सकाळी उपाशीपोटी (जेवणापूर्वी)"
   - "At Bedtime" -> "रात्री झोपताना"
   - "Apply" / "Topical" -> "मलम लावावे"
   - "On dark spots" -> "फक्त काळ्या डागांवरच"
   - "On pimples" -> "फक्त फोडांवर (Pimples)"
   - "Full face" -> "संपूर्ण चेहऱ्यावर"
   - "On scalp" -> "डोक्यात"
   - "Wash hair" -> "डोके (केस) धुवावे"

3. GRAMMAR & POLITE CLINICAL VERBS:
   - Use correct Marathi honorific verb suffixes ("घ्यावी", "लावावे", "धुवावे", "ठेवावे").
   - NEVER output raw codes like "1-0-1", "1-1-1-1", "BD", "OD", "HS", "TDS" in the final translation.
   - If the input is already in Devanagari/Marathi script, refine it into 100% grammatically flawless, natural Marathi.`;
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
- Do NOT add quotes, markdown formatting, explanations, or preambles.`;

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
          { role: 'user', content: `Translate this prescription instruction to ${lang}: "${cleanText}"` }
        ],
        temperature: 0.1,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let result = data.choices?.[0]?.message?.content?.trim();

    if (result) {
      result = result.replace(/^["']|["']$/g, '');
      result = stripRawCodes(result);
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error(`❌ [GROQ AI TRANSLATION ERROR]:`, err.message);
  }

  return cleanText;
}

module.exports = {
  translateWithGroq,
  fallbackMedicalTranslate
};
