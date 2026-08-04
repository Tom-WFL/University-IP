import { Fragment } from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, X } from 'lucide-react';
import { navByPersona, personaHome } from './nav';
import type { NavItem } from './nav';
import { leadsForUniversity, useActiveUniversity, useCurrentUser, useStore, useUniversityScope } from '@/data/store';
import { cn } from '@/lib/utils';

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const handRaises = useStore((s) => s.handRaises);
  const ipItems = useStore((s) => s.ipItems);
  const users = useStore((s) => s.users);
  const scope = useUniversityScope();
  const activeUniversity = useActiveUniversity();

  const pendingHandRaises = handRaises.filter((hr) => {
    if (hr.status !== 'pending') return false;
    const item = ipItems.find((i) => i.id === hr.ipItemId);
    return scope.matches(item?.universityId);
  }).length;

  const myHandRaises = handRaises.filter((hr) => hr.userId === user.id && hr.status === 'pending').length;

  // Scoped the same way the Leads page scopes itself. These two used to
  // disagree — the badge counted every held signup on the platform while the
  // queue showed only this school's, so the number never matched the list.
  const pendingLeads = leadsForUniversity({ users, ipItems }, scope).waiting.length;

  const counts = { pendingHandRaises, myHandRaises, pendingLeads };

  const items = navByPersona[user.persona];
  // Headings only earn their place when there is more than one group. A
  // single-purpose nav (leadership, professor) stays a plain list of links.
  const sectioned = new Set(items.map((i) => i.section).filter(Boolean)).size > 1;
  const heading = (section: NavItem['section']) =>
    section === 'platform'
      ? 'Wildfire'
      : `Acting as ${activeUniversity?.shortName ?? 'a university'}`;

  return (
    <nav className="px-4 space-y-1">
      {items.map((item, index) => {
        const badge = item.badgeKey ? counts[item.badgeKey] : 0;
        const startsSection = sectioned && item.section !== items[index - 1]?.section;
        return (
          <Fragment key={item.to}>
            {startsSection && (
              <p
                className={cn(
                  'px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400',
                  index > 0 && 'pt-4',
                )}
              >
                {heading(item.section)}
              </p>
            )}
          <NavLink
            to={item.to}
            end={item.exact}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2',
                isActive ? 'bg-red-50 text-red-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span className="truncate">{item.label}</span>
            {badge > 0 && (
              <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ED1C24] px-1.5 text-xs font-semibold text-white">
                {badge}
              </span>
            )}
          </NavLink>
          </Fragment>
        );
      })}
    </nav>
  );
}

function Brand({ to }: { to: string }) {
  return (
    <NavLink to={to} className="block p-6 hover:bg-gray-50 transition-colors" aria-label="Go to home">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#ED1C24] to-[#F26522] flex items-center justify-center shrink-0">
          <Flame className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent leading-tight">
            Wildfire Labs
          </h1>
          <p className="text-xs text-gray-500 leading-tight">University IP</p>
        </div>
      </div>
    </NavLink>
  );
}

export function Sidebar() {
  const user = useCurrentUser();
  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 bg-white border-r border-gray-200">
      <Brand to={personaHome[user.persona]} />
      <NavItems />
    </aside>
  );
}

/** Mobile drawer version of the same nav. */
export function SidebarDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const user = useCurrentUser();
  if (!open) return null;
  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden />
      <div className="relative w-64 bg-white h-full shadow-xl flex flex-col">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
        <Brand to={personaHome[user.persona]} />
        <NavItems onNavigate={onClose} />
      </div>
    </div>
  );
}
