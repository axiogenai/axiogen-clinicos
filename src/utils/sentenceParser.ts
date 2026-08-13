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

/**
 * 100% Dynamic Groq AI sentence parser.
 * Sends the raw sentence to the backend → Groq AI → structured JSON.
 * No hardcoded regex. No local rules. Pure AI.
 */
export async function parseSentenceWithGroqAI(sentence: string): Promise<ParsedPrescriptionSentence | null> {
  if (!sentence || !sentence.trim()) return null;
  try {
    const res = await api.parseSentence(sentence);
    if (res && res.parsed) {
      return {
        originalInput: sentence,
        cleanedMedicineQuery: res.parsed.cleanedMedicineQuery || sentence,
        formattedMedicineName: res.parsed.formattedMedicineName || sentence,
        frequency: res.parsed.frequency || undefined,
        duration: res.parsed.duration || undefined,
        hasSentenceElements: !!(res.parsed.frequency || res.parsed.duration || res.parsed.formattedMedicineName),
        isGroqParsed: true,
      };
    }
  } catch (err) {
    console.warn('Groq AI parse failed:', err);
  }
  return null;
}

/**
 * Minimal fallback: just extracts the raw text as medicine name.
 * Used ONLY as a placeholder while Groq AI responds, or if Groq fails entirely.
 * Zero hardcoded frequency/duration logic.
 */
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

  // Title-case the raw input as a display name
  const formattedName = originalInput
    .split(' ')
    .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ');

  return {
    originalInput,
    cleanedMedicineQuery: originalInput,
    formattedMedicineName: formattedName,
    hasSentenceElements: false,
  };
}
