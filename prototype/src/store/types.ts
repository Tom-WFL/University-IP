// Data model for the University IP prototype.
// Field names track the Gate-1 intake (features/university-ip/university-ip_intake.json)
// and the Jul 30 candidate list (UIP-* / MB-* ids referenced in comments).

export type PersonaId = 'public' | 'founder' | 'manager-usd' | 'manager-mines' | 'leadership';

/** UIP-6 / UIP-7 — release scopes, in ascending order of exposure. */
export type VisibilityTier = 'private' | 'campus' | 'statewide' | 'network';

export type IpStatus = 'unreviewed' | 'in_review' | 'published' | 'converted' | 'inactive';

/** UIP-16 — the three commercialization paths. */
export type IpRoute = 'unassigned' | 'founder' | 'hackathon' | 'founder_match';

/** UIP-17 — inventor participation mode. */
export type Involvement = 'contact_only' | 'involved';

export type InstitutionId = 'usd' | 'mines';

export interface Institution {
  id: InstitutionId;
  name: string;
  shortName: string;
  state: string;
  /** UIP-6 — School of Mines releases campus-first; USD wants an immediate wide net. */
  releasePolicy: 'staged' | 'wide_net';
  /** UIP-18 — institution can withhold the inventor's involvement choice. */
  forceContactOnly: boolean;
  /** UIP-22 — a settings note, not enforced logic. */
  ownershipNote: string;
}

export interface Inventor {
  name: string;
  email?: string;
  department?: string;
  retired?: boolean;
}

/** UIP-10 — one hit from the non-disclosure guardrail scan. */
export interface GuardrailFlag {
  excerpt: string;
  criterion: string;
  severity: 'warn' | 'block';
}

/** UIP-8 / UIP-9 / UIP-10 — the founder-facing concept summary and its approval state. */
export interface AiSummary {
  text: string;
  status: 'draft' | 'approved';
  version: number;
  guardrailFlags: GuardrailFlag[];
  generatedAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface IpRecord {
  id: string;
  displayNo: number;
  institutionId: InstitutionId;
  title: string;
  inventors: Inventor[];
  disclosureDate: string;
  classification: string;
  keywords: string[];
  /** The method. Never rendered on any founder-facing surface. */
  internalDescription: string;
  summary: AiSummary | null;
  visibility: VisibilityTier;
  status: IpStatus;
  route: IpRoute;
  involvement: Involvement;
  /** UIP-18 — record was set to "involved" before the institution's policy changed. */
  involvementSetBeforePolicy?: boolean;
  source: 'seed' | 'import' | 'manual';
  addedAt: string;
  releasedAt?: string;
  convertedAt?: string;
  updatedAt: string;
}

/** UIP-13 / UIP-14 */
export interface HandRaise {
  id: string;
  ipId: string;
  founderId: string;
  founderName: string;
  note?: string;
  status: 'pending' | 'connected' | 'approved' | 'declined';
  createdAt: string;
  decidedAt?: string;
  declineReason?: string;
}

/** MB-2 / REC-1 — who saw what, and when. */
export interface AccessLogEntry {
  id: string;
  ipId: string;
  userId: string;
  userName: string;
  event: 'viewed_summary' | 'nda_accepted' | 'hand_raise' | 'deep_link_signup';
  at: string;
}

/** UIP-15 */
export interface NdaAcceptance {
  userId: string;
  version: string;
  acceptedAt: string;
}

export interface Persona {
  id: PersonaId;
  name: string;
  title: string;
  email: string;
  role: 'public' | 'founder' | 'ip_manager' | 'leadership';
  institutionId?: InstitutionId;
}

export interface DemoState {
  seedVersion: number;
  personaId: PersonaId;
  founderDisplayName: string;
  institutions: Institution[];
  ips: IpRecord[];
  handRaises: HandRaise[];
  accessLog: AccessLogEntry[];
  ndaAcceptances: NdaAcceptance[];
}

export const VISIBILITY_ORDER: VisibilityTier[] = ['private', 'campus', 'statewide', 'network'];

export const VISIBILITY_LABEL: Record<VisibilityTier, string> = {
  private: 'Private',
  campus: 'Campus only',
  statewide: 'Statewide',
  network: 'National network',
};

export const ROUTE_LABEL: Record<IpRoute, string> = {
  unassigned: 'No route yet',
  founder: 'Founder (direct)',
  hackathon: 'Hackathon',
  founder_match: 'Founder Match',
};

export const INVOLVEMENT_LABEL: Record<Involvement, string> = {
  contact_only: 'Contact only',
  involved: 'Wants to be involved',
};
