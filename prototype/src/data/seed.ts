import type {
  AccessLogEntry,
  DemoState,
  HandRaise,
  Institution,
  IpRecord,
} from '@/store/types';
import { runGuardrails } from '@/lib/guardrails';
import { LEAKY_DRAFT_ID, summaryFor } from './summaries';

/** Bump when the shape or content of the seed changes — mismatched saves get rehydrated. */
export const SEED_VERSION = 1;

export const CLASSIFICATIONS = [
  'Medical device',
  'Diagnostics',
  'Agriculture / Food',
  'Materials',
  'Energy',
  'Software',
  'Environmental',
];

const INSTITUTIONS: Institution[] = [
  {
    id: 'usd',
    name: 'University of South Dakota',
    shortName: 'USD',
    state: 'South Dakota',
    // Jul 30: USD "was excited about a wide net across the country".
    releasePolicy: 'wide_net',
    // Jul 30: "we don't even want to give some people an option about it."
    forceContactOnly: true,
    ownershipNote:
      'South Dakota: the Board of Regents owns all university IP. North Dakota is structured differently — treat ownership as per-state configuration, not a fixed rule.',
  },
  {
    id: 'mines',
    name: 'SD School of Mines & Technology',
    shortName: 'Mines',
    state: 'South Dakota',
    // Jul 30: campus first, "let it sit there for a while", then statewide, then the network.
    releasePolicy: 'staged',
    forceContactOnly: false,
    ownershipNote:
      'South Dakota: the Board of Regents owns all university IP. North Dakota is structured differently — treat ownership as per-state configuration, not a fixed rule.',
  },
];

type SeedIp = {
  no: number;
  inst: 'usd' | 'mines';
  title: string;
  inventors: IpRecord['inventors'];
  disclosed: string;
  classification: string;
  keywords: string[];
  internal: string;
  visibility: IpRecord['visibility'];
  status: IpRecord['status'];
  route: IpRecord['route'];
  involvement: IpRecord['involvement'];
  summaryStatus: 'none' | 'draft' | 'approved';
  involvementSetBeforePolicy?: boolean;
  releasedDaysAgo?: number;
  addedDaysAgo: number;
};

const SEED_IPS: SeedIp[] = [
  {
    no: 41,
    inst: 'usd',
    title: 'Peptide Biosensor for Early Sepsis Detection',
    inventors: [{ name: 'Dr. Anita Ramaswamy', email: 'a.ramaswamy@usd.example.edu', department: 'Biomedical Engineering' }],
    disclosed: '2023-04-18',
    classification: 'Diagnostics',
    keywords: ['sepsis', 'point-of-care', 'biomarker'],
    internal:
      'Multiplexed peptide capture surface with a proprietary linker chemistry; the specific peptide sequences and the surface passivation protocol are the core of the disclosure.',
    visibility: 'network',
    status: 'published',
    route: 'founder_match',
    involvement: 'involved',
    involvementSetBeforePolicy: true,
    summaryStatus: 'approved',
    releasedDaysAgo: 62,
    addedDaysAgo: 240,
  },
  {
    no: 51,
    inst: 'usd',
    title: 'Adaptive Prosthetic Socket Liner with Microfluidic Pressure Regulation',
    inventors: [{ name: 'Dr. Elena Whitcomb', email: 'e.whitcomb@usd.example.edu', department: 'Mechanical Engineering' }],
    disclosed: '2024-09-02',
    classification: 'Medical device',
    keywords: ['prosthetics', 'wearable', 'microfluidics'],
    internal:
      'Channel geometry and the passive valve design that redistributes fluid as limb volume changes. The valve tolerances are the hard-won part.',
    visibility: 'network',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 34,
    addedDaysAgo: 180,
  },
  {
    no: 7,
    inst: 'usd',
    title: 'Low-Loss Amorphous Transformer Core Alloy',
    inventors: [{ name: 'Dr. Alan Petersen', department: 'Materials Science', retired: true }],
    disclosed: '1998-06-11',
    classification: 'Materials',
    keywords: ['grid', 'transformer', 'amorphous alloy'],
    internal:
      'Alloy composition and the rapid-quench parameters. Original lab notebooks are archived; the inventor retired in 2011 and is not reachable through the department.',
    visibility: 'private',
    status: 'inactive',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 400,
  },
  {
    no: 18,
    inst: 'usd',
    title: 'Rare-Earth-Free Permanent Magnet Sintering Process',
    inventors: [{ name: 'Dr. Marcus Feld', email: 'm.feld@usd.example.edu', department: 'Materials Science' }],
    disclosed: '2019-11-30',
    classification: 'Materials',
    keywords: ['magnets', 'supply chain', 'sintering'],
    internal: 'Two-stage sintering schedule and the grain-boundary additive that holds coercivity without neodymium.',
    visibility: 'private',
    status: 'unreviewed',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 300,
  },
  {
    no: 24,
    inst: 'usd',
    title: 'Drought-Tolerant Wheat Marker Panel',
    inventors: [{ name: 'Dr. Priya Deshmukh', email: 'p.deshmukh@usd.example.edu', department: 'Plant Science' }],
    disclosed: '2021-02-15',
    classification: 'Agriculture / Food',
    keywords: ['wheat', 'breeding', 'genomics'],
    internal: 'The specific marker loci and the scoring weights that make the panel predictive.',
    visibility: 'statewide',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 128,
    addedDaysAgo: 260,
  },
  {
    no: 63,
    inst: 'usd',
    title: 'Solid-State Sodium Battery Electrolyte',
    inventors: [{ name: 'Dr. Wei Chen', email: 'w.chen@usd.example.edu', department: 'Chemistry' }],
    disclosed: '2025-01-20',
    classification: 'Energy',
    keywords: ['battery', 'sodium', 'grid storage'],
    internal:
      'Sintering schedule, dopant ratio, and the argon anneal step. This is the whole invention — none of it can appear in a public summary.',
    visibility: 'private',
    status: 'in_review',
    route: 'unassigned',
    involvement: 'contact_only',
    // Draft on purpose: the guardrail scan should light this one up.
    summaryStatus: 'draft',
    addedDaysAgo: 90,
  },
  {
    no: 29,
    inst: 'usd',
    title: 'Computer-Vision Livestock Lameness Grading',
    inventors: [{ name: 'Dr. Owen Brackett', email: 'o.brackett@usd.example.edu', department: 'Animal Science' }],
    disclosed: '2024-03-08',
    classification: 'Agriculture / Food',
    keywords: ['livestock', 'computer vision', 'welfare'],
    internal: 'Gait-feature extraction and the labelled training set built from four feedlots.',
    visibility: 'network',
    status: 'published',
    route: 'hackathon',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 21,
    addedDaysAgo: 150,
  },
  {
    no: 33,
    inst: 'usd',
    title: 'Microbial Soil Amendment for Marginal Cropland',
    inventors: [{ name: 'Dr. Lena Ostrom', email: 'l.ostrom@usd.example.edu', department: 'Biology' }],
    disclosed: '2020-08-24',
    classification: 'Agriculture / Food',
    keywords: ['soil', 'microbiome', 'row crops'],
    internal: 'Consortium strain list and the carrier formulation that keeps it viable through storage.',
    visibility: 'campus',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 150,
    addedDaysAgo: 280,
  },
  {
    no: 9,
    inst: 'usd',
    title: 'Non-Invasive Glucose Monitoring Earpiece',
    inventors: [{ name: 'Dr. Sofia Márquez', email: 's.marquez@usd.example.edu', department: 'Biomedical Engineering' }],
    disclosed: '2022-05-19',
    classification: 'Medical device',
    keywords: ['diabetes', 'wearable', 'optical sensing'],
    internal: 'Optical path design and the calibration model that corrects for skin tone and perfusion.',
    visibility: 'network',
    status: 'converted',
    route: 'founder_match',
    involvement: 'involved',
    involvementSetBeforePolicy: true,
    summaryStatus: 'approved',
    releasedDaysAgo: 96,
    addedDaysAgo: 220,
  },
  {
    no: 12,
    inst: 'usd',
    title: 'Cold-Chain Vaccine Exposure Indicator Label',
    inventors: [{ name: 'Dr. Ruth Kaneko', email: 'r.kaneko@usd.example.edu', department: 'Chemistry' }],
    disclosed: '2018-10-05',
    classification: 'Medical device',
    keywords: ['cold chain', 'public health', 'indicator'],
    internal: 'Dye chemistry and the threshold-tuning approach for different vaccine profiles.',
    visibility: 'private',
    status: 'unreviewed',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 340,
  },
  {
    no: 46,
    inst: 'usd',
    title: 'Acoustic Leak Detection for Rural Water Mains',
    inventors: [{ name: 'Dr. Tomás Vela', email: 't.vela@usd.example.edu', department: 'Civil Engineering' }],
    disclosed: '2023-07-27',
    classification: 'Environmental',
    keywords: ['water', 'infrastructure', 'acoustics'],
    internal: 'Signal-processing chain that separates leak signature from pump and traffic noise.',
    visibility: 'network',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 118,
    addedDaysAgo: 200,
  },
  {
    no: 55,
    inst: 'usd',
    title: 'Gamified At-Home Speech Therapy Framework',
    inventors: [{ name: 'Dr. Hannah Boyle', email: 'h.boyle@usd.example.edu', department: 'Communication Sciences' }],
    disclosed: '2024-11-12',
    classification: 'Software',
    keywords: ['speech therapy', 'pediatrics', 'adherence'],
    internal: 'Exercise progression model and the clinician-facing adherence scoring.',
    visibility: 'private',
    status: 'in_review',
    // Founder already identified outside Wildfire — stays private, direct NDA.
    route: 'founder',
    involvement: 'involved',
    involvementSetBeforePolicy: true,
    summaryStatus: 'approved',
    addedDaysAgo: 70,
  },
  {
    no: 16,
    inst: 'usd',
    title: 'High-Throughput Prairie Seed Sorter',
    inventors: [{ name: 'Dr. Grant Ellingson', email: 'g.ellingson@usd.example.edu', department: 'Biology' }],
    disclosed: '2016-04-02',
    classification: 'Agriculture / Food',
    keywords: ['restoration', 'seed', 'automation'],
    internal: 'Optical classifier and the air-jet separation timing that keeps throughput up.',
    visibility: 'statewide',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 210,
    addedDaysAgo: 365,
  },
  {
    no: 71,
    inst: 'usd',
    title: 'Bovine Respiratory Early-Warning Collar',
    inventors: [{ name: 'Dr. Owen Brackett', email: 'o.brackett@usd.example.edu', department: 'Animal Science' }],
    disclosed: '2025-06-30',
    classification: 'Agriculture / Food',
    keywords: ['cattle', 'wearable', 'herd health'],
    internal: 'Sensor fusion across temperature, activity, and respiration rate; the alert thresholds are the IP.',
    visibility: 'private',
    status: 'unreviewed',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 6,
  },

  // ---- SD School of Mines: the staged-release ladder ----
  {
    no: 102,
    inst: 'mines',
    title: 'Selective Lithium Recovery from Produced Water',
    inventors: [{ name: 'Dr. Jonas Reitz', email: 'j.reitz@sdsmt.example.edu', department: 'Chemical Engineering' }],
    disclosed: '2023-09-14',
    classification: 'Materials',
    keywords: ['lithium', 'produced water', 'extraction'],
    internal: 'Sorbent composition and the regeneration cycle that keeps selectivity across repeated use.',
    visibility: 'campus',
    status: 'published',
    route: 'founder_match',
    involvement: 'involved',
    summaryStatus: 'approved',
    releasedDaysAgo: 28,
    addedDaysAgo: 190,
  },
  {
    no: 108,
    inst: 'mines',
    title: 'Mine-Shaft Inspection Drone Navigation Stack',
    inventors: [{ name: 'Dr. Ivy Salcedo', email: 'i.salcedo@sdsmt.example.edu', department: 'Computer Science' }],
    disclosed: '2024-05-21',
    classification: 'Software',
    keywords: ['drone', 'GPS-denied', 'mining'],
    internal: 'SLAM variant tuned for dust and low light, plus the failsafe behaviour on signal loss.',
    visibility: 'private',
    status: 'in_review',
    route: 'unassigned',
    involvement: 'contact_only',
    // Clean draft — the happy-path approve demo.
    summaryStatus: 'draft',
    addedDaysAgo: 45,
  },
  {
    no: 115,
    inst: 'mines',
    title: 'Self-Healing Concrete Additive',
    inventors: [{ name: 'Dr. Paul Nkemdirim', email: 'p.nkemdirim@sdsmt.example.edu', department: 'Civil Engineering' }],
    disclosed: '2021-06-08',
    classification: 'Materials',
    keywords: ['concrete', 'infrastructure', 'freeze-thaw'],
    internal: 'Encapsulation shell chemistry and the trigger threshold for release.',
    visibility: 'statewide',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 95,
    addedDaysAgo: 240,
  },
  {
    no: 121,
    inst: 'mines',
    title: 'Geothermal Gradient Mapping from Legacy Survey Data',
    inventors: [{ name: 'Dr. Ivy Salcedo', email: 'i.salcedo@sdsmt.example.edu', department: 'Computer Science' }],
    disclosed: '2022-10-03',
    classification: 'Energy',
    keywords: ['geothermal', 'geospatial', 'exploration'],
    internal: 'Inversion approach and the correction terms applied to decades-old survey records.',
    visibility: 'network',
    status: 'published',
    route: 'founder_match',
    involvement: 'contact_only',
    summaryStatus: 'approved',
    releasedDaysAgo: 140,
    addedDaysAgo: 250,
  },
  {
    no: 127,
    inst: 'mines',
    title: 'Low-Water Dust-Suppression Polymer',
    inventors: [{ name: 'Dr. Jonas Reitz', email: 'j.reitz@sdsmt.example.edu', department: 'Chemical Engineering' }],
    disclosed: '2017-03-19',
    classification: 'Environmental',
    keywords: ['dust', 'haul road', 'water use'],
    internal: 'Polymer blend and application rate schedule by road surface type.',
    visibility: 'private',
    status: 'unreviewed',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 320,
  },
  {
    no: 133,
    inst: 'mines',
    title: 'Rock-Bolt Corrosion Sensor Mesh',
    inventors: [{ name: 'Dr. Claire Osei', email: 'c.osei@sdsmt.example.edu', department: 'Mining Engineering' }],
    disclosed: '2025-04-11',
    classification: 'Materials',
    keywords: ['ground support', 'corrosion', 'sensors'],
    internal: 'Mesh topology and the impedance signature that predicts remaining bolt life.',
    visibility: 'private',
    status: 'unreviewed',
    route: 'unassigned',
    involvement: 'contact_only',
    summaryStatus: 'none',
    addedDaysAgo: 30,
  },
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString();
}

function buildIps(): IpRecord[] {
  return SEED_IPS.map((s) => {
    const id = `uip-${String(s.no).padStart(3, '0')}`;
    const text = summaryFor(id, s.classification);
    const summary =
      s.summaryStatus === 'none'
        ? null
        : {
            text,
            status: s.summaryStatus,
            version: s.summaryStatus === 'approved' ? 2 : 1,
            guardrailFlags: runGuardrails(text),
            generatedAt: isoDaysAgo(s.addedDaysAgo - 2),
            ...(s.summaryStatus === 'approved'
              ? {
                  approvedBy: s.inst === 'usd' ? 'Kirby Hale' : 'Rachel Nolan',
                  approvedAt: isoDaysAgo(Math.max(1, s.addedDaysAgo - 5)),
                }
              : {}),
          };

    return {
      id,
      displayNo: s.no,
      institutionId: s.inst,
      title: s.title,
      inventors: s.inventors,
      disclosureDate: s.disclosed,
      classification: s.classification,
      keywords: s.keywords,
      internalDescription: s.internal,
      summary,
      visibility: s.visibility,
      status: s.status,
      route: s.route,
      involvement: s.involvement,
      involvementSetBeforePolicy: s.involvementSetBeforePolicy,
      source: 'seed' as const,
      addedAt: isoDaysAgo(s.addedDaysAgo),
      releasedAt: s.releasedDaysAgo != null ? isoDaysAgo(s.releasedDaysAgo) : undefined,
      convertedAt: s.status === 'converted' ? isoDaysAgo(14) : undefined,
      updatedAt: isoDaysAgo(Math.max(1, Math.floor(s.addedDaysAgo / 3))),
    } satisfies IpRecord;
  });
}

const HAND_RAISES: HandRaise[] = [
  {
    id: 'hr-1',
    ipId: 'uip-009',
    founderId: 'founder',
    founderName: 'Marcus Webb',
    note: 'I spent six years in continuous glucose monitoring sales. I know these buyers.',
    status: 'approved',
    createdAt: isoDaysAgo(30),
    decidedAt: isoDaysAgo(14),
  },
  {
    id: 'hr-2',
    ipId: 'uip-041',
    founderId: 'founder',
    founderName: 'Marcus Webb',
    note: 'Interested — I have a co-founder in mind who ran regulatory at a diagnostics startup.',
    status: 'pending',
    createdAt: isoDaysAgo(3),
  },
  {
    id: 'hr-3',
    ipId: 'uip-041',
    founderId: 'ext-1',
    founderName: 'Danielle Fontaine',
    note: 'Former ICU nurse, now doing health-tech product. This is the problem I left the bedside over.',
    status: 'pending',
    createdAt: isoDaysAgo(6),
  },
  {
    id: 'hr-4',
    ipId: 'uip-041',
    founderId: 'ext-2',
    founderName: 'Peter Nyandoro',
    status: 'pending',
    createdAt: isoDaysAgo(1),
  },
  {
    id: 'hr-5',
    ipId: 'uip-046',
    founderId: 'ext-3',
    founderName: 'Sam Whitethorn',
    note: 'I sell to rural water districts today. Happy to talk.',
    status: 'connected',
    createdAt: isoDaysAgo(19),
    decidedAt: isoDaysAgo(12),
  },
  {
    id: 'hr-6',
    ipId: 'uip-024',
    founderId: 'ext-4',
    founderName: 'Blake Iverson',
    status: 'declined',
    createdAt: isoDaysAgo(70),
    decidedAt: isoDaysAgo(64),
    declineReason: 'No agriculture background and the inventor wants a breeding-industry operator.',
  },
  {
    id: 'hr-7',
    ipId: 'uip-102',
    founderId: 'ext-5',
    founderName: 'Yusuf Abadi',
    note: 'Senior at Mines, chem-eng. I want to build this.',
    status: 'pending',
    createdAt: isoDaysAgo(4),
  },
  {
    id: 'hr-8',
    ipId: 'uip-121',
    founderId: 'ext-6',
    founderName: 'Rae Lindqvist',
    status: 'connected',
    createdAt: isoDaysAgo(25),
    decidedAt: isoDaysAgo(20),
  },
];

const ACCESS_LOG: AccessLogEntry[] = [
  { id: 'al-1', ipId: 'uip-009', userId: 'founder', userName: 'Marcus Webb', event: 'nda_accepted', at: isoDaysAgo(31) },
  { id: 'al-2', ipId: 'uip-009', userId: 'founder', userName: 'Marcus Webb', event: 'viewed_summary', at: isoDaysAgo(31) },
  { id: 'al-3', ipId: 'uip-009', userId: 'founder', userName: 'Marcus Webb', event: 'hand_raise', at: isoDaysAgo(30) },
  { id: 'al-4', ipId: 'uip-041', userId: 'ext-1', userName: 'Danielle Fontaine', event: 'viewed_summary', at: isoDaysAgo(7) },
  { id: 'al-5', ipId: 'uip-041', userId: 'ext-1', userName: 'Danielle Fontaine', event: 'hand_raise', at: isoDaysAgo(6) },
  { id: 'al-6', ipId: 'uip-041', userId: 'ext-7', userName: 'Corinne Blaskey', event: 'viewed_summary', at: isoDaysAgo(5) },
  { id: 'al-7', ipId: 'uip-041', userId: 'ext-2', userName: 'Peter Nyandoro', event: 'viewed_summary', at: isoDaysAgo(2) },
  { id: 'al-8', ipId: 'uip-041', userId: 'ext-2', userName: 'Peter Nyandoro', event: 'hand_raise', at: isoDaysAgo(1) },
  { id: 'al-9', ipId: 'uip-051', userId: 'ext-8', userName: 'Tara Lindgren', event: 'viewed_summary', at: isoDaysAgo(9) },
  { id: 'al-10', ipId: 'uip-051', userId: 'ext-9', userName: 'Josh Amundson', event: 'deep_link_signup', at: isoDaysAgo(4) },
  { id: 'al-11', ipId: 'uip-051', userId: 'ext-9', userName: 'Josh Amundson', event: 'viewed_summary', at: isoDaysAgo(4) },
  { id: 'al-12', ipId: 'uip-046', userId: 'ext-3', userName: 'Sam Whitethorn', event: 'nda_accepted', at: isoDaysAgo(20) },
  { id: 'al-13', ipId: 'uip-121', userId: 'ext-6', userName: 'Rae Lindqvist', event: 'viewed_summary', at: isoDaysAgo(26) },
];

export function buildSeedState(): DemoState {
  return {
    seedVersion: SEED_VERSION,
    personaId: 'public',
    founderDisplayName: 'Marcus Webb',
    institutions: INSTITUTIONS.map((i) => ({ ...i })),
    ips: buildIps(),
    handRaises: HAND_RAISES.map((h) => ({ ...h })),
    accessLog: ACCESS_LOG.map((a) => ({ ...a })),
    ndaAcceptances: [{ userId: 'founder', version: 'v1.0', acceptedAt: isoDaysAgo(31) }],
  };
}

/** The IP the fake marketing page deep-links into (MB-4). */
export const DEEP_LINK_IP_ID = 'uip-051';
export { LEAKY_DRAFT_ID };
