const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn('⚠️  [GROQ TRANSLATOR]: GROQ_API_KEY is not defined in your environment (.env). AI translation for prescription printouts will fall back to original text.');
}

// Simple in-memory translation cache
const cache = new Map();

async function translateWithGroq(text, targetLang) {
  if (!text || !text.trim()) return '-';
  const cleanText = text.trim();
  if (!apiKey) return cleanText; // Fall back directly if API key is not configured

  const lang = (targetLang || 'marathi').toLowerCase();
  
  const cacheKey = `${lang}:${cleanText}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const systemPrompt = `You are an expert medical translator for Indian clinical prescriptions (Dermatology and General Practice).
Translate the prescription frequency or instruction into ${lang}.

Rules:
1. Output ONLY the direct translated instruction string in ${lang} script without any explanation, prefix, or quotes.
2. For tablets/capsules in Marathi use 'गोळी'.
3. For '1-0-1' or 'BD' use 'सकाळी व रात्री' (Marathi) / 'सुबह व रात' (Hindi) / 'ಬೆಳಿಗ್ಗೆ ಮತ್ತು ರಾತ್ರಿ' (Kannada).
4. For '0-0-1' or 'HS' use 'रात्री झोपताना' (Marathi) / 'रात को सोते समय' (Hindi) / 'ರಾತ್ರಿ ಮಲಗುವಾಗ' (Kannada).
5. For '1-0-0' or 'OD' use 'सकाळी' (Marathi) / 'सुबह' (Hindi) / 'ಬೆಳಿಗ್ಗೆ' (Kannada).
6. For 'उपाशीपोटी' or 'before meals' use 'उपाशीपोटी घेणे' (Marathi) / 'खाली पेट लें' (Hindi) / 'ಖಾಲಿ ಹೊಟ್ಟೆಯಲ್ಲಿ ತೆಗೆದುಕೊಳ್ಳಿ' (Kannada) / 'Take on empty stomach' (English).
7. For 'जेवणानंतर' or 'after meals' use 'जेवणानंतर घेणे' (Marathi) / 'खाना खाने के बाद लें' (Hindi) / 'ಊಟದ ನಂತರ ತೆಗೆದುಕೊಳ್ಳಿ' (Kannada) / 'Take after meals' (English).
8. Keep instructions natural, concise, and easy for patients to understand.`;

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
      cache.set(cacheKey, result);
      return result;
    }
  } catch (err) {
    console.error('Groq Translation API Error:', err);
  }

  return cleanText;
}

module.exports = {
  translateWithGroq
};
