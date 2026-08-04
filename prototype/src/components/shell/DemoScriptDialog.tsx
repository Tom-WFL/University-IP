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
    action: 'Read the AI-drafted summary, fix it, and tick it off against the release criteria.',
    why: 'Nothing publishes until a person has checked the draft line by line. One seeded draft leaks a confidential phrase on purpose — find it.',
  },
  {
    persona: 'IP Manager',
    action: 'Publish straight to the national network — click that circle, do not step through.',
    why: 'Any level is one click away. The confirmation names the levels you went past and explains what you gave up: not the audiences (a wider level contains the narrower ones) but the chance to see how it lands before opening it further.',
  },
  {
    persona: 'IP Manager',
    action: 'In the IP Console, tick several disclosures and publish them together.',
    why: 'Anything not ready is held back and named rather than dragged along — the review gate is per disclosure and is never averaged across a selection.',
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
  {
    persona: 'Visitor',
    action: 'Choose “View as a visitor” and browse the public catalogue.',
    why: 'Only items pushed all the way to public are out here. Everything else is invisible without an account — that is the rule, not a setting.',
  },
  {
    persona: 'Visitor',
    action: 'Sign up from one of them.',
    why: 'The disclosure you clicked follows you through signup, so you land on it already connected to the right IP Manager.',
  },
  {
    persona: 'IP Manager',
    action: 'Open Lead review.',
    why: 'Signups that look automated or empty are held before they can approach the university, with the reasons shown. Sign up with a throwaway address and a one-word answer to see one land here.',
  },
  {
    persona: 'Wildfire Super Admin',
    action: 'Switch to the admin, then use the school switcher to act for USD — which has no IP Manager.',
    why: 'The admin has the whole IP-office toolkit for any school, plus an "All universities" view. Whatever they change is badged in that school\'s audit trail as Wildfire acting on their behalf.',
  },
  {
    persona: 'University Leadership',
    action: 'Switch to the VP for Research and read Insights.',
    why: 'The portfolio by scope and department, the pipeline through to an I-Corps cohort, and what has stopped moving. Read-only: no buttons, and every manager URL bounces back.',
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
