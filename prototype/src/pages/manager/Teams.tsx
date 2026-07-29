import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { SendToCohortDialog } from '@/components/manager/SendToCohortDialog';
import { useStore } from '@/data/store';
import { formatDate, initials } from '@/lib/utils';

/**
 * Teams formed from IP matches, and their I-Corps handoff status. The
 * handoff is the boundary — what happens inside a cohort is another build.
 */
export function Teams() {
  const navigate = useNavigate();
  const universityId = useStore((s) => s.activeUniversityId);
  const ipItems = useStore((s) => s.ipItems);
  const teams = useStore((s) => s.teams);
  const users = useStore((s) => s.users);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const cohorts = useStore((s) => s.cohorts);
  const [dialogTeamId, setDialogTeamId] = useState<string | null>(null);

  const mineIds = new Set(ipItems.filter((i) => i.universityId === universityId).map((i) => i.id));
  const myTeams = teams.filter((t) => mineIds.has(t.ipItemId));

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={Users}
            title="Teams & I-Corps"
            subtitle="Teams that formed around your IP, and where each one is in the handoff."
          />
        </FadeIn>

        {myTeams.length === 0 ? (
          <FadeIn>
            <EmptyState
              icon={Users}
              title="No teams yet"
              body="A team appears here the moment you approve a hand-raise. Publish IP and review the interest it attracts."
              actionLabel="Review hand-raises"
              onAction={() => navigate('/manage/interest')}
            />
          </FadeIn>
        ) : (
          <div className="space-y-3">
            {myTeams.map((team) => {
              const item = ipItems.find((i) => i.id === team.ipItemId);
              const application = cohortApplications.find((a) => a.teamId === team.id);
              const cohort = application ? cohorts.find((c) => c.id === application.cohortId) : undefined;

              return (
                <FadeIn key={team.id}>
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Users className="w-5 h-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <button
                            onClick={() => item && navigate(`/manage/ip/${item.id}`)}
                            className="text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2 rounded"
                          >
                            <p className="font-medium text-gray-900 group-hover:text-[#ED1C24] transition-colors">
                              {team.name}
                            </p>
                          </button>
                          <p className="text-xs text-gray-500">Formed {formatDate(team.formedAt)}</p>

                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            {team.memberIds.map((id) => {
                              const member = users.find((u) => u.id === id);
                              return (
                                <span
                                  key={id}
                                  className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 pl-1 pr-2.5 py-1 text-xs text-gray-700"
                                >
                                  <span className="w-5 h-5 rounded-full bg-white text-gray-600 text-[10px] font-semibold flex items-center justify-center">
                                    {initials(member?.name ?? '?')}
                                  </span>
                                  {member?.name ?? 'Unknown'}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div className="shrink-0">
                          {application && cohort ? (
                            <div className="text-right space-y-1">
                              <StatusChip status={application.status} />
                              <p className="text-xs text-gray-500">{cohort.name}</p>
                            </div>
                          ) : (
                            <Button variant="gradient" size="sm" onClick={() => setDialogTeamId(team.id)}>
                              <Send className="w-4 h-4" />
                              Send to I-Corps
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        )}
      </Stagger>

      <SendToCohortDialog teamId={dialogTeamId} onClose={() => setDialogTeamId(null)} />
    </div>
  );
}
