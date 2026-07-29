/**
 * University IP prototype — domain model.
 *
 * Every type notes its anchor in the real Wildfire app (WF-App-7-10) so the
 * screens here can be ported rather than reinterpreted. See docs/port-map.md.
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
  createdAt: string;
}

/** Who owns the IP. Drives what may be published and who consents.
 *  Established in the Jul 28 meeting: BOR owns faculty-created IP; a student
 *  owns pure class-project IP; joint work is entangled. */
export type Ownership = 'bor' | 'student' | 'entangled';

/** Does the inventor stay involved, or is this an idea-only handoff? */
export type FacultyAttachment = 'attached' | 'idea-only';

/** AXIS 1 — who can see the non-confidential summary.
 *  Real app: a new `visibility_scope` column on `ideas` plus a SELECT policy
 *  walking `organizations.parent_org_id`. Private is already the RLS default. */
export type PublishScope = 'private' | 'campus' | 'statewide' | 'national';

/** AXIS 2 — what happens to this IP next (from the Jul 2 intake). */
export type Route = 'undecided' | 'founder' | 'hackathon' | 'founder_match';

/** Real app: `ideas` (+ new columns). `confidentialDetail` maps to the private
 *  disclosure body and must NEVER render in a founder-facing view. */
export interface IpItem {
  id: string;
  universityId: string;
  title: string;
  /** The non-confidential summary. This is the ONLY body text published. */
  publicSummary: string;
  /** Private disclosure detail — IP manager eyes only. */
  confidentialDetail: string;
  /** USD-derived disclosure form fields. */
  disclosure: {
    disclosureNumber: string;
    field: string;
    inventors: string;
    disclosedOn: string;
    patentStatus: 'not_filed' | 'provisional' | 'filed' | 'granted';
    fundingSource: string;
  };
  ownership: Ownership;
  facultyAttachment: FacultyAttachment;
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
  | 'route'
  | 'publish'
  | 'unpublish'
  | 'invite'
  | 'hand_raise'
  | 'match_approved'
  | 'match_declined'
  | 'team_formed'
  | 'cohort_handoff'
  | 'org_provisioned';

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

export type PersonaKind = 'super_admin' | 'ip_manager' | 'founder' | 'professor';

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
}
