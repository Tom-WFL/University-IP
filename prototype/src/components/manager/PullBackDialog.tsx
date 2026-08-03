import { Lock, Radio } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScopeChip } from '@/components/shared/chips';
import { SCOPES } from '@/data/scopes';
import type { IpItem, PublishScope } from '@/data/types';

/**
 * Coming back down off the open internet.
 *
 * Narrowing is otherwise immediate and always will be — making it harder to
 * withdraw something than to publish it would be exactly backwards. `public`
 * is the one exception, and not for safety: it is because pulling back is not
 * the undo it looks like. The item stops being served from the catalogue, but
 * search engines and archives already have what they took, and the manager
 * should hear that from us once rather than discover it later.
 *
 * No checkbox. There is nothing to attest to — this is a statement of fact,
 * and the confirm button is the acknowledgement.
 */
export function PullBackDialog({
  item,
  targetScope,
  onCancel,
  onConfirm,
}: {
  item: IpItem;
  /** null == closed. Only ever set when leaving `public`. */
  targetScope: PublishScope | null;
  onCancel: () => void;
  onConfirm: (scope: PublishScope) => void;
}) {
  const open = targetScope !== null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-gray-600" />
            </div>
            <DialogTitle>Take this off the public site</DialogTitle>
          </div>
          <DialogDescription className="pt-1">
            <span className="font-medium text-gray-700">{item.title}</span> will stop appearing in
            the public catalogue straight away.
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
              After this, visible to {SCOPES[targetScope].audience}.
            </p>
          </div>
        )}

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2">
          <Radio className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            This does not un-publish what is already out there. Anything a search engine or archive
            picked up while it was public stays picked up. Withdrawing it here stops it going
            further; it does not pull it back.
          </p>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => targetScope && onConfirm(targetScope)}>
            <Lock className="w-4 h-4" />
            Take it down
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
