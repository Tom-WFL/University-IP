import { Rocket, Trophy, HeartHandshake, Users, Phone, PauseCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  STAGE_LABEL, ROUTE_LABEL, PATENT_LABEL, OUTCOME_LABEL,
  type Stage, type RouteKind, type PatentStatus, type Involvement, type OutcomeKind,
} from "@/data";

/* Small, quiet status chips shared across views. Stages read as a colored
   dot on a neutral chip; routes as a muted icon badge. */

export const STAGE_DOT: Record<Stage, string> = {
  new: "bg-sky-500",
  reviewing: "bg-amber-500",
  routed: "bg-violet-500",
  in_motion: "bg-emerald-500",
  done: "bg-stone-400",
};

export function StageChip({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground/75 whitespace-nowrap",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_DOT[stage])} />
      {STAGE_LABEL[stage]}
    </span>
  );
}

export function HoldChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 whitespace-nowrap",
        className
      )}
    >
      <PauseCircle className="h-3 w-3" /> On hold
    </span>
  );
}

const ROUTE_ICON: Record<RouteKind, JSX.Element> = {
  founder: <Rocket className="h-3 w-3" />,
  hackathon: <Trophy className="h-3 w-3" />,
  founder_match: <HeartHandshake className="h-3 w-3" />,
};

export function RouteBadge({ route, className }: { route: RouteKind | null; className?: string }) {
  if (!route) return <span className="text-xs text-muted-foreground/60">—</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-xs text-foreground/70 whitespace-nowrap",
        className
      )}
    >
      {ROUTE_ICON[route]}
      {ROUTE_LABEL[route]}
    </span>
  );
}

export function OutcomeChip({ outcome, className }: { outcome: OutcomeKind; className?: string }) {
  const positive = outcome !== "passed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap",
        positive
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

export function PatentChip({ status, className }: { status: PatentStatus; className?: string }) {
  if (status === "not_filed")
    return <span className={cn("text-xs text-muted-foreground/60", className)}>Not filed</span>;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-muted/60 px-1.5 py-0.5 text-xs text-foreground/70 whitespace-nowrap",
        className
      )}
    >
      {PATENT_LABEL[status]}
    </span>
  );
}

export function InvolvementChip({ involvement, className }: { involvement: Involvement; className?: string }) {
  return involvement === "cofounder" ? (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-xs text-primary whitespace-nowrap",
        className
      )}
    >
      <Users className="h-3 w-3" /> Professor: hands-on co-founder
    </span>
  ) : (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap",
        className
      )}
    >
      <Phone className="h-3 w-3" /> Professor: contact only
    </span>
  );
}
