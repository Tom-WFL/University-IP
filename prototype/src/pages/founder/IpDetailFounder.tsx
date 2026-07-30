import * as React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, Hand, Lock, Tag, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { NdaDialog } from '@/components/shared/NdaDialog';
import { StatusBadge } from '@/components/shared/primitives';
import { useDemo } from '@/store/DemoStore';
import { formatDate, year } from '@/lib/format';

export default function IpDetailFounder() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, hasAcceptedNda, acceptNda, raiseHand, logAccess } = useDemo();

  const ip = state.ips.find((i) => i.id === id);
  const [ndaOpen, setNdaOpen] = React.useState(false);
  const [raiseOpen, setRaiseOpen] = React.useState(false);
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (ip && hasAcceptedNda) logAccess(ip.id, 'viewed_summary');
  }, [ip?.id, hasAcceptedNda]);

  if (!ip || ip.visibility !== 'network' || ip.summary?.status !== 'approved') {
    return (
      <div className="space-y-4">
        <p className="text-gray-500">That idea is not available at your scope.</p>
        <Button variant="outline" onClick={() => navigate('/founder')}>
          Back to discovery
        </Button>
      </div>
    );
  }

  const institution = state.institutions.find((i) => i.id === ip.institutionId);
  const myRaise = state.handRaises.find((h) => h.ipId === ip.id && h.founderId === 'founder');
  const inventor = ip.inventors[0];
  const isHackathon = ip.route === 'hackathon';

  return (
    <div className="space-y-6">
      <NdaDialog
        open={ndaOpen}
        onAccept={() => {
          acceptNda(ip.id);
          setNdaOpen(false);
          toast({ title: 'NDA accepted', description: 'You can read concept summaries across the network.' });
        }}
        onCancel={() => setNdaOpen(false)}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/founder" className="mb-2 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="h-4 w-4" />
            Back to discovery
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{ip.title}</h1>
            <Badge variant="outline" className="text-xs text-gray-500">
              IP #{ip.displayNo}
            </Badge>
            {myRaise && <StatusBadge status={myRaise.status} />}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              {institution?.name}
            </span>
            <span className="flex items-center gap-1">
              <Tag className="h-4 w-4" />
              {ip.classification}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Disclosed {year(ip.disclosureDate)}
            </span>
          </div>
        </div>

        {!isHackathon && !myRaise && hasAcceptedNda && (
          <Button onClick={() => setRaiseOpen(true)}>
            <Hand className="mr-2 h-4 w-4" />
            Raise your hand
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>What this is</CardTitle>
        </CardHeader>
        <CardContent>
          {hasAcceptedNda ? (
            <>
              <p className="whitespace-pre-line text-gray-700">{ip.summary?.text}</p>
              <p className="mt-4 text-xs text-gray-400">
                Concept summary reviewed and approved by the university's IP Manager. It describes what the invention
                is for, not how it works — you get the method once you are connected.
              </p>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <p className="select-none whitespace-pre-line text-gray-700 blur-sm" aria-hidden="true">
                  {ip.summary?.text}
                </p>
                <div className="absolute inset-0" />
              </div>
              <div className="flex flex-col items-center gap-3 rounded-md border border-orange-200 bg-orange-50 p-4 text-center">
                <Lock className="h-5 w-5 text-orange-700" />
                <p className="text-sm text-orange-900">
                  Accept the non-disclosure agreement to read the concept summary.
                </p>
                <Button onClick={() => setNdaOpen(true)}>Review the NDA</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>The inventor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
              <User className="h-4 w-4 text-gray-400" />
              {inventor?.name}
              {inventor?.retired && <span className="text-xs text-gray-400">(retired)</span>}
            </p>
            {inventor?.department && <p className="text-sm text-gray-500">{inventor.department}</p>}
            <p className="text-sm text-gray-600">
              {ip.involvement === 'involved'
                ? 'Wants to be involved day to day as a co-founder.'
                : 'Listed as a contact only — whoever takes this on runs with it. Reach them through the university’s IP Manager.'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>How to take this on</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isHackathon ? (
              <p className="text-sm text-gray-600">
                This one is set aside as a hackathon idea — participants pick it up at an in-person event rather than
                through Founder Match.
              </p>
            ) : (
              <>
                <p className="text-sm text-gray-600">
                  Raise your hand and the university's IP Manager reviews it. If they think you are a fit, they connect
                  you and the idea becomes yours to build.
                </p>
                {myRaise && (
                  <p className="text-sm text-gray-500">
                    You raised your hand on {formatDate(myRaise.createdAt)}.{' '}
                    {myRaise.status === 'pending' && 'Waiting on the IP Manager.'}
                    {myRaise.status === 'connected' && 'They have been introduced to you.'}
                    {myRaise.status === 'approved' && (
                      <Link to="/founder/journey" className="text-orange-600 hover:underline">
                        Approved — see your next steps.
                      </Link>
                    )}
                    {myRaise.status === 'declined' && `Declined. ${myRaise.declineReason ?? ''}`}
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={raiseOpen} onOpenChange={setRaiseOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raise your hand on this idea</DialogTitle>
            <DialogDescription>
              The IP Manager at {institution?.shortName} sees this and decides whether to connect you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="raise-note">Why you (optional)</Label>
            <Textarea
              id="raise-note"
              className="min-h-[110px] resize-y"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What you'd bring to this — background, market access, anything relevant."
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRaiseOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                raiseHand(ip.id, note);
                setRaiseOpen(false);
                setNote('');
                toast({
                  title: 'Hand raised',
                  description: `${institution?.shortName}'s IP Manager will review it.`,
                });
              }}
            >
              Raise my hand
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
