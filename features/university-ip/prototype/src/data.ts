/* Mock data for the University IP validation prototype.
   Client-state only — nothing persists. IP Manager view is scoped to ONE
   university (tenancy: the IP Manager sees only their own university's IP);
   the Wildfire Admin view sees all universities. */

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
  outcome: string | null;
}

export interface MatchTracking {
  matchedFounder: string | null;
  matchStatus: "Searching" | "Intro made" | "Matched — running" | "Matched — stalled";
  note: string;
}

export interface IpIdea {
  id: number;
  title: string;
  summary: string;
  professor: string;
  professorDept: string;
  involvement: Involvement;
  state: PublishState;
  route: Route | null; // null = not routed yet (default private/unrouted); "hold" = explicit Hold disposition (gate-2)
  addedVia: "spreadsheet" | "individual";
  inviteSent?: boolean; // gate-2: IP Manager created the professor's profile/account + sent the invite (Professor + linked-IP-idea tag)
  founderTracking?: FounderTracking;
  hackathonTracking?: HackathonTracking;
  matchTracking?: MatchTracking;
}

export const UNIVERSITY = "University of South Dakota";
export const IP_MANAGER = "Kirby Nelson";

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
    professor: "Dr. Miriam Hale",
    professorDept: "Biomedical Engineering",
    involvement: "cofounder",
    state: "published",
    route: "founder",
    addedVia: "spreadsheet",
    inviteSent: true,
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
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    state: "published",
    route: "hackathon",
    addedVia: "spreadsheet",
    hackathonTracking: {
      event: "Fall Builders Jam 2026",
      pickedBy: "Team AgriSense",
      built: "Working sensor + field-map dashboard prototype",
      outcome: "2nd place — team applying to Wildfire Labs",
    },
  },
  {
    id: 3,
    title: "Prairie-grass biocomposite panels",
    summary:
      "Structural panels from prairie-grass fiber waste streams. Professor has no bandwidth to commercialize.",
    professor: "Dr. Anna Voss",
    professorDept: "Materials Science",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "individual",
    matchTracking: {
      matchedFounder: "Priya Raman (Wildfire Network)",
      matchStatus: "Matched — running",
      note: "Company formed; Dr. Voss advising as contact-only. Customer Discovery underway.",
    },
  },
  {
    id: 4,
    title: "Adaptive stroke-rehab glove",
    summary:
      "Sensor glove with adaptive resistance for at-home stroke rehabilitation exercises.",
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
      outcome: null,
    },
  },
  {
    id: 6,
    title: "Cold-chain vaccine stability indicator",
    summary:
      "Color-change label indicating cumulative cold-chain excursions for vaccine vials. Licensing questions still open with the tech-transfer office.",
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
    professor: "Dr. Owen Pruitt",
    professorDept: "Electrical Engineering",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "spreadsheet",
    matchTracking: {
      matchedFounder: null,
      matchStatus: "Searching",
      note: "Published to Founder Match — waiting for a founder to pick it up.",
    },
  },
  {
    id: 8,
    title: "Microbial seed-coating biofertilizer",
    summary:
      "Nitrogen-fixing microbial seed coating reducing fertilizer input on wheat; greenhouse trials complete.",
    professor: "Dr. Sam Littlefeather",
    professorDept: "Earth Sciences",
    involvement: "contact",
    state: "published",
    route: "founder_match",
    addedVia: "individual",
    matchTracking: {
      matchedFounder: null,
      matchStatus: "Intro made",
      note: "Two interested founders; intro call held with one.",
    },
  },
];

/* ── Wildfire Admin mock data (gate-2, promoted from REC-2) ─────────────────
   The admin manages what universities are in the system, what's going through
   them (pipeline/volume), and who's attached to them (IP Managers, professors). */

export interface UniversityOrg {
  id: number;
  name: string;
  ipManagers: string[];
  professors: number; // professor-founders with the university-IP-origin tag
  ideas: { total: number; founder: number; hackathon: number; founderMatch: number; hold: number; unrouted: number; published: number };
  provisioned: string; // when the org was set up
}

export const UNIVERSITIES: UniversityOrg[] = [
  {
    id: 1,
    name: "University of South Dakota",
    ipManagers: ["Kirby Nelson", "Peter Ames"],
    professors: 4,
    ideas: { total: 8, founder: 1, hackathon: 2, founderMatch: 3, hold: 1, unrouted: 1, published: 5 },
    provisioned: "May 2026",
  },
  {
    id: 2,
    name: "Dakota State University",
    ipManagers: ["Lena Ortiz"],
    professors: 2,
    ideas: { total: 5, founder: 1, hackathon: 1, founderMatch: 1, hold: 1, unrouted: 1, published: 2 },
    provisioned: "June 2026",
  },
  {
    id: 3,
    name: "University of Wisconsin–Madison",
    ipManagers: ["Ashley Grant"],
    professors: 6,
    ideas: { total: 12, founder: 2, hackathon: 3, founderMatch: 4, hold: 2, unrouted: 1, published: 8 },
    provisioned: "June 2026",
  },
];
