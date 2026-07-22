import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/Shell";
import { UNIVERSITIES, type UniversityOrg, type UniPerson } from "@/data";
import { cn } from "@/lib/utils";
import {
  Building2, Plus, CheckCircle2, UserCog, GraduationCap, Pencil, Trash2,
  UserX, UserCheck, ArrowRight, ArrowLeft, Ban, RotateCcw,
} from "lucide-react";

/* Wildfire Admin — WFL staff. Provisions university organizations, sees
   volume, and manages who's attached. Each university stays a fully
   isolated organization; only this view spans them. */

function ActiveChip({ active, on = "Active", off = "Deactivated" }: { active: boolean; on?: string; off?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs whitespace-nowrap",
        active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border bg-muted text-muted-foreground"
      )}
    >
      {active ? <CheckCircle2 className="h-3 w-3" /> : <Ban className="h-3 w-3" />} {active ? on : off}
    </span>
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

  const open = universities.find((u) => u.id === openId);
  if (open) {
    return (
      <UniversityDetail
        u={open}
        onPatch={(p) => patch(open.id, p)}
        onRemove={() => {
          setUniversities((prev) => prev.filter((u) => u.id !== open.id));
          setOpenId(null);
        }}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Universities"
        subtitle="Each university is its own isolated organization — its IP Managers see only their own pipeline. Only Wildfire staff see this roll-up."
      />

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>University</TableHead>
              <TableHead>IP Managers</TableHead>
              <TableHead>Professors</TableHead>
              <TableHead>Ideas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28 text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {universities.map((u) => (
              <TableRow key={u.id} className="cursor-pointer" onClick={() => setOpenId(u.id)}>
                <TableCell className="py-3">
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">Provisioned {u.provisioned}</p>
                </TableCell>
                <TableCell>
                  {u.ipManagers.length > 0 ? (
                    <p className="text-sm text-foreground/80">
                      {u.ipManagers.map((m) => m.name).join(", ")}
                    </p>
                  ) : (
                    <span className="text-xs text-amber-700">None assigned</span>
                  )}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-foreground/80">{u.professors.length}</TableCell>
                <TableCell>
                  <p className="text-sm tabular-nums text-foreground/80">{u.ideas.total}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.ideas.inMotion} in motion · {u.ideas.done} done
                  </p>
                </TableCell>
                <TableCell><ActiveChip active={u.active} /></TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenId(u.id);
                    }}
                  >
                    Manage <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Provision */}
      <div className="mt-6 max-w-2xl rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Provision a university</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Creates the university as an isolated organization and assigns its IP Manager — the prerequisite before any IP can come in.
        </p>
        {provisioned && (
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" /> “{provisioned}” provisioned with its IP Manager assigned.
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="uni-name">University name</Label>
            <Input
              id="uni-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. South Dakota State University"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uni-mgr">IP Manager to assign</Label>
            <Input
              id="uni-mgr"
              value={newManager}
              onChange={(e) => setNewManager(e.target.value)}
              placeholder="e.g. Dana Wolfe"
            />
          </div>
        </div>
        <Button
          className="mt-4"
          size="sm"
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
                ideas: { total: 0, inMotion: 0, done: 0 },
                provisioned: "Just now",
              },
            ]);
            setProvisioned(newName.trim());
            setNewName("");
            setNewManager("");
          }}
        >
          <Building2 className="mr-1.5 h-4 w-4" /> Provision university
        </Button>
      </div>
    </>
  );
}

/* ── Per-university management page ──────────────────────────────────────── */

type PendingAction =
  | { kind: "remove" }
  | { kind: "toggle-uni" }
  | { kind: "reassign"; person: UniPerson }
  | { kind: "toggle-person"; person: UniPerson; group: "ipManagers" | "professors" };

function UniversityDetail({
  u, onPatch, onRemove, onBack,
}: {
  u: UniversityOrg;
  onPatch: (p: Partial<UniversityOrg> | ((u: UniversityOrg) => Partial<UniversityOrg>)) => void;
  onRemove: () => void;
  onBack: () => void;
}) {
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(u.name);
  const [reassignTo, setReassignTo] = useState("");
  const [newManagerName, setNewManagerName] = useState("");
  const [newProfName, setNewProfName] = useState("");
  const [newProfDept, setNewProfDept] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 3600);
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
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All universities
      </button>

      <PageHeader
        title={u.name}
        subtitle={`Provisioned ${u.provisioned} · ${u.ideas.total} ideas — ${u.ideas.inMotion} in motion, ${u.ideas.done} done.`}
        actions={<ActiveChip active={u.active} on="Active organization" off="Deactivated organization" />}
      />

      {notice && (
        <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> {notice}
        </p>
      )}

      {!u.active && (
        <div className="mb-4 flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
          <Ban className="h-4 w-4 shrink-0" />
          This organization is deactivated — its people can't work in it until it's reactivated.
        </div>
      )}

      {/* Organization */}
      <div className="mb-6 rounded-lg border border-border bg-card p-5">
        <h2 className="text-sm font-medium text-foreground">Organization</h2>
        {editing ? (
          <form
            className="mt-3 max-w-md space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editName.trim()) return;
              onPatch({ name: editName.trim() });
              setEditing(false);
              flash("University details saved.");
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="edit-uni-name">Organization name</Label>
              <Input id="edit-uni-name" value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={!editName.trim()}>
                Save changes
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditing(false);
                  setEditName(u.name);
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditName(u.name);
                setEditing(true);
              }}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPending({ kind: "toggle-uni" })}>
              {u.active ? (
                <>
                  <Ban className="mr-1.5 h-3.5 w-3.5" /> Deactivate
                </>
              ) : (
                <>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setPending({ kind: "remove" })}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* IP Managers */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <UserCog className="h-4 w-4 text-muted-foreground" /> IP Managers · {u.ipManagers.length}
          </h2>
          <div className="mt-3 space-y-2">
            {u.ipManagers.map((m) => (
              <div key={m.name} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{m.name}</p>
                  {!m.active && <ActiveChip active={false} />}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      setReassignTo("");
                      setPending({ kind: "reassign", person: m });
                    }}
                  >
                    Reassign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setPending({ kind: "toggle-person", person: m, group: "ipManagers" })}
                  >
                    {m.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            ))}
            {u.ipManagers.length === 0 && <p className="text-sm text-amber-700">None assigned yet.</p>}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newManagerName.trim();
              if (!name) return;
              onPatch((cur) => ({ ipManagers: [...cur.ipManagers, { name, active: true }] }));
              setNewManagerName("");
              flash(`${name} assigned as an IP Manager.`);
            }}
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="assign-mgr" className="text-xs">Assign an IP Manager</Label>
              <Input
                id="assign-mgr"
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                placeholder="e.g. Dana Wolfe"
                className="h-8 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8" disabled={!newManagerName.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>

        {/* Professors */}
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 text-sm font-medium text-foreground">
            <GraduationCap className="h-4 w-4 text-muted-foreground" /> Professors · {u.professors.length}
          </h2>
          <div className="mt-3 space-y-2">
            {u.professors.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 truncate text-sm font-medium text-foreground">
                    {p.name}
                    {!p.active && <ActiveChip active={false} />}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{p.dept ?? "—"}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 shrink-0 px-2 text-xs"
                  onClick={() => setPending({ kind: "toggle-person", person: p, group: "professors" })}
                >
                  {p.active ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                </Button>
              </div>
            ))}
            {u.professors.length === 0 && <p className="text-sm text-muted-foreground">No professors attached yet.</p>}
          </div>
          <form
            className="mt-3 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const name = newProfName.trim();
              if (!name) return;
              onPatch((cur) => ({
                professors: [...cur.professors, { name, dept: newProfDept.trim() || undefined, active: true }],
              }));
              setNewProfName("");
              setNewProfDept("");
              flash(`${name} attached.`);
            }}
          >
            <div className="flex-1 space-y-1">
              <Label htmlFor="attach-prof" className="text-xs">Attach a professor</Label>
              <Input
                id="attach-prof"
                value={newProfName}
                onChange={(e) => setNewProfName(e.target.value)}
                placeholder="e.g. Dr. Lee Chen"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1">
              <Label htmlFor="attach-prof-dept" className="text-xs">Department</Label>
              <Input
                id="attach-prof-dept"
                value={newProfDept}
                onChange={(e) => setNewProfDept(e.target.value)}
                placeholder="Optional"
                className="h-8 text-xs"
              />
            </div>
            <Button type="submit" size="sm" variant="outline" className="h-8" disabled={!newProfName.trim()}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </form>
        </div>
      </div>

      {/* Confirmations on destructive actions */}
      <Dialog open={pending?.kind === "remove"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove {u.name}?</DialogTitle>
            <DialogDescription>
              This removes the organization from the system — its IP Managers, professors, and {u.ideas.total} ideas with it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => {
                close();
                onRemove();
              }}
            >
              Remove university
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={pending?.kind === "toggle-uni"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{u.active ? `Deactivate ${u.name}?` : `Reactivate ${u.name}?`}</DialogTitle>
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

      <Dialog open={pending?.kind === "reassign"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reassign IP Manager</DialogTitle>
            <DialogDescription>
              Replace {pending?.kind === "reassign" ? pending.person.name : ""} as an IP Manager of {u.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="reassign-to">New IP Manager</Label>
            <Input
              id="reassign-to"
              value={reassignTo}
              onChange={(e) => setReassignTo(e.target.value)}
              placeholder="e.g. Dana Wolfe"
            />
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

      <Dialog open={pending?.kind === "toggle-person"} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending?.kind === "toggle-person" &&
                `${pending.person.active ? "Deactivate" : "Reactivate"} ${pending.person.name}?`}
            </DialogTitle>
            <DialogDescription>
              {pending?.kind === "toggle-person" && pending.person.active
                ? "They stay attached to the university but can't work in the app until reactivated."
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
