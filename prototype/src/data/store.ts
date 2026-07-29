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
  Invite,
  IpItem,
  PublishScope,
  Route,
  Team,
  University,
  User,
} from './types';
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
  updateIpItem: (ipItemId: string, patch: Partial<IpItem>) => void;
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
            const professorId = draft.professorEmail ? nextId('u-prof') : null;
            if (professorId) {
              newUsers.push({
                id: professorId,
                name: draft.professorName || draft.professorEmail,
                email: draft.professorEmail,
                persona: 'professor',
                universityId: state.activeUniversityId,
                title: 'Professor (invited)',
                background: `Inventor on ${draft.title}.`,
              });
            }

            const item: IpItem = {
              id: nextId('ip'),
              universityId: state.activeUniversityId,
              title: draft.title,
              publicSummary: draft.publicSummary,
              confidentialDetail: draft.confidentialDetail,
              disclosure: {
                disclosureNumber: draft.disclosureNumber,
                field: draft.field,
                inventors: draft.inventors,
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

          log(
            source === 'import' ? 'import' : 'create',
            source === 'import'
              ? `Imported ${created.length} disclosure${created.length === 1 ? '' : 's'} — all landed private.`
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
          set({
            ipItems: state.ipItems.map((i) =>
              i.id === ipItemId ? { ...i, ...patch, updatedAt: now() } : i,
            ),
          });
          log('edit', `Updated "${item.title}".`, ipItemId);
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
      version: 1,
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
