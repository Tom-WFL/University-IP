import { useNavigate } from 'react-router-dom';
import {
  Archive,
  FlaskConical,
  Globe,
  Hand,
  LayoutDashboard,
  Send,
  Signpost,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatsRow } from '@/components/shared/StatsRow';
import { AuditTimeline } from '@/components/shared/AuditTimeline';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { needsSummaryReview, useActiveUniversity, useStore } from '@/data/store';
import { daysSince } from '@/lib/utils';

/**
 * The IP Manager's landing screen. Answers "what needs me today?" before it
 * shows anything else — the attention queue is the point, the stats are context.
 */
export function ManagerDashboard() {
  const navigate = useNavigate();
  const university = useActiveUniversity();
  const universityId = useStore((s) => s.activeUniversityId);
  const ipItems = useStore((s) => s.ipItems).filter((i) => i.universityId === universityId);
  const handRaises = useStore((s) => s.handRaises);
  const teams = useStore((s) => s.teams);
  const cohortApplications = useStore((s) => s.cohortApplications);
  const audit = useStore((s) => s.audit).filter((e) => e.universityId === universityId);
  const users = useStore((s) => s.users);

  const ipIds = new Set(ipItems.map((i) => i.id));
  const myHandRaises = handRaises.filter((hr) => ipIds.has(hr.ipItemId));
  const pending = myHandRaises.filter((hr) => hr.status === 'pending');
  const myTeams = teams.filter((t) => ipIds.has(t.ipItemId));
  const myTeamIds = new Set(myTeams.map((t) => t.id));
  const sentToCohort = cohortApplications.filter((a) => myTeamIds.has(a.teamId));

  const published = ipItems.filter((i) => i.publishScope !== 'private');
  const undecided = ipItems.filter((i) => i.route === 'undecided');
  // The "IP mining" nudge from the meeting: old disclosures still sitting private.
  const shelved = ipItems.filter((i) => i.shelved && i.publishScope === 'private');
  const stale = ipItems.filter(
    (i) => i.publishScope === 'private' && !i.shelved && daysSince(i.createdAt) >= 14,
  );

  const stats = [
    { label: 'IP in the platform', value: ipItems.length, icon: FlaskConical },
    { label: 'Published', value: published.length, icon: Globe },
    { label: 'Hand-raises to review', value: pending.length, icon: Hand, emphasis: true },
    { label: 'Teams formed', value: myTeams.length, icon: Users },
    { label: 'Sent to I-Corps', value: sentToCohort.length, icon: Send },
  ];

  const needsReview = ipItems.filter(needsSummaryReview);

  const attention = [
    // Above hand-raises: an unread draft blocks publishing entirely, so it is
    // the thing most likely to be quietly holding the portfolio up.
    needsReview.length && {
      key: 'needs_review',
      icon: Sparkles,
      tone: 'bg-amber-50 text-amber-600',
      title: `${needsReview.length} AI draft summar${
        needsReview.length === 1 ? 'y needs' : 'ies need'
      } your review`,
      body: 'These were written from the confidential disclosure. None of them can be published until you have read them.',
      cta: 'Review drafts',
      to: '/manage/ip?filter=needs_review',
    },
    pending.length && {
      key: 'pending',
      icon: Hand,
      tone: 'bg-orange-50 text-orange-600',
      title: `${pending.length} hand-raise${pending.length === 1 ? '' : 's'} waiting on you`,
      body: 'Someone wants to build one of these. Review and approve to form the team.',
      cta: 'Review hand-raises',
      to: '/manage/interest',
    },
    shelved.length && {
      key: 'shelved',
      icon: Archive,
      tone: 'bg-amber-50 text-amber-600',
      title: `${shelved.length} shelved disclosure${shelved.length === 1 ? '' : 's'} still private`,
      body: 'Older IP whose inventor may have moved on. Publishing a summary is how someone rediscovers it.',
      cta: 'Go mining',
      to: '/manage/ip?filter=shelved',
    },
    undecided.length && {
      key: 'undecided',
      icon: Signpost,
      tone: 'bg-indigo-50 text-indigo-600',
      title: `${undecided.length} item${undecided.length === 1 ? '' : 's'} with no route yet`,
      body: 'After you talk to the inventor, set Founder, Hackathon, or Founder Match.',
      cta: 'Open the console',
      to: '/manage/ip?filter=undecided',
    },
    stale.length && {
      key: 'stale',
      icon: FlaskConical,
      tone: 'bg-gray-100 text-gray-500',
      title: `${stale.length} item${stale.length === 1 ? '' : 's'} imported but never published`,
      body: 'Private is a valid hold state — just make sure it is a decision, not a backlog.',
      cta: 'Review',
      to: '/manage/ip?filter=private',
    },
  ].filter(Boolean) as Array<{
    key: string;
    icon: typeof Hand;
    tone: string;
    title: string;
    body: string;
    cta: string;
    to: string;
  }>;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-6">
        <FadeIn>
          <PageHeader
            icon={LayoutDashboard}
            title={university?.name ?? 'IP Management'}
            subtitle="Bring the university's IP in, decide who can see it, and route it to someone who will build it."
            action={
              <Button variant="gradient" onClick={() => navigate('/manage/import')}>
                Import IP
              </Button>
            }
          />
        </FadeIn>

        <FadeIn>
          <StatsRow stats={stats} />
        </FadeIn>

        {attention.length > 0 && (
          <FadeIn>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Needs your attention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {attention.map((a) => {
                  const Icon = a.icon;
                  return (
                    <div
                      key={a.key}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-4"
                    >
                      <div className={`w-11 h-11 rounded-xl shrink-0 flex items-center justify-center ${a.tone}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900">{a.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5">{a.body}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => navigate(a.to)} className="shrink-0">
                        {a.cta}
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeIn>
        )}

        <FadeIn>
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Recent activity</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/manage/audit')}>
                Full audit trail
              </Button>
            </CardHeader>
            <CardContent>
              <AuditTimeline events={audit} users={users} limit={6} />
            </CardContent>
          </Card>
        </FadeIn>
      </Stagger>
    </div>
  );
}
