# University IP — Validation Prototype

A **clickable validation prototype** for the University IP feature, built on the
real Wildfire app's stack (React 18 + Vite + Tailwind + shadcn/ui) with the app's
design tokens and UI components vendored from `WF-App-6-30`. It is a **throwaway
mockup** — no backend, nothing persists — for the PO to click through and
validate the reviewed intake before the DoD is written.

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
    select & publish.
  - **Bring IP in** — spreadsheet import + individual add (both land private,
    associated with a professor).
  - **Idea routing view** — professor association, the per-idea
    professor-involvement flag (day-to-day co-founder vs contact-only), the
    three routes (Founder / Hackathon / Founder Match), and publish.
  - **Tracking dashboard** — cross-route tracking of every idea, modeled on the
    app's existing founder-tracking system (`founderAnalyticsService` +
    the Analytics Dashboard Founders card): founder-route program progress
    (phase / lessons / engagement), hackathon-route "what was built",
    founder-match status.
- **Professor (Founder)** — the idea owner carried as the existing Founder role
  plus the confirmed university-IP-origin analytics tag; runs the normal
  Wildfire process.
- **Co-founder (Match)** — existing Founder matched via Founder Match; two
  founders in one company, as today.

## Tiers

- **Confirmed scope** renders as normal app UI.
- **RECOMMENDED (not yet confirmed)** items (REC-1/2/3/5/6/7) render in a
  visually distinct dashed violet tier — needs PO sign-off, never blended into
  confirmed scope.
- **GAP / PARKED** items render as amber/grey callouts (import mechanics,
  professor account provisioning, hackathon-management integration, planning-
  phase hackathon selection) — surfaced honestly, never invented.

Out-of-scope items (separate VPR role, founder role-gating rethink,
hackathon-management integration) are **not rendered as features**.
