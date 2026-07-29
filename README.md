# University IP — Feature Package

Dedicated per-feature repository for the **University IP** feature of the Wildfire
app, produced by the [WFL feature pipeline](https://github.com/Tom-WFL/WFL-Dev-feature-builder).

## What's in here

| Path | What it is |
|---|---|
| `prototype/` | **Interactive prototype** — a clickable University IP module in the real app's design language. Run it, click through it, demo it. |
| `candidates/` | The reviewed feature candidates from the Jul 28 SD Mines meeting (34 features + 4 recommendations). |
| `features/university-ip/university-ip_intake.json` | The Gate 1 feature-intake artifact from the Jul 2 transcript. |
| `docs/port-map.md` | How every prototype concept maps onto the real app's tables, RLS, RBAC, and components. |

## Running the prototype

**No install:** open `prototype/university-ip-prototype.html` in any browser. It's
the whole app inlined into one self-contained file — no server, no network. Good
for emailing to someone or opening on a laptop in a meeting room with bad wifi.

**From source:**

```bash
cd prototype
npm install
npm run dev
```

Then open the printed URL. To regenerate the single-file build after changing
anything: `npm run build:single`. There is no backend and no login — a **persona
switcher** in the top right lets you move between all four roles in one browser.
State lives in `localStorage`; "Reset demo data" in that same menu puts it back.

Click **How to demo** in the top bar for the golden path. In short:

1. **Wildfire Super Admin** provisions a university and assigns its IP Manager.
2. **IP Manager** imports a disclosure spreadsheet — every row lands private.
3. **IP Manager** publishes one item outward through the scope stepper
   (private → campus → statewide → national), passing the dual-control gate.
4. **IP Manager** sets the route: Founder, Hackathon, or Founder Match.
5. **Founder** finds it on their home page, opens it, and raises a hand.
6. **IP Manager** approves — a team forms on the spot.
7. **IP Manager** sends that team to the next I-Corps cohort.
8. The **audit trail** shows every step, with who and when.

## The model

Two independent axes, which is the thing to look at first:

- **Publish scope** — *who can see it.* `private → campus → statewide → national
  founder network`. Only the non-confidential summary is ever published;
  confidential disclosure text never leaves the IP office at any scope. Widening
  the scope requires **dual control** (two explicit confirmations).
- **Route** — *what happens next.* `Founder`, `Hackathon`, or `Founder Match`.
  Hand-raising is how Founder Match works on a published item.

Plus, on every item: an **ownership flag** (BOR-owned / student-owned /
entangled, because the rules differ), a **faculty-involvement flag** (hands-on
co-founder vs contact only), and a full **audit trail**.

For founders and students there is **one home page** — their hand-raises, their
team, their I-Corps status, their hackathons, and discovery rails for IP,
hackathons and cohorts they could join.

## Scope

**In:** everything above, plus super-admin university provisioning and the
professor invite/involvement flow.

**Out** (Tom's call): I-Corps management — intake dashboards, tech scout,
reporting, metrics, evaluator import — is a separate build; the only I-Corps
surface here is the handoff that submits a formed team to a cohort. Also out:
the business plan competition module, program admin, the comprehensive founder
dashboard, the AI customer-interview coach, industry-partner access (the meeting
deferred it to "version three"), CMS, and hackathon event management (listings
only).

## Status

This is a **prototype for review**, not an implementation. Nothing in
`Tom-WFL/WF-App-7-10` has been touched, and no tickets have been filed. The DoD
and access-matrix stages run after Tom reviews this.

All data in the prototype is synthetic — the disclosures, people, and numbers
are invented for the demo.

## Earlier gate: the feature intake

`features/university-ip/university-ip_intake.json` is the Gate 1 artifact built
from the Jul 2 transcript. It keeps two lanes separate — `decisions` (PO-confirmed
only) with `[GAP]` markers for anything the meeting left silent, and a
`recommendations` lane of proactive proposals. Several of its parked
`dependencies` are still open; `docs/port-map.md` lists the ones that survived
into this prototype as provisional choices.
