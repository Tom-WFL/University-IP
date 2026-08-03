import { NavLink } from 'react-router-dom';
import { Flame, X } from 'lucide-react';
import { navByPersona, personaHome } from './nav';
import { useCurrentUser, useStore } from '@/data/store';
import { cn } from '@/lib/utils';

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const user = useCurrentUser();
  const handRaises = useStore((s) => s.handRaises);
  const ipItems = useStore((s) => s.ipItems);
  const activeUniversityId = useStore((s) => s.activeUniversityId);
  const users = useStore((s) => s.users);

  const pendingHandRaises = handRaises.filter((hr) => {
    if (hr.status !== 'pending') return false;
    const item = ipItems.find((i) => i.id === hr.ipItemId);
    return item?.universityId === activeUniversityId;
  }).length;

  const myHandRaises = handRaises.filter((hr) => hr.userId === user.id && hr.status === 'pending').length;

  const pendingLeads = users.filter((u) => u.status === 'pending_review').length;

  const counts = { pendingHandRaises, myHandRaises, pendingLeads };

  return (
    <nav className="px-4 space-y-1">
      {navByPersona[user.persona].map((item) => {
        const badge = item.badgeKey ? counts[item.badgeKey] : 0;
        return (
          <NavLink
            key={item.to}
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
