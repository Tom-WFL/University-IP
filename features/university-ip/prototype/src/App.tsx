import { useMemo, useState } from "react";
import { Layers, FileUp, GraduationCap, Compass, Building2, Radar, SlidersHorizontal } from "lucide-react";
import Sidebar, { type NavItem, type Persona } from "@/components/Sidebar";
import IPManagerView from "@/pages/IPManagerView";
import ProfessorView from "@/pages/ProfessorView";
import CofounderView from "@/pages/CofounderView";
import AdminView from "@/pages/AdminView";
import TechScoutView from "@/pages/TechScoutView";
import SettingsView from "@/pages/SettingsView";
import {
  ALL_SEED_IDEAS, UNIVERSITY, IP_MANAGER, FOUNDER_NAME, PROFESSOR_PERSONA, ADMIN_NAME,
  DEFAULT_STAGES, firstStageOfKind, isOverdue,
  type IpIdea, type PipelineStage, type StageKind,
} from "@/data";

const ROLES = ["IP Manager", "Tech Scout", "Professor", "Founder (Match)", "Wildfire Admin"] as const;
type Role = (typeof ROLES)[number];

const TECH_SCOUT_NAME = "Jordan Pike";

const PERSONAS: Record<Role, Persona> = {
  "IP Manager": { name: IP_MANAGER, detail: `IP Manager · ${UNIVERSITY}` },
  "Tech Scout": { name: TECH_SCOUT_NAME, detail: `Tech Scout · ${UNIVERSITY}` },
  Professor: { name: PROFESSOR_PERSONA, detail: "Professor · Biomedical Engineering" },
  "Founder (Match)": { name: FOUNDER_NAME, detail: "Founder · Wildfire Network" },
  "Wildfire Admin": { name: ADMIN_NAME, detail: "Wildfire Labs staff" },
};

const CUSTOM_DOTS = ["bg-teal-500", "bg-fuchsia-500", "bg-orange-500", "bg-cyan-500"];

export default function App() {
  const [role, setRole] = useState<Role>("IP Manager");
  const [ipmScreen, setIpmScreen] = useState<"pipeline" | "intake">("pipeline");
  const [scoutScreen, setScoutScreen] = useState<"outcomes" | "stages">("outcomes");
  const [adminScreen, setAdminScreen] = useState<"universities" | "stages">("universities");

  /* Shared client state so the cross-role flow works: a founder expresses
     interest → the interest record sits on the idea itself → the IP Manager's
     attention strip and idea detail pick it up. No backend. */
  const [ideas, setIdeas] = useState<IpIdea[]>(ALL_SEED_IDEAS);

  /* ONE shared, global pipeline-stage list (not per-route). Customizable via
     Settings; every view reads the same list so the pipeline stays coherent. */
  const [stages, setStages] = useState<PipelineStage[]>(DEFAULT_STAGES);

  const updateIdea = (id: number, patch: Partial<IpIdea> | ((i: IpIdea) => Partial<IpIdea>)) =>
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, updated: "Just now", ...(typeof patch === "function" ? patch(i) : patch) } : i
      )
    );

  /* Returns the new idea's id so intake can jump straight to it. */
  const addIdea = (idea: Omit<IpIdea, "id">): number => {
    const id = Math.max(...ideas.map((i) => i.id)) + 1;
    setIdeas((prev) => [...prev, { ...idea, id }]);
    return id;
  };

  /* ── Stage-list mutations (Settings) ─────────────────────────────────────
     System anchors keep their kind + special behavior; they are renamable and
     reorderable but never removable. Custom stages are inert markers. Removing
     a stage / restoring defaults re-homes any idea sitting on a vanished id so
     data never dangles. */
  const renameStage = (id: string, label: string) =>
    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, label } : s)));

  const moveStage = (id: string, dir: -1 | 1) =>
    setStages((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });

  const addStage = () =>
    setStages((prev) => {
      const custom: PipelineStage = {
        id: `custom-${Date.now()}`,
        label: "New stage",
        kind: "custom" as StageKind,
        dot: CUSTOM_DOTS[prev.filter((s) => !s.system).length % CUSTOM_DOTS.length],
        system: false,
      };
      /* Insert just before the terminal anchor so it reads as mid-pipeline. */
      const termIdx = prev.findIndex((s) => s.kind === "terminal");
      if (termIdx < 0) return [...prev, custom];
      return [...prev.slice(0, termIdx), custom, ...prev.slice(termIdx)];
    });

  const removeStage = (id: string) => {
    const idx = stages.findIndex((s) => s.id === id);
    const fallback = stages[idx - 1]?.id ?? stages[0]?.id ?? "new";
    setIdeas((prev) => prev.map((i) => (i.stage === id ? { ...i, stage: fallback } : i)));
    setStages((prev) => prev.filter((s) => s.id !== id));
  };

  const restoreDefaults = () => {
    const valid = new Set(DEFAULT_STAGES.map((s) => s.id));
    setIdeas((prev) => prev.map((i) => (valid.has(i.stage) ? i : { ...i, stage: "new" })));
    setStages(DEFAULT_STAGES);
  };

  const expressInterest = (ideaId: number) =>
    updateIdea(ideaId, (i) =>
      i.interests.some((n) => n.founder === FOUNDER_NAME)
        ? {}
        : {
            interests: [
              ...i.interests,
              {
                id: Math.max(0, ...i.interests.map((n) => n.id)) + 1,
                founder: FOUNDER_NAME,
                founderContext: "Wildfire Network member",
                when: "Just now",
                status: "new" as const,
              },
            ],
          }
    );

  /* A founder posts a non-confidential update → appends to the idea's ONE note
     log, attributed as a founder update. Portal-lite; only non-conf flows. */
  const postFounderUpdate = (ideaId: number, text: string) =>
    updateIdea(ideaId, (i) => ({
      noteLog: [
        {
          id: Math.max(0, ...i.noteLog.map((n) => n.id)) + 1,
          author: FOUNDER_NAME,
          authorRole: "founder" as const,
          when: "Just now",
          text,
        },
        ...i.noteLog,
      ],
    }));

  const myIdeas = useMemo(() => ideas.filter((i) => i.university === UNIVERSITY), [ideas]);
  const intakeStage = firstStageOfKind("intake", stages);
  const needsAttention =
    myIdeas.filter((i) => intakeStage && i.stage === intakeStage.id).length +
    myIdeas.reduce((n, i) => n + i.interests.filter((x) => x.status === "new").length, 0);
  const overdueCount = myIdeas.filter((i) => isOverdue(i)).length;

  const nav: NavItem[] =
    role === "IP Manager"
      ? [
          { key: "pipeline", label: "Pipeline", icon: Layers, badge: needsAttention },
          { key: "intake", label: "Import disclosure", icon: FileUp },
        ]
      : role === "Tech Scout"
        ? [
            { key: "outcomes", label: "Outcomes", icon: Radar, badge: overdueCount },
            { key: "stages", label: "Pipeline stages", icon: SlidersHorizontal },
          ]
        : role === "Professor"
          ? [{ key: "ideas", label: "My ideas", icon: GraduationCap }]
          : role === "Founder (Match)"
            ? [{ key: "browse", label: "Founder Match", icon: Compass }]
            : [
                { key: "universities", label: "Universities", icon: Building2 },
                { key: "stages", label: "Pipeline stages", icon: SlidersHorizontal },
              ];

  const activeNav =
    role === "IP Manager"
      ? ipmScreen
      : role === "Tech Scout"
        ? scoutScreen
        : role === "Wildfire Admin"
          ? adminScreen
          : nav[0].key;

  const onNav = (k: string) => {
    if (role === "IP Manager") setIpmScreen(k as "pipeline" | "intake");
    else if (role === "Tech Scout") setScoutScreen(k as "outcomes" | "stages");
    else if (role === "Wildfire Admin") setAdminScreen(k as "universities" | "stages");
  };

  const stageEditor = (
    <SettingsView
      stages={stages}
      onRename={renameStage}
      onMove={moveStage}
      onAdd={addStage}
      onRemove={removeStage}
      onRestoreDefaults={restoreDefaults}
    />
  );

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        items={nav}
        active={activeNav}
        onNav={onNav}
        persona={PERSONAS[role]}
        roles={[...ROLES]}
        role={role}
        onRole={(r) => {
          setRole(r as Role);
          setIpmScreen("pipeline");
          setScoutScreen("outcomes");
          setAdminScreen("universities");
        }}
      />
      <main className="pl-60">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {role === "IP Manager" && (
            <IPManagerView
              ideas={myIdeas}
              updateIdea={updateIdea}
              addIdea={addIdea}
              screen={ipmScreen}
              gotoPipeline={() => setIpmScreen("pipeline")}
              stages={stages}
            />
          )}
          {role === "Tech Scout" &&
            (scoutScreen === "stages" ? stageEditor : <TechScoutView ideas={myIdeas} stages={stages} />)}
          {role === "Professor" && <ProfessorView ideas={myIdeas} stages={stages} />}
          {role === "Founder (Match)" && (
            <CofounderView ideas={ideas} onInterest={expressInterest} onPostUpdate={postFounderUpdate} />
          )}
          {role === "Wildfire Admin" && (adminScreen === "stages" ? stageEditor : <AdminView />)}
        </div>
      </main>
    </div>
  );
}
