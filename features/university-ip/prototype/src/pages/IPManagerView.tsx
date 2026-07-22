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
import {
  StageChip, HoldChip, RouteBadge, OutcomeChip, PatentChip, STAGE_DOT,
} from "@/components/chips";
import {
  UNIVERSITY, USD_PROFESSORS, STAGES, STAGE_LABEL, ROUTE_LABEL, OUTCOME_LABEL, PATENT_LABEL,
  type IpIdea, type Stage, type RouteKind, type OutcomeKind, type Involvement, type PatentStatus,
} from "@/data";
import { cn } from "@/lib/utils";
import {
  Plus, X, ArrowRight, ArrowLeft, CheckCircle2, PauseCircle, Rocket, Trophy,
  HeartHandshake, Send, GraduationCap, Sparkles,
} from "lucide-react";

/* ── View shell: pipeline ⇄ intake, with the idea detail as a slide-over ── */

export default function IPManagerView({
  ideas, updateIdea, addIdea, screen, gotoPipeline,
}: {
  ideas: IpIdea[];
  updateIdea: (id: number, patch: Partial<IpIdea> | ((i: IpIdea) => Partial<IpIdea>)) => void;
  addIdea: (idea: Omit<IpIdea, "id">) => number;
  screen: "pipeline" | "intake";
  gotoPipeline: () => void;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = ideas.find((i) => i.id === selectedId) ?? null;

  return (
    <>
      {screen === "pipeline" ? (
        <PipelineScreen ideas={ideas} onOpen={setSelectedId} />
      ) : (
        <IntakeScreen
          onAdd={addIdea}
          onOpenIdea={(id) => {
            gotoPipeline();
            setSelectedId(id);
          }}
        />
      )}
      {selected && screen === "pipeline" && (
        <IdeaPanel
          key={selected.id}
          idea={selected}
          onChange={(patch) => updateIdea(selected.id, patch)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </>
  );
}

/* ── Screen 1: Pipeline — attention strip + one table of all ideas ───────── */

type TabKey = "all" | Stage;
type AttentionFilter = "none" | "interest" | "hold";

const STAGE_ORDER: Record<Stage, number> = { new: 0, reviewing: 1, routed: 2, in_motion: 3, done: 4 };

function newInterestCount(i: IpIdea) {
  return i.interests.filter((n) => n.status === "new").length;
}

function PipelineScreen({ ideas, onOpen }: { ideas: IpIdea[]; onOpen: (id: number) => void }) {
  const [tab, setTab] = useState<TabKey>("all");
  const [attention, setAttention] = useState<AttentionFilter>("none");

  const counts = useMemo(() => {
    const byStage = Object.fromEntries(STAGES.map((s) => [s, ideas.filter((i) => i.stage === s).length])) as Record<Stage, number>;
    return {
      byStage,
      newIdeas: byStage.new,
      interests: ideas.reduce((n, i) => n + newInterestCount(i), 0),
      onHold: ideas.filter((i) => i.onHold && i.stage !== "done").length,
    };
  }, [ideas]);

  const visible = useMemo(() => {
    let list = ideas;
    if (tab !== "all") list = list.filter((i) => i.stage === tab);
    if (attention === "interest") list = list.filter((i) => newInterestCount(i) > 0);
    if (attention === "hold") list = list.filter((i) => i.onHold && i.stage !== "done");
    return [...list].sort((a, b) => STAGE_ORDER[a.stage] - STAGE_ORDER[b.stage] || a.id - b.id);
  }, [ideas, tab, attention]);

  const pickTab = (t: TabKey) => {
    setTab(t);
    setAttention("none");
  };
  const pickAttention = (f: AttentionFilter) => {
    setAttention((cur) => (cur === f ? "none" : f));
    setTab("all");
  };

  const strip: { key: AttentionFilter | "new"; count: number; label: string; dot: string; active: boolean; onClick: () => void }[] = [
    {
      key: "new",
      count: counts.newIdeas,
      label: counts.newIdeas === 1 ? "new idea to review" : "new ideas to review",
      dot: STAGE_DOT.new,
      active: tab === "new" && attention === "none",
      onClick: () => pickTab(tab === "new" ? "all" : "new"),
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
        subtitle={`${UNIVERSITY} — every idea from disclosure to outcome, in one place.`}
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
        {(["all", ...STAGES] as TabKey[]).map((t) => {
          const active = tab === t && attention === "none";
          const count = t === "all" ? ideas.length : counts.byStage[t];
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
              {t === "all" ? "All" : STAGE_LABEL[t]}
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
              <TableHead>Professor</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Patent</TableHead>
              <TableHead>Updated / outcome</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((i) => {
              const waiting = newInterestCount(i);
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
                    </div>
                    <p className="mt-0.5 max-w-[42ch] truncate text-xs text-muted-foreground">{i.summary}</p>
                  </TableCell>
                  <TableCell>
                    <p className="whitespace-nowrap text-sm text-foreground">{i.professor}</p>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{i.professorDept}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-1">
                      <StageChip stage={i.stage} />
                      {i.onHold && i.stage !== "done" && <HoldChip />}
                    </div>
                  </TableCell>
                  <TableCell><RouteBadge route={i.route} /></TableCell>
                  <TableCell><PatentChip status={i.patentStatus} /></TableCell>
                  <TableCell>
                    {i.stage === "done" && i.outcome ? (
                      <OutcomeChip outcome={i.outcome} />
                    ) : (
                      <span className="text-xs text-muted-foreground">{i.updated}</span>
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

/* ── The idea detail slide-over — everything actionable lives here ───────── */

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

function StageStepper({ idea }: { idea: IpIdea }) {
  const cur = STAGES.indexOf(idea.stage);
  return (
    <div className="flex items-center gap-1.5">
      {STAGES.map((s, i) => (
        <div key={s} className="flex min-w-0 items-center gap-1.5" style={{ flex: i < STAGES.length - 1 ? "1 1 0" : "0 0 auto" }}>
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
            {STAGE_LABEL[s]}
          </span>
          {i < STAGES.length - 1 && <span className="h-px min-w-2 flex-1 bg-border" />}
        </div>
      ))}
    </div>
  );
}

const ROUTE_OPTIONS: { r: RouteKind; icon: JSX.Element; blurb: string }[] = [
  {
    r: "founder",
    icon: <Rocket className="h-4 w-4" />,
    blurb: "The professor builds it — they join the Wildfire program as a founder.",
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
];

function IdeaPanel({
  idea, onChange, onClose,
}: {
  idea: IpIdea;
  onChange: (patch: Partial<IpIdea> | ((i: IpIdea) => Partial<IpIdea>)) => void;
  onClose: () => void;
}) {
  const [flash, notify] = useFlash();
  const [routePick, setRoutePick] = useState<RouteKind | null>(idea.route);
  const defaultOutcome: OutcomeKind =
    idea.route === "founder" ? "company_formed" : idea.route === "hackathon" ? "built_at_hackathon" : idea.route === "founder_match" ? "matched" : "passed";
  const [outcomePick, setOutcomePick] = useState<OutcomeKind>(defaultOutcome);
  const [outcomeNoteDraft, setOutcomeNoteDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState(idea.notes ?? "");
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

  const paused = idea.onHold && idea.stage !== "done";

  const advance = {
    fromNew: () => {
      onChange({ stage: "reviewing" });
      notify("Moved to Reviewing.");
    },
    route: () => {
      if (!routePick) return;
      onChange({
        stage: "routed",
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
    toMotion: () => {
      onChange({ stage: "in_motion" });
      notify("Marked in motion.");
    },
    done: () => {
      onChange({
        stage: "done",
        outcome: outcomePick,
        outcomeNote: outcomeNoteDraft.trim() || undefined,
        published: false,
      });
      notify(`Done — ${OUTCOME_LABEL[outcomePick].toLowerCase()}.`);
    },
    pass: () => {
      onChange({ stage: "done", outcome: "passed", published: false });
      notify("Passed on this idea.");
    },
    back: () => {
      if (idea.stage === "reviewing") onChange({ stage: "new" });
      if (idea.stage === "routed") onChange({ stage: "reviewing", route: null, published: false });
      if (idea.stage === "in_motion") onChange({ stage: "routed" });
      notify("Moved back a stage.");
    },
    reopen: () => {
      onChange({ stage: "in_motion", outcome: undefined, outcomeNote: undefined });
      notify("Reopened — back in motion.");
    },
  };

  const actOnInterest = (interestId: number, status: "connected" | "declined") => {
    const interest = idea.interests.find((n) => n.id === interestId);
    onChange((i) => ({
      interests: i.interests.map((n) => (n.id === interestId ? { ...n, status } : n)),
      ...(status === "connected" && i.stage === "routed" ? { stage: "in_motion" as Stage } : {}),
    }));
    notify(
      status === "connected"
        ? `Connecting ${interest?.founder ?? "the founder"} with ${idea.professor}.`
        : "Interest declined."
    );
  };

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true" aria-label={idea.title}>
      <div className="absolute inset-0 bg-foreground/25" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-[600px] flex-col overflow-y-auto border-l border-border bg-card shadow-lg">
        {/* Header */}
        <div className="border-b border-border px-6 pb-5 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <StageChip stage={idea.stage} />
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
            {idea.professor} · {idea.professorDept}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Patent: {PATENT_LABEL[idea.patentStatus]}
            {idea.disclosureRef && <> · Disclosure {idea.disclosureRef}</>}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{idea.summary}</p>
          {flash && (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" /> {flash}
            </p>
          )}
        </div>

        {/* Progress */}
        <Section
          title="Progress"
          aside={
            idea.stage !== "done" && (
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
          <StageStepper idea={idea} />

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
              {idea.stage === "new" && (
                <Button size="sm" onClick={advance.fromNew}>
                  Start reviewing <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              )}

              {idea.stage === "reviewing" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Pick a route, then move it on:</p>
                  <div className="space-y-1.5">
                    {ROUTE_OPTIONS.map(({ r, icon, blurb }) => (
                      <button
                        key={r}
                        onClick={() => setRoutePick(r)}
                        className={cn(
                          "flex w-full items-start gap-2.5 rounded-md border px-3 py-2 text-left transition-colors",
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
                          <span className="block text-xs text-muted-foreground">{blurb}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                  <Button size="sm" disabled={!routePick} onClick={advance.route}>
                    Route to {routePick ? ROUTE_LABEL[routePick] : "…"} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {idea.stage === "routed" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {idea.route === "founder" && "Once the professor starts the program, mark it in motion."}
                    {idea.route === "hackathon" && "Once a team picks it up at an event, mark it in motion."}
                    {idea.route === "founder_match" && "Connecting a founder moves it in motion automatically — or mark it yourself."}
                  </p>
                  <Button size="sm" onClick={advance.toMotion}>
                    Mark in motion <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {idea.stage === "in_motion" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">When this idea reaches its end state, record the outcome:</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={outcomePick} onValueChange={(v) => setOutcomePick(v as OutcomeKind)}>
                      <SelectTrigger className="h-8 w-52 text-xs" aria-label="Outcome">
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
                    <Button size="sm" onClick={advance.done}>
                      Mark done
                    </Button>
                  </div>
                  <Input
                    value={outcomeNoteDraft}
                    onChange={(e) => setOutcomeNoteDraft(e.target.value)}
                    placeholder="One-line outcome note (optional)"
                    className="h-8 text-xs"
                  />
                </div>
              )}

              {idea.stage === "done" && idea.outcome && (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <OutcomeChip outcome={idea.outcome} />
                    {idea.outcomeNote && <p className="text-sm text-muted-foreground">{idea.outcomeNote}</p>}
                  </div>
                  <Button size="sm" variant="outline" onClick={advance.reopen}>
                    Reopen
                  </Button>
                </div>
              )}

              {(idea.stage === "reviewing" || idea.stage === "routed" || idea.stage === "in_motion") && (
                <div className="mt-3 flex items-center gap-3">
                  <button
                    onClick={advance.back}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back a stage
                  </button>
                  {idea.stage !== "in_motion" && (
                    <button
                      onClick={advance.pass}
                      className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
                    >
                      Pass on this idea
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </Section>

        {/* Founder Match: listing + interest */}
        {idea.route === "founder_match" && (
          <Section
            title="Founder Match"
            aside={
              idea.stage !== "done" && (
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  Listed for founders
                  <Switch
                    checked={idea.published}
                    disabled={paused}
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
              {idea.stage === "done"
                ? "This idea has closed out — the listing is withdrawn."
                : paused
                  ? "Hidden from founders while on hold."
                  : idea.published
                    ? "Founders across universities can see this listing and express interest."
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
                Connect introduces the founder to {idea.professor} and moves the idea in motion.
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
                  Read from the founder program — it updates as {idea.professor} progresses.
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Program progress appears here once {idea.professor}'s founder account is active.
              </p>
            )}
          </Section>
        )}

        {/* Professor */}
        <Section title="Professor">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">{idea.professor}</p>
              <p className="text-xs text-muted-foreground">
                {idea.professorDept} · {UNIVERSITY}
              </p>
            </div>
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
                  notify(`Invite sent to ${idea.professor}.`);
                }}
              >
                <Send className="mr-1.5 h-3.5 w-3.5" /> Create profile & send invite
              </Button>
            )}
          </div>
        </Section>

        {/* Notes */}
        <Section title="Notes">
          <Textarea
            rows={3}
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="Working notes — only you see these."
            className="text-sm"
          />
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            disabled={notesDraft === (idea.notes ?? "")}
            onClick={() => {
              onChange({ notes: notesDraft.trim() || undefined });
              notify("Notes saved.");
            }}
          >
            Save notes
          </Button>
        </Section>

        <div className="px-6 py-4 text-[11px] text-muted-foreground/70">
          Updated {idea.updated}
        </div>
      </aside>
    </div>
  );
}

/* ── Screen 2: Bring IP in — six fields, each consumed downstream ────────── */

function IntakeScreen({
  onAdd, onOpenIdea,
}: {
  onAdd: (idea: Omit<IpIdea, "id">) => number;
  onOpenIdea: (id: number) => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [professor, setProfessor] = useState<string>("");
  const [involvement, setInvolvement] = useState<Involvement>("contact");
  const [patent, setPatent] = useState<PatentStatus>("not_filed");
  const [disclosureRef, setDisclosureRef] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);
  const [addedTitle, setAddedTitle] = useState("");

  const prof = USD_PROFESSORS.find((p) => p.name === professor);
  const valid = title.trim().length > 0 && summary.trim().length > 0 && !!prof;

  const reset = () => {
    setTitle("");
    setSummary("");
    setProfessor("");
    setInvolvement("contact");
    setPatent("not_filed");
    setDisclosureRef("");
  };

  const submit = () => {
    if (!valid || !prof) return;
    const id = onAdd({
      title: title.trim(),
      summary: summary.trim(),
      university: UNIVERSITY,
      professor: prof.name,
      professorDept: prof.dept,
      involvement,
      patentStatus: patent,
      disclosureRef: disclosureRef.trim() || undefined,
      stage: "new",
      onHold: false,
      route: null,
      published: false,
      updated: "Just now",
      interests: [],
    });
    setAddedId(id);
    setAddedTitle(title.trim());
    reset();
  };

  return (
    <>
      <PageHeader
        title="Bring IP in"
        subtitle="Add a piece of university IP as an idea. It lands in the pipeline as New, ready for review."
      />
      <div className="max-w-lg">
        {addedId != null && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="flex items-center gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                <span className="font-medium">“{addedTitle}”</span> added — it's in the pipeline as New.
              </span>
            </p>
            <Button size="sm" variant="outline" className="h-7 bg-card text-xs" onClick={() => onOpenIdea(addedId)}>
              Open it <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </div>
        )}

        <div className="space-y-4 rounded-lg border border-border bg-card p-5">
          <div className="space-y-1.5">
            <Label htmlFor="in-title">Title</Label>
            <Input
              id="in-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cold-chain vaccine stability indicator"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="in-summary">Summary</Label>
            <Textarea
              id="in-summary"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="One plain-language paragraph — what it is and who would pay for it."
            />
            <p className="text-xs text-muted-foreground">This is what founders read on the marketplace.</p>
          </div>

          <div className="space-y-1.5">
            <Label>Professor</Label>
            <Select value={professor} onValueChange={setProfessor}>
              <SelectTrigger aria-label="Professor">
                <SelectValue placeholder="Pick from the university directory" />
              </SelectTrigger>
              <SelectContent>
                {USD_PROFESSORS.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name} — {p.dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {prof && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <GraduationCap className="h-3.5 w-3.5" /> Department auto-filled: {prof.dept}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Professor involvement</Label>
            <RadioGroup value={involvement} onValueChange={(v) => setInvolvement(v as Involvement)} className="gap-1.5">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cofounder" id="in-inv-cf" />
                <Label htmlFor="in-inv-cf" className="text-sm font-normal">
                  Wants to be a day-to-day co-founder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="contact" id="in-inv-ct" />
                <Label htmlFor="in-inv-ct" className="text-sm font-normal">
                  Contact only — reach out directly
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Patent status</Label>
              <Select value={patent} onValueChange={(v) => setPatent(v as PatentStatus)}>
                <SelectTrigger aria-label="Patent status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(PATENT_LABEL) as PatentStatus[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {PATENT_LABEL[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="in-ref">Disclosure reference #</Label>
              <Input
                id="in-ref"
                value={disclosureRef}
                onChange={(e) => setDisclosureRef(e.target.value)}
                placeholder="Optional, e.g. USD-2026-057"
              />
            </div>
          </div>

          <Button className="w-full" disabled={!valid} onClick={submit}>
            <Plus className="mr-1.5 h-4 w-4" /> Add to pipeline
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Every field here is used downstream — nothing to fill in twice.
        </p>
      </div>
    </>
  );
}
