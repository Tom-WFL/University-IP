import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { GUARDRAIL_CRITERIA } from '@/lib/guardrails';
import type { GuardrailFlag } from '@/store/types';
import { cn } from '@/lib/utils';

/**
 * UIP-10 — the criteria a summary must satisfy, plus whatever the scan caught.
 * Amol's point at the meeting was that the summary itself is the leak vector, so the
 * criteria are shown next to the text rather than buried in a settings page.
 */
export function GuardrailPanel({ flags }: { flags: GuardrailFlag[] }) {
  const clear = flags.length === 0;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-900">
          <ShieldAlert className="h-4 w-4 text-gray-500" />
          Non-disclosure criteria
        </p>
        <ul className="space-y-1 text-xs text-gray-600">
          {GUARDRAIL_CRITERIA.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          Placeholder criteria — the real list has to come from the universities.
        </p>
      </div>

      {clear ? (
        <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
          No flagged phrases in this summary.
        </div>
      ) : (
        <div className="space-y-2">
          {flags.map((f, i) => (
            <div
              key={i}
              className={cn(
                'rounded-md border p-3',
                f.severity === 'block' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50',
              )}
            >
              <p
                className={cn(
                  'flex items-center gap-2 text-xs font-semibold',
                  f.severity === 'block' ? 'text-red-900' : 'text-yellow-900',
                )}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                {f.criterion}
              </p>
              <p className={cn('mt-1 text-xs italic', f.severity === 'block' ? 'text-red-800' : 'text-yellow-800')}>
                “{f.excerpt}”
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
