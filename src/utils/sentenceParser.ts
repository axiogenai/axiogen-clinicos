import { api } from '../api/client';

export interface ParsedPrescriptionSentence {
  originalInput: string;
  cleanedMedicineQuery: string;
  formattedMedicineName: string;
  frequency?: string;
  duration?: string;
  hasSentenceElements: boolean;
  isGroqParsed?: boolean;
}

export async function parseSentenceWithGroqAI(sentence: string): Promise<ParsedPrescriptionSentence | null> {
  if (!sentence || !sentence.trim()) return null;
  try {
    const res = await api.parseSentence(sentence);
    if (res && res.parsed && res.parsed.hasSentenceElements) {
      return {
        originalInput: sentence,
        cleanedMedicineQuery: res.parsed.cleanedMedicineQuery || sentence,
        formattedMedicineName: res.parsed.formattedMedicineName || sentence,
        frequency: res.parsed.frequency,
        duration: res.parsed.duration,
        hasSentenceElements: true,
        isGroqParsed: true,
      };
    }
  } catch (err) {
    // Return null to allow fallback to instant tokenizer
  }
  return null;
}

export function parsePrescriptionSentence(input: string): ParsedPrescriptionSentence {
  const originalInput = input.trim();
  if (!originalInput) {
    return {
      originalInput: '',
      cleanedMedicineQuery: '',
      formattedMedicineName: '',
      hasSentenceElements: false,
    };
  }

  let text = originalInput;
  let extractedDuration: string | undefined = undefined;
  let extractedFrequency: string | undefined = undefined;

  // -------------------------------------------------------------
  // STEP 1: DYNAMIC DURATION EXTRACTION
  // -------------------------------------------------------------
  // Matches: "15 days", "15day", "15d", "15 Days", "7 days", "7d", "2 weeks", "2w", "1 month", "1m", "15 divas"
  const durationRegex = /\b(\d+(?:\.\d+)?)\s*(days?|d|weeks?|w|months?|m|divas|दिवस|आठवडे|महिने)\b/i;
  const durMatch = text.match(durationRegex);

  if (durMatch) {
    const num = parseFloat(durMatch[1]);
    const unit = durMatch[2].toLowerCase();
    if (unit.startsWith('w') || unit.includes('आठव')) {
      extractedDuration = `${num} Week${num > 1 ? 's' : ''}`;
    } else if (unit.startsWith('m') || unit.includes('महि')) {
      extractedDuration = `${num} Month${num > 1 ? 's' : ''}`;
    } else {
      extractedDuration = `${num} Days`;
    }
    text = text.replace(durMatch[0], ' ').trim();
  } else {
    // Check "for 10 days" or "for 10"
    const forMatch = text.match(/\bfor\s*(\d+)\s*(days?|d)?\b/i);
    if (forMatch) {
      const num = parseInt(forMatch[1], 10);
      extractedDuration = `${num} Days`;
      text = text.replace(forMatch[0], ' ').trim();
    }
  }

  // -------------------------------------------------------------
  // STEP 2: DYNAMIC FREQUENCY & DOSAGE PATTERN EXTRACTION
  // -------------------------------------------------------------

  // Pattern A: Numeric Dosing Notation (e.g. 1-0-1, 1-1-1, 1-0-0, 0-0-1, 0-1-0, 1-1-1-1, 1/2-0-1/2, 2-0-2)
  const numericNotationRegex = /\b(\d+(?:\/\d+)?)\s*[\-\s\/]\s*(\d+(?:\/\d+)?)\s*[\-\s\/]\s*(\d+(?:\/\d+)?)(?:\s*[\-\s\/]\s*(\d+(?:\/\d+)?))?\b/;
  const numMatch = text.match(numericNotationRegex);

  if (numMatch) {
    const m = numMatch[1];
    const a = numMatch[2];
    const n = numMatch[3];
    const q = numMatch[4];

    if (q && q !== '0') {
      extractedFrequency = 'दिवसातून ४ वेळा घेणे';
    } else if (m !== '0' && a !== '0' && n !== '0') {
      extractedFrequency = `सकाळी ${m}, दुपारी ${a} व रात्री ${n} घेणे`;
    } else if (m !== '0' && n !== '0' && a === '0') {
      if (m === '1' && n === '1') {
        extractedFrequency = 'सकाळी १ व रात्री १ घेणे';
      } else {
        extractedFrequency = `सकाळी ${m} व रात्री ${n} घेणे`;
      }
    } else if (m !== '0' && a === '0' && n === '0') {
      if (m === '1/2' || m === '0.5') {
        extractedFrequency = '१/२ गोळी सकाळी घेणे';
      } else {
        extractedFrequency = `सकाळी ${m} घेणे`;
      }
    } else if (n !== '0' && m === '0' && a === '0') {
      extractedFrequency = `रात्री ${n} घेणे`;
    } else if (a !== '0' && m === '0' && n === '0') {
      extractedFrequency = `दुपारी ${a} घेणे`;
    }
    text = text.replace(numMatch[0], ' ').trim();
  }

  // Pattern B: Keyword Frequency & Directions (Marathi / Hinglish / English / Latin)
  if (!extractedFrequency) {
    const isTopical = /\b(lavane|apply|cream|gel|ointment|lotion|लावावे|लावणे)\b/i.test(text);
    const isFasting = /\b(upashi\s*poti|upashi|fasting|empty\s*stomach|ac)\b/i.test(text);
    const isAfterMeal = /\b(jevananantar|jevan\s*nantar|after\s*food|after\s*meals|pc)\b/i.test(text);
    const isTapering = /\b(tapering|taper|टेपरिंग)\b/i.test(text);

    if (isTapering) {
      extractedFrequency = 'गोळी टेपरिंग: ३ दिवस सकाळी-रात्री नंतर फक्त सकाळी घेणे';
      text = text.replace(/\b(tapering|taper|टेपरिंग)\b/gi, ' ').trim();
    } else if (isFasting) {
      extractedFrequency = 'उपाशीपोटी घेणे';
      text = text.replace(/\b(upashi\s*poti|upashi|fasting|empty\s*stomach|ac)\b/gi, ' ').trim();
    } else if (isAfterMeal) {
      extractedFrequency = 'जेवणानंतर घेणे';
      text = text.replace(/\b(jevananantar|jevan\s*nantar|after\s*food|after\s*meals|pc)\b/gi, ' ').trim();
    } else {
      const hasMorning = /\b(sakali|sakale|morning|sakal|am|सकाळी)\b/i.test(text);
      const hasAfternoon = /\b(dupari|dupare|afternoon|noon|दुपारी)\b/i.test(text);
      const hasNight = /\b(ratri|rate|night|bedtime|hs|pm|रात्री)\b/i.test(text);
      const hasQid = /\b(qid|4\s*times|4\s*vela)\b/i.test(text);
      const hasThrice = /\b(tds|tid|thrice|3\s*times)\b/i.test(text);
      const hasTwice = /\b(bd|twice|2\s*times)\b/i.test(text);
      const hasOnce = /\b(od|once)\b/i.test(text);

      if (hasQid) {
        extractedFrequency = 'दिवसातून ४ वेळा घेणे';
        text = text.replace(/\b(qid|4\s*times|4\s*vela)\b/gi, ' ').trim();
      } else if (hasMorning && hasAfternoon && hasNight) {
        extractedFrequency = 'सकाळी १, दुपारी १ व रात्री १ घेणे';
        text = text.replace(/\b(sakali|sakale|morning|sakal|dupari|dupare|afternoon|noon|ratri|rate|night)\b/gi, ' ').trim();
      } else if (hasThrice) {
        extractedFrequency = 'सकाळी १, दुपारी १ व रात्री १ घेणे';
        text = text.replace(/\b(tds|tid|thrice|3\s*times)\b/gi, ' ').trim();
      } else if (hasMorning && hasNight) {
        extractedFrequency = isTopical ? 'सकाळी व रात्री लावणे' : 'सकाळी १ व रात्री १ घेणे';
        text = text.replace(/\b(sakali|sakale|morning|sakal|ratri|rate|night)\b/gi, ' ').trim();
      } else if (hasTwice) {
        extractedFrequency = isTopical ? 'सकाळी व रात्री लावणे' : 'सकाळी १ व रात्री १ घेणे';
        text = text.replace(/\b(bd|twice|2\s*times)\b/gi, ' ').trim();
      } else if (hasMorning) {
        const hasHalf = /\b(1\/2|half|अर्धी)\b/i.test(text);
        extractedFrequency = hasHalf ? '१/२ गोळी सकाळी घेणे' : 'सकाळी १ घेणे';
        text = text.replace(/\b(sakali|sakale|morning|sakal)\b/gi, ' ').trim();
      } else if (hasNight) {
        extractedFrequency = 'रात्री १ घेणे';
        text = text.replace(/\b(ratri|rate|night|bedtime|hs)\b/gi, ' ').trim();
      } else if (hasAfternoon) {
        extractedFrequency = 'दुपारी १ घेणे';
        text = text.replace(/\b(dupari|dupare|afternoon|noon)\b/gi, ' ').trim();
      } else if (hasOnce) {
        extractedFrequency = 'सकाळी १ घेणे';
        text = text.replace(/\b(od|once)\b/gi, ' ').trim();
      }
    }
  }

  // -------------------------------------------------------------
  // STEP 3: FALLBACK TRAILING NUMBER DURATION EXTRACTION
  // -------------------------------------------------------------
  if (!extractedDuration && extractedFrequency) {
    const trailingNumMatch = text.match(/\s+(\d{1,3})\s*$/);
    if (trailingNumMatch) {
      const val = parseInt(trailingNumMatch[1], 10);
      if (val > 0 && val <= 180) {
        extractedDuration = `${val} Days`;
        text = text.replace(trailingNumMatch[0], ' ').trim();
      }
    }
  }

  // -------------------------------------------------------------
  // STEP 4: DYNAMIC MEDICINE NAME & STRENGTH CLEANING
  // -------------------------------------------------------------
  let cleanQuery = text
    .replace(/\b(for|take|ghene|khane|ghya|lavane|apply|days?|day|goli|tablet|capsule)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanQuery) {
    cleanQuery = originalInput;
  }

  // Nicely format form prefix (Cap., Tab., Syp., Inj., Cream, etc.)
  let formattedName = cleanQuery;
  if (/^cap\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^cap\s+/i, 'Cap. ');
  } else if (/^tab\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^tab\s+/i, 'Tab. ');
  } else if (/^syp\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^syp\s+/i, 'Syp. ');
  } else if (/^inj\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^inj\s+/i, 'Inj. ');
  } else if (/^cream\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^cream\s+/i, 'Cream ');
  } else if (/^gel\s+/i.test(cleanQuery)) {
    formattedName = cleanQuery.replace(/^gel\s+/i, 'Gel ');
  }

  // Capitalize Initial Letters (Title Case)
  formattedName = formattedName
    .split(' ')
    .map(w => w ? w[0].toUpperCase() + w.slice(1) : '')
    .join(' ');

  const hasSentenceElements = !!(extractedFrequency || extractedDuration);

  return {
    originalInput,
    cleanedMedicineQuery: cleanQuery,
    formattedMedicineName: formattedName,
    frequency: extractedFrequency,
    duration: extractedDuration,
    hasSentenceElements,
  };
}
