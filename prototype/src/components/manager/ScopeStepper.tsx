import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Globe, Landmark, Lock, Radio, School, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DualControlDialog } from './DualControlDialog';
import { SCOPE_ORDER, canPublish, scopeRank } from '@/data/store';
import type { IpItem, PublishScope } from '@/data/types';
import { cn } from '@/lib/utils';

const meta: Record<PublishScope, { label: string; who: string; icon: typeof Lock; dot: string }> = {
  private: {
    label: 'Private',
    who: 'Only you and this university’s IP staff.',
    icon: Lock,
    dot: 'bg-gray-400',
  },
  campus: {
    label: 'Campus',
    who: 'Students and faculty at this university.',
    icon: School,
    dot: 'bg-blue-500',
  },
  statewide: {
    label: 'Statewide',
    who: 'Everyone at the other schools in the system.',
    icon: Landmark,
    dot: 'bg-orange-500',
  },
  national: {
    label: 'National network',
    who: 'Wildfire’s national founder network.',
    icon: Globe,
    dot: 'bg-gradient-to-r from-[#ED1C24] to-[#F26522]',
  },
  public: {
    label: 'Public',
    who: 'Anyone on the internet. No account, no login, and search engines will find it.',
    icon: Radio,
    dot: 'bg-[#ED1C24]',
  },
};

/**
 * The publish-scope journey — AXIS 1. Widening always goes through dual
 * control; narrowing is immediate (pulling something back should never be
 * harder than putting it out).
 */
export function ScopeStepper({
  item,
  onChange,
  onReviewSummary,
}: {
  item: IpItem;
  onChange: (scope: PublishScope) => void;
  /** Jump the user to the summary so they can clear the block. */
  onReviewSummary?: () => void;
}) {
  const [pendingScope, setPendingScope] = useState<PublishScope | null>(null);
  const current = scopeRank(item.publishScope);
  const gate = canPublish(item);

  const handleSelect = (scope: PublishScope) => {
    if (scope === item.publishScope) return;
    if (scopeRank(scope) > current) {
      // Widening. If the summary hasn't been read by a human, we never even
      // reach dual control — there is nothing to consent to yet.
      if (!gate.ok) return;
      setPendingScope(scope);
    } else {
      onChange(scope);
    }
  };

  const nextScope = SCOPE_ORDER[current + 1];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Who can see this</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Publishing shares the non-confidential summary only — never the confidential disclosure.
        </p>
      </div>

      {/* The journey rail */}
      <div className="flex items-center">
        {SCOPE_ORDER.map((scope, index) => {
          const reached = index <= current;
          const isCurrent = index === current;
          const Icon = meta[scope].icon;
          return (
            <Fragment key={scope}>
              <button
                onClick={() => handleSelect(scope)}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'group flex flex-col items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                  !isCurrent && 'hover:bg-gray-50',
                )}
              >
                <motion.span
                  animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                    reached
                      ? 'border-transparent text-white'
                      : 'border-gray-200 bg-white text-gray-300 group-hover:border-gray-300',
                    reached && meta[scope].dot,
                  )}
                >
                  {index < current ? <Check className="w-4 h-4" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                </motion.span>
                <span
                  className={cn(
                    'text-xs font-medium text-center leading-tight max-w-[5.5rem]',
                    isCurrent ? 'text-gray-900' : reached ? 'text-gray-600' : 'text-gray-400',
                  )}
                >
                  {meta[scope].label}
                </span>
              </button>
              {index < SCOPE_ORDER.length - 1 && (
                <div className="flex-1 h-0.5 mx-1 rounded-full bg-gray-100 overflow-hidden">
                  <motion.div
                    initial={false}
                    animate={{ width: index < current ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#ED1C24] to-[#F26522]"
                  />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-start gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0 mt-0.5">
          Now
        </span>
        <p className="text-sm text-gray-700">{meta[item.publishScope].who}</p>
      </div>

      {/* Blocked from publishing — say why, and offer the way out. A bare
          disabled button would leave the reason undiscoverable. */}
      {!gate.ok && nextScope && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <TriangleAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-900 flex-1">{gate.reason}</p>
          {onReviewSummary && (
            <Button variant="outline" size="sm" onClick={onReviewSummary} className="shrink-0">
              Review the summary
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextScope && (
          <Button
            variant="gradient"
            size="sm"
            aria-disabled={!gate.ok}
            title={gate.ok ? undefined : gate.reason}
            className={cn(!gate.ok && 'opacity-40 cursor-not-allowed')}
            onClick={() => handleSelect(nextScope)}
          >
            Publish to {meta[nextScope].label.toLowerCase()}
            <ChevronRight className="w-4 h-4" />
          </Button>
        )}
        {item.publishScope !== 'private' && (
          <Button variant="outline" size="sm" onClick={() => onChange('private')}>
            <Lock className="w-4 h-4" />
            Pull back to private
          </Button>
        )}
      </div>

      <DualControlDialog
        item={item}
        targetScope={pendingScope}
        onCancel={() => setPendingScope(null)}
        onConfirm={(scope) => {
          setPendingScope(null);
          onChange(scope);
        }}
      />
    </div>
  );
}

export const scopeWho = (scope: PublishScope) => meta[scope].who;
