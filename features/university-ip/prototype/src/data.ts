/* Mock data for the University IP validation prototype.
   Client-state only — nothing persists. IP Manager view is scoped to ONE
   university (tenancy: the IP Manager sees only their own university's IP);
   the Wildfire Admin view sees all universities. Gate-3: the founder-facing
   Founder-Match list spans universities (isolation applies to IP Managers,
   not founders), so extra published Founder-Match ideas from OTHER
   universities are seeded for the founder browse view only. */

export type Route = "founder" | "hackathon" | "founder_match" | "hold";
export type Involvement = "cofounder" | "contact";
export type PublishState = "private" | "published";

/* Founder-route tracking mirrors the live app's founder-tracking framework:
   src/services/founderAnalyticsService.ts → FounderProgress
   { currentPhase, lessonsCompleted/totalLessons, aiFeedbackCount, documentsRevised }
   rendered like the Founders card in src/pages/AdminAnalyticsDashboard.tsx. */
export const PHASE_ORDER = ["Customer Discovery", "Build", "Go-to-Market 1", "Go-to-Market 2"] as const;

export interface FounderTracking {
  currentPhase: (typeof PHASE_ORDER)[number];
  lessonsCompleted: number;
  totalLessons: number;
  aiFeedbackCount: number;
  documentsRevised: number;
  companyName: string;
  coFounder?: string;
}

export interface HackathonTracking {
  event: string;
  pickedBy: string | null; // team that picked the idea
  built: string | null; // what was built at the hackathon
}

/* Gate-4 (2026-07-02): the Founder-Match status is MOVED THROUGH ITS STAGES by
   the IP Manager from the idea's IP profile. The stage vocabulary is the one
   this prototype already modeled — reused, not invented. */
export const MATCH_STAGES = ["Searching", "Intro made", "Matched — running", "Matched — stalled"] as const;
export type MatchStatus = (typeof MATCH_STAGES)[number];

export interface MatchTracking {
  matchedFounder: string | null;
  matchStatus: MatchStatus;
}

export interface IpIdea {
  id: number;
  title: string;
  summary: string;
  /* Gate-3: clicking a company/idea in the IP Portfolio shows a description
     of the company and what it does — the "About this company / what it does"
     section on the detail view. */
  about: string;
  university: string;
  professor: string;
  professorDept: string;
  involvement: Involvement;
  state: PublishState;
  route: Route | null; // null = not routed yet (default private/unrouted); "hold" = explicit Hold disposition (gate-2)
  addedVia: "spreadsheet" | "individual";
  inviteSent?: boolean; // gate-2: IP Manager created the professor's profile/account + sent the invite (Professor + linked-IP-idea tag)
  /* Gate-4 (2026-07-02): the IP Manager WRITES tracking notes and RECORDS the
     outcome from the idea's IP profile (the detail view, alongside "About this
     company"); the tracking dashboard reflects these same fields — one shared
     record, not duplicated mock data. Client-state only. */
  notes?: string; // IP Manager's tracking notes, written/edited on the IP profile
  outcome?: string; // outcome recorded/updated on the IP profile
  founderTracking?: FounderTracking;
  hackathonTracking?: HackathonTracking;
  matchTracking?: MatchTracking;
}

export const UNIVERSITY = "University of South Dakota";
export const IP_MANAGER = "Kirby Nelson";
export const FOUNDER_NAME = "Marcus Webb";

export const ROUTE_LABEL: Record<Route, string> = {
  founder: "Founder",
  hackathon: "Hackathon",
  founder_match: "Founder Match",
  hold: "Hold (private)",
};

export const SEED_IDEAS: IpIdea[] = [
  {
    id: 1,
    title: "Cardiac tissue preservation compound",
    summary:
      "A compound extending viable heart-tissue preservation windows for transplant logistics. Summarized from Dr. Hale's lab research.",
    about:
      "HaleCardio is building a preservation compound that extends how long donor heart tissue stays viable in transit, widening the transplant matching window from hours to days. The company sells to organ-procurement organizations and transplant centers, starting with a perfusion-additive product that drops into existing cold-chain logistics.",
    university: UNIVERSITY,
    professor: "Dr. Miriam Hale",
    professorDept: "Biomedical Engineering",
    involvement: "cofounder",
    state: "published",
    route: "founder",
    addedVia: "spreadsheet",
    inviteSent: true,
    notes: "Dr. Hale and Jess pairing well — Build phase on pace after a slow start.",
    founderTracking: {
      currentPhase: "Build",
      lessonsCompleted: 14,
      totalLessons: 32,
      aiFeedbackCount: 41,
      documentsRevised: 6,
      companyName: "HaleCardio",
      coFounder: "Jess Munoz (via Founder Match)",
    },
  },
  {
    id: 2,
    title: "Low-cost soil nitrate sensor",
    summary:
      "Printed-electronics nitrate sensor for row-crop agriculture; an afternoon-buildable demo unit exists.",
    about:
      "A printed-electronics soil sensor that gives row-crop farmers real-time nitrate readings for a few dollars per unit instead of lab-test turnaround times. What it does: farmers stake disposable sensors through the field, readings feed a dashboard, and fertilizer application gets dialed to what the soil actually needs — cutting input cost and runoff.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    state: "published",
    route: "hackathon",
    addedVia: "spreadsheet",
    outcome: "2nd place — team applying to Wildfire Labs",
    hackathonTracking: {
      event: "Fall Builders Jam 2026",
      pickedBy: "Team AgriSense",
      built: "Working sensor + field-map dashboard prototype",
    },
  },
  {
    id: 3,
    title: "Prairie-grass biocomposite panels",
    summary:
      "Structural panels from prairie-grass fiber waste streams. Professor has no bandwidth to commercialize.",
    about:
      "The company turns prairie-grass fiber — an agricultural waste stream — into structural biocomposite panels that substitute for plywood and OSB in interior construction. What it does: buys baled grass waste from regional producers, presses it with a bio-resin into code-testable panels, and sells to regional builders chasing embodied-carbon targets.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "individual",
    notes: "Company formed; Dr. Voss advising as contact-only. Customer Discovery underway.",
    outcome: "Matched — two-founder company formed with Priya Raman.",
    matchTracking: {
      matchedFounder: "Priya Raman (Wildfire Network)",
      matchStatus: "Matched — running",
    },
  },
  {
    id: 4,
    title: "Adaptive stroke-rehab glove",
    summary:
      "Sensor glove with adaptive resistance for at-home stroke rehabilitation exercises.",
    about:
      "A sensor-laden glove that adapts its resistance to a stroke patient's recovery curve so rehab exercises stay hard enough to matter but never discouraging. What it would do as a company: rent the glove plus companion app to outpatient clinics, who bill it as supervised at-home therapy between visits.",
    university: UNIVERSITY,
    professor: "Dr. Miriam Hale",
    professorDept: "Biomedical Engineering",
    involvement: "contact",
    state: "private",
    route: null,
    addedVia: "spreadsheet",
  },
  {
    id: 5,
    title: "Aquifer recharge forecasting model",
    summary:
      "ML model forecasting aquifer recharge from weather + soil data; strong hackathon dataset candidate.",
    about:
      "An ML model that forecasts aquifer recharge rates from public weather and soil data, giving water districts a season-ahead view of groundwater supply. What it does: ingests NOAA + USDA feeds, produces recharge forecasts per sub-basin, and sells the forecast as a subscription to irrigation districts and municipal water planners.",
    university: UNIVERSITY,
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "contact",
    state: "private",
    route: "hackathon",
    addedVia: "individual",
    hackathonTracking: {
      event: "— (not yet published to an event)",
      pickedBy: null,
      built: null,
    },
  },
  {
    id: 6,
    title: "Cold-chain vaccine stability indicator",
    summary:
      "Color-change label indicating cumulative cold-chain excursions for vaccine vials. Licensing questions still open with the tech-transfer office.",
    about:
      "A penny-cost color-change label for vaccine vials that visibly darkens as cumulative cold-chain excursions accumulate — no scanner, no battery. What it does: lets a clinic worker glance at a vial and know whether it is still good, replacing paper temperature logs. The company would sell rolls of labels to vaccine distributors and NGOs.",
    university: UNIVERSITY,
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "cofounder",
    state: "private",
    route: "hold",
    addedVia: "spreadsheet",
  },
  {
    id: 7,
    title: "Snow-load roof-failure early-warning sensor",
    summary:
      "Cheap strain-gauge network warning of dangerous snow loads on flat commercial roofs; validated on two campus buildings.",
    about:
      "A strain-gauge sensor network for flat commercial roofs that warns building owners before snow load reaches failure territory. What it does: peel-and-stick gauges report roof deflection to a gateway; when load crosses an engineered threshold the owner gets an alert to clear the roof — sold as hardware plus monitoring subscription to warehouses, schools, and big-box retail.",
    university: UNIVERSITY,
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "spreadsheet",
    notes: "Published to Founder Match — waiting for a founder to pick it up.",
    matchTracking: {
      matchedFounder: null,
      matchStatus: "Searching",
    },
  },
  {
    id: 8,
    title: "Microbial seed-coating biofertilizer",
    summary:
      "Nitrogen-fixing microbial seed coating reducing fertilizer input on wheat; greenhouse trials complete.",
    about:
      "A nitrogen-fixing microbial coating applied to wheat seed before planting, cutting synthetic fertilizer input roughly a quarter in greenhouse trials. What it does: the company licenses the microbe strain, contracts a seed treater to apply it, and sells treated seed through ag retailers — revenue per treated acre.",
    university: UNIVERSITY,
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "individual",
    notes: "Two interested founders; intro call held with one.",
    matchTracking: {
      matchedFounder: null,
      matchStatus: "Intro made",
    },
  },
];

/* ── Other universities' published Founder-Match ideas (gate-3) ─────────────
   Founders see published Founder-Match ideas ACROSS universities and can
   filter per university — university isolation applies to IP Managers, not
   the founder-facing match list. These appear ONLY in the founder browse
   view; the USD IP Manager never sees them. */

export const OTHER_UNI_MATCH_IDEAS: IpIdea[] = [
  {
    id: 101,
    title: "Encrypted telemetry for rural co-op grids",
    summary:
      "Lightweight encryption layer for SCADA telemetry on rural electric co-op grids; pilot-ready reference implementation.",
    about:
      "A drop-in encryption layer for the SCADA telemetry that rural electric co-ops still send in the clear. What it does: a small gateway box encrypts substation traffic without replacing legacy equipment, sold co-op by co-op with grant-funded pilots.",
    university: "Dakota State University",
    professor: "Dr. Renee Calloway",
    professorDept: "Cyber Operations",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "spreadsheet",
    notes: "Published to Founder Match.",
    matchTracking: { matchedFounder: null, matchStatus: "Searching" },
  },
  {
    id: 102,
    title: "Automated grain-bin atmosphere controller",
    summary:
      "Controller that manages temperature/humidity in grain bins to cut spoilage; validated on two test bins.",
    about:
      "A retrofit controller for on-farm grain bins that manages aeration automatically from in-bin sensors, cutting spoilage losses. What it does: replaces the manual fan-timer guesswork with closed-loop control, sold through farm-supply dealers as a retrofit kit.",
    university: "Dakota State University",
    professor: "Dr. Marcus Roy",
    professorDept: "Computer Science",
    involvement: "cofounder",
    state: "published",
    route: "founder_match",
    addedVia: "individual",
    notes: "Published to Founder Match.",
    matchTracking: { matchedFounder: null, matchStatus: "Searching" },
  },
  {
    id: 103,
    title: "Dairy methane-capture membrane",
    summary:
      "Selective membrane capturing methane off dairy lagoon covers at small-farm scale.",
    about:
      "A selective membrane module that fits existing dairy lagoon covers and concentrates methane for on-farm use at herd sizes far below current digester economics. What it does: turns a compliance headache into fuel for the milking parlor, sold as a leased module with a maintenance contract.",
    university: "University of Wisconsin–Madison",
    professor: "Dr. Elena Brandt",
    professorDept: "Chemical Engineering",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "spreadsheet",
    notes: "Published to Founder Match.",
    matchTracking: { matchedFounder: null, matchStatus: "Searching" },
  },
  {
    id: 104,
    title: "Cheese-culture phage early-detection assay",
    summary:
      "Rapid assay detecting bacteriophage contamination in cheese cultures before a vat is lost.",
    about:
      "A 30-minute benchtop assay that catches bacteriophage contamination in cheese starter cultures before a production vat is ruined. What it does: replaces day-late plate tests with a same-shift answer, sold as consumable test kits to specialty and industrial cheesemakers.",
    university: "University of Wisconsin–Madison",
    professor: "Dr. Tom Okafor",
    professorDept: "Food Science",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "spreadsheet",
    notes: "Published to Founder Match.",
    matchTracking: { matchedFounder: null, matchStatus: "Searching" },
  },
];

/* ── Founder-interest notifications (gate-3) ────────────────────────────────
   When a founder expresses interest in a Founder-Match idea, the idea's IP
   Manager is NOTIFIED so they can start making connections with that founder
   and get them connected to the professor. Client-state only. */

export interface InterestNotification {
  id: number;
  ideaId: number;
  ideaTitle: string;
  university: string;
  founder: string;
  founderContext: string;
  professor: string;
  when: string;
  status: "new" | "connected";
}

export const SEED_INTERESTS: InterestNotification[] = [
  {
    id: 1,
    ideaId: 8,
    ideaTitle: "Microbial seed-coating biofertilizer",
    university: UNIVERSITY,
    founder: "Dana Whitfield",
    founderContext: "Student founder · USD MBA program",
    professor: "Dr. Sam Littlefeather",
    when: "Yesterday",
    status: "connected",
  },
  {
    id: 2,
    ideaId: 8,
    ideaTitle: "Microbial seed-coating biofertilizer",
    university: UNIVERSITY,
    founder: "Leo Tran",
    founderContext: "Wildfire Network member",
    professor: "Dr. Sam Littlefeather",
    when: "This morning",
    status: "new",
  },
];

/* ── Wildfire Admin mock data (gate-2, promoted from REC-2; gate-3 adds
   management mechanics + drill-down) ─────────────────────────────────────
   The admin manages what universities are in the system, what's going through
   them (pipeline/volume), and who's attached to them (IP Managers,
   professors). Gate-3: edit/remove a university, reassign an IP Manager,
   deactivate a university and/or people, and a clickable per-university
   drill-down showing which professors are tied to which university. */

export interface UniPerson {
  name: string;
  dept?: string;
  active: boolean;
}

export interface UniversityOrg {
  id: number;
  name: string;
  active: boolean; // gate-3: a university can be deactivated
  ipManagers: UniPerson[];
  professors: UniPerson[]; // gate-3: which professors are tied to which university
  ideas: { total: number; founder: number; hackathon: number; founderMatch: number; hold: number; unrouted: number; published: number };
  provisioned: string; // when the org was set up
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
    professors: [
      { name: "Dr. Miriam Hale", dept: "Biomedical Engineering", active: true },
      { name: "Dr. Owen Pruitt", dept: "Electrical Engineering", active: true },
      { name: "Dr. Anna Voss", dept: "Materials Science", active: true },
      { name: "Dr. Sam Littlefeather", dept: "Earth Sciences", active: true },
    ],
    ideas: { total: 8, founder: 1, hackathon: 2, founderMatch: 3, hold: 1, unrouted: 1, published: 5 },
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
    ideas: { total: 5, founder: 1, hackathon: 1, founderMatch: 1, hold: 1, unrouted: 1, published: 2 },
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
    ideas: { total: 12, founder: 2, hackathon: 3, founderMatch: 4, hold: 2, unrouted: 1, published: 8 },
    provisioned: "June 2026",
  },
];
