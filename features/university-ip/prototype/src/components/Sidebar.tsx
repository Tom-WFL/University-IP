import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

export interface Persona {
  name: string;
  detail: string;
}

/* Left sidebar: wordmark, per-role nav, and the demo role switcher tucked
   into the footer as a labeled demo control. */
export default function Sidebar({
  items, active, onNav, persona, roles, role, onRole,
}: {
  items: NavItem[];
  active: string;
  onNav: (key: string) => void;
  persona: Persona;
  roles: string[];
  role: string;
  onRole: (r: string) => void;
}) {
  const initials = persona.name
    .split(/\s+/)
    .map((n) => n[0])
    .filter((c) => /[A-Z]/i.test(c ?? ""))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Wordmark */}
      <div className="flex items-center gap-2.5 px-4 pt-5 pb-4">
        <img src="/assets/wildfire-logo.png" alt="" className="h-7 w-auto" />
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-foreground">Wildfire Labs</p>
          <p className="text-[11px] text-muted-foreground">University IP</p>
        </div>
      </div>

      {/* Persona */}
      <div className="mx-3 mb-3 flex items-center gap-2.5 rounded-lg border border-sidebar-border bg-card px-2.5 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-foreground/70">
          {initials}
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-medium text-foreground">{persona.name}</p>
          <p className="truncate text-[11px] text-muted-foreground" title={persona.detail}>{persona.detail}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 px-3">
        {items.map((item) => {
          const isActive = item.key === active;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              onClick={() => onNav(item.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                isActive
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[11px] tabular-nums",
                    isActive ? "bg-primary/15 text-primary" : "bg-sidebar-accent text-muted-foreground"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Demo control */}
      <div className="border-t border-sidebar-border px-4 py-3.5">
        <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Demo control · view as
        </p>
        <Select value={role} onValueChange={onRole}>
          <SelectTrigger className="h-8 bg-card text-xs" aria-label="View as role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r} value={r} className="text-xs">
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="mt-2 text-[10px] leading-snug text-muted-foreground/70">
          Prototype — client state only, nothing persists.
        </p>
      </div>
    </aside>
  );
}
