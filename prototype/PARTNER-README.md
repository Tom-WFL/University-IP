# University IP — a working prototype

Built by **Wildfire Labs** for South Dakota Mines.

This is a clickable prototype of a University IP module for the Wildfire app: a way to
get a university's IP disclosures into the platform, decide who can see each one, and
route it toward somebody who will actually build it.

It is a prototype, not a product. It runs entirely in your browser and saves nothing
anywhere. The point is for you to click through it and tell us what's wrong.

---

## Open it

**Double-click `university-ip-prototype.html`.** That's it — it opens in any browser,
needs no install, and works with the wifi off.

Everything below is optional.

---

## Everything in it is made up

Every disclosure, inventor, case number, funding source and person in this prototype is
**invented for the demo**. `SDM-2024-014` is not a real Mines disclosure. The inventor
email addresses use the reserved `.example.edu` domain so they cannot reach anyone. No
real university IP has been put into this.

---

## What to look at

There's a **persona switcher** in the top right — it replaces logging in, and lets you
be all four kinds of user in one browser window. Click **How to demo** in the top bar
for a guided path. The short version:

1. **Wildfire Super Admin** — set up a university and assign its IP Manager.
2. **IP Manager** — import a disclosure spreadsheet. Every row lands **private**.
3. **IP Manager** — read the AI-drafted summary and fix it. You can't publish anything
   until a human has read the draft; one of the seeded drafts has a confidential phrase
   in it that shouldn't be there. That's on purpose.
4. **IP Manager** — publish outward through the scope steps, past the two-checkbox gate.
5. **IP Manager** — set the route: Founder, Hackathon, or Founder Match.
6. **Founder / student** — find it on their home page and raise a hand.
7. **IP Manager** — approve, and a team forms.
8. **IP Manager** — send that team to the next I-Corps cohort.
9. **Audit trail** — every step above, with who did it and when.

"Reset demo data" in the persona menu puts everything back.

---

## The two ideas worth arguing with

**Who can see it** and **what happens next** are deliberately separate.

- **Publish scope** — `private → campus → statewide → national founder network`.
  Only the non-confidential summary is ever published. The confidential disclosure text
  never leaves the IP office at any scope. Widening the scope needs two explicit
  confirmations.
- **Route** — `Founder`, `Hackathon`, or `Founder Match`. Raising a hand is how Founder
  Match works once something is published.

Every item also carries an **ownership flag** (Board of Regents / student-owned /
entangled, because the rules genuinely differ), a **faculty-involvement flag** (hands-on
co-founder vs. contact only), and a full audit trail.

Founders and students get **one home page**: their hand-raises, their team, their
I-Corps status, their hackathons, and places to find IP, hackathons and cohorts.

---

## What's deliberately not here

Running I-Corps itself — intake dashboards, tech scouting, reporting, metrics — is a
separate piece of work. The only I-Corps surface in this prototype is the handoff that
submits a formed team to a cohort, because that was the missing link between IP and
I-Corps.

Also not built yet: the business plan competition, hackathon management (you can see
hackathons listed, but not run one), industry-partner access, and a program-wide
dashboard.

---

## Telling us what's wrong

That's what this is for. Useful things to react to:

- Does the IP Manager flow match how disclosures actually move at Mines?
- Is the private → campus → statewide progression the right shape, and is the
  two-confirmation gate enough for BOR-owned IP?
- Is the disclosure form missing fields your process needs?
- Would a student or faculty member actually raise a hand on one of these?
- What would your IT or security office need to see before this could be used?

Send notes to **Tom Olson** — tom@wildfirelabs.io.

---

## If you want to run it from source

Not necessary to review it, but the full source is here if you or your IT team want to
look. Needs [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Then open the URL it prints. To rebuild the single-file version after a change:

```bash
npm run build:single
```

There is no backend, no database, no login and no network traffic. All state lives in
your browser's local storage.
