import * as React from 'react';
import { runGuardrails } from '@/lib/guardrails';
import { nowIso } from '@/lib/format';
import { buildSeedState, SEED_VERSION } from '@/data/seed';
import { summaryFor } from '@/data/summaries';
import { getPersona } from './personas';
import type {
  AccessLogEntry,
  DemoState,
  HandRaise,
  Institution,
  Inventor,
  IpRecord,
  IpRoute,
  Involvement,
  PersonaId,
  VisibilityTier,
} from './types';
import { VISIBILITY_ORDER } from './types';

const STORAGE_KEY = 'uip-demo:v1';
export const NDA_VERSION = 'v1.0';

function load(): DemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildSeedState();
    const parsed = JSON.parse(raw) as DemoState;
    if (!parsed || parsed.seedVersion !== SEED_VERSION) return buildSeedState();
    return parsed;
  } catch {
    return buildSeedState();
  }
}

/** Why a visibility change can't go through as-is, so the caller can put up the right dialog. */
export type VisibilityVerdict =
  | { kind: 'ok' }
  | { kind: 'needs_summary' }
  | { kind: 'skips_tier'; policyTier: VisibilityTier }
  | { kind: 'reduces_with_raises'; raiseCount: number };

interface DemoContextValue {
  state: DemoState;
  persona: ReturnType<typeof getPersona>;
  institution: Institution | undefined;
  setPersona: (id: PersonaId) => void;
  registerSignup: (name: string, ipId?: string) => void;
  addIp: (input: NewIpInput) => IpRecord;
  importIps: (rows: NewIpInput[]) => number;
  updateIp: (id: string, patch: Partial<IpRecord>) => void;
  generateSummary: (id: string) => Promise<void>;
  updateSummaryText: (id: string, text: string) => void;
  approveSummary: (id: string, approver: string) => void;
  checkVisibility: (id: string, next: VisibilityTier) => VisibilityVerdict;
  setVisibility: (id: string, next: VisibilityTier) => void;
  setRoute: (id: string, route: IpRoute) => void;
  setInvolvement: (id: string, involvement: Involvement) => void;
  raiseHand: (ipId: string, note: string) => void;
  setHandRaiseStatus: (
    id: string,
    status: HandRaise['status'],
    opts?: { declineReason?: string; declineOthers?: boolean },
  ) => void;
  acceptNda: (ipId: string) => void;
  hasAcceptedNda: boolean;
  logAccess: (ipId: string, event: AccessLogEntry['event']) => void;
  updateInstitution: (id: Institution['id'], patch: Partial<Institution>) => void;
  resetDemo: () => void;
}

export interface NewIpInput {
  title: string;
  inventors: Inventor[];
  disclosureDate: string;
  classification: string;
  keywords: string[];
  internalDescription: string;
  institutionId: Institution['id'];
  source: IpRecord['source'];
}

const DemoContext = React.createContext<DemoContextValue | null>(null);

export function DemoStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<DemoState>(load);
  const seenThisSession = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Quota exceeded (usually a large logo dataURL elsewhere) — the demo still works in memory.
    }
  }, [state]);

  const persona = getPersona(state.personaId);
  const institution = state.institutions.find((i) => i.id === persona.institutionId);

  const patchIp = React.useCallback((id: string, fn: (ip: IpRecord) => IpRecord) => {
    setState((s) => ({
      ...s,
      ips: s.ips.map((ip) => (ip.id === id ? { ...fn(ip), updatedAt: nowIso() } : ip)),
    }));
  }, []);

  const appendLog = React.useCallback(
    (ipId: string, event: AccessLogEntry['event'], who?: { id: string; name: string }) => {
      setState((s) => {
        const p = getPersona(s.personaId);
        const userId = who?.id ?? (p.id === 'founder' ? 'founder' : p.id);
        const userName = who?.name ?? (p.id === 'founder' ? s.founderDisplayName : p.name);
        return {
          ...s,
          accessLog: [
            ...s.accessLog,
            { id: `al-${Date.now()}-${s.accessLog.length}`, ipId, userId, userName, event, at: nowIso() },
          ],
        };
      });
    },
    [],
  );

  const value: DemoContextValue = {
    state,
    persona,
    institution,

    setPersona: (id) => setState((s) => ({ ...s, personaId: id })),

    registerSignup: (name, ipId) => {
      setState((s) => ({
        ...s,
        personaId: 'founder',
        founderDisplayName: name || s.founderDisplayName,
      }));
      if (ipId) appendLog(ipId, 'deep_link_signup', { id: 'founder', name });
    },

    addIp: (input) => {
      const nextNo = Math.max(0, ...state.ips.map((i) => i.displayNo)) + 1;
      const inst = state.institutions.find((i) => i.id === input.institutionId);
      const record: IpRecord = {
        id: `uip-${String(nextNo).padStart(3, '0')}`,
        displayNo: nextNo,
        institutionId: input.institutionId,
        title: input.title,
        inventors: input.inventors,
        disclosureDate: input.disclosureDate,
        classification: input.classification,
        keywords: input.keywords,
        internalDescription: input.internalDescription,
        summary: null,
        // UIP-5 — everything lands private until the manager decides.
        visibility: 'private',
        status: 'unreviewed',
        route: 'unassigned',
        involvement: inst?.forceContactOnly ? 'contact_only' : 'contact_only',
        source: input.source,
        addedAt: nowIso(),
        updatedAt: nowIso(),
      };
      setState((s) => ({ ...s, ips: [record, ...s.ips] }));
      return record;
    },

    importIps: (rows) => {
      let no = Math.max(0, ...state.ips.map((i) => i.displayNo));
      const records: IpRecord[] = rows.map((input) => {
        no += 1;
        return {
          id: `uip-${String(no).padStart(3, '0')}`,
          displayNo: no,
          institutionId: input.institutionId,
          title: input.title,
          inventors: input.inventors,
          disclosureDate: input.disclosureDate,
          classification: input.classification,
          keywords: input.keywords,
          internalDescription: input.internalDescription,
          summary: null,
          visibility: 'private',
          status: 'unreviewed',
          route: 'unassigned',
          involvement: 'contact_only',
          source: 'import',
          addedAt: nowIso(),
          updatedAt: nowIso(),
        };
      });
      setState((s) => ({ ...s, ips: [...records, ...s.ips] }));
      return records.length;
    },

    updateIp: (id, patch) => patchIp(id, (ip) => ({ ...ip, ...patch })),

    generateSummary: async (id) => {
      // Fake latency so the walkthrough shows a working state rather than an instant swap.
      await new Promise((r) => setTimeout(r, 1800));
      patchIp(id, (ip) => {
        const text = summaryFor(ip.id, ip.classification);
        return {
          ...ip,
          status: ip.status === 'unreviewed' ? 'in_review' : ip.status,
          summary: {
            text,
            status: 'draft',
            version: (ip.summary?.version ?? 0) + 1,
            guardrailFlags: runGuardrails(text),
            generatedAt: nowIso(),
          },
        };
      });
    },

    updateSummaryText: (id, text) =>
      patchIp(id, (ip) =>
        ip.summary
          ? {
              ...ip,
              summary: {
                ...ip.summary,
                text,
                // Editing an approved summary sends it back for re-approval (REC-3).
                status: 'draft',
                guardrailFlags: runGuardrails(text),
                approvedBy: undefined,
                approvedAt: undefined,
              },
            }
          : ip,
      ),

    approveSummary: (id, approver) =>
      patchIp(id, (ip) =>
        ip.summary
          ? {
              ...ip,
              summary: { ...ip.summary, status: 'approved', approvedBy: approver, approvedAt: nowIso() },
            }
          : ip,
      ),

    checkVisibility: (id, next) => {
      const ip = state.ips.find((i) => i.id === id);
      if (!ip) return { kind: 'ok' };
      const inst = state.institutions.find((i) => i.id === ip.institutionId);
      const currentIdx = VISIBILITY_ORDER.indexOf(ip.visibility);
      const nextIdx = VISIBILITY_ORDER.indexOf(next);

      if (nextIdx > 0 && ip.summary?.status !== 'approved') return { kind: 'needs_summary' };

      if (nextIdx < currentIdx) {
        const raises = state.handRaises.filter((h) => h.ipId === id && h.status !== 'declined').length;
        if (raises > 0) return { kind: 'reduces_with_raises', raiseCount: raises };
      }

      // UIP-6 — a staged institution expects each tier to get its turn.
      if (inst?.releasePolicy === 'staged' && nextIdx > currentIdx + 1) {
        return { kind: 'skips_tier', policyTier: VISIBILITY_ORDER[currentIdx + 1] };
      }

      return { kind: 'ok' };
    },

    setVisibility: (id, next) =>
      patchIp(id, (ip) => ({
        ...ip,
        visibility: next,
        status:
          next === 'private'
            ? ip.status === 'published'
              ? 'in_review'
              : ip.status
            : ip.status === 'converted'
              ? 'converted'
              : 'published',
        releasedAt: next === 'private' ? undefined : (ip.releasedAt ?? nowIso()),
      })),

    setRoute: (id, route) => patchIp(id, (ip) => ({ ...ip, route })),

    setInvolvement: (id, involvement) =>
      patchIp(id, (ip) => ({ ...ip, involvement, involvementSetBeforePolicy: false })),

    raiseHand: (ipId, note) => {
      setState((s) => ({
        ...s,
        handRaises: [
          ...s.handRaises,
          {
            id: `hr-${Date.now()}`,
            ipId,
            founderId: 'founder',
            founderName: s.founderDisplayName,
            note: note || undefined,
            status: 'pending',
            createdAt: nowIso(),
          },
        ],
      }));
      appendLog(ipId, 'hand_raise');
    },

    setHandRaiseStatus: (id, status, opts) => {
      setState((s) => {
        const target = s.handRaises.find((h) => h.id === id);
        if (!target) return s;
        const handRaises = s.handRaises.map((h) => {
          if (h.id === id) {
            return { ...h, status, decidedAt: nowIso(), declineReason: opts?.declineReason ?? h.declineReason };
          }
          if (opts?.declineOthers && h.ipId === target.ipId && h.status === 'pending') {
            return {
              ...h,
              status: 'declined' as const,
              decidedAt: nowIso(),
              declineReason: 'Another founder was approved for this IP.',
            };
          }
          return h;
        });
        const ips =
          status === 'approved'
            ? s.ips.map((ip) =>
                ip.id === target.ipId
                  ? { ...ip, status: 'converted' as const, convertedAt: nowIso(), updatedAt: nowIso() }
                  : ip,
              )
            : s.ips;
        return { ...s, handRaises, ips };
      });
    },

    acceptNda: (ipId) => {
      setState((s) => ({
        ...s,
        ndaAcceptances: [
          ...s.ndaAcceptances.filter((n) => n.userId !== 'founder'),
          { userId: 'founder', version: NDA_VERSION, acceptedAt: nowIso() },
        ],
      }));
      appendLog(ipId, 'nda_accepted');
    },

    hasAcceptedNda: state.ndaAcceptances.some((n) => n.userId === 'founder' && n.version === NDA_VERSION),

    logAccess: (ipId, event) => {
      // One view entry per IP per session keeps the log readable during a demo.
      const key = `${event}:${ipId}`;
      if (event === 'viewed_summary') {
        if (seenThisSession.current.has(key)) return;
        seenThisSession.current.add(key);
      }
      appendLog(ipId, event);
    },

    updateInstitution: (id, patch) =>
      setState((s) => ({
        ...s,
        institutions: s.institutions.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      })),

    resetDemo: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      seenThisSession.current.clear();
      setState(buildSeedState());
    },
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = React.useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoStoreProvider');
  return ctx;
}

/** Records visible to the current persona: managers see their own institution only (UIP-21). */
export function useScopedIps(): IpRecord[] {
  const { state, persona } = useDemo();
  return React.useMemo(() => {
    if (persona.role === 'ip_manager' || persona.role === 'leadership') {
      return state.ips.filter((ip) => ip.institutionId === persona.institutionId);
    }
    if (persona.role === 'founder') {
      return state.ips.filter((ip) => ip.visibility === 'network' && ip.summary?.status === 'approved');
    }
    return [];
  }, [state.ips, persona]);
}
