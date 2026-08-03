import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
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

/** Sends "/" to whichever home matches the current persona. */
function PersonaLanding() {
  const user = useCurrentUser();
  return <Navigate to={personaHome[user.persona]} replace />;
}

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

          {/* IP Manager */}
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

          {/* Founder / student */}
          <Route path="/home" element={<FounderHome />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/discover/:ipId" element={<IpPublicDetail />} />
          <Route path="/hackathons" element={<Hackathons />} />
          <Route path="/cohorts" element={<Cohorts />} />
          <Route path="/my-team" element={<MyTeam />} />

          {/* Professor + Wildfire admin */}
          <Route path="/professor" element={<ProfessorView />} />
          <Route path="/admin" element={<SuperAdmin />} />
          <Route path="/insights" element={<Insights />} />

          <Route path="*" element={<PersonaLanding />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
