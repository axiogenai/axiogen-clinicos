const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('⚠️  [GROQ TRANSLATOR]: GROQ_API_KEY is not defined in your environment (.env). AI translator will use internal clinical dictionary.');
}

const cache = new Map();

// Medical dictionary for fast offline/pre-pass translation
const MEDICAL_DICTIONARY = {
  '1-0-1': { marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)', hindi: 'सुबह १ और रात १ (दिन में २ बार)', kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  '1 - 0 - 1': { marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)', hindi: 'सुबह १ और रात १ (दिन में २ बार)', kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  '1-0-0': { marathi: 'सकाळी १ (दिवसातून एकदा)', hindi: 'सुबह १ (दिन में एक बार)', kannada: 'ಬೆಳಿಗ್ಗೆ ೧' },
  '1 - 0 - 0': { marathi: 'सकाळी १ (दिवसातून एकदा)', hindi: 'सुबह १ (दिन में एक बार)', kannada: 'ಬೆಳಿಗ್ಗೆ ೧' },
  '0-0-1': { marathi: 'रात्री झोपताना १ (दिवसातून एकदा)', hindi: 'रात को सोते समय १', kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧' },
  '0 - 0 - 1': { marathi: 'रात्री झोपताना १ (दिवसातून एकदा)', hindi: 'रात को सोते समय १', kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧' },
  '0-1-0': { marathi: 'दुपारी १ (दिवसातून एकदा)', hindi: 'दोपहर १', kannada: 'ಮಧ್ಯಾಹ್ನ ೧' },
  '1-1-1': { marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)', hindi: 'सुबह १, दोपहर १ और रात १', kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  '1-1-1-1': { marathi: 'दिवसातून ४ वेळा (दर ६ तासांनी)', hindi: 'दिन में ४ बार (हर ६ घंटे में)', kannada: 'ದಿನಕ್ಕೆ ೪ ಬಾರಿ' },
  'bd': { marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)', hindi: 'सुबह १ और रात १', kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  'bid': { marathi: 'सकाळी १ व रात्री १ (दिवसातून २ वेळा)', hindi: 'सुबह १ और रात १', kannada: 'ಬೆಳಿಗ್ಗೆ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  'od': { marathi: 'दिवसातून एकदा (सकाळी)', hindi: 'दिन में एक बार (सुबह)', kannada: 'ದಿನಕ್ಕೆ ಒಂದು ಬಾರಿ' },
  'hs': { marathi: 'रात्री झोपताना १ गोळी', hindi: 'रात को सोते समय १ गोली', kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ೧ ಮಾತ್ರೆ' },
  'tds': { marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)', hindi: 'सुबह १, दोपहर १ और रात १', kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ ಮತ್ತು ರಾತ್ರಿ ೧' },
  'tid': { marathi: 'सकाळी १, दुपारी १ व रात्री १ (दिवसातून ३ वेळा)', hindi: 'सुबह १, दोपहर १ और रात १', kannada: 'ಬೆಳಿಗ್ಗೆ ೧, ಮಧ್ಯಾಹ್ನ ೧ आणि ರಾತ್ರಿ ೧' },
  'sos': { marathi: 'त्रास झाल्यास / गरज वाटल्यास घ्यावी', hindi: 'ज़रूरत पड़ने पर लें', kannada: 'ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ' },
  'stat': { marathi: 'तातडीने / लगेच एकाच वेळी घ्यावी', hindi: 'तुरंत लें', kannada: 'ತಕ್ಷಣ ತೆಗೆದುಕೊಳ್ಳಿ' },
  'after meals': { marathi: 'जेवणानंतर', hindi: 'खाना खाने के बाद', kannada: 'ಊಟದ ನಂತರ' },
  'after food': { marathi: 'जेवणानंतर', hindi: 'खाना खाने के बाद', kannada: 'ಊಟದ ನಂತರ' },
  'before meals': { marathi: 'उपाशीपोटी (जेवणापूर्वी)', hindi: 'खाली पेट', kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ' },
  'before food': { marathi: 'उपाशीपोटी (जेवणापूर्वी)', hindi: 'खाली पेट', kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ' },
  'empty stomach': { marathi: 'उपाशीपोटी (जेवणापूर्वी)', hindi: 'खाली पेट', kannada: 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ' },
  'apply on affected area': { marathi: 'फक्त बाधित भागावरच मलम लावावे', hindi: 'केवल प्रभावित हिस्से पर क्रीम लगाएं', kannada: 'ಬಾಧಿತ ಜಾಗಕ್ಕೆ ಹಚ್ಚಿ' },
  'apply thin layer': { marathi: 'हळुवारपणे पातळ थर लावावा', hindi: 'पतली परत लगाएं', kannada: 'ತೆಳುವಾಗಿ ಹಚ್ಚಿ' },
  'apply at night': { marathi: 'रात्री झोपताना लावावे', hindi: 'रात को सोते समय लगाएं', kannada: 'ರಾತ್ರಿ ಮಲಗುವಾಗ ಹಚ್ಚಿ' },
  'for external use only': { marathi: 'फक्त बाह्य वापरासाठी (पिण्यासाठी नाही)', hindi: 'केवल बाहरी उपयोग के लिए', kannada: 'ಹೊರಗಿನ ಬಳಕೆಗೆ ಮಾತ್ರ' },
};

function fallbackMedicalTranslate(text, lang) {
  if (!text) return '-';
  const clean = text.trim();
  const lower = clean.toLowerCase();

  if (lang === 'english') return clean;

  if (MEDICAL_DICTIONARY[lower] && MEDICAL_DICTIONARY[lower][lang]) {
    return MEDICAL_DICTIONARY[lower][lang];
  }

  if (lang === 'marathi') {
    let res = clean
      .replace(/\b1\s*-\s*0\s*-\s*1\b/gi, 'सकाळी १ व रात्री १')
      .replace(/\b1\s*-\s*0\s*-\s*0\b/gi, 'सकाळी १')
      .replace(/\b0\s*-\s*0\s*-\s*1\b/gi, 'रात्री झोपताना १')
      .replace(/\b1\s*-\s*1\s*-\s*1\b/gi, 'सकाळी १, दुपारी १ व रात्री १')
      .replace(/\bbd\b/gi, 'दिवसातून २ वेळा')
      .replace(/\bod\b/gi, 'दिवसातून एकदा')
      .replace(/\bhs\b/gi, 'रात्री झोपताना')
      .replace(/after meals|after food/gi, 'जेवणानंतर')
      .replace(/before meals|before food|empty stomach/gi, 'उपाशीपोटी')
      .replace(/tablet|tab|capsule|cap/gi, 'गोळी')
      .replace(/apply cream|apply/gi, 'मलम लावावे')
      .replace(/दिनाला\s*एकवेळा/gi, 'दिवसातून एकदा')
      .replace(/दिनाला\s*दोनवेळा/gi, 'दिवसातून दोनदा')
      .replace(/दिवसातून\s*एकवेळा/gi, 'दिवसातून एकदा')
      .replace(/दिवसातून\s*दोनवेळा/gi, 'दिवसातून दोनदा');
    return res;
  }

  return clean;
}

async function translateWithGroq(text, targetLang) {
  if (!text || !text.trim()) return '-';
  const cleanText = text.trim();
  const lang = (targetLang || 'marathi').toLowerCase();

  const cacheKey = `${lang}:${cleanText}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  // 1. Check direct medical dictionary first (Instant, accurate, zero latency)
  const lowerText = cleanText.toLowerCase();
  if (MEDICAL_DICTIONARY[lowerText] && MEDICAL_DICTIONARY[lowerText][lang]) {
    const dictResult = MEDICAL_DICTIONARY[lowerText][lang];
    cache.set(cacheKey, dictResult);
    return dictResult;
  }

  // 2. If Groq API key is missing, return high-quality fallback translation
  if (!apiKey) {
    const fallback = fallbackMedicalTranslate(cleanText, lang);
    cache.set(cacheKey, fallback);
    return fallback;
  }

  const systemPrompt = `You are a specialized medical translator for Indian clinical prescriptions (Dermatology & General Practice).
Translate the doctor's prescription frequency/instruction into ${lang}.

Grammar & Clinical Translation Rules:
1. Return ONLY the translated string in ${lang} Devanagari script. No explanations, no English translation, no quotes.
2. Maintain proper medical grammar and natural phrasing:
   - For Marathi tablets/capsules use 'गोळी' (e.g., '१ गोळी घ्यावी').
   - For Marathi creams/lotions/ointments use 'मलम/लोशन लावावे' or 'बाधित भागावर लावावे'.
   - For Marathi dosage timing:
     * '1-0-1' or 'BD' -> 'सकाळी १ व रात्री १ (जेवणानंतर/उपाशीपोटी)'
     * '0-0-1' or 'HS' -> 'रात्री झोपताना १'
     * '1-0-0' or 'OD' -> 'सकाळी १ (दिवसातून एकदा)'
     * '1-1-1' or 'TDS' -> 'सकाळी १, दुपारी १ व रात्री १'
     * 'before meals' / 'empty stomach' -> 'उपाशीपोटी (जेवणापूर्वी)'
     * 'after meals' / 'after food' -> 'जेवणानंतर'
     * 'tapering' -> 'मात्रा हळूहळू कमी करत जाणे'
3. Ensure sentence structure is grammatically natural and easy for patients to read.`;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 150,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Translate this prescription instruction to ${lang}: "${cleanText}"` }
        ]
      })
    });

    const data = await res.json();
    if (data.choices && data.choices[0] && data.choices[0].message) {
      let result = data.choices[0].message.content.trim().replace(/^["']|["']$/g, '');
      // Clean up common bad patterns
      result = result
        .replace(/दिनाला\s*एकवेळा/gi, 'दिवसातून एकदा')
        .replace(/दिनाला\s*दोनवेळा/gi, 'दिवसातून दोनदा')
        .replace(/दिवसातून\s*एकवेळा/gi, 'दिवसातून एकदा')
        .replace(/दिवसातून\s*दोनवेळा/gi, 'दिवसातून दोनदा');
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Groq Translation API Error:', err);
  }

  // Fallback to local dictionary translator if Groq call fails
  const fallback = fallbackMedicalTranslate(cleanText, lang);
  cache.set(cacheKey, fallback);
  return fallback;
}

module.exports = {
  translateWithGroq
};
