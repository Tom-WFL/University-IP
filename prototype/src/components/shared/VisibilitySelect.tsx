import * as React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { PrePublishDialog } from './PrePublishDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDemo } from '@/store/DemoStore';
import { VISIBILITY_LABEL, VISIBILITY_ORDER, type IpRecord, type VisibilityTier } from '@/store/types';
import { cn } from '@/lib/utils';

/**
 * UIP-7 — the visibility dropdown that replaced the binary "Published" toggle.
 * Every guard the meeting asked for runs here before a scope change lands:
 * unapproved summary blocks release (UIP-9), a staged institution confirms tier skips (UIP-6),
 * and pulling an IP back while founders have raised their hand warns first.
 */
export function VisibilitySelect({ ip, compact = false }: { ip: IpRecord; compact?: boolean }) {
  const { checkVisibility, setVisibility, institution, state } = useDemo();
  const [prePublish, setPrePublish] = React.useState<VisibilityTier | null>(null);
  const [skipConfirm, setSkipConfirm] = React.useState<{ next: VisibilityTier; policyTier: VisibilityTier } | null>(
    null,
  );
  const [reduceConfirm, setReduceConfirm] = React.useState<{ next: VisibilityTier; raiseCount: number } | null>(null);

  const inst = institution ?? state.institutions.find((i) => i.id === ip.institutionId);

  const attempt = (next: VisibilityTier) => {
    if (next === ip.visibility) return;
    const verdict = checkVisibility(ip.id, next);

    if (verdict.kind === 'needs_summary') {
      toast({
        title: 'Approve the summary first',
        description: 'An IP can only leave Private once its concept summary has been approved.',
        variant: 'destructive',
      });
      return;
    }
    if (verdict.kind === 'skips_tier') {
      setSkipConfirm({ next, policyTier: verdict.policyTier });
      return;
    }
    if (verdict.kind === 'reduces_with_raises') {
      setReduceConfirm({ next, raiseCount: verdict.raiseCount });
      return;
    }
    if (next === 'private') {
      commit(next);
      return;
    }
    setPrePublish(next);
  };

  const commit = (next: VisibilityTier) => {
    setVisibility(ip.id, next);
    toast({
      title: next === 'private' ? 'Moved back to Private' : `Released — ${VISIBILITY_LABEL[next]}`,
      description:
        next === 'private'
          ? 'Nobody outside the university can see this record.'
          : next === 'network'
            ? 'Visible to every founder in the Wildfire network.'
            : `Visible at ${VISIBILITY_LABEL[next].toLowerCase()} scope.`,
    });
  };

  return (
    <>
      <Select value={ip.visibility} onValueChange={(v) => attempt(v as VisibilityTier)}>
        <SelectTrigger className={cn(compact && 'h-9 text-xs')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {VISIBILITY_ORDER.map((v) => (
            <SelectItem key={v} value={v}>
              {VISIBILITY_LABEL[v]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <PrePublishDialog
        ip={ip}
        target={prePublish}
        onCancel={() => setPrePublish(null)}
        onConfirm={() => {
          if (prePublish) commit(prePublish);
          setPrePublish(null);
        }}
      />

      <AlertDialog open={!!skipConfirm} onOpenChange={(o) => !o && setSkipConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Skip a release tier?</AlertDialogTitle>
            <AlertDialogDescription>
              {inst?.shortName} releases campus-first and lets each tier sit before widening. Going straight to{' '}
              {skipConfirm && VISIBILITY_LABEL[skipConfirm.next]} skips{' '}
              {skipConfirm && VISIBILITY_LABEL[skipConfirm.policyTier]}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (skipConfirm) setPrePublish(skipConfirm.next);
                setSkipConfirm(null);
              }}
            >
              Skip anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!reduceConfirm} onOpenChange={(o) => !o && setReduceConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Narrow visibility with open hand raises?</AlertDialogTitle>
            <AlertDialogDescription>
              {reduceConfirm?.raiseCount} founder{reduceConfirm?.raiseCount === 1 ? ' has' : 's have'} raised their hand
              on this IP. Narrowing the scope hides it from founders who can no longer see it — their hand raises stay
              in your queue. What should happen to them was not settled at the meeting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (reduceConfirm) commit(reduceConfirm.next);
                setReduceConfirm(null);
              }}
            >
              Narrow anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
