import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Container, PageHeader, GapCallout, ParkedCallout, ConfirmedHint, RoleHero, RecommendedTier,
} from "@/components/Shell";
import { UNIVERSITY } from "@/data";
import {
  GraduationCap, Rocket, Users, Phone, Building2, Tag, BookOpen, CheckCircle2, HeartHandshake,
} from "lucide-react";

/* Professor (idea owner) — carried as the EXISTING Founder role. This view
   shows the professor-founder running the normal Wildfire process (nothing
   new is built for them), plus the confirmed university-IP-origin analytics
   tag. */

const PHASES = [
  { name: "Customer Discovery", done: true },
  { name: "Build", done: false, current: true },
  { name: "Go-to-Market 1", done: false },
  { name: "Go-to-Market 2", done: false },
];

export default function ProfessorView() {
  return (
    <Container>
      <RoleHero
        role="Professor (idea owner) — existing Founder role"
        name="Dr. Miriam Hale"
        tagline={`Created the cardiac tissue preservation IP at ${UNIVERSITY}. Chose the Founder route: she carries the EXISTING Founder role (no separate 'professor' role) and runs the normal Wildfire process exactly as founders do today.`}
        meta={[
          { icon: <Building2 className="w-4 h-4 text-gray-400" />, label: `${UNIVERSITY} · Biomedical Engineering` },
          { icon: <Rocket className="w-4 h-4 text-gray-400" />, label: "HaleCardio · Founder route" },
          { icon: <Users className="w-4 h-4 text-gray-400" />, label: "Co-founder: Jess Munoz (via Founder Match)" },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-500 hover:bg-orange-500 text-white">Founder</Badge>
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          <Tag className="h-3 w-3" /> Analytics tag: originated from a university IP idea (confirmed)
        </span>
      </div>
      <ConfirmedHint>
        Confirmed at the gate: the professor becomes the existing Founder role, PLUS a special analytics tag marking that this founder originated from a university IP idea.
      </ConfirmedHint>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Normal Wildfire process — existing behavior, reused */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4 text-orange-500" /> Runs the normal Wildfire process</CardTitle>
            <CardDescription>
              Existing founder experience, reused as-is — this is what the IP Manager's tracking dashboard reads from.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {PHASES.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                {p.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className={`h-4 w-4 rounded-full border-2 shrink-0 ${p.current ? "border-orange-500" : "border-border"}`} />
                )}
                <span className={`text-sm ${p.current ? "font-semibold text-foreground" : p.done ? "text-foreground" : "text-muted-foreground"}`}>
                  {p.name}
                </span>
                {p.current && <Badge variant="outline" className="text-[10px]">Current phase</Badge>}
              </div>
            ))}
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Lessons completed · 14/32</p>
              <Progress value={(14 / 32) * 100} className="h-2" />
            </div>
            <ConfirmedHint>Confirmed: Founder route reuses today's process — no new founder surface is built for this feature.</ConfirmedHint>
          </CardContent>
        </Card>

        {/* Two professor profiles + co-founder */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-orange-500" /> Two professor profiles</CardTitle>
            <CardDescription>Per idea, the IP Manager flags which profile applies.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-orange-200 bg-orange-50/60 p-3">
              <p className="text-sm font-semibold text-orange-800 flex items-center gap-1.5"><Users className="h-4 w-4" /> Hands-on co-founder</p>
              <p className="text-xs text-orange-800/80 mt-1">Wants to be involved day-to-day and turn the IP into a startup (Dr. Hale's flag on this idea).</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Phone className="h-4 w-4" /> Contact only</p>
              <p className="text-xs text-muted-foreground mt-1">Hands the idea off with minimal involvement; whoever takes it can reach out directly.</p>
            </div>
            <Separator />
            <div className="flex items-start gap-2 text-sm">
              <HeartHandshake className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-muted-foreground">
                <span className="font-medium text-foreground">Founder Match brings the co-founder</span> — a student or Wildfire Network member joins as the second founder: two founders in one company, as set up today.
              </p>
            </div>
            <GapCallout>
              How an imported professor first gets an account (and becomes a Founder who can log in) is unspecified — parked dependency, see REC-1 on the IP Manager's import screen.
            </GapCallout>
            <ParkedCallout>
              Whether professors could also be Mentors was mentioned as unlikely — nothing built.
            </ParkedCallout>
          </CardContent>
        </Card>
      </div>

      <RecommendedTier id="REC-1" title="Professor invite / account-provisioning flow">
        This view assumes the professor already has an account. The invite-to-Founder flow that would get them here is not confirmed — needs PO sign-off.
      </RecommendedTier>
    </Container>
  );
}
