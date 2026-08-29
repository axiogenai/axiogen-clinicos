let _groqKeyWarned = false;

function getApiKey() {
  const key = process.env.GROQ_API_KEY;
  // Skip if no key or placeholder key
  if (!key || key === 'your_groq_api_key_here' || key.length < 20) {
    if (!_groqKeyWarned) {
      console.warn('⚠️ Groq API key not configured — AI prescription translation disabled. Set GROQ_API_KEY in .env to enable.');
      _groqKeyWarned = true;
    }
    return null;
  }
  return key;
}

async function callGroqChat(apiKey, model, systemPrompt, userMessage, isJson = true) {
  const body = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ],
    temperature: 0.0,
    max_tokens: 800
  };
  if (isJson) {
    body.response_format = { type: 'json_object' };
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ClinicOS-Prescription-Engine/1.0'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Groq API returned ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  let content = data.choices?.[0]?.message?.content?.trim();
  if (!content) return null;

  if (content.includes('</think>')) {
    content = content.split('</think>').pop().trim();
  }

  // Remove markdown json fences if present
  content = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();

  return isJson ? JSON.parse(content) : content;
}

async function parseSentenceWithGroq(sentence) {
  if (!sentence || !sentence.trim()) return null;
  const cleanText = sentence.trim();

  const apiKey = getApiKey();
  if (!apiKey) return null;

  const systemPrompt = `You are an expert Clinical EMR AI Medical Prescription Sentence Parser for Indian Doctors.
Your task is to take any raw free-text prescription sentence entered by a doctor (in English, Marathi, Hindi, Hinglish, or Romanized script) and parse it into structured JSON.

Return ONLY a JSON object with this exact key structure:
{
  "cleanedMedicineQuery": "core medicine search query without dosage timing, verbs or duration (e.g. 'Tenovate Ointment (2 Tube)', 'Dulcolax 10ml', 'Tiniclean 200', 'Paracetamol 500')",
  "formattedMedicineName": "cleanly formatted title-case medicine name with dosage form and quantity preserved (e.g. 'Tenovate Ointment (2 Tube)', 'Cap. Tiniclean 200', 'Syp. Dulcolax 10ml')",
  "frequency": "translated Marathi frequency / timing directions in Devanagari script (e.g. 'सकाळी व रात्री लावणे', 'सकाळी १ व रात्री १ घेणे', 'उद्या सकाळी घेणे', 'रात्री झोपताना घेणे', 'सकाळी १, दुपारी १ व रात्री १ घेणे')",
  "duration": "formatted duration string if specified (e.g. '25 Days', '20 Days', '15 Days', '7 Days', '3 Days', '2 Weeks', '1 Month')",
  "hasSentenceElements": true
}

Rules:
1. "cleanedMedicineQuery": strip away frequency, timing, verbs and duration words/numbers at the end (such as "udya", "tomorrow", "ghene", "take", "sakali", "ratri", "lavne", "apply", "25", "20 divas", "3 days"), leaving ONLY the core medicine name & strength/quantity/form.
2. "formattedMedicineName": preserve core medicine name and form cleanly. Keep (2 Tube) or strength if present.
3. "frequency": dynamically translate any frequency, timing, or verb instruction into natural Marathi Devanagari script:
   - "sakali ratri lavne" -> "सकाळी व रात्री लावणे"
   - "sakali 1 ratri 1 ghene" -> "सकाळी १ व रात्री १ घेणे"
   - "udya sakali 1" -> "उद्या सकाळी १"
   - "ratri zoptana" -> "रात्री झोपताना"
   - Use "घेणे" for oral medicines (tablets, capsules, syrups).
   - Use "लावणे" for topical medicines (ointments, creams, gels, lotions).
4. "duration": if any duration number or phrase is mentioned (e.g. "25", "25 divas", "20 days", "1 mahina"), format as "X Days", "X Weeks", or "X Months". If the sentence ends with a bare number like "25" or "20" after timing, that is the duration ("25 Days", "20 Days").
5. Return ONLY the JSON object. No explanations, no markdown ticks, no preamble.`;

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'];

  for (const model of models) {
    try {
      const parsed = await callGroqChat(
        apiKey,
        model,
        systemPrompt,
        `Parse this prescription sentence into structured JSON: "${cleanText}"`,
        true
      );
      if (parsed && (parsed.cleanedMedicineQuery || parsed.formattedMedicineName || parsed.frequency || parsed.duration)) {
        return {
          cleanedMedicineQuery: parsed.cleanedMedicineQuery || cleanText,
          formattedMedicineName: parsed.formattedMedicineName || cleanText,
          frequency: parsed.frequency || '',
          duration: parsed.duration || '',
          hasSentenceElements: Boolean(parsed.frequency || parsed.duration || (parsed.cleanedMedicineQuery && parsed.cleanedMedicineQuery !== cleanText))
        };
      }
    } catch (err) {
      console.warn(`Groq parseSentence model ${model} failed, trying fallback:`, err.message);
    }
  }

  return null;
}

module.exports = {
  parseSentenceWithGroq
};
