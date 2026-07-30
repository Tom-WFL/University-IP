import * as React from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { DemoStoreProvider, useDemo } from '@/store/DemoStore';
import { HOME_ROUTE, resolvePersonaId } from '@/store/personas';
import { AppShell } from '@/components/layout/AppShell';
import { Toaster } from '@/components/ui/toaster';
import type { PersonaId } from '@/store/types';

import Welcome from '@/pages/public/Welcome';
import Signup from '@/pages/public/Signup';
import Discover from '@/pages/founder/Discover';
import IpDetailFounder from '@/pages/founder/IpDetailFounder';
import MyHandRaises from '@/pages/founder/MyHandRaises';
import Journey from '@/pages/founder/Journey';
import Portfolio from '@/pages/manager/Portfolio';
import IpDetailManager from '@/pages/manager/IpDetailManager';
import ImportWizard from '@/pages/manager/ImportWizard';
import HandRaiseQueue from '@/pages/manager/HandRaiseQueue';
import InstitutionSettings from '@/pages/manager/InstitutionSettings';
import LeadershipDashboard from '@/pages/leadership/Dashboard';

/** Lets a demo link pin the starting role: ?role=kirby, ?role=founder, ?role=leadership. */
function RoleParamBoot() {
  const { setPersona } = useDemo();
  const location = useLocation();
  const navigate = useNavigate();
  const applied = React.useRef(false);

  React.useEffect(() => {
    if (applied.current) return;
    const fromSearch = new URLSearchParams(window.location.search).get('role');
    const fromHash = new URLSearchParams(location.search).get('role');
    const id = resolvePersonaId(fromHash ?? fromSearch);
    applied.current = true;
    if (!id) return;

    setPersona(id);
    if (fromSearch) {
      const url = new URL(window.location.href);
      url.searchParams.delete('role');
      window.history.replaceState({}, '', url.toString());
    }
    if (fromHash) {
      const next = new URLSearchParams(location.search);
      next.delete('role');
      navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
    } else if (location.pathname === '/') {
      navigate(HOME_ROUTE[id], { replace: true });
    }
  }, [location, navigate, setPersona]);

  return null;
}

/** Keeps a persona out of another role's screens rather than rendering an empty page. */
function PersonaGate({ allow, children }: { allow: PersonaId[]; children: React.ReactNode }) {
  const { persona } = useDemo();
  if (!allow.includes(persona.id)) return <Navigate to={HOME_ROUTE[persona.id]} replace />;
  return <>{children}</>;
}

function PersonaHome() {
  const { persona } = useDemo();
  return <Navigate to={HOME_ROUTE[persona.id]} replace />;
}

const MANAGERS: PersonaId[] = ['manager-usd', 'manager-mines'];

function AppRoutes() {
  return (
    <>
      <RoleParamBoot />
      <Routes>
        <Route path="/" element={<PersonaHome />} />
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<AppShell />}>
          <Route
            path="/founder"
            element={
              <PersonaGate allow={['founder']}>
                <Discover />
              </PersonaGate>
            }
          />
          <Route
            path="/founder/ip/:id"
            element={
              <PersonaGate allow={['founder']}>
                <IpDetailFounder />
              </PersonaGate>
            }
          />
          <Route
            path="/founder/hand-raises"
            element={
              <PersonaGate allow={['founder']}>
                <MyHandRaises />
              </PersonaGate>
            }
          />
          <Route
            path="/founder/journey"
            element={
              <PersonaGate allow={['founder']}>
                <Journey />
              </PersonaGate>
            }
          />

          <Route
            path="/manager"
            element={
              <PersonaGate allow={MANAGERS}>
                <Portfolio />
              </PersonaGate>
            }
          />
          <Route
            path="/manager/ip/:id"
            element={
              <PersonaGate allow={MANAGERS}>
                <IpDetailManager />
              </PersonaGate>
            }
          />
          <Route
            path="/manager/import"
            element={
              <PersonaGate allow={MANAGERS}>
                <ImportWizard />
              </PersonaGate>
            }
          />
          <Route
            path="/manager/hand-raises"
            element={
              <PersonaGate allow={MANAGERS}>
                <HandRaiseQueue />
              </PersonaGate>
            }
          />
          <Route
            path="/manager/settings"
            element={
              <PersonaGate allow={MANAGERS}>
                <InstitutionSettings />
              </PersonaGate>
            }
          />

          <Route
            path="/leadership"
            element={
              <PersonaGate allow={['leadership']}>
                <LeadershipDashboard />
              </PersonaGate>
            }
          />
        </Route>

        <Route path="*" element={<PersonaHome />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <DemoStoreProvider>
      <HashRouter>
        <AppRoutes />
        <Toaster />
      </HashRouter>
    </DemoStoreProvider>
  );
}
