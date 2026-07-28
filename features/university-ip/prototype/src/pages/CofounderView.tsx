import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/Shell";
import { InvolvementChip } from "@/components/chips";
import { FOUNDER_NAME, INVENTION_STAGE_LABEL, teamOf, type IpIdea, type TeamMember } from "@/data";
import { Building2, Search, Hand, CheckCircle2, MessagesSquare, Users2, Send, Lock } from "lucide-react";

/* Founder Match marketplace — every published Founder-Match idea across
   universities. Expressing interest attaches an interest record to the idea,
   which surfaces in that university's IP Manager pipeline.

   Confidentiality: this is a founder-facing, cross-university surface. It
   renders ONLY the non-confidential tier — title, the public summary,
   invention stage, and involvement. No inventor names, no disclosure detail,
   no patent status, no internal check-in / email signals ever appear here. */

const ALL = "__all__";

export default function CofounderView({
  ideas, onInterest, onPostUpdate,
}: {
  ideas: IpIdea[];
  onInterest: (ideaId: number) => void;
  onPostUpdate: (ideaId: number, text: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [uniFilter, setUniFilter] = useState<string>(ALL);

  /* Ideas this founder has picked up — connected interests. */
  const myIdeas = useMemo(
    () => ideas.filter((i) => i.interests.some((n) => n.founder === FOUNDER_NAME && n.status === "connected")),
    [ideas]
  );

  const marketplace = useMemo(
    () =>
      ideas.filter(
        (i) =>
          i.route === "founder_match" &&
          i.published &&
          !i.onHold &&
          i.nonConfidentialSummary.trim().length > 0 &&
          (i.stage === "routed" || i.stage === "in_motion")
      ),
    [ideas]
  );
  const universities = useMemo(() => [...new Set(marketplace.map((i) => i.university))], [marketplace]);
  const myIds = new Set(myIdeas.map((i) => i.id));
  const visible = marketplace.filter(
    (i) =>
      !myIds.has(i.id) &&
      (uniFilter === ALL || i.university === uniFilter) &&
      (i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.nonConfidentialSummary.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="Founder Match"
        subtitle="University IP ideas listed for a founder to pick up. Expressing interest notifies the university's IP manager, who connects you with the professor."
        actions={
          <>
            <Select value={uniFilter} onValueChange={setUniFilter}>
              <SelectTrigger className="h-9 w-56 text-sm" aria-label="Filter by university">
                <SelectValue placeholder="All universities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All universities</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ideas…"
                className="h-9 w-52 pl-8 text-sm"
                aria-label="Search ideas"
              />
            </div>
          </>
        }
      />

      {/* My ideas — the ones this founder has picked up (portal-lite) */}
      {myIdeas.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-1 text-sm font-semibold text-foreground">My ideas</h2>
          <p className="mb-3 text-xs text-muted-foreground">
            Ideas you've picked up. Post updates for the university's IP manager — they see them on their side. You only ever see the non-confidential details.
          </p>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {myIdeas.map((idea) => (
              <MyIdeaCard key={idea.id} idea={idea} onPostUpdate={(t) => onPostUpdate(idea.id, t)} />
            ))}
          </div>
        </section>
      )}

      {myIdeas.length > 0 && <h2 className="mb-3 text-sm font-semibold text-foreground">Browse ideas</h2>}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((idea) => (
          <MarketplaceCard key={idea.id} idea={idea} onInterest={() => onInterest(idea.id)} />
        ))}
        {visible.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
            No listed ideas match{query ? ` “${query}”` : ""}
            {uniFilter !== ALL ? ` at ${uniFilter}` : ""}.
          </p>
        )}
      </div>
    </>
  );
}

/* A founder's own picked-up idea: non-confidential card + team (name-less
   inventor tier) + post-an-update. Shows only THIS founder's own updates back
   — never the IP manager's internal notes or other founders' posts. */
function MyIdeaCard({ idea, onPostUpdate }: { idea: IpIdea; onPostUpdate: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const team: TeamMember[] = teamOf(idea, "founder");
  const myUpdates = idea.noteLog.filter((n) => n.authorRole === "founder" && n.author === FOUNDER_NAME);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onPostUpdate(text);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-snug text-foreground">{idea.title}</p>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <CheckCircle2 className="h-3 w-3" /> Picked up
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Building2 className="h-3 w-3" /> {idea.university}
        </p>
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{idea.nonConfidentialSummary}</p>

      {/* Team — founder tier: co-founders + mentors + name-less inventor team */}
      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-foreground">
          <Users2 className="h-3.5 w-3.5" /> Team
        </p>
        <div className="flex flex-wrap gap-1.5">
          {team.map((m, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
            >
              {m.anonymous && <Lock className="h-3 w-3" />}
              {m.anonymous ? m.detail : m.name}
              <span className="text-muted-foreground/60">· {m.role}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Post an update */}
      <div className="space-y-2">
        <Textarea
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Post an update for the IP manager — progress, questions, milestones."
          className="text-xs"
          aria-label={`Post an update on ${idea.title}`}
        />
        <Button size="sm" variant="outline" disabled={!draft.trim()} onClick={submit}>
          <Send className="mr-1.5 h-3.5 w-3.5" /> Post update
        </Button>
      </div>

      {myUpdates.length > 0 && (
        <div className="space-y-1.5 border-t border-border pt-2">
          <p className="text-[11px] font-medium text-muted-foreground">Your updates</p>
          {myUpdates.slice(0, 3).map((n) => (
            <div key={n.id} className="rounded-md border border-border px-2.5 py-1.5">
              <p className="text-[10px] text-muted-foreground/70">{n.when}</p>
              <p className="text-xs leading-relaxed text-foreground/90">{n.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MarketplaceCard({ idea, onInterest }: { idea: IpIdea; onInterest: () => void }) {
  const mine = idea.interests.find((n) => n.founder === FOUNDER_NAME);
  const inConversations = idea.stage === "in_motion";

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug text-foreground">{idea.title}</p>
        {inConversations && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <MessagesSquare className="h-3 w-3" /> In conversations
          </span>
        )}
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Building2 className="h-3 w-3" /> {idea.university}
      </p>
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{idea.nonConfidentialSummary}</p>
      <div className="flex flex-wrap gap-1.5">
        <InvolvementChip involvement={idea.involvement} />
        {idea.disclosure.inventionStage.slice(0, 2).map((s) => (
          <span key={s} className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground whitespace-nowrap">
            {INVENTION_STAGE_LABEL[s]}
          </span>
        ))}
      </div>
      {mine ? (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {mine.status === "connected"
            ? `You're being connected with the inventor via ${idea.university}'s IP manager.`
            : `Interest sent — ${idea.university}'s IP manager has been notified.`}
        </p>
      ) : (
        <Button size="sm" variant="outline" className="w-full" onClick={onInterest}>
          <Hand className="mr-1.5 h-3.5 w-3.5" /> I want to pick this up
        </Button>
      )}
    </div>
  );
}
