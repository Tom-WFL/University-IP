import { Rocket, Trophy, HeartHandshake, Compass, Users, Phone, PauseCircle, BadgeCheck, Archive, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ROUTE_LABEL, PATENT_LABEL, OUTCOME_LABEL, MILESTONE_LABEL, DEFAULT_STAGES, stageOf,
  type StageId, type PipelineStage, type RouteKind, type PatentStatus, type Involvement,
  type OutcomeKind, type MilestoneKind,
} from "@/data";

/* Small, quiet status chips shared across views. Stages read as a colored
   dot on a neutral chip; routes as a muted icon badge. */

/* Stage identity is data now (customizable). The chip resolves label + dot
   from the live stage list, falling back to the default set. */
export function StageChip({
  stageId, stages = DEFAULT_STAGES, className,
}: {
  stageId: StageId;
  stages?: PipelineStage[];
  className?: string;
}) {
  const s = stageOf(stageId, stages);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-xs text-foreground/75 whitespace-nowrap",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}

/* Compact overdue / due-soon badge for the pipeline row (IP-Manager side). */
export function CheckInBadge({ overdue, className }: { overdue: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] whitespace-nowrap",
        overdue
          ? "border-rose-200 bg-rose-50 text-rose-700"
          : "border-amber-200 bg-amber-50 text-amber-700",
        className
      )}
    >
      <Clock className="h-3 w-3" /> {overdue ? "Overdue" : "Due soon"}
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
  i_corps: <Compass className="h-3 w-3" />,
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

/* Terminal outcome — the true TTO end state. Licensed is the success. */
export function OutcomeChip({ outcome, className }: { outcome: OutcomeKind; className?: string }) {
  const licensed = outcome === "licensed";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap",
        licensed
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-border bg-muted text-muted-foreground",
        className
      )}
    >
      {licensed ? <BadgeCheck className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
      {OUTCOME_LABEL[outcome]}
    </span>
  );
}

/* A positive, route-appropriate milestone reached while in motion. Quieter
   than the terminal outcome — a step on the way, not the end. */
export function MilestoneChip({ milestone, className }: { milestone: MilestoneKind; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground/70 whitespace-nowrap",
        className
      )}
    >
      {MILESTONE_LABEL[milestone]}
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
