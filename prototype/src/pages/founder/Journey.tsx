import { Link } from 'react-router-dom';
import { BookOpen, Lock, Users, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState, PageTitle, PrototypeNote } from '@/components/shared/primitives';
import { toast } from '@/components/ui/use-toast';
import { useDemo } from '@/store/DemoStore';

const beyondPrototype = () =>
  toast({ title: 'Beyond this prototype', description: 'The live Wildfire app handles this step.' });

/**
 * MB-8 — "then they'll get the full app experience: a mentor, a mastermind lead facilitator,
 * the Wildfire course library, all on their homepage."
 */
export default function Journey() {
  const { state } = useDemo();
  const approved = state.handRaises.find((h) => h.founderId === 'founder' && h.status === 'approved');
  const ip = approved ? state.ips.find((i) => i.id === approved.ipId) : undefined;
  const institution = ip ? state.institutions.find((i) => i.id === ip.institutionId) : undefined;

  if (!approved || !ip) {
    return (
      <div className="space-y-6">
        <PageTitle title="Next Steps" />
        <EmptyState
          icon={Lock}
          title="Nothing unlocked yet"
          body="Once an IP Manager approves your hand raise, your mentor, mastermind group and course library appear here."
          action={
            <Button asChild variant="outline">
              <Link to="/founder">Browse ideas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle title="Next Steps" />

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <p className="text-sm font-medium text-orange-900">
            You're matched to IP #{ip.displayNo} — {ip.title}
          </p>
          <p className="mt-1 text-sm text-orange-800">
            {institution?.name} approved your hand raise. Here's what Wildfire sets up for you.
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <UserCheck className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-base">Your mentor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Sarah Linden — medical device commercialization.</p>
            <Button variant="outline" size="sm" className="w-full" onClick={beyondPrototype}>
              Schedule intro
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Users className="h-5 w-5 text-indigo-500" />
            </div>
            <CardTitle className="text-base">Your mastermind</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-gray-600">Thursday Founders group — facilitator Cole Brandt.</p>
            <Button variant="outline" size="sm" className="w-full" onClick={beyondPrototype}>
              Join the group
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <BookOpen className="h-5 w-5 text-emerald-500" />
            </div>
            <CardTitle className="text-base">Course library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-1 text-sm text-gray-600">
              <li>Customer Discovery Sprint</li>
              <li>Cap Table Basics</li>
              <li>Your First 10 Customers</li>
            </ul>
            <Button variant="outline" size="sm" className="w-full" onClick={beyondPrototype}>
              Open library
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>The inventor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700">
            {ip.involvement === 'involved'
              ? `${ip.inventors[0]?.name} wants to be involved day to day — they join as your co-founder.`
              : `${ip.inventors[0]?.name} is a contact only. ${institution?.shortName}'s IP Manager makes the introduction; the company is yours to run.`}
          </p>
        </CardContent>
      </Card>

      <PrototypeNote>
        The equity split between the university, the inventor and you is not covered anywhere in this flow. It was
        raised at the meeting and explicitly parked pending conversations with the Board of Regents.
      </PrototypeNote>
    </div>
  );
}
