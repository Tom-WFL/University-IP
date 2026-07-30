import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';
import { useDemo } from '@/store/DemoStore';
import type { HandRaise } from '@/store/types';

/** UIP-14 — connect / approve / decline on a founder's hand raise. */
export function HandRaiseActions({ raise }: { raise: HandRaise }) {
  const { state, setHandRaiseStatus } = useDemo();
  const [approveOpen, setApproveOpen] = React.useState(false);
  const [declineOpen, setDeclineOpen] = React.useState(false);
  const [reason, setReason] = React.useState('');
  const [declineOthers, setDeclineOthers] = React.useState(true);

  const ip = state.ips.find((i) => i.id === raise.ipId);
  const otherPending = state.handRaises.filter(
    (h) => h.ipId === raise.ipId && h.id !== raise.id && h.status === 'pending',
  ).length;

  if (raise.status === 'approved' || raise.status === 'declined') {
    return <span className="text-xs text-gray-400">No actions</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {raise.status === 'pending' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setHandRaiseStatus(raise.id, 'connected');
            toast({
              title: 'Intro sent',
              description: `You and ${raise.founderName} have been introduced (simulated).`,
            });
          }}
        >
          Connect
        </Button>
      )}
      <Button size="sm" onClick={() => setApproveOpen(true)}>
        Approve
      </Button>
      <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50" onClick={() => setDeclineOpen(true)}>
        Decline
      </Button>

      <Dialog open={approveOpen} onOpenChange={setApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {raise.founderName}?</DialogTitle>
            <DialogDescription>
              This hands IP #{ip?.displayNo} — {ip?.title} — to {raise.founderName} and starts their Wildfire
              onboarding: mentor, mastermind facilitator, and the course library.
            </DialogDescription>
          </DialogHeader>
          {otherPending > 0 && (
            <label className="flex items-start gap-3 rounded-md border border-gray-200 p-3">
              <Checkbox checked={declineOthers} onCheckedChange={(v) => setDeclineOthers(!!v)} className="mt-0.5" />
              <span className="text-sm text-gray-700">
                Decline the other {otherPending} pending hand raise{otherPending === 1 ? '' : 's'} on this IP
                <span className="block text-xs text-gray-500">
                  How to handle several founders wanting the same IP was not settled at the meeting.
                </span>
              </span>
            </label>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setHandRaiseStatus(raise.id, 'approved', { declineOthers: otherPending > 0 && declineOthers });
                setApproveOpen(false);
                toast({
                  title: `${raise.founderName} approved`,
                  description: `IP #${ip?.displayNo} is now marked converted.`,
                });
              }}
            >
              Approve and connect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Decline {raise.founderName}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will see the outcome on their hand raises page. A short reason helps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="decline-reason">Reason (optional)</Label>
            <Input
              id="decline-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Looking for someone with clinical sales experience"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                setHandRaiseStatus(raise.id, 'declined', { declineReason: reason || undefined });
                setDeclineOpen(false);
                setReason('');
                toast({ title: 'Hand raise declined' });
              }}
            >
              Decline
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
