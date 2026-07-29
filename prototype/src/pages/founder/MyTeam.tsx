import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useCurrentUser, useStore } from '@/data/store';
import { formatDate, initials } from '@/lib/utils';

export function MyTeam() {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const teams = useStore((s) => s.teams);
  const users = useStore((s) => s.users);
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const cohorts = useStore((s) => s.cohorts);

  const myTeams = teams.filter((t) => t.memberIds.includes(user.id));

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={Users}
            title="My team"
            subtitle="The IP you matched to, who's on it with you, and where you are in the program."
          />
        </FadeIn>

        {myTeams.length === 0 ? (
          <FadeIn>
            <EmptyState
              icon={Users}
              title="No team yet"
              body="When a university approves your hand-raise, your team appears here — with the inventor on it if they stayed attached."
              actionLabel="Find IP to build"
              onAction={() => navigate('/discover')}
            />
          </FadeIn>
        ) : (
          myTeams.map((team) => {
            const item = ipItems.find((i) => i.id === team.ipItemId);
            const university = universities.find((u) => u.id === item?.universityId);
            const application = cohortApplications.find((a) => a.teamId === team.id);
            const cohort = application ? cohorts.find((c) => c.id === application.cohortId) : undefined;

            return (
              <FadeIn key={team.id}>
                <Card className="overflow-hidden rounded-2xl border-gray-100">
                  <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-6 py-5">
                    <p className="text-xs font-bold uppercase tracking-widest text-white/70">
                      {university?.name}
                    </p>
                    <h2 className="text-xl font-bold text-white mt-1 leading-tight">{team.name}</h2>
                    <p className="text-white/80 text-sm mt-1">Formed {formatDate(team.formedAt)}</p>
                  </div>

                  <CardContent className="p-6 space-y-5">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        Who's on it
                      </h3>
                      <ul className="space-y-2">
                        {team.memberIds.map((id) => {
                          const member = users.find((u) => u.id === id);
                          return (
                            <li key={id} className="flex items-center gap-3">
                              <span className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0">
                                {initials(member?.name ?? '?')}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {member?.name}
                                  {id === user.id && <span className="text-gray-400 font-normal"> (you)</span>}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{member?.title}</p>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                        I-Corps
                      </h3>
                      {application && cohort ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusChip status={application.status} />
                          <span className="text-sm text-gray-700">{cohort.name}</span>
                          <span className="text-xs text-gray-500">
                            starts {formatDate(cohort.startsOn)}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">
                          Not submitted yet. Your university's IP manager puts teams forward for the next cohort.
                        </p>
                      )}
                    </div>

                    {item && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/discover/${item.id}`)}>
                        View the IP
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </FadeIn>
            );
          })
        )}
      </Stagger>
    </div>
  );
}
