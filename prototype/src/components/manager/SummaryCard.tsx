import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Eye, PencilLine, Sparkles, TriangleAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/input';
import { DRAFT_DELAY_MS } from '@/lib/aiSummary';
import { needsSummaryReview } from '@/data/store';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { IpItem, User } from '@/data/types';

/**
 * The non-confidential summary, and the review that has to happen before it
 * can go anywhere.
 *
 * The summary is the ONLY body text that ever leaves this office, so who wrote
 * it and whether a human has read it are first-class facts about the record,
 * not metadata. An unreviewed AI draft is shown in amber and blocks publishing
 * (see `canPublish`) — a machine summary of confidential IP reaching a campus
 * unread is the exact failure the whole publish gate exists to prevent.
 */
export function SummaryCard({
  item,
  reviewer,
  onSave,
  onApprove,
  onRegenerate,
}: {
  item: IpItem;
  reviewer: User | undefined;
  /** Save edited text. The caller may intercept to confirm a live change. */
  onSave: (text: string) => void;
  onApprove: () => void;
  onRegenerate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(item.publicSummary);
  const [drafting, setDrafting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const unreviewed = needsSummaryReview(item);

  // If the item changes underneath us (regenerate, or navigating between
  // items), drop any half-finished edit rather than showing stale text.
  useEffect(() => {
    setText(item.publicSummary);
    setEditing(false);
  }, [item.id, item.publicSummary]);

  useEffect(() => {
    if (editing) textareaRef.current?.focus();
  }, [editing]);

  const handleRegenerate = () => {
    setDrafting(true);
    setEditing(false);
    // The delay is cosmetic — it makes the simulated draft read as work
    // happening rather than an instant swap. See lib/aiSummary.ts.
    window.setTimeout(() => {
      onRegenerate();
      setDrafting(false);
    }, DRAFT_DELAY_MS);
  };

  return (
    <Card className={cn(unreviewed && 'border-amber-300')}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-gray-400" />
            <CardTitle className="text-base">Non-confidential summary</CardTitle>
          </div>
          <ProvenanceBadge item={item} reviewer={reviewer} />
        </div>
        <p className="text-sm text-gray-500">
          The only text that leaves this office. This is what founders read.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {unreviewed && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-2.5">
            <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium">Nobody has checked this draft yet.</p>
              <p className="mt-0.5 text-amber-800">
                It was written from the confidential disclosure, so read it for anything that
                shouldn&rsquo;t be public. You can&rsquo;t publish until you do.
              </p>
            </div>
          </div>
        )}

        {drafting ? (
          <DraftingShimmer />
        ) : editing ? (
          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              rows={5}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe what this technology does, without disclosing how it works."
              aria-label="Non-confidential summary"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="gradient"
                size="sm"
                disabled={!text.trim()}
                onClick={() => {
                  onSave(text.trim());
                  setEditing(false);
                }}
              >
                <Check className="w-4 h-4" />
                Save summary
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setText(item.publicSummary);
                  setEditing(false);
                }}
              >
                Cancel
              </Button>
              <span className="text-xs text-gray-400 ml-auto tabular-nums">
                {text.trim().length} characters
              </span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-700 leading-relaxed">
              {item.publicSummary || (
                <span className="text-gray-400 italic">
                  No summary yet — write one before publishing.
                </span>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* "Edit summary", not "Edit" — the header carries a generic
                  Edit that opens the whole record, and two identical labels
                  doing different things is a coin-flip for the user. */}
              <Button
                variant={unreviewed ? 'outline' : 'ghost'}
                size="sm"
                onClick={() => setEditing(true)}
              >
                <PencilLine className="w-4 h-4" />
                Edit summary
              </Button>

              {unreviewed && (
                <Button variant="gradient" size="sm" onClick={onApprove}>
                  <Check className="w-4 h-4" />
                  Looks right
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={handleRegenerate} className="text-gray-500">
                <Sparkles className="w-4 h-4" />
                Redraft with AI
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Says plainly who wrote this text and whether anyone has stood behind it. */
function ProvenanceBadge({ item, reviewer }: { item: IpItem; reviewer: User | undefined }) {
  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border shrink-0';

  if (item.summarySource === 'ai' && !item.summaryReviewed) {
    return (
      <span className={cn(base, 'bg-amber-100 text-amber-800 border-amber-200')}>
        <Sparkles className="w-3 h-3" />
        AI draft — needs review
      </span>
    );
  }

  const who = reviewer ? reviewer.name.split(' ')[0] : 'a manager';
  const when = item.summaryReviewedAt ? formatDate(item.summaryReviewedAt) : null;

  if (item.summarySource === 'ai') {
    return (
      <span
        className={cn(base, 'bg-green-100 text-green-800 border-green-200')}
        title={when ? `Reviewed ${when}` : undefined}
      >
        <Check className="w-3 h-3" strokeWidth={3} />
        AI draft, checked by {who}
      </span>
    );
  }

  return (
    <span className={cn(base, 'bg-gray-100 text-gray-600 border-gray-200')}>
      <PencilLine className="w-3 h-3" />
      Written by {who}
    </span>
  );
}

function DraftingShimmer() {
  return (
    <div className="space-y-2" role="status" aria-label="Drafting a new summary">
      {[100, 96, 72].map((width, i) => (
        <motion.div
          key={width}
          className="h-3.5 rounded bg-gradient-to-r from-orange-100 via-amber-50 to-orange-100"
          style={{ width: `${width}%` }}
          animate={{ opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
      <p className="text-xs text-gray-400 pt-1">Drafting a new summary…</p>
    </div>
  );
}
