import { needsSummaryReview } from '@/data/store';
import { daysSince } from '@/lib/utils';
import type {
  AuditEvent,
  Cohort,
  CohortApplication,
  Hackathon,
  HackathonRegistration,
  HandRaise,
  IpItem,
  PublishScope,
  Team,
  User,
} from '@/data/types';

/**
 * Read-only aggregation for the leadership view.
 *
 * Every function here is pure and takes the state it needs, so the Insights
 * page can be assembled without importing a single mutator — the persona's
 * defining property is that it cannot change anything, and the cheapest way to
 * guarantee that is to give it no way to try.
 *
 * The numbers are deliberately computed the same way the IP manager's own
 * dashboard computes them. A VP of Research and an IP manager disagreeing
 * about how many disclosures exist is how a reporting tool loses its
 * credibility in one meeting.
 */

// --- the funnel ------------------------------------------------------------

export interface FunnelStage {
  key: string;
  label: string;
  /** Number of DISCLOSURES that reached this stage. */
  count: number;
  /** Why this stage exists, in the language of the person reading it. */
  help: string;
  /** Percentage of the stage above that made it here; null for the first. */
  conversion: number | null;
}

/**
 * The pipeline, counted in disclosures at every stage.
 *
 * Counting hand-raises here instead of the items they landed on would be the
 * easy mistake: three founders raising hands on one disclosure is not three
 * disclosures moving. Every stage is intersected with the one above it, so a
 * later stage can never render wider than an earlier one even if the data
 * somehow disagrees.
 */
export function buildFunnel(input: {
  ipItems: IpItem[];
  handRaises: HandRaise[];
  teams: Team[];
  cohortApplications: CohortApplication[];
}): FunnelStage[] {
  const { ipItems, handRaises, teams, cohortApplications } = input;

  const inPlatform = new Set(ipItems.map((i) => i.id));
  const published = new Set(ipItems.filter((i) => i.publishScope !== 'private').map((i) => i.id));

  const withInterest = new Set(
    handRaises.map((h) => h.ipItemId).filter((id) => published.has(id)),
  );

  const teamed = new Set(teams.map((t) => t.ipItemId).filter((id) => withInterest.has(id)));

  const teamIdsSentOn = new Set(cohortApplications.map((a) => a.teamId));
  const sent = new Set(
    teams.filter((t) => teamIdsSentOn.has(t.id)).map((t) => t.ipItemId).filter((id) => teamed.has(id)),
  );

  const raw = [
    {
      key: 'in_platform',
      label: 'In the platform',
      count: inPlatform.size,
      help: 'Disclosures imported or entered by hand.',
    },
    {
      key: 'published',
      label: 'Published to someone',
      count: published.size,
      help: 'A non-confidential summary is visible beyond the IP office.',
    },
    {
      key: 'interest',
      label: 'Someone raised a hand',
      count: withInterest.size,
      help: 'At least one founder or student asked to build it.',
    },
    {
      key: 'team',
      label: 'A team formed',
      count: teamed.size,
      help: 'A match was approved and a team exists.',
    },
    {
      key: 'cohort',
      label: 'Sent to I-Corps',
      count: sent.size,
      help: 'The team was handed off to a cohort.',
    },
  ];

  return raw.map((stage, i) => ({
    ...stage,
    conversion: i === 0 ? null : pct(stage.count, raw[i - 1].count),
  }));
}

/** Whole-number percentage, guarding the empty-portfolio divide-by-zero. */
export function pct(part: number, whole: number): number {
  if (whole <= 0) return 0;
  return Math.round((part / whole) * 100);
}

// --- portfolio shape -------------------------------------------------------

export const SCOPE_DISPLAY_ORDER: PublishScope[] = [
  'private',
  'campus',
  'statewide',
  'national',
  'public',
];

export interface ScopeSlice {
  scope: PublishScope;
  count: number;
  pct: number;
}

export function byScope(ipItems: IpItem[]): ScopeSlice[] {
  return SCOPE_DISPLAY_ORDER.map((scope) => {
    const count = ipItems.filter((i) => i.publishScope === scope).length;
    return { scope, count, pct: pct(count, ipItems.length) };
  });
}

export interface FieldRow {
  field: string;
  total: number;
  published: number;
}

/**
 * Volume by discipline, with the published share alongside it.
 *
 * Raw counts per field answer "who is disclosing"; the published share answers
 * "and is any of it getting out", which is the question a research office
 * actually argues about. Sorted by what is stuck, not by what is biggest —
 * a department with four disclosures and none published is the story.
 */
export function byField(ipItems: IpItem[]): FieldRow[] {
  const rows = new Map<string, FieldRow>();
  for (const item of ipItems) {
    const field = item.disclosure.field || 'Unspecified';
    const row = rows.get(field) ?? { field, total: 0, published: 0 };
    row.total += 1;
    if (item.publishScope !== 'private') row.published += 1;
    rows.set(field, row);
  }
  return [...rows.values()].sort(
    (a, b) => b.total - a.total || a.published - b.published || a.field.localeCompare(b.field),
  );
}

// --- participation ---------------------------------------------------------

export interface Participation {
  hackathonCount: number;
  /** Disclosures offered as hackathon challenges. */
  featuredIpCount: number;
  registrationCount: number;
  cohortCount: number;
  applicationsByStatus: Array<{ status: CohortApplication['status']; count: number }>;
}

export function buildParticipation(input: {
  ipItems: IpItem[];
  hackathons: Hackathon[];
  registrations: HackathonRegistration[];
  cohorts: Cohort[];
  cohortApplications: CohortApplication[];
  users: User[];
  universityId: string;
}): Participation {
  const { ipItems, hackathons, registrations, cohorts, cohortApplications, users, universityId } =
    input;

  const ourIds = new Set(ipItems.map((i) => i.id));
  const ourPeople = new Set(users.filter((u) => u.universityId === universityId).map((u) => u.id));

  // A hackathon counts as ours if it features one of our disclosures or one of
  // our people registered for it — students go to other schools' events.
  const relevant = hackathons.filter(
    (h) =>
      h.featuredIpIds.some((id) => ourIds.has(id)) ||
      registrations.some((r) => r.hackathonId === h.id && ourPeople.has(r.userId)),
  );

  const featuredIpCount = new Set(
    hackathons.flatMap((h) => h.featuredIpIds).filter((id) => ourIds.has(id)),
  ).size;

  const statuses: Array<CohortApplication['status']> = ['submitted', 'accepted', 'waitlisted'];

  return {
    hackathonCount: relevant.length,
    featuredIpCount,
    registrationCount: registrations.filter((r) => ourPeople.has(r.userId)).length,
    cohortCount: cohorts.length,
    applicationsByStatus: statuses.map((status) => ({
      status,
      count: cohortApplications.filter((a) => a.status === status).length,
    })),
  };
}

// --- where things stall ----------------------------------------------------

export interface Stall {
  key: string;
  label: string;
  count: number;
  /** What is actually holding it, and who could unblock it. */
  detail: string;
  /** Age of the oldest item in this state, in days. 0 when nothing is stuck. */
  oldestDays: number;
  /** Ranked severity so the list can lead with the real blocker. */
  weight: number;
}

/**
 * The honest version of a "health" panel.
 *
 * Each entry is something specific that has stopped moving, phrased so a VP
 * can raise it with the IP office without needing to be told what it means.
 * Entries with a count of zero are dropped by the caller rather than shown as
 * green ticks — an empty panel says "nothing is stuck" more clearly than five
 * reassuring rows.
 */
export function buildStalls(input: {
  ipItems: IpItem[];
  handRaises: HandRaise[];
  teams: Team[];
  cohortApplications: CohortApplication[];
}): Stall[] {
  const { ipItems, handRaises, teams, cohortApplications } = input;
  const ipIds = new Set(ipItems.map((i) => i.id));

  const oldest = (dates: string[]) =>
    dates.length ? Math.max(...dates.map((d) => daysSince(d))) : 0;

  const unreviewed = ipItems.filter(needsSummaryReview);
  const pendingRaises = handRaises.filter((h) => ipIds.has(h.ipItemId) && h.status === 'pending');
  const stale = ipItems.filter(
    (i) => i.publishScope === 'private' && !i.shelved && daysSince(i.createdAt) >= 14,
  );
  const shelved = ipItems.filter((i) => i.shelved && i.publishScope === 'private');
  const routeless = ipItems.filter((i) => i.publishScope !== 'private' && i.route === 'undecided');
  const sentTeamIds = new Set(cohortApplications.map((a) => a.teamId));
  const unsentTeams = teams.filter((t) => ipIds.has(t.ipItemId) && !sentTeamIds.has(t.id));

  const stalls: Stall[] = [
    {
      key: 'unreviewed',
      label: 'Draft summaries waiting on a human',
      count: unreviewed.length,
      detail:
        'None of these can be published until someone reads the draft and checks it against the release criteria. This is the only stall that blocks the pipeline outright.',
      oldestDays: oldest(unreviewed.map((i) => i.createdAt)),
      weight: 5,
    },
    {
      key: 'pending_raises',
      label: 'Founders waiting on an answer',
      count: pendingRaises.length,
      detail:
        'Somebody asked to build one of these and has not heard back. This is the stall with a person on the other end of it.',
      oldestDays: oldest(pendingRaises.map((h) => h.raisedAt)),
      weight: 4,
    },
    {
      key: 'unsent_teams',
      label: 'Teams formed but not sent to a cohort',
      count: unsentTeams.length,
      detail: 'The match worked. The handoff to I-Corps has not happened yet.',
      oldestDays: oldest(unsentTeams.map((t) => t.formedAt)),
      weight: 3,
    },
    {
      key: 'routeless',
      label: 'Published with no route decided',
      count: routeless.length,
      detail:
        'Visible, but nobody has said whether it is for a founder, a hackathon, or a match. Published without a route rarely goes anywhere.',
      oldestDays: oldest(routeless.map((i) => i.updatedAt)),
      weight: 2,
    },
    {
      key: 'stale_private',
      label: 'Private for more than two weeks',
      count: stale.length,
      detail:
        'Private is a legitimate hold. Worth confirming it is a decision rather than a backlog.',
      oldestDays: oldest(stale.map((i) => i.createdAt)),
      weight: 1,
    },
    {
      key: 'shelved',
      label: 'Back-catalogue still shelved',
      count: shelved.length,
      detail:
        'Older disclosures whose inventors may have moved on. Publishing a summary is how one of these gets rediscovered.',
      oldestDays: oldest(shelved.map((i) => i.createdAt)),
      weight: 0,
    },
  ];

  return stalls
    .filter((s) => s.count > 0)
    .sort((a, b) => b.weight - a.weight || b.oldestDays - a.oldestDays);
}

// --- movement over time ----------------------------------------------------

export interface Momentum {
  /** Audit events in the window, as a proxy for "is anything happening". */
  eventsLast30: number;
  eventsPrior30: number;
  /** Typical days from a disclosure landing to it being published. */
  medianDaysToPublish: number | null;
  /** How many published items that median is based on. */
  publishSample: number;
  lastActivityDays: number | null;
}

/**
 * The audit stream is the only timestamped series in the model, so it is what
 * "is this speeding up or slowing down" has to be built from. Stated as a
 * sample size rather than a trend line, because five events is not a trend and
 * the page should not pretend otherwise.
 */
export function buildMomentum(input: { ipItems: IpItem[]; audit: AuditEvent[] }): Momentum {
  const { ipItems, audit } = input;

  const ages = audit.map((e) => daysSince(e.at));
  const eventsLast30 = ages.filter((d) => d <= 30).length;
  const eventsPrior30 = ages.filter((d) => d > 30 && d <= 60).length;

  const byId = new Map(ipItems.map((i) => [i.id, i]));
  const gaps: number[] = [];
  const seen = new Set<string>();
  // First publish event per item wins — later scope widenings are not the
  // "how long did it take to get out" question.
  for (const e of [...audit].sort((a, b) => a.at.localeCompare(b.at))) {
    if (e.action !== 'publish' || !e.ipItemId || seen.has(e.ipItemId)) continue;
    const item = byId.get(e.ipItemId);
    if (!item) continue;
    seen.add(e.ipItemId);
    const gap = daysSince(item.createdAt) - daysSince(e.at);
    if (gap >= 0) gaps.push(gap);
  }

  return {
    eventsLast30,
    eventsPrior30,
    medianDaysToPublish: gaps.length ? median(gaps) : null,
    publishSample: gaps.length,
    lastActivityDays: ages.length ? Math.min(...ages) : null,
  };
}

export function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
