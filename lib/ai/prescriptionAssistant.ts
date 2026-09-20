import OpenAI from 'openai';
import { calculatePrescriptionQuantity } from '@/lib/prescriptionQuantity';

export interface StructuredPrescriptionOutput {
  medicine: string;
  strength: string;
  dosage: string;
  frequency: string;
  timing: string;
  duration: string;
  quantity: number;
  instructions: string;
  requiresDoctorConfirmation: true;
  requiresClarification: boolean;
}

const SYSTEM_PROMPT = `You are a prescription structuring assistant. Your ONLY job is to convert a doctor's natural-language medication instructions into structured fields. You must NOT diagnose. You must NOT recommend medicines. You must NOT change dosages. You must NOT suggest alternatives. If ambiguous, return extracted fields and set requiresClarification: true.

Return ONLY valid JSON:
{
  "medicine": string,
  "strength": string,
  "dosage": string,
  "frequency": string,
  "timing": string,
  "duration": string,
  "quantity": number,
  "instructions": string,
  "requiresDoctorConfirmation": true,
  "requiresClarification": boolean
}`;

export async function parseNaturalLanguagePrescription(
  text: string
): Promise<StructuredPrescriptionOutput> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (apiKey && apiKey.trim() !== '' && !apiKey.includes('sk-proj-...')) {
    try {
      const openai = new OpenAI({ apiKey });
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const rawJson = completion.choices[0]?.message?.content || '';
      const parsed = JSON.parse(rawJson);

      const dosage = parsed.dosage || '1 tablet';
      const frequency = parsed.frequency || 'Once daily';
      const duration = parsed.duration || '7 days';
      const calculatedQuantity = calculatePrescriptionQuantity(dosage, frequency, duration);
      const aiQuantity = typeof parsed.quantity === 'number' && parsed.quantity > 0 ? parsed.quantity : null;

      return {
        medicine: parsed.medicine || '',
        strength: parsed.strength || '',
        dosage,
        frequency,
        timing: parsed.timing || 'As directed',
        duration,
        // Never trust an LLM's arithmetic when the quantity can be derived deterministically.
        // Example: 10 mL × 2/day × 30 days = 600.
        quantity: calculatedQuantity ?? aiQuantity ?? 0,
        instructions: parsed.instructions || '',
        requiresDoctorConfirmation: true,
        requiresClarification: Boolean(parsed.requiresClarification) || calculatedQuantity === null,
      };
    } catch (error) {
      console.error('OpenAI API call failed, using heuristic extraction fallback:', error);
    }
  }

  return fallbackExtractor(text);
}

function extractDosage(text: string): string {
  const numericMatch = text.match(
    /\b(\d+(?:\.\d+)?)\s*(tablet(?:s)?|tab(?:s)?|capsule(?:s)?|cap(?:s)?|pill(?:s)?|unit(?:s)?|ml|milliliter(?:s)?|l|liter(?:s)?)\b/i
  );
  if (numericMatch) return `${numericMatch[1]} ${numericMatch[2]}`;

  const wordMatch = text.match(
    /\b(one|two|three|four|five)\s+(tablet(?:s)?|tab(?:s)?|capsule(?:s)?|cap(?:s)?|pill(?:s)?|unit(?:s)?)\b/i
  );
  if (wordMatch) return `${wordMatch[1]} ${wordMatch[2]}`;

  return '1 tablet';
}

function fallbackExtractor(text: string): StructuredPrescriptionOutput {
  const lower = text.toLowerCase();

  const strengthMatch = text.match(/(\d+(\.\d+)?\s*(mg|mcg|g|ml|iu))/i);
  const strength = strengthMatch ? strengthMatch[0] : '';

  const durationMatch = text.match(/(\d+\s*(days?|weeks?|months?))/i);
  const duration = durationMatch ? durationMatch[0] : '30 days';

  let frequency = 'Once daily';
  if (lower.includes('twice daily') || lower.includes('twice a day') || lower.includes('bid') || lower.includes('2 times')) {
    frequency = 'Twice daily';
  } else if (lower.includes('thrice daily') || lower.includes('three times') || lower.includes('3 times') || lower.includes('tid')) {
    frequency = 'Three times daily';
  } else if (lower.includes('every 8 hours') || lower.includes('q8h')) {
    frequency = 'Every 8 hours';
  } else if (lower.includes('as needed') || lower.includes('prn')) {
    frequency = 'As needed';
  }

  let timing = 'As directed';
  if (lower.includes('after breakfast') || lower.includes('after food') || lower.includes('after meals')) {
    timing = 'After meals';
  } else if (lower.includes('before breakfast') || lower.includes('before food') || lower.includes('empty stomach')) {
    timing = 'Before meals / Empty stomach';
  } else if (lower.includes('at bedtime') || lower.includes('night')) {
    timing = 'At bedtime';
  }

  const words = text.split(/\s+/);
  let medicine = words[0] || 'Medication';
  for (const word of words) {
    if (word.length > 3 && !['give', 'the', 'patient', 'take', 'for', 'with', 'once', 'daily', 'after', 'before'].includes(word.toLowerCase())) {
      medicine = word.replace(/[^a-zA-Z0-9-]/g, '');
      break;
    }
  }

  const dosage = extractDosage(text);
  const calculatedQuantity = calculatePrescriptionQuantity(dosage, frequency, duration);

  return {
    medicine: medicine.charAt(0).toUpperCase() + medicine.slice(1),
    strength: strength || '500 mg',
    dosage,
    frequency,
    timing,
    duration,
    quantity: calculatedQuantity ?? 0,
    instructions: text,
    requiresDoctorConfirmation: true,
    requiresClarification: !strengthMatch || !durationMatch || calculatedQuantity === null,
  };
}
