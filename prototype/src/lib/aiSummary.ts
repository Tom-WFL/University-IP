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

import type { IpItem } from '@/data/types';

/** Strip the marker the seed data uses on confidential bodies. */
const unprefix = (text: string) => text.replace(/^CONFIDENTIAL\s*—\s*/i, '').trim();

const firstSentences = (text: string, count: number) => {
  const parts = unprefix(text).split(/(?<=\.)\s+/);
  return parts.slice(0, count).join(' ').trim();
};

/** The failure modes a reviewer is meant to catch. Keyed off the item id so a
 *  given disclosure always drafts the same way and the demo is repeatable. */
type Flaw = 'leaks_confidential' | 'overclaims' | 'names_partner' | 'none';

function flawFor(id: string): Flaw {
  // Deterministic, stable across reloads: sum the char codes.
  const n = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const flaws: Flaw[] = ['none', 'overclaims', 'none', 'leaks_confidential', 'none', 'names_partner'];
  return flaws[n % flaws.length];
}

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
}): string {
  const { id, title, field, confidentialDetail } = input;
  const body = firstSentences(confidentialDetail, 2);
  const area = field ? field.toLowerCase() : 'this field';

  const base = body
    ? `A ${area} technology from this university's research portfolio. ${body}`
    : `A ${area} technology disclosed by this university. ${title} is available for commercialization.`;

  switch (flawFor(id)) {
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

/** Redraft an existing item. Same generator, wrapped for the regenerate action. */
export function redraftSummary(item: IpItem): string {
  return draftSummary({
    id: item.id,
    title: item.title,
    field: item.disclosure.field,
    confidentialDetail: item.confidentialDetail,
  });
}

/** How long the fake "drafting…" state should run, in ms. Long enough to read
 *  as work happening, short enough not to stall a live demo. */
export const DRAFT_DELAY_MS = 900;
