/**
 * University IP prototype — domain model.
 *
 * Every type notes its anchor in the real Wildfire app so the screens here can
 * be ported rather than reinterpreted.
 */

/** Real app: `organizations` with org_kind='university'; parent_org_id gives
 *  the campus -> statewide -> national ancestry that publish scope keys off. */
export interface University {
  id: string;
  name: string;
  shortName: string;
  /** null = this IS the statewide parent org */
  parentOrgId: string | null;
  kind: 'university' | 'state_system';
  /** Per-school setting: does a hand-raise match need manual approval? */
  autoApproveMatches: boolean;
  /** Some schools do not let inventors choose. USD was explicit about this:
   *  "we don't even want to give some people an option — you're just going to
   *  be the contact only." Under `contact_only` the involvement control is
   *  disabled everywhere, including on the inventor's own invite screen. */
  inventorRolePolicy: InventorRolePolicy;
  /** What an AI-drafted summary must never contain. Per-school because what
   *  counts as disclosive differs by discipline and by how burnt a tech
   *  transfer office has been. */
  redactionPolicy: RedactionCriterion[];
  createdAt: string;
}

export type InventorRolePolicy = 'inventor_chooses' | 'contact_only';

/** One named thing an AI summary must not reveal.
 *
 *  The stakeholder ask was "make the prompt very strict… which pieces of
 *  information should not be shared is going to be very critical." A prompt is
 *  invisible, so the criteria are modelled as data instead: the drafter states
 *  which it wrote to, and the IP manager ticks each one off at review. That
 *  turns an implementation detail into something a tech transfer office can
 *  actually inspect and amend. */
export interface RedactionCriterion {
  id: string;
  /** Short imperative shown as a checkbox label. */
  label: string;
  /** Why it matters, shown underneath. */
  help: string;
}

/** Who owns the IP. Drives what may be published and who consents.
 *  Established in the Jul 28 meeting: BOR owns faculty-created IP; a student
 *  owns pure class-project IP; joint work is entangled. */
export type Ownership = 'bor' | 'student' | 'entangled';

/** Whether a disclosure has anyone staying involved, or is an idea-only
 *  handoff. This is now DERIVED from the inventor list rather than stored —
 *  see `itemInvolvement()` in store.ts. Kept as a type because the chips and
 *  filters still speak in these terms. */
export type FacultyAttachment = 'attached' | 'idea-only';

/** What one inventor wants to do with their own disclosure. */
export type InventorRole =
  /** Nobody has asked them yet. */
  | 'undecided'
  /** Point of contact for questions; not joining a venture. */
  | 'contact_only'
  /** Wants to be part of whatever gets built. Joins the team on a match. */
  | 'involved';

/** AXIS 1 — who can see the non-confidential summary.
 *
 *  `public` is the marketing tier: no account, no login, indexable. Everything
 *  below it requires an account, which is what keeps the stakeholder rule
 *  "you always have to create an account before you can see the ideas" true of
 *  the in-app catalogue while still allowing a public lead-gen surface.
 *
 *  Real app: a `visibility_scope` column on `ideas` plus a SELECT policy
 *  walking `organizations.parent_org_id`. Private is already the RLS default. */
export type PublishScope = 'private' | 'campus' | 'statewide' | 'national' | 'public';

/** AXIS 2 — what happens to this IP next (from the Jul 2 intake). */
export type Route = 'undecided' | 'founder' | 'hackathon' | 'founder_match';

/** Who drafted the non-confidential summary.
 *  Real app: a `summary_source` column on `ideas`, alongside the existing
 *  `ai_feedback` / `ai_rating`. */
export type SummarySource = 'ai' | 'human';

/** One named inventor on a disclosure. Disclosures routinely have several.
 *
 *  This is the RECORD of who invented the thing, which is a different question
 *  from who holds an account in the app — that link is `IpItem.professorId`,
 *  pointing at the primary inventor's `User`. Conflating the two is the easy
 *  mistake: a disclosure can list four inventors, three of whom will never log
 *  in, and one of whom left the university a decade ago.
 *
 *  Real app: an `idea_inventors` child table keyed to `ideas`. */
export interface Inventor {
  id: string;
  name: string;
  email: string;
  /** The contact for this disclosure. Exactly one inventor should be primary. */
  primary: boolean;
  /** No longer at the university — the back-catalog "IP mining" case. */
  departed: boolean;
  /** What this particular inventor wants. Per-inventor, not per-disclosure:
   *  on a four-inventor filing one may want to found and three may not. */
  role: InventorRole;
  /** Their platform account, once they have one. Null for the many inventors
   *  who will never log in. */
  userId: string | null;
}

/** Real app: `ideas` (+ new columns). `confidentialDetail` maps to the private
 *  disclosure body and must NEVER render in a founder-facing view. */
export interface IpItem {
  id: string;
  universityId: string;
  title: string;
  /** The non-confidential summary. This is the ONLY body text published. */
  publicSummary: string;
  /** Who wrote `publicSummary` — a machine draft or a person. */
  summarySource: SummarySource;
  /** Has a human actually read the summary and stood behind it?
   *  An unreviewed AI draft CANNOT be published — see `canPublish` in store.ts.
   *  A machine summary of confidential IP going campus-wide unread is the
   *  precise failure the dual-control gate exists to prevent. */
  summaryReviewed: boolean;
  summaryReviewedBy: string | null;
  summaryReviewedAt: string | null;
  /** Which of the university's redaction criteria the reviewer attested to,
   *  by id. Recording the specific attestations is the point — "I confirmed
   *  there are no partner names in this" is defensible in a way that a single
   *  blanket "no confidential detail" tick is not. */
  summaryCriteriaChecked: string[];
  /** How many times the model has drafted this. Redrafts must differ from each
   *  other, so the generator needs to know which attempt it is on. */
  summaryDraftCount: number;
  /** Private disclosure detail — IP manager eyes only. */
  confidentialDetail: string;
  /** Everyone credited on the disclosure. See `Inventor`. */
  inventors: Inventor[];
  /** USD-derived disclosure form fields. */
  disclosure: {
    disclosureNumber: string;
    field: string;
    disclosedOn: string;
    patentStatus: 'not_filed' | 'provisional' | 'filed' | 'granted';
    fundingSource: string;
  };
  ownership: Ownership;
  /** Account link for the primary inventor. Null until someone is invited.
   *  Kept alongside `inventors[].userId` because the invite flow needs one
   *  designated addressee; the roster records everyone. */
  professorId: string | null;
  publishScope: PublishScope;
  route: Route;
  /** True for back-catalog items surfaced by the "IP mining" story. */
  shelved: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Net-new in the real app too: a founder/student expressing interest in
 *  published IP. This is how Founder Match works on a published item. */
export interface HandRaise {
  id: string;
  ipItemId: string;
  userId: string;
  /** Why they want it — shown to the IP manager in the review queue. */
  pitch: string;
  background: string;
  status: 'pending' | 'approved' | 'declined';
  raisedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
}

/** Real app: `companies` + `users.company_id`. Created when a match is approved. */
export interface Team {
  id: string;
  ipItemId: string;
  name: string;
  memberIds: string[];
  formedAt: string;
}

/** Real app: `mm_cohort` / `mm_group_company`. Status display only —
 *  I-Corps management itself is a separate build. */
export interface CohortApplication {
  id: string;
  teamId: string;
  cohortId: string;
  status: 'submitted' | 'accepted' | 'waitlisted';
  submittedAt: string;
  submittedBy: string;
}

/** Listing stub for the founder discovery rail. Management is out of scope. */
export interface Cohort {
  id: string;
  name: string;
  host: string;
  startsOn: string;
  applicationsCloseOn: string;
  seats: number;
}

/** Listing stub for the founder discovery rail. Management is out of scope. */
export interface Hackathon {
  id: string;
  name: string;
  host: string;
  startsOn: string;
  location: string;
  /** IP items offered as pickable challenges at this hackathon. */
  featuredIpIds: string[];
}

export interface HackathonRegistration {
  id: string;
  hackathonId: string;
  userId: string;
  registeredAt: string;
}

/** Approved recommendation R2/REC-7: who did what, when. */
export type AuditAction =
  | 'import'
  | 'create'
  | 'edit'
  | 'summary_reviewed'
  | 'route'
  | 'publish'
  | 'unpublish'
  | 'invite'
  | 'hand_raise'
  | 'match_approved'
  | 'match_declined'
  | 'team_formed'
  | 'cohort_handoff'
  | 'org_provisioned'
  | 'signup'
  | 'lead_reviewed'
  | 'policy_changed';

export interface AuditEvent {
  id: string;
  universityId: string;
  actorId: string;
  action: AuditAction;
  /** Human-readable one-liner, already resolved for display. */
  detail: string;
  ipItemId: string | null;
  at: string;
}

/** Approved recommendation REC-1: imported professors have no account yet. */
export interface Invite {
  id: string;
  email: string;
  name: string;
  universityId: string;
  ipItemId: string | null;
  role: 'professor' | 'ip_manager';
  status: 'sent' | 'accepted';
  sentAt: string;
  acceptedAt: string | null;
}

export type PersonaKind =
  | 'super_admin'
  | 'ip_manager'
  | 'founder'
  | 'professor'
  /** University leadership — read-only oversight. Answers the Jul 2 intake's
   *  parked question about whether the VP of Research is a distinct in-app
   *  role: yes, and the distinction is that they cannot change anything. */
  | 'leadership';

/** Why an account was held back from the funnel. */
export type RiskFlag =
  | 'disposable_email'
  | 'thin_intent'
  | 'velocity'
  | 'honeypot'
  | 'unverified_email';

/** Whether this account can act yet. `pending_review` accounts can sign in and
 *  look around but cannot raise a hand until a human clears them — the point
 *  being to keep the funnel wide while keeping IP managers unburdened. */
export type AccountStatus = 'active' | 'pending_review' | 'blocked';

/** Real app: `users` + `memberships`/`membership_roles`. */
export interface User {
  id: string;
  name: string;
  email: string;
  persona: PersonaKind;
  /** Scopes an IP manager / professor / student to their school. */
  universityId: string | null;
  title: string;
  /** Short bio used to pre-fill the raise-hand mini-profile. */
  background: string;
  status: AccountStatus;
  /** How this account came to exist. `marketing` means they arrived from the
   *  public catalogue, which is worth knowing when judging intent. */
  signupSource: 'seed' | 'invite' | 'direct' | 'marketing';
  /** The IP they signed up to build, if they came in through one. This is what
   *  routes them to the right IP manager after account creation. */
  signupIpContext: string | null;
  riskFlags: RiskFlag[];
  createdAt: string;
}
