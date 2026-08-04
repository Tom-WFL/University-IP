import { useState } from 'react';
import { Hand } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { InterestQueue } from '@/components/manager/InterestQueue';
import { SendToCohortDialog } from '@/components/manager/SendToCohortDialog';
import { Confetti, FadeIn, Stagger } from '@/components/shared/motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStore, useUniversityScope } from '@/data/store';

/** Every hand-raise across the school's portfolio, in one queue. */
export function HandRaises() {
  const scope = useUniversityScope();
  const ipItems = useStore((s) => s.ipItems);
  const handRaises = useStore((s) => s.handRaises);
  const users = useStore((s) => s.users);
  const reviewHandRaise = useStore((s) => s.reviewHandRaise);

  const [celebrate, setCelebrate] = useState(false);
  const [newTeamId, setNewTeamId] = useState<string | null>(null);

  const mineIds = new Set(ipItems.filter((i) => scope.matches(i.universityId)).map((i) => i.id));
  const relevant = handRaises.filter((hr) => mineIds.has(hr.ipItemId));
  const pending = relevant.filter((hr) => hr.status === 'pending');
  const decided = relevant.filter((hr) => hr.status !== 'pending');

  const handleReview = (handRaiseId: string, decision: 'approved' | 'declined') => {
    const teamId = reviewHandRaise(handRaiseId, decision);
    if (teamId) {
      setCelebrate(true);
      window.setTimeout(() => setCelebrate(false), 1800);
      // Offer the I-Corps handoff right where the team was created.
      window.setTimeout(() => setNewTeamId(teamId), 900);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Confetti show={celebrate} />
      <Stagger className="space-y-5">
        <FadeIn>
          <PageHeader
            icon={Hand}
            title="Hand-raises"
            subtitle="People who want to build your IP. Approving one forms the team on the spot."
          />
        </FadeIn>

        <FadeIn>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Awaiting review
                {pending.length > 0 && (
                  <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED1C24] px-1.5 text-xs font-semibold text-white">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="decided">Decided ({decided.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <InterestQueue
                handRaises={pending}
                users={users}
                ipItems={ipItems}
                showItemTitle
                onReview={handleReview}
                emptyBody="Nothing waiting on you. Publishing more IP — or widening its scope — is how you get more interest."
              />
            </TabsContent>

            <TabsContent value="decided">
              <InterestQueue
                handRaises={decided}
                users={users}
                ipItems={ipItems}
                showItemTitle
                onReview={handleReview}
                emptyBody="No decisions recorded yet."
              />
            </TabsContent>
          </Tabs>
        </FadeIn>
      </Stagger>

      <SendToCohortDialog teamId={newTeamId} onClose={() => setNewTeamId(null)} />
    </div>
  );
}
