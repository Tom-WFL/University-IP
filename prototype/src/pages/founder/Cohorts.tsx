import { CalendarDays, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useCurrentUser, useStore } from '@/data/store';
import { formatDate } from '@/lib/utils';

/**
 * I-Corps cohort listings plus the viewer's own application status. Teams get
 * into a cohort via the IP manager's handoff — this page is where a founder
 * sees that it happened. Cohort management is a separate build.
 */
export function Cohorts() {
  const user = useCurrentUser();
  const cohorts = useStore((s) => s.cohorts);
  const teams = useStore((s) => s.teams);
  const cohortApplications = useStore((s) => s.cohortApplications);

  const myTeamIds = new Set(teams.filter((t) => t.memberIds.includes(user.id)).map((t) => t.id));
  const myApplications = cohortApplications.filter((a) => myTeamIds.has(a.teamId));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={CalendarDays}
            title="I-Corps"
            subtitle="Customer discovery, run as a cohort. Your university's IP manager can put your team forward."
          />
        </FadeIn>

        {myApplications.length > 0 && (
          <FadeIn>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Your applications
              </h2>
              {myApplications.map((application) => {
                const cohort = cohorts.find((c) => c.id === application.cohortId);
                const team = teams.find((t) => t.id === application.teamId);
                return (
                  <Card key={application.id} className="rounded-2xl border-blue-200 bg-blue-50/40">
                    <CardContent className="p-5 flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-gray-900">{cohort?.name}</p>
                          <StatusChip status={application.status} />
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          {team?.name} · submitted {formatDate(application.submittedAt)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Your IP manager put this forward. The cohort team will be in touch.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          </FadeIn>
        )}

        <FadeIn>
          <section className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              Upcoming cohorts
            </h2>
            {cohorts.map((cohort) => {
              const applied = myApplications.some((a) => a.cohortId === cohort.id);
              return (
                <Card key={cohort.id} className="rounded-2xl border-gray-100">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900">{cohort.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {cohort.host} · starts {formatDate(cohort.startsOn)} · {cohort.seats} seats
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Applications close {formatDate(cohort.applicationsCloseOn)}
                      </p>
                    </div>
                    {applied && (
                      <span className="text-sm font-medium text-blue-700 shrink-0">Applied</span>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        </FadeIn>

        <FadeIn>
          <p className="text-xs text-gray-400 text-center">
            Running a cohort — intake decisions, sessions, reporting — is the I-Corps module, built separately.
          </p>
        </FadeIn>
      </Stagger>
    </div>
  );
}
