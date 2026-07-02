import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Container, ConfirmedHint, RoleHero, GapCallout,
} from "@/components/Shell";
import { UNIVERSITIES, type UniversityOrg } from "@/data";
import {
  Building2, ShieldCheck, GraduationCap, FolderKanban, Rocket, Trophy,
  HeartHandshake, PauseCircle, Globe2, Plus, CheckCircle2, UserCog, Activity,
} from "lucide-react";

/* Wildfire Admin / Super Admin — WFL staff. CONFIRMED at gate 2 (2026-07-02,
   promoted from REC-2): manages what universities are in the system, what's
   going through them (pipeline/volume per university), and who's attached to
   them (IP Managers, professors). Sees ALL universities — unlike the
   university-scoped IP Manager. */

function MetricTile({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900 truncate">{value}</p>
      </div>
    </div>
  );
}

function CountChip({ icon: Icon, label, value, className }: { icon: any; label: string; value: number; className: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`} title={label}>
      <Icon className="h-3 w-3" /> {value}
    </span>
  );
}

export default function AdminView() {
  const [universities, setUniversities] = useState<UniversityOrg[]>(UNIVERSITIES);
  const [newName, setNewName] = useState("");
  const [newManager, setNewManager] = useState("");
  const [provisioned, setProvisioned] = useState<string | null>(null);

  const totals = {
    ipManagers: universities.reduce((n, u) => n + u.ipManagers.length, 0),
    professors: universities.reduce((n, u) => n + u.professors, 0),
    ideas: universities.reduce((n, u) => n + u.ideas.total, 0),
    published: universities.reduce((n, u) => n + u.ideas.published, 0),
  };

  return (
    <Container>
      <RoleHero
        role="Wildfire Admin / Super Admin — WFL staff"
        name="Alex Rivera"
        tagline="Confirmed at gate 2 (promoted from REC-2): manages what universities are in the system, what's going through them (IP pipeline and volume per university), and who's attached to them (IP Managers, professors). Provisions each university organization and assigns its IP Manager — required before any IP can be entered."
        meta={[
          { icon: <ShieldCheck className="w-4 h-4 text-gray-400" />, label: "All universities (WFL staff)" },
          { icon: <Building2 className="w-4 h-4 text-gray-400" />, label: `${universities.length} university organizations` },
          { icon: <FolderKanban className="w-4 h-4 text-gray-400" />, label: `${totals.ideas} IP ideas in the system` },
        ]}
      />

      <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Cross-university view (Wildfire Admin only).</span> Each university stays a fully isolated organization — IP Managers still see only their own university; only WFL staff see this roll-up.
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <MetricTile label="Universities" value={String(universities.length)} icon={Building2} />
        <MetricTile label="IP Managers" value={String(totals.ipManagers)} icon={UserCog} />
        <MetricTile label="Professors attached" value={String(totals.professors)} icon={GraduationCap} />
        <MetricTile label="IP ideas (published)" value={`${totals.ideas} (${totals.published})`} icon={Globe2} />
      </div>

      {/* Universities in the system: pipeline/volume + who's attached */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-500" /> Universities — what's going through them & who's attached</CardTitle>
          <CardDescription>
            Per university: IP volume and disposition breakdown (Founder / Hackathon / Founder Match / Hold), publish state, and the attached IP Managers and professors.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>University (organization)</TableHead>
                <TableHead>IP Managers</TableHead>
                <TableHead>Professors</TableHead>
                <TableHead>IP ideas</TableHead>
                <TableHead>Pipeline (by disposition)</TableHead>
                <TableHead className="text-right">Published</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {universities.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">Provisioned {u.provisioned}</p>
                  </TableCell>
                  <TableCell>
                    {u.ipManagers.length > 0 ? (
                      <div className="space-y-0.5">
                        {u.ipManagers.map((m) => (
                          <p key={m} className="text-sm flex items-center gap-1.5">
                            <UserCog className="h-3.5 w-3.5 text-muted-foreground" /> {m}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-700">None assigned yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm inline-flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> {u.professors}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{u.ideas.total}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <CountChip icon={Rocket} label="Founder route" value={u.ideas.founder} className="bg-orange-50 border-orange-200 text-orange-700" />
                      <CountChip icon={Trophy} label="Hackathon route" value={u.ideas.hackathon} className="bg-sky-50 border-sky-200 text-sky-700" />
                      <CountChip icon={HeartHandshake} label="Founder Match route" value={u.ideas.founderMatch} className="bg-emerald-50 border-emerald-200 text-emerald-700" />
                      <CountChip icon={PauseCircle} label="On Hold" value={u.ideas.hold} className="bg-slate-100 border-slate-300 text-slate-700" />
                      <CountChip icon={FolderKanban} label="Not routed yet" value={u.ideas.unrouted} className="bg-white border-border text-muted-foreground" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Globe2 className="h-3 w-3" /> {u.ideas.published}/{u.ideas.total}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ConfirmedHint>
            Gate-2 (was REC-2): the Wildfire Admin manages what universities are in the system, what's going through them, and who's attached to them.
          </ConfirmedHint>
        </CardContent>
      </Card>

      {/* Provision a university + assign its IP Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-orange-500" /> Provision a university & assign its IP Manager</CardTitle>
          <CardDescription>
            Creates the university as its own fully isolated organization and assigns its IP Manager — the prerequisite before any IP can be entered.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {provisioned && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> "{provisioned}" provisioned as an isolated organization with its IP Manager assigned.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="uni-name">University name</Label>
              <Input id="uni-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. South Dakota State University" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uni-mgr">IP Manager to assign</Label>
              <Input id="uni-mgr" value={newManager} onChange={(e) => setNewManager(e.target.value)} placeholder="e.g. Dana Wolfe" />
            </div>
          </div>
          <Button
            disabled={!newName.trim() || !newManager.trim()}
            onClick={() => {
              setUniversities((prev) => [
                ...prev,
                {
                  id: Math.max(...prev.map((u) => u.id)) + 1,
                  name: newName.trim(),
                  ipManagers: [newManager.trim()],
                  professors: 0,
                  ideas: { total: 0, founder: 0, hackathon: 0, founderMatch: 0, hold: 0, unrouted: 0, published: 0 },
                  provisioned: "Just now",
                },
              ]);
              setProvisioned(newName.trim());
              setNewName("");
              setNewManager("");
            }}
          >
            <Building2 className="h-4 w-4 mr-1" /> Provision university
          </Button>
          <GapCallout>
            Row-level admin mechanics (editing/removing a university, reassigning an IP Manager, deactivation) were not discussed at the gate — only "manages what universities are in the system, what's going through them, and who's attached to them" is confirmed. Details TBD.
          </GapCallout>
        </CardContent>
      </Card>
    </Container>
  );
}
