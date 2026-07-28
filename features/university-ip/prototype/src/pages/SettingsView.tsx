import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/Shell";
import { cn } from "@/lib/utils";
import { type PipelineStage, type StageKind } from "@/data";
import {
  ChevronUp, ChevronDown, Plus, Trash2, RotateCcw, Lock, GripVertical,
} from "lucide-react";

/* Settings → Pipeline stages. ONE shared, global stage list. System anchors
   (kind ≠ "custom") are renamable + reorderable but never removable and keep
   their special behavior. Custom stages are inert markers. Reachable by both
   the Tech Scout and Wildfire Admin roles. */

const KIND_LABEL: Record<StageKind, string> = {
  intake: "Intake",
  review: "Review",
  routed: "Routing",
  motion: "In motion",
  terminal: "Terminal",
  custom: "Custom",
};

export default function SettingsView({
  stages, onRename, onMove, onAdd, onRemove, onRestoreDefaults,
}: {
  stages: PipelineStage[];
  onRename: (id: string, label: string) => void;
  onMove: (id: string, dir: -1 | 1) => void;
  onAdd: () => void;
  onRemove: (id: string) => void;
  onRestoreDefaults: () => void;
}) {
  return (
    <>
      <PageHeader
        title="Pipeline stages"
        subtitle="Customize the stages every idea moves through. Built-in stages can be renamed and reordered but keep their behavior (routing, publishing, outcomes). Added stages are simple tracking markers."
        actions={
          <Button variant="outline" size="sm" onClick={onRestoreDefaults}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Restore defaults
          </Button>
        }
      />

      <div className="max-w-2xl space-y-2">
        {stages.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
            <span className="text-muted-foreground/40">
              <GripVertical className="h-4 w-4" />
            </span>
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.dot)} />
            <div className="min-w-0 flex-1">
              <Input
                value={s.label}
                onChange={(e) => onRename(s.id, e.target.value)}
                className="h-8 text-sm"
                aria-label={`Stage ${i + 1} label`}
              />
            </div>
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] whitespace-nowrap",
                s.system ? "border-border bg-muted/60 text-muted-foreground" : "border-teal-200 bg-teal-50 text-teal-700"
              )}
            >
              {s.system && <Lock className="h-3 w-3" />} {KIND_LABEL[s.kind]}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={i === 0}
                onClick={() => onMove(s.id, -1)}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                disabled={i === stages.length - 1}
                onClick={() => onMove(s.id, 1)}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                disabled={s.system}
                onClick={() => onRemove(s.id)}
                aria-label={s.system ? "Built-in stage — can't remove" : "Remove stage"}
                title={s.system ? "Built-in stage — can't remove" : "Remove stage"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" className="mt-1" onClick={onAdd}>
          <Plus className="mr-1.5 h-3.5 w-3.5" /> Add stage
        </Button>

        <p className="pt-2 text-xs text-muted-foreground">
          Built-in stages are locked to their role in the workflow — you can rename “Reviewing” to “Triage,” but it still gates
          routing and confidentiality. Custom stages only ever carry Next / Back.
        </p>
      </div>
    </>
  );
}
