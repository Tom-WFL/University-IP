# University IP — Feature Package

Dedicated per-feature repository for the **University IP** feature of the Wildfire
app, produced by the [WFL feature pipeline](https://github.com/Tom-WFL/WFL-Dev-feature-builder).

## Status: Gate 1 — Feature Intake (awaiting PO review)

This repo currently contains only the **feature-intake** artifact. The intake is a
GATE: Tom reviews it, resolves the `[GAP]` items, decides the parked
`dependencies`, and signs off (accept/edit/reject) every `recommendation` and the
`spine` before any downstream stage (prototype, DoD, matrix-diff) runs.

- `features/university-ip/university-ip_intake.json` — the structured, gap-flagged
  intake, built faithfully from the Jul 2 "University IP" transcript.

### Lanes (kept separate)
- **Faithful lane** — `decisions` (PO-confirmed only), `[GAP]` markers (meeting-silent
  specifics, nothing invented), and `dependencies` (parked / pending PO).
- **Recommendations lane** — proactive proposals that would complete the MVP;
  each is `Recommended — needs PO sign-off` and is NOT a confirmed decision.

The one truth: the MVP is the smallest thing that FULLY serves the goal — getting
university IP into the Wildfire app and routed down the three paths.
