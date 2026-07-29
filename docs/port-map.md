# Port map — prototype concept → Wildfire app anchor

The prototype in `prototype/` is a standalone React app with a mock store. This
document maps each concept in it to where it would actually live in the real
Wildfire app (`Tom-WFL/WF-App-7-10`), so implementation is a port rather than a
reinterpretation.

Paths below are relative to the WF-App-7-10 repo.

## The good news

Three things already exist and carry a lot of the weight:

1. **`organizations.org_kind` already includes `'university'`** — see the enum in
   `src/integrations/supabase/types.ts` and `docs/rbac-revamp/WLF-648-epic-and-tickets.md`.
   Universities are already a representable tenant, with `parent_org_id` giving
   the campus → statewide hierarchy that publish scope needs.
2. **`ideas` is already private by default.** The RLS policy in
   `supabase/migrations/20260605000010_rbac_rls_ideas.sql` restricts SELECT to the
   owner plus hub admins. The "everything lands private" guarantee is the
   existing behavior, not something to build.
3. **`invite-to-org`** (`supabase/functions/invite-to-org/`) already does
   email + magic-link + membership provisioning, superseding the seven
   per-role invite functions. The professor invite flow is a caller, not a new
   mechanism.

## Entity mapping

| Prototype type (`prototype/src/data/types.ts`) | Real anchor | What's new |
|---|---|---|
| `University` | `organizations` (`org_kind='university'`, `parent_org_id`) | `autoApproveMatches` → a key in `organizations.settings` jsonb |
| `IpItem` | `ideas` (+ satellite `idea_files`, `idea_notes`) | New columns: `visibility_scope`, `published_summary`, `ownership`, `faculty_attachment`, `shelved`, the disclosure-form fields, plus the summary-provenance set below |
| `Inventor` | — | **New child table** (`idea_inventors`): `idea_id, name, email, is_primary, departed`. Distinct from `professorId`, which is the *account* link for the primary inventor |
| `HandRaise` | — | **New table.** Shape follows `mentor_assignments` / `investor_company_assignments` (join + `assigned_by`/`assigned_at`), but adds a request → approve handshake those lack |
| `Team` | `companies` + `users.company_id` | Creation on match-approval; see `src/hooks/useCompanyManagement.ts` for the existing create-company-then-invite-founders pattern |
| `CohortApplication` | `mm_cohort` / `mm_group` / `mm_group_company` | A cohort *application* entity (the mastermind tables model membership, not application) |
| `Cohort` | `mm_cohort` (`hub_id, name, status, starts_on, ends_on`) | — |
| `Hackathon`, `HackathonRegistration` | — | **Fully new.** Zero matches for "hackathon" anywhere in the repo |
| `AuditEvent` | — | **New table.** No audit infrastructure exists today |
| `Invite` | `memberships` (`membership_status`: `invited \| active \| archived`) + `invite-to-org` | — |
| `User` / `Persona` | `users` + `memberships` + `membership_roles` | New role keys (see below) |

## The AI summary and its review gate

`publicSummary` is the only body text ever published, so who wrote it and
whether a human has read it are columns, not metadata. On `ideas`:

| Prototype field | Real column | Notes |
|---|---|---|
| `summarySource` | `summary_source` (`'ai' \| 'human'`) | Sits alongside the existing `ai_feedback` / `ai_rating` |
| `summaryReviewed` | `summary_reviewed boolean not null default false` | — |
| `summaryReviewedBy` | `summary_reviewed_by` → `users` | — |
| `summaryReviewedAt` | `summary_reviewed_at timestamptz` | — |

**The gate: an unreviewed AI draft cannot be published.** In the prototype this
is `canPublish()` in `prototype/src/data/store.ts`, consumed by the scope
stepper, the console filter and the dashboard count so they cannot drift apart.

In the real app **a UI check is not sufficient** — this has to be a server-side
precondition, either a `CHECK`-style guard inside the publish RPC or a condition
on the RLS policy that widens `visibility_scope`. Follow the
`set_idea_outreach_status` RPC pattern: privileged state transitions go through
`SECURITY DEFINER` functions, not direct table writes.

Drafting itself is mocked (`prototype/src/lib/aiSummary.ts`) — see "Things the
prototype fakes". The real version is a server-side model call whose output
lands with `summary_source='ai'`, `summary_reviewed=false`.

## The two axes

The prototype's central model — **scope is who can see it, route is what happens
next** — maps onto two independent columns on `ideas`:

- **`visibility_scope`** (`private | campus | statewide | national`). Enforced by
  a widened SELECT RLS policy that walks `organizations.parent_org_id`:
  - `private` — existing policy, owner + IP staff only
  - `campus` — viewer's org == the IP's org
  - `statewide` — viewer's org shares a `parent_org_id` with the IP's org
  - `national` — any authenticated founder, including network founders with no
    school (`users.company_id` set, no university membership)

  The reference implementation of this predicate is `visibleToFounder()` in
  `prototype/src/data/store.ts` — port it to SQL, not just to the client.

- **`route`** (`undecided | founder | hackathon | founder_match`). Pure workflow
  state; no security implications.

**`published_summary` vs the confidential body is a security boundary, not a
display preference.** In the prototype, `confidentialDetail` is never passed to
any founder-facing component. In the real app the safest port is a separate
view or column-level RLS so a published row physically cannot return the
confidential text to a founder-scoped query.

## RBAC

- New product key `university_ip` in `products`, entitled per-org via
  `org_product_entitlements` (`org_id, product_key, expires_at`).
- New roles alongside the seeded set in
  `supabase/migrations/20260605000003_rbac_seed_catalog.sql`: `ip_manager`
  (edit on the university's IP), and optionally `vpr` (read-only governance —
  the Jul 2 intake left open whether this is distinct from `ip_manager`).
- Route gating uses the existing pattern:
  `<AuthGuard><RequirePermission product="university_ip" module="ip" action="view">`
  — see `src/lib/permissions/` and the route table in `src/App.tsx`.
- Privileged mutations (publish, match approval, cohort handoff) should be
  `SECURITY DEFINER` RPCs, following `set_idea_outreach_status` and the
  `mm_upsert_cohort` family rather than direct table writes.

## Navigation

Tom asked for left-hand navigation. The app's only existing sidebar is
`src/components/super-admin/layout/SuperAdminSidebar.tsx` (`w-64 bg-white
border-r`, active item `bg-red-50 text-red-700`) — the prototype's
`prototype/src/components/shell/Sidebar.tsx` follows it closely, so it ports
directly. Note the rest of the app is header-only navigation with per-role nav
cards driven by `src/config/roleHomeConfig.ts`; adding University IP tiles there
is a one-object edit if a card entry point is wanted alongside the sidebar.

## UI patterns reused

| Prototype component | Copied from |
|---|---|
| `shared/StatsRow.tsx` | `src/components/super-admin/dashboard/StatsRow.tsx` |
| `shared/chips.tsx` | `src/components/super-admin/shared/StatusBadge.tsx` (shape), `src/config/statusPills.ts` |
| `shared/PageHeader.tsx` | `src/pages/InvestorPortal.tsx` header |
| `founder/IpCard.tsx` | `src/components/investor/CompanyCard.tsx` |
| Hero cards | `ProfileHeroCard` in `src/pages/FounderDashboard.tsx` |
| List dual-render (table / mobile cards) | `src/pages/super-admin/GlobalFounders.tsx` |
| `shared/motion.tsx` | framer-motion fadeInUp + 0.08s stagger, used across all home surfaces |

**Two patterns are new** and have no precedent in the app (a grep for
`currentStep`/`setStep`/`activeStep` returns nothing):

- The **import wizard** (`pages/manager/ImportIp.tsx`) — upload → column
  mapping → validation preview → import.
- The **scope stepper** (`components/manager/ScopeStepper.tsx`) with its
  **dual-control dialog**.

Both are proposed as the app's first multi-step patterns.

Also new: the **inline summary review** (`components/manager/SummaryCard.tsx`)
with its provenance badge, and the **live-edit confirm**
(`components/manager/LiveEditDialog.tsx`) — a single-confirm dialog shown when
editing the summary of an already-published item, deliberately lighter than
dual control so the two don't blur into one reflexive click-through.

## Things the prototype fakes

- **No backend.** State is zustand + `localStorage`
  (`prototype/src/data/store.ts`). Every mutation that would be an RPC is a
  store action, and each one already writes an `AuditEvent` — mirror that in
  the real RPCs.
- **No auth.** The persona switcher replaces login. The real app is Supabase
  magic-link (`src/hooks/useAuth.tsx`, `src/pages/MagicLinkHandler.tsx`).
- **CSV is parsed in-browser** (`prototype/src/lib/csv.ts`). Real imports should
  parse server-side.
- **Emails are implied, not sent.** Invites just flip a status. Real sends go
  through `email_templates` + Resend, as in `invite-founder/index.ts`.
- **AI drafting is a deterministic string transform**, not a model call
  (`prototype/src/lib/aiSummary.ts`). It deliberately seeds realistic failure
  modes — a leaked confidential phrase, an overclaim, an unannounced partner —
  so the review step has something real to catch. Seeded examples live on
  `ip-004`, `ip-008`, `ip-010` and `ip-011`. Note the drafts run against the
  CONFIDENTIAL body, which is exactly why the review gate exists.

## Deliberately out of scope

Per Tom: I-Corps management (intake dashboards, tech scout, hub/federal
reporting, metrics, NovoEd posture, evaluator import), the business plan
competition module, program admin, the comprehensive founder dashboard, the AI
customer-interview coach, industry-partner access (the meeting itself deferred
it to "version three"), CMS, and hackathon event management.

The prototype includes exactly one I-Corps surface — the handoff that submits a
formed team to a cohort — because that was the missing link the meeting
identified between IP and I-Corps.

## Still unresolved (from the Jul 2 intake — carried forward)

These were parked at Gate 1 and the prototype makes a provisional choice on
each. They need a real answer before build:

- Is **VPR** a distinct in-app role from IP Manager? (Prototype: not modelled.)
- Does match approval **auto-approve or require a person**, per school?
  (Prototype: `University.autoApproveMatches` exists as a setting but the
  approval flow is always manual.)
- Validation with the **actual role-holders** (Kirby, Peter) — everything about
  routing and IP-manager responsibilities is still secondhand.
