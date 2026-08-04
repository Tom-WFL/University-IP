import { HashRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { ManagerDashboard } from '@/pages/manager/Dashboard';
import { IpConsole } from '@/pages/manager/IpConsole';
import { IpDetail } from '@/pages/manager/IpDetail';
import { ImportIp } from '@/pages/manager/ImportIp';
import { PolicyPage } from '@/pages/manager/PolicyPage';
import { Leads } from '@/pages/manager/Leads';
import { EditIp } from '@/pages/manager/EditIp';
import { HandRaises } from '@/pages/manager/HandRaises';
import { Teams } from '@/pages/manager/Teams';
import { AuditPage } from '@/pages/manager/AuditPage';
import { FounderHome } from '@/pages/founder/FounderHome';
import { Discover } from '@/pages/founder/Discover';
import { IpPublicDetail } from '@/pages/founder/IpPublicDetail';
import { Hackathons } from '@/pages/founder/Hackathons';
import { Cohorts } from '@/pages/founder/Cohorts';
import { MyTeam } from '@/pages/founder/MyTeam';
import { ProfessorView } from '@/pages/ProfessorView';
import { SuperAdmin } from '@/pages/SuperAdmin';
import { Insights } from '@/pages/leadership/Insights';
import { MarketingLayout } from '@/pages/marketing/MarketingLayout';
import { MarketingCatalog } from '@/pages/marketing/MarketingCatalog';
import { MarketingIpDetail } from '@/pages/marketing/MarketingIpDetail';
import { Signup } from '@/pages/auth/Signup';
import { personaHome } from '@/components/shell/nav';
import { useCurrentUser } from '@/data/store';
import { MANAGER_PERSONAS } from '@/lib/permissions';
import type { PersonaKind } from '@/data/types';

/** Sends "/" to whichever home matches the current persona. */
function PersonaLanding() {
  const user = useCurrentUser();
  return <Navigate to={personaHome[user.persona]} replace />;
}

/**
 * Route-level persona guard.
 *
 * The nav already hides what a persona shouldn't reach, but hiding a link is
 * not a permission. Leadership is the case that makes this matter: the whole
 * point of the role is that it cannot change anything, and a VP who pastes a
 * `/manage/ip/...` URL should land back on their own view rather than on an
 * edit form. Sends anyone out of place to their own home.
 */
function RequirePersona({
  allow,
  children,
}: {
  allow: PersonaKind[];
  children: React.ReactNode;
}) {
  const user = useCurrentUser();
  if (!allow.includes(user.persona)) return <Navigate to={personaHome[user.persona]} replace />;
  return <>{children}</>;
}

// One definition, shared with the university switcher, so what the routes
// allow and what the chrome offers cannot drift apart.
const MANAGER_ONLY = MANAGER_PERSONAS;

export default function App() {
  return (
    // HashRouter so the built prototype works from a plain static file/preview
    // without server-side rewrite rules.
    <HashRouter>
      <Routes>
        {/* Public — no account, no app chrome. */}
        <Route element={<MarketingLayout />}>
          <Route path="/m" element={<MarketingCatalog />} />
          <Route path="/m/ip/:ipId" element={<MarketingIpDetail />} />
        </Route>
        <Route path="/signup" element={<Signup />} />

        {/* Everything below here requires an account. */}
        <Route element={<AppShell />}>
          <Route path="/" element={<PersonaLanding />} />

          {/* IP Manager — everything that can change the portfolio. */}
          <Route
            element={
              <RequirePersona allow={MANAGER_ONLY}>
                <Outlet />
              </RequirePersona>
            }
          >
            <Route path="/manage" element={<ManagerDashboard />} />
            <Route path="/manage/ip" element={<IpConsole />} />
            <Route path="/manage/ip/:ipId" element={<IpDetail />} />
            <Route path="/manage/ip/:ipId/edit" element={<EditIp />} />
            <Route path="/manage/import" element={<ImportIp />} />
            <Route path="/manage/interest" element={<HandRaises />} />
            <Route path="/manage/teams" element={<Teams />} />
            <Route path="/manage/audit" element={<AuditPage />} />
            <Route path="/manage/policy" element={<PolicyPage />} />
            <Route path="/manage/leads" element={<Leads />} />
          </Route>

          {/* Founder / student */}
          <Route
            element={
              <RequirePersona allow={['founder', 'super_admin']}>
                <Outlet />
              </RequirePersona>
            }
          >
            <Route path="/home" element={<FounderHome />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/:ipId" element={<IpPublicDetail />} />
            <Route path="/hackathons" element={<Hackathons />} />
            <Route path="/cohorts" element={<Cohorts />} />
            <Route path="/my-team" element={<MyTeam />} />
          </Route>

          {/* An inventor's own screen. Deliberately NOT open to the Wildfire
              admin: parity means everything an IP MANAGER can do, and this is
              not one of those things. */}
          <Route
            path="/professor"
            element={
              <RequirePersona allow={['professor']}>
                <ProfessorView />
              </RequirePersona>
            }
          />
          <Route
            path="/admin"
            element={
              <RequirePersona allow={['super_admin']}>
                <SuperAdmin />
              </RequirePersona>
            }
          />
          <Route
            path="/insights"
            element={
              <RequirePersona allow={['leadership', 'super_admin']}>
                <Insights />
              </RequirePersona>
            }
          />

          <Route path="*" element={<PersonaLanding />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
