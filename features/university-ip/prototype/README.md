# University IP — Validation Prototype (v3, gate-3 feedback applied)

A **clickable validation prototype** for the University IP feature, built on the
real Wildfire app's stack (React 18 + Vite + Tailwind + shadcn/ui) with the app's
design tokens and UI components vendored from `WF-App-6-30`. It is a **throwaway
mockup** — no backend, nothing persists — for the PO to click through and
validate the reviewed intake before the DoD is written.

**v3 (2026-07-02)** folds in the PO's five gate-3 (round-3) changes:

1. **IP Portfolio company description** — clicking a company/idea in the IP
   Manager's portfolio opens its detail with an "About this company — what it
   does" description section.
2. **Wildfire Admin mechanics + drill-down** — edit a university, remove a
   university, reassign an IP Manager, deactivate a university and/or people
   (confirmation dialogs on destructive actions); each university row is
   clickable (e.g. University of South Dakota) into a deeper detail page
   showing its IP Managers, professors (which professors are tied to which
   university), ideas/pipeline, status, and actions.
3. **Founder Match university filter** — the founder-facing browse list spans
   universities (the cross-university GAP is RESOLVED: isolation applies to
   IP Managers, not founders) with a per-university filter and
   multi-university mock data.
4. **Interest notifies the IP Manager** — expressing interest sends a
   notification to the idea's IP Manager (new "Founder interest inbox"
   screen), who starts making connections — connecting the founder with the
   professor. Formal match completion / company formation stays a GAP callout.
5. **IP Manager home confirmed** — the role home IS the home page an IP
   Manager sees when they log in (the app-placement GAP is resolved).

**v2 (2026-07-02)** folded in the PO's four gate-2 changes:
professor invite with tag (REC-1 confirmed), a genuinely browsable Founder-Match
idea list, a Wildfire Admin tab (REC-2 confirmed), and an explicit fourth
"Hold (private)" disposition.

## Run it

```bash
npm install
npm run dev     # http://localhost:8754
```

## What it demonstrates (confirmed scope, from the intake)

- **IP Manager** — the single university-side role (VP of Research merged in at
  the PO gate), scoped to their own university (multi-university tenancy,
  confirmed). Gate-3: the role home IS the home page an IP Manager sees when
  they log in (confirmed):
  - **IP portfolio** — the university's IP as ideas, private by default;
    select & publish (bulk publish skips ideas on Hold). Gate-3: clicking a
    company/idea opens its detail with an "About this company — what it does"
    description section.
  - **Founder interest inbox** — gate-3: notifications when a founder
    expresses interest in one of this university's Founder-Match ideas, with
    the "start making connections — connect founder ↔ professor" step.
  - **Bring IP in** — spreadsheet import + individual add (both land private,
    associated with a professor); an idea can be marked **Hold** at import
    (gate-2).
  - **Idea routing view** — professor association, the per-idea
    professor-involvement flag, **create the professor's profile & send the
    invite** with the Professor + linked-IP-idea tag applied at account
    creation (gate-2, was REC-1), and the **four dispositions**:
    Founder / Hackathon / Founder Match / **Hold (private)** (gate-2). Held
    ideas stay private and can't be published.
  - **Tracking dashboard** — cross-route tracking of every idea, modeled on the
    app's existing founder-tracking system, plus explicit **On Hold** vs
    default private/unrouted buckets.
- **Professor (Founder)** — the idea owner carried as the existing Founder role
  plus the confirmed university-IP-origin analytics tag; invited via the
  IP-Manager-created account with the Professor + linked-IP-idea tag (gate-2);
  runs the normal Wildfire process.
- **Founder (Match)** — gate-2: a founder has an account, logs in, and browses
  ALL the published Founder-Match IP ideas submitted for other people to pick
  up. Gate-3: the list spans universities with a per-university filter
  (cross-university breadth RESOLVED — isolation applies to IP Managers, not
  founders), and the "I want to pick this up" interest step notifies the
  idea's IP Manager. Formal match completion / company formation remains a
  GAP callout.
- **Wildfire Admin** — gate-2 (was REC-2): what universities are in the
  system, what's going through them (pipeline/volume per university by
  disposition and publish state), who's attached (IP Managers, professors),
  and provisioning a university org + assigning its IP Manager. Gate-3:
  edit/remove a university, reassign an IP Manager, deactivate a university
  and/or people (confirmation dialogs on destructive actions), and a
  clickable per-university drill-down detail page showing which professors
  are tied to which university.

## Tiers

- **Confirmed scope** renders as normal app UI.
- **RECOMMENDED (not yet confirmed)** items (REC-3/5/6/7) render in a
  visually distinct dashed violet tier — needs PO sign-off, never blended into
  confirmed scope. (REC-1, REC-2 were confirmed at gate 2 and are now rendered
  as confirmed scope; REC-4 was confirmed earlier.)
- **GAP / PARKED** items render as amber/grey callouts (import mechanics,
  formal match completion / company formation after the IP-Manager-connects
  step, hackathon-management integration, planning-phase hackathon selection)
  — surfaced honestly, never invented. (Gate-3 resolved the former GAPs on
  cross-university list breadth and on the app placement of the IP Manager
  home.)

Out-of-scope items (separate VPR role, founder role-gating rethink,
hackathon-management integration) are **not rendered as features**.
