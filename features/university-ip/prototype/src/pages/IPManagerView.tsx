import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/Shell";
import { Checkbox } from "@/components/ui/checkbox";
import {
  StageChip, HoldChip, RouteBadge, OutcomeChip, MilestoneChip, PatentChip, CheckInBadge,
} from "@/components/chips";
import {
  UNIVERSITY, IP_MANAGER, ROUTE_LABEL, MILESTONE_LABEL, OUTCOME_LABEL, PATENT_LABEL,
  INVENTION_STAGE_LABEL, FUNDING_SOURCE_LABEL, DATA_MATERIAL_LABEL, DATA_MATERIAL_ORDER,
  SAMPLE_IMPORTED_DISCLOSURE, DEFAULT_STAGES, kindOf, stageOf, firstStageOfKind,
  TODAY, isOverdue, isDueSoon, addDaysISO, simulateBatchImport, mkBatchDraft,
  leadInventor, leadInventorName, leadInventorDept,
  type IpIdea, type StageId, type PipelineStage, type RouteKind, type MilestoneKind,
  type OutcomeKind, type Involvement, type PatentStatus, type Disclosure, type Note, type BatchDraftRow,
} from "@/data";
import { cn } from "@/lib/utils";
import {
  Plus, X, ArrowRight, ArrowLeft, CheckCircle2, PauseCircle, Rocket, Trophy,
  HeartHandshake, Compass, Send, Sparkles, Lock, Eye, FileUp, ChevronDown,
  Users2, UserPlus, FlaskConical, Landmark, ShieldAlert, BadgeCheck, Archive,
  CalendarClock, Mail, MessageSquarePlus, Table2, FileSpreadsheet, Rows3,
} from "lucide-react";

/* ── View shell: pipeline ⇄ intake, with the idea detail as a slide-over ── */

export default function IPManagerView({
  ideas, updateIdea, addIdea, screen, gotoPipeline, stages,
}: {
  ideas: IpIdea[];
  updateIdea: (id: number, patch: Partial<IpIdea> | ((i: IpIdea) => Partial<IpIdea>)) => void;
  addIdea: (idea: Omit<IpIdea, "id">) => number;
  screen: "pipeline" | "intake";
  gotoPipeline: () => void;
  stages: PipelineStage[];
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = ideas.find((i) => i.id === selectedId) ?? null;

  return (
    <>
      {screen === "pipeline" ? (
        <PipelineScreen ideas={ideas} onOpen={setSelectedId} stages={stages} />
      ) : (
        <IntakeScreen
          onAdd={addIdea}
          onOpenIdea={(id) => {
            gotoPipeline();
            setSelectedId(id);
          }}
          gotoPipeline={gotoPipeline}
        />
      )}
      {selected && screen === "pipeline" && (
        <IdeaPanel
          key={selected.id}
          idea={selected}
          stages={stages}
          onChange={(patch) => updateIdea(selected.id, patch)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

/* ── Screen 1: Pipeline — attention strip + one table of all ideas ───────── */

type TabKey = "all" | StageId;
type AttentionFilter = "none" | "interest" | "hold" | "overdue";

function newInterestCount(i: IpIdea) {
  return i.interests.filter((n) => n.status === "new").length;
}

function PipelineScreen({ ideas, onOpen, stages }: { ideas: IpIdea[]; onOpen: (id: number) => void; stages: PipelineStage[] }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [attention, setAttention] = useState<AttentionFilter>("none");

  /* List-order index for a stage id — drives sort order (never a hard-coded map). */
  const orderOf = (id: StageId) => {
    const idx = stages.findIndex((s) => s.id === id);
    return idx === -1 ? stages.length : idx;
  };
  const isTerminal = (i: IpIdea) => kindOf(i.stage, stages) === "terminal";

  const counts = useMemo(() => {
    const byStage = Object.fromEntries(stages.map((s) => [s.id, ideas.filter((i) => i.stage === s.id).length])) as Record<string, number>;
    const intakeStage = firstStageOfKind("intake", stages);
    return {
      byStage,
      newIdeas: intakeStage ? ideas.filter((i) => i.stage === intakeStage.id).length : 0,
      interests: ideas.reduce((n, i) => n + newInterestCount(i), 0),
      onHold: ideas.filter((i) => i.onHold && !isTerminal(i)).length,
      overdue: ideas.filter((i) => isOverdue(i)).length,
    };
  }, [ideas, stages]);

  const visible = useMemo(() => {
    let list = ideas;
    if (tab !== "all") list = list.filter((i) => i.stage === tab);
    if (attention === "interest") list = list.filter((i) => newInterestCount(i) > 0);
    if (attention === "hold") list = list.filter((i) => i.onHold && !isTerminal(i));
    if (attention === "overdue") list = list.filter((i) => isOverdue(i));
    return [...list].sort((a, b) => orderOf(a.stage) - orderOf(b.stage) || a.id - b.id);
  }, [ideas, tab, attention, stages]);

  const pickTab = (t: TabKey) => {
    setTab(t);
    setAttention("none");
  };
  const pickAttention = (f: AttentionFilter) => {
    setAttention((cur) => (cur === f ? "none" : f));
    setTab("all");
  };

  const intakeStage = firstStageOfKind("intake", stages);
  const strip: { key: AttentionFilter | "new"; count: number; label: string; dot: string; active: boolean; onClick: () => void }[] = [
    {
      key: "new",
      count: counts.newIdeas,
      label: counts.newIdeas === 1 ? "new disclosure to review" : "new disclosures to review",
      dot: intakeStage?.dot ?? "bg-sky-500",
      active: tab === intakeStage?.id && attention === "none",
      onClick: () => intakeStage && pickTab(tab === intakeStage.id ? "all" : intakeStage.id),
    },
    {
      key: "interest",
      count: counts.interests,
      label: counts.interests === 1 ? "founder interest waiting" : "founder interests waiting",
      dot: "bg-primary",
      active: attention === "interest",
      onClick: () => pickAttention("interest"),
    },
    {
      key: "overdue",
      count: counts.overdue,
      label: counts.overdue === 1 ? "check-in overdue" : "check-ins overdue",
      dot: "bg-rose-500",
      active: attention === "overdue",
      onClick: () => pickAttention("overdue"),
    },
    {
      key: "hold",
      count: counts.onHold,
      label: "on hold",
      dot: "bg-amber-500",
      active: attention === "hold",
      onClick: () => pickAttention("hold"),
    },
  ];
  const activeStrip = strip.filter((c) => c.count > 0);

  return (
    <>
      <PageHeader
        title="Pipeline"
        subtitle={`${UNIVERSITY} — every disclosure from intake to license, in one place.`}
      />

      {/* Attention strip */}
      {activeStrip.length > 0 ? (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {activeStrip.map((c) => (
            <button
              key={c.key}
              onClick={c.onClick}
              className={cn(
                "group inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm transition-colors",
                c.active
                  ? "border-primary/50 ring-1 ring-primary/25"
                  : "border-border hover:border-primary/40"
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", c.dot)} />
              <span className="font-semibold tabular-nums text-foreground">{c.count}</span>
              <span className="text-muted-foreground transition-colors group-hover:text-foreground">{c.label}</span>
            </button>
          ))}
          {(tab !== "all" || attention !== "none") && (
            <button
              onClick={() => pickTab("all")}
              className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          Nothing needs your attention right now.
        </div>
      )}

      {/* Stage tabs + hold filter */}
      <div className="flex flex-wrap items-end gap-x-1 border-b border-border">
        {(["all", ...stages.map((s) => s.id)] as TabKey[]).map((t) => {
          const active = tab === t && attention === "none";
          const count = t === "all" ? ideas.length : counts.byStage[t] ?? 0;
          const label = t === "all" ? "All" : stageOf(t, stages).label;
          return (
            <button
              key={t}
              onClick={() => pickTab(t)}
              className={cn(
                "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
                active
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
              <span className="text-xs tabular-nums text-muted-foreground/70">{count}</span>
            </button>
          );
        })}
        <button
          onClick={() => pickAttention("hold")}
          className={cn(
            "mb-1.5 ml-auto inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs transition-colors",
            attention === "hold"
              ? "border-amber-300 bg-amber-50 text-amber-700"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <PauseCircle className="h-3.5 w-3.5" /> On hold · {counts.onHold}
        </button>
      </div>

      {/* The one table */}
      <div className="mt-1 rounded-lg">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[34%]">Idea</TableHead>
              <TableHead>Lead inventor</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Patent</TableHead>
              <TableHead>Updated / outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((i) => {
              const waiting = newInterestCount(i);
              const terminal = kindOf(i.stage, stages) === "terminal";
              const overdue = isOverdue(i);
              const dueSoon = isDueSoon(i);
              return (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => onOpen(i.id)}>
                  <TableCell className="py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{i.title}</p>
                      {waiting > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {waiting} new interest{waiting > 1 ? "s" : ""}
                        </span>
                      )}
                      {!terminal && (overdue || dueSoon) && <CheckInBadge overdue={overdue} />}
                    </div>
                    <p className="mt-0.5 max-w-[42ch] truncate text-xs text-muted-foreground">{i.nonConfidentialSummary}</p>
                  </TableCell>
                  <TableCell>
                    <p className="whitespace-nowrap text-sm text-foreground">{leadInventorName(i)}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">
                      {leadInventorDept(i)}
                      {i.disclosure.inventors.length > 1 && (
                        <span className="text-muted-foreground/70"> +{i.disclosure.inventors.length - 1}</span>
                      )}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <StageChip stageId={i.stage} stages={stages} />
                      {i.onHold && !terminal && <HoldChip />}
                    </div>
                  </TableCell>
                  <TableCell><RouteBadge route={i.route} /></TableCell>
                  <TableCell><PatentChip status={i.patentStatus} /></TableCell>
                  <TableCell>
                    {terminal && i.outcome ? (
                      <OutcomeChip outcome={i.outcome} />
                    ) : i.milestone ? (
                      <MilestoneChip milestone={i.milestone} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{i.updated}</span>
                    )}
                    {i.lastUpdateEmailSent && (
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground/70">
                        <Mail className="h-3 w-3" /> Emailed {i.lastUpdateEmailSent}
                      </p>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                  Nothing here — this filter is clear.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

/* ── Shared bits for the detail slide-over ───────────────────────────────── */

function useFlash(): [string | null, (m: string) => void] {
  const [flash, setFlash] = useState<string | null>(null);
  const notify = (m: string) => {
    setFlash(m);
    window.setTimeout(() => setFlash(null), 3600);
  };
  return [flash, notify];
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="border-b border-border px-6 py-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/* Small progressive-disclosure block — keeps confidential detail folded so no
   screen feels heavy. */
function Collapsible({
  title, icon, defaultOpen = false, children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-md border border-border">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
      >
        <span className="flex items-center gap-2 text-xs font-medium text-foreground">
          {icon}
          {title}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="space-y-3 border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</p>
      <p className="mt-0.5 text-xs leading-relaxed text-foreground/90">{value || <span className="text-muted-foreground/60">—</span>}</p>
    </div>
  );
}

/* A labeled group inside the Team section — keeps the consolidated view legible. */
function TeamGroup({ label, confidential, children }: { label: string; confidential?: boolean; children: React.ReactNode }) {
  return (
    <div className="mt-3 first:mt-0">
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
        {label}
        {confidential && <Lock className="h-3 w-3 text-amber-600" />}
      </p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/* One entry in the running note log. Founder updates are badged distinctly. */
const NOTE_ROLE_META: Record<Note["authorRole"], { label: string; cls: string }> = {
  ip_manager: { label: "IP Manager", cls: "border-border bg-muted/60 text-muted-foreground" },
  founder: { label: "Founder update", cls: "border-primary/25 bg-primary/5 text-primary" },
  system: { label: "System", cls: "border-border bg-muted/40 text-muted-foreground/80" },
};

function NoteRow({ note }: { note: Note }) {
  const meta = NOTE_ROLE_META[note.authorRole];
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className={cn("inline-flex items-center rounded-full border px-1.5 py-px text-[10px] font-medium", meta.cls)}>
          {meta.label}
        </span>
        <span className="text-xs font-medium text-foreground">{note.author}</span>
        <span className="text-[11px] text-muted-foreground/70">· {note.when}</span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/90">{note.text}</p>
    </div>
  );
}

/* Renders the CONFIDENTIAL disclosure record — TTO-only, never shown to
   professors or founders. Used in the idea detail and (auto-filled) intake. */
function ConfidentialDisclosure({ d }: { d: Disclosure }) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50/60 px-2.5 py-1.5 text-[11px] text-amber-800">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        Confidential — from the invention disclosure. Visible to you and the TTO only, never to founders or the marketplace.
      </p>

      <Collapsible title="Scientific abstract & invention details" icon={<FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />} defaultOpen>
        <Field label="Brief summary (Section 4)" value={d.briefSummary} />
        <Field label="Advantages over state-of-the-art" value={d.advantages} />
        <Field label="Limitations" value={d.limitations} />
        <Field label="Applications" value={d.applications} />
        <Field label="Companies / contacts of interest" value={d.companiesOfInterest} />
      </Collapsible>

      <Collapsible title={`Inventors · ${d.inventors.length}`} icon={<Users2 className="h-3.5 w-3.5 text-muted-foreground" />}>
        <div className="space-y-2">
          {d.inventors.map((inv, idx) => (
            <div key={idx} className="rounded-md border border-border px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-foreground">{inv.name}</p>
                <span className="text-[11px] tabular-nums text-muted-foreground">{inv.inventorshipPct}%</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{inv.title} · {inv.department}</p>
              {inv.email && <p className="text-[11px] text-muted-foreground/80">{inv.email}</p>}
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title="Stage, dates & written record" icon={<FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />}>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Technology #" value={d.techNumber} />
          <Field label="Date of disclosure" value={d.dateOfDisclosure} />
          <Field label="Date of conception" value={d.dateOfConception} />
          <Field label="Reduction to practice" value={d.dateOfReductionToPractice} />
        </div>
        <Field
          label="Invention stage"
          value={d.inventionStage.map((s) => INVENTION_STAGE_LABEL[s]).join(" · ")}
        />
        <Field label="Written record exists" value={d.writtenRecordExists ? "Yes" : "No"} />
      </Collapsible>

      <Collapsible title={`Funding · ${d.funding.length}`} icon={<Landmark className="h-3.5 w-3.5 text-muted-foreground" />}>
        {d.funding.length === 0 ? (
          <p className="text-xs text-muted-foreground">No external funding reported.</p>
        ) : (
          <div className="space-y-2">
            {d.funding.map((f, idx) => (
              <div key={idx} className="rounded-md border border-border px-2.5 py-2">
                <p className="text-xs font-medium text-foreground">{f.sponsorName}</p>
                <p className="text-[11px] text-muted-foreground">
                  {FUNDING_SOURCE_LABEL[f.sourceType]}{f.awardNumber && <> · {f.awardNumber}</>}
                </p>
              </div>
            ))}
            {d.funding.some((f) => f.sourceType === "federal") && (
              <p className="text-[11px] text-amber-800">Federal funding present — Bayh-Dole election obligations apply.</p>
            )}
          </div>
        )}
      </Collapsible>

      <Collapsible title="Public-disclosure history" icon={<ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />}>
        <Field
          label="Already disclosed externally?"
          value={d.disclosedExternally ? `Yes — ${d.disclosedExternallyDetails}` : "No"}
        />
        <Field
          label="Planned disclosure?"
          value={d.plannedDisclosure ? `Yes — ${d.plannedDisclosureDetails}` : "No"}
        />
        {(d.disclosedExternally || d.plannedDisclosure) && (
          <p className="text-[11px] text-amber-800">
            Disclosure activity affects patentability windows — confirm filing status before any public release.
          </p>
        )}
      </Collapsible>

      <Collapsible title="Data & materials" icon={<FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />}>
        {d.dataMaterials.length === 0 ? (
          <p className="text-xs text-muted-foreground">None flagged.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {d.dataMaterials.map((m) => (
              <span key={m} className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-foreground/70">
                {DATA_MATERIAL_LABEL[m]}
              </span>
            ))}
          </div>
        )}
      </Collapsible>
    </div>
  );
}

/* ── The idea detail slide-over — everything actionable lives here ───────── */

function StageStepper({ idea, stages }: { idea: IpIdea; stages: PipelineStage[] }) {
  const cur = stages.findIndex((s) => s.id === idea.stage);
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((s, i) => (
        <div key={s.id} className="flex min-w-0 items-center gap-1.5" style={{ flex: i < stages.length - 1 ? "1 1 0" : "0 0 auto" }}>
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              i < cur ? "bg-foreground/30" : i === cur ? "bg-primary" : "bg-border"
            )}
          />
          <span
            className={cn(
              "whitespace-nowrap text-[11px]",
              i === cur ? "font-medium text-foreground" : "text-muted-foreground/80"
            )}
          >
            {s.label}
          </span>
          {i < stages.length - 1 && <span className="h-px min-w-2 flex-1 bg-border" />}
        </div>
      ))}
    </div>
  );
}

const ROUTE_OPTIONS: { r: RouteKind; icon: JSX.Element; blurb: string }[] = [
  {
    r: "founder",
    icon: <Rocket className="h-4 w-4" />,
    blurb: "The inventor builds it — they join the Wildfire program as a founder.",
  },
  {
    r: "hackathon",
    icon: <Trophy className="h-4 w-4" />,
    blurb: "Offer it as a pickable idea at a hackathon.",
  },
  {
    r: "founder_match",
    icon: <HeartHandshake className="h-4 w-4" />,
    blurb: "List it for an outside founder to pick up — routing here publishes the listing.",
  },
  {
    r: "i_corps",
    icon: <Compass className="h-4 w-4" />,
    blurb: "Send it to I-Corps for customer discovery before anyone commits to build.",
  },
];

/* Default milestone offered when marking a route-appropriate step in motion. */
function defaultMilestone(route: RouteKind | null): MilestoneKind {
  if (route === "founder") return "company_formed";
  if (route === "hackathon") return "built_at_hackathon";
  if (route === "i_corps") return "icorps_cohort";
  return "matched";
}

function IdeaPanel({
  idea, onChange, onClose, stages,
}: {
  idea: IpIdea;
  onChange: (patch: Partial<IpIdea> | ((i: IpIdea) => Partial<IpIdea>)) => void;
  onClose: () => void;
  stages: PipelineStage[];
}) {
  const [flash, notify] = useFlash();
  const [routePick, setRoutePick] = useState<RouteKind | null>(idea.route);
  const [milestonePick, setMilestonePick] = useState<MilestoneKind>(idea.milestone ?? defaultMilestone(idea.route));
  const [outcomePick, setOutcomePick] = useState<OutcomeKind>("licensed");
  const [outcomeNoteDraft, setOutcomeNoteDraft] = useState("");
  const [noteDraft, setNoteDraft] = useState("");
  const [summaryDraft, setSummaryDraft] = useState(idea.nonConfidentialSummary);
  const [mentorName, setMentorName] = useState("");
  const [mentorEmail, setMentorEmail] = useState("");
  const [hackDraft, setHackDraft] = useState({
    event: idea.hackathonTracking?.event ?? "",
    pickedBy: idea.hackathonTracking?.pickedBy ?? "",
    built: idea.hackathonTracking?.built ?? "",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /* Everything branches on stage KIND (never the label or index), so custom
     stages inserted in Settings never break routing / gating. */
  const idx = stages.findIndex((s) => s.id === idea.stage);
  const kind = kindOf(idea.stage, stages);
  const nextStage = idx >= 0 ? stages[idx + 1] : undefined;
  const prevStage = idx > 0 ? stages[idx - 1] : undefined;
  const terminalStage = firstStageOfKind("terminal", stages);
  const motionStage = firstStageOfKind("motion", stages);
  const isTerminal = kind === "terminal";

  const paused = idea.onHold && !isTerminal;
  const lead = leadInventor(idea);
  const hasSummary = idea.nonConfidentialSummary.trim().length > 0;

  /* Append a note to the running log (newest first). */
  const nextNoteId = (log: Note[]) => Math.max(0, ...log.map((n) => n.id)) + 1;
  const appendNote = (text: string, role: Note["authorRole"] = "ip_manager", author = IP_MANAGER) =>
    onChange((i) => ({
      noteLog: [{ id: nextNoteId(i.noteLog), author, authorRole: role, when: "Just now", text }, ...i.noteLog],
    }));

  const advance = {
    /* Generic one-step move (intake, routed, custom) — pure list order. */
    next: () => {
      if (!nextStage) return;
      onChange({ stage: nextStage.id });
      notify(`Moved to ${nextStage.label}.`);
    },
    /* review-kind: set route (+ publish for founder_match), then advance one. */
    route: () => {
      if (!routePick) return;
      onChange({
        stage: nextStage ? nextStage.id : idea.stage,
        route: routePick,
        published: routePick === "founder_match",
        ...(routePick === "hackathon" && !idea.hackathonTracking
          ? { hackathonTracking: { event: null, pickedBy: null, built: null } }
          : {}),
      });
      notify(
        routePick === "founder_match"
          ? "Routed to Founder Match — now listed on the founder marketplace."
          : `Routed to ${ROUTE_LABEL[routePick]}.`
      );
    },
    milestone: () => {
      onChange({ milestone: milestonePick });
      notify(`Milestone recorded — ${MILESTONE_LABEL[milestonePick].toLowerCase()}.`);
    },
    /* motion-kind: close out — jump to the terminal anchor by KIND. */
    finalize: () => {
      onChange({
        stage: terminalStage?.id ?? idea.stage,
        outcome: outcomePick,
        outcomeNote: outcomeNoteDraft.trim() || undefined,
        published: false,
      });
      notify(outcomePick === "licensed" ? "Licensed — closed out." : "Closed as abandoned.");
    },
    abandon: () => {
      onChange({ stage: terminalStage?.id ?? idea.stage, outcome: "abandoned", outcomeNote: "Abandoned.", published: false });
      notify("Closed as abandoned.");
    },
    /* Generic back one step. Leaving a routed-kind stage backward drops the route. */
    back: () => {
      if (!prevStage) return;
      const leavingRouted = kind === "routed";
      onChange({ stage: prevStage.id, ...(leavingRouted ? { route: null, published: false } : {}) });
      notify(`Moved back to ${prevStage.label}.`);
    },
    reopen: () => {
      onChange({ stage: motionStage?.id ?? idea.stage, outcome: undefined, outcomeNote: undefined });
      notify("Reopened — back in motion.");
    },
  };

  const applyICorps = () => {
    onChange({ icorps: { applied: true, when: "Just now" } });
    notify("I-Corps application recorded.");
  };

  const inviteMentor = () => {
    const name = mentorName.trim();
    const email = mentorEmail.trim();
    if (!name || !email) return;
    onChange((i) => ({
      mentors: [...i.mentors, { id: Math.max(0, ...i.mentors.map((m) => m.id)) + 1, name, email, invitedWhen: "Just now" }],
    }));
    setMentorName("");
    setMentorEmail("");
    notify(`Mentor invite sent to ${name} — attached as a note.`);
  };

  const actOnInterest = (interestId: number, status: "connected" | "declined") => {
    const interest = idea.interests.find((n) => n.id === interestId);
    onChange((i) => ({
      interests: i.interests.map((n) => (n.id === interestId ? { ...n, status } : n)),
      ...(status === "connected" && kindOf(i.stage, stages) === "routed" && motionStage
        ? { stage: motionStage.id }
        : {}),
      ...(status === "connected"
        ? {
            noteLog: [
              {
                id: nextNoteId(i.noteLog),
                author: IP_MANAGER,
                authorRole: "system" as const,
                when: "Just now",
                text: `Connected ${interest?.founder ?? "founder"} with ${leadInventorName(i)}.`,
              },
              ...i.noteLog,
            ],
          }
        : {}),
    }));
    notify(
      status === "connected"
        ? `Connecting ${interest?.founder ?? "the founder"} with ${leadInventorName(idea)}.`
        : "Interest declined."
    );
  };

  /* Check-in reminder + update-email — compact quick actions in Progress header. */
  const setCheckIn = (iso: string | undefined) => {
    onChange({ nextCheckIn: iso });
    notify(iso ? `Next check-in set for ${iso}.` : "Check-in cleared.");
  };
  const logUpdateEmail = () =>
    onChange((i) => ({
      lastUpdateEmailSent: TODAY,
      noteLog: [
        {
          id: nextNoteId(i.noteLog),
          author: IP_MANAGER,
          authorRole: "system" as const,
          when: "Just now",
          text: `Stakeholder update email logged (${TODAY}).`,
        },
        ...i.noteLog,
      ],
    }));
  const overdue = isOverdue(idea);

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={idea.title}>
      <div className="absolute inset-0 bg-foreground/25" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col overflow-y-auto border-l border-border bg-card shadow-lg">
        {/* Header */}
        <div className="border-b border-border px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <StageChip stageId={idea.stage} stages={stages} />
              {paused && <HoldChip />}
              {idea.route && <RouteBadge route={idea.route} />}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-snug text-foreground">{idea.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.name} · {lead.department}
            {idea.disclosure.inventors.length > 1 && ` +${idea.disclosure.inventors.length - 1} more`}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Patent: {PATENT_LABEL[idea.patentStatus]} · Tech {idea.disclosure.techNumber}
          </p>
          {flash && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {flash}
            </p>
          )}
        </div>

        {/* Public gist — what founders see */}
        <Section title="Public summary">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Eye className="h-3.5 w-3.5" /> Non-confidential — the gist founders and the marketplace see. No IP given away.
          </p>
          <Textarea
            rows={4}
            value={summaryDraft}
            onChange={(e) => setSummaryDraft(e.target.value)}
            placeholder="The gist of what the product is, without giving away any IP."
            className="min-h-[104px] text-sm"
          />
          <div className="mt-2 flex items-center gap-3">
            <Button
              size="sm"
              variant="default"
              onClick={() => {
                onChange({ nonConfidentialSummary: summaryDraft.trim() });
                notify("Public summary saved.");
              }}
            >
              Save summary
            </Button>
            {!hasSummary && (
              <span className="text-[11px] text-amber-700">Required before publishing to founders.</span>
            )}
          </div>
        </Section>

        {/* Progress */}
        <Section
          title="Progress"
          aside={
            !isTerminal && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                On hold
                <Switch
                  checked={idea.onHold}
                  onCheckedChange={(v) => {
                    onChange({ onHold: v, ...(v ? {} : { holdNote: undefined }) });
                    notify(v ? "Put on hold — paused, not routed anywhere." : "Resumed.");
                  }}
                  aria-label="On hold"
                />
              </label>
            )
          }
        >
          <StageStepper idea={idea} stages={stages} />

          {idea.milestone && !isTerminal && (
            <div className="mt-3">
              <MilestoneChip milestone={idea.milestone} />
            </div>
          )}

          {/* Compact quick-actions: check-in reminder + update-email marker.
              IP-Manager-only signals — never on founder / professor surfaces. */}
          {!isTerminal && (
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs",
                    overdue ? "border-rose-200 bg-rose-50 text-rose-700" : "border-border bg-muted/40 text-muted-foreground"
                  )}
                >
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                  <span>Next check-in</span>
                  <input
                    type="date"
                    value={idea.nextCheckIn ?? ""}
                    onChange={(e) => setCheckIn(e.target.value || undefined)}
                    className="bg-transparent text-xs text-foreground outline-none"
                    aria-label="Next check-in date"
                  />
                </span>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCheckIn(addDaysISO(TODAY, 14))}>
                  +2 wks
                </Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setCheckIn(addDaysISO(TODAY, 30))}>
                  +1 mo
                </Button>
                {idea.nextCheckIn && (
                  <button
                    onClick={() => setCheckIn(undefined)}
                    className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              {overdue && (
                <p className="flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50/70 px-2.5 py-1.5 text-xs text-rose-700">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" /> Check-in overdue — was due {idea.nextCheckIn}. Time to reach out.
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                {idea.lastUpdateEmailSent ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" /> Last update email: {idea.lastUpdateEmailSent}
                    </span>
                    <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={logUpdateEmail}>
                      Re-stamp today
                    </Button>
                  </>
                ) : (
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={logUpdateEmail}>
                    <Mail className="mr-1 h-3.5 w-3.5" /> Log update email sent
                  </Button>
                )}
              </div>
            </div>
          )}

          {paused && (
            <div className="mt-3 space-y-2 rounded-md border border-amber-200 bg-amber-50/60 px-3 py-2.5">
              <p className="flex items-center gap-1.5 text-xs text-amber-800">
                <PauseCircle className="h-3.5 w-3.5 shrink-0" />
                Paused — it keeps its place in the pipeline and is hidden from founders until you resume.
              </p>
              <Input
                value={idea.holdNote ?? ""}
                onChange={(e) => onChange({ holdNote: e.target.value })}
                placeholder="Why it's on hold (optional)"
                className="h-8 border-amber-200 bg-card text-xs"
              />
            </div>
          )}

          {!paused && (
            <div className="mt-4">
              {kind === "intake" && (
                <Button size="sm" disabled={!nextStage} onClick={advance.next}>
                  {nextStage?.kind === "review" ? "Start reviewing" : `Move to ${nextStage?.label ?? "next"}`}{" "}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}

              {kind === "review" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Pick a route, then move it on:</p>
                  <div className="space-y-1.5">
                    {ROUTE_OPTIONS.map(({ r, icon, blurb }) => {
                      const disabled = r === "founder_match" && !hasSummary;
                      return (
                        <button
                          key={r}
                          disabled={disabled}
                          onClick={() => setRoutePick(r)}
                          className={cn(
                            "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
                            disabled && "cursor-not-allowed opacity-50",
                            routePick === r
                              ? "border-primary/60 bg-primary/5"
                              : "border-border hover:border-primary/40"
                          )}
                        >
                          <span className={cn("mt-0.5", routePick === r ? "text-primary" : "text-muted-foreground")}>
                            {icon}
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-foreground">{ROUTE_LABEL[r]}</span>
                            <span className="block text-xs text-muted-foreground">
                              {disabled ? "Add a public summary first to list this for founders." : blurb}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <Button size="sm" disabled={!routePick} onClick={advance.route}>
                    Route to {routePick ? ROUTE_LABEL[routePick] : "…"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {kind === "routed" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {idea.route === "founder" && "Once the inventor starts the program, mark it in motion."}
                    {idea.route === "hackathon" && "Once a team picks it up at an event, mark it in motion."}
                    {idea.route === "founder_match" && "Connecting a founder moves it in motion automatically — or mark it yourself."}
                    {idea.route === "i_corps" && "Once a founder picks it up for a cohort, mark it in motion."}
                    {!idea.route && "Move it on when work starts."}
                  </p>
                  <Button size="sm" disabled={!nextStage} onClick={advance.next}>
                    {nextStage?.kind === "motion" ? "Mark in motion" : `Move to ${nextStage?.label ?? "next"}`}{" "}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {kind === "custom" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Custom stage — a tracking marker. Move it forward or back when you're ready.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" disabled={!nextStage} onClick={advance.next}>
                      {nextStage ? `Move to ${nextStage.label}` : "Last stage"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {kind === "motion" && (
                <div className="space-y-4">
                  {/* Milestone (positive, route-appropriate marker) */}
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Record a milestone on the way (optional):</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={milestonePick} onValueChange={(v) => setMilestonePick(v as MilestoneKind)}>
                        <SelectTrigger className="h-8 w-52 text-xs" aria-label="Milestone">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(MILESTONE_LABEL) as MilestoneKind[]).map((m) => (
                            <SelectItem key={m} value={m} className="text-xs">
                              {MILESTONE_LABEL[m]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" variant="outline" onClick={advance.milestone}>
                        Save milestone
                      </Button>
                    </div>
                  </div>

                  {/* Terminal: license or abandon */}
                  <div className="space-y-2 rounded-md border border-border bg-muted/30 px-3 py-3">
                    <p className="text-xs font-medium text-foreground">Close it out</p>
                    <p className="text-xs text-muted-foreground">The true end state: license the IP, or abandon it.</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={outcomePick} onValueChange={(v) => setOutcomePick(v as OutcomeKind)}>
                        <SelectTrigger className="h-8 w-40 text-xs" aria-label="Terminal outcome">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(OUTCOME_LABEL) as OutcomeKind[]).map((o) => (
                            <SelectItem key={o} value={o} className="text-xs">
                              {OUTCOME_LABEL[o]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={advance.finalize}>
                        {outcomePick === "licensed" ? (
                          <><BadgeCheck className="mr-1 h-3.5 w-3.5" /> Mark licensed</>
                        ) : (
                          <><Archive className="mr-1 h-3.5 w-3.5" /> Mark abandoned</>
                        )}
                      </Button>
                    </div>
                    <Input
                      value={outcomeNoteDraft}
                      onChange={(e) => setOutcomeNoteDraft(e.target.value)}
                      placeholder={outcomePick === "licensed" ? "Licensee / terms note (optional)" : "Why abandoned (optional)"}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              )}

              {isTerminal && idea.outcome && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <OutcomeChip outcome={idea.outcome} />
                    {idea.milestone && <MilestoneChip milestone={idea.milestone} />}
                    {idea.outcomeNote && <p className="text-sm text-muted-foreground">{idea.outcomeNote}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={advance.reopen}>
                    Reopen
                  </Button>
                </div>
              )}

              {(kind === "review" || kind === "routed" || kind === "motion" || kind === "custom") && (
                <div className="mt-3 flex items-center gap-3">
                  {prevStage && (
                    <button
                      onClick={advance.back}
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <ArrowLeft className="h-3 w-3" /> Back to {prevStage.label}
                    </button>
                  )}
                  {kind !== "custom" && (
                    <button
                      onClick={advance.abandon}
                      className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                    >
                      Abandon this idea
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* I-Corps — apply once in motion */}
        {kind === "motion" && (
          <Section title="I-Corps">
            {idea.icorps?.applied ? (
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Applied to I-Corps · {idea.icorps.when}
                </p>
                {idea.icorps.note && <p className="text-xs text-muted-foreground">{idea.icorps.note}</p>}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  I-Corps runs founders through customer discovery in cohorts. Now that a founder has this in motion, they can apply.
                </p>
                <Button size="sm" variant="outline" onClick={applyICorps}>
                  <Compass className="mr-1.5 h-3.5 w-3.5" /> Apply to I-Corps
                </Button>
              </div>
            )}
          </Section>
        )}

        {/* Founder Match: listing + interest */}
        {idea.route === "founder_match" && (
          <Section
            title="Founder Match"
            aside={
              !isTerminal && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  Listed for founders
                  <Switch
                    checked={idea.published}
                    disabled={paused || !hasSummary}
                    onCheckedChange={(v) => {
                      onChange({ published: v });
                      notify(v ? "Listed on the founder marketplace." : "Listing withdrawn.");
                    }}
                    aria-label="Listed on Founder Match"
                  />
                </label>
              )
            }
          >
            <p className="text-xs text-muted-foreground">
              {isTerminal
                ? "This idea has closed out — the listing is withdrawn."
                : paused
                  ? "Hidden from founders while on hold."
                  : !hasSummary
                    ? "Add a public summary to list this — founders only ever see the non-confidential gist."
                    : idea.published
                      ? "Founders across universities can see the public summary and express interest."
                      : "Not listed — founders can't see it."}
            </p>
            <div className="mt-3 space-y-2">
              {idea.interests.length === 0 && (
                <p className="text-sm text-muted-foreground">No founder interest yet.</p>
              )}
              {idea.interests.map((n) => (
                <div key={n.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{n.founder}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {n.founderContext} · {n.when}
                    </p>
                  </div>
                  {n.status === "new" ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => actOnInterest(n.id, "connected")}>
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => actOnInterest(n.id, "declined")}
                      >
                        Decline
                      </Button>
                    </div>
                  ) : n.status === "connected" ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Connected
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs text-muted-foreground">Declined</span>
                  )}
                </div>
              ))}
            </div>
            {idea.interests.some((n) => n.status === "new") && (
              <p className="mt-2 text-xs text-muted-foreground">
                Connect introduces the founder to {leadInventorName(idea)} and moves the idea in motion.
              </p>
            )}
          </Section>
        )}

        {/* Hackathon tracking — editable */}
        {idea.route === "hackathon" && (
          <Section title="Hackathon tracking">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <Label htmlFor="hack-event" className="text-xs">Event</Label>
                  <Input
                    id="hack-event"
                    value={hackDraft.event}
                    onChange={(e) => setHackDraft((d) => ({ ...d, event: e.target.value }))}
                    placeholder="e.g. Fall Builders Jam 2026"
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="hack-team" className="text-xs">Picked up by</Label>
                  <Input
                    id="hack-team"
                    value={hackDraft.pickedBy}
                    onChange={(e) => setHackDraft((d) => ({ ...d, pickedBy: e.target.value }))}
                    placeholder="Team or person"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="hack-built" className="text-xs">What was built</Label>
                <Textarea
                  id="hack-built"
                  rows={2}
                  value={hackDraft.built}
                  onChange={(e) => setHackDraft((d) => ({ ...d, built: e.target.value }))}
                  placeholder="What came out of the event"
                  className="text-xs"
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                disabled={
                  hackDraft.event === (idea.hackathonTracking?.event ?? "") &&
                  hackDraft.pickedBy === (idea.hackathonTracking?.pickedBy ?? "") &&
                  hackDraft.built === (idea.hackathonTracking?.built ?? "")
                }
                onClick={() => {
                  onChange({
                    hackathonTracking: {
                      event: hackDraft.event.trim() || null,
                      pickedBy: hackDraft.pickedBy.trim() || null,
                      built: hackDraft.built.trim() || null,
                    },
                  });
                  notify("Hackathon tracking saved.");
                }}
              >
                Save tracking
              </Button>
            </div>
          </Section>
        )}

        {/* Founder route — program mirror */}
        {idea.route === "founder" && (
          <Section title="Founder program">
            {idea.founderTracking ? (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium text-foreground">{idea.founderTracking.companyName}</span>
                  <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-foreground/70">
                    {idea.founderTracking.currentPhase}
                  </span>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Lessons</span>
                    <span className="tabular-nums">
                      {idea.founderTracking.lessonsCompleted}/{idea.founderTracking.totalLessons}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${(idea.founderTracking.lessonsCompleted / idea.founderTracking.totalLessons) * 100}%` }}
                    />
                  </div>
                </div>
                {idea.founderTracking.coFounder && (
                  <p className="text-xs text-muted-foreground">Co-founder: {idea.founderTracking.coFounder}</p>
                )}
                <p className="text-xs text-muted-foreground/80">
                  Read from the founder program — it updates as {leadInventorName(idea)} progresses.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Program progress appears here once {leadInventorName(idea)}'s founder account is active.
              </p>
            )}
          </Section>
        )}

        {/* Confidential disclosure record */}
        <Section title="Invention disclosure">
          <ConfidentialDisclosure d={idea.disclosure} />
        </Section>

        {/* Team — everyone on the idea, folding in inventors + involvement + mentors */}
        <Section title="Team">
          <p className="mb-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Users2 className="h-3.5 w-3.5" /> Everyone on this idea. You see full names; founders never see inventor names.
          </p>

          {/* Inventors — confidential */}
          <TeamGroup label={`Inventors · ${idea.disclosure.inventors.length}`} confidential>
            {idea.disclosure.inventors.map((inv, i) => (
              <div key={i} className="rounded-md border border-border px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-foreground">
                    {inv.name}
                    {i === 0 && (
                      <span className="ml-1.5 inline-flex items-center rounded-full border border-primary/25 bg-primary/5 px-1.5 py-px text-[10px] text-primary">
                        Lead
                      </span>
                    )}
                  </p>
                  <span className="text-[11px] tabular-nums text-muted-foreground">{inv.inventorshipPct}%</span>
                </div>
                <p className="text-[11px] text-muted-foreground">{inv.title} · {inv.department}</p>
              </div>
            ))}
          </TeamGroup>

          {/* Lead-inventor involvement flag + invite */}
          <div className="mt-3 space-y-2.5 rounded-md border border-border px-3 py-3">
            <p className="text-xs font-medium text-foreground">Lead inventor involvement — {lead.name}</p>
            <RadioGroup
              value={idea.involvement}
              onValueChange={(v) => {
                onChange({ involvement: v as Involvement });
                notify("Involvement updated.");
              }}
              className="gap-1.5"
            >
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="cofounder" id="p-inv-cf" className="mt-0.5" />
                <Label htmlFor="p-inv-cf" className="text-xs font-normal leading-snug text-muted-foreground">
                  Hands-on co-founder — wants to build this day-to-day
                </Label>
              </div>
              <div className="flex items-start space-x-2">
                <RadioGroupItem value="contact" id="p-inv-ct" className="mt-0.5" />
                <Label htmlFor="p-inv-ct" className="text-xs font-normal leading-snug text-muted-foreground">
                  Contact only — hands it off; whoever takes it can reach out
                </Label>
              </div>
            </RadioGroup>
            {idea.inviteSent ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Profile created — invite sent
              </p>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onChange({ inviteSent: true });
                  notify(`Invite sent to ${lead.name}.`);
                }}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Create profile & send invite
              </Button>
            )}
          </div>

          {/* Founders who picked it up */}
          {(() => {
            const founders = idea.interests.filter((n) => n.status === "connected");
            const coFounder = idea.founderTracking?.coFounder;
            if (founders.length === 0 && !coFounder) return null;
            return (
              <TeamGroup label="Founders">
                {coFounder && (
                  <div className="rounded-md border border-border px-2.5 py-2">
                    <p className="text-xs font-medium text-foreground">{coFounder}</p>
                    <p className="text-[11px] text-muted-foreground">Co-founder · {idea.founderTracking?.companyName}</p>
                  </div>
                )}
                {founders.map((n) => (
                  <div key={n.id} className="rounded-md border border-border px-2.5 py-2">
                    <p className="text-xs font-medium text-foreground">{n.founder}</p>
                    <p className="text-[11px] text-muted-foreground">Picked it up · {n.founderContext}</p>
                  </div>
                ))}
              </TeamGroup>
            );
          })()}

          {/* Mentors */}
          <TeamGroup label="Mentors">
            {idea.mentors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No mentors attached yet.</p>
            ) : (
              idea.mentors.map((m) => (
                <div key={m.id} className="rounded-md border border-border px-2.5 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-foreground">{m.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Invited · {m.invitedWhen}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">{m.email}</p>
                </div>
              ))
            )}
          </TeamGroup>

          <div className="mt-3 space-y-2 rounded-md border border-border px-3 py-3">
            <p className="text-xs font-medium text-foreground">Invite a mentor</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
                placeholder="Name"
                className="h-8 text-xs"
                aria-label="Mentor name"
              />
              <Input
                value={mentorEmail}
                onChange={(e) => setMentorEmail(e.target.value)}
                placeholder="Email"
                className="h-8 text-xs"
                aria-label="Mentor email"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" disabled={!mentorName.trim() || !mentorEmail.trim()} onClick={inviteMentor}>
                <UserPlus className="mr-1.5 h-3.5 w-3.5" /> Send invite
              </Button>
              <Button size="sm" variant="outline" disabled title="Coming soon — search your Founder Match pool for a mentor">
                <Users2 className="mr-1.5 h-3.5 w-3.5" /> Find from founder-match pool
              </Button>
            </div>
          </div>
        </Section>

        {/* Notes — one running timestamped log (IP-manager notes + founder updates + system) */}
        <Section title="Notes & updates">
          <div className="space-y-2">
            <Textarea
              rows={2}
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note — timestamped and attributed to you."
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!noteDraft.trim()}
              onClick={() => {
                appendNote(noteDraft.trim());
                setNoteDraft("");
                notify("Note added.");
              }}
            >
              <MessageSquarePlus className="mr-1.5 h-3.5 w-3.5" /> Add note
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            {idea.noteLog.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            ) : (
              idea.noteLog.map((n) => <NoteRow key={n.id} note={n} />)
            )}
          </div>
        </Section>

        <div className="px-6 py-4 text-[11px] text-muted-foreground/70">
          Updated {idea.updated}
        </div>
      </aside>
    </div>
  );
}

/* ── Screen 2: Import invention disclosure ───────────────────────────────── */

function IntakeScreen({
  onAdd, onOpenIdea, gotoPipeline,
}: {
  onAdd: (idea: Omit<IpIdea, "id">) => number;
  onOpenIdea: (id: number) => void;
  gotoPipeline: () => void;
}) {
  /* Top chooser: bring in one disclosure (PDF auto-fill) vs many (spreadsheet).
     One flow is revealed at a time — progressive disclosure, not two shouting. */
  const [mode, setMode] = useState<"single" | "batch">("single");

  /* Before import: just the upload affordance. After a mock file-select the
     structured disclosure record auto-fills and becomes editable. */
  const [imported, setImported] = useState<Disclosure | null>(null);
  const [title, setTitle] = useState("");
  const [nonConf, setNonConf] = useState("");
  const [involvement, setInvolvement] = useState<Involvement>("contact");
  const [patent, setPatent] = useState<PatentStatus>("not_filed");
  const [route, setRoute] = useState<RouteKind | "none">("none");
  const [addedId, setAddedId] = useState<number | null>(null);
  const [addedTitle, setAddedTitle] = useState("");

  /* Batch flow state: draft rows (with include/skip + editable title), then a
     success count once they land in the pipeline. */
  type DraftRow = BatchDraftRow & { include: boolean };
  const [batchRows, setBatchRows] = useState<DraftRow[] | null>(null);
  const [batchAdded, setBatchAdded] = useState<number | null>(null);

  const runBatchImport = () => {
    setBatchRows(simulateBatchImport().map((r) => ({ ...r, include: true })));
    setBatchAdded(null);
  };
  const patchRow = (key: number, p: Partial<DraftRow>) =>
    setBatchRows((rows) => (rows ? rows.map((r) => (r.key === key ? { ...r, ...p } : r)) : rows));
  const rowReady = (r: DraftRow) => r.title.trim().length > 0 && r.nonConfidentialSummary.trim().length > 0;
  const includedCount = batchRows?.filter((r) => r.include).length ?? 0;

  const commitBatch = () => {
    if (!batchRows) return;
    const rows = batchRows.filter((r) => r.include);
    rows.forEach((r) => onAdd(mkBatchDraft(r)));
    setBatchAdded(rows.length);
    setBatchRows(null);
  };

  const simulateImport = () => {
    // Deep-clone so edits don't mutate the shared sample.
    const d: Disclosure = JSON.parse(JSON.stringify(SAMPLE_IMPORTED_DISCLOSURE));
    setImported(d);
    setTitle("Rapid point-of-care biomarker chip");
    setNonConf("");
    setPatent("not_filed");
    setInvolvement("cofounder");
    setRoute("none");
    setAddedId(null);
  };

  const patchDisclosure = (p: Partial<Disclosure>) => setImported((cur) => (cur ? { ...cur, ...p } : cur));

  const valid = !!imported && title.trim().length > 0 && nonConf.trim().length > 0;

  const reset = () => {
    setImported(null);
    setTitle("");
    setNonConf("");
    setInvolvement("contact");
    setPatent("not_filed");
    setRoute("none");
  };

  const submit = () => {
    if (!valid || !imported) return;
    const chosen: RouteKind | null = route === "none" ? null : route;
    const id = onAdd({
      title: title.trim(),
      nonConfidentialSummary: nonConf.trim(),
      university: UNIVERSITY,
      involvement,
      patentStatus: patent,
      disclosure: imported,
      stage: chosen ? "routed" : "new",
      onHold: false,
      route: chosen,
      published: chosen === "founder_match",
      updated: "Just now",
      noteLog: [],
      interests: [],
      mentors: [],
      ...(chosen === "hackathon" ? { hackathonTracking: { event: null, pickedBy: null, built: null } } : {}),
    });
    setAddedId(id);
    setAddedTitle(title.trim());
    reset();
  };

  return (
    <>
      <PageHeader
        title="Import invention disclosure"
        subtitle="Bring in a single disclosure form, or a whole spreadsheet at once. Either way it lands in your pipeline for review."
      />
      <div className="max-w-3xl">
        {/* Top chooser — reveal one flow at a time */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { m: "single" as const, icon: <FileUp className="h-4 w-4" />, title: "Bring in one", blurb: "Import a single USD disclosure form (PDF) — auto-fills a structured record." },
            { m: "batch" as const, icon: <FileSpreadsheet className="h-4 w-4" />, title: "Bring in many", blurb: "Import a spreadsheet (.csv / .xlsx) of disclosures and review them in a batch." },
          ].map(({ m, icon, title: t, blurb }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg border px-4 py-3 text-left transition-colors",
                mode === m ? "border-primary/60 bg-primary/5" : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className={cn("mt-0.5", mode === m ? "text-primary" : "text-muted-foreground")}>{icon}</span>
              <span>
                <span className="block text-sm font-medium text-foreground">{t}</span>
                <span className="block text-xs text-muted-foreground">{blurb}</span>
              </span>
            </button>
          ))}
        </div>

        {mode === "single" && (
        <>
        {addedId != null && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium">“{addedTitle}”</span> added — it's in the pipeline.
              </span>
            </p>
            <Button size="sm" variant="outline" className="h-7 bg-card text-xs" onClick={() => onOpenIdea(addedId)}>
              Open it <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        {!imported ? (
          /* The import affordance */
          <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <FileUp className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-foreground">Import disclosure form (PDF)</h2>
            <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
              Drop in the inventor's completed USD Invention Disclosure Form. We read the fields so you don't retype what's already on the form.
            </p>
            <Button className="mt-4" onClick={simulateImport}>
              <FileUp className="mr-1.5 h-4 w-4" /> Select disclosure PDF
            </Button>
            <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Prototype: selecting a file auto-fills a sample record. Real PDF parsing is a backend follow-up — this shows the flow.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
              <p className="flex items-center gap-2 text-sm text-emerald-800">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Disclosure imported — Tech {imported.techNumber}. Review and edit below.
              </p>
              <Button size="sm" variant="outline" className="h-7 bg-card text-xs" onClick={reset}>
                Start over
              </Button>
            </div>

            {/* Non-confidential, always-visible block */}
            <div className="space-y-4 rounded-lg border border-border bg-card p-5">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                <Eye className="h-3.5 w-3.5" /> Non-confidential — safe to show founders and the marketplace
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="in-title">Invention title</Label>
                <Input id="in-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <p className="text-xs text-muted-foreground">The form states the title is non-confidential — pulled straight from it.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-nonconf">Non-confidential summary</Label>
                <Textarea
                  id="in-nonconf"
                  rows={3}
                  value={nonConf}
                  onChange={(e) => setNonConf(e.target.value)}
                  placeholder="Write the gist of what the product is — without giving away any IP. This is the only description founders see."
                />
                <p className="text-xs text-muted-foreground">
                  You author this. Separate from the confidential abstract on the form. Required to publish to founders.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Lead inventor involvement</Label>
                <RadioGroup value={involvement} onValueChange={(v) => setInvolvement(v as Involvement)} className="gap-1.5">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cofounder" id="in-inv-cf" />
                    <Label htmlFor="in-inv-cf" className="text-sm font-normal">Wants to be a day-to-day co-founder</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contact" id="in-inv-ct" />
                    <Label htmlFor="in-inv-ct" className="text-sm font-normal">Contact only — reach out directly</Label>
                  </div>
                </RadioGroup>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Patent status</Label>
                  <Select value={patent} onValueChange={(v) => setPatent(v as PatentStatus)}>
                    <SelectTrigger aria-label="Patent status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(PATENT_LABEL) as PatentStatus[]).map((p) => (
                        <SelectItem key={p} value={p}>{PATENT_LABEL[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Route now (optional)</Label>
                  <Select value={route} onValueChange={(v) => setRoute(v as RouteKind | "none")}>
                    <SelectTrigger aria-label="Route"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not yet — land as New</SelectItem>
                      {(Object.keys(ROUTE_LABEL) as RouteKind[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROUTE_LABEL[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {route === "founder_match" && nonConf.trim().length === 0 && (
                <p className="text-[11px] text-amber-700">Founder Match needs a non-confidential summary first.</p>
              )}
            </div>

            {/* Confidential, editable-lite auto-filled record — progressive disclosure */}
            <div className="space-y-3 rounded-lg border border-border bg-card p-5">
              <p className="flex items-center gap-1.5 text-[11px] font-medium text-amber-800">
                <Lock className="h-3.5 w-3.5" /> Confidential — from the disclosure form. TTO-only; never shown to founders.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="in-brief" className="text-xs">Brief summary (confidential abstract, Section 4)</Label>
                <Textarea
                  id="in-brief"
                  rows={3}
                  value={imported.briefSummary}
                  onChange={(e) => patchDisclosure({ briefSummary: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="in-adv" className="text-xs">Advantages</Label>
                  <Textarea id="in-adv" rows={2} value={imported.advantages} onChange={(e) => patchDisclosure({ advantages: e.target.value })} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="in-lim" className="text-xs">Limitations</Label>
                  <Textarea id="in-lim" rows={2} value={imported.limitations} onChange={(e) => patchDisclosure({ limitations: e.target.value })} className="text-xs" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="in-app" className="text-xs">Applications</Label>
                <Textarea id="in-app" rows={2} value={imported.applications} onChange={(e) => patchDisclosure({ applications: e.target.value })} className="text-xs" />
              </div>

              <Collapsible title={`Inventors · ${imported.inventors.length}`} icon={<Users2 className="h-3.5 w-3.5 text-muted-foreground" />} defaultOpen>
                <div className="space-y-2">
                  {imported.inventors.map((inv, idx) => (
                    <div key={idx} className="rounded-md border border-border px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-foreground">{inv.name}</p>
                        <span className="text-[11px] tabular-nums text-muted-foreground">{inv.inventorshipPct}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{inv.title} · {inv.department}</p>
                      <p className="text-[11px] text-muted-foreground/80">{inv.email}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground/70">Auto-filled from the form (up to 5). Inventor edits are a backend follow-up.</p>
              </Collapsible>

              <Collapsible title={`Funding · ${imported.funding.length}`} icon={<Landmark className="h-3.5 w-3.5 text-muted-foreground" />}>
                <div className="space-y-2">
                  {imported.funding.map((f, idx) => (
                    <div key={idx} className="rounded-md border border-border px-2.5 py-2">
                      <p className="text-xs font-medium text-foreground">{f.sponsorName}</p>
                      <p className="text-[11px] text-muted-foreground">{FUNDING_SOURCE_LABEL[f.sourceType]} · {f.awardNumber}</p>
                    </div>
                  ))}
                </div>
              </Collapsible>

              <Collapsible title="Public-disclosure history" icon={<ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />}>
                <Field label="Already disclosed externally?" value={imported.disclosedExternally ? `Yes — ${imported.disclosedExternallyDetails}` : "No"} />
                <Field label="Planned disclosure?" value={imported.plannedDisclosure ? `Yes — ${imported.plannedDisclosureDetails}` : "No"} />
              </Collapsible>

              <Collapsible title="Stage, dates & data/materials" icon={<FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date of disclosure" value={imported.dateOfDisclosure} />
                  <Field label="Date of conception" value={imported.dateOfConception} />
                  <Field label="Reduction to practice" value={imported.dateOfReductionToPractice} />
                  <Field label="Written record" value={imported.writtenRecordExists ? "Yes" : "No"} />
                </div>
                <Field label="Invention stage" value={imported.inventionStage.map((s) => INVENTION_STAGE_LABEL[s]).join(" · ")} />
                <Field label="Data & materials" value={imported.dataMaterials.map((m) => DATA_MATERIAL_LABEL[m]).join(" · ")} />
                <Field label="Companies of interest" value={imported.companiesOfInterest} />
              </Collapsible>
            </div>

            <Button className="w-full" disabled={!valid} onClick={submit}>
              <Plus className="mr-1.5 h-4 w-4" /> Submit to pipeline
            </Button>
            {!nonConf.trim() && (
              <p className="text-center text-xs text-muted-foreground">Write the non-confidential summary to submit.</p>
            )}
          </div>
        )}
        </>
        )}

        {mode === "batch" && (
          <>
            {batchAdded != null && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
                <p className="flex items-center gap-2 text-sm text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>
                    <span className="font-medium">{batchAdded}</span> disclosure{batchAdded === 1 ? "" : "s"} added to the pipeline as New.
                  </span>
                </p>
                <Button size="sm" variant="outline" className="h-7 bg-card text-xs" onClick={gotoPipeline}>
                  View in pipeline <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            )}

            {batchRows == null ? (
              /* Select-spreadsheet affordance */
              <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <FileSpreadsheet className="h-6 w-6 text-primary" />
                </div>
                <h2 className="mt-4 text-base font-semibold text-foreground">Select spreadsheet (.csv / .xlsx)</h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm text-muted-foreground">
                  Drop in a spreadsheet with a row per disclosure — title, non-confidential summary, lead inventor, suggested route. Review them before anything lands.
                </p>
                <Button className="mt-4" onClick={runBatchImport}>
                  <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Select spreadsheet
                </Button>
                <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80">
                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                  Prototype: this loads sample rows. Real spreadsheet parsing is a backend follow-up — this shows the flow.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-2.5">
                  <p className="flex items-center gap-2 text-sm text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    {batchRows.length} rows read — review, edit titles, and pick which to bring in.
                  </p>
                  <Button size="sm" variant="outline" className="h-7 bg-card text-xs" onClick={() => setBatchRows(null)}>
                    Start over
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-card">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-[48%]">Title</TableHead>
                        <TableHead>Lead inventor</TableHead>
                        <TableHead>Suggested route</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batchRows.map((r) => {
                        const ready = rowReady(r);
                        return (
                          <TableRow key={r.key} className={cn("hover:bg-transparent", !r.include && "opacity-45")}>
                            <TableCell className="py-2">
                              <Checkbox
                                checked={r.include}
                                onCheckedChange={(v) => patchRow(r.key, { include: !!v })}
                                aria-label={`Include ${r.title}`}
                              />
                            </TableCell>
                            <TableCell className="py-2">
                              <Input
                                value={r.title}
                                onChange={(e) => patchRow(r.key, { title: e.target.value })}
                                className="h-8 w-full text-xs"
                                title={r.title}
                                aria-label="Draft title"
                              />
                              {!r.nonConfidentialSummary.trim() && (
                                <p className="mt-1 text-[11px] text-amber-700">No summary on the sheet — add one before publishing to founders.</p>
                              )}
                            </TableCell>
                            <TableCell className="text-xs text-foreground/80">
                              <p className="whitespace-nowrap">{r.leadInventor}</p>
                              <p className="whitespace-nowrap text-[11px] text-muted-foreground">{r.department}</p>
                            </TableCell>
                            <TableCell>
                              {r.suggestedRoute ? <RouteBadge route={r.suggestedRoute} /> : <span className="text-xs text-muted-foreground/60">—</span>}
                            </TableCell>
                            <TableCell>
                              {ready ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 whitespace-nowrap">
                                  <CheckCircle2 className="h-3 w-3" /> Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 whitespace-nowrap">
                                  Needs summary
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button disabled={includedCount === 0} onClick={commitBatch}>
                    <Rows3 className="mr-1.5 h-4 w-4" /> Add {includedCount} disclosure{includedCount === 1 ? "" : "s"} to pipeline
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Each lands as a New disclosure with a skeleton record (tech number USD-BATCH-00x). "Needs summary" rows still import — add the gist before listing them to founders.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
