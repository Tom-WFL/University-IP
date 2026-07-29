import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';
import { ScopeChip } from '@/components/shared/chips';
import { scopeWho } from './ScopeStepper';
import type { IpItem } from '@/data/types';

/**
 * Confirm an edit to something people can already see.
 *
 * Editing a private item is free — nobody is looking. Once an item is
 * published, changing its summary rewrites text that is live to an audience
 * right now, with no re-publish step to catch it. That deserves a beat.
 *
 * Deliberately ONE confirmation, not the two of `DualControlDialog`: this is a
 * correction to already-released text, not a fresh release. Making it as heavy
 * as publishing would train people to click through both.
 */
export function LiveEditDialog({
  item,
  pendingText,
  onCancel,
  onConfirm,
}: {
  item: IpItem;
  /** The edited summary awaiting confirmation; null when closed. */
  pendingText: string | null;
  onCancel: () => void;
  onConfirm: (text: string) => void;
}) {
  const open = pendingText !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 text-orange-600" />
            </div>
            <DialogTitle>This one is already live</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            <span className="font-medium text-gray-700">{item.title}</span> is published, so this
            change takes effect immediately for everyone who can see it.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <ScopeChip scope={item.publishScope} />
          </div>
          <p className="text-sm text-gray-600">{scopeWho(item.publishScope)}</p>
        </div>

        <div className="space-y-2">
          <div className="rounded-lg border border-gray-200 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
              Replacing
            </p>
            <p className="text-sm text-gray-500 line-through decoration-gray-300">
              {item.publicSummary}
            </p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 mb-1">
              With
            </p>
            <p className="text-sm text-gray-800">{pendingText}</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="gradient" onClick={() => pendingText && onConfirm(pendingText)}>
            Update the live summary
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
