import type { GuardrailFlag } from '@/store/types';

/**
 * UIP-10 — the non-disclosure criteria a summary must satisfy before it can be released.
 *
 * These are placeholders. The real criteria have to come from the universities; this list
 * exists so the IP Manager has something concrete to react to at review.
 */
export const GUARDRAIL_CRITERIA = [
  'No formulations, concentrations, or quantities',
  'No process parameters (temperatures, pressures, timings)',
  'No algorithms, sequences, or model architectures',
  'No step-by-step method or protocol',
  'No supplier names or part numbers',
];

interface Rule {
  criterion: string;
  severity: GuardrailFlag['severity'];
  pattern: RegExp;
}

// Keyword matching, not a model. Deterministic on purpose so the seeded leaky draft
// always flags the same way during a walkthrough.
const RULES: Rule[] = [
  {
    criterion: GUARDRAIL_CRITERIA[0],
    severity: 'block',
    pattern: /\b\d+(\.\d+)?\s?(%|wt%|mg\/mL|mg\/kg|mol|molar|M\b|ppm)\b/gi,
  },
  {
    criterion: GUARDRAIL_CRITERIA[1],
    severity: 'block',
    pattern: /\b\d+(\.\d+)?\s?(°\s?[CF]|degrees\s?[CF]|kPa|MPa|psi|bar|rpm)\b/gi,
  },
  {
    criterion: GUARDRAIL_CRITERIA[2],
    severity: 'warn',
    pattern: /\b(algorithm|neural network|convolutional|loss function|gradient descent|kernel|sequence of)\b/gi,
  },
  {
    criterion: GUARDRAIL_CRITERIA[3],
    severity: 'warn',
    pattern: /\b(step\s?\d|first,? then|the method is to|procedure is|by (?:first )?(?:heating|mixing|sintering|annealing))\b/gi,
  },
  {
    criterion: GUARDRAIL_CRITERIA[4],
    severity: 'warn',
    pattern: /\b(part (?:no\.?|number)\s?\S+|catalog(?:ue)? \S+|sourced from [A-Z][A-Za-z]+)\b/g,
  },
];

const CONTEXT = 42;

export function runGuardrails(text: string): GuardrailFlag[] {
  if (!text) return [];
  const flags: GuardrailFlag[] = [];
  const seen = new Set<string>();

  for (const rule of RULES) {
    rule.pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = rule.pattern.exec(text)) !== null) {
      const start = Math.max(0, match.index - CONTEXT);
      const end = Math.min(text.length, match.index + match[0].length + CONTEXT);
      const excerpt = `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
      const key = `${rule.criterion}::${match[0]}`;
      if (!seen.has(key)) {
        seen.add(key);
        flags.push({ excerpt, criterion: rule.criterion, severity: rule.severity });
      }
      if (match[0].length === 0) rule.pattern.lastIndex++;
    }
  }

  return flags;
}
