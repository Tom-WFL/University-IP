import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AuditAction,
  AuditEvent,
  Cohort,
  CohortApplication,
  Hackathon,
  HackathonRegistration,
  HandRaise,
  Inventor,
  Invite,
  IpItem,
  PublishScope,
  Route,
  Team,
  University,
  User,
} from './types';
import { draftSummary, redraftSummary } from '@/lib/aiSummary';
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

export const SCOPE_ORDER: PublishScope[] = ['private', 'campus', 'statewide', 'national'];

export function scopeRank(scope: PublishScope): number {
  return SCOPE_ORDER.indexOf(scope);
}

/**
 * May this item be published (moved to any scope wider than private)?
 *
 * One function so the scope stepper, the publish button's state, the console
 * filter and the dashboard count can never disagree about what "ready" means.
 *
 * In the real app this must ALSO be a server-side precondition — an RLS check
 * or a guard inside the publish RPC. A UI-only rule is not a guardrail.
 */
export function canPublish(item: IpItem): { ok: boolean; reason?: string } {
  if (!item.publicSummary.trim()) {
    return { ok: false, reason: 'There is no summary yet. Write one before publishing.' };
  }
  if (item.summarySource === 'ai' && !item.summaryReviewed) {
    return {
      ok: false,
      reason: 'This summary is still an unread AI draft. Review it before anyone else sees it.',
    };
  }
  return { ok: true };
}

/** Items whose AI draft nobody has checked yet — the IP Manager's queue. */
export function needsSummaryReview(item: IpItem): boolean {
  return item.summarySource === 'ai' && !item.summaryReviewed;
}

/** Split a free-text inventor string (what a CSV column gives you) into rows.
 *  Detects the "(departed)" convention used in disclosure spreadsheets. */
export function parseInventors(raw: string, idFor: (n: number) => string): Inventor[] {
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
  facultyAttachment: IpItem['facultyAttachment'];
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

  setCurrentUser: (userId: string) => void;
  setActiveUniversity: (universityId: string) => void;

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

  /** Point this disclosure at a professor account, minting one if needed. */
  linkProfessor: (
    ipItemId: string,
    target: { userId: string } | { name: string; email: string },
  ) => void;

  sendProfessorInvite: (ipItemId: string) => void;
  acceptInvite: (inviteId: string, attachment: IpItem['facultyAttachment']) => void;

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
  };
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
  note('faculty involvement', before.facultyAttachment, after.facultyAttachment);
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

        addIpItems: (drafts, source) => {
          const state = get();
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
              confidentialDetail: draft.confidentialDetail,
              inventors: parseInventors(draft.inventors, (n) => `${id}-inv-${n}`),
              disclosure: {
                disclosureNumber: draft.disclosureNumber,
                field: draft.field,
                disclosedOn: now(),
                patentStatus: draft.patentStatus,
                fundingSource: draft.fundingSource,
              },
              ownership: draft.ownership,
              facultyAttachment: draft.facultyAttachment,
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

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, publishScope: scope, updatedAt: now() } : i,
            ),
          });

          const label: Record<PublishScope, string> = {
            private: 'private (unpublished)',
            campus: 'campus',
            statewide: 'statewide',
            national: 'the national founder network',
          };
          log(
            widening ? 'publish' : 'unpublish',
            widening
              ? `Published "${item.title}" to ${label[scope]} — non-confidential summary only.`
              : `Pulled "${item.title}" back to ${label[scope]}.`,
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

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    publicSummary: text,
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

          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId
                ? {
                    ...i,
                    publicSummary: redraftSummary(i),
                    summarySource: 'ai',
                    // A fresh draft is unread again, whatever came before it.
                    summaryReviewed: false,
                    summaryReviewedBy: null,
                    summaryReviewedAt: null,
                    updatedAt: now(),
                  }
                : i,
            ),
          });
          log('edit', `Redrafted the summary for "${item.title}" — needs review again.`, ipItemId);
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
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, professorId, updatedAt: now() } : i,
            ),
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

        acceptInvite: (inviteId, attachment) => {
          const state = get();
          const invite = state.invites.find((i) => i.id === inviteId);
          if (!invite) return;
          set({
            invites: state.invites.map((i) =>
              i.id === inviteId ? { ...i, status: 'accepted', acceptedAt: now() } : i,
            ),
            ipItems: invite.ipItemId
              ? state.ipItems.map((i) =>
                  i.id === invite.ipItemId
                    ? { ...i, facultyAttachment: attachment, updatedAt: now() }
                    : i,
                )
              : state.ipItems,
          });
          log(
            'invite',
            `${invite.name} accepted their invite as ${
              attachment === 'attached' ? 'a hands-on co-founder' : 'a contact only'
            }.`,
            invite.ipItemId,
          );
        },

        raiseHand: (ipItemId, pitch, background) => {
          const state = get();
          const item = state.ipItems.find((i) => i.id === ipItemId);
          const user = state.users.find((u) => u.id === state.currentUserId);
          if (!item || !user) return;

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

          // Approved: form the team. The professor joins only if attached.
          const memberIds = [applicant.id];
          if (item.facultyAttachment === 'attached' && item.professorId) {
            memberIds.push(item.professorId);
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
      version: 2,
      migrate: (persisted, version) => {
        if (version < 2) return seedState();
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
  if (item.publishScope === 'national') return true;

  const owner = universities.find((u) => u.id === item.universityId);
  if (!owner) return false;

  if (item.publishScope === 'campus') {
    return viewerUniversityId === item.universityId;
  }
  // statewide: same parent system
  const viewer = universities.find((u) => u.id === viewerUniversityId);
  return Boolean(viewer && owner.parentOrgId && viewer.parentOrgId === owner.parentOrgId);
}
