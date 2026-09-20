/**
 * Deterministic medication quantity calculation.
 * Quantity = dose units per administration × administrations per day × duration in days.
 * Returns null when the instruction is too ambiguous to calculate safely.
 */
export function calculatePrescriptionQuantity(
  dosage: string,
  frequency: string,
  duration: string
): number | null {
  const doseUnits = parseDoseUnits(dosage);
  const administrationsPerDay = parseFrequencyPerDay(frequency);
  const durationDays = parseDurationDays(duration);

  if (doseUnits === null || administrationsPerDay === null || durationDays === null) {
    return null;
  }

  const quantity = doseUnits * administrationsPerDay * durationDays;
  return Number.isFinite(quantity) && quantity > 0 ? Math.round(quantity) : null;
}

function parseDoseUnits(dosage: string): number | null {
  const text = String(dosage || '').trim().toLowerCase();
  if (!text) return null;

  // Supports: 1 tablet, 2 tablets, 10 ml, 5 units, etc.
  const exact = text.match(
    /^(\d+(?:\.\d+)?)\s*(?:tablet(?:s)?|tab(?:s)?|capsule(?:s)?|cap(?:s)?|pill(?:s)?|unit(?:s)?|ml|milliliter(?:s)?|l|liter(?:s)?|mg|mcg|g|iu)\b/i
  );
  if (exact) return Number(exact[1]);

  const wordNumbers: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };

  const wordMatch = text.match(
    /\b(one|two|three|four|five)\b\s*(?:tablet(?:s)?|tab(?:s)?|capsule(?:s)?|cap(?:s)?|pill(?:s)?|unit(?:s)?)\b/i
  );
  if (wordMatch) return wordNumbers[wordMatch[1].toLowerCase()] ?? null;

  // Do not guess for ranges such as 1-2 tablets.
  if (/\d+(?:\.\d+)?\s*(?:-|to)\s*\d+(?:\.\d+)?/.test(text)) return null;

  return null;
}

function parseFrequencyPerDay(frequency: string): number | null {
  const text = String(frequency || '').trim().toLowerCase();
  if (!text || /\bas needed\b|\bprn\b|\bwhen required\b/.test(text)) return null;

  if (/\bonce\s+(?:a|per)\s*day\b|\bonce daily\b|\b1\s*(?:time|times)\s*(?:a|per)?\s*day\b/.test(text)) return 1;
  if (/\btwice\s+(?:a|per)\s*day\b|\btwice daily\b|\b2\s*(?:time|times)\s*(?:a|per)?\s*day\b|\bbid\b/.test(text)) return 2;
  if (/\bthree\s+times\s+(?:a|per)\s*day\b|\bthree times daily\b|\b3\s*(?:time|times)\s*(?:a|per)?\s*day\b|\btid\b/.test(text)) return 3;
  if (/\bfour\s+times\s+(?:a|per)\s*day\b|\bfour times daily\b|\b4\s*(?:time|times)\s*(?:a|per)?\s*day\b|\bqid\b/.test(text)) return 4;

  const everyHours = text.match(/\bevery\s+(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/);
  if (everyHours) {
    const hours = Number(everyHours[1]);
    if (hours > 0) return 24 / hours;
  }

  const numericTimes = text.match(/\b(\d+(?:\.\d+)?)\s*(?:times|x)\s*(?:daily|a day|per day)\b/);
  if (numericTimes) return Number(numericTimes[1]);

  return null;
}

function parseDurationDays(duration: string): number | null {
  const text = String(duration || '').trim().toLowerCase();
  const match = text.match(/(\d+(?:\.\d+)?)\s*(days?|weeks?|months?)\b/);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount <= 0) return null;

  if (match[2].startsWith('day')) return amount;
  if (match[2].startsWith('week')) return amount * 7;
  if (match[2].startsWith('month')) return amount * 30;

  return null;
}
