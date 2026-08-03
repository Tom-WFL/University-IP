/**
 * Simulated AI drafting of the non-confidential summary.
 *
 * THIS IS A MOCK. There is no model call here and no network. It is a
 * deterministic string transform standing in for the real thing so the review
 * workflow can be demonstrated end to end. In the real app this becomes a
 * server-side call whose output lands in `publicSummary` with
 * `summarySource: 'ai'` and `summaryReviewed: false`.
 *
 * Why AI drafts at all: a university hands over a spreadsheet of a few hundred
 * shelf disclosures. Nobody is going to hand-write a public summary for each
 * one, so without drafting, bulk import produces a few hundred rows that can
 * never be published. The draft is what makes the import worth doing.
 *
 * Why the drafts here are imperfect: the whole point of the review gate is that
 * a machine summary of confidential IP is not safe to publish unread. If every
 * generated draft were clean, the review step would be theatre and the demo
 * would quietly argue against its own guardrail. So `flaw` below seeds
 * realistic failure modes — leaking a confidential phrase, overclaiming a
 * result, naming an unannounced partner — for the IP Manager to actually catch.
 */

import type { IpItem, RedactionCriterion } from '@/data/types';

/** Strip the marker the seed data uses on confidential bodies. */
const unprefix = (text: string) => text.replace(/^CONFIDENTIAL\s*—\s*/i, '').trim();

const firstSentences = (text: string, count: number) => {
  const parts = unprefix(text).split(/(?<=\.)\s+/);
  return parts.slice(0, count).join(' ').trim();
};

/** The failure modes a reviewer is meant to catch. Keyed off the item id so a
 *  given disclosure always drafts the same way and the demo is repeatable. */
type Flaw = 'leaks_confidential' | 'overclaims' | 'names_partner' | 'none';

function flawFor(id: string, attempt: number): Flaw {
  // Deterministic per (item, attempt): the same item always drafts the same
  // way first time so demos repeat, but asking for another draft genuinely
  // produces another draft. Keying on the id alone made "Redraft with AI"
  // return byte-identical text, which read as a broken button.
  const n = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const flaws: Flaw[] = ['none', 'overclaims', 'none', 'leaks_confidential', 'none', 'names_partner'];
  return flaws[(n + attempt) % flaws.length];
}

/** Openers cycled per attempt so a redraft reads differently, not just
 *  differently-flawed. */
const OPENERS = [
  (area: string) => `A ${area} technology from this university's research portfolio.`,
  (area: string) => `University-owned ${area} work available for commercialization.`,
  (area: string) => `An unlicensed ${area} disclosure from the university's portfolio.`,
];

/**
 * Draft a non-confidential summary from a disclosure.
 *
 * Takes the shape of an IpItem rather than the item itself so it can run during
 * CSV import, before an item exists.
 */
export function draftSummary(input: {
  id: string;
  title: string;
  field: string;
  confidentialDetail: string;
  /** Which attempt this is. 0 is the first draft; each redraft increments. */
  attempt?: number;
}): string {
  const { id, title, field, confidentialDetail, attempt = 0 } = input;
  const body = firstSentences(confidentialDetail, 2);
  const area = field ? field.toLowerCase() : 'this field';
  const opener = OPENERS[attempt % OPENERS.length](area);

  const base = body
    ? `${opener} ${body}`
    : `${opener} ${title} is available for commercialization.`;

  switch (flawFor(id, attempt)) {
    case 'leaks_confidential':
      // Drags a phrase across from the confidential body that has no business
      // being public. This is the one a reviewer MUST catch.
      return `${base} Internal note: ${firstSentences(confidentialDetail.split('. ').slice(-1)[0] ?? '', 1)}`;
    case 'overclaims':
      return `${base} It outperforms every competing approach on the market and is ready for immediate commercial deployment.`;
    case 'names_partner':
      return `${base} The university is already in licensing discussions with a major defense contractor.`;
    default:
      return base;
  }
}

/** Redraft an existing item. `attempt` must increment so each redraft differs. */
export function redraftSummary(item: IpItem, attempt: number): string {
  return draftSummary({
    id: item.id,
    title: item.title,
    field: item.disclosure.field,
    confidentialDetail: item.confidentialDetail,
    attempt,
  });
}

/**
 * Which redaction criteria this draft was written to follow.
 *
 * The mock does not actually reason about them — it reports the policy it was
 * handed, which is exactly what a real constrained prompt would be doing. The
 * value is that the manager can see the constraints rather than trust them.
 */
export function criteriaApplied(policy: RedactionCriterion[]): string[] {
  return policy.map((c) => c.id);
}

/** How long the fake "drafting…" state should run, in ms. Long enough to read
 *  as work happening, short enough not to stall a live demo. */
export const DRAFT_DELAY_MS = 900;
