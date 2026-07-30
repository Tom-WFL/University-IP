import { AlertTriangle, Check, Lock, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VISIBILITY_LABEL, type IpRecord, type VisibilityTier } from '@/store/types';

/**
 * UIP-11 — the cross-check the IP Manager sees before an IP leaves Private.
 * Yash asked for "a couple of warnings — cross check this, cross check that"; the exact
 * checks were never specified, so these are the ones the rest of the flow can actually verify.
 */
export function PrePublishDialog({
  ip,
  target,
  onCancel,
  onConfirm,
}: {
  ip: IpRecord;
  target: VisibilityTier | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!target) return null;

  const summaryApproved = ip.summary?.status === 'approved';
  const flags = ip.summary?.guardrailFlags ?? [];
  const flagsClear = flags.length === 0;
  const routeSet = ip.route !== 'unassigned';

  const rows = [
    {
      ok: summaryApproved,
      label: 'Concept summary approved',
      detail: summaryApproved
        ? `Approved by ${ip.summary?.approvedBy ?? 'the IP Manager'}`
        : 'Not approved — this blocks release',
    },
    {
      ok: flagsClear,
      warn: !flagsClear,
      label: 'Non-disclosure guardrails clear',
      detail: flagsClear
        ? 'No flagged phrases in the summary'
        : `${flags.length} flagged phrase${flags.length === 1 ? '' : 's'} still in the summary`,
    },
    {
      ok: routeSet,
      warn: !routeSet,
      label: 'Commercialization route chosen',
      detail: routeSet ? 'Route is set' : 'No route assigned yet',
    },
    {
      ok: true,
      label: 'Inventor involvement recorded',
      detail:
        ip.involvement === 'contact_only'
          ? 'Contact only — the founder reaches the inventor through you'
          : 'Inventor wants to be involved',
    },
  ];

  const blocked = !summaryApproved;

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Release to {VISIBILITY_LABEL[target]}?</DialogTitle>
          <DialogDescription>
            Cross-check before this goes out. Once released, everyone at this scope can read the concept summary.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label} className="flex items-start gap-3 rounded-md border border-gray-200 p-3">
              {r.ok ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
              ) : r.warn ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
              ) : (
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">{r.label}</p>
                <p className="text-xs text-gray-500">{r.detail}</p>
              </div>
            </div>
          ))}
          <div className="flex items-start gap-3 rounded-md border border-orange-200 bg-orange-50 p-3">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-orange-700" />
            <div>
              <p className="text-sm font-medium text-orange-900">Viewers must accept an NDA</p>
              <p className="text-xs text-orange-800">
                Always on. Whether the NDA should be per-IP or one blanket agreement per person is still open.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={blocked} onClick={onConfirm}>
            {blocked ? 'Approve the summary first' : `Release to ${VISIBILITY_LABEL[target]}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
