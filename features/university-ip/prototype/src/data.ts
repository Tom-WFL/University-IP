/* Mock data for the University IP prototype (v5 redesign).
   Client-state only — nothing persists.

   One lifecycle per idea replaces the old state × route × matchStatus ×
   free-text-outcome tangle:

     stage:   new → reviewing → routed → in_motion → done
     onHold:  a PAUSE flag that can sit on any pre-done stage (not a route)
     route:   set when the idea reaches "routed" (founder / hackathon / founder_match)
     outcome: set when the idea reaches "done" (company formed / matched /
              built at hackathon / passed), with a short note
     published: meaningful when route = founder_match — whether the idea is
              listed on the founder-facing marketplace
     interests: founder-interest records attached to the idea itself;
              acting on one (connect / decline) updates the idea

   Tenancy: the IP Manager sees only their own university's ideas; the
   founder-facing marketplace spans universities. */

export type Stage = "new" | "reviewing" | "routed" | "in_motion" | "done";
export type RouteKind = "founder" | "hackathon" | "founder_match";
export type OutcomeKind = "company_formed" | "matched" | "built_at_hackathon" | "passed";
export type Involvement = "cofounder" | "contact";
export type PatentStatus = "not_filed" | "provisional" | "filed" | "granted";
export type InterestStatus = "new" | "connected" | "declined";

export const STAGES: Stage[] = ["new", "reviewing", "routed", "in_motion", "done"];

export const STAGE_LABEL: Record<Stage, string> = {
  new: "New",
  reviewing: "Reviewing",
  routed: "Routed",
  in_motion: "In motion",
  done: "Done",
};

export const ROUTE_LABEL: Record<RouteKind, string> = {
  founder: "Founder",
  hackathon: "Hackathon",
  founder_match: "Founder Match",
};

export const OUTCOME_LABEL: Record<OutcomeKind, string> = {
  company_formed: "Company formed",
  matched: "Founder matched",
  built_at_hackathon: "Built at hackathon",
  passed: "Passed",
};

export const PATENT_LABEL: Record<PatentStatus, string> = {
  not_filed: "Not filed",
  provisional: "Provisional",
  filed: "Filed",
  granted: "Granted",
};

/* Founder-route program tracking mirrors the live app's founder-tracking
   framework (FounderProgress: currentPhase, lessons, engagement). Read-only
   here — it reflects the professor-founder's progress through the program. */
export const PHASE_ORDER = ["Customer Discovery", "Build", "Go-to-Market 1", "Go-to-Market 2"] as const;

export interface FounderTracking {
  currentPhase: (typeof PHASE_ORDER)[number];
  lessonsCompleted: number;
  totalLessons: number;
  companyName: string;
  coFounder?: string;
}

export interface HackathonTracking {
  event: string | null; // which hackathon the idea is (or was) offered at
  pickedBy: string | null; // team/person working the idea
  built: string | null; // what was built
}

/* A founder's expressed interest, attached to the idea it concerns.
   Connect / decline acts on the IDEA's record — there is no separate inbox. */
export interface FounderInterest {
  id: number;
  founder: string;
  founderContext: string;
  when: string;
  status: InterestStatus;
}

export interface IpIdea {
  id: number;
  title: string;
  summary: string; // one plain-language paragraph — the only description field
  university: string;
  professor: string;
  professorDept: string;
  involvement: Involvement; // per idea: day-to-day co-founder vs contact only
  patentStatus: PatentStatus;
  disclosureRef?: string; // the tech-transfer office's reference #, optional
  stage: Stage;
  onHold: boolean; // pause flag — not a stage, not a route
  holdNote?: string;
  route: RouteKind | null; // set when stage reaches "routed"
  published: boolean; // meaningful when route = founder_match: listed on the marketplace
  outcome?: OutcomeKind; // set when stage = done
  outcomeNote?: string;
  updated: string; // last activity, human-readable (mock)
  notes?: string; // IP Manager's working notes
  inviteSent?: boolean; // professor profile created + invite sent
  founderTracking?: FounderTracking;
  hackathonTracking?: HackathonTracking;
  interests: FounderInterest[];
}

export const UNIVERSITY = "University of South Dakota";
export const IP_MANAGER = "Kirby Nelson";
export const FOUNDER_NAME = "Marcus Webb";
export const PROFESSOR_PERSONA = "Dr. Miriam Hale";
export const ADMIN_NAME = "Alex Rivera";

/* The university's people directory — intake picks a professor from here
   (never a typed string) and the department auto-fills. */
export const USD_PROFESSORS: { name: string; dept: string }[] = [
  { name: "Dr. Miriam Hale", dept: "Biomedical Engineering" },
  { name: "Dr. Owen Pruitt", dept: "Electrical Engineering" },
  { name: "Dr. Anna Voss", dept: "Materials Science" },
  { name: "Dr. Sam Littlefeather", dept: "Earth Sciences" },
];

export const SEED_IDEAS: IpIdea[] = [
  {
    id: 1,
    title: "Cardiac tissue preservation compound",
    summary:
      "A preservation compound that extends how long donor heart tissue stays viable in transit, widening the transplant matching window from hours to days. Sells to organ-procurement organizations and transplant centers, starting with a perfusion additive that drops into existing cold-chain logistics.",
    university: UNIVERSITY,
    professor: "Dr. Miriam Hale",
    professorDept: "Biomedical Engineering",
    involvement: "cofounder",
    patentStatus: "filed",
    disclosureRef: "USD-2025-014",
    stage: "in_motion",
    onHold: false,
    route: "founder",
    published: false,
    updated: "2 days ago",
    notes: "Dr. Hale and Jess pairing well — Build phase on pace after a slow start.",
    inviteSent: true,
    founderTracking: {
      currentPhase: "Build",
      lessonsCompleted: 14,
      totalLessons: 32,
      companyName: "HaleCardio",
      coFounder: "Jess Munoz (via Founder Match)",
    },
    interests: [],
  },
  {
    id: 2,
    title: "Low-cost soil nitrate sensor",
    summary:
      "A printed-electronics soil sensor that gives row-crop farmers real-time nitrate readings for a few dollars per unit instead of lab-test turnaround times. Farmers stake disposable sensors through the field, readings feed a dashboard, and fertilizer application gets dialed to what the soil actually needs.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    patentStatus: "not_filed",
    disclosureRef: "USD-2025-021",
    stage: "done",
    onHold: false,
    route: "hackathon",
    published: false,
    outcome: "built_at_hackathon",
    outcomeNote: "2nd place at Fall Builders Jam 2026 — Team AgriSense is applying to Wildfire Labs.",
    updated: "3 weeks ago",
    inviteSent: true,
    hackathonTracking: {
      event: "Fall Builders Jam 2026",
      pickedBy: "Team AgriSense",
      built: "Working sensor + field-map dashboard prototype",
    },
    interests: [],
  },
  {
    id: 3,
    title: "Prairie-grass biocomposite panels",
    summary:
      "Turns prairie-grass fiber — an agricultural waste stream — into structural biocomposite panels that substitute for plywood and OSB in interior construction. Buys baled grass waste from regional producers, presses it with a bio-resin into code-testable panels, and sells to builders chasing embodied-carbon targets.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "contact",
    patentStatus: "provisional",
    disclosureRef: "USD-2024-087",
    stage: "done",
    onHold: false,
    route: "founder_match",
    published: false,
    outcome: "company_formed",
    outcomeNote: "Two-founder company formed with Priya Raman (Wildfire Network); Dr. Voss advising as contact.",
    updated: "1 month ago",
    inviteSent: true,
    interests: [
      {
        id: 1,
        founder: "Priya Raman",
        founderContext: "Wildfire Network member",
        when: "April",
        status: "connected",
      },
    ],
  },
  {
    id: 4,
    title: "Adaptive stroke-rehab glove",
    summary:
      "A sensor-laden glove that adapts its resistance to a stroke patient's recovery curve so rehab exercises stay hard enough to matter but never discouraging. Would rent the glove plus companion app to outpatient clinics, who bill it as supervised at-home therapy between visits.",
    university: UNIVERSITY,
    professor: "Dr. Miriam Hale",
    professorDept: "Biomedical Engineering",
    involvement: "contact",
    patentStatus: "not_filed",
    disclosureRef: "USD-2026-042",
    stage: "new",
    onHold: false,
    route: null,
    published: false,
    updated: "Yesterday",
    interests: [],
  },
  {
    id: 5,
    title: "Aquifer recharge forecasting model",
    summary:
      "An ML model that forecasts aquifer recharge rates from public weather and soil data, giving water districts a season-ahead view of groundwater supply. Ingests NOAA and USDA feeds, produces recharge forecasts per sub-basin, and sells the forecast as a subscription to irrigation districts and municipal water planners.",
    university: UNIVERSITY,
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "contact",
    patentStatus: "not_filed",
    stage: "routed",
    onHold: false,
    route: "hackathon",
    published: false,
    updated: "5 days ago",
    hackathonTracking: { event: null, pickedBy: null, built: null },
    interests: [],
  },
  {
    id: 6,
    title: "Cold-chain vaccine stability indicator",
    summary:
      "A penny-cost color-change label for vaccine vials that visibly darkens as cumulative cold-chain excursions accumulate — no scanner, no battery. Lets a clinic worker glance at a vial and know whether it is still good, replacing paper temperature logs. Would sell rolls of labels to vaccine distributors and NGOs.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "cofounder",
    patentStatus: "provisional",
    disclosureRef: "USD-2025-063",
    stage: "reviewing",
    onHold: true,
    holdNote: "Licensing questions still open with the tech-transfer office.",
    route: null,
    published: false,
    updated: "2 weeks ago",
    interests: [],
  },
  {
    id: 7,
    title: "Snow-load roof-failure early-warning sensor",
    summary:
      "A strain-gauge sensor network for flat commercial roofs that warns building owners before snow load reaches failure territory. Peel-and-stick gauges report roof deflection to a gateway; when load crosses an engineered threshold the owner gets an alert to clear the roof — hardware plus monitoring subscription.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    patentStatus: "provisional",
    disclosureRef: "USD-2025-072",
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    notes: "Published to Founder Match — waiting for a founder to pick it up.",
    interests: [],
  },
  {
    id: 8,
    title: "Microbial seed-coating biofertilizer",
    summary:
      "A nitrogen-fixing microbial coating applied to wheat seed before planting, cutting synthetic fertilizer input roughly a quarter in greenhouse trials. Licenses the microbe strain, contracts a seed treater to apply it, and sells treated seed through ag retailers — revenue per treated acre.",
    university: UNIVERSITY,
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "contact",
    patentStatus: "filed",
    disclosureRef: "USD-2024-095",
    stage: "in_motion",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "This morning",
    inviteSent: true,
    interests: [
      {
        id: 1,
        founder: "Dana Whitfield",
        founderContext: "Student founder · USD MBA program",
        when: "Yesterday",
        status: "connected",
      },
      {
        id: 2,
        founder: "Leo Tran",
        founderContext: "Wildfire Network member",
        when: "This morning",
        status: "new",
      },
    ],
  },
  {
    id: 9,
    title: "Wind-farm blade-icing predictor",
    summary:
      "Would forecast turbine blade-icing events from weather and vibration data so wind-farm operators can pre-heat or feather blades before ice throws them off balance.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    patentStatus: "not_filed",
    stage: "new",
    onHold: false,
    route: null,
    published: false,
    updated: "2 days ago",
    interests: [],
  },
  {
    id: 10,
    title: "Bio-derived road de-icer",
    summary:
      "Would turn sugar-beet processing byproduct into a road de-icer that is cheaper per lane-mile than brine additives and far less corrosive to bridges and vehicles.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "contact",
    patentStatus: "provisional",
    disclosureRef: "USD-2026-051",
    stage: "new",
    onHold: false,
    route: null,
    published: false,
    updated: "3 days ago",
    interests: [],
  },
  {
    id: 11,
    title: "Rural telehealth triage protocol",
    summary:
      "Would license a validated triage decision protocol to rural telehealth providers so nurse-line staff can route patients to the right level of care consistently.",
    university: UNIVERSITY,
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "cofounder",
    patentStatus: "not_filed",
    disclosureRef: "USD-2026-038",
    stage: "reviewing",
    onHold: false,
    route: null,
    published: false,
    updated: "4 days ago",
    interests: [],
  },
];

/* ── Other universities' published Founder-Match ideas ──────────────────────
   Founders browse published Founder-Match ideas ACROSS universities —
   university isolation applies to IP Managers, not to the marketplace.
   These live in the same shared idea state; the USD IP Manager's views
   filter them out by university. */

export const OTHER_UNI_MATCH_IDEAS: IpIdea[] = [
  {
    id: 101,
    title: "Encrypted telemetry for rural co-op grids",
    summary:
      "A drop-in encryption layer for the SCADA telemetry that rural electric co-ops still send in the clear. A small gateway box encrypts substation traffic without replacing legacy equipment, sold co-op by co-op with grant-funded pilots.",
    university: "Dakota State University",
    professor: "Dr. Renee Calloway",
    professorDept: "Cyber Operations",
    involvement: "contact",
    patentStatus: "provisional",
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    interests: [],
  },
  {
    id: 102,
    title: "Automated grain-bin atmosphere controller",
    summary:
      "A retrofit controller for on-farm grain bins that manages aeration automatically from in-bin sensors, cutting spoilage losses. Replaces manual fan-timer guesswork with closed-loop control, sold through farm-supply dealers as a retrofit kit.",
    university: "Dakota State University",
    professor: "Dr. Marcus Roy",
    professorDept: "Computer Science",
    involvement: "cofounder",
    patentStatus: "not_filed",
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "2 weeks ago",
    interests: [],
  },
  {
    id: 103,
    title: "Dairy methane-capture membrane",
    summary:
      "A selective membrane module that fits existing dairy lagoon covers and concentrates methane for on-farm use at herd sizes far below current digester economics. Turns a compliance headache into fuel for the milking parlor, sold as a leased module with a maintenance contract.",
    university: "University of Wisconsin–Madison",
    professor: "Dr. Elena Brandt",
    professorDept: "Chemical Engineering",
    involvement: "contact",
    patentStatus: "filed",
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "5 days ago",
    interests: [],
  },
  {
    id: 104,
    title: "Cheese-culture phage early-detection assay",
    summary:
      "A 30-minute benchtop assay that catches bacteriophage contamination in cheese starter cultures before a production vat is ruined. Replaces day-late plate tests with a same-shift answer, sold as consumable test kits to specialty and industrial cheesemakers.",
    university: "University of Wisconsin–Madison",
    professor: "Dr. Tom Okafor",
    professorDept: "Food Science",
    involvement: "contact",
    patentStatus: "provisional",
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    interests: [],
  },
];

export const ALL_SEED_IDEAS: IpIdea[] = [...SEED_IDEAS, ...OTHER_UNI_MATCH_IDEAS];

/* ── Wildfire Admin mock data ────────────────────────────────────────────────
   The admin provisions universities, sees volume, and manages who's attached
   (IP Managers, professors). */

export interface UniPerson {
  name: string;
  dept?: string;
  active: boolean;
}

export interface UniversityOrg {
  id: number;
  name: string;
  active: boolean;
  ipManagers: UniPerson[];
  professors: UniPerson[];
  ideas: { total: number; inMotion: number; done: number };
  provisioned: string;
}

export const UNIVERSITIES: UniversityOrg[] = [
  {
    id: 1,
    name: "University of South Dakota",
    active: true,
    ipManagers: [
      { name: "Kirby Nelson", active: true },
      { name: "Peter Ames", active: true },
    ],
    professors: USD_PROFESSORS.map((p) => ({ ...p, active: true })),
    ideas: { total: 11, inMotion: 2, done: 2 },
    provisioned: "May 2026",
  },
  {
    id: 2,
    name: "Dakota State University",
    active: true,
    ipManagers: [{ name: "Lena Ortiz", active: true }],
    professors: [
      { name: "Dr. Renee Calloway", dept: "Cyber Operations", active: true },
      { name: "Dr. Marcus Roy", dept: "Computer Science", active: true },
    ],
    ideas: { total: 5, inMotion: 1, done: 0 },
    provisioned: "June 2026",
  },
  {
    id: 3,
    name: "University of Wisconsin–Madison",
    active: true,
    ipManagers: [{ name: "Ashley Grant", active: true }],
    professors: [
      { name: "Dr. Elena Brandt", dept: "Chemical Engineering", active: true },
      { name: "Dr. Tom Okafor", dept: "Food Science", active: true },
      { name: "Dr. Ines Farrell", dept: "Biochemistry", active: true },
      { name: "Dr. Ravi Menon", dept: "Mechanical Engineering", active: true },
      { name: "Dr. Grace Liu", dept: "Computer Sciences", active: true },
      { name: "Dr. Noah Petersen", dept: "Agronomy", active: false },
    ],
    ideas: { total: 12, inMotion: 3, done: 2 },
    provisioned: "June 2026",
  },
];
