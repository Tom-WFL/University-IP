import {
  BarChart3,
  Building2,
  CalendarDays,
  FileDown,
  FlaskConical,
  GraduationCap,
  Hand,
  Home,
  LayoutDashboard,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Search,
  Trophy,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { PersonaKind } from '@/data/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  /** Renders a count pill when there's something waiting. */
  badgeKey?: 'pendingHandRaises' | 'myHandRaises' | 'pendingLeads';
}

/**
 * Left-hand navigation, per persona. Mirrors the app's SuperAdminSidebar
 * shape (w-64, bg-white, border-r, active = bg-red-50 text-red-700).
 */
export const navByPersona: Record<PersonaKind, NavItem[]> = {
  ip_manager: [
    { to: '/manage', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/manage/ip', label: 'IP Console', icon: FlaskConical },
    { to: '/manage/import', label: 'Import IP', icon: FileDown },
    { to: '/manage/interest', label: 'Hand-raises', icon: Hand, badgeKey: 'pendingHandRaises' },
    { to: '/manage/leads', label: 'Lead review', icon: ShieldAlert, badgeKey: 'pendingLeads' },
    { to: '/manage/teams', label: 'Teams & I-Corps', icon: Users },
    { to: '/manage/audit', label: 'Audit trail', icon: ScrollText },
    { to: '/manage/policy', label: 'Release policy', icon: ShieldCheck },
  ],
  founder: [
    { to: '/home', label: 'Home', icon: Home, exact: true },
    { to: '/discover', label: 'Discover IP', icon: Search },
    { to: '/hackathons', label: 'Hackathons', icon: Trophy },
    { to: '/cohorts', label: 'I-Corps', icon: CalendarDays },
    { to: '/my-team', label: 'My team', icon: Users },
  ],
  professor: [{ to: '/professor', label: 'My idea', icon: GraduationCap, exact: true }],
  super_admin: [{ to: '/admin', label: 'Universities', icon: Building2, exact: true }],
  // Read-only oversight. One destination, and deliberately no route that can
  // change anything — the distinction from an IP Manager IS the lack of edit.
  leadership: [{ to: '/insights', label: 'Insights', icon: BarChart3, exact: true }],
};

export const personaHome: Record<PersonaKind, string> = {
  ip_manager: '/manage',
  founder: '/home',
  professor: '/professor',
  super_admin: '/admin',
  leadership: '/insights',
};

export const personaLabel: Record<PersonaKind, string> = {
  ip_manager: 'IP Manager',
  founder: 'Founder / Student',
  professor: 'Professor',
  super_admin: 'Wildfire Super Admin',
  leadership: 'University Leadership',
};
