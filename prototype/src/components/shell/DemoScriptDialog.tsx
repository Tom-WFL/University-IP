import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const steps = [
  {
    persona: 'Wildfire Super Admin',
    action: 'Provision South Dakota Mines and assign its IP Manager.',
    why: 'Each university is its own tenant; the IP Manager only ever sees their own school.',
  },
  {
    persona: 'IP Manager',
    action: 'Import a disclosure spreadsheet (or add one by hand).',
    why: 'Every row lands PRIVATE. Nothing is visible to anyone until it is deliberately published.',
  },
  {
    persona: 'IP Manager',
    action: 'Open an item and walk the publish scope: private → campus → statewide → national.',
    why: 'Widening the scope requires dual control — two explicit confirmations — and only the non-confidential summary ever goes out.',
  },
  {
    persona: 'IP Manager',
    action: 'Set the route: Founder, Hackathon, or Founder Match.',
    why: 'Scope is who can see it. Route is what happens next. Two separate axes.',
  },
  {
    persona: 'Founder / Student',
    action: 'Find the IP on the home page or in Discover, and raise a hand.',
    why: 'One home page: their IP, their hackathons, their I-Corps status, and everything they can discover.',
  },
  {
    persona: 'IP Manager',
    action: 'Review the hand-raise and approve it.',
    why: 'A team forms on the spot — professor included if they stayed attached.',
  },
  {
    persona: 'IP Manager',
    action: 'Send the new team to the next I-Corps cohort.',
    why: 'The handoff that was missing: IP → team → cohort, without re-entering anything.',
  },
  {
    persona: 'Anyone',
    action: 'Open the audit trail.',
    why: 'Every import, publish, route change, and match decision is recorded with who and when.',
  },
];

export function DemoScriptDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>How to demo this</DialogTitle>
          <DialogDescription>
            The golden path, in order. Switch personas from the avatar menu in the top right.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-3">
          {steps.map((step, i) => (
            <li key={step.action} className="flex gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white text-xs font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-semibold">{step.persona}:</span> {step.action}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{step.why}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-3">
          All data here is synthetic. State lives in your browser — use “Reset demo data” in the avatar
          menu to start clean.
        </p>
      </DialogContent>
    </Dialog>
  );
}
