import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, ShieldCheck, X } from 'lucide-react';
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
import { SCOPES } from '@/data/scopes';
import { canPublish } from '@/data/store';
import type { IpItem, PublishScope, University } from '@/data/types';

/**
 * Dual control for a batch.
 *
 * The single-item dialog can afford to talk about one disclosure's journey.
 * This one cannot, so it does the thing that actually matters at scale:
 * it splits the selection before you commit, and shows exactly which
 * disclosures are going out and which are being held back and why.
 *
 * Averaging the gate across a selection would be the tempting shortcut and the
 * wrong one — "12 of 14 are ready, publish anyway?" is how the two that were
 * not ready end up published. Held items are never included in the write.
 */
export function BulkPublishDialog({
  items,
  universities,
  targetScope,
  onCancel,
  onConfirm,
}: {
  /** The full selection, ready and not. */
  items: IpItem[];
  universities: University[];
  targetScope: PublishScope | null;
  onCancel: () => void;
  onConfirm: (scope: PublishScope) => void;
}) {
  const [authorised, setAuthorised] = useState(false);
  const [irreversible, setIrreversible] = useState(false);

  useEffect(() => {
    if (targetScope) {
      setAuthorised(false);
      setIrreversible(false);
    }
  }, [targetScope]);

  const { ready, held } = useMemo(() => {
    const r: IpItem[] = [];
    const h: Array<{ item: IpItem; reason: string }> = [];
    if (!targetScope) return { ready: r, held: h };
    for (const item of items) {
      if (item.publishScope === targetScope) {
        h.push({ item, reason: 'Already at this level.' });
        continue;
      }
      if (SCOPES[item.publishScope] && item.publishScope !== targetScope) {
        const owner = universities.find((u) => u.id === item.universityId);
        const gate = canPublish(item, owner?.redactionPolicy ?? []);
        if (!gate.ok) {
          h.push({ item, reason: gate.reason ?? 'Not ready to publish.' });
          continue;
        }
      }
      r.push(item);
    }
    return { ready: r, held: h };
  }, [items, universities, targetScope]);

  const open = targetScope !== null;
  const goingPublic = targetScope === 'public';
  const ownershipConcerns = ready.filter((i) => i.ownership !== 'bor');
  const canGo = ready.length > 0 && authorised && (!goingPublic || irreversible);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle>
              Publish {ready.length} disclosure{ready.length === 1 ? '' : 's'}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            {targetScope && (
              <>
                All of them move to <span className="font-medium text-gray-700">{SCOPES[targetScope].label}</span>{' '}
                — visible to {SCOPES[targetScope].audience}.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-200 divide-y divide-gray-100">
          {ready.map((item) => (
            <div key={item.id} className="flex items-start gap-2 px-3 py-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-gray-500">
                  {SCOPES[item.publishScope].label} → {targetScope && SCOPES[targetScope].label}
                </p>
              </div>
            </div>
          ))}
          {held.map(({ item, reason }) => (
            <div key={item.id} className="flex items-start gap-2 px-3 py-2 bg-amber-50/60">
              <X className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" strokeWidth={3} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-900 truncate">{item.title}</p>
                <p className="text-xs text-amber-800">Held back — {reason}</p>
              </div>
            </div>
          ))}
        </div>

        {held.length > 0 && (
          <p className="text-sm text-amber-900">
            {held.length} of the {items.length} selected {held.length === 1 ? 'is' : 'are'} not going
            out. Publishing here leaves {held.length === 1 ? 'it' : 'them'} exactly as {held.length === 1 ? 'it is' : 'they are'}.
          </p>
        )}

        {ownershipConcerns.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              {ownershipConcerns.length} of these {ownershipConcerns.length === 1 ? 'is' : 'are'} not
              plainly BOR-owned. Student-owned and entangled disclosures need the owner&rsquo;s
              agreement before they go out — worth opening those individually.
            </p>
          </div>
        )}

        {ready.length > 0 && (
          <div className="space-y-3">
            <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors">
              <Checkbox
                checked={authorised}
                onCheckedChange={(v) => setAuthorised(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                I am authorised to release all {ready.length} of these, and each release complies
                with <span className="font-medium">BOR policy 491</span>.
              </span>
            </label>

            {goingPublic && (
              <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-red-200 bg-red-50/50 p-3 hover:bg-red-50 transition-colors">
                <Checkbox
                  checked={irreversible}
                  onCheckedChange={(v) => setIrreversible(v === true)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">
                  I understand these become{' '}
                  <span className="font-medium">publicly indexable and cannot be un-published</span>.
                </span>
              </label>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!canGo}
            onClick={() => targetScope && onConfirm(targetScope)}
          >
            {ready.length === 0
              ? 'Nothing can publish'
              : `Publish ${ready.length}`}
          </Button>
        </DialogFooter>

        {targetScope && (
          <p className="text-xs text-gray-500">
            <ScopeChip scope={targetScope} showIcon={false} /> Only the non-confidential summary is
            published, at any level.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
