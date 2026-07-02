import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Container, ConfirmedHint, RoleHero, RecommendedTier, GapCallout,
} from "@/components/Shell";
import { OTHER_UNI_MATCH_IDEAS, FOUNDER_NAME, type IpIdea, type InterestNotification } from "@/data";
import {
  Building2, Rocket, Users, GraduationCap, HeartHandshake, Landmark, Phone,
  LogIn, Search, CheckCircle2, Hand, Sparkle, Filter, Bell,
} from "lucide-react";

/* Founder / Co-founder (via Founder Match) — an EXISTING Founder role.
   Gate-2 (2026-07-02): founders can have an account, log in, and see ALL the
   published Founder-Match ideas submitted for other people to pick up.
   Gate-3 (2026-07-02): the list SPANS UNIVERSITIES — university isolation
   applies to IP Managers, not to this list — with a per-university FILTER;
   and expressing interest NOTIFIES the idea's IP Manager, who starts making
   connections and gets the founder connected to the professor. */

const ALL = "__all__";

export default function CofounderView({
  ideas, interests, onInterest,
}: {
  ideas: IpIdea[];
  interests: InterestNotification[];
  onInterest: (idea: IpIdea) => void;
}) {
  const [query, setQuery] = useState("");
  const [uniFilter, setUniFilter] = useState<string>(ALL);

  // Cross-university list (gate-3): the logged-in university's live client
  // state merged with other universities' published Founder-Match ideas.
  // Only PUBLISHED Founder-Match ideas appear — held/private/other-route never do.
  const marketplace = useMemo(
    () =>
      [...ideas, ...OTHER_UNI_MATCH_IDEAS].filter(
        (i) => i.route === "founder_match" && i.state === "published"
      ),
    [ideas]
  );
  const universities = useMemo(
    () => [...new Set(marketplace.map((i) => i.university))],
    [marketplace]
  );
  const visible = marketplace.filter(
    (i) =>
      (uniFilter === ALL || i.university === uniFilter) &&
      (i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.summary.toLowerCase().includes(query.toLowerCase()))
  );

  const interestedIds = interests.filter((n) => n.founder === FOUNDER_NAME).map((n) => n.ideaId);

  return (
    <Container>
      <RoleHero
        role="Founder (via Founder Match) — existing Founder role"
        name={FOUNDER_NAME}
        tagline="A Wildfire Network member with a founder account. Gate-2: logs in and browses ALL the published Founder-Match IP ideas — the ideas submitted for other people to pick up. Gate-3: the list spans universities, filterable per university; expressing interest notifies that idea's IP Manager, who starts making connections and gets him connected to the professor. When matched, he becomes the second founder in the company (two founders, as set up today)."
        meta={[
          { icon: <LogIn className="w-4 h-4 text-gray-400" />, label: "Logged in — founder account (existing app login)" },
          { icon: <HeartHandshake className="w-4 h-4 text-gray-400" />, label: "Browsing Founder Match ideas" },
          { icon: <Building2 className="w-4 h-4 text-gray-400" />, label: `${universities.length} universities publishing ideas` },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge className="bg-orange-500 hover:bg-orange-500 text-white">Founder</Badge>
        <Badge variant="outline">Existing role — gate-2 adds the browsable idea list; gate-3 makes it cross-university</Badge>
      </div>
      <ConfirmedHint>
        Gate-3 (confirmed): founders see the published Founder-Match ideas ACROSS universities and can filter per university — the confirmed university isolation applies to IP Managers, not to this list.
      </ConfirmedHint>

      {/* ── The browsable Founder-Match IP-idea list (gate-2 + gate-3) ────── */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-emerald-600" /> Founder Match — university IP ideas ({visible.length}{uniFilter !== ALL || query ? ` of ${marketplace.length}` : ""})
              </CardTitle>
              <CardDescription>
                Every PUBLISHED Founder-Match idea, across all universities, submitted for other people to pick up. Private, held, and other-route ideas never appear here.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Gate-3: per-university filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={uniFilter} onValueChange={setUniFilter}>
                  <SelectTrigger className="w-64" aria-label="Filter by university">
                    <SelectValue placeholder="All universities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>All universities</SelectItem>
                    {universities.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ideas…"
                  className="pl-8 w-56"
                  aria-label="Search ideas"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map((idea) => (
              <MarketplaceCard
                key={idea.id}
                idea={idea}
                interested={interestedIds.includes(idea.id)}
                onInterest={() => onInterest(idea)}
              />
            ))}
            {visible.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 col-span-full">
                No published Founder-Match ideas match{query ? ` "${query}"` : ""}{uniFilter !== ALL ? ` at ${uniFilter}` : ""}.
              </p>
            )}
          </div>
          <ConfirmedHint>
            Gate-3 (confirmed): expressing interest notifies the idea's IP Manager, who starts making connections — getting you connected to the professor.
          </ConfirmedHint>
          <GapCallout>
            What happens after the IP Manager connects you with the professor — how the pickup becomes a formal completed match and how the two-founder company forms — was still not specified. Open dependency; nothing beyond the interest → notification → connect step is invented here.
          </GapCallout>
        </CardContent>
      </Card>

      <RecommendedTier id="REC-5" title="University-IP provenance label + professor contact on the idea">
        What a browsing founder would SEE on each idea — a university-IP provenance label and the professor contact (essential for contact-only professors) — is still not confirmed. Needs PO sign-off; the cards above show plain idea data plus the owning university only.
      </RecommendedTier>

      {/* ── After the match: existing two-founder company shape ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-orange-500" /> After a match — the company (existing shape)</CardTitle>
            <CardDescription>Two founders in one company, as today. Example: an earlier match.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">Dr. Miriam Hale</span>
              <span className="text-xs text-muted-foreground">Founder · professor (idea owner) · day-to-day co-founder</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="font-medium">Jess Munoz</span>
              <span className="text-xs text-muted-foreground">Founder · matched via Founder Match</span>
            </div>
            <ConfirmedHint>
              Confirmed: Founder Match brings a student or Wildfire Network member as the co-founder — two founders in one company, as currently set up.
            </ConfirmedHint>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Landmark className="h-4 w-4 text-orange-500" /> What a picked-up idea is</CardTitle>
            <CardDescription>University IP is just an idea in the app — not a separate object type.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> The university owns the IP; the professor owns the knowledge of the idea.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" /> Your interest notifies the idea's IP Manager, who connects you with the professor (gate-3).
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" /> Contact-only professors: whoever takes the idea can reach out directly.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Rocket className="h-3.5 w-3.5" /> The matched founder runs the idea through the normal Wildfire process.
            </div>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}

/* ── One idea card in the browsable list ──────────────────────────────────── */

function MarketplaceCard({
  idea, interested, onInterest,
}: {
  idea: IpIdea;
  interested: boolean;
  onInterest: () => void;
}) {
  const alreadyMatched = idea.matchTracking?.matchedFounder != null;
  return (
    <div className="rounded-xl border border-border bg-white p-4 flex flex-col gap-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-sm leading-snug">{idea.title}</p>
        {alreadyMatched ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 shrink-0">
            <Users className="h-3 w-3" /> Matched
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700 shrink-0">
            <Sparkle className="h-3 w-3" /> Open
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed flex-1">{idea.summary}</p>
      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
        <Building2 className="h-3 w-3" /> {idea.university}
      </p>
      {alreadyMatched ? (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> Picked up by {idea.matchTracking?.matchedFounder}
        </p>
      ) : interested ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] text-emerald-800 flex items-center gap-1.5">
          <Bell className="h-3.5 w-3.5 shrink-0" /> Interest sent — the IP Manager at {idea.university} has been notified and will start making connections to get you connected with the professor.
        </div>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={onInterest}>
          <Hand className="h-3.5 w-3.5 mr-1" /> I want to pick this up
        </Button>
      )}
    </div>
  );
}
