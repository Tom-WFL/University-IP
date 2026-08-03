import { Fragment, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, ChevronRight, Lock, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DualControlDialog } from './DualControlDialog';
import { PullBackDialog } from './PullBackDialog';
import { scopeIcon } from '@/components/shared/chips';
import { SCOPES, SCOPE_ORDER, scopeRank, scopesSkipped } from '@/data/scopes';
import { canPublish } from '@/data/store';
import type { IpItem, PublishScope, RedactionCriterion } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * The publish-scope journey — AXIS 1.
 *
 * Any tier is reachable in one action: an IP manager who already knows a
 * disclosure belongs on the national network should not have to walk it up
 * three times. The rail has always permitted that, but it looked like an inert
 * progress bar, so nobody found it — this version says so out loud and gives
 * every node a real affordance.
 *
 * Widening always goes through dual control. Narrowing is immediate, because
 * pulling something back should never be harder than putting it out — with one
 * exception, coming back from `public`, where the honest answer is that
 * un-publishing does not un-index.
 */
export function ScopeStepper({
  item,
  policy,
  onChange,
  onReviewSummary,
}: {
  item: IpItem;
  /** The owning university's release criteria — part of the gate. */
  policy: RedactionCriterion[];
  onChange: (scope: PublishScope) => void;
  /** Jump the user to the summary so they can clear the block. */
  onReviewSummary?: () => void;
}) {
  const [pendingScope, setPendingScope] = useState<PublishScope | null>(null);
  const [pendingPullBack, setPendingPullBack] = useState<PublishScope | null>(null);
  const current = scopeRank(item.publishScope);
  const gate = canPublish(item, policy);

  const handleSelect = (scope: PublishScope) => {
    if (scope === item.publishScope) return;
    if (scopeRank(scope) > current) {
      // Widening. If the summary hasn't been read by a human, we never even
      // reach dual control — there is nothing to consent to yet.
      if (!gate.ok) return;
      setPendingScope(scope);
    } else if (item.publishScope === 'public') {
      // Coming down off the open internet. The item stops being served, but
      // search engines and archives already have it, and saying so once is
      // worth more than making the click fast.
      setPendingPullBack(scope);
    } else {
      onChange(scope);
    }
  };

  const nextScope = SCOPE_ORDER[current + 1];
  const wider = SCOPE_ORDER.filter((s) => scopeRank(s) > current);
  const narrower = SCOPE_ORDER.filter((s) => scopeRank(s) < current);

  /**
   * Accessible names are deliberately NOT "Publish to …".
   *
   * The primary button below owns that phrasing, and the walkthrough suites
   * resolve it with an unanchored `getByRole('button', { name: /Publish to/ })`.
   * Two elements answering to the same name would make that ambiguous, so the
   * rail speaks in widen/restrict terms instead. Each name still contains the
   * visible label, which WCAG 2.5.3 requires.
   */
  const nodeLabel = (scope: PublishScope) => {
    const { label } = SCOPES[scope];
    if (scope === item.publishScope) return `${label} — current level`;
    return scopeRank(scope) > current ? `Widen to ${label}` : `Restrict to ${label}`;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Who can see this</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Publishing shares the non-confidential summary only — never the confidential disclosure.
        </p>
      </div>

      {/* The journey rail. Every node is selectable, not just the next one. */}
      <div className="flex items-center">
        {SCOPE_ORDER.map((scope, index) => {
          const reached = index <= current;
          const isCurrent = index === current;
          const widening = index > current;
          // Blocked targets stay clickable to the accessibility tree and to a
          // forced click — `handleSelect` is the real refusal. A native
          // `disabled` would make the button unclickable and hide the reason.
          const blocked = widening && !gate.ok;
          const Icon = scopeIcon(scope);
          return (
            <Fragment key={scope}>
              <button
                onClick={() => handleSelect(scope)}
                aria-current={isCurrent ? 'step' : undefined}
                aria-disabled={blocked || isCurrent}
                aria-label={nodeLabel(scope)}
                title={blocked ? gate.reason : SCOPES[scope].who}
                className={cn(
                  'group flex flex-col items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                  isCurrent && 'cursor-default',
                  !isCurrent && !blocked && 'cursor-pointer hover:bg-gray-50',
                  blocked && 'cursor-not-allowed opacity-40',
                )}
              >
                <motion.span
                  animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors',
                    reached
                      ? 'border-transparent text-white'
                      : 'border-gray-200 bg-white text-gray-300',
                    reached && SCOPES[scope].fill,
                    // Only offer the hover cue where clicking would do something.
                    !isCurrent && !blocked && !reached && 'group-hover:border-[#ED1C24] group-hover:text-[#ED1C24]',
                    !isCurrent && !blocked && reached && 'group-hover:ring-2 group-hover:ring-offset-1 group-hover:ring-gray-300',
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
                  {SCOPES[scope].label}
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

      {/* The instruction IS the feature — the rail was already clickable and
          nobody found it. */}
      {wider.length > 0 && (
        <p className="text-xs text-gray-500 text-center">
          Pick any level to go straight there. You do not have to step through them one at a time.
        </p>
      )}

      <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex items-start gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 shrink-0 mt-0.5">
          Now
        </span>
        <p className="text-sm text-gray-700">{SCOPES[item.publishScope].who}</p>
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

      <div className="flex flex-wrap items-center gap-2">
        {nextScope && (
          // Split button: the one-step publish stays the default action, with
          // every other level one click away in the menu beside it.
          <div className="inline-flex">
            <Button
              variant="gradient"
              size="sm"
              aria-disabled={!gate.ok}
              title={gate.ok ? undefined : gate.reason}
              className={cn('rounded-r-none', !gate.ok && 'opacity-40 cursor-not-allowed')}
              onClick={() => handleSelect(nextScope)}
            >
              Publish to {SCOPES[nextScope].label.toLowerCase()}
              <ChevronRight className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="gradient"
                  size="sm"
                  aria-label="Choose a different level"
                  title="Choose a different level"
                  className={cn(
                    'rounded-l-none border-l border-white/25 px-2',
                    !gate.ok && 'opacity-40',
                  )}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80">
                <DropdownMenuLabel>Publish straight to</DropdownMenuLabel>
                {wider.map((scope) => {
                  const skipped = scopesSkipped(item.publishScope, scope);
                  return (
                    <DropdownMenuItem
                      key={scope}
                      disabled={!gate.ok}
                      onSelect={() => handleSelect(scope)}
                      className="items-start"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-gray-900">
                          {SCOPES[scope].label}
                          {skipped.length > 0 && (
                            <span className="font-normal text-gray-400">
                              {' '}
                              · skips {skipped.length} step{skipped.length === 1 ? '' : 's'}
                            </span>
                          )}
                        </span>
                        <span className="block text-xs text-gray-500 whitespace-normal">
                          {SCOPES[scope].who}
                        </span>
                      </span>
                    </DropdownMenuItem>
                  );
                })}
                {narrower.length > 0 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Pull back to</DropdownMenuLabel>
                    {narrower.map((scope) => (
                      <DropdownMenuItem key={scope} onSelect={() => handleSelect(scope)}>
                        <Lock className="w-4 h-4 text-gray-400" />
                        {SCOPES[scope].label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        {item.publishScope !== 'private' && (
          <Button variant="outline" size="sm" onClick={() => handleSelect('private')}>
            <Lock className="w-4 h-4" />
            Pull back to private
          </Button>
        )}
      </div>

      <DualControlDialog
        item={item}
        policy={policy}
        targetScope={pendingScope}
        onCancel={() => setPendingScope(null)}
        onConfirm={(scope) => {
          setPendingScope(null);
          onChange(scope);
        }}
      />

      <PullBackDialog
        item={item}
        targetScope={pendingPullBack}
        onCancel={() => setPendingPullBack(null)}
        onConfirm={(scope) => {
          setPendingPullBack(null);
          onChange(scope);
        }}
      />
    </div>
  );
}
