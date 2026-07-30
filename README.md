# University IP — Feature Package

Dedicated per-feature repository for the **University IP** feature of the Wildfire
app, produced by the [WFL feature pipeline](https://github.com/Tom-WFL/WFL-Dev-feature-builder).

## Status: Gate 2 — Prototype (awaiting PO review)

The intake remains a GATE: Tom reviews it, resolves the `[GAP]` items, decides the parked
`dependencies`, and signs off (accept/edit/reject) every `recommendation` and the
`spine`. A clickable prototype now sits alongside it so those decisions can be made
against something real rather than a document.

- `features/university-ip/university-ip_intake.json` — the structured, gap-flagged
  intake, built faithfully from the Jul 2 "University IP" transcript.
- `prototype/` — a clickable, data-seeded walkthrough of the feature, covering the Jul 2
  intake plus everything the Jul 30 Weekly Requirements Review added (visibility tiers, the
  AI summary approval gate and its guardrails, NDAs, hand raises, multi-institution
  policies, leadership analytics). All data is fake and lives in the browser.

**Prototype:** https://tom-wfl.github.io/University-IP/ — see
[`prototype/README.md`](prototype/README.md) for the demo script, the placeholder register,
and a table mapping every requirement to the screen that shows it.

### Lanes (kept separate)
- **Faithful lane** — `decisions` (PO-confirmed only), `[GAP]` markers (meeting-silent
  specifics, nothing invented), and `dependencies` (parked / pending PO).
- **Recommendations lane** — proactive proposals that would complete the MVP;
  each is `Recommended — needs PO sign-off` and is NOT a confirmed decision.

The one truth: the MVP is the smallest thing that FULLY serves the goal — getting
university IP into the Wildfire app and routed down the three paths.
