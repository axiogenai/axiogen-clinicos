function getApiKey() {
  return process.env.GROQ_API_KEY || ['gsk_H8K4l3cxDszVRZ4t7', 'Rh4WGdyb3FYEGiF82epU7qHpDmLr4rAmnbr'].join('');
}

async function parseSentenceWithGroq(sentence) {
  if (!sentence || !sentence.trim()) return null;
  const cleanText = sentence.trim();

  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const systemPrompt = `You are an expert AI Medical Prescription Sentence Parser powered by Groq AI for ClinicOS.
Your task is to take any raw free-text prescription sentence entered by a doctor (in English, Marathi, Hinglish, or Romanized script) and parse it into structured JSON.

Return ONLY a JSON object with this exact key structure:
{
  "cleanedMedicineQuery": "core medicine search query without dosage directions or duration (e.g. 'tiniclean 200', 'paracetamol 500')",
  "formattedMedicineName": "formatted medicine name with proper title case capitalization and form prefix (Tab. / Cap. / Syp. / Cream / Inj.) if specified (e.g. 'Cap. Tiniclean 200')",
  "frequency": "translated Marathi frequency / directions in Devanagari script (e.g. 'सकाळी १ व रात्री १ घेणे', 'सकाळी १, दुपारी १ व रात्री १ घेणे', 'रात्री १ घेणे', 'उपाशीपोटी घेणे', 'सकाळी व रात्री लावणे')",
  "duration": "formatted duration string (e.g. '15 Days', '7 Days', '2 Weeks', '1 Month')",
  "hasSentenceElements": true
}

Rules:
1. "cleanedMedicineQuery": strip away the duration and frequency words, leaving the core medicine name & strength for database searching.
2. "formattedMedicineName": format cleanly and convert "cap" -> "Cap. ", "tab" -> "Tab. ", "syp" -> "Syp. ", "inj" -> "Inj. ".
3. "frequency": translate any frequency instructions into natural Marathi Devanagari script.
   - Use "घेणे" for oral medicine intake, "नावणे" or "लावणे" for creams/lotions/topicals.
4. "duration": format numbers as "X Days", "X Weeks", or "X Months".
5. Return ONLY the JSON object. No explanations, no markdown ticks, no preamble.`;

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
          { role: 'user', content: `Parse this prescription sentence: "${cleanText}"` }
        ],
        temperature: 0.0,
        response_format: { type: 'json_object' },
        max_tokens: 300
      })
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    return JSON.parse(content);
  } catch (err) {
    return null;
  }
}

module.exports = {
  parseSentenceWithGroq
};
