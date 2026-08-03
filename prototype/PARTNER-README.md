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
be every kind of user in one browser window. Click **How to demo** in the top bar
for a guided path. The short version:

1. **Wildfire Super Admin** — set up a university and assign its IP Manager.
2. **IP Manager** — import a disclosure spreadsheet. Every row lands **private**.
3. **IP Manager** — read the AI-drafted summary and fix it. You can't publish anything
   until a human has read the draft and ticked it off against the university's release
   criteria; one of the seeded drafts has a confidential phrase in it that shouldn't be
   there. That's on purpose.
4. **IP Manager** — publish outward through the scope steps, past the two-checkbox gate.
5. **IP Manager** — set the route: Founder, Hackathon, or Founder Match.
6. **Founder / student** — find it on their home page and raise a hand.
7. **IP Manager** — approve, and a team forms.
8. **IP Manager** — send that team to the next I-Corps cohort.
9. **Audit trail** — every step above, with who did it and when.

Then see it the way an outsider does. Pick **View as a visitor** in the persona menu:

10. **The public catalogue** — only the handful of items pushed all the way to `public`
    are out here. Everything else is invisible without an account, which is the point.
11. **Sign up on one of them** — the disclosure you clicked follows you through signup
    and you land on it, connected to the right IP manager.
12. **IP Manager → Lead review** — signups that look automated or empty are held before
    they can approach the university, with the reasons shown. Try signing up with a
    throwaway address and a one-word answer to see one get held.
13. **University Leadership** — switch to the VP for Research. Read-only: the portfolio
    by scope and by department, the pipeline from disclosure through to an I-Corps
    cohort, and a panel naming what has stopped moving and for how long. There is not a
    single button on the page, and every manager URL bounces back here.

"Reset demo data" in the persona menu puts everything back.

---

## The two ideas worth arguing with

**Who can see it** and **what happens next** are deliberately separate.

- **Publish scope** — `private → campus → statewide → national founder network → public`.
  Only the non-confidential summary is ever published. The confidential disclosure text
  never leaves the IP office at any scope. Widening the scope needs two explicit
  confirmations, and the last step — out onto the open internet, where search engines
  will index it — asks a third time, because that one cannot be taken back.
- **Route** — `Founder`, `Hackathon`, or `Founder Match`. Raising a hand is how Founder
  Match works once something is published.

Everything up to `national` needs an account to see. `public` is the exception, and it is
a per-item decision an IP manager makes deliberately, not a setting anybody flips once.

Every item also carries an **ownership flag** (Board of Regents / student-owned /
entangled, because the rules genuinely differ), a **role for each inventor** (hands-on
co-founder vs. contact only — set per person, and a university can require contact-only
across the board), and a full audit trail.

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

The captcha and the emailed verification code on signup are simulated, and the AI that
drafts the public summaries is a stand-in that produces fixed text. What's real is the
decisions they feed: the review gate, the risk scoring, and the queue.

---

## Telling us what's wrong

That's what this is for. Useful things to react to:

- Does the IP Manager flow match how disclosures actually move at Mines?
- Is the private → campus → statewide progression the right shape, and is the
  two-confirmation gate enough for BOR-owned IP?
- Is the disclosure form missing fields your process needs?
- Are the release criteria on the policy page the right list, and is ticking them one by
  one at review time reasonable or tedious?
- Is anything at Mines ever going all the way to `public`, or does `national` end it?
- Would a student or faculty member actually raise a hand on one of these?
- Does the leadership view answer the questions a VP for Research actually gets asked,
  and is read-only the right call, or does that role need to act on something?
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
