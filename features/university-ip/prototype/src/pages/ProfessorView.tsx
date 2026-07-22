import { PageHeader } from "@/components/Shell";
import { StageChip, HoldChip, RouteBadge, OutcomeChip, InvolvementChip } from "@/components/chips";
import { PROFESSOR_PERSONA, PHASE_ORDER, UNIVERSITY, IP_MANAGER, type IpIdea } from "@/data";
import { CheckCircle2 } from "lucide-react";

/* Professor view — the idea owner, carried as the existing Founder role.
   One screen: their ideas, their involvement on each, and (for the founder
   route) their progress through the normal Wildfire program. */

export default function ProfessorView({ ideas }: { ideas: IpIdea[] }) {
  const mine = ideas.filter((i) => i.professor === PROFESSOR_PERSONA);

  return (
    <>
      <PageHeader
        title="My ideas"
        subtitle={`Your IP at ${UNIVERSITY}, as ideas in Wildfire. ${IP_MANAGER} (IP Manager) handles routing; your involvement is flagged per idea.`}
      />
      <div className="max-w-3xl space-y-4">
        {mine.map((idea) => (
          <div key={idea.id} className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-1.5">
              <StageChip stage={idea.stage} />
              {idea.onHold && idea.stage !== "done" && <HoldChip />}
              {idea.route && <RouteBadge route={idea.route} />}
              {idea.stage === "done" && idea.outcome && <OutcomeChip outcome={idea.outcome} />}
            </div>
            <h2 className="mt-2.5 text-base font-semibold text-foreground">{idea.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{idea.summary}</p>
            <div className="mt-3">
              <InvolvementChip involvement={idea.involvement} />
            </div>

            {/* Founder-route program progress — the existing Wildfire process */}
            {idea.route === "founder" && idea.founderTracking && (
              <div className="mt-4 rounded-md border border-border bg-muted/40 p-4">
                <p className="text-sm font-medium text-foreground">
                  {idea.founderTracking.companyName}
                  {idea.founderTracking.coFounder && (
                    <span className="font-normal text-muted-foreground"> · with {idea.founderTracking.coFounder}</span>
                  )}
                </p>
                <div className="mt-3 space-y-1.5">
                  {PHASE_ORDER.map((phase) => {
                    const cur = idea.founderTracking!.currentPhase;
                    const curIdx = PHASE_ORDER.indexOf(cur);
                    const idx = PHASE_ORDER.indexOf(phase);
                    return (
                      <div key={phase} className="flex items-center gap-2.5">
                        {idx < curIdx ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <span
                            className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${idx === curIdx ? "border-primary" : "border-border"}`}
                          />
                        )}
                        <span
                          className={`text-sm ${idx === curIdx ? "font-medium text-foreground" : idx < curIdx ? "text-foreground/80" : "text-muted-foreground"}`}
                        >
                          {phase}
                        </span>
                        {idx === curIdx && <span className="text-[11px] text-muted-foreground">current phase</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Lessons completed</span>
                    <span className="tabular-nums">
                      {idea.founderTracking.lessonsCompleted}/{idea.founderTracking.totalLessons}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{
                        width: `${(idea.founderTracking.lessonsCompleted / idea.founderTracking.totalLessons) * 100}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  You run the normal Wildfire founder process — nothing extra to manage here.
                </p>
              </div>
            )}
          </div>
        ))}
        {mine.length === 0 && <p className="text-sm text-muted-foreground">No ideas linked to your account yet.</p>}
      </div>
    </>
  );
}
