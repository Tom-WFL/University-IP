import type { PublishScope } from './types';

/**
 * Everything the app says about a publish scope, in one place.
 *
 * There were four of these tables — one in `chips.tsx`, one in
 * `ScopeStepper.tsx`, one in `DualControlDialog.tsx`, and a duplicate of the
 * ladder itself in `lib/insights.ts`. They had already drifted: the same tier
 * was "National network" in one and "Wildfire's entire national founder
 * network" in another, and the chip table listed `public` before `national`
 * while the ladder ordered them the other way round.
 *
 * That matters more than tidiness. These strings are what an IP manager reads
 * immediately before making a disclosure visible to strangers, and the control
 * they clicked must not describe the act in different words from the dialog
 * that confirms it.
 *
 * Deliberately free of React and lucide: `store.ts` imports the ladder from
 * here, and the store has no business pulling in an icon library. Icons live
 * with the components, as `scopeIcon()` in `chips.tsx`.
 */
export interface ScopeMeta {
  /** Short name, for chips, rails and menus. */
  label: string;
  /** Second person, for the control: "Students and faculty at this university." */
  who: string;
  /** Third person, completing "This will be visible to …" in the confirmation. */
  audience: string;
  /** Completes "Published X to …" in the audit trail. */
  auditLabel: string;
  /** Chip colours — background/text/border, matching the app's StatusBadge. */
  chipClassName: string;
  /** Solid fill for rails, dots and stacked bars, where a gradient cannot tile. */
  fill: string;
}

/**
 * The ladder, narrowest first. `scopeRank` is an index into this, so the order
 * is load-bearing — everything that compares two scopes depends on it.
 */
export const SCOPE_ORDER: PublishScope[] = ['private', 'campus', 'statewide', 'national', 'public'];

export const SCOPES: Record<PublishScope, ScopeMeta> = {
  private: {
    label: 'Private',
    who: 'Only you and this university’s IP staff.',
    audience: 'nobody outside the IP office',
    // Plain "private" now that the audit always states both ends — "from
    // private (unpublished) to campus" reads like a stumble.
    auditLabel: 'private',
    chipClassName: 'bg-gray-100 text-gray-700 border-gray-200',
    fill: 'bg-gray-300',
  },
  campus: {
    label: 'Campus',
    who: 'Students and faculty at this university.',
    audience: 'every student and faculty member at this university',
    auditLabel: 'campus',
    chipClassName: 'bg-blue-100 text-blue-700 border-blue-200',
    fill: 'bg-blue-400',
  },
  statewide: {
    label: 'Statewide',
    who: 'Everyone at the other schools in the system.',
    audience: 'everyone at all schools in the system',
    auditLabel: 'statewide',
    chipClassName: 'bg-orange-100 text-orange-700 border-orange-200',
    fill: 'bg-orange-400',
  },
  national: {
    label: 'National network',
    who: 'Wildfire’s national founder network.',
    audience: 'Wildfire’s entire national founder network',
    auditLabel: 'the national founder network',
    // The widest account-gated scope gets the brand gradient — it should feel
    // like a big deal. Bars and dots use `fill`; a gradient cannot tile.
    chipClassName: 'bg-gradient-to-r from-[#ED1C24] to-[#F26522] text-white border-transparent',
    fill: 'bg-[#ED1C24]',
  },
  public: {
    label: 'Public',
    who: 'Anyone on the internet. No account, no login, and search engines will find it.',
    audience: 'anyone on the internet — no account needed, and search engines will index it',
    auditLabel: 'the public marketing site',
    chipClassName: 'bg-red-100 text-red-800 border-red-200',
    fill: 'bg-[#F26522]',
  },
};

export const scopeLabel = (scope: PublishScope) => SCOPES[scope].label;
export const scopeWho = (scope: PublishScope) => SCOPES[scope].who;
export const scopeAudience = (scope: PublishScope) => SCOPES[scope].audience;

export function scopeRank(scope: PublishScope): number {
  return SCOPE_ORDER.indexOf(scope);
}

/**
 * The tiers a move passes straight over. Empty for a single step or any
 * narrowing.
 *
 * Worth being careful about the language these feed. Scopes are cumulative —
 * `visibleToFounder` grants a national item to every campus and statewide
 * reader as well — so jumping private → national does NOT skip those
 * audiences. It skips the *steps*: the chance to see how a disclosure lands at
 * one tier before widening to the next. Copy built on this must say so.
 */
export function scopesSkipped(from: PublishScope, to: PublishScope): PublishScope[] {
  const start = scopeRank(from);
  const end = scopeRank(to);
  if (end <= start + 1) return [];
  return SCOPE_ORDER.slice(start + 1, end);
}

/** Every tier a move newly reaches, the destination included. */
export function scopesGained(from: PublishScope, to: PublishScope): PublishScope[] {
  const start = scopeRank(from);
  const end = scopeRank(to);
  if (end <= start) return [];
  return SCOPE_ORDER.slice(start + 1, end + 1);
}

/** "Campus and Statewide" · "Campus, Statewide and National network". */
export function listScopeLabels(scopes: PublishScope[]): string {
  const labels = scopes.map(scopeLabel);
  if (labels.length <= 1) return labels.join('');
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}
