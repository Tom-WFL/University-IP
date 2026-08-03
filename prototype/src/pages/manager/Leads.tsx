import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, Check, ShieldAlert, UserCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { useStore } from '@/data/store';
import { RISK_LABELS } from '@/lib/leadRisk';
import { formatDate, initials } from '@/lib/utils';
import type { User } from '@/data/types';

/**
 * Signups held for a human to look at.
 *
 * The point of the whole anti-spam design is that this list stays short. Every
 * account gets created — turning genuine prospects away is worse than a little
 * noise — but anything that trips the threshold waits here before it can
 * approach a university. The flags are shown in full so the decision is a
 * judgement rather than a coin toss.
 */
export function Leads() {
  const navigate = useNavigate();
  const users = useStore((s) => s.users);
  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const activeUniversityId = useStore((s) => s.activeUniversityId);
  const reviewLead = useStore((s) => s.reviewLead);
  const threshold = useStore((s) => s.leadReviewThreshold);

  const [tab, setTab] = useState('waiting');

  /**
   * A lead who came in through a specific disclosure belongs to that school.
   * One with no context belongs to nobody in particular, so it surfaces here
   * too rather than falling down a gap.
   */
  const mine = useMemo(() => {
    const belongsHere = (u: User) => {
      if (!u.signupIpContext) return true;
      const item = ipItems.find((i) => i.id === u.signupIpContext);
      return !item || item.universityId === activeUniversityId;
    };
    return users.filter((u) => u.signupSource !== 'seed' || u.status !== 'active').filter(belongsHere);
  }, [users, ipItems, activeUniversityId]);

  const waiting = mine.filter((u) => u.status === 'pending_review');
  const decided = mine.filter((u) => u.status === 'blocked' || (u.riskFlags.length === 0 && u.signupSource !== 'seed'));

  const renderLead = (u: User, actionable: boolean) => {
    const item = u.signupIpContext ? ipItems.find((i) => i.id === u.signupIpContext) : undefined;
    const owner = item ? universities.find((x) => x.id === item.universityId) : undefined;

    return (
      <Card key={u.id}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold flex items-center justify-center shrink-0">
              {initials(u.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">{u.name}</p>
              <p className="text-xs text-gray-500 truncate">{u.email}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Signed up {formatDate(u.createdAt)} ·{' '}
                {u.signupSource === 'marketing' ? 'from the public catalogue' : 'direct'}
              </p>
            </div>
            {u.status === 'blocked' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 text-gray-700 border border-gray-300 px-2.5 py-1 text-xs font-medium shrink-0">
                <Ban className="w-3 h-3" />
                Blocked
              </span>
            )}
            {u.status === 'active' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-1 text-xs font-medium shrink-0">
                <Check className="w-3 h-3" strokeWidth={3} />
                Cleared
              </span>
            )}
          </div>

          {/* What they came in for is the most useful thing on the card — it is
              what makes a thin answer forgivable or not. */}
          {item && (
            <button
              onClick={() => navigate(`/manage/ip/${item.id}`)}
              className="w-full text-left rounded-lg bg-orange-50 border border-orange-200 px-3 py-2 hover:bg-orange-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24]"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-orange-700">
                Came in for
              </p>
              <p className="text-sm text-gray-900 mt-0.5">{item.title}</p>
              {owner && <p className="text-xs text-gray-500">{owner.name}</p>}
            </button>
          )}

          {u.background && (
            <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                What they said they&rsquo;d do
              </p>
              <p className="text-sm text-gray-700 mt-0.5">{u.background}</p>
            </div>
          )}

          {u.riskFlags.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                Why it was held
              </p>
              <ul className="mt-1 space-y-1">
                {u.riskFlags.map((f) => (
                  <li key={f} className="text-sm text-amber-900">
                    <span className="font-medium">{RISK_LABELS[f].label}</span>
                    <span className="text-amber-800"> — {RISK_LABELS[f].detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {actionable && (
            <div className="flex flex-wrap gap-2 pt-0.5">
              <Button variant="gradient" size="sm" onClick={() => reviewLead(u.id, 'approved')}>
                <UserCheck className="w-4 h-4" />
                Let them in
              </Button>
              <Button variant="outline" size="sm" onClick={() => reviewLead(u.id, 'blocked')}>
                <Ban className="w-4 h-4" />
                Block
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={ShieldAlert}
            title="Lead review"
            subtitle={`Signups held before they can approach a university. Currently holding anything with ${threshold} or more risk signals.`}
          />
        </FadeIn>

        <FadeIn>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList>
              <TabsTrigger value="waiting">
                Waiting
                {waiting.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED1C24] px-1.5 text-xs font-semibold text-white">
                    {waiting.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="decided">Decided</TabsTrigger>
            </TabsList>

            <TabsContent value="waiting">
              {waiting.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="Nothing waiting"
                  body="Signups that trip the threshold land here. An empty queue means the funnel is behaving — everyone who signed up recently looked genuine."
                />
              ) : (
                <div className="space-y-3">{waiting.map((u) => renderLead(u, true))}</div>
              )}
            </TabsContent>

            <TabsContent value="decided">
              {decided.length === 0 ? (
                <EmptyState
                  icon={UserCheck}
                  title="Nothing decided yet"
                  body="Accounts you have cleared or blocked show up here."
                />
              ) : (
                <div className="space-y-3">{decided.map((u) => renderLead(u, false))}</div>
              )}
            </TabsContent>
          </Tabs>
        </FadeIn>
      </Stagger>
    </div>
  );
}
