import { useState } from "react";
import { PrototypeBanner, BrandHeader, TenancyLegend } from "@/components/Shell";
import IPManagerView from "@/pages/IPManagerView";
import ProfessorView from "@/pages/ProfessorView";
import CofounderView from "@/pages/CofounderView";
import AdminView from "@/pages/AdminView";
import {
  SEED_IDEAS, SEED_INTERESTS, FOUNDER_NAME,
  type IpIdea, type InterestNotification,
} from "@/data";

const ROLES = ["IP Manager", "Professor (Founder)", "Founder (Match)", "Wildfire Admin"] as const;

export default function App() {
  const [role, setRole] = useState<string>("IP Manager");

  /* Shared client state, lifted so the gate-3 cross-role flow works:
     a founder expresses interest → the idea's IP Manager sees the
     notification in their inbox after switching roles. No backend. */
  const [ideas, setIdeas] = useState<IpIdea[]>(SEED_IDEAS);
  const [interests, setInterests] = useState<InterestNotification[]>(SEED_INTERESTS);

  const expressInterest = (idea: IpIdea) =>
    setInterests((prev) =>
      prev.some((n) => n.ideaId === idea.id && n.founder === FOUNDER_NAME)
        ? prev
        : [
            ...prev,
            {
              id: Math.max(0, ...prev.map((n) => n.id)) + 1,
              ideaId: idea.id,
              ideaTitle: idea.title,
              university: idea.university,
              founder: FOUNDER_NAME,
              founderContext: "Wildfire Network member",
              professor: idea.professor,
              when: "Just now",
              status: "new",
            },
          ]
    );

  const connectInterest = (id: number) =>
    setInterests((prev) => prev.map((n) => (n.id === id ? { ...n, status: "connected" } : n)));

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <PrototypeBanner />
      <BrandHeader roles={[...ROLES]} active={role} onSelect={setRole} />
      <TenancyLegend />
      {role === "IP Manager" && (
        <IPManagerView
          ideas={ideas}
          setIdeas={setIdeas}
          interests={interests}
          onConnect={connectInterest}
        />
      )}
      {role === "Professor (Founder)" && <ProfessorView />}
      {role === "Founder (Match)" && (
        <CofounderView ideas={ideas} interests={interests} onInterest={expressInterest} />
      )}
      {role === "Wildfire Admin" && <AdminView />}
      <footer className="mt-auto border-t border-border py-4 text-center text-xs text-muted-foreground">
        University IP — validation prototype · built on the real Wildfire app stack (vendored tokens + shadcn/ui) · throwaway, no backend
      </footer>
    </div>
  );
}
