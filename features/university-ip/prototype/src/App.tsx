import { useState } from "react";
import { PrototypeBanner, BrandHeader, TenancyLegend } from "@/components/Shell";
import IPManagerView from "@/pages/IPManagerView";
import ProfessorView from "@/pages/ProfessorView";
import CofounderView from "@/pages/CofounderView";
import AdminView from "@/pages/AdminView";

const ROLES = ["IP Manager", "Professor (Founder)", "Founder (Match)", "Wildfire Admin"] as const;

export default function App() {
  const [role, setRole] = useState<string>("IP Manager");

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <PrototypeBanner />
      <BrandHeader roles={[...ROLES]} active={role} onSelect={setRole} />
      <TenancyLegend />
      {role === "IP Manager" && <IPManagerView />}
      {role === "Professor (Founder)" && <ProfessorView />}
      {role === "Founder (Match)" && <CofounderView />}
      {role === "Wildfire Admin" && <AdminView />}
      <footer className="mt-auto border-t border-border py-4 text-center text-xs text-muted-foreground">
        University IP — validation prototype · built on the real Wildfire app stack (vendored tokens + shadcn/ui) · throwaway, no backend
      </footer>
    </div>
  );
}
