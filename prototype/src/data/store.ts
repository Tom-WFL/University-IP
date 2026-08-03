import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuditAction,
  AuditEvent,
  Cohort,
  CohortApplication,
  Hackathon,
  HackathonRegistration,
  FacultyAttachment,
  HandRaise,
  Inventor,
  InventorRole,
  InventorRolePolicy,
  Invite,
  IpItem,
  PublishScope,
  RedactionCriterion,
  SummarySource,
  Route,
  Team,
  University,
  User,
} from './types';
import { draftSummary, redraftSummary } from '@/lib/aiSummary';
import { SCOPES, SCOPE_ORDER, listScopeLabels, scopeRank, scopesSkipped } from './scopes';
import { DEFAULT_REDACTION_POLICY } from './redaction';
import { assessLead, shouldHold } from '@/lib/leadRisk';
import {
  seedAudit,
  seedCohortApplications,
  seedCohorts,
  seedHackathons,
  seedHandRaises,
  seedInvites,
  seedIpItems,
  seedRegistrations,
  seedTeams,
  seedUniversities,
  seedUsers,
} from './seed';

/**
 * Mock backend. Every mutation that a real IP manager would perform also
 * writes an AuditEvent — the approved recommendation R2/REC-7 — so the audit
 * trail in the UI is a real consequence of the actions, not a static list.
 */

// The ladder and every word said about it now live in `./scopes`. Re-exported
// here because the whole app already imports them from the store.
export { SCOPE_ORDER, scopeRank } from './scopes';

/**
 * May this item be published (moved to any scope wider than private)?
 *
 * One function so the scope stepper, the publish button's state, the console
 * filter and the dashboard count can never disagree about what "ready" means.
 *
 * In the real app this must ALSO be a server-side precondition — an RLS check
 * or a guard inside the publish RPC. A UI-only rule is not a guardrail.
 */
export function canPublish(
  item: IpItem,
  policy: RedactionCriterion[] = [],
): { ok: boolean; reason?: string } {
  if (!item.publicSummary.trim()) {
    return { ok: false, reason: 'There is no summary yet. Write one before publishing.' };
  }
  if (item.summarySource === 'ai' && !item.summaryReviewed) {
    return {
      ok: false,
      reason: 'This summary is still an unread AI draft. Review it before anyone else sees it.',
    };
  }
  const missing = policy.filter((c) => !item.summaryCriteriaChecked.includes(c.id));
  if (missing.length) {
    return {
      ok: false,
      reason:
        missing.length === policy.length
          ? 'Nobody has checked this summary against the release criteria yet.'
          : `${missing.length} release criteri${missing.length === 1 ? 'on' : 'a'} still unchecked.`,
    };
  }
  return { ok: true };
}

/** Which of a university's criteria this item has NOT been checked against. */
export function unmetCriteria(item: IpItem, policy: RedactionCriterion[]): RedactionCriterion[] {
  return policy.filter((c) => !item.summaryCriteriaChecked.includes(c.id));
}

/** Items whose AI draft nobody has checked yet — the IP Manager's queue. */
export function needsSummaryReview(item: IpItem): boolean {
  return item.summarySource === 'ai' && !item.summaryReviewed;
}

/**
 * Does anyone on this disclosure want to be part of what gets built?
 *
 * Derived rather than stored. Involvement used to be one flag on the whole
 * item, which cannot describe a four-inventor filing where one wants to found
 * and three want to be left alone. The chips and filters still speak in
 * attached/idea-only terms, so this collapses the roster back down for display.
 */
export function itemInvolvement(item: IpItem): FacultyAttachment {
  return item.inventors.some((i) => i.role === 'involved') ? 'attached' : 'idea-only';
}

/** Inventors who want in AND can actually be added to a team. */
export function involvedInventors(item: IpItem): Inventor[] {
  return item.inventors.filter((i) => i.role === 'involved' && i.userId);
}

/** Is this on the public marketing catalogue? */
export function visibleOnMarketing(item: IpItem): boolean {
  return item.publishScope === 'public';
}

/** Can this account act — raise a hand, join a team — or is it held? */
export function canAct(user: User): { ok: boolean; reason?: string } {
  if (user.status === 'blocked') {
    return { ok: false, reason: 'This account has been blocked.' };
  }
  if (user.status === 'pending_review') {
    return {
      ok: false,
      reason: 'Your account is being reviewed. You can look around, but you cannot raise a hand yet.',
    };
  }
  return { ok: true };
}

/** Split a free-text inventor string (what a CSV column gives you) into rows.
 *  Detects the "(departed)" convention used in disclosure spreadsheets. */
export function parseInventors(
  raw: string,
  idFor: (n: number) => string,
  policy: InventorRolePolicy = 'inventor_chooses',
): Inventor[] {
  const names = raw
    .split(/[,;]/)
    .map((n) => n.trim())
    .filter(Boolean);

  return names.map((entry, index) => {
    const departed = /\(\s*departed\s*\)/i.test(entry);
    return {
      id: idFor(index),
      name: entry.replace(/\(\s*departed\s*\)/i, '').trim(),
      email: '',
      // First one listed is the contact until someone says otherwise.
      primary: index === 0,
      departed,
      // A spreadsheet cannot tell us what an inventor wants, so nobody starts
      // as involved — except where the school has already decided for them.
      role: policy === 'contact_only' ? 'contact_only' : 'undecided',
      userId: null,
    };
  });
}

/** Render an inventor list back to one line, for tables and meta strips. */
export function inventorLine(inventors: Inventor[]): string {
  if (!inventors.length) return '—';
  return inventors.map((i) => (i.departed ? `${i.name} (departed)` : i.name)).join(', ');
}

/** Draft used by both the CSV importer and the single-item add form. */
export interface IpDraft {
  title: string;
  publicSummary: string;
  confidentialDetail: string;
  disclosureNumber: string;
  field: string;
  inventors: string;
  patentStatus: IpItem['disclosure']['patentStatus'];
  fundingSource: string;
  ownership: IpItem['ownership'];
  /** A spreadsheet hint about involvement. Seeds inventor roles on import. */
  facultyAttachment: FacultyAttachment;
  professorName: string;
  professorEmail: string;
  sendInvite: boolean;
}

/** A patch where the nested disclosure block may be partial. */
export type IpItemPatch = Partial<Omit<IpItem, 'disclosure'>> & {
  disclosure?: Partial<IpItem['disclosure']>;
};

interface StoreState {
  universities: University[];
  users: User[];
  ipItems: IpItem[];
  handRaises: HandRaise[];
  teams: Team[];
  cohortApplications: CohortApplication[];
  cohorts: Cohort[];
  hackathons: Hackathon[];
  registrations: HackathonRegistration[];
  invites: Invite[];
  audit: AuditEvent[];

  /** Demo session: who am I acting as, and which school am I looking at. */
  currentUserId: string;
  activeUniversityId: string;
  /** False = a visitor with no account. Kept separate from currentUserId so
   *  signing out does not lose which persona to return to. */
  signedIn: boolean;
  /** How many risk flags hold a signup for review. A setting rather than a
   *  constant because "wide enough for genuine prospects" is a judgement. */
  leadReviewThreshold: number;

  setCurrentUser: (userId: string) => void;
  setActiveUniversity: (universityId: string) => void;
  /** Leave the app and look at it as a stranger would. */
  signOut: () => void;
  signIn: () => void;
  setLeadReviewThreshold: (n: number) => void;

  /** Create an account from the signup form. Returns the new user id, and
   *  whether they were let straight in or held for review. */
  signUp: (input: {
    name: string;
    email: string;
    intent: string;
    honeypot: string;
    emailVerified: boolean;
    ipContext: string | null;
  }) => { userId: string; held: boolean };

  /** Clear or block a held account. */
  reviewLead: (userId: string, decision: 'approved' | 'blocked') => void;

  addIpItems: (drafts: IpDraft[], source: 'import' | 'manual') => string[];
  updateScope: (ipItemId: string, scope: PublishScope) => void;
  updateRoute: (ipItemId: string, route: Route) => void;
  /** Patch an item. `disclosure` may be partial — it is deep-merged. */
  updateIpItem: (ipItemId: string, patch: IpItemPatch) => void;

  /** Rewrite the summary. Counts as a human review. */
  updateSummary: (ipItemId: string, text: string) => void;
  /** Sign off an AI draft unchanged. Distinct from an edit so the audit trail
   *  can tell "she read it and agreed" from "she rewrote it". */
  approveSummary: (ipItemId: string) => void;
  /** Ask the (simulated) model for another draft. Resets the review flag. */
  regenerateSummary: (ipItemId: string) => void;
  /** Record which release criteria the reviewer has ticked. */
  setSummaryCriteria: (ipItemId: string, criterionIds: string[]) => void;

  /** Edit this university's release criteria. */
  updateRedactionPolicy: (universityId: string, policy: RedactionCriterion[]) => void;
  /** Change whether inventors at this school may choose to be involved. */
  setInventorRolePolicy: (universityId: string, policy: InventorRolePolicy) => void;
  /** Set one inventor's role, refused where the school has removed the choice. */
  setInventorRole: (ipItemId: string, inventorId: string, role: InventorRole) => void;

  /** Point this disclosure at a professor account, minting one if needed. */
  linkProfessor: (
    ipItemId: string,
    target: { userId: string } | { name: string; email: string },
  ) => void;

  sendProfessorInvite: (ipItemId: string) => void;
  /** The inventor's own answer to "do you want to be part of this?" */
  acceptInvite: (inviteId: string, role: InventorRole) => void;

  raiseHand: (ipItemId: string, pitch: string, background: string) => void;
  reviewHandRaise: (handRaiseId: string, decision: 'approved' | 'declined') => string | null;
  sendTeamToCohort: (teamId: string, cohortId: string) => void;
  registerForHackathon: (hackathonId: string) => void;

  provisionUniversity: (name: string, shortName: string, managerName: string, managerEmail: string) => void;

  resetDemo: () => void;
}

let counter = 0;
/** Deterministic-ish id generator; avoids Math.random for stable snapshots. */
function nextId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

function now(): string {
  return new Date().toISOString();
}

/** Mint a professor User record for an inventor who has no account yet.
 *  Shared by import (which creates them in bulk) and the edit form. */
function mintProfessor(
  name: string,
  email: string,
  universityId: string,
  ipTitle: string,
): User {
  return {
    id: nextId('u-prof'),
    name: name.trim() || email,
    email: email.trim(),
    persona: 'professor',
    universityId,
    title: 'Professor (invited)',
    background: `Inventor on ${ipTitle}.`,
    status: 'active',
    signupSource: 'invite',
    signupIpContext: null,
    riskFlags: [],
    createdAt: now(),
  };
}

/**
 * Did this edit replace most of the text, or just tidy it?
 *
 * Used to decide whether a summary is still the model's words or has become
 * the manager's. Deliberately crude — a word-overlap ratio, not a diff — but
 * it only has to separate "fixed a phrase" from "wrote it again".
 */
function mostlyRewritten(before: string, after: string): boolean {
  const words = (s: string) => new Set(s.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const a = words(before);
  const b = words(after);
  if (a.size === 0) return true;
  let kept = 0;
  a.forEach((w) => {
    if (b.has(w)) kept += 1;
  });
  return kept / a.size < 0.5;
}

/** Human-readable list of which fields an edit actually touched, so the audit
 *  trail says something more useful than "updated". */
function describeChanges(before: IpItem, after: IpItem): string[] {
  const changed: string[] = [];
  const note = (label: string, a: unknown, b: unknown) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) changed.push(label);
  };

  note('title', before.title, after.title);
  note('summary', before.publicSummary, after.publicSummary);
  note('confidential detail', before.confidentialDetail, after.confidentialDetail);
  note('inventors', before.inventors, after.inventors);
  note('ownership', before.ownership, after.ownership);
  note('inventor roles', before.inventors.map((i) => i.role), after.inventors.map((i) => i.role));
  note('professor', before.professorId, after.professorId);
  note('shelved', before.shelved, after.shelved);
  note('disclosure number', before.disclosure.disclosureNumber, after.disclosure.disclosureNumber);
  note('field', before.disclosure.field, after.disclosure.field);
  note('patent status', before.disclosure.patentStatus, after.disclosure.patentStatus);
  note('funding source', before.disclosure.fundingSource, after.disclosure.fundingSource);
  note('disclosure date', before.disclosure.disclosedOn, after.disclosure.disclosedOn);

  return changed;
}

const seedState = () => ({
  universities: seedUniversities,
  users: seedUsers,
  ipItems: seedIpItems,
  handRaises: seedHandRaises,
  teams: seedTeams,
  cohortApplications: seedCohortApplications,
  cohorts: seedCohorts,
  hackathons: seedHackathons,
  registrations: seedRegistrations,
  invites: seedInvites,
  audit: seedAudit,
  currentUserId: 'u-ipm-mines',
  activeUniversityId: 'org-mines',
  signedIn: true,
  // Two flags holds a signup. One is usually noise; two is a pattern.
  leadReviewThreshold: 2,
});

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      /** Append an audit event for the acting user. */
      function log(action: AuditAction, detail: string, ipItemId: string | null = null) {
        const state = get();
        set({
          audit: [
            {
              id: nextId('ev'),
              universityId: state.activeUniversityId,
              actorId: state.currentUserId,
              action,
              detail,
              ipItemId,
              at: now(),
            },
            ...state.audit,
          ],
        });
      }

      return {
        ...seedState(),

        setCurrentUser: (userId) => {
          const user = get().users.find((u) => u.id === userId);
          set({
            currentUserId: userId,
            activeUniversityId: user?.universityId ?? get().activeUniversityId,
          });
        },

        setActiveUniversity: (universityId) => set({ activeUniversityId: universityId }),

        signOut: () => set({ signedIn: false }),
        signIn: () => set({ signedIn: true }),
        setLeadReviewThreshold: (n) => set({ leadReviewThreshold: Math.max(1, Math.min(5, n)) }),

        signUp: ({ name, email, intent, honeypot, emailVerified, ipContext }) => {
          const state = get();
          const flags = assessLead({ email, intent, honeypot, emailVerified, existing: state.users });
          const held = shouldHold(flags, state.leadReviewThreshold);

          // A lead who arrived through a specific piece of IP belongs to that
          // school — this is what routes them to the right IP manager.
          const contextItem = ipContext ? state.ipItems.find((i) => i.id === ipContext) : undefined;

          const user: User = {
            id: nextId('u'),
            name: name.trim() || email,
            email: email.trim(),
            persona: 'founder',
            // No school affiliation is claimed at signup — they are a network
            // founder until somebody verifies otherwise.
            universityId: null,
            title: 'Founder',
            background: intent.trim(),
            status: held ? 'pending_review' : 'active',
            signupSource: ipContext ? 'marketing' : 'direct',
            signupIpContext: ipContext,
            riskFlags: flags,
            createdAt: now(),
          };

          set({
            users: [...state.users, user],
            currentUserId: user.id,
            signedIn: true,
            audit: [
              {
                id: nextId('ev'),
                universityId: contextItem?.universityId ?? state.activeUniversityId,
                actorId: user.id,
                action: 'signup',
                detail: held
                  ? `${user.name} signed up${contextItem ? ` for "${contextItem.title}"` : ''} — held for review (${flags.join(', ')}).`
                  : `${user.name} signed up${contextItem ? ` for "${contextItem.title}"` : ''}.`,
                ipItemId: ipContext,
                at: now(),
              },
              ...state.audit,
            ],
          });

          return { userId: user.id, held };
        },

        reviewLead: (userId, decision) => {
          const state = get();
          const user = state.users.find((u) => u.id === userId);
          if (!user) return;

          set({
            users: state.users.map((u) =>
              u.id === userId
                ? { ...u, status: decision === 'approved' ? 'active' : 'blocked', riskFlags: decision === 'approved' ? [] : u.riskFlags }
                : u,
            ),
          });
          log(
            'lead_reviewed',
            decision === 'approved'
              ? `Cleared ${user.name} — they can raise a hand now.`
              : `Blocked ${user.name}.`,
            user.signupIpContext,
          );
        },

        addIpItems: (drafts, source) => {
          const state = get();
          const activeUniversity = state.universities.find((u) => u.id === state.activeUniversityId);
          const created: IpItem[] = [];
          const newInvites: Invite[] = [];
          const newUsers: User[] = [];

          drafts.forEach((draft) => {
            let professorId: string | null = null;
            if (draft.professorEmail) {
              const professor = mintProfessor(
                draft.professorName,
                draft.professorEmail,
                state.activeUniversityId,
                draft.title,
              );
              professorId = professor.id;
              newUsers.push(professor);
            }

            const id = nextId('ip');

            // A spreadsheet row rarely carries a publishable summary. When it
            // doesn't, the model drafts one — and it lands UNREVIEWED, because
            // nobody has read it yet. If a human typed the summary into the
            // add-one form, it is theirs and already counts as reviewed.
            const typedByHuman = Boolean(draft.publicSummary.trim());
            const publicSummary = typedByHuman
              ? draft.publicSummary
              : draftSummary({
                  id,
                  title: draft.title,
                  field: draft.field,
                  confidentialDetail: draft.confidentialDetail,
                });

            const item: IpItem = {
              id,
              universityId: state.activeUniversityId,
              title: draft.title,
              publicSummary,
              summarySource: typedByHuman ? 'human' : 'ai',
              summaryReviewed: typedByHuman,
              summaryReviewedBy: typedByHuman ? state.currentUserId : null,
              summaryReviewedAt: typedByHuman ? now() : null,
              summaryCriteriaChecked: [],
              summaryDraftCount: typedByHuman ? 0 : 1,
              confidentialDetail: draft.confidentialDetail,
              inventors: parseInventors(
                draft.inventors,
                (n) => `${id}-inv-${n}`,
                activeUniversity?.inventorRolePolicy,
              ),
              disclosure: {
                disclosureNumber: draft.disclosureNumber,
                field: draft.field,
                disclosedOn: now(),
                patentStatus: draft.patentStatus,
                fundingSource: draft.fundingSource,
              },
              ownership: draft.ownership,
              professorId,
              // Everything lands private. This is the non-negotiable default.
              publishScope: 'private',
              route: 'undecided',
              shelved: false,
              createdAt: now(),
              updatedAt: now(),
            };
            created.push(item);

            if (draft.sendInvite && draft.professorEmail) {
              newInvites.push({
                id: nextId('inv'),
                email: draft.professorEmail,
                name: draft.professorName || draft.professorEmail,
                universityId: state.activeUniversityId,
                ipItemId: item.id,
                role: 'professor',
                status: 'sent',
                sentAt: now(),
                acceptedAt: null,
              });
            }
          });

          set({
            ipItems: [...created, ...state.ipItems],
            invites: [...newInvites, ...state.invites],
            users: [...state.users, ...newUsers],
          });

          const drafted = created.filter(needsSummaryReview).length;
          log(
            source === 'import' ? 'import' : 'create',
            source === 'import'
              ? `Imported ${created.length} disclosure${created.length === 1 ? '' : 's'} — all landed private` +
                (drafted
                  ? `, ${drafted} with an AI draft summary awaiting review.`
                  : '.')
              : `Added "${created[0]?.title}" — landed private.`,
            source === 'manual' ? created[0]?.id ?? null : null,
          );
          if (newInvites.length) {
            log(
              'invite',
              `Sent ${newInvites.length} professor account invite${newInvites.length === 1 ? '' : 's'}.`,
            );
          }

          return created.map((c) => c.id);
        },

        updateScope: (ipItemId, scope) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          const widening = scopeRank(scope) > scopeRank(item.publishScope);

          // The gate is an invariant, not a UI convention. The stepper already
          // refuses, but anything else reaching this action has to be refused
          // too — in the real app this belongs in the publish RPC or RLS.
          const owningUniversity = state.universities.find((u) => u.id === item.universityId);
          if (widening && !canPublish(item, owningUniversity?.redactionPolicy ?? []).ok) return;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, publishScope: scope, updatedAt: now() } : i,
            ),
          });

          // Record where it came FROM as well as where it went. Without the
          // origin the trail cannot answer "was this ever reviewed at campus
          // scope first?", which is exactly the question a jump raises — and a
          // private→national leap would otherwise read identically to a
          // statewide→national step.
          const from = SCOPES[item.publishScope].auditLabel;
          const to = SCOPES[scope].auditLabel;
          const skipped = scopesSkipped(item.publishScope, scope);
          const skipNote = skipped.length
            ? `, straight past ${listScopeLabels(skipped).toLowerCase()}`
            : '';

          log(
            widening ? 'publish' : 'unpublish',
            widening
              ? `Published "${item.title}" from ${from} to ${to}${skipNote} — non-confidential summary only.`
              : `Pulled "${item.title}" back from ${from} to ${to}.`,
            ipItemId,
          );
        },

        updateRoute: (ipItemId, route) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, route, updatedAt: now() } : i,
            ),
          });
          const label: Record<Route, string> = {
            undecided: 'undecided',
            founder: 'the Founder route',
            hackathon: 'the Hackathon route',
            founder_match: 'Founder Match',
          };
          log('route', `Routed "${item.title}" to ${label[route]}.`, ipItemId);
        },

        updateIpItem: (ipItemId, patch) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;

          // Deep-merge the disclosure block. A shallow spread would silently
          // drop every sibling key the caller didn't happen to pass.
          const merged: IpItem = {
            ...item,
            ...patch,
            disclosure: { ...item.disclosure, ...(patch.disclosure ?? {}) },
            updatedAt: now(),
          };

          set({ ipItems: state.ipItems.map((i) => (i.id === ipItemId ? merged : i)) });

          // Name what actually changed, and use the NEW title — logging a
          // rename under the old name makes the trail useless for the one case
          // you most want to trace.
          const changed = describeChanges(item, merged);
          log(
            'edit',
            changed.length
              ? `Edited "${merged.title}" — ${changed.join(', ')}.`
              : `Saved "${merged.title}" with no changes.`,
            ipItemId,
          );
        },

        updateSummary: (ipItemId, text) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          const wasDraft = needsSummaryReview(item);

          // If the manager replaced most of the draft, the words are theirs and
          // the badge should say so. Leaving it as 'ai' after a full rewrite
          // made the provenance badge lie about who wrote the text.
          const source: SummarySource = mostlyRewritten(item.publicSummary, text)
            ? 'human'
            : item.summarySource;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    publicSummary: text,
                    summarySource: source,
                    // The words changed, so what was attested no longer
                    // describes what would be published.
                    summaryCriteriaChecked: [],
                    summaryReviewed: true,
                    summaryReviewedBy: state.currentUserId,
                    summaryReviewedAt: now(),
                    updatedAt: now(),
                  }
                : i,
            ),
          });

          log(
            'summary_reviewed',
            wasDraft
              ? `Corrected the AI draft summary for "${item.title}".`
              : `Rewrote the summary for "${item.title}".`,
            ipItemId,
          );
        },

        approveSummary: (ipItemId) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    summaryReviewed: true,
                    summaryReviewedBy: state.currentUserId,
                    summaryReviewedAt: now(),
                    updatedAt: now(),
                  }
                : i,
            ),
          });
          log('summary_reviewed', `Approved the AI draft summary for "${item.title}" as written.`, ipItemId);
        },

        regenerateSummary: (ipItemId) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;

          const attempt = item.summaryDraftCount + 1;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    publicSummary: redraftSummary(i, attempt),
                    summarySource: 'ai',
                    summaryDraftCount: attempt,
                    // A fresh draft is unread again, whatever came before it,
                    // and prior criteria attestations no longer apply to text
                    // nobody has read.
                    summaryReviewed: false,
                    summaryReviewedBy: null,
                    summaryReviewedAt: null,
                    summaryCriteriaChecked: [],
                    updatedAt: now(),
                  }
                : i,
            ),
          });
          log('edit', `Redrafted the summary for "${item.title}" — needs review again.`, ipItemId);
        },

        setSummaryCriteria: (ipItemId, criterionIds) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          const owner = state.universities.find((u) => u.id === item.universityId);
          const policy = owner?.redactionPolicy ?? [];

          // Only ever store ids the school's policy actually contains, so a
          // stale tick from a removed criterion cannot satisfy the gate.
          const valid = criterionIds.filter((id) => policy.some((c) => c.id === id));
          const complete = policy.length > 0 && valid.length === policy.length;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, summaryCriteriaChecked: valid, updatedAt: now() } : i,
            ),
          });

          if (complete) {
            log(
              'summary_reviewed',
              `Checked "${item.title}" against all ${policy.length} release criteria.`,
              ipItemId,
            );
          }
        },

        updateRedactionPolicy: (universityId, policy) => {
          const state = get();
          const uni = state.universities.find((u) => u.id === universityId);
          if (!uni) return;
          const before = uni.redactionPolicy.length;

          set({
            universities: state.universities.map((u) =>
              u.id === universityId ? { ...u, redactionPolicy: policy } : u,
            ),
          });
          log(
            'policy_changed',
            `Release criteria for ${uni.shortName} changed from ${before} to ${policy.length}.`,
          );
        },

        setInventorRolePolicy: (universityId, policy) => {
          const state = get();
          const uni = state.universities.find((u) => u.id === universityId);
          if (!uni || uni.inventorRolePolicy === policy) return;

          set({
            universities: state.universities.map((u) =>
              u.id === universityId ? { ...u, inventorRolePolicy: policy } : u,
            ),
            // Switching to contact-only is not just a setting — it has to take
            // effect on inventors who already said yes, or the policy is
            // decorative.
            ipItems:
              policy === 'contact_only'
                ? state.ipItems.map((i) =>
                    i.universityId === universityId
                      ? {
                          ...i,
                          inventors: i.inventors.map((inv) =>
                            inv.role === 'involved' ? { ...inv, role: 'contact_only' } : inv,
                          ),
                        }
                      : i,
                  )
                : state.ipItems,
          });

          log(
            'policy_changed',
            policy === 'contact_only'
              ? `${uni.shortName} inventors are now listed as contacts only.`
              : `${uni.shortName} inventors may now choose to be involved.`,
          );
        },

        setInventorRole: (ipItemId, inventorId, role) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          const owner = state.universities.find((u) => u.id === item.universityId);

          // The school may have removed the choice entirely.
          if (owner?.inventorRolePolicy === 'contact_only' && role === 'involved') return;

          const inventor = item.inventors.find((inv) => inv.id === inventorId);
          if (!inventor) return;

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    inventors: i.inventors.map((inv) =>
                      inv.id === inventorId ? { ...inv, role } : inv,
                    ),
                    updatedAt: now(),
                  }
                : i,
            ),
          });

          const label: Record<InventorRole, string> = {
            undecided: 'not decided yet',
            contact_only: 'a contact only',
            involved: 'involved in the venture',
          };
          log('edit', `${inventor.name} on "${item.title}" is now ${label[role]}.`, ipItemId);
        },

        linkProfessor: (ipItemId, target) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;

          let professorId: string;
          let professorName: string;
          let newUser: User | null = null;

          if ('userId' in target) {
            const existing = state.users.find((u) => u.id === target.userId);
            if (!existing) return;
            professorId = existing.id;
            professorName = existing.name;
          } else {
            if (!target.email.trim()) return;
            newUser = mintProfessor(target.name, target.email, item.universityId, item.title);
            professorId = newUser.id;
            professorName = newUser.name;
          }

          set({
            ipItems: state.ipItems.map((i) => {
              if (i.id !== ipItemId) return i;
              // Put the account on the primary inventor's row too — otherwise
              // an involved inventor can never be added to a team.
              const inventors = i.inventors.length
                ? i.inventors.map((inv) => (inv.primary ? { ...inv, userId: professorId } : inv))
                : i.inventors;
              return { ...i, professorId, inventors, updatedAt: now() };
            }),
            users: newUser ? [...state.users, newUser] : state.users,
          });
          log('edit', `Attached ${professorName} to "${item.title}" as the professor contact.`, ipItemId);
        },

        sendProfessorInvite: (ipItemId) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          if (!item) return;
          const professor = state.users.find((u) => u.id === item.professorId);
          if (!professor) return;

          const existing = state.invites.find(
            (inv) => inv.ipItemId === ipItemId && inv.email === professor.email,
          );
          if (existing) {
            set({
              invites: state.invites.map((inv) =>
                inv.id === existing.id ? { ...inv, sentAt: now(), status: 'sent' } : inv,
              ),
            });
          } else {
            set({
              invites: [
                {
                  id: nextId('inv'),
                  email: professor.email,
                  name: professor.name,
                  universityId: item.universityId,
                  ipItemId,
                  role: 'professor',
                  status: 'sent',
                  sentAt: now(),
                  acceptedAt: null,
                },
                ...state.invites,
              ],
            });
          }
          log('invite', `Sent an account invite to ${professor.name} for "${item.title}".`, ipItemId);
        },

        acceptInvite: (inviteId, role) => {
          const state = get();
          const invite = state.invites.find((i) => i.id === inviteId);
          if (!invite) return;

          const item = state.ipItems.find((i) => i.id === invite.ipItemId);
          const owner = state.universities.find((u) => u.id === invite.universityId);

          // Under a contact-only policy the inventor is not offered the choice,
          // so an "involved" answer arriving here is not one we can honour.
          const effective: InventorRole =
            owner?.inventorRolePolicy === 'contact_only' ? 'contact_only' : role;

          // Find the inventor row this invite belongs to — matched on the
          // account, then on email, then falling back to the designated
          // primary, because imported rosters often have no emails at all.
          const matchInventor = (inv: Inventor) =>
            (item?.professorId && inv.userId === item.professorId) ||
            (inv.email && inv.email.toLowerCase() === invite.email.toLowerCase());

          set({
            invites: state.invites.map((i) =>
              i.id === inviteId ? { ...i, status: 'accepted', acceptedAt: now() } : i,
            ),
            ipItems: invite.ipItemId
              ? state.ipItems.map((i) => {
                  if (i.id !== invite.ipItemId) return i;
                  const hasMatch = i.inventors.some(matchInventor);
                  return {
                    ...i,
                    inventors: i.inventors.map((inv) => {
                      const isThem = hasMatch ? matchInventor(inv) : inv.primary;
                      return isThem
                        ? { ...inv, role: effective, userId: inv.userId ?? i.professorId }
                        : inv;
                    }),
                    updatedAt: now(),
                  };
                })
              : state.ipItems,
          });

          log(
            'invite',
            `${invite.name} accepted their invite as ${
              effective === 'involved' ? 'a hands-on co-founder' : 'a contact only'
            }${owner?.inventorRolePolicy === 'contact_only' ? ' (school policy: contact only)' : ''}.`,
            invite.ipItemId,
          );
        },

        raiseHand: (ipItemId, pitch, background) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (!item || !user) return;

          // An account still in lead review can browse but cannot act. This is
          // the point of the anti-spam work: keep the funnel open, keep the IP
          // manager's queue clean.
          if (!canAct(user).ok) return;

          // Some schools trust the funnel and skip the manual match review.
          const owner = state.universities.find((u) => u.id === item.universityId);
          const auto = Boolean(owner?.autoApproveMatches);

          set({
            handRaises: [
              {
                id: nextId('hr'),
                ipItemId,
                userId: user.id,
                pitch,
                background,
                status: 'pending',
                raisedAt: now(),
                reviewedBy: null,
                reviewedAt: null,
              },
              ...state.handRaises,
            ],
            audit: [
              {
                id: nextId('ev'),
                // Attribute the event to the IP's own university, not the
                // founder's — a network founder may have no school.
                universityId: item.universityId,
                actorId: user.id,
                action: 'hand_raise',
                detail: `${user.name} raised a hand on "${item.title}".`,
                ipItemId,
                at: now(),
              },
              ...state.audit,
            ],
          });

          // Honour the school's policy immediately rather than leaving it to
          // sit in a queue nobody at that school intends to work.
          if (auto) {
            const raised = get().handRaises[0];
            if (raised) get().reviewHandRaise(raised.id, 'approved');
          }
        },

        reviewHandRaise: (handRaiseId, decision) => {
          const state = get();
          const hr = state.handRaises.find((h) => h.id === handRaiseId);
          if (!hr) return null;
          const item = state.ipItems.find((i) => i.id === hr.ipItemId);
          const applicant = state.users.find((u) => u.id === hr.userId);
          if (!item || !applicant) return null;

          const reviewed: HandRaise[] = state.handRaises.map((h) =>
            h.id === handRaiseId
              ? { ...h, status: decision, reviewedBy: state.currentUserId, reviewedAt: now() }
              : h,
          );

          if (decision === 'declined') {
            set({ handRaises: reviewed });
            log('match_declined', `Declined ${applicant.name} for "${item.title}".`, item.id);
            return null;
          }

          // Approved: form the team. Every inventor who said they want to be
          // involved AND holds an account joins — not just the one designated
          // professor, since a filing can have several willing inventors.
          const memberIds = [applicant.id];
          for (const inv of involvedInventors(item)) {
            if (inv.userId && !memberIds.includes(inv.userId)) memberIds.push(inv.userId);
          }
          const team: Team = {
            id: nextId('team'),
            ipItemId: item.id,
            name: item.title,
            memberIds,
            formedAt: now(),
          };

          set({
            handRaises: reviewed,
            teams: [team, ...state.teams],
          });
          log('match_approved', `Approved ${applicant.name} for "${item.title}".`, item.id);
          log(
            'team_formed',
            `Team formed on "${item.title}" — ${memberIds.length} member${
              memberIds.length === 1 ? '' : 's'
            }.`,
            item.id,
          );
          return team.id;
        },

        sendTeamToCohort: (teamId, cohortId) => {
          const state = get();
          const team = state.teams.find((t) => t.id === teamId);
          const cohort = state.cohorts.find((c) => c.id === cohortId);
          if (!team || !cohort) return;
          if (state.cohortApplications.some((a) => a.teamId === teamId && a.cohortId === cohortId)) {
            return;
          }

          set({
            cohortApplications: [
              {
                id: nextId('app'),
                teamId,
                cohortId,
                status: 'submitted',
                submittedAt: now(),
                submittedBy: state.currentUserId,
              },
              ...state.cohortApplications,
            ],
          });
          log('cohort_handoff', `Sent "${team.name}" to ${cohort.name}.`, team.ipItemId);
        },

        registerForHackathon: (hackathonId) => {
          const state = get();
          if (
            state.registrations.some(
              (r) => r.hackathonId === hackathonId && r.userId === state.currentUserId,
            )
          ) {
            return;
          }
          set({
            registrations: [
              {
                id: nextId('reg'),
                hackathonId,
                userId: state.currentUserId,
                registeredAt: now(),
              },
              ...state.registrations,
            ],
          });
        },

        provisionUniversity: (name, shortName, managerName, managerEmail) => {
          const state = get();
          const orgId = nextId('org');
          const managerId = nextId('u-ipm');
          set({
            universities: [
              ...state.universities,
              {
                id: orgId,
                name,
                shortName,
                parentOrgId: 'org-sd',
                kind: 'university',
                autoApproveMatches: false,
                inventorRolePolicy: 'inventor_chooses',
                redactionPolicy: DEFAULT_REDACTION_POLICY,
                createdAt: now(),
              },
            ],
            users: [
              ...state.users,
              {
                id: managerId,
                name: managerName,
                email: managerEmail,
                persona: 'ip_manager',
                universityId: orgId,
                title: `IP Manager — ${shortName}`,
                background: 'Newly provisioned IP Manager.',
                status: 'active',
                signupSource: 'invite',
                signupIpContext: null,
                riskFlags: [],
                createdAt: now(),
              },
            ],
            invites: [
              {
                id: nextId('inv'),
                email: managerEmail,
                name: managerName,
                universityId: orgId,
                ipItemId: null,
                role: 'ip_manager',
                status: 'sent',
                sentAt: now(),
                acceptedAt: null,
              },
              ...state.invites,
            ],
            audit: [
              {
                id: nextId('ev'),
                universityId: orgId,
                actorId: state.currentUserId,
                action: 'org_provisioned',
                detail: `Provisioned ${name} and assigned ${managerName} as IP Manager.`,
                ipItemId: null,
                at: now(),
              },
              ...state.audit,
            ],
          });
        },

        resetDemo: () => set({ ...seedState() }),
      };
    },
    {
      name: 'university-ip-prototype',
      // v2 restructured IpItem: summary provenance fields, and inventors moved
      // from a free-text string inside `disclosure` to a top-level list. Anyone
      // carrying v1 state in localStorage — including from the shared demo
      // link — would otherwise hydrate a half-shaped store and white-screen.
      // A prototype has no data worth preserving, so drop it and reseed.
      // v3 added the public scope, per-inventor roles, university policies and
      // account/lead fields. Same reasoning as v2: a prototype has no data
      // worth preserving, and every shared demo link is carrying older state.
      version: 3,
      migrate: (persisted, version) => {
        if (version < 3) return seedState();
        return persisted as StoreState;
      },
    },
  ),
);

// ---------------------------------------------------------------------------
// Selectors — plain functions so components stay thin.
// ---------------------------------------------------------------------------

export function useCurrentUser(): User {
  const users = useStore((s) => s.users);
  const id = useStore((s) => s.currentUserId);
  return users.find((u) => u.id === id) ?? users[0];
}

export function useActiveUniversity(): University | undefined {
  const universities = useStore((s) => s.universities);
  const id = useStore((s) => s.activeUniversityId);
  return universities.find((u) => u.id === id);
}

/**
 * What a founder is allowed to see.
 *
 * `campus` items are visible only to members of that school; `statewide`
 * items to anyone under the same parent org; `national` to everyone,
 * including Wildfire Network founders with no school. `private` never
 * appears. This mirrors the RLS policy the real app would need over
 * `organizations.parent_org_id`.
 */
export function visibleToFounder(
  item: IpItem,
  viewerUniversityId: string | null,
  universities: University[],
): boolean {
  if (item.publishScope === 'private') return false;
  // Public is national plus the open internet, so a signed-in founder sees it.
  if (item.publishScope === 'national' || item.publishScope === 'public') return true;

  const owner = universities.find((u) => u.id === item.universityId);
  if (!owner) return false;

  if (item.publishScope === 'campus') {
    return viewerUniversityId === item.universityId;
  }

  // Statewide: viewer and owner belong to the same system.
  const viewer = universities.find((u) => u.id === viewerUniversityId);
  if (!viewer) return false;

  // The system org itself has no parent, so compare on system identity rather
  // than on parentOrgId alone — otherwise an item owned by the system org is
  // invisible to everybody, including the schools inside it.
  const systemOf = (u: University) => u.parentOrgId ?? u.id;
  return systemOf(viewer) === systemOf(owner);
}

// ---------------------------------------------------------------------------
// Dev-only test hook.
//
// The end-to-end suite asserts on store invariants that no screen surfaces —
// that `updateScope` refuses an unreviewed draft even when called directly,
// that a redraft actually differs, that a held account cannot raise a hand.
// Vite strips this from production builds, so the partner package and the
// published artifact never carry it.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  const w = window as unknown as Record<string, unknown>;
  w.__store = useStore;
  w.__visibleToFounder = visibleToFounder;
  w.__SCOPE_ORDER = SCOPE_ORDER;
  w.__canPublish = canPublish;
}
