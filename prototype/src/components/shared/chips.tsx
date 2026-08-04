import { Building2, Globe, Landmark, Lock, Radio, School, UserCheck, UserMinus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SCOPES } from '@/data/scopes';
import type { FacultyAttachment, Ownership, PublishScope, Route } from '@/data/types';
import { cn } from '@/lib/utils';

/**
 * Chip shape copied from the app's StatusBadge:
 * bg-X-100 text-X-700 border-X-200, rounded-full, text-xs font-medium.
 */
const base =
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap';

export function Chip({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <span className={cn(base, className)}>{children}</span>;
}

// --- Axis 1: publish scope -------------------------------------------------

/**
 * Icons live here rather than in `@/data/scopes` so the data layer stays free
 * of lucide — `store.ts` imports the ladder from there and has no business
 * pulling in an icon library. Everything else about a scope comes from SCOPES.
 */
const scopeIcons: Record<PublishScope, LucideIcon> = {
  private: Lock,
  campus: School,
  statewide: Landmark,
  national: Globe,
  public: Radio,
};

export const scopeIcon = (scope: PublishScope) => scopeIcons[scope];

export function ScopeChip({ scope, showIcon = true }: { scope: PublishScope; showIcon?: boolean }) {
  const Icon = scopeIcons[scope];
  return (
    <Chip className={SCOPES[scope].chipClassName}>
      {showIcon && <Icon className="w-3 h-3" />}
      {SCOPES[scope].label}
    </Chip>
  );
}

// Re-exported so existing `from '@/components/shared/chips'` imports keep
// working; the string itself now lives with the rest of the scope copy.
export { scopeLabel } from '@/data/scopes';

// --- Which school owns it --------------------------------------------------

/**
 * Only ever rendered in the Wildfire admin's all-schools view. A manager
 * looking at their own portfolio does not need every row to repeat the name of
 * their own university, so the single-school view stays exactly as it was.
 *
 * `shortName` throughout, matching IpCard and the founder surfaces.
 */
export function SchoolChip({ university }: { university?: { shortName: string } }) {
  return (
    <Chip className="bg-slate-100 text-slate-700 border-slate-200">
      <Building2 className="w-3 h-3" />
      {university?.shortName ?? 'Unknown school'}
    </Chip>
  );
}

// --- Axis 2: route ---------------------------------------------------------

const routeStyles: Record<Route, { label: string; className: string }> = {
  undecided: { label: 'Route undecided', className: 'bg-gray-100 text-gray-600 border-gray-200' },
  founder: { label: 'Founder', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  hackathon: { label: 'Hackathon', className: 'bg-purple-100 text-purple-700 border-purple-200' },
  founder_match: { label: 'Founder Match', className: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
};

export function RouteChip({ route }: { route: Route }) {
  const r = routeStyles[route];
  return <Chip className={r.className}>{r.label}</Chip>;
}

export const routeLabel = (route: Route) => routeStyles[route].label;

// --- Ownership (approved recommendation R4) --------------------------------

const ownershipStyles: Record<Ownership, { label: string; className: string; help: string }> = {
  bor: {
    label: 'BOR-owned',
    className: 'bg-slate-100 text-slate-700 border-slate-200',
    help: 'Owned by the Board of Regents. Publishing must comply with BOR 491.',
  },
  student: {
    label: 'Student-owned',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    help: 'Created in a course project — the student owns this IP and decides on any disclosure.',
  },
  entangled: {
    label: 'Entangled',
    className: 'bg-rose-100 text-rose-700 border-rose-200',
    help: 'Faculty and student contributions are mixed — ownership needs resolving before publishing.',
  },
};

export function OwnershipChip({ ownership }: { ownership: Ownership }) {
  const o = ownershipStyles[ownership];
  return (
    <Chip className={o.className}>
      <span title={o.help}>{o.label}</span>
    </Chip>
  );
}

export const ownershipHelp = (o: Ownership) => ownershipStyles[o].help;
export const ownershipLabel = (o: Ownership) => ownershipStyles[o].label;

// --- Faculty attachment ----------------------------------------------------

export function FacultyChip({ attachment }: { attachment: FacultyAttachment }) {
  return attachment === 'attached' ? (
    <Chip className="bg-teal-100 text-teal-700 border-teal-200">
      <UserCheck className="w-3 h-3" />
      Faculty attached
    </Chip>
  ) : (
    <Chip className="bg-gray-100 text-gray-600 border-gray-200">
      <UserMinus className="w-3 h-3" />
      Idea only
    </Chip>
  );
}

// --- Generic status --------------------------------------------------------

const statusStyles: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-700 border-green-200',
  declined: 'bg-gray-100 text-gray-600 border-gray-200',
  submitted: 'bg-blue-100 text-blue-700 border-blue-200',
  accepted: 'bg-green-100 text-green-700 border-green-200',
  waitlisted: 'bg-purple-100 text-purple-700 border-purple-200',
  sent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Awaiting review',
  approved: 'Approved',
  declined: 'Declined',
  submitted: 'Submitted',
  accepted: 'Accepted',
  waitlisted: 'Waitlisted',
  sent: 'Invite sent',
};

export function StatusChip({ status }: { status: string }) {
  return (
    <Chip className={statusStyles[status] ?? 'bg-gray-100 text-gray-600 border-gray-200'}>
      {statusLabels[status] ?? status}
    </Chip>
  );
}
