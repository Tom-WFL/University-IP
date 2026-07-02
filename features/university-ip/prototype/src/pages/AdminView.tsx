import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Container, ConfirmedHint, RoleHero, PageHeader, BackToHome,
} from "@/components/Shell";
import { UNIVERSITIES, type UniversityOrg, type UniPerson } from "@/data";
import {
  Building2, ShieldCheck, GraduationCap, FolderKanban, Rocket, Trophy,
  HeartHandshake, PauseCircle, Globe2, Plus, CheckCircle2, UserCog, Activity,
  Pencil, Trash2, UserX, UserCheck, ArrowRight, Ban, RotateCcw,
} from "lucide-react";

/* Wildfire Admin / Super Admin — WFL staff. CONFIRMED at gate 2 (2026-07-02,
   promoted from REC-2): manages what universities are in the system, what's
   going through them (pipeline/volume per university), and who's attached to
   them (IP Managers, professors). Gate-3 (2026-07-02): the management
   mechanics are confirmed — EDIT a university, REMOVE a university, REASSIGN
   an IP Manager, DEACTIVATE a university and/or people — plus a clickable
   per-university drill-down detail page showing which professors are tied to
   which university. Confirmation dialogs on destructive actions are the
   obvious rendering. */

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

function StatusChip({ active, activeLabel = "Active", inactiveLabel = "Deactivated" }: { active: boolean; activeLabel?: string; inactiveLabel?: string }) {
  return active ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" /> {activeLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Ban className="h-3 w-3" /> {inactiveLabel}
    </span>
  );
}

function PipelineChips({ u }: { u: UniversityOrg }) {
  return (
    <div className="flex flex-wrap gap-1">
      <CountChip icon={Rocket} label="Founder route" value={u.ideas.founder} className="bg-orange-50 border-orange-200 text-orange-700" />
      <CountChip icon={Trophy} label="Hackathon route" value={u.ideas.hackathon} className="bg-sky-50 border-sky-200 text-sky-700" />
      <CountChip icon={HeartHandshake} label="Founder Match route" value={u.ideas.founderMatch} className="bg-emerald-50 border-emerald-200 text-emerald-700" />
      <CountChip icon={PauseCircle} label="On Hold" value={u.ideas.hold} className="bg-slate-100 border-slate-300 text-slate-700" />
      <CountChip icon={FolderKanban} label="Not routed yet" value={u.ideas.unrouted} className="bg-white border-border text-muted-foreground" />
    </div>
  );
}

export default function AdminView() {
  const [universities, setUniversities] = useState<UniversityOrg[]>(UNIVERSITIES);
  const [openId, setOpenId] = useState<number | null>(null);
  const [newName, setNewName] = useState("");
  const [newManager, setNewManager] = useState("");
  const [provisioned, setProvisioned] = useState<string | null>(null);

  const patch = (id: number, p: Partial<UniversityOrg> | ((u: UniversityOrg) => Partial<UniversityOrg>)) =>
    setUniversities((prev) => prev.map((u) => (u.id === id ? { ...u, ...(typeof p === "function" ? p(u) : p) } : u)));
  const removeUniversity = (id: number) => {
    setUniversities((prev) => prev.filter((u) => u.id !== id));
    setOpenId(null);
  };

  const totals = {
    ipManagers: universities.reduce((n, u) => n + u.ipManagers.length, 0),
    professors: universities.reduce((n, u) => n + u.professors.length, 0),
    ideas: universities.reduce((n, u) => n + u.ideas.total, 0),
    published: universities.reduce((n, u) => n + u.ideas.published, 0),
  };

  const open = universities.find((u) => u.id === openId);
  if (open) {
    return (
      <Container>
        <BackToHome onBack={() => setOpenId(null)} label="All universities" />
        <UniversityDetail
          u={open}
          onPatch={(p) => patch(open.id, p)}
          onRemove={() => removeUniversity(open.id)}
        />
      </Container>
    );
  }

  return (
    <Container>
      <RoleHero
        role="Wildfire Admin / Super Admin — WFL staff"
        name="Alex Rivera"
        tagline="Confirmed at gate 2 (promoted from REC-2): manages what universities are in the system, what's going through them (IP pipeline and volume per university), and who's attached to them (IP Managers, professors). Gate-3: also edits a university, removes a university, reassigns an IP Manager, and deactivates a university and/or people — click any university row for its full detail page."
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
            Per university: IP volume and disposition breakdown (Founder / Hackathon / Founder Match / Hold), publish state, and the attached IP Managers and professors. Gate-3: click a university to drill into its detail page — its people, pipeline, status, and management actions.
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
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {universities.map((u) => (
                <TableRow key={u.id} className="cursor-pointer" onClick={() => setOpenId(u.id)}>
                  <TableCell>
                    <p className="font-medium text-foreground">{u.name}</p>
                    <p className="text-xs text-muted-foreground">Provisioned {u.provisioned}{!u.active && " · DEACTIVATED"}</p>
                  </TableCell>
                  <TableCell>
                    {u.ipManagers.length > 0 ? (
                      <div className="space-y-0.5">
                        {u.ipManagers.map((m) => (
                          <p key={m.name} className={`text-sm flex items-center gap-1.5 ${m.active ? "" : "line-through text-muted-foreground"}`}>
                            <UserCog className="h-3.5 w-3.5 text-muted-foreground" /> {m.name}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-amber-700">None assigned yet</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Gate-3: which professors are tied to which university */}
                    <p className="text-sm inline-flex items-center gap-1.5">
                      <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" /> {u.professors.length}
                    </p>
                    <p className="text-xs text-muted-foreground max-w-[26ch] truncate">
                      {u.professors.map((p) => p.name).join(", ") || "—"}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{u.ideas.total}</TableCell>
                  <TableCell><PipelineChips u={u} /></TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      <Globe2 className="h-3 w-3" /> {u.ideas.published}/{u.ideas.total}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setOpenId(u.id); }}>
                      Manage <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ConfirmedHint>
            Gate-2 (was REC-2): the Wildfire Admin manages what universities are in the system, what's going through them, and who's attached to them. Gate-3: each row drills into a full university detail page with edit / remove / reassign / deactivate.
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
                  id: Math.max(0, ...prev.map((u) => u.id)) + 1,
                  name: newName.trim(),
                  active: true,
                  ipManagers: [{ name: newManager.trim(), active: true }],
                  professors: [],
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
        </CardContent>
      </Card>
    </Container>
  );
}

/* ── Gate-3: per-university drill-down detail page ─────────────────────────
   "Click University of South Dakota — it takes you deeper": the university's
   IP Managers, professors, ideas/pipeline, status, and the management
   actions (edit / remove / reassign IP Manager / deactivate). */

type PendingAction =
  | { kind: "edit" }
  | { kind: "remove" }
  | { kind: "deactivate-uni" }
  | { kind: "reactivate-uni" }
  | { kind: "reassign"; person: UniPerson }
  | { kind: "toggle-person"; person: UniPerson; group: "ipManagers" | "professors" };

function UniversityDetail({
  u, onPatch, onRemove,
}: {
  u: UniversityOrg;
  onPatch: (p: Partial<UniversityOrg> | ((u: UniversityOrg) => Partial<UniversityOrg>)) => void;
  onRemove: () => void;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [editName, setEditName] = useState(u.name);
  const [reassignTo, setReassignTo] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };
  const close = () => setPending(null);

  const togglePerson = (group: "ipManagers" | "professors", person: UniPerson) => {
    onPatch((cur) => ({
      [group]: cur[group].map((p) => (p.name === person.name ? { ...p, active: !p.active } : p)),
    }) as Partial<UniversityOrg>);
    flash(`${person.name} ${person.active ? "deactivated" : "reactivated"}.`);
  };

  return (
    <>
      <PageHeader
        icon={<Building2 className="h-5 w-5" />}
        title={u.name}
        subtitle="Gate-3: the deeper, more robust university page — this organization's IP Managers, professors, ideas/pipeline, status, and the management actions (edit, remove, reassign IP Manager, deactivate)."
      />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <StatusChip active={u.active} activeLabel="Active organization" inactiveLabel="Deactivated organization" />
        <span className="text-xs text-muted-foreground">Provisioned {u.provisioned}</span>
      </div>

      {notice && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {notice}
        </div>
      )}

      {!u.active && (
        <div className="mb-4 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-700 flex items-center gap-2">
          <Ban className="h-4 w-4 shrink-0" /> This university organization is deactivated — its IP Managers and professors can't work in it until it's reactivated.
        </div>
      )}

      {/* Management actions (gate-3) */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserCog className="h-4 w-4 text-orange-500" /> Manage this university</CardTitle>
          <CardDescription>Gate-3 (confirmed): edit the university, remove it, reassign its IP Manager, deactivate it and/or its people — destructive actions ask for confirmation.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => { setEditName(u.name); setPending({ kind: "edit" }); }}>
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit university
          </Button>
          {u.active ? (
            <Button variant="outline" size="sm" onClick={() => setPending({ kind: "deactivate-uni" })}>
              <Ban className="h-3.5 w-3.5 mr-1" /> Deactivate university
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setPending({ kind: "reactivate-uni" })}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reactivate university
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={() => setPending({ kind: "remove" })}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove university
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-4 w-4 text-orange-500" /> What's going through {u.name}</CardTitle>
          <CardDescription>IP volume and disposition breakdown for this organization.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <MetricTile label="IP ideas" value={String(u.ideas.total)} icon={FolderKanban} />
            <MetricTile label="Published" value={`${u.ideas.published}/${u.ideas.total}`} icon={Globe2} />
            <MetricTile label="IP Managers" value={String(u.ipManagers.length)} icon={UserCog} />
            <MetricTile label="Professors" value={String(u.professors.length)} icon={GraduationCap} />
          </div>
          <PipelineChips u={u} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* IP Managers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserCog className="h-4 w-4 text-orange-500" /> IP Managers ({u.ipManagers.length})</CardTitle>
            <CardDescription>This university's assigned IP Manager(s) — reassign or deactivate (gate-3).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {u.ipManagers.map((m) => (
                  <TableRow key={m.name}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><StatusChip active={m.active} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => { setReassignTo(""); setPending({ kind: "reassign", person: m }); }}>
                          <UserCog className="h-3.5 w-3.5 mr-1" /> Reassign
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPending({ kind: "toggle-person", person: m, group: "ipManagers" })}>
                          {m.active ? <><UserX className="h-3.5 w-3.5 mr-1" /> Deactivate</> : <><UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate</>}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {u.ipManagers.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-sm text-amber-700">None assigned yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Professors tied to this university (gate-3) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-orange-500" /> Professors tied to {u.name} ({u.professors.length})</CardTitle>
            <CardDescription>Gate-3: which professors are tied to this university — professor-founders carrying the university-IP-origin tag.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {u.professors.map((p) => (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.dept ?? "—"}</TableCell>
                    <TableCell><StatusChip active={p.active} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setPending({ kind: "toggle-person", person: p, group: "professors" })}>
                        {p.active ? <><UserX className="h-3.5 w-3.5 mr-1" /> Deactivate</> : <><UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate</>}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {u.professors.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="text-sm text-muted-foreground">No professors attached yet.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <ConfirmedHint>
        Gate-3 (confirmed): edit / remove / reassign / deactivate mechanics and this per-university drill-down. Confirmation dialogs on destructive actions are the obvious rendering.
      </ConfirmedHint>

      {/* ── Dialogs ─────────────────────────────────────────────────────────── */}

      {/* Edit university */}
      <Dialog open={pending?.kind === "edit"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Pencil className="h-4 w-4" /> Edit university</DialogTitle>
            <DialogDescription>Gate-3: the Wildfire Admin can edit a university's details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="edit-uni-name">University name</Label>
            <Input id="edit-uni-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              disabled={!editName.trim()}
              onClick={() => { onPatch({ name: editName.trim() }); flash("University details updated."); close(); }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove university (destructive → confirm) */}
      <Dialog open={pending?.kind === "remove"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Remove {u.name}?</DialogTitle>
            <DialogDescription>
              This removes the university organization from the system — its IP Managers, professors, and {u.ideas.total} IP ideas with it. This is the confirmation step (obvious rendering) on a destructive action.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button variant="destructive" onClick={() => { close(); onRemove(); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove university
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / reactivate university (destructive → confirm) */}
      <Dialog open={pending?.kind === "deactivate-uni" || pending?.kind === "reactivate-uni"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {u.active ? <><Ban className="h-4 w-4 text-destructive" /> Deactivate {u.name}?</> : <><RotateCcw className="h-4 w-4" /> Reactivate {u.name}?</>}
            </DialogTitle>
            <DialogDescription>
              {u.active
                ? "The organization stays in the system but is switched off — its people can't work in it until it's reactivated."
                : "Switch this organization back on so its IP Managers and professors can work in it again."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              variant={u.active ? "destructive" : "default"}
              onClick={() => {
                onPatch({ active: !u.active });
                flash(u.active ? "University deactivated." : "University reactivated.");
                close();
              }}
            >
              {u.active ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign IP Manager */}
      <Dialog open={pending?.kind === "reassign"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Reassign IP Manager</DialogTitle>
            <DialogDescription>
              Gate-3: replace {pending?.kind === "reassign" ? pending.person.name : ""} as an IP Manager of {u.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reassign-to">New IP Manager</Label>
            <Input id="reassign-to" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} placeholder="e.g. Dana Wolfe" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              disabled={!reassignTo.trim()}
              onClick={() => {
                if (pending?.kind !== "reassign") return;
                const from = pending.person.name;
                const to = reassignTo.trim();
                onPatch((cur) => ({
                  ipManagers: cur.ipManagers.map((m) => (m.name === from ? { name: to, active: true } : m)),
                }));
                flash(`IP Manager reassigned: ${from} → ${to}.`);
                close();
              }}
            >
              Reassign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate / reactivate a person (destructive → confirm) */}
      <Dialog open={pending?.kind === "toggle-person"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pending?.kind === "toggle-person" && pending.person.active
                ? <><UserX className="h-4 w-4 text-destructive" /> Deactivate {pending.person.name}?</>
                : <><UserCheck className="h-4 w-4" /> Reactivate {pending?.kind === "toggle-person" ? pending.person.name : ""}?</>}
            </DialogTitle>
            <DialogDescription>
              {pending?.kind === "toggle-person" && pending.person.active
                ? "They stay attached to the university but can't work in the app until reactivated. This is the confirmation step on a destructive action."
                : "Restore this person's access."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              variant={pending?.kind === "toggle-person" && pending.person.active ? "destructive" : "default"}
              onClick={() => {
                if (pending?.kind !== "toggle-person") return;
                togglePerson(pending.group, pending.person);
                close();
              }}
            >
              {pending?.kind === "toggle-person" && pending.person.active ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
