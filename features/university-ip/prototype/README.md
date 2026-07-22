# University IP — Validation Prototype (v5 redesign)

A **clickable validation prototype** for the University IP feature, built on the
real Wildfire app's stack (React 18 + Vite + Tailwind + shadcn/ui). It is a
**throwaway mockup** — no backend, nothing persists — for clicking through the
flows with universities.

**v5 (2026-07-22)** is a management-model redesign, implementing the flow
critique's recommendation (Model A "one pipeline" + a thin attention strip):

1. **One lifecycle per idea.** The four scattered status fields
   (private/published × route × match status × free-text outcome) collapse into
   a single visible pipeline: **New → Reviewing → Routed → In motion → Done**,
   with **Hold as a pause flag** (not a route), **route** set when the idea is
   routed (Founder / Hackathon / Founder Match), and a real **outcome**
   (Company formed / Founder matched / Built at hackathon / Passed) with a
   short note when the idea is done. For Founder-Match ideas, routing **is**
   publishing — a "Listed for founders" toggle withdraws/restores the listing.
2. **Six IP-Manager screens become three.**
   - **Pipeline** (home): a quiet attention strip ("3 new ideas to review",
     "1 founder interest waiting", "1 on hold" — each chip filters the list)
     over one table of all ideas with stage tabs and a hold filter. It replaces
     the old portfolio, the read-only tracking dashboard, and the founder
     interest inbox.
   - **Idea detail** (slide-over from the pipeline): everything actionable in
     one place — advance the stage, pick the route, pause/resume hold, record
     the outcome, edit hackathon tracking (event / picked up by / what was
     built — previously had no write UI), respond to founder interest
     (connect / decline), flag professor involvement, send the professor
     invite, keep notes.
   - **Bring IP in**: six fields, each consumed downstream — title, one
     plain-language summary, professor **picked from the university directory**
     (department auto-fills), involvement, patent status, and an optional
     disclosure reference #. New ideas land in the pipeline as New.
3. **Founder interest lives on the idea.** Expressing interest on the
   marketplace attaches an interest record to the idea itself; it surfaces in
   the IP Manager's attention strip, on the pipeline row, and in the idea
   detail — and **Connect advances the idea** (routed → in motion) instead of
   flipping a parallel notification.
4. **Marketplace cards answer a founder's first two questions** — professor
   involvement (hands-on co-founder vs contact only) and patent status now
   render on each Founder-Match card.
5. **Calmer shell.** A left sidebar (wordmark, per-role nav, role switcher as a
   labeled demo control) replaces the black prototype banner, the tenancy
   legend, the gradient hero cards, and the nav-card home. All in-UI tier
   boxes (REC / GAP / PARKED) moved into this README — see below.

## Run it

```bash
npm install
npm run dev     # http://localhost:8754
```

## The four roles (switcher in the sidebar footer)

- **IP Manager** (Kirby Nelson, University of South Dakota) — the single
  university-side role (VP of Research merged in), scoped to their own
  university. Screens: Pipeline, idea detail, Bring IP in.
- **Professor** (Dr. Miriam Hale) — the idea owner, carried as the existing
  Founder role. One screen: their ideas, involvement per idea, and program
  progress for the founder route.
- **Founder (Match)** (Marcus Webb) — browses published Founder-Match ideas
  across universities (isolation applies to IP Managers, not this list),
  filters by university, and expresses interest.
- **Wildfire Admin** (Alex Rivera, WFL staff) — provisions university
  organizations, sees volume, and manages who's attached (assign/reassign
  IP Managers, attach/deactivate professors, deactivate/remove a university,
  destructive actions confirm).

## Tier notes (moved out of the UI)

Earlier versions rendered RECOMMENDED / GAP / PARKED tiers as in-app callouts.
v5 removes them from the UI; their content is preserved here, organized by
screen. (REC-1, REC-2, REC-4 were confirmed at earlier gates and are rendered
as normal scope.)

### Global

- **Prototype disclaimer** (was the black top banner): not functional, for
  validation only; no backend, nothing persists; not production code. Now a
  one-line note under the sidebar's demo control.
- **Multi-university tenancy (confirmed)** (was the legend bar): each
  university is its own organization with its own IP Managers, fully
  isolated — an IP Manager cannot see other universities' IP or the other
  universities at all. One university-side role (VPR merged into IP Manager).
  Only the Wildfire Admin sees all universities. Founder-facing Founder Match
  spans universities (isolation applies to IP Managers, not founders).

### IP Manager — Pipeline (was Portfolio + Tracking dashboard + Interest inbox)

- **REC-6 (needs sign-off):** a clearly legible per-idea state and a first-run
  empty state. v5's stage chips + outcome column are the proposed treatment.
- **REC-7 (needs sign-off):** attribution/audit — record who imported, routed,
  and published each piece of IP (protects the university relationship). Not
  built.
- **PARKED:** hackathon build/outcome data would come from the separate
  hackathon-management system being built elsewhere; it gets updated later
  with these learnings. The tracking fields here (event / picked up by / what
  was built) are manual entry for validation.
- **GAP:** who else can see the IP Manager's notes and recorded outcomes (the
  professor? the Wildfire Admin?) was not specified — rendered as the IP
  Manager's own record.

### IP Manager — Idea detail

- **REC-3 (needs sign-off):** wire imported IP ideas into the existing
  Idea/Application + Founder Match machinery rather than a parallel silo.
  Wiring specifics unresolved.
- **REC-5 (partially adopted in v5):** university-IP provenance label +
  professor contact on the published idea. v5 shows the owning university,
  professor involvement, and patent status on marketplace cards; a provenance
  label and direct professor contact details remain open.
- **PARKED:** publishing a hackathon-routed idea to an actual event — the
  hackathon-management integration and the planning-phase "select IP to
  include in a hackathon" notification are parked.
- **GAP:** everything past "connect the founder with the professor" — how a
  connection becomes a formal completed match and how the two-founder company
  forms — was not specified. v5 stops at Connect → idea moves in motion; the
  outcome is recorded manually.

### IP Manager — Bring IP in

- **GAP (superseded in v5):** spreadsheet import — columns/required fields
  were never specified ("however they want to do it"), so the mock import
  button is removed. v5 keeps individual add only, now with six concrete
  fields; bulk import returns when the office's spreadsheet format is
  confirmed (the disclosure reference # makes future imports de-duplicable).
- **Professor invite (confirmed):** the IP Manager creates the professor's
  profile/account and sends the invite; a tag attaches them as a Professor
  with the linked IP idea, applied at account creation.

### Founder Match (founder view)

- **GAP:** formal match completion / company formation after the
  IP-Manager-connects step — see Idea detail above.

### Professor view

- **PARKED:** whether professors could also be Mentors was mentioned as
  unlikely — nothing built.

### Wildfire Admin

- **GAP:** which fields a university carries beyond its organization name was
  not specified — only the name is editable in the drill-down.

## Out of scope (not rendered as features)

Separate VPR role, founder role-gating rethink, hackathon-management
integration.
