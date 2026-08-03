import { Fragment, useEffect, useState } from 'react';
import { AlertTriangle, Check, ShieldCheck } from 'lucide-react';
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
import { SCOPES, listScopeLabels, scopesSkipped } from '@/data/scopes';
import type { IpItem, PublishScope, RedactionCriterion } from '@/data/types';
import { ownershipHelp } from '@/components/shared/chips';

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
  policy,
  targetScope,
  onCancel,
  onConfirm,
}: {
  item: IpItem;
  /** The criteria already attested on the review — shown here as evidence. */
  policy: RedactionCriterion[];
  targetScope: PublishScope | null;
  onCancel: () => void;
  onConfirm: (scope: PublishScope) => void;
}) {
  const [authorised, setAuthorised] = useState(false);
  const [irreversible, setIrreversible] = useState(false);

  // Reset the checkboxes every time the dialog opens — consent never carries over.
  useEffect(() => {
    if (targetScope) {
      setAuthorised(false);
      setIrreversible(false);
    }
  }, [targetScope]);

  const open = targetScope !== null;
  // Going public is the one step that cannot be walked back — a search engine
  // will have it before you change your mind — so it asks for one more.
  const goingPublic = targetScope === 'public';
  const ready = authorised && (!goingPublic || irreversible);
  // Tiers being passed over. Distance alone adds no checkbox — the clearance
  // for campus is the clearance for the national network — but it does change
  // what the dialog has to say.
  const skipped = targetScope ? scopesSkipped(item.publishScope, targetScope) : [];

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
            <div className="flex items-center gap-2 text-sm flex-wrap">
              <ScopeChip scope={item.publishScope} />
              {/* Show the tiers being passed over, struck through, so a leap
                  looks like a leap rather than like an ordinary next step. */}
              {skipped.map((scope) => (
                <Fragment key={scope}>
                  <span className="text-gray-300">→</span>
                  <span className="opacity-40 line-through">
                    <ScopeChip scope={scope} showIcon={false} />
                  </span>
                </Fragment>
              ))}
              <span className="text-gray-400">→</span>
              <ScopeChip scope={targetScope} />
            </div>
            <p className="text-sm text-gray-600">
              This will be visible to {SCOPES[targetScope].audience}.
            </p>
          </div>
        )}

        {/* A jump does not skip AUDIENCES — the wider tiers already contain the
            narrower ones, so everyone below is included either way. What it
            skips is the chance to watch how a disclosure lands at one level
            before widening again. Saying "skipping campus and statewide" without
            that distinction would be actively misleading. */}
        {targetScope && skipped.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 space-y-1.5">
            <p className="text-sm font-medium text-blue-900">
              Going straight past {listScopeLabels(skipped)}
            </p>
            <p className="text-sm text-blue-800">
              Those readers are included in {SCOPES[targetScope].label.toLowerCase()} anyway — a
              wider level always contains the narrower ones. What you are giving up is the chance
              to see how this lands at each level before opening it further.
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

          {goingPublic && (
            <label className="flex gap-3 items-start cursor-pointer rounded-lg border border-red-200 bg-red-50/50 p-3 hover:bg-red-50 transition-colors">
              <Checkbox
                checked={irreversible}
                onCheckedChange={(v) => setIrreversible(v === true)}
                className="mt-0.5"
              />
              <span className="text-sm text-gray-700">
                I understand this becomes{' '}
                <span className="font-medium">publicly indexable and cannot be un-published</span> —
                pulling it back later does not remove it from search results or archives.
              </span>
            </label>
          )}

          {/* The content check already happened at review, one criterion at a
              time. Repeating it as a single blanket tick here would just train
              people to click through both. Show what was attested instead. */}
          {policy.length > 0 && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-sm font-medium text-emerald-900">
                  Checked against all {policy.length} release criteria
                </p>
              </div>
              <ul className="mt-2 space-y-1">
                {policy.map((c) => (
                  <li key={c.id} className="flex items-start gap-1.5 text-xs text-emerald-800">
                    <Check className="w-3 h-3 mt-0.5 shrink-0" strokeWidth={3} />
                    {c.label}
                  </li>
                ))}
              </ul>
            </div>
          )}

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
            {ready ? 'Publish' : goingPublic ? 'Confirm both to publish' : 'Confirm to publish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
