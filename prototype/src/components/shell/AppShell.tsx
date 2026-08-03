import { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Sidebar, SidebarDrawer } from './Sidebar';
import { TopBar } from './TopBar';
import { useStore } from '@/data/store';

/**
 * Everything inside this shell needs an account.
 *
 * That is the stakeholder rule — "you always have to create an account before
 * you can actually see the ideas" — and it holds for the whole in-app
 * catalogue. The public marketing surface lives outside the shell precisely so
 * this gate can be unconditional here.
 */
export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const signedIn = useStore((s) => s.signedIn);

  if (!signedIn) return <Navigate to="/signup" replace />;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <SidebarDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar onOpenNav={() => setNavOpen(true)} />
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
