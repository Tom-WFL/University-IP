# University IP — Validation Prototype (v2, gate-2 feedback applied)

A **clickable validation prototype** for the University IP feature, built on the
real Wildfire app's stack (React 18 + Vite + Tailwind + shadcn/ui) with the app's
design tokens and UI components vendored from `WF-App-6-30`. It is a **throwaway
mockup** — no backend, nothing persists — for the PO to click through and
validate the reviewed intake before the DoD is written.

**v2 (2026-07-02)** folds in the PO's four gate-2 changes:
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
  confirmed):
  - **IP portfolio** — the university's IP as ideas, private by default;
    select & publish (bulk publish skips ideas on Hold).
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
  up, with an "I want to pick this up" interest step (match-completion
  mechanics remain a GAP callout, as does cross-university list breadth).
- **Wildfire Admin** — gate-2 (was REC-2): what universities are in the
  system, what's going through them (pipeline/volume per university by
  disposition and publish state), who's attached (IP Managers, professors),
  and provisioning a university org + assigning its IP Manager.

## Tiers

- **Confirmed scope** renders as normal app UI.
- **RECOMMENDED (not yet confirmed)** items (REC-3/5/6/7) render in a
  visually distinct dashed violet tier — needs PO sign-off, never blended into
  confirmed scope. (REC-1, REC-2 were confirmed at gate 2 and are now rendered
  as confirmed scope; REC-4 was confirmed earlier.)
- **GAP / PARKED** items render as amber/grey callouts (import mechanics,
  founder-match pickup/match-completion mechanics, cross-university breadth of
  the founder-facing list, hackathon-management integration, planning-phase
  hackathon selection) — surfaced honestly, never invented.

Out-of-scope items (separate VPR role, founder role-gating rethink,
hackathon-management integration) are **not rendered as features**.
