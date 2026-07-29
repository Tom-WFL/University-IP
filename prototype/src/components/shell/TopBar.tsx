import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Building2, ChevronDown, Menu, PlayCircle, RotateCcw, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheck,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useStore } from '@/data/store';
import { personaHome, personaLabel } from './nav';
import { DemoScriptDialog } from './DemoScriptDialog';
import { initials } from '@/lib/utils';

/**
 * Slim top bar. Auth is replaced by a persona switcher so the whole flow can
 * be demoed in one browser — the switcher is explicitly labelled as a demo
 * control so nobody mistakes it for a product feature.
 */
export function TopBar({ onOpenNav }: { onOpenNav: () => void }) {
  const navigate = useNavigate();
  const user = useCurrentUser();
  const users = useStore((s) => s.users);
  const universities = useStore((s) => s.universities);
  const activeUniversityId = useStore((s) => s.activeUniversityId);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const setActiveUniversity = useStore((s) => s.setActiveUniversity);
  const resetDemo = useStore((s) => s.resetDemo);
  const [scriptOpen, setScriptOpen] = useState(false);

  const activeUniversity = universities.find((u) => u.id === activeUniversityId);
  const schools = universities.filter((u) => u.kind === 'university');

  const switchTo = (userId: string) => {
    setCurrentUser(userId);
    const next = users.find((u) => u.id === userId);
    if (next) navigate(personaHome[next.persona]);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center gap-3 px-4 sm:px-6 h-14">
        <button
          onClick={onOpenNav}
          className="md:hidden p-2 -ml-2 rounded-md text-gray-600 hover:bg-gray-100"
          aria-label="Open navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* University switcher — IP managers only; mirrors HubSwitcher. */}
        {user.persona === 'ip_manager' && activeUniversity && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="truncate max-w-[10rem]">{activeUniversity.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Your universities</DropdownMenuLabel>
              {schools.map((school) => (
                <DropdownMenuItem key={school.id} onSelect={() => setActiveUniversity(school.id)}>
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {school.name}
                  <DropdownMenuCheck active={school.id === activeUniversityId} />
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setScriptOpen(true)} className="hidden sm:inline-flex">
            <PlayCircle className="w-4 h-4" />
            How to demo
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-2 rounded-lg border border-dashed border-orange-300 bg-orange-50 px-2.5 py-1.5 text-sm hover:bg-orange-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2">
                <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ED1C24] to-[#F26522] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials(user.name)}
                </span>
                <span className="hidden sm:block text-left leading-tight">
                  <span className="block text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="block text-xs text-gray-500">{personaLabel[user.persona]}</span>
                </span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="flex items-center gap-1.5">
                <UserCog className="w-3.5 h-3.5" />
                Demo — switch persona
              </DropdownMenuLabel>
              {users
                .filter((u) => u.persona !== 'professor' || u.id === 'u-prof')
                .map((u) => (
                  <DropdownMenuItem key={u.id} onSelect={() => switchTo(u.id)}>
                    <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold flex items-center justify-center shrink-0">
                      {initials(u.name)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm text-gray-900 truncate">{u.name}</span>
                      <span className="block text-xs text-gray-500 truncate">{u.title}</span>
                    </span>
                    <DropdownMenuCheck active={u.id === user.id} />
                  </DropdownMenuItem>
                ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  resetDemo();
                  navigate('/manage');
                }}
              >
                <RotateCcw className="w-4 h-4 text-gray-400" />
                Reset demo data
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScriptOpen(true)} className="sm:hidden">
                <PlayCircle className="w-4 h-4 text-gray-400" />
                How to demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DemoScriptDialog open={scriptOpen} onOpenChange={setScriptOpen} />
    </header>
  );
}
