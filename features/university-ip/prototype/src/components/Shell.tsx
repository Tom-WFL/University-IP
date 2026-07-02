import { ReactNode } from "react";
import { AlertTriangle, Lightbulb, Sparkles, Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

/* ── Persistent PROTOTYPE banner ─────────────────────────────────────────── */
export function PrototypeBanner() {
  return (
    <div className="w-full bg-foreground text-background text-center text-xs sm:text-sm py-2 px-4 font-medium tracking-wide">
      PROTOTYPE — not functional, for validation only. No backend; nothing persists. Not production code.
    </div>
  );
}

/* ── Wildfire brand header (flame mark + wordmark, vendored from live app) ── */
export function BrandHeader({
  roles,
  active,
  onSelect,
}: {
  roles: string[];
  active: string;
  onSelect: (r: string) => void;
}) {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-border sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src="/assets/wildfire-logo.png"
              alt="Wildfire Labs"
              className="h-8 w-auto"
            />
            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Wildfire Labs
            </h1>
            <Badge variant="outline" className="ml-1 hidden sm:inline-flex">
              University IP
            </Badge>
          </div>

          {/* Role switcher — one view per user-facing role in the intake */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden md:inline">
              View as
            </span>
            <div className="flex rounded-md border border-border overflow-hidden">
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => onSelect(r)}
                  className={cn(
                    "px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors",
                    active === r
                      ? "bg-primary text-primary-foreground"
                      : "bg-background text-muted-foreground hover:bg-accent/10"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ── Multi-university tenancy legend (confirmed gate decision) ─────────────── */
export function TenancyLegend() {
  return (
    <div className="w-full bg-slate-50 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center gap-2 text-[11px] sm:text-xs text-slate-600">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>
          <span className="font-semibold">Multi-university tenancy (confirmed):</span> each university is its own{" "}
          <span className="font-medium">organization</span> with its own IP Managers, fully isolated — an{" "}
          <span className="font-medium">IP Manager</span> cannot see other universities' IP, or the other
          universities at all. There is ONE university-side role: the VP of Research is merged into the{" "}
          <span className="font-medium">IP Manager</span>.
        </span>
      </div>
    </div>
  );
}

/* ── Page scaffold mirroring the app pattern (container → icon header) ────── */
export function PageHeader({
  icon,
  title,
  subtitle,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className="h-11 w-11 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground mt-0.5 max-w-2xl">{subtitle}</p>
      </div>
    </div>
  );
}

export function Container({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</main>
  );
}

/* ── Distinct tiers: RECOMMENDED, GAP, PARKED ─────────────────────────────── */
export function RecommendedTier({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border-2 border-dashed border-violet-400 bg-violet-50/60 p-4 my-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="h-4 w-4 text-violet-600" />
        <span className="text-xs font-bold uppercase tracking-wide text-violet-700">
          Recommended — not yet confirmed · needs PO sign-off
        </span>
        <Badge className="bg-violet-600 hover:bg-violet-600 text-white">{id}</Badge>
      </div>
      <h4 className="font-semibold text-violet-900 mb-1">{title}</h4>
      <div className="text-sm text-violet-900/80">{children}</div>
    </section>
  );
}

export function GapCallout({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 my-2 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-800">
        <span className="font-bold uppercase mr-1">Gap — to confirm:</span>
        {children}
      </p>
    </div>
  );
}

export function ParkedCallout({
  security,
  children,
}: {
  security?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-slate-300 bg-slate-100 px-3 py-2 my-2 flex items-start gap-2">
      <Lock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
      <p className="text-xs text-slate-700">
        <span className="font-bold uppercase mr-1">
          Parked{security ? " (security-sensitive)" : ""}:
        </span>
        {children}
      </p>
    </div>
  );
}

export function ConfirmedHint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
      <Lightbulb className="h-3 w-3" />
      {children}
    </div>
  );
}

/* ── Role home: hero card + nav-card grid (mirrors the live app's role home) ──
   Pattern vendored from WF-App-6-30: components/home/StaffHeroCard.tsx +
   StaffNavCards.tsx. Each role's landing reads like the real app — a gradient
   hero identity card over a 2-col grid of nav cards. */

export type NavCard = {
  key: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  iconColor: string;
  iconBg: string;
  badge?: ReactNode;
};

export function RoleHero({
  role,
  name,
  tagline,
  meta,
}: {
  role: string;
  name: string;
  tagline: string;
  meta: { icon: ReactNode; label: string }[];
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* Gradient identity section — app's flame gradient */}
      <div className="bg-gradient-to-br from-[#ED1C24] via-[#f04e23] to-[#F26522] px-5 sm:px-6 py-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-md bg-white flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-[#ED1C24] select-none">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-xl sm:text-2xl leading-tight">{name}</h1>
            <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white border border-white/30">
              {role}
            </span>
          </div>
        </div>
      </div>
      {/* White metadata section */}
      <div className="bg-white px-5 sm:px-6 py-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
          {meta.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {m.icon}
              {m.label}
            </span>
          ))}
        </div>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{tagline}</p>
      </div>
    </div>
  );
}

export function NavCardGrid({
  cards,
  onOpen,
}: {
  cards: NavCard[];
  onOpen: (key: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="navigation">
      {cards.map((card) => (
        <div
          key={card.key}
          role="button"
          tabIndex={0}
          aria-label={card.title}
          onClick={() => onOpen(card.key)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onOpen(card.key);
            }
          }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6
                     cursor-pointer select-none hover:shadow-md hover:-translate-y-0.5
                     focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-[#ED1C24] focus-visible:ring-offset-2
                     active:translate-y-0 active:shadow-sm transition-all duration-200 group"
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4",
                card.iconBg,
                card.iconColor
              )}
              aria-hidden="true"
            >
              {card.icon}
            </div>
            {card.badge}
          </div>
          <h2 className="font-semibold text-gray-900 leading-snug group-hover:text-[#ED1C24] transition-colors duration-200">
            {card.title}
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

/* Small tier badges for nav cards */
export function CardTierBadge({ kind }: { kind: "rec" | "gap" | "new" }) {
  if (kind === "rec")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-violet-700">
        <Sparkles className="h-3 w-3" /> Rec
      </span>
    );
  if (kind === "gap")
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <AlertTriangle className="h-3 w-3" /> Gap
      </span>
    );
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
      New
    </span>
  );
}

/* Back-to-home link shown atop each sub-screen */
export function BackToHome({ onBack, label }: { onBack: () => void; label: string }) {
  return (
    <button
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
    >
      <ArrowLeft className="h-4 w-4" /> {label}
    </button>
  );
}
