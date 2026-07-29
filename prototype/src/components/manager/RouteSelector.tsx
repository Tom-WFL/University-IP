import { Hand, Rocket, Trophy } from 'lucide-react';
import type { Route } from '@/data/types';
import { cn } from '@/lib/utils';

const options: Array<{ value: Exclude<Route, 'undecided'>; label: string; body: string; icon: typeof Rocket }> = [
  {
    value: 'founder',
    label: 'Founder',
    body: 'The professor wants to build it. They run the normal Wildfire founder process.',
    icon: Rocket,
  },
  {
    value: 'hackathon',
    label: 'Hackathon',
    body: 'Good weekend-sized challenge. Teams can pick it up at an event.',
    icon: Trophy,
  },
  {
    value: 'founder_match',
    label: 'Founder Match',
    body: "Nobody in-house will build it. Publish it and let founders raise a hand.",
    icon: Hand,
  },
];

/** AXIS 2 — what happens to this IP next. Independent of who can see it. */
export function RouteSelector({ route, onChange }: { route: Route; onChange: (route: Route) => void }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">What happens next</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Pick the route after you have talked to the inventor.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((option) => {
          const Icon = option.icon;
          const active = route === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              aria-pressed={active}
              className={cn(
                'text-left rounded-xl border p-4 transition-all duration-200',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                active
                  ? 'border-[#ED1C24] bg-orange-50/60 shadow-sm'
                  : 'border-gray-200 bg-white hover:shadow-md hover:-translate-y-0.5',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                  active ? 'bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white' : 'bg-gray-100 text-gray-500',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-900">{option.label}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{option.body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
