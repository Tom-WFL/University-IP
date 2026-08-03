import { useEffect, useState } from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScopeChip } from '@/components/shared/chips';
import type { IpItem, PublishScope } from '@/data/types';
import { ownershipHelp } from '@/components/shared/chips';

const audience: Record<PublishScope, string> = {
  private: 'nobody outside the IP office',
  campus: 'every student and faculty member at this university',
  statewide: 'everyone at all schools in the system',
  national: 'Wildfire’s entire national founder network',
  public: 'anyone on the internet — no account needed, and search engines will index it',
};

/**
 * Approved recommendation: dual control on any widening of scope.
 *
 * Two separate, deliberate confirmations — one about authority (BOR 491),
 * one about content (summary only). Both must be ticked. This is the guard
 * against an inadvertent disclosure, which the meeting called out as the
 * thing that "would be bad".
 */
export function DualControlDialog({
  item,
  targetScope,
  onCancel,
  onConfirm,
}: {
  item: IpItem;
  targetScope: PublishScope | null;
  onCancel: () => void;
  onConfirm: (scope: PublishScope) => void;
}) {
  const [authorised, setAuthorised] = useState(false);
  const [summaryOnly, setSummaryOnly] = useState(false);

  // Reset the checkboxes every time the dialog opens — consent never carries over.
  useEffect(() => {
    if (targetScope) {
      setAuthorised(false);
      setSummaryOnly(false);
    }
  }, [targetScope]);

  const open = targetScope !== null;
  const ready = authorised && summaryOnly;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle>Confirm publication</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            You are about to widen who can see <span className="font-medium text-gray-700">{item.title}</span>.
          </DialogDescription>
        </DialogHeader>

        {targetScope && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <ScopeChip scope={item.publishScope} />
              <span className="text-gray-400">→</span>
              <ScopeChip scope={targetScope} />
            </div>
            <p className="text-sm text-gray-600">
              This will be visible to {audience[targetScope]}.
            </p>
          </div>
        )}

        {item.ownership !== 'bor' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">{ownershipHelp(item.ownership)}</p>
          </div>
        )}

        <div className="space-y-3">
          <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
            <Checkbox
              checked={authorised}
              onCheckedChange={(v) => setAuthorised(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              I am authorised to release this, and the release complies with{' '}
              <span className="font-medium">BOR policy 491</span>.
            </span>
          </label>

          <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
            <Checkbox
              checked={summaryOnly}
              onCheckedChange={(v) => setSummaryOnly(v === true)}
              className="mt-0.5"
            />
            <span className="text-sm text-gray-700">
              I have read the summary below and confirm it contains{' '}
              <span className="font-medium">no confidential detail</span>.
            </span>
          </label>

          <div className="rounded-lg bg-white border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              What will be published
            </p>
            <p className="text-sm text-gray-700">{item.publicSummary}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!ready}
            onClick={() => targetScope && onConfirm(targetScope)}
          >
            {ready ? 'Publish' : 'Confirm both to publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
