import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/Shell";
import { InvolvementChip, PatentChip } from "@/components/chips";
import { FOUNDER_NAME, type IpIdea } from "@/data";
import { Building2, Search, Hand, CheckCircle2, MessagesSquare } from "lucide-react";

/* Founder Match marketplace — every published Founder-Match idea across
   universities. Expressing interest attaches an interest record to the idea,
   which surfaces in that university's IP Manager pipeline. */

const ALL = "__all__";

export default function CofounderView({
  ideas, onInterest,
}: {
  ideas: IpIdea[];
  onInterest: (ideaId: number) => void;
}) {
  const [query, setQuery] = useState("");
  const [uniFilter, setUniFilter] = useState<string>(ALL);

  const marketplace = useMemo(
    () =>
      ideas.filter(
        (i) =>
          i.route === "founder_match" &&
          i.published &&
          !i.onHold &&
          (i.stage === "routed" || i.stage === "in_motion")
      ),
    [ideas]
  );
  const universities = useMemo(() => [...new Set(marketplace.map((i) => i.university))], [marketplace]);
  const visible = marketplace.filter(
    (i) =>
      (uniFilter === ALL || i.university === uniFilter) &&
      (i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.summary.toLowerCase().includes(query.toLowerCase()))
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
      <p className="flex-1 text-xs leading-relaxed text-muted-foreground">{idea.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        <InvolvementChip involvement={idea.involvement} />
        <PatentChip status={idea.patentStatus} />
      </div>
      {mine ? (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50/70 px-2.5 py-1.5 text-[11px] text-emerald-800">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          {mine.status === "connected"
            ? `You're being connected with ${idea.professor}.`
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
