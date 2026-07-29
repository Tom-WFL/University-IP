import { useEffect, useState } from 'react';
import { CalendarDays, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useStore } from '@/data/store';
import { cn, formatDate } from '@/lib/utils';

/**
 * The IP -> I-Corps handoff. This is deliberately the ONLY I-Corps surface in
 * the prototype: managing cohorts is a separate build. All this does is submit
 * the formed team's application and record it.
 */
export function SendToCohortDialog({
  teamId,
  onClose,
}: {
  teamId: string | null;
  onClose: () => void;
}) {
  const cohorts = useStore((s) => s.cohorts);
  const teams = useStore((s) => s.teams);
  const users = useStore((s) => s.users);
  const sendTeamToCohort = useStore((s) => s.sendTeamToCohort);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (teamId) setSelected(cohorts[0]?.id ?? null);
  }, [teamId, cohorts]);

  const team = teams.find((t) => t.id === teamId);

  return (
    <Dialog open={Boolean(teamId)} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send this team to I-Corps</DialogTitle>
          <DialogDescription>
            {team ? (
              <>
                <span className="font-medium text-gray-700">{team.name}</span> —{' '}
                {team.memberIds.map((id) => users.find((u) => u.id === id)?.name).filter(Boolean).join(', ')}
              </>
            ) : (
              'Choose a cohort.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {cohorts.map((cohort) => {
            const active = selected === cohort.id;
            return (
              <button
                key={cohort.id}
                onClick={() => setSelected(cohort.id)}
                aria-pressed={active}
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition-colors flex items-start gap-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                  active ? 'border-[#ED1C24] bg-orange-50/60' : 'border-gray-200 hover:bg-gray-50',
                )}
              >
                <div
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                    active ? 'bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white' : 'bg-gray-100 text-gray-500',
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">{cohort.name}</p>
                  <p className="text-xs text-gray-500">
                    {cohort.host} · starts {formatDate(cohort.startsOn)} · applications close{' '}
                    {formatDate(cohort.applicationsCloseOn)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-xs text-gray-400">
          This submits the application and hands off. Running the cohort itself lives in the I-Corps module.
        </p>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gradient"
            disabled={!selected || !teamId}
            onClick={() => {
              if (teamId && selected) sendTeamToCohort(teamId, selected);
              onClose();
            }}
          >
            <Send className="w-4 h-4" />
            Submit application
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
