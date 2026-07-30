# University IP — clickable prototype

A walkthrough build of the University IP feature. Everything is fake: the data is seeded in
the browser, saved to `localStorage`, and reset with one click. Nothing leaves the page and
there is no backend.

**Live:** https://tom-wfl.github.io/University-IP/

## Run it locally

```bash
cd prototype
npm install
npm run dev
```

## Who you can be

Use the **Viewing as** control in the top-right to switch roles mid-demo. Data is shared
across roles, so a hand raise made as a founder shows up immediately in the IP Manager's
queue — that shared loop is the point of the walkthrough.

| Role | Who | What they see |
|---|---|---|
| Public visitor | — | The marketing stand-in and the account gate |
| Founder | Marcus Webb | Discovery, IP detail, hand raises, next steps |
| IP Manager | Kirby Hale (University of South Dakota) | Portfolio, IP editor, import, hand-raise queue, settings |
| IP Manager | Rachel Nolan (SD School of Mines) | The same screens for a second institution, with a different release policy |
| Leadership | Dan Roberts (VP of Research, USD) | Read-only analytics |

You can also pin a role in a link you hand out: `?role=kirby`, `?role=mines`,
`?role=founder`, `?role=leadership`.

## Suggested demo script

1. Start at **Welcome** and click **Adaptive Prosthetic Socket Liner (IP #51)**.
2. Create an account. Note the banner naming the IP you clicked — you land on that IP,
   connected to USD's IP Manager, rather than on a generic home page.
3. The summary is blurred until you accept the NDA. Accept it, read the concept summary,
   then **raise your hand**.
4. Switch to **Kirby Hale**. Your hand raise is already in the queue. Open it and approve —
   the IP flips to Converted.
5. Switch back to the founder and open **Next Steps**: mentor, mastermind and course library
   are now unlocked.
6. Back as Kirby, open **IP #63 (Solid-State Sodium Battery Electrolyte)**. The AI draft is
   full of temperatures, pressures and a step-by-step method, and the guardrail panel flags
   every one. Approving it warns you first.
7. Try releasing **IP #108** (School of Mines) without approving its summary — it's blocked.
   Then switch to Rachel and release something campus-first to see the staged policy differ
   from USD's wide net.

## What's a placeholder

- **The guardrail scan is keyword matching, not AI.** It is deterministic so the demo behaves
  the same every time. The real non-disclosure criteria have to come from the universities.
- **Excel import reads CSV only.** The column template was never specified.
- **The NDA text is filler**, and it is one blanket agreement per person. Per-IP vs blanket,
  document storage and per-institution templates are all still open.
- **Equity and revenue sharing appear nowhere.** It was raised at the meeting and parked.
- **"Converted" is manager-marked.** Conversions that happen outside Wildfire have no data source.
- **The hackathon and founder-direct routes are labels, not flows.** Only Founder Match is
  walkable end to end.
- **Leadership and VP of Research are merged** into one read-only persona; whether they are
  distinct roles in the app is unresolved.
- **State ownership (SD Board of Regents vs North Dakota) is a settings note**, not logic.

## Where each requirement shows up

Candidate IDs are from `candidates/2026-07-30-weekly-requirements-review.json` in
`Tom-WFL/Random` (the Jul 30 Weekly Requirements Review extraction). `UIP-*` is the
University IP track; `MB-*` is cross-cutting main-build. Everything below is a
**candidate — needs review**, not a settled requirement.

| ID | Requirement | Where to see it |
|---|---|---|
| UIP-1 | IP portfolio system replacing spreadsheets | `/manager` |
| UIP-2 | Bulk CSV/Excel import | `/manager/import` (3-step wizard, sample file, column mapping, row warnings) |
| UIP-3 | Single disclosure entry | **Add IP** dialog on `/manager` |
| UIP-4 | Manager edits every field | Record details card on `/manager/ip/:id` |
| UIP-5 | Private by default | Add IP + import both land Private; toast says so |
| UIP-6 | Tiered release campus → statewide → network | Visibility dropdown + staged-policy confirm (Mines) |
| UIP-7 | Visibility dropdown replaces a published toggle | Inline on every portfolio row and the detail page |
| UIP-8 | AI concept summary without the method | Concept summary card; **Generate** has a working delay |
| UIP-9 | Manager approves the summary before release | Approve button; release is blocked until approved |
| UIP-10 | Strict non-disclosure guardrails | Criteria list + flag panel; see IP #63 |
| UIP-11 | Pre-publish cross-check warnings | Dialog shown on any release |
| UIP-12 | Founder discovery view | `/founder` |
| UIP-13 | Raise your hand | IP detail → **Raise your hand** |
| UIP-14 | Manager connects / approves / declines | `/manager/hand-raises` |
| UIP-15 | NDA before reading a summary | Blurred summary + NDA dialog on first access |
| UIP-16 | Three routes per IP | Route card on `/manager/ip/:id` |
| UIP-17 | Inventor contact-only vs involved | Involvement card; shown to founders on IP detail |
| UIP-18 | Institution can force contact-only | `/manager/settings`; involved option locks out |
| UIP-19 | Read-only leadership role | `/leadership` — no edit affordances anywhere |
| UIP-20 | Added / private / converted / takers / aging | `/leadership` stat row + aging table |
| UIP-21 | Multiple institutions, own IP managers | Switch between Kirby and Rachel — separate portfolios and settings |
| UIP-22 | State-by-state ownership differences | Ownership card on `/manager/settings` |
| MB-2 | Account gate + record of who saw what | `/signup`; "Who has seen this" on `/manager/ip/:id` |
| MB-3 | Marketing surface interest | `/welcome` (explicitly a stand-in) |
| MB-4 | Deep link survives signup | `/welcome` → IP #51 → `/signup?ip=uip-051` → that IP |
| MB-8 | Mentor / mastermind / course library on entry | `/founder/journey` |

Raised as recommendations rather than meeting decisions, and visible here for reaction:
a per-IP access log (REC-1), re-approval after a summary is edited (REC-3), per-institution
configurability (REC-5), and bulk handling when several founders want the same IP (REC-6).

Not built here because they belong to the main app, not this module: the unified
discovery homepage (MB-1), the marketing lead pipeline (MB-3 proper), the founder vetting
bar (MB-6), and cross-program funnel analytics (MB-7).
