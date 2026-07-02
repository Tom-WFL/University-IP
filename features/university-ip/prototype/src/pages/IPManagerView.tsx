import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Container, PageHeader, GapCallout, ParkedCallout, RecommendedTier, ConfirmedHint,
  RoleHero, NavCardGrid, CardTierBadge, BackToHome, type NavCard,
} from "@/components/Shell";
import {
  SEED_IDEAS, UNIVERSITY, IP_MANAGER, ROUTE_LABEL,
  type IpIdea, type Route, type Involvement,
} from "@/data";
import {
  Building2, FolderKanban, Upload, ListPlus, Activity, Rocket, Trophy, HeartHandshake,
  Lock, Globe2, UserRound, Phone, Users, CheckCircle2, FileSpreadsheet, Plus,
  GraduationCap, Hammer, ArrowRight, Eye, ClipboardList,
} from "lucide-react";

/* ── Small shared chips ────────────────────────────────────────────────────── */

function StateChip({ state }: { state: IpIdea["state"] }) {
  return state === "published" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <Globe2 className="h-3 w-3" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Lock className="h-3 w-3" /> Private (hold)
    </span>
  );
}

function RouteChip({ route }: { route: Route | null }) {
  if (!route) return <span className="text-xs text-muted-foreground">Not routed yet</span>;
  const styles: Record<Route, string> = {
    founder: "bg-orange-50 border-orange-200 text-orange-700",
    hackathon: "bg-sky-50 border-sky-200 text-sky-700",
    founder_match: "bg-emerald-50 border-emerald-200 text-emerald-700",
  };
  const icons: Record<Route, JSX.Element> = {
    founder: <Rocket className="h-3 w-3" />,
    hackathon: <Trophy className="h-3 w-3" />,
    founder_match: <HeartHandshake className="h-3 w-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles[route]}`}>
      {icons[route]} {ROUTE_LABEL[route]}
    </span>
  );
}

function InvolvementChip({ involvement }: { involvement: Involvement }) {
  return involvement === "cofounder" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-0.5 text-xs font-medium text-orange-700">
      <Users className="h-3 w-3" /> Day-to-day co-founder
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Phone className="h-3 w-3" /> Contact only
    </span>
  );
}

/* Metric tile — mirrors MetricTile in the live app's AdminAnalyticsDashboard */
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

/* ── View ──────────────────────────────────────────────────────────────────── */

type Screen = "home" | "portfolio" | "import" | "tracking" | "detail";

export default function IPManagerView() {
  const [screen, setScreen] = useState<Screen>("home");
  const [ideas, setIdeas] = useState<IpIdea[]>(SEED_IDEAS);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const update = (id: number, patch: Partial<IpIdea>) =>
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const addIdea = (idea: Omit<IpIdea, "id">) =>
    setIdeas((prev) => [...prev, { ...idea, id: Math.max(...prev.map((i) => i.id)) + 1 }]);

  const openDetail = (id: number) => {
    setSelectedId(id);
    setScreen("detail");
  };

  const cards: NavCard[] = [
    { key: "portfolio", title: "IP portfolio", subtitle: `${UNIVERSITY}'s IP as ideas — private by default; select & publish. Your university only.`,
      icon: <FolderKanban className="h-5 w-5" />, iconColor: "text-orange-500", iconBg: "bg-orange-50", badge: <CardTierBadge kind="new" /> },
    { key: "import", title: "Bring IP in", subtitle: "Import a spreadsheet of IP, or add a piece of IP individually.",
      icon: <Upload className="h-5 w-5" />, iconColor: "text-sky-600", iconBg: "bg-sky-50", badge: <CardTierBadge kind="gap" /> },
    { key: "tracking", title: "Tracking dashboard", subtitle: "Track every idea across its route — founder progress, hackathon builds, founder-match status.",
      icon: <Activity className="h-5 w-5" />, iconColor: "text-emerald-600", iconBg: "bg-emerald-50", badge: <CardTierBadge kind="new" /> },
  ];

  if (screen === "home") {
    return (
      <Container>
        <RoleHero
          role="IP Manager (one merged role — VPR folds in)"
          name={IP_MANAGER}
          tagline={`Bring ${UNIVERSITY}'s IP into the app as ideas, associate each with its professor, flag professor involvement, route each piece down one of three paths after talking to the professor, publish it, and track how every idea is doing on its route.`}
          meta={[
            { icon: <Building2 className="w-4 h-4 text-gray-400" />, label: `${UNIVERSITY} · your organization` },
            { icon: <FolderKanban className="w-4 h-4 text-gray-400" />, label: `${ideas.length} IP ideas` },
            { icon: <Activity className="w-4 h-4 text-gray-400" />, label: `${ideas.filter((i) => i.route).length} routed` },
          ]}
        />
        <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">University-scoped view (confirmed).</span> You see only{" "}
            <span className="font-medium">{UNIVERSITY}</span>'s IP — other universities, and their IP, are invisible to you. Each university is its own fully isolated organization.
          </span>
        </div>
        <GapCallout>
          Exact placement/section of University IP inside the app was not stated — PO to confirm. All entry happens in-app, logged in (no external data entry).
        </GapCallout>
        <div className="mt-5">
          <NavCardGrid cards={cards} onOpen={(k) => setScreen(k as Screen)} />
        </div>
        <RecommendedTier id="REC-2" title="Super Admin provisioning of universities + assigning IP Managers">
          Someone WFL-side must create each university organization and assign its IP Manager before any IP can be entered. Not confirmed — needs PO sign-off; not built here.
        </RecommendedTier>
      </Container>
    );
  }

  return (
    <Container>
      <BackToHome onBack={() => setScreen("home")} label="IP Manager home" />
      {screen === "portfolio" && (
        <PortfolioScreen ideas={ideas} onOpen={openDetail} onPublish={(sel) => sel.forEach((id) => update(id, { state: "published" }))} />
      )}
      {screen === "import" && <ImportScreen onAdd={addIdea} onImport={(rows) => rows.forEach(addIdea)} />}
      {screen === "tracking" && <TrackingScreen ideas={ideas} onOpen={openDetail} />}
      {screen === "detail" && selectedId != null && (
        <DetailScreen
          idea={ideas.find((i) => i.id === selectedId)!}
          onChange={(patch) => update(selectedId, patch)}
          onBackToList={() => setScreen("portfolio")}
        />
      )}
    </Container>
  );
}

/* ── Screen: IP portfolio (idea list) ─────────────────────────────────────── */

function PortfolioScreen({
  ideas, onOpen, onPublish,
}: {
  ideas: IpIdea[];
  onOpen: (id: number) => void;
  onPublish: (ids: number[]) => void;
}) {
  const [checked, setChecked] = useState<number[]>([]);
  const [justPublished, setJustPublished] = useState(false);
  const toggle = (id: number) =>
    setChecked((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));

  return (
    <>
      <PageHeader
        icon={<FolderKanban className="h-5 w-5" />}
        title={`IP portfolio — ${UNIVERSITY}`}
        subtitle="University IP lives here as ideas ('the research is just an idea in our world'). Everything lands PRIVATE by default — private is the hold state. Select some or all and publish."
      />
      <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>Scoped to <span className="font-semibold">{UNIVERSITY}</span> only — no other university's IP appears here (confirmed multi-university tenancy).</span>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-orange-500" /> {ideas.length} IP ideas</CardTitle>
            <CardDescription>Private by default → select & publish. Click a row to route it.</CardDescription>
          </div>
          <Button
            disabled={checked.length === 0}
            onClick={() => {
              onPublish(checked);
              setChecked([]);
              setJustPublished(true);
              setTimeout(() => setJustPublished(false), 2500);
            }}
          >
            <Globe2 className="h-4 w-4 mr-1" /> Publish selected ({checked.length})
          </Button>
        </CardHeader>
        <CardContent>
          {justPublished && (
            <div className="mb-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" /> Published. Publishing sends IP out (e.g. to Founder Match), with a separate publish path to a hackathon.
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>IP idea</TableHead>
                <TableHead>Professor (idea owner)</TableHead>
                <TableHead>Involvement</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>State</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((i) => (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => onOpen(i.id)}>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={checked.includes(i.id)} onCheckedChange={() => toggle(i.id)} aria-label={`Select ${i.title}`} />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{i.title}</p>
                    <p className="text-xs text-muted-foreground max-w-[28ch] truncate">{i.summary}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{i.professor}</p>
                    <p className="text-xs text-muted-foreground">{i.professorDept}</p>
                  </TableCell>
                  <TableCell><InvolvementChip involvement={i.involvement} /></TableCell>
                  <TableCell><RouteChip route={i.route} /></TableCell>
                  <TableCell><StateChip state={i.state} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onOpen(i.id); }}>
                      Route <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ConfirmedHint>Confirmed: private by default, then publish — private doubles as the "hold and decide later" state.</ConfirmedHint>
        </CardContent>
      </Card>
      <RecommendedTier id="REC-6" title="Private-vs-published state + empty state for this list">
        The state chips and a first-run empty state shown here are the proposed treatment — the publish model needs a clearly legible per-idea state, or a fresh list can't be read. Needs PO sign-off.
      </RecommendedTier>
      <RecommendedTier id="REC-7" title="Attribution / audit on import, routing, and publish">
        Record who imported, routed, and published each piece of IP (protects the university relationship). Not confirmed — not built here.
      </RecommendedTier>
    </>
  );
}

/* ── Screen: Bring IP in (spreadsheet import + individual add) ────────────── */

const IMPORT_ROWS: Omit<IpIdea, "id">[] = [
  {
    title: "Wind-farm blade-icing predictor",
    summary: "Imported from spreadsheet row 1 — predictive model for turbine blade icing events.",
    professor: "Dr. Owen Pruitt", professorDept: "Electrical Engineering",
    involvement: "contact", state: "private", route: null, addedVia: "spreadsheet",
  },
  {
    title: "Bio-derived road de-icer",
    summary: "Imported from spreadsheet row 2 — sugar-beet-byproduct de-icing compound.",
    professor: "Dr. Anna Voss", professorDept: "Materials Science",
    involvement: "contact", state: "private", route: null, addedVia: "spreadsheet",
  },
  {
    title: "Rural telehealth triage protocol",
    summary: "Imported from spreadsheet row 3 — validated triage decision protocol for rural clinics.",
    professor: "Dr. Sam Littlefeather", professorDept: "Earth Sciences",
    involvement: "cofounder", state: "private", route: null, addedVia: "spreadsheet",
  },
];

function ImportScreen({
  onAdd, onImport,
}: {
  onAdd: (i: Omit<IpIdea, "id">) => void;
  onImport: (rows: Omit<IpIdea, "id">[]) => void;
}) {
  const [imported, setImported] = useState(false);
  const [added, setAdded] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [professor, setProfessor] = useState("");
  const [involvement, setInvolvement] = useState<Involvement>("contact");

  return (
    <>
      <PageHeader
        icon={<Upload className="h-5 w-5" />}
        title="Bring IP into the app"
        subtitle="Two confirmed entry paths: import a spreadsheet of IP, or add a piece of IP individually with a button. Everything lands private by default, associated with its professor."
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spreadsheet import */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-sky-600" /> Import a spreadsheet</CardTitle>
            <CardDescription>Upload the university's IP list; each row becomes a private idea.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 text-center">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-3">usd-ip-export-2026.xlsx (mock)</p>
              <Button
                variant={imported ? "outline" : "default"}
                disabled={imported}
                onClick={() => { onImport(IMPORT_ROWS); setImported(true); }}
              >
                <Upload className="h-4 w-4 mr-1" /> {imported ? "Imported" : "Import 3 rows"}
              </Button>
            </div>
            {imported && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> 3 IP ideas imported as PRIVATE and associated with their professors. See them in the IP portfolio.
              </div>
            )}
            <GapCallout>
              Spreadsheet columns / required fields were not specified ("however they want to do it") — exact import mechanics TBD with Kirby/Peter.
            </GapCallout>
          </CardContent>
        </Card>

        {/* Individual add */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ListPlus className="h-4 w-4 text-orange-500" /> Add IP individually</CardTitle>
            <CardDescription>The IP is summarized outside the app and entered as an idea description.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {added && (
              <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" /> "{added}" added as a PRIVATE idea, associated with its professor.
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="ip-title">IP idea title</Label>
              <Input id="ip-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Cold-chain vaccine stability indicator" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ip-summary">Idea description</Label>
              <Textarea id="ip-summary" value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="Summary of the research, written outside the app" rows={3} />
            </div>
            <GapCallout>Exact fields of the idea description were not specified — placeholder fields only.</GapCallout>
            <div className="space-y-1.5">
              <Label htmlFor="ip-prof">Professor (idea owner)</Label>
              <Input id="ip-prof" value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="e.g. Dr. Miriam Hale" />
              <p className="text-xs text-muted-foreground">Associated as the idea owner — carried in the app as a Founder.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Professor involvement (per idea)</Label>
              <RadioGroup value={involvement} onValueChange={(v) => setInvolvement(v as Involvement)} className="gap-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cofounder" id="inv-cf" />
                  <Label htmlFor="inv-cf" className="font-normal">Wants to be a day-to-day co-founder</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="contact" id="inv-ct" />
                  <Label htmlFor="inv-ct" className="font-normal">Contact only — reach out directly</Label>
                </div>
              </RadioGroup>
            </div>
            <Button
              className="w-full"
              disabled={!title.trim() || !professor.trim()}
              onClick={() => {
                onAdd({
                  title: title.trim(), summary: summary.trim() || "(no description yet)",
                  professor: professor.trim(), professorDept: "—",
                  involvement, state: "private", route: null, addedVia: "individual",
                });
                setAdded(title.trim());
                setTitle(""); setSummary(""); setProfessor("");
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add IP (lands private)
            </Button>
          </CardContent>
        </Card>
      </div>
      <GapCallout>
        Imported professors have no account yet — the "send account information" mechanism was explicitly unspecified ("I don't know"). Parked dependency; nothing is built for it here.
      </GapCallout>
      <RecommendedTier id="REC-1" title="Professor invite / account-provisioning flow">
        Without a concrete invite-to-Founder flow, a professor on the Founder route cannot log in or run the Wildfire process. Needs PO sign-off — surfaced only, not built.
      </RecommendedTier>
    </>
  );
}

/* ── Screen: Idea detail — routing view with involvement flag ─────────────── */

function DetailScreen({
  idea, onChange, onBackToList,
}: {
  idea: IpIdea;
  onChange: (patch: Partial<IpIdea>) => void;
  onBackToList: () => void;
}) {
  const [published, setPublished] = useState(false);

  return (
    <>
      <button onClick={onBackToList} className="ml-4 text-xs text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1">
        <FolderKanban className="h-3.5 w-3.5" /> IP portfolio
      </button>
      <PageHeader
        icon={<Hammer className="h-5 w-5" />}
        title={idea.title}
        subtitle={idea.summary}
      />
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <StateChip state={idea.state} />
        <RouteChip route={idea.route} />
        <InvolvementChip involvement={idea.involvement} />
        <Badge variant="outline" className="text-xs">Added via {idea.addedVia === "spreadsheet" ? "spreadsheet import" : "individual add"}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Professor association + involvement flag */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-4 w-4 text-orange-500" /> Professor (idea owner)</CardTitle>
            <CardDescription>The professor owns all the knowledge of the idea; the university owns the IP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-foreground">{idea.professor}</p>
              <p className="text-xs text-muted-foreground">{idea.professorDept} · {UNIVERSITY}</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <GraduationCap className="h-3.5 w-3.5" /> Carried in the app as a <span className="font-medium">Founder</span> + university-IP-origin analytics tag
              </p>
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Involvement flag (confirmed, per idea)</Label>
              <RadioGroup value={idea.involvement} onValueChange={(v) => onChange({ involvement: v as Involvement })} className="gap-2">
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="cofounder" id="d-inv-cf" className="mt-0.5" />
                  <Label htmlFor="d-inv-cf" className="font-normal leading-snug">
                    Day-to-day co-founder — wants to be involved and turn the IP into a startup
                  </Label>
                </div>
                <div className="flex items-start space-x-2">
                  <RadioGroupItem value="contact" id="d-inv-ct" className="mt-0.5" />
                  <Label htmlFor="d-inv-ct" className="font-normal leading-snug">
                    Contact only — hands it off; whoever takes the idea can reach out directly
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <GapCallout>Professor has no account yet — provisioning mechanism unspecified (parked; see REC-1).</GapCallout>
          </CardContent>
        </Card>

        {/* Route selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-orange-500" /> Choose the route</CardTitle>
            <CardDescription>
              Chosen by the IP Manager AFTER talking to the professor. Each piece of IP takes exactly ONE of the three routes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(
                [
                  { r: "founder" as Route, icon: <Rocket className="h-5 w-5" />, color: "orange",
                    blurb: "Professor becomes a Founder and runs the normal Wildfire process — Founder Match brings a co-founder (two founders, as today)." },
                  { r: "hackathon" as Route, icon: <Trophy className="h-5 w-5" />, color: "sky",
                    blurb: "Good hackathon topic — mark it a pickable hackathon idea. Participants can bring their own idea OR pick this one." },
                  { r: "founder_match" as Route, icon: <HeartHandshake className="h-5 w-5" />, color: "emerald",
                    blurb: "Professor won't build it and it isn't a hackathon fit — send to Founder Match to find a founder to run with it." },
                ]
              ).map(({ r, icon, blurb }) => {
                const active = idea.route === r;
                return (
                  <button
                    key={r}
                    onClick={() => onChange({ route: r })}
                    className={`text-left rounded-lg border p-4 transition-all ${
                      active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="font-semibold text-sm">{ROUTE_LABEL[r]} route</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">{blurb}</p>
                  </button>
                );
              })}
            </div>

            {idea.route === "hackathon" && (
              <ParkedCallout>
                The separate hackathon-management system (built elsewhere) will be updated later with these learnings — here the idea is only marked/published as hackathon-pickable; no hackathon-management integration is built now. The planning-phase "select IP to include in a hackathon" notification is also parked (may not ship immediately).
              </ParkedCallout>
            )}

            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={idea.state === "published" || !idea.route}
                onClick={() => { onChange({ state: "published" }); setPublished(true); setTimeout(() => setPublished(false), 3000); }}
              >
                <Globe2 className="h-4 w-4 mr-1" />
                {idea.state === "published" ? "Published" : "Publish this idea"}
              </Button>
              {!idea.route && <span className="text-xs text-muted-foreground">Pick a route first — or leave it private (the hold state) and decide later.</span>}
              {published && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Published to the {idea.route ? ROUTE_LABEL[idea.route] : ""} destination.
                </span>
              )}
            </div>
            <ConfirmedHint>Confirmed: publish sends the idea out (e.g. to Founder Match) with a separate publish path to a hackathon; unpublished IP stays invisible downstream.</ConfirmedHint>

            <RecommendedTier id="REC-5" title="University-IP provenance label + professor contact on the published idea">
              Downstream founder-match users and hackathon participants would see this is university-owned IP and who the professor contact is (essential for contact-only professors). Needs PO sign-off — not rendered as confirmed scope.
            </RecommendedTier>
            <RecommendedTier id="REC-3" title="Wire this idea into the existing Idea/Application + Founder Match machinery">
              "It's just an idea" — the imported IP idea should connect to the existing idea/company entities and Founder Match rather than becoming a parallel silo. Wiring specifics unresolved — needs PO sign-off.
            </RecommendedTier>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/* ── Screen: Cross-route tracking dashboard ───────────────────────────────────
   Modeled on the live app's founder-tracking system:
   - src/services/founderAnalyticsService.ts (FounderProgress: currentPhase,
     lessonsCompleted/totalLessons, aiFeedbackCount, documentsRevised)
   - src/pages/AdminAnalyticsDashboard.tsx (Founders card: metric tiles +
     per-founder table with phase badge) — the framework the PO named. */

function TrackingScreen({ ideas, onOpen }: { ideas: IpIdea[]; onOpen: (id: number) => void }) {
  const byRoute = useMemo(
    () => ({
      founder: ideas.filter((i) => i.route === "founder"),
      hackathon: ideas.filter((i) => i.route === "hackathon"),
      founder_match: ideas.filter((i) => i.route === "founder_match"),
      unrouted: ideas.filter((i) => !i.route),
    }),
    [ideas]
  );

  return (
    <>
      <PageHeader
        icon={<Activity className="h-5 w-5" />}
        title={`Tracking dashboard — ${UNIVERSITY}`}
        subtitle="Confirmed at the gate: the IP Manager tracks all data associated with each IP idea across all three routes — founder-route progress through the Wildfire program, what was built at the hackathon, and how each founder match is doing."
      />
      <ConfirmedHint>
        Framework (PO-named): the app's existing founder-tracking system — the Founders analytics card (phase · lessons · engagement) reused per route.
      </ConfirmedHint>

      {/* Summary tiles — mirrors the app's analytics MetricTile row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <MetricTile label="IP ideas (total)" value={String(ideas.length)} icon={FolderKanban} />
        <MetricTile label="Founder route" value={String(byRoute.founder.length)} icon={Rocket} />
        <MetricTile label="Hackathon route" value={String(byRoute.hackathon.length)} icon={Trophy} />
        <MetricTile label="Founder Match route" value={String(byRoute.founder_match.length)} icon={HeartHandshake} />
      </div>

      {/* Founder route — professor's progress through the Wildfire program */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Rocket className="h-4 w-4 text-orange-500" /> Founder route — progress through the Wildfire program</CardTitle>
          <CardDescription>
            Tracked exactly as founders are tracked today: current phase, lessons completed, AI feedback, revisions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {byRoute.founder.length === 0 && <p className="text-sm text-muted-foreground py-2">No IP ideas on the Founder route yet.</p>}
          {byRoute.founder.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP idea / company</TableHead>
                  <TableHead>Professor-founder</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead>Lessons</TableHead>
                  <TableHead className="text-right">AI feedback</TableHead>
                  <TableHead className="text-right">Revisions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byRoute.founder.map((i) => {
                  const t = i.founderTracking;
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => onOpen(i.id)}>
                      <TableCell>
                        <p className="font-medium text-foreground">{i.title}</p>
                        {t?.companyName && <p className="text-xs text-muted-foreground">{t.companyName}{t.coFounder ? ` · with ${t.coFounder}` : ""}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{i.professor}</p>
                        <p className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                          <GraduationCap className="h-3 w-3" /> Founder · university-IP-origin tag
                        </p>
                      </TableCell>
                      <TableCell>
                        {t ? (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{t.currentPhase}</span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {t ? (
                          <div className="min-w-[110px]">
                            <p className="text-xs text-muted-foreground mb-1">{t.lessonsCompleted}/{t.totalLessons}</p>
                            <Progress value={(t.lessonsCompleted / t.totalLessons) * 100} className="h-1.5" />
                          </div>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right">{t?.aiFeedbackCount ?? "—"}</TableCell>
                      <TableCell className="text-right">{t?.documentsRevised ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hackathon route — what was built */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Trophy className="h-4 w-4 text-sky-600" /> Hackathon route — what was built</CardTitle>
          <CardDescription>For each hackathon-pickable idea: who picked it and what came out of the event.</CardDescription>
        </CardHeader>
        <CardContent>
          {byRoute.hackathon.length === 0 && <p className="text-sm text-muted-foreground py-2">No IP ideas on the Hackathon route yet.</p>}
          {byRoute.hackathon.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP idea</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Picked by</TableHead>
                  <TableHead>What was built</TableHead>
                  <TableHead>Outcome</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byRoute.hackathon.map((i) => {
                  const t = i.hackathonTracking;
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => onOpen(i.id)}>
                      <TableCell className="font-medium">{i.title}</TableCell>
                      <TableCell><StateChip state={i.state} /></TableCell>
                      <TableCell className="text-sm">{t?.event ?? "—"}</TableCell>
                      <TableCell className="text-sm">{t?.pickedBy ?? <span className="text-muted-foreground text-xs">Not picked yet</span>}</TableCell>
                      <TableCell className="text-sm max-w-[26ch]">{t?.built ?? <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                      <TableCell className="text-sm max-w-[24ch]">{t?.outcome ?? <span className="text-muted-foreground text-xs">—</span>}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          <ParkedCallout>
            Build/outcome data would come from the separate hackathon-management system being built elsewhere — parked; it gets updated later with these learnings. Shown here as mock data for validation only.
          </ParkedCallout>
        </CardContent>
      </Card>

      {/* Founder Match route — how the match is doing */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-emerald-600" /> Founder Match route — how the match is doing</CardTitle>
          <CardDescription>For each idea sent to Founder Match: the matched founder and how they're doing with it.</CardDescription>
        </CardHeader>
        <CardContent>
          {byRoute.founder_match.length === 0 && <p className="text-sm text-muted-foreground py-2">No IP ideas on the Founder Match route yet.</p>}
          {byRoute.founder_match.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP idea</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Matched founder</TableHead>
                  <TableHead>Match status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {byRoute.founder_match.map((i) => {
                  const t = i.matchTracking;
                  const statusStyle =
                    t?.matchStatus === "Matched — running" ? "bg-emerald-50 text-emerald-700" :
                    t?.matchStatus === "Matched — stalled" ? "bg-red-50 text-red-700" :
                    t?.matchStatus === "Intro made" ? "bg-blue-50 text-blue-700" :
                    "bg-slate-100 text-slate-600";
                  return (
                    <TableRow key={i.id} className="cursor-pointer" onClick={() => onOpen(i.id)}>
                      <TableCell className="font-medium">{i.title}</TableCell>
                      <TableCell><StateChip state={i.state} /></TableCell>
                      <TableCell className="text-sm">{t?.matchedFounder ?? <span className="text-muted-foreground text-xs">Searching…</span>}</TableCell>
                      <TableCell>
                        {t && <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyle}`}>{t.matchStatus}</span>}
                      </TableCell>
                      <TableCell className="text-sm max-w-[32ch]">{t?.note}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Unrouted / on hold */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-slate-500" /> Private / not routed yet ({byRoute.unrouted.length})</CardTitle>
          <CardDescription>Private is the hold state — "put it on hold and decide later."</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {byRoute.unrouted.map((i) => (
              <button key={i.id} onClick={() => onOpen(i.id)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/50">
                {i.title}
              </button>
            ))}
            {byRoute.unrouted.length === 0 && <p className="text-sm text-muted-foreground">Every idea has a route.</p>}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6">
        <MetricTile label="Published" value={String(ideas.filter((i) => i.state === "published").length)} icon={Eye} />
        <MetricTile label="Private (hold)" value={String(ideas.filter((i) => i.state === "private").length)} icon={Lock} />
        <MetricTile label="Professors involved" value={String(new Set(ideas.map((i) => i.professor)).size)} icon={ClipboardList} />
      </div>
    </>
  );
}
