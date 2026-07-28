import { useMemo } from "react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/Shell";
import {
  StageChip, RouteBadge, OutcomeChip, MilestoneChip, CheckInBadge,
} from "@/components/chips";
import {
  kindOf, isOverdue, isDueSoon,
  type IpIdea, type PipelineStage,
} from "@/data";
import { cn } from "@/lib/utils";
import { BadgeCheck, Archive, Rocket, Clock } from "lucide-react";

/* Tech Scout — outcome-tracking focus. A read-only roll-up of where every
   idea landed: milestones reached, licenses closed, and which check-ins have
   slipped. No IP-manager mutation; the confidential disclosure record never
   renders here. Tech Scouts also own the Pipeline-stages editor in Settings. */

function Tile({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className={cn("mb-1 inline-flex items-center gap-1.5 text-xs font-medium", tone)}>
        {icon} {label}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}

export default function TechScoutView({ ideas, stages }: { ideas: IpIdea[]; stages: PipelineStage[] }) {
  const stats = useMemo(() => {
    const terminal = ideas.filter((i) => kindOf(i.stage, stages) === "terminal");
    return {
      inMotion: ideas.filter((i) => kindOf(i.stage, stages) === "motion").length,
      licensed: terminal.filter((i) => i.outcome === "licensed").length,
      abandoned: terminal.filter((i) => i.outcome === "abandoned").length,
      overdue: ideas.filter((i) => isOverdue(i)).length,
    };
  }, [ideas, stages]);

  /* Order: active first, terminal last. */
  const rows = useMemo(
    () =>
      [...ideas].sort((a, b) => {
        const at = kindOf(a.stage, stages) === "terminal" ? 1 : 0;
        const bt = kindOf(b.stage, stages) === "terminal" ? 1 : 0;
        return at - bt || a.id - b.id;
      }),
    [ideas, stages]
  );

  return (
    <>
      <PageHeader
        title="Outcomes"
        subtitle="Where every idea landed — milestones, licenses, and check-ins that have slipped. Read-only tracking; the IP Manager drives the pipeline."
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="In motion" value={stats.inMotion} tone="text-emerald-700" icon={<Rocket className="h-3.5 w-3.5" />} />
        <Tile label="Licensed" value={stats.licensed} tone="text-emerald-700" icon={<BadgeCheck className="h-3.5 w-3.5" />} />
        <Tile label="Abandoned" value={stats.abandoned} tone="text-muted-foreground" icon={<Archive className="h-3.5 w-3.5" />} />
        <Tile label="Overdue check-ins" value={stats.overdue} tone="text-rose-700" icon={<Clock className="h-3.5 w-3.5" />} />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[40%]">Idea</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Outcome / milestone</TableHead>
              <TableHead className="whitespace-nowrap">Check-in</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((i) => {
              const terminal = kindOf(i.stage, stages) === "terminal";
              const overdue = isOverdue(i);
              const dueSoon = isDueSoon(i);
              return (
                <TableRow key={i.id} className="hover:bg-transparent">
                  <TableCell className="py-3">
                    <p className="font-medium text-foreground">{i.title}</p>
                    <p className="mt-0.5 max-w-[52ch] truncate text-xs text-muted-foreground">{i.nonConfidentialSummary}</p>
                  </TableCell>
                  <TableCell><StageChip stageId={i.stage} stages={stages} /></TableCell>
                  <TableCell><RouteBadge route={i.route} /></TableCell>
                  <TableCell>
                    {terminal && i.outcome ? (
                      <OutcomeChip outcome={i.outcome} />
                    ) : i.milestone ? (
                      <MilestoneChip milestone={i.milestone} />
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {terminal ? (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    ) : overdue || dueSoon ? (
                      <CheckInBadge overdue={overdue} />
                    ) : i.nextCheckIn ? (
                      <span className="whitespace-nowrap text-xs text-muted-foreground">{i.nextCheckIn}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
