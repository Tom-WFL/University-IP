import * as React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Hand,
  LayoutList,
  LogOut,
  Settings,
  Sparkles,
  Upload,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDemo } from '@/store/DemoStore';
import { ViewingAsSwitcher } from './ViewingAsSwitcher';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

const MANAGER_NAV: NavItem[] = [
  { to: '/manager', label: 'IP Portfolio', icon: LayoutList, exact: true },
  { to: '/manager/hand-raises', label: 'Hand Raises', icon: Hand },
  { to: '/manager/import', label: 'Import IP', icon: Upload },
  { to: '/manager/settings', label: 'Institution Settings', icon: Settings },
];

const FOUNDER_NAV: NavItem[] = [
  { to: '/founder', label: 'Discover IP', icon: Sparkles, exact: true },
  { to: '/founder/hand-raises', label: 'My Hand Raises', icon: Hand },
  { to: '/founder/journey', label: 'Next Steps', icon: User },
];

const LEADERSHIP_NAV: NavItem[] = [{ to: '/leadership', label: 'Portfolio Analytics', icon: BarChart3, exact: true }];

function navFor(role: string): NavItem[] {
  if (role === 'ip_manager') return MANAGER_NAV;
  if (role === 'founder') return FOUNDER_NAV;
  if (role === 'leadership') return LEADERSHIP_NAV;
  return [];
}

function subtitleFor(role: string, institution?: string): string {
  if (role === 'ip_manager') return institution ?? 'IP Management';
  if (role === 'founder') return 'Founder';
  if (role === 'leadership') return 'Research Leadership';
  return 'University IP';
}

/** Mirrors the live app's console shell: fixed w-64 sidebar, white header bar, scrolling main. */
export function AppShell() {
  const { persona, institution, state } = useDemo();
  const location = useLocation();
  const items = navFor(persona.role);

  // Longest-prefix match, as the live app's console header does — so /manager/ip/:id still
  // titles "IP Portfolio" rather than falling through to a generic label.
  const active = items
    .filter((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const displayName = persona.id === 'founder' ? state.founderDisplayName : persona.name;

  return (
    <div className="flex h-dvh bg-gray-100">
      <aside className="relative hidden w-64 shrink-0 border-r border-gray-200 bg-white shadow-sm md:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">Wildfire Labs</h1>
          <p className="text-sm text-gray-500">{subtitleFor(persona.role, institution?.shortName)}</p>
        </div>
        <nav className="space-y-1 px-4">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-orange-50 text-orange-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white p-4">
          <p className="text-xs text-gray-400">
            Prototype — all data is fake and stored in this browser only.
          </p>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{active?.label ?? 'University IP'}</h2>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 sm:inline">
                {persona.role === 'ip_manager'
                  ? 'IP Manager'
                  : persona.role === 'leadership'
                    ? 'Leadership (read-only)'
                    : 'Founder'}
              </span>
              <span className="hidden items-center gap-1.5 text-sm text-gray-500 lg:flex">
                <User className="h-4 w-4" />
                {displayName}
              </span>
              <ViewingAsSwitcher />
              <button className="hidden text-gray-400 hover:text-gray-600 sm:block" title="Log out (prototype)">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
