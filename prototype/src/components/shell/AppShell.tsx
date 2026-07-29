import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, SidebarDrawer } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);

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
