import { useMemo, useState } from "react";
import { Layers, PlusCircle, GraduationCap, Compass, Building2 } from "lucide-react";
import Sidebar, { type NavItem, type Persona } from "@/components/Sidebar";
import IPManagerView from "@/pages/IPManagerView";
import ProfessorView from "@/pages/ProfessorView";
import CofounderView from "@/pages/CofounderView";
import AdminView from "@/pages/AdminView";
import {
  ALL_SEED_IDEAS, UNIVERSITY, IP_MANAGER, FOUNDER_NAME, PROFESSOR_PERSONA, ADMIN_NAME,
  type IpIdea,
} from "@/data";

const ROLES = ["IP Manager", "Professor", "Founder (Match)", "Wildfire Admin"] as const;
type Role = (typeof ROLES)[number];

const PERSONAS: Record<Role, Persona> = {
  "IP Manager": { name: IP_MANAGER, detail: `IP Manager · ${UNIVERSITY}` },
  Professor: { name: PROFESSOR_PERSONA, detail: "Professor · Biomedical Engineering" },
  "Founder (Match)": { name: FOUNDER_NAME, detail: "Founder · Wildfire Network" },
  "Wildfire Admin": { name: ADMIN_NAME, detail: "Wildfire Labs staff" },
};

export default function App() {
  const [role, setRole] = useState<Role>("IP Manager");
  const [ipmScreen, setIpmScreen] = useState<"pipeline" | "intake">("pipeline");

  /* Shared client state so the cross-role flow works: a founder expresses
     interest → the interest record sits on the idea itself → the IP Manager's
     attention strip and idea detail pick it up. No backend. */
  const [ideas, setIdeas] = useState<IpIdea[]>(ALL_SEED_IDEAS);

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

  const myIdeas = useMemo(() => ideas.filter((i) => i.university === UNIVERSITY), [ideas]);
  const needsAttention =
    myIdeas.filter((i) => i.stage === "new").length +
    myIdeas.reduce((n, i) => n + i.interests.filter((x) => x.status === "new").length, 0);

  const nav: NavItem[] =
    role === "IP Manager"
      ? [
          { key: "pipeline", label: "Pipeline", icon: Layers, badge: needsAttention },
          { key: "intake", label: "Bring IP in", icon: PlusCircle },
        ]
      : role === "Professor"
        ? [{ key: "ideas", label: "My ideas", icon: GraduationCap }]
        : role === "Founder (Match)"
          ? [{ key: "browse", label: "Founder Match", icon: Compass }]
          : [{ key: "universities", label: "Universities", icon: Building2 }];

  const activeNav = role === "IP Manager" ? ipmScreen : nav[0].key;

  return (
    <div className="min-h-dvh bg-background">
      <Sidebar
        items={nav}
        active={activeNav}
        onNav={(k) => role === "IP Manager" && setIpmScreen(k as "pipeline" | "intake")}
        persona={PERSONAS[role]}
        roles={[...ROLES]}
        role={role}
        onRole={(r) => {
          setRole(r as Role);
          setIpmScreen("pipeline");
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
            />
          )}
          {role === "Professor" && <ProfessorView ideas={myIdeas} />}
          {role === "Founder (Match)" && <CofounderView ideas={ideas} onInterest={expressInterest} />}
          {role === "Wildfire Admin" && <AdminView />}
        </div>
      </main>
    </div>
  );
}
