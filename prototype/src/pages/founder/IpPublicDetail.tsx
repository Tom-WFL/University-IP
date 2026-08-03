import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Hand, Mail, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FacultyChip, StatusChip } from '@/components/shared/chips';
import { FadeIn, Stagger } from '@/components/shared/motion';
import { canAct, itemInvolvement, useCurrentUser, useStore, visibleToFounder } from '@/data/store';
import { formatDate, initials } from '@/lib/utils';

/**
 * Founder-facing IP detail. Renders `publicSummary` and never touches
 * `confidentialDetail` — and refuses entirely if the item is not published
 * within the viewer's scope.
 */
export function IpPublicDetail() {
  const { ipId } = useParams<{ ipId: string }>();
  const navigate = useNavigate();
  const user = useCurrentUser();

  const ipItems = useStore((s) => s.ipItems);
  const universities = useStore((s) => s.universities);
  const users = useStore((s) => s.users);
  const handRaises = useStore((s) => s.handRaises);
  const teams = useStore((s) => s.teams);
  const raiseHand = useStore((s) => s.raiseHand);

  const [dialogOpen, setDialogOpen] = useState(false);
  // A signup held for review can read everything but cannot approach a school.
  const act = canAct(user);
  const [pitch, setPitch] = useState('');
  const [background, setBackground] = useState(user.background);

  const item = ipItems.find((i) => i.id === ipId);
  const allowed = item ? visibleToFounder(item, user.universityId, universities) : false;

  if (!item || !allowed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-lg font-medium text-gray-900">This IP isn't available to you</h1>
        <p className="text-sm text-gray-500 mt-1">
          It may not be published yet, or it may be limited to another university.
        </p>
        <Button variant="outline" className="mt-5" onClick={() => navigate('/discover')}>
          Back to Discover
        </Button>
      </div>
    );
  }

  const university = universities.find((u) => u.id === item.universityId);
  const professor = users.find((u) => u.id === item.professorId);
  const mine = handRaises.find((hr) => hr.ipItemId === item.id && hr.userId === user.id);
  const totalInterest = handRaises.filter((hr) => hr.ipItemId === item.id).length;
  const team = teams.find((t) => t.ipItemId === item.id);
  const onTeam = team?.memberIds.includes(user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Stagger className="space-y-5">
        <FadeIn>
          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            University IP
          </Link>
        </FadeIn>

        <FadeIn>
          <Card className="overflow-hidden rounded-2xl border-gray-100">
            <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-6 py-6">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-white/80">
                <Building2 className="w-3.5 h-3.5" />
                University IP · {university?.name}
              </p>
              <h1 className="text-2xl font-bold text-white mt-2 leading-tight">{item.title}</h1>
            </div>
            <div className="bg-white px-6 py-5 space-y-4">
              <p className="text-gray-700 leading-relaxed">{item.publicSummary}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 pt-4">
                <FacultyChip attachment={itemInvolvement(item)} />
                <span className="text-sm text-gray-500">{item.disclosure.field}</span>
                {totalInterest > 0 && (
                  <span className="text-sm text-gray-400 ml-auto">
                    {totalInterest} {totalInterest === 1 ? 'person has' : 'people have'} shown interest
                  </span>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* What you'd be walking into */}
        <FadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Who you'd be working with</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {professor ? (
                <div className="flex items-start gap-3 rounded-xl bg-gray-50 p-4">
                  <span className="w-10 h-10 rounded-full bg-white text-gray-600 text-sm font-semibold flex items-center justify-center shrink-0">
                    {initials(professor.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">{professor.name}</p>
                    <p className="text-xs text-gray-500">{professor.title}</p>
                    <p className="text-sm text-gray-600 mt-1.5">
                      {itemInvolvement(item) === 'attached'
                        ? 'Wants to stay involved day to day as a co-founder — you would be building this together.'
                        : 'Handing this off. Available as a contact if you have questions, but not joining the team.'}
                    </p>
                    {/* Contact details only surface for the contact-only case. */}
                    {itemInvolvement(item) === 'idea-only' && (
                      <p className="text-xs text-gray-500 mt-2 inline-flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Reach out after the university approves the match.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-sm text-gray-700">
                    No faculty member is attached to this one.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Often means the original inventor has moved on — the university is looking for someone new
                    to pick it up.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* The action */}
        <FadeIn>
          {onTeam ? (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">You're on this team</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Matched {team && formatDate(team.formedAt)}. Your team members and I-Corps status are on
                    your home page.
                  </p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/my-team')}>
                    Go to my team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : mine ? (
            <Card>
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center shrink-0">
                  <Hand className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-gray-900">You raised your hand</p>
                    <StatusChip status={mine.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {mine.status === 'pending'
                      ? `${university?.shortName}'s IP manager reviews every match. You'll see the outcome here and on your home page.`
                      : mine.status === 'declined'
                        ? 'They went a different direction on this one. Plenty more in Discover.'
                        : 'Approved — your team is on your home page.'}
                  </p>
                  <blockquote className="mt-3 rounded-lg bg-gray-50 border-l-2 border-gray-200 px-3 py-2 text-sm text-gray-600">
                    {mine.pitch}
                  </blockquote>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50/40">
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">Want to build this?</p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {act.ok
                      ? `Raise your hand and tell ${university?.shortName ?? 'them'} why you're the one. They review every match personally.`
                      : act.reason}
                  </p>
                </div>
                <Button
                  variant="gradient"
                  onClick={() => setDialogOpen(true)}
                  disabled={!act.ok}
                  title={act.ok ? undefined : act.reason}
                  className="shrink-0"
                >
                  <Hand className="w-4 h-4" />
                  Raise my hand
                </Button>
              </CardContent>
            </Card>
          )}
        </FadeIn>
      </Stagger>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise your hand</DialogTitle>
            <DialogDescription>
              {university?.shortName}'s IP manager reads this. Tell them what you'd do with{' '}
              <span className="font-medium text-gray-700">{item.title}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pitch">Why you, and what would you do first?</Label>
              <Textarea
                id="pitch"
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                rows={4}
                placeholder="What you'd build, who you'd talk to first, what you bring to it…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="background">Your background</Label>
              <Textarea
                id="background"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-gray-500">Pre-filled from your profile — edit it for this one.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              disabled={!pitch.trim()}
              onClick={() => {
                raiseHand(item.id, pitch.trim(), background.trim());
                setDialogOpen(false);
                setPitch('');
              }}
            >
              Send to {university?.shortName}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
