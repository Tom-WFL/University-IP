import type { RiskFlag, User } from '@/data/types';

/**
 * Lead qualification — keeping the funnel wide without drowning IP managers.
 *
 * The stakeholder worry was concrete: "I could create, like, 50 different
 * accounts in, like, less than five minutes." The answer is not a wall, since
 * the whole point of the marketing site is to bring strangers in. It is to let
 * everyone through and hold the suspicious ones for a human, so an IP manager
 * only ever sees people who plausibly mean it.
 *
 * Every signal here is cheap and client-side, which is honest about what this
 * is. A real implementation adds server-side rate limiting per IP, a real
 * captcha, and genuine email verification — none of which can be simulated
 * usefully in a prototype. What CAN be shown is the decision this produces and
 * the queue it feeds.
 */

/** Throwaway-mail providers. `.example` variants so the demo data is inert. */
const DISPOSABLE_DOMAINS = [
  'mailinator',
  'temp-mail',
  'guerrillamail',
  'throwaway',
  'yopmail',
  'sharklasers',
  'trashmail',
  '10minutemail',
  'dispostable',
];

/** Below this, an intent answer is not really an answer. */
export const MIN_INTENT_CHARS = 40;

/** Same-domain signups before we start treating them as a burst. */
const VELOCITY_LIMIT = 3;

export interface RiskInput {
  email: string;
  intent: string;
  /** Hidden field a human never sees; anything in it came from a script. */
  honeypot: string;
  emailVerified: boolean;
  /** Existing accounts, for the velocity check. */
  existing: User[];
}

const domainOf = (email: string) => email.split('@')[1]?.toLowerCase() ?? '';

export function assessLead(input: RiskInput): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const domain = domainOf(input.email);

  if (input.honeypot.trim()) flags.push('honeypot');
  if (DISPOSABLE_DOMAINS.some((d) => domain.includes(d))) flags.push('disposable_email');
  if (input.intent.trim().length < MIN_INTENT_CHARS) flags.push('thin_intent');
  if (!input.emailVerified) flags.push('unverified_email');

  if (domain) {
    const sameDomain = input.existing.filter((u) => domainOf(u.email) === domain).length;
    if (sameDomain >= VELOCITY_LIMIT) flags.push('velocity');
  }

  return flags;
}

/** Human-readable reason per flag, shown to whoever works the queue. */
export const RISK_LABELS: Record<RiskFlag, { label: string; detail: string }> = {
  disposable_email: {
    label: 'Throwaway email',
    detail: 'The domain is a known disposable-mail provider.',
  },
  thin_intent: {
    label: 'Thin answer',
    detail: `They wrote fewer than ${MIN_INTENT_CHARS} characters about what they would do.`,
  },
  velocity: {
    label: 'Burst from one domain',
    detail: `${VELOCITY_LIMIT} or more accounts already exist on this email domain.`,
  },
  honeypot: {
    label: 'Hidden field filled',
    detail: 'A field no human can see was completed — almost certainly a script.',
  },
  unverified_email: {
    label: 'Email not verified',
    detail: 'They did not complete the emailed confirmation step.',
  },
};

/**
 * A signup is held when it trips the threshold. The threshold is a setting, not
 * a constant, because "wide enough for genuine prospects" is a judgement that
 * differs by campaign and belongs to whoever is watching the funnel.
 */
export function shouldHold(flags: RiskFlag[], threshold: number): boolean {
  // The honeypot is not a matter of degree — nothing legitimate fills it.
  if (flags.includes('honeypot')) return true;
  return flags.length >= threshold;
}
