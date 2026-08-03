import { useMemo } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  FlaskConical,
  Globe,
  Hand,
  Lock,
  Trophy,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsRow } from '@/components/shared/StatsRow';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { scopeLabel } from '@/components/shared/chips';
import { useActiveUniversity, useStore } from '@/data/store';
import {
  buildFunnel,
  buildMomentum,
  buildParticipation,
  buildStalls,
  byField,
  byScope,
  pct,
} from '@/lib/insights';
import type { PublishScope } from '@/data/types';
import { cn } from '@/lib/utils';

/** Solid fills for the stacked bar. The chip palette is too pale to read at
 *  3px tall, and the national chip is a gradient, which cannot tile. */
const scopeFill: Record<PublishScope, string> = {
  private: 'bg-gray-300',
  campus: 'bg-blue-400',
  statewide: 'bg-orange-400',
  national: 'bg-[#ED1C24]',
  public: 'bg-[#F26522]',
};

/**
 * University leadership — read-only oversight.
 *
 * This answers the Jul 2 intake's parked question about whether the VP of
 * Research is a distinct in-app role: yes, and the distinction is that they
 * cannot change anything. Not one mutating action is imported into this file,
 * and the persona's navigation exposes no route that could.
 *
 * The numbers come from the same derivations the IP manager's dashboard uses,
 * so the two views cannot disagree — the fastest way to lose a research office
 * is for leadership's count of disclosures to differ from the IP office's.
 */
export function Insights() {
  const university = useActiveUniversity();
  const universityId = useStore((s) => s.activeUniversityId);
  const allItems = useStore((s) => s.ipItems);
  const allHandRaises = useStore((s) => s.handRaises);
  const allTeams = useStore((s) => s.teams);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const cohorts = useStore((s) => s.cohorts);
  const hackathons = useStore((s) => s.hackathons);
  const registrations = useStore((s) => s.registrations);
  const users = useStore((s) => s.users);
  const allAudit = useStore((s) => s.audit);

  const data = useMemo(() => {
    const ipItems = allItems.filter((i) => i.universityId === universityId);
    const ipIds = new Set(ipItems.map((i) => i.id));
    const handRaises = allHandRaises.filter((h) => ipIds.has(h.ipItemId));
    const teams = allTeams.filter((t) => ipIds.has(t.ipItemId));
    const teamIds = new Set(teams.map((t) => t.id));
    const apps = cohortApplications.filter((a) => teamIds.has(a.teamId));
    const audit = allAudit.filter((e) => e.universityId === universityId);

    return {
      ipItems,
      handRaises,
      teams,
      apps,
      funnel: buildFunnel({ ipItems, handRaises, teams, cohortApplications: apps }),
      scopes: byScope(ipItems),
      fields: byField(ipItems),
      stalls: buildStalls({ ipItems, handRaises, teams, cohortApplications: apps }),
      momentum: buildMomentum({ ipItems, audit }),
      participation: buildParticipation({
        ipItems,
        hackathons,
        registrations,
        cohorts,
        cohortApplications: apps,
        users,
        universityId: universityId ?? '',
      }),
    };
  }, [
    allItems,
    allHandRaises,
    allTeams,
    cohortApplications,
    cohorts,
    hackathons,
    registrations,
    users,
    allAudit,
    universityId,
  ]);

  const { funnel, scopes, fields, stalls, momentum, participation } = data;
  const total = data.ipItems.length;
  const published = total - (scopes.find((s) => s.scope === 'private')?.count ?? 0);

  const stats = [
    { label: 'Disclosures in the platform', value: total, icon: FlaskConical },
    { label: 'Published to someone', value: published, icon: Globe },
    { label: 'Founders who raised a hand', value: data.handRaises.length, icon: Hand },
    { label: 'Teams formed', value: data.teams.length, icon: Users },
    { label: 'Sent to I-Corps', value: data.apps.length, icon: CalendarDays },
  ];

  const header = (
    <PageHeader
      icon={BarChart3}
      title={university ? `${university.name} — Insights` : 'Insights'}
      subtitle="Read-only. How much IP is in the platform, how far it is getting, and where it is stopping."
    />
  );

  if (total === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Stagger className="space-y-6">
          <FadeIn>{header}</FadeIn>
          <FadeIn>
            <EmptyState
              icon={BarChart3}
              title="Nothing to report yet"
              body="Once the IP office imports its first disclosures, the portfolio and the pipeline appear here."
            />
          </FadeIn>
        </Stagger>
      </div>
    );
  }

  const widest = funnel[0].count || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-6">
        <FadeIn>{header}</FadeIn>

        <FadeIn>
          <StatsRow stats={stats} />
        </FadeIn>

        {/* --- the pipeline ------------------------------------------------- */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">From disclosure to a team</CardTitle>
              <p className="text-sm text-gray-500">
                Counted in disclosures at every step, so the percentages compare like with like.
                Three founders raising a hand on one disclosure is one disclosure moving.
              </p>
            </CardHeader>
            <CardContent className="space-y-3.5">
              {funnel.map((stage) => (
                <div key={stage.key}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-gray-900">{stage.label}</p>
                    <div className="flex items-baseline gap-2 shrink-0">
                      {stage.conversion !== null && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            stage.conversion >= 50
                              ? 'bg-emerald-50 text-emerald-700'
                              : stage.conversion > 0
                                ? 'bg-amber-50 text-amber-700'
                                : 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {stage.conversion}% of the step above
                        </span>
                      )}
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {stage.count}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#ED1C24] to-[#F26522] transition-all duration-500"
                      style={{
                        width: `${stage.count > 0 ? Math.max(pct(stage.count, widest), 2) : 0}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stage.help}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>

        {/* --- portfolio shape ----------------------------------------------- */}
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn className="h-full">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Who can see the portfolio</CardTitle>
                <p className="text-sm text-gray-500">
                  Every disclosure sits at exactly one scope. Private is a legitimate place to be
                  — the question is whether it is a decision.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
                  {scopes
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <div
                        key={s.scope}
                        className={cn('h-full transition-all duration-500', scopeFill[s.scope])}
                        style={{ width: `${s.pct}%` }}
                        title={`${scopeLabel(s.scope)}: ${s.count}`}
                      />
                    ))}
                </div>
                <ul className="space-y-2">
                  {scopes.map((s) => (
                    <li key={s.scope} className="flex items-center gap-2.5 text-sm">
                      <span className={cn('w-2.5 h-2.5 rounded-full shrink-0', scopeFill[s.scope])} />
                      <span className="text-gray-700 flex-1 min-w-0 truncate">
                        {scopeLabel(s.scope)}
                      </span>
                      <span className="text-gray-400 text-xs tabular-nums">{s.pct}%</span>
                      <span className="font-semibold text-gray-900 tabular-nums w-6 text-right">
                        {s.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn className="h-full">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">By discipline</CardTitle>
                <p className="text-sm text-gray-500">
                  The filled blocks are what has been published. A department disclosing steadily
                  with nothing getting out is the thing worth asking about.
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {fields.map((f) => (
                    <li key={f.field}>
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="text-gray-700 min-w-0 truncate">{f.field}</span>
                        <span className="text-xs text-gray-500 shrink-0 tabular-nums">
                          {f.published} of {f.total} out
                        </span>
                      </div>
                      {/* One block per disclosure — with single-digit counts this
                          reads more honestly than a proportional bar. */}
                      <div className="mt-1 flex h-2 w-full gap-0.5">
                        {Array.from({ length: f.total }).map((_, i) => (
                          <span
                            key={i}
                            className={cn(
                              'flex-1 rounded-sm',
                              i < f.published ? 'bg-[#F26522]' : 'bg-gray-200',
                            )}
                          />
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        {/* --- where things stall -------------------------------------------- */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Where things are stopping</CardTitle>
              <p className="text-sm text-gray-500">
                Ordered by what is actually holding the pipeline up, not by size.
              </p>
            </CardHeader>
            <CardContent>
              {stalls.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="Nothing is stuck"
                  body="No unreviewed drafts, no founders waiting on an answer, and no teams sitting without a cohort."
                />
              ) : (
                <ul className="space-y-3">
                  {stalls.map((s) => (
                    <li
                      key={s.key}
                      className="flex gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                    >
                      <span
                        className={cn(
                          'w-9 h-9 rounded-xl shrink-0 flex items-center justify-center',
                          s.weight >= 4 ? 'bg-amber-100 text-amber-600' : 'bg-gray-200 text-gray-500',
                        )}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {s.count} · {s.label}
                        </p>
                        <p className="text-sm text-gray-500 mt-0.5">{s.detail}</p>
                        {s.oldestDays > 0 && (
                          <p className="text-xs text-gray-400 mt-1">
                            Oldest has been waiting {s.oldestDays} day
                            {s.oldestDays === 1 ? '' : 's'}.
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* --- participation and movement ------------------------------------ */}
        <div className="grid gap-6 lg:grid-cols-2">
          <FadeIn className="h-full">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Programs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Metric
                  icon={Trophy}
                  label="Hackathons involving this school"
                  value={participation.hackathonCount}
                  detail={`${participation.featuredIpCount} disclosure${
                    participation.featuredIpCount === 1 ? '' : 's'
                  } offered as a challenge · ${participation.registrationCount} registration${
                    participation.registrationCount === 1 ? '' : 's'
                  }`}
                />
                <Metric
                  icon={CalendarDays}
                  label="I-Corps applications"
                  value={participation.applicationsByStatus.reduce((a, s) => a + s.count, 0)}
                  detail={
                    participation.applicationsByStatus
                      .filter((s) => s.count > 0)
                      .map((s) => `${s.count} ${s.status}`)
                      .join(' · ') || 'None submitted yet.'
                  }
                />
                <Metric
                  icon={Lock}
                  label="Confidential detail published"
                  value={0}
                  detail="Only the non-confidential summary is ever published, at any scope. This number is structurally zero, not currently zero."
                />
              </CardContent>
            </Card>
          </FadeIn>

          <FadeIn className="h-full">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Movement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Metric
                  icon={BarChart3}
                  label="Recorded actions in the last 30 days"
                  value={momentum.eventsLast30}
                  detail={
                    momentum.eventsPrior30 > 0
                      ? `${momentum.eventsPrior30} in the 30 days before that.`
                      : 'Nothing recorded in the 30 days before that.'
                  }
                />
                <Metric
                  icon={Globe}
                  label="Typical days from disclosure to published"
                  value={momentum.medianDaysToPublish ?? 0}
                  detail={
                    momentum.publishSample > 0
                      ? `Median across ${momentum.publishSample} published disclosure${
                          momentum.publishSample === 1 ? '' : 's'
                        } — too small a sample to call it a trend.`
                      : 'Nothing has been published yet, so there is nothing to measure.'
                  }
                />
                {momentum.lastActivityDays !== null && (
                  <p className="text-xs text-gray-400 pt-1">
                    Last recorded action{' '}
                    {momentum.lastActivityDays === 0
                      ? 'today'
                      : `${momentum.lastActivityDays} day${
                          momentum.lastActivityDays === 1 ? '' : 's'
                        } ago`}
                    . Every figure here is derived from the same audit trail the IP office sees.
                  </p>
                )}
              </CardContent>
            </Card>
          </FadeIn>
        </div>

        <FadeIn>
          <p className="text-xs text-gray-400 text-center">
            This view is read-only by design. Changing scope, routes and matches stays with the IP
            office.
          </p>
        </FadeIn>
      </Stagger>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="w-9 h-9 rounded-xl bg-gray-100 text-gray-500 shrink-0 flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
