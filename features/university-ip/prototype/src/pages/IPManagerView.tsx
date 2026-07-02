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
  UNIVERSITY, IP_MANAGER, ROUTE_LABEL, MATCH_STAGES,
  type IpIdea, type Route, type Involvement, type InterestNotification, type MatchStatus,
} from "@/data";
import {
  Building2, FolderKanban, Upload, ListPlus, Activity, Rocket, Trophy, HeartHandshake,
  Lock, Globe2, UserRound, Phone, Users, CheckCircle2, FileSpreadsheet, Plus,
  GraduationCap, Hammer, ArrowRight, Eye, ClipboardList, PauseCircle, UserPlus, Tag, Send,
  Bell, Link2, Info, Home, NotebookPen, Flag, ChevronRight,
} from "lucide-react";

/* ── Small shared chips ────────────────────────────────────────────────────── */

function StateChip({ state }: { state: IpIdea["state"] }) {
  return state === "published" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      <Globe2 className="h-3 w-3" /> Published
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600">
      <Lock className="h-3 w-3" /> Private
    </span>
  );
}

function RouteChip({ route }: { route: Route | null }) {
  if (!route) return <span className="text-xs text-muted-foreground">Not routed yet</span>;
  const styles: Record<Route, string> = {
    founder: "bg-orange-50 border-orange-200 text-orange-700",
    hackathon: "bg-sky-50 border-sky-200 text-sky-700",
    founder_match: "bg-emerald-50 border-emerald-200 text-emerald-700",
    hold: "bg-slate-100 border-slate-300 text-slate-700",
  };
  const icons: Record<Route, JSX.Element> = {
    founder: <Rocket className="h-3 w-3" />,
    hackathon: <Trophy className="h-3 w-3" />,
    founder_match: <HeartHandshake className="h-3 w-3" />,
    hold: <PauseCircle className="h-3 w-3" />,
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

type Screen = "home" | "portfolio" | "import" | "tracking" | "detail" | "inbox";

export default function IPManagerView({
  ideas, setIdeas, interests, onConnect,
}: {
  ideas: IpIdea[];
  setIdeas: React.Dispatch<React.SetStateAction<IpIdea[]>>;
  interests: InterestNotification[];
  onConnect: (id: number) => void;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // Tenancy: Kirby sees only interest in HER university's ideas — interest in
  // another university's idea notifies THAT university's IP Manager instead.
  const myInterests = interests.filter((n) => n.university === UNIVERSITY);
  const newInterestCount = myInterests.filter((n) => n.status === "new").length;

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
    { key: "inbox", title: `Founder interest inbox${newInterestCount > 0 ? ` (${newInterestCount} new)` : ""}`,
      subtitle: "Gate-3: when a founder expresses interest in one of your Founder-Match ideas you're notified here — start making connections and get them connected to the professor.",
      icon: <Bell className="h-5 w-5" />, iconColor: "text-violet-700", iconBg: "bg-violet-50", badge: <CardTierBadge kind="new" /> },
  ];

  if (screen === "home") {
    return (
      <Container>
        <RoleHero
          role="IP Manager (one merged role — VPR folds in)"
          name={IP_MANAGER}
          tagline={`Bring ${UNIVERSITY}'s IP into the app as ideas, associate each with its professor, create the professor's profile and send the invite, flag professor involvement, give each piece one of four dispositions after talking to the professor (Founder / Hackathon / Founder Match / Hold), publish it, and track how every idea is doing on its route.`}
          meta={[
            { icon: <Building2 className="w-4 h-4 text-gray-400" />, label: `${UNIVERSITY} · your organization` },
            { icon: <FolderKanban className="w-4 h-4 text-gray-400" />, label: `${ideas.length} IP ideas` },
            { icon: <Activity className="w-4 h-4 text-gray-400" />, label: `${ideas.filter((i) => i.route && i.route !== "hold").length} routed · ${ideas.filter((i) => i.route === "hold").length} on hold` },
          ]}
        />
        <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">University-scoped view (confirmed).</span> You see only{" "}
            <span className="font-medium">{UNIVERSITY}</span>'s IP — other universities, and their IP, are invisible to you. Each university is its own fully isolated organization.
          </span>
        </div>
        <div className="mt-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <Home className="h-4 w-4 shrink-0" />
          <span>
            <span className="font-semibold">Confirmed at gate 3:</span> this role home IS the home page an IP Manager sees when they log in. All entry happens in-app, logged in (no external data entry).
          </span>
        </div>
        <div className="mt-5">
          <NavCardGrid cards={cards} onOpen={(k) => setScreen(k as Screen)} />
        </div>
        <ConfirmedHint>
          Confirmed at gate 2 (was REC-2): a Wildfire Admin provisions each university organization and assigns its IP Manager — see the Wildfire Admin view in the role switcher.
        </ConfirmedHint>
      </Container>
    );
  }

  return (
    <Container>
      <BackToHome onBack={() => setScreen("home")} label="IP Manager home" />
      {screen === "portfolio" && (
        <PortfolioScreen
          ideas={ideas}
          onOpen={openDetail}
          onPublish={(sel) =>
            sel.forEach((id) => {
              const idea = ideas.find((i) => i.id === id);
              if (idea && idea.route !== "hold") update(id, { state: "published" });
            })
          }
        />
      )}
      {screen === "import" && <ImportScreen onAdd={addIdea} onImport={(rows) => rows.forEach(addIdea)} />}
      {screen === "tracking" && <TrackingScreen ideas={ideas} onOpen={openDetail} />}
      {screen === "inbox" && <InboxScreen interests={myInterests} onConnect={onConnect} onOpenIdea={openDetail} ideas={ideas} />}
      {screen === "detail" && selectedId != null && (
        <DetailScreen
          key={selectedId}
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
        subtitle="University IP lives here as ideas ('the research is just an idea in our world'). Everything lands PRIVATE (unrouted) by default; marking an idea Hold is the explicit 'keep it in the app until I figure out what to do with it' disposition (gate-2). Select some or all and publish."
      />
      <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>Scoped to <span className="font-semibold">{UNIVERSITY}</span> only — no other university's IP appears here (confirmed multi-university tenancy).</span>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><FolderKanban className="h-4 w-4 text-orange-500" /> {ideas.length} IP ideas</CardTitle>
            <CardDescription>Private by default → select & publish. Click a company/idea to open its detail — a description of the company and what it does (gate-3), the professor, and routing.</CardDescription>
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
          <p className="mb-3 text-[11px] text-muted-foreground flex items-center gap-1.5">
            <PauseCircle className="h-3.5 w-3.5 shrink-0" />
            Ideas on <span className="font-semibold">Hold</span> are skipped by bulk publish — take them off Hold (pick an outward route) first.
          </p>
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
          <ConfirmedHint>Confirmed: private (unrouted) by default, then publish. Gate-2: "Hold (private)" is the explicit fourth disposition for "keep it in the app until I figure out what to do with it."</ConfirmedHint>
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
    about: "Would forecast turbine blade-icing events from weather + vibration data so wind-farm operators can pre-heat or feather blades before ice throws them off balance.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt", professorDept: "Electrical Engineering",
    involvement: "contact", state: "private", route: null, addedVia: "spreadsheet",
  },
  {
    title: "Bio-derived road de-icer",
    summary: "Imported from spreadsheet row 2 — sugar-beet-byproduct de-icing compound.",
    about: "Would turn sugar-beet processing byproduct into a road de-icer that is cheaper per lane-mile than brine additives and far less corrosive to bridges and vehicles.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss", professorDept: "Materials Science",
    involvement: "contact", state: "private", route: null, addedVia: "spreadsheet",
  },
  {
    title: "Rural telehealth triage protocol",
    summary: "Imported from spreadsheet row 3 — validated triage decision protocol for rural clinics.",
    about: "Would license a validated triage decision protocol to rural telehealth providers so nurse-line staff can route patients to the right level of care consistently.",
    university: UNIVERSITY,
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
  const [holdAtImport, setHoldAtImport] = useState(false);

  return (
    <>
      <PageHeader
        icon={<Upload className="h-5 w-5" />}
        title="Bring IP into the app"
        subtitle="Two confirmed entry paths: import a spreadsheet of IP, or add a piece of IP individually with a button. Everything lands private by default, associated with its professor — and an idea can be explicitly marked Hold at import (gate-2)."
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
            <div className="flex items-start space-x-2 rounded-md border border-slate-200 bg-slate-50 p-3">
              <Checkbox
                id="hold-at-import"
                checked={holdAtImport}
                onCheckedChange={(v) => setHoldAtImport(v === true)}
                className="mt-0.5"
              />
              <div>
                <Label htmlFor="hold-at-import" className="font-normal leading-snug flex items-center gap-1.5">
                  <PauseCircle className="h-3.5 w-3.5 text-slate-500" /> Mark as Hold (private)
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Gate-2: explicitly HOLD this idea in the app until you figure out what to do with it — the fourth disposition, also available later on the routing view.
                </p>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!title.trim() || !professor.trim()}
              onClick={() => {
                onAdd({
                  title: title.trim(), summary: summary.trim() || "(no description yet)",
                  about: summary.trim() || "(no description yet)",
                  university: UNIVERSITY,
                  professor: professor.trim(), professorDept: "—",
                  involvement, state: "private", route: holdAtImport ? "hold" : null, addedVia: "individual",
                });
                setAdded(title.trim());
                setTitle(""); setSummary(""); setProfessor(""); setHoldAtImport(false);
              }}
            >
              <Plus className="h-4 w-4 mr-1" /> Add IP (lands private)
            </Button>
          </CardContent>
        </Card>
      </div>
      <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-start gap-2">
        <UserPlus className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          <span className="font-semibold">Professor invite (confirmed at gate 2 — was REC-1).</span> Imported professors don't have an account yet: from each idea's routing view you <span className="font-medium">create the professor's profile/account and send the invite</span> — a tag attaches them as a <span className="font-medium">Professor</span> with the IP idea they're working on, applied at account creation. They then come through the app the regular way.
        </span>
      </div>
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

      {/* Gate-3: clicking a company/idea in the IP Portfolio shows a spot with
          a description of the company and what it does. */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-orange-500" /> About this company — what it does
          </CardTitle>
          <CardDescription>
            Gate-3 (confirmed): every portfolio entry's detail shows a description of the company and what it does.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {idea.founderTracking?.companyName && (
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Rocket className="h-4 w-4 text-orange-500" /> {idea.founderTracking.companyName}
            </p>
          )}
          <p className="text-sm text-muted-foreground leading-relaxed">{idea.about}</p>
        </CardContent>
      </Card>

      {/* Gate-4 (2026-07-02): the IP profile is WHERE the IP Manager writes the
          tracking notes, records the outcome, and moves the Founder-Match
          status through its stages — the tracking dashboard reflects these
          same fields (shared client state, not duplicated mock data). */}
      <TrackingManagementCard idea={idea} onChange={onChange} />

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
            <Separator />
            {/* Gate-2 (was REC-1): create the professor's profile/account + send the invite,
                with the Professor + linked-IP-idea tag applied at account creation. */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <UserPlus className="h-3.5 w-3.5 text-orange-500" /> Professor account (confirmed at gate 2)
              </Label>
              {idea.inviteSent ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 space-y-1.5">
                  <p className="flex items-center gap-1.5 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile created & invite sent to {idea.professor}
                  </p>
                  <p>Tag applied at account creation:</p>
                  <p className="flex flex-wrap gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-0.5 font-medium">
                      <GraduationCap className="h-3 w-3" /> Professor
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-white px-2 py-0.5 font-medium">
                      <Tag className="h-3 w-3" /> IP idea: {idea.title}
                    </span>
                  </p>
                  <p className="text-emerald-800/80">They come through the app the regular way from here.</p>
                </div>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {idea.professor} has no account yet. Create their profile/account and send the invite — a tag attaches them as a <span className="font-medium">Professor</span> with this IP idea, applied at account creation.
                  </p>
                  <Button size="sm" className="w-full" onClick={() => onChange({ inviteSent: true })}>
                    <Send className="h-3.5 w-3.5 mr-1" /> Create profile & send invite
                  </Button>
                  <p className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-1">
                    Applies:
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
                      <GraduationCap className="h-3 w-3" /> Professor
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5">
                      <Tag className="h-3 w-3" /> Linked IP idea
                    </span>
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Route selection */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowRight className="h-4 w-4 text-orange-500" /> Choose the disposition</CardTitle>
            <CardDescription>
              Chosen by the IP Manager AFTER talking to the professor. Each piece of IP takes exactly ONE of the four options — three outward routes, or Hold (gate-2).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {(
                [
                  { r: "founder" as Route, icon: <Rocket className="h-5 w-5" />,
                    blurb: "Professor becomes a Founder and runs the normal Wildfire process — Founder Match brings a co-founder (two founders, as today)." },
                  { r: "hackathon" as Route, icon: <Trophy className="h-5 w-5" />,
                    blurb: "Good hackathon topic — mark it a pickable hackathon idea. Participants can bring their own idea OR pick this one." },
                  { r: "founder_match" as Route, icon: <HeartHandshake className="h-5 w-5" />,
                    blurb: "Professor won't build it and it isn't a hackathon fit — publish it to the founder-facing list for a founder to pick up." },
                  { r: "hold" as Route, icon: <PauseCircle className="h-5 w-5" />,
                    blurb: "Gate-2: mark it private and HOLD it in the app until you figure out what to do with it — a deliberate disposition, not just 'not routed yet'." },
                ]
              ).map(({ r, icon, blurb }) => {
                const active = idea.route === r;
                return (
                  <button
                    key={r}
                    onClick={() => onChange(r === "hold" ? { route: r, state: "private" } : { route: r })}
                    className={`text-left rounded-lg border p-4 transition-all ${
                      active ? "border-primary ring-2 ring-primary/30 bg-primary/5" : "border-border hover:border-primary/40 bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={active ? "text-primary" : "text-muted-foreground"}>{icon}</span>
                      {active && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="font-semibold text-sm">{r === "hold" ? ROUTE_LABEL[r] : `${ROUTE_LABEL[r]} route`}</p>
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

            {idea.route === "hold" && (
              <div className="mt-3 rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-xs text-slate-700 flex items-start gap-2">
                <PauseCircle className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                <span>
                  <span className="font-semibold">On Hold (gate-2).</span> This idea is held privately in the app until you decide what to do with it — it is not visible downstream and cannot be published while held. Pick an outward route to move it on.
                </span>
              </div>
            )}

            <Separator className="my-4" />
            <div className="flex flex-wrap items-center gap-3">
              <Button
                disabled={idea.state === "published" || !idea.route || idea.route === "hold"}
                onClick={() => { onChange({ state: "published" }); setPublished(true); setTimeout(() => setPublished(false), 3000); }}
              >
                <Globe2 className="h-4 w-4 mr-1" />
                {idea.state === "published" ? "Published" : "Publish this idea"}
              </Button>
              {!idea.route && <span className="text-xs text-muted-foreground">Pick a disposition first — it stays private (unrouted) by default until you do.</span>}
              {idea.route === "hold" && <span className="text-xs text-muted-foreground">Held ideas stay private — publishing is disabled while on Hold.</span>}
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

/* ── IP-profile tracking management (gate-4) ─────────────────────────────────
   PO gate-4 (2026-07-02): the tracking dashboard SHOWS notes / outcome / match
   status, but there was nowhere to WRITE them. The idea's IP profile (this
   detail view, alongside "About this company") is where the IP Manager
   writes/edits the notes, records/updates the outcome, and moves the match
   status through its stages. Stage vocabulary is the prototype's existing
   match-status set — reused, not invented. */

const MATCH_ADVANCE_PATH: MatchStatus[] = ["Searching", "Intro made", "Matched — running"];

function TrackingManagementCard({
  idea, onChange,
}: {
  idea: IpIdea;
  onChange: (patch: Partial<IpIdea>) => void;
}) {
  const [notesDraft, setNotesDraft] = useState(idea.notes ?? "");
  const [outcomeDraft, setOutcomeDraft] = useState(idea.outcome ?? "");
  const [matchedFounderDraft, setMatchedFounderDraft] = useState(idea.matchTracking?.matchedFounder ?? "");
  const [flash, setFlash] = useState<string | null>(null);

  const saved = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 3500);
  };

  const status: MatchStatus = idea.matchTracking?.matchStatus ?? "Searching";
  const setStatus = (s: MatchStatus) => {
    onChange({
      matchTracking: { matchedFounder: idea.matchTracking?.matchedFounder ?? null, matchStatus: s },
    });
    saved(`Match status moved to "${s}" — reflected on the tracking dashboard.`);
  };
  const nextStage =
    status === "Matched — stalled"
      ? "Matched — running"
      : MATCH_ADVANCE_PATH[MATCH_ADVANCE_PATH.indexOf(status) + 1];

  const stagePillStyle = (s: MatchStatus, active: boolean) => {
    if (!active) return "border-border bg-background text-muted-foreground hover:border-primary/40";
    if (s === "Matched — running") return "border-emerald-300 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-200";
    if (s === "Matched — stalled") return "border-red-300 bg-red-50 text-red-700 ring-2 ring-red-200";
    if (s === "Intro made") return "border-blue-300 bg-blue-50 text-blue-700 ring-2 ring-blue-200";
    return "border-slate-300 bg-slate-100 text-slate-700 ring-2 ring-slate-200";
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <NotebookPen className="h-4 w-4 text-orange-500" /> Tracking — notes, outcome{idea.route === "founder_match" ? " & match status" : ""}
        </CardTitle>
        <CardDescription>
          Gate-4 (confirmed): the IP profile is where you WRITE what the tracking dashboard shows — write/edit your notes, record the outcome{idea.route === "founder_match" ? ", and move the Founder-Match status through its stages" : ""}. The tracking dashboard reflects what you enter here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {flash && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> {flash}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Write / edit notes */}
          <div className="space-y-1.5">
            <Label htmlFor="track-notes" className="flex items-center gap-1.5">
              <NotebookPen className="h-3.5 w-3.5 text-muted-foreground" /> IP Manager notes
            </Label>
            <Textarea
              id="track-notes"
              rows={3}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="How this idea is doing on its route — write your tracking notes here"
            />
            <Button
              size="sm"
              disabled={notesDraft === (idea.notes ?? "")}
              onClick={() => { onChange({ notes: notesDraft }); saved("Notes saved — reflected on the tracking dashboard."); }}
            >
              <NotebookPen className="h-3.5 w-3.5 mr-1" /> {idea.notes ? "Update notes" : "Save notes"}
            </Button>
          </div>

          {/* Record / update the outcome */}
          <div className="space-y-1.5">
            <Label htmlFor="track-outcome" className="flex items-center gap-1.5">
              <Flag className="h-3.5 w-3.5 text-muted-foreground" /> Outcome
            </Label>
            <Textarea
              id="track-outcome"
              rows={3}
              value={outcomeDraft}
              onChange={(e) => setOutcomeDraft(e.target.value)}
              placeholder={
                idea.route === "hackathon"
                  ? "e.g. what came out of the event for this idea"
                  : idea.route === "founder_match"
                    ? "e.g. where the match landed"
                    : "The idea's outcome on its route"
              }
            />
            <Button
              size="sm"
              disabled={outcomeDraft === (idea.outcome ?? "")}
              onClick={() => { onChange({ outcome: outcomeDraft }); saved("Outcome recorded — reflected on the tracking dashboard."); }}
            >
              <Flag className="h-3.5 w-3.5 mr-1" /> {idea.outcome ? "Update outcome" : "Record outcome"}
            </Button>
          </div>
        </div>

        {/* Move the Founder-Match status through its stages (gate-4) */}
        {idea.route === "founder_match" && (
          <>
            <Separator />
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" /> Match status — move this idea through the stages
              </Label>
              <div className="flex flex-wrap items-center gap-2">
                {MATCH_STAGES.map((s, idx) => (
                  <span key={s} className="flex items-center gap-2">
                    {idx > 0 && idx < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                    {idx === 3 && <span className="text-[11px] text-muted-foreground">or</span>}
                    <button
                      onClick={() => setStatus(s)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-all ${stagePillStyle(s, status === s)}`}
                    >
                      {s}
                    </button>
                  </span>
                ))}
                {nextStage && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(nextStage)}>
                    Advance to "{nextStage}" <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-2 pt-1">
                <div className="space-y-1 flex-1 min-w-[220px] max-w-sm">
                  <Label htmlFor="matched-founder" className="text-xs">Matched founder (existing tracking field)</Label>
                  <Input
                    id="matched-founder"
                    value={matchedFounderDraft}
                    onChange={(e) => setMatchedFounderDraft(e.target.value)}
                    placeholder="e.g. Leo Tran (Wildfire Network)"
                    className="h-8"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={matchedFounderDraft === (idea.matchTracking?.matchedFounder ?? "")}
                  onClick={() => {
                    onChange({ matchTracking: { matchedFounder: matchedFounderDraft.trim() || null, matchStatus: status } });
                    saved("Matched founder recorded — reflected on the tracking dashboard.");
                  }}
                >
                  <Users className="h-3.5 w-3.5 mr-1" /> Save
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Stages reuse this prototype's existing match-status vocabulary. Moving a match to "Matched" here only updates the tracking status — formal match completion / how the two-founder company forms stays an open dependency (see the GAP on the interest flow).
              </p>
            </div>
          </>
        )}

        <GapCallout>
          Who else can see these notes and the recorded outcome (the professor? the Wildfire Admin?) was not specified — rendered here as the IP Manager's own tracking record. PO to confirm visibility.
        </GapCallout>
        <ConfirmedHint>
          Gate-4 (confirmed): the tracking dashboard reflects the notes, outcome, and match status entered here — one shared record per idea, not duplicated data.
        </ConfirmedHint>
      </CardContent>
    </Card>
  );
}

/* ── Screen: Cross-route tracking dashboard ───────────────────────────────────
   Modeled on the live app's founder-tracking system:
   - src/services/founderAnalyticsService.ts (FounderProgress: currentPhase,
     lessonsCompleted/totalLessons, aiFeedbackCount, documentsRevised)
   - src/pages/AdminAnalyticsDashboard.tsx (Founders card: metric tiles +
     per-founder table with phase badge) — the framework the PO named. */

/* Gate-4: notes + outcome are the SAME fields the IP Manager writes on the
   idea's IP profile — this dashboard reads the shared client state. */
function NotesOutcomeCell({ idea }: { idea: IpIdea }) {
  if (!idea.outcome && !idea.notes)
    return <span className="text-xs text-muted-foreground">— write it on the IP profile</span>;
  return (
    <div className="max-w-[30ch] space-y-0.5">
      {idea.outcome && (
        <p className="text-sm font-medium text-foreground flex items-start gap-1">
          <Flag className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground" /> {idea.outcome}
        </p>
      )}
      {idea.notes && <p className="text-xs text-muted-foreground">{idea.notes}</p>}
    </div>
  );
}

function TrackingScreen({ ideas, onOpen }: { ideas: IpIdea[]; onOpen: (id: number) => void }) {
  const byRoute = useMemo(
    () => ({
      founder: ideas.filter((i) => i.route === "founder"),
      hackathon: ideas.filter((i) => i.route === "hackathon"),
      founder_match: ideas.filter((i) => i.route === "founder_match"),
      hold: ideas.filter((i) => i.route === "hold"),
      unrouted: ideas.filter((i) => !i.route),
    }),
    [ideas]
  );

  return (
    <>
      <PageHeader
        icon={<Activity className="h-5 w-5" />}
        title={`Tracking dashboard — ${UNIVERSITY}`}
        subtitle="Confirmed at the gate: the IP Manager tracks all data associated with each IP idea across the three outward routes — founder-route progress through the Wildfire program, what was built at the hackathon, and how each founder match is doing — plus what's explicitly on Hold (gate-2)."
      />
      <ConfirmedHint>
        Framework (PO-named): the app's existing founder-tracking system — the Founders analytics card (phase · lessons · engagement) reused per route.
      </ConfirmedHint>
      <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
        <NotebookPen className="h-4 w-4 shrink-0" />
        <span>
          <span className="font-semibold">Gate-4 (confirmed):</span> the notes, outcome, and match status below are <span className="font-medium">written on each idea's IP profile</span> (click any row) — this dashboard reflects what's entered there, live.
        </span>
      </div>

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
                  <TableHead>Outcome & notes</TableHead>
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
                      <TableCell><NotesOutcomeCell idea={i} /></TableCell>
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
                  <TableHead>Outcome & notes</TableHead>
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
                      <TableCell><NotesOutcomeCell idea={i} /></TableCell>
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
                  <TableHead>Outcome & notes</TableHead>
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
                      <TableCell><NotesOutcomeCell idea={i} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Hold (explicit, gate-2) vs default private/unrouted */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PauseCircle className="h-4 w-4 text-slate-500" /> On Hold — explicit (gate-2) ({byRoute.hold.length})</CardTitle>
            <CardDescription>Deliberately held privately in the app until the IP Manager figures out what to do with it — the fourth disposition.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {byRoute.hold.map((i) => (
                <button key={i.id} onClick={() => onOpen(i.id)} className="rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-xs hover:border-primary/50">
                  {i.title}
                </button>
              ))}
              {byRoute.hold.length === 0 && <p className="text-sm text-muted-foreground">Nothing is on Hold.</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock className="h-4 w-4 text-slate-500" /> Not routed yet — default private ({byRoute.unrouted.length})</CardTitle>
            <CardDescription>Everything lands private/unrouted by default — distinct from an explicit Hold.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {byRoute.unrouted.map((i) => (
                <button key={i.id} onClick={() => onOpen(i.id)} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary/50">
                  {i.title}
                </button>
              ))}
              {byRoute.unrouted.length === 0 && <p className="text-sm text-muted-foreground">Every idea has a disposition.</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <MetricTile label="Published" value={String(ideas.filter((i) => i.state === "published").length)} icon={Eye} />
        <MetricTile label="Private" value={String(ideas.filter((i) => i.state === "private").length)} icon={Lock} />
        <MetricTile label="On Hold (explicit)" value={String(ideas.filter((i) => i.route === "hold").length)} icon={PauseCircle} />
        <MetricTile label="Professors involved" value={String(new Set(ideas.map((i) => i.professor)).size)} icon={ClipboardList} />
      </div>
    </>
  );
}

/* ── Screen: Founder interest inbox (gate-3) ──────────────────────────────────
   When a founder expresses interest in a Founder-Match idea, the idea's IP
   Manager is NOTIFIED — so they can start making connections with that founder
   and get them connected to the professor. */

function InboxScreen({
  interests, onConnect, onOpenIdea, ideas,
}: {
  interests: InterestNotification[];
  onConnect: (id: number) => void;
  onOpenIdea: (ideaId: number) => void;
  ideas: IpIdea[];
}) {
  const [justConnected, setJustConnected] = useState<InterestNotification | null>(null);
  const newOnes = interests.filter((n) => n.status === "new");
  const connected = interests.filter((n) => n.status === "connected");

  const NotificationRow = ({ n }: { n: InterestNotification }) => {
    const ideaExists = ideas.some((i) => i.id === n.ideaId);
    return (
      <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-2 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Bell className={`h-4 w-4 ${n.status === "new" ? "text-violet-700" : "text-muted-foreground"}`} />
              {n.founder} wants to pick up “{n.ideaTitle}”
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {n.founderContext} · {n.when} · professor on the idea: {n.professor}
            </p>
          </div>
          {n.status === "new" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-medium text-violet-700 shrink-0">
              New interest
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shrink-0">
              <CheckCircle2 className="h-3 w-3" /> Connected
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {n.status === "new" ? (
            <Button
              size="sm"
              onClick={() => {
                onConnect(n.id);
                setJustConnected(n);
                setTimeout(() => setJustConnected(null), 4000);
              }}
            >
              <Link2 className="h-3.5 w-3.5 mr-1" /> Start making connections — connect {n.founder.split(" ")[0]} ↔ {n.professor}
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5" /> You connected {n.founder} with {n.professor}.
            </p>
          )}
          {ideaExists && (
            <Button size="sm" variant="outline" onClick={() => onOpenIdea(n.ideaId)}>
              <FolderKanban className="h-3.5 w-3.5 mr-1" /> Open idea
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        icon={<Bell className="h-5 w-5" />}
        title={`Founder interest inbox — ${UNIVERSITY}`}
        subtitle="Gate-3 (confirmed): when a founder expresses interest in one of your published Founder-Match ideas, you're notified here — so you can start making connections with that founder and get them connected to the professor."
      />
      <div className="mb-4 rounded-md border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800 flex items-center gap-2">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>Interest in another university's ideas notifies <span className="font-semibold">that</span> university's IP Manager — you only see interest in {UNIVERSITY}'s ideas.</span>
      </div>
      {justConnected && (
        <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            Connection started — you're connecting <span className="font-semibold">{justConnected.founder}</span> with{" "}
            <span className="font-semibold">{justConnected.professor}</span> on “{justConnected.ideaTitle}”.
          </span>
        </div>
      )}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-violet-700" /> New interest ({newOnes.length})
          </CardTitle>
          <CardDescription>
            Founders who expressed interest in a {UNIVERSITY} Founder-Match idea — the human-in-the-loop next step is yours: start making connections.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {newOnes.length === 0 && <p className="text-sm text-muted-foreground py-2">No new interest right now.</p>}
          {newOnes.map((n) => <NotificationRow key={n.id} n={n} />)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-emerald-600" /> Connections started ({connected.length})
          </CardTitle>
          <CardDescription>Interest items where you've already connected the founder with the professor.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {connected.length === 0 && <p className="text-sm text-muted-foreground py-2">None yet.</p>}
          {connected.map((n) => <NotificationRow key={n.id} n={n} />)}
        </CardContent>
      </Card>
      <GapCallout>
        Everything beyond the IP-Manager-connects step is still open — how a connection becomes a formal completed match and how the two-founder company forms were not specified. Nothing past "start making connections" is invented here.
      </GapCallout>
    </>
  );
}
