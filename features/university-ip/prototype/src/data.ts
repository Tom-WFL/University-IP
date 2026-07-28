/* Mock data for the University IP prototype (v6 disclosure model).
   Client-state only — nothing persists.

   v6 reworks intake around the real USD Invention Disclosure Form. An idea now
   carries a structured `disclosure` record (imported from the form) plus a
   Kirby-authored `nonConfidentialSummary`. Confidentiality is TWO-TIER:

     NON-confidential  (safe for founders / marketplace / public):
       title, nonConfidentialSummary, inventionStage, involvement,
       route availability
     CONFIDENTIAL      (Kirby / TTO only — never rendered to professors or
       founders): the whole `disclosure` record — briefSummary, advantages,
       limitations, applications, funding, dates, inventors' personal info,
       public-disclosure history, companies of interest, data/materials.

   Lifecycle per idea:

     stage:   new → reviewing → routed → in_motion → finalize
     onHold:  a PAUSE flag that can sit on any pre-finalize stage (not a route)
     route:   set at "routed" (founder | hackathon | founder_match | i_corps)
     milestone: a route-appropriate positive marker reached in motion
       (company formed / matched / built at hackathon / I-Corps cohort)
     outcome: the TRUE terminal, set at "finalize" — licensed (success) or
       abandoned. "Passed" folds into abandoned.
     published: meaningful when route = founder_match — listed on the
       founder-facing marketplace
     interests: founder-interest records attached to the idea itself
     mentors:   mentors Kirby invited/attached (recorded as notes)
     icorps:    an I-Corps application recorded after a founder picks the idea up

   Tenancy: the IP Manager sees only their own university's ideas; the
   founder-facing marketplace spans universities. */

export type Stage = "new" | "reviewing" | "routed" | "in_motion" | "finalize";
export type RouteKind = "founder" | "hackathon" | "founder_match" | "i_corps";
/* Positive, route-appropriate milestone reached while in motion. */
export type MilestoneKind = "company_formed" | "matched" | "built_at_hackathon" | "icorps_cohort";
/* The true terminal outcomes a tech-transfer office resolves to. */
export type OutcomeKind = "licensed" | "abandoned";
export type Involvement = "cofounder" | "contact";
export type PatentStatus = "not_filed" | "provisional" | "filed" | "granted";
export type InterestStatus = "new" | "connected" | "declined";

export const STAGES: Stage[] = ["new", "reviewing", "routed", "in_motion", "finalize"];

export const STAGE_LABEL: Record<Stage, string> = {
  new: "New",
  reviewing: "Reviewing",
  routed: "Routed",
  in_motion: "In motion",
  finalize: "License / finalize",
};

export const ROUTE_LABEL: Record<RouteKind, string> = {
  founder: "Founder",
  hackathon: "Hackathon",
  founder_match: "Founder Match",
  i_corps: "I-Corps",
};

export const MILESTONE_LABEL: Record<MilestoneKind, string> = {
  company_formed: "Company formed",
  matched: "Founder matched",
  built_at_hackathon: "Built at hackathon",
  icorps_cohort: "In I-Corps cohort",
};

export const OUTCOME_LABEL: Record<OutcomeKind, string> = {
  licensed: "Licensed",
  abandoned: "Abandoned",
};

export const PATENT_LABEL: Record<PatentStatus, string> = {
  not_filed: "Not filed",
  provisional: "Provisional",
  filed: "Filed",
  granted: "Granted",
};

/* ── Disclosure form field vocabularies (from the real USD form) ─────────── */

export type InventionStage =
  | "concept_only"
  | "discussion"
  | "seeking_funding"
  | "prototype"
  | "experimental_data";

export const INVENTION_STAGE_LABEL: Record<InventionStage, string> = {
  concept_only: "Concept only",
  discussion: "Discussion with others",
  seeking_funding: "Seeking funding",
  prototype: "Prototype",
  experimental_data: "Experimental data",
};
export const INVENTION_STAGE_ORDER: InventionStage[] = [
  "concept_only", "discussion", "seeking_funding", "prototype", "experimental_data",
];

export type FundingSourceType = "federal" | "state" | "industry" | "foundation" | "internal" | "none";
export const FUNDING_SOURCE_LABEL: Record<FundingSourceType, string> = {
  federal: "Federal",
  state: "State",
  industry: "Industry / sponsored",
  foundation: "Foundation / nonprofit",
  internal: "University internal",
  none: "No external funding",
};

export type DataMaterialKey = "mta" | "bio" | "crada" | "cda_nda" | "other";
export const DATA_MATERIAL_LABEL: Record<DataMaterialKey, string> = {
  mta: "MTA",
  bio: "Biological materials",
  crada: "CRADA / SBIR / STTR",
  cda_nda: "CDA / NDA",
  other: "Others",
};
export const DATA_MATERIAL_ORDER: DataMaterialKey[] = ["mta", "bio", "crada", "cda_nda", "other"];

export interface FundingEntry {
  sourceType: FundingSourceType;
  sponsorName: string;
  awardNumber: string;
}

export interface Inventor {
  name: string;
  title: string;
  department: string;
  inventorshipPct: number;
  email: string;
}

/* The structured record imported from the USD Invention Disclosure Form.
   EVERYTHING in here is CONFIDENTIAL except where surfaced explicitly. */
export interface Disclosure {
  /* Office / meta */
  techNumber: string; // USD Technology Number (office-assigned)
  dateOfDisclosure: string;
  /* Stages / dates */
  dateOfConception: string;
  dateOfReductionToPractice: string;
  writtenRecordExists: boolean;
  inventionStage: InventionStage[];
  /* Funding — up to 5 entities (Bayh-Dole / federal relevance) */
  funding: FundingEntry[];
  /* Section 4 — confidential scientific abstract */
  briefSummary: string;
  /* Invention details (confidential) */
  advantages: string; // over state-of-the-art
  limitations: string;
  applications: string; // practical / commercial
  /* Companies / contacts the inventor thinks would want it */
  companiesOfInterest: string;
  /* Public-disclosure history (confidential) — inadvertent-disclosure risk */
  disclosedExternally: boolean;
  disclosedExternallyDetails: string;
  plannedDisclosure: boolean;
  plannedDisclosureDetails: string;
  /* Data & materials in play */
  dataMaterials: DataMaterialKey[];
  /* Inventors — up to 5. Multi-inventor is real. */
  inventors: Inventor[];
}

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

/* A mentor Kirby invited and attached to an idea — recorded as a note.
   Mock only: no real email is sent. */
export interface Mentor {
  id: number;
  name: string;
  email: string;
  invitedWhen: string;
}

/* An I-Corps application recorded once a founder picks up the idea. */
export interface ICorpsApplication {
  applied: boolean;
  when: string;
  note?: string;
}

export interface IpIdea {
  id: number;
  title: string; // NON-confidential (the form states so)
  /* Kirby-authored public gist — the only thing founders/marketplace see as
     a description. Required before publishing to founders. NON-confidential. */
  nonConfidentialSummary: string;
  university: string;
  /* The lead inventor's involvement, day-to-day co-founder vs contact only.
     Kept per-idea, consistent with the prior single-professor model. */
  involvement: Involvement;
  patentStatus: PatentStatus;
  /* CONFIDENTIAL structured disclosure record imported from the USD form. */
  disclosure: Disclosure;
  stage: Stage;
  onHold: boolean; // pause flag — not a stage, not a route
  holdNote?: string;
  route: RouteKind | null; // set when stage reaches "routed"
  published: boolean; // meaningful when route = founder_match: listed on the marketplace
  milestone?: MilestoneKind; // positive marker reached in motion
  outcome?: OutcomeKind; // TRUE terminal — set when stage = finalize (licensed | abandoned)
  outcomeNote?: string;
  updated: string; // last activity, human-readable (mock)
  notes?: string; // IP Manager's working notes
  inviteSent?: boolean; // lead inventor profile created + invite sent
  founderTracking?: FounderTracking;
  hackathonTracking?: HackathonTracking;
  interests: FounderInterest[];
  mentors: Mentor[];
  icorps?: ICorpsApplication;
}

/* Convenience accessors — the lead inventor stands in for the old single
   `professor` field across views. */
export const leadInventor = (i: IpIdea): Inventor =>
  i.disclosure.inventors[0] ?? { name: "—", title: "", department: "—", inventorshipPct: 100, email: "" };
export const leadInventorName = (i: IpIdea): string => leadInventor(i).name;
export const leadInventorDept = (i: IpIdea): string => leadInventor(i).department;

export const UNIVERSITY = "University of South Dakota";
export const IP_MANAGER = "Kirby Fuglsby";
export const FOUNDER_NAME = "Marcus Webb";
export const PROFESSOR_PERSONA = "Dr. Miriam Hale";
export const ADMIN_NAME = "Alex Rivera";

/* The university's people directory — used to autofill inventor department. */
export const USD_PROFESSORS: { name: string; dept: string }[] = [
  { name: "Dr. Miriam Hale", dept: "Biomedical Engineering" },
  { name: "Dr. Owen Pruitt", dept: "Electrical Engineering" },
  { name: "Dr. Anna Voss", dept: "Materials Science" },
  { name: "Dr. Sam Littlefeather", dept: "Earth Sciences" },
];

/* ── Disclosure builders — keep the seed readable ────────────────────────── */

function mkInventor(
  name: string, title: string, department: string, inventorshipPct: number, email: string
): Inventor {
  return { name, title, department, inventorshipPct, email };
}

function mkDisclosure(d: Partial<Disclosure> & Pick<Disclosure, "techNumber" | "briefSummary" | "inventors">): Disclosure {
  return {
    dateOfDisclosure: "—",
    dateOfConception: "—",
    dateOfReductionToPractice: "—",
    writtenRecordExists: true,
    inventionStage: ["prototype"],
    funding: [],
    advantages: "",
    limitations: "",
    applications: "",
    companiesOfInterest: "",
    disclosedExternally: false,
    disclosedExternallyDetails: "",
    plannedDisclosure: false,
    plannedDisclosureDetails: "",
    dataMaterials: [],
    ...d,
  };
}

/* The sample record the mock "Import disclosure form (PDF)" auto-fills. Kirby
   can edit every field before submitting. */
export const SAMPLE_IMPORTED_DISCLOSURE: Disclosure = mkDisclosure({
  techNumber: "USD-2026-058",
  dateOfDisclosure: "Jul 24, 2026",
  dateOfConception: "Nov 2025",
  dateOfReductionToPractice: "May 2026",
  writtenRecordExists: true,
  inventionStage: ["prototype", "experimental_data"],
  funding: [
    { sourceType: "federal", sponsorName: "National Science Foundation", awardNumber: "NSF-2249871" },
    { sourceType: "state", sponsorName: "South Dakota Board of Regents", awardNumber: "SDBOR-CRP-118" },
  ],
  briefSummary:
    "A microfluidic assay chip that concentrates and reads low-abundance protein biomarkers from a single drop of whole blood in under fifteen minutes, using a novel electrokinetic pre-concentration stage that raises effective sensitivity roughly two orders of magnitude over lateral-flow formats.",
  advantages:
    "Two-orders-of-magnitude sensitivity gain over lateral-flow; no benchtop instrument; single-drop sample; results in <15 minutes at the point of care.",
  limitations:
    "Current prototype validated on three biomarkers only; chip fabrication yield is ~70% and needs a production partner; shelf-life of the reagent layer not yet established.",
  applications:
    "Point-of-care screening in rural clinics; sepsis and cardiac triage in emergency settings; decentralized clinical-trial sample collection.",
  companiesOfInterest:
    "Abbott Point of Care, Cepheid, a regional reference-lab network the inventor has spoken with informally.",
  disclosedExternally: true,
  disclosedExternallyDetails:
    "Abstract accepted to a March 2026 regional biosensors symposium (poster only, no enabling detail); a figure appeared in an internal NSF progress report.",
  plannedDisclosure: true,
  plannedDisclosureDetails:
    "Manuscript targeted for submission to a journal in Sept 2026 — file before then.",
  dataMaterials: ["mta", "bio", "crada"],
  inventors: [
    mkInventor("Dr. Priya Anand", "Associate Professor", "Biomedical Engineering", 60, "priya.anand@usd.edu"),
    mkInventor("Dr. Owen Pruitt", "Professor", "Electrical Engineering", 25, "owen.pruitt@usd.edu"),
    mkInventor("Maya Fielding", "PhD Candidate", "Biomedical Engineering", 15, "maya.fielding@coyotes.usd.edu"),
  ],
});

export const SEED_IDEAS: IpIdea[] = [
  {
    id: 1,
    title: "Cardiac tissue preservation compound",
    nonConfidentialSummary:
      "A preservation compound that extends how long donor heart tissue stays viable in transit, widening the transplant matching window. Sells to organ-procurement organizations and transplant centers as a perfusion additive that drops into existing cold-chain logistics.",
    university: UNIVERSITY,
    involvement: "cofounder",
    patentStatus: "filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2025-014",
      dateOfDisclosure: "Feb 3, 2025",
      dateOfConception: "Jun 2024",
      dateOfReductionToPractice: "Dec 2024",
      writtenRecordExists: true,
      inventionStage: ["prototype", "experimental_data"],
      funding: [
        { sourceType: "federal", sponsorName: "NIH / NHLBI", awardNumber: "R01-HL-155213" },
      ],
      briefSummary:
        "A trehalose-derivative perfusion additive that suppresses ischemia-driven mitochondrial damage in explanted myocardium, extending cold-ischemia viability from ~6 hours to ~48 hours in porcine models.",
      advantages: "8x viability window vs standard cold storage; drop-in with existing perfusion rigs.",
      limitations: "Large-animal data only; human tissue validation and FDA pathway still ahead.",
      applications: "Heart transplant logistics; broader solid-organ preservation.",
      companiesOfInterest: "TransMedics, regional organ-procurement organizations.",
      disclosedExternally: false,
      plannedDisclosure: true,
      plannedDisclosureDetails: "Conference abstract under embargo until patent conversion.",
      dataMaterials: ["bio", "mta"],
      inventors: [
        mkInventor("Dr. Miriam Hale", "Associate Professor", "Biomedical Engineering", 70, "miriam.hale@usd.edu"),
        mkInventor("Dr. Raj Patel", "Research Scientist", "Biomedical Engineering", 30, "raj.patel@usd.edu"),
      ],
    }),
    stage: "in_motion",
    onHold: false,
    route: "founder",
    published: false,
    milestone: "company_formed",
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
    mentors: [
      { id: 1, name: "Dr. Ellen Marsh", email: "ellen.marsh@medtechadvisors.com", invitedWhen: "2 weeks ago" },
    ],
  },
  {
    id: 2,
    title: "Low-cost soil nitrate sensor",
    nonConfidentialSummary:
      "A printed-electronics soil sensor that gives row-crop farmers real-time nitrate readings for a few dollars per unit instead of lab-test turnaround. Disposable sensors feed a dashboard, and fertilizer gets dialed to what the soil actually needs.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2025-021",
      dateOfDisclosure: "Apr 12, 2025",
      dateOfConception: "Jan 2025",
      dateOfReductionToPractice: "Mar 2025",
      writtenRecordExists: true,
      inventionStage: ["prototype"],
      funding: [{ sourceType: "state", sponsorName: "SD Corn Utilization Council", awardNumber: "SDCUC-24-07" }],
      briefSummary:
        "A screen-printed ion-selective electrode on a low-cost polymer substrate that reports soil nitrate concentration wirelessly, calibrated for the ionic-strength range of regional soils.",
      advantages: "~$3/unit vs $30+ lab test per sample; real-time vs days of turnaround.",
      limitations: "Drift over a full season not characterized; needs soil-type calibration tables.",
      applications: "Precision fertilizer management for row crops.",
      companiesOfInterest: "Regional ag-retail cooperatives.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: [],
      inventors: [
        mkInventor("Dr. Owen Pruitt", "Professor", "Electrical Engineering", 100, "owen.pruitt@usd.edu"),
      ],
    }),
    stage: "in_motion",
    onHold: false,
    route: "hackathon",
    published: false,
    milestone: "built_at_hackathon",
    updated: "3 weeks ago",
    notes: "2nd place at Fall Builders Jam 2026 — Team AgriSense is applying to Wildfire Labs.",
    inviteSent: true,
    hackathonTracking: {
      event: "Fall Builders Jam 2026",
      pickedBy: "Team AgriSense",
      built: "Working sensor + field-map dashboard prototype",
    },
    interests: [],
    mentors: [],
  },
  {
    id: 3,
    title: "Prairie-grass biocomposite panels",
    nonConfidentialSummary:
      "Turns prairie-grass fiber — an agricultural waste stream — into structural biocomposite panels that substitute for plywood and OSB in interior construction. Sells to builders chasing embodied-carbon targets.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "granted",
    disclosure: mkDisclosure({
      techNumber: "USD-2024-087",
      dateOfDisclosure: "Sep 8, 2024",
      dateOfConception: "Feb 2024",
      dateOfReductionToPractice: "Jul 2024",
      writtenRecordExists: true,
      inventionStage: ["prototype", "experimental_data"],
      funding: [{ sourceType: "foundation", sponsorName: "McKnight Foundation", awardNumber: "MCK-2023-441" }],
      briefSummary:
        "A bio-resin press process that binds baled prairie-grass fiber into code-testable structural panels with mechanical properties in the range of OSB at lower embodied carbon.",
      advantages: "Uses a waste stream; lower embodied carbon than plywood/OSB; regional supply.",
      limitations: "Moisture-cycling durability data still being gathered.",
      applications: "Interior sheathing, furniture-grade panel stock.",
      companiesOfInterest: "Regional modular-home builders.",
      disclosedExternally: true,
      disclosedExternallyDetails: "Published in a materials journal (Aug 2024) after the patent filed — cleared with TTO.",
      plannedDisclosure: false,
      dataMaterials: ["other"],
      inventors: [
        mkInventor("Dr. Anna Voss", "Professor", "Materials Science", 80, "anna.voss@usd.edu"),
        mkInventor("Ben Ostrander", "PhD Candidate", "Materials Science", 20, "ben.ostrander@coyotes.usd.edu"),
      ],
    }),
    stage: "finalize",
    onHold: false,
    route: "founder_match",
    published: false,
    milestone: "company_formed",
    outcome: "licensed",
    outcomeNote: "Exclusive license to Prairie Panel Co. (two-founder company); Dr. Voss advising as contact.",
    updated: "1 month ago",
    inviteSent: true,
    interests: [
      { id: 1, founder: "Priya Raman", founderContext: "Wildfire Network member", when: "April", status: "connected" },
    ],
    mentors: [],
  },
  {
    id: 4,
    title: "Adaptive stroke-rehab glove",
    nonConfidentialSummary:
      "A sensor-laden glove that adapts its resistance to a stroke patient's recovery curve so rehab exercises stay hard enough to matter but never discouraging. Rented with a companion app to outpatient clinics.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2026-042",
      dateOfDisclosure: "Jul 21, 2026",
      dateOfConception: "Apr 2026",
      dateOfReductionToPractice: "—",
      writtenRecordExists: true,
      inventionStage: ["prototype"],
      funding: [],
      briefSummary:
        "A hand-orthosis with embedded force and flexion sensors and a variable-resistance actuator that closes the loop on rehab intensity using a per-session difficulty model.",
      advantages: "Adaptive difficulty vs fixed-resistance devices; at-home use between clinic visits.",
      limitations: "No clinical outcomes yet; actuator is bulky in the current build.",
      applications: "Outpatient stroke and hand-injury rehabilitation.",
      companiesOfInterest: "Rehab-device distributors.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: [],
      inventors: [
        mkInventor("Dr. Miriam Hale", "Associate Professor", "Biomedical Engineering", 100, "miriam.hale@usd.edu"),
      ],
    }),
    stage: "new",
    onHold: false,
    route: null,
    published: false,
    updated: "Yesterday",
    interests: [],
    mentors: [],
  },
  {
    id: 5,
    title: "Aquifer recharge forecasting model",
    nonConfidentialSummary:
      "An ML model that forecasts aquifer recharge rates from public weather and soil data, giving water districts a season-ahead view of groundwater supply. Sold as a subscription to irrigation districts and municipal water planners.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2026-033",
      dateOfDisclosure: "Jun 2, 2026",
      dateOfConception: "Dec 2025",
      dateOfReductionToPractice: "May 2026",
      writtenRecordExists: true,
      inventionStage: ["experimental_data", "seeking_funding"],
      funding: [{ sourceType: "federal", sponsorName: "USDA NIFA", awardNumber: "NIFA-2025-67019" }],
      briefSummary:
        "A gradient-boosted model ingesting NOAA and USDA feeds to produce per-sub-basin groundwater recharge forecasts with a season-ahead horizon, validated against monitoring-well records.",
      advantages: "Uses only public data; sub-basin granularity; season-ahead horizon.",
      limitations: "Validated on one aquifer system; transfer to other geologies unproven.",
      applications: "Irrigation-district planning; municipal water supply forecasting.",
      companiesOfInterest: "Water-district software vendors.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: ["other"],
      inventors: [
        mkInventor("Dr. Sam Littlefeather", "Associate Professor", "Earth Sciences", 100, "sam.littlefeather@usd.edu"),
      ],
    }),
    stage: "routed",
    onHold: false,
    route: "i_corps",
    published: false,
    updated: "5 days ago",
    notes: "Routed to I-Corps — good customer-discovery candidate before anyone commits to build.",
    interests: [],
    mentors: [],
  },
  {
    id: 6,
    title: "Cold-chain vaccine stability indicator",
    nonConfidentialSummary:
      "A penny-cost color-change label for vaccine vials that visibly darkens as cumulative cold-chain excursions accumulate — no scanner, no battery. Sold as rolls of labels to vaccine distributors and NGOs.",
    university: UNIVERSITY,
    involvement: "cofounder",
    patentStatus: "provisional",
    disclosure: mkDisclosure({
      techNumber: "USD-2025-063",
      dateOfDisclosure: "May 19, 2025",
      dateOfConception: "Jan 2025",
      dateOfReductionToPractice: "Apr 2025",
      writtenRecordExists: true,
      inventionStage: ["prototype", "experimental_data"],
      funding: [{ sourceType: "foundation", sponsorName: "Gates Foundation (subaward)", awardNumber: "GF-SUB-88123" }],
      briefSummary:
        "An irreversible thermochromic ink formulation whose color change integrates time-above-threshold, giving a cumulative visual readout of cold-chain excursion without electronics.",
      advantages: "Sub-cent cost; no reader; cumulative (not instantaneous) readout.",
      limitations: "Threshold tuning per-vaccine; regulatory acceptance pathway unclear.",
      applications: "Vaccine cold-chain integrity in low-resource settings.",
      companiesOfInterest: "Vaccine distributors, global-health NGOs.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: ["other", "cda_nda"],
      inventors: [
        mkInventor("Dr. Anna Voss", "Professor", "Materials Science", 65, "anna.voss@usd.edu"),
        mkInventor("Dr. Lena Cho", "Assistant Professor", "Chemistry", 35, "lena.cho@usd.edu"),
      ],
    }),
    stage: "reviewing",
    onHold: true,
    holdNote: "Licensing questions still open with the tech-transfer office.",
    route: null,
    published: false,
    updated: "2 weeks ago",
    interests: [],
    mentors: [],
  },
  {
    id: 7,
    title: "Snow-load roof-failure early-warning sensor",
    nonConfidentialSummary:
      "A strain-gauge sensor network for flat commercial roofs that warns building owners before snow load reaches failure territory. Peel-and-stick gauges report deflection to a gateway; hardware plus monitoring subscription.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "provisional",
    disclosure: mkDisclosure({
      techNumber: "USD-2025-072",
      dateOfDisclosure: "Jun 27, 2025",
      dateOfConception: "Feb 2025",
      dateOfReductionToPractice: "May 2025",
      writtenRecordExists: true,
      inventionStage: ["prototype"],
      funding: [],
      briefSummary:
        "A network of adhesive strain gauges and a load-inference model that estimates distributed roof loading and alerts when engineered thresholds are crossed.",
      advantages: "Retrofit peel-and-stick install; predictive vs post-failure.",
      limitations: "Calibration per roof structure; adhesive longevity in freeze-thaw untested.",
      applications: "Commercial flat-roof risk monitoring in snow-load regions.",
      companiesOfInterest: "Commercial-property insurers, facility-management firms.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: [],
      inventors: [
        mkInventor("Dr. Owen Pruitt", "Professor", "Electrical Engineering", 100, "owen.pruitt@usd.edu"),
      ],
    }),
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    notes: "Published to Founder Match — waiting for a founder to pick it up.",
    interests: [],
    mentors: [
      { id: 1, name: "Carl Dahl", email: "carl@structuralventures.io", invitedWhen: "4 days ago" },
    ],
  },
  {
    id: 8,
    title: "Microbial seed-coating biofertilizer",
    nonConfidentialSummary:
      "A nitrogen-fixing microbial coating applied to wheat seed before planting, cutting synthetic fertilizer input roughly a quarter in greenhouse trials. Revenue per treated acre through ag retailers.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2024-095",
      dateOfDisclosure: "Oct 15, 2024",
      dateOfConception: "Mar 2024",
      dateOfReductionToPractice: "Aug 2024",
      writtenRecordExists: true,
      inventionStage: ["experimental_data"],
      funding: [
        { sourceType: "federal", sponsorName: "USDA NIFA", awardNumber: "NIFA-2024-70112" },
        { sourceType: "industry", sponsorName: "Dakota Seed Partners", awardNumber: "DSP-SRA-19" },
      ],
      briefSummary:
        "A shelf-stable microbial consortium and seed-adhesion carrier that establishes a nitrogen-fixing rhizosphere community on wheat, reducing synthetic-N requirement ~25% in greenhouse trials.",
      advantages: "Seed-applied (no new equipment); works with existing seed-treatment lines.",
      limitations: "Field-scale replication pending; strain IP overlaps a licensed background patent.",
      applications: "Wheat and small-grain fertility programs.",
      companiesOfInterest: "Seed treaters, ag-retail cooperatives.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: ["bio", "mta", "crada"],
      inventors: [
        mkInventor("Dr. Sam Littlefeather", "Associate Professor", "Earth Sciences", 55, "sam.littlefeather@usd.edu"),
        mkInventor("Dr. Grace Iron Cloud", "Assistant Professor", "Biology", 30, "grace.ironcloud@usd.edu"),
        mkInventor("Tomas Reyes", "PhD Candidate", "Biology", 15, "tomas.reyes@coyotes.usd.edu"),
      ],
    }),
    stage: "in_motion",
    onHold: false,
    route: "founder_match",
    published: true,
    milestone: "matched",
    updated: "This morning",
    inviteSent: true,
    interests: [
      { id: 1, founder: "Dana Whitfield", founderContext: "Student founder · USD MBA program", when: "Yesterday", status: "connected" },
      { id: 2, founder: "Leo Tran", founderContext: "Wildfire Network member", when: "This morning", status: "new" },
    ],
    mentors: [],
    icorps: { applied: true, when: "Yesterday", note: "Dana applied to the Fall 2026 regional I-Corps cohort." },
  },
  {
    id: 9,
    title: "Wind-farm blade-icing predictor",
    nonConfidentialSummary:
      "Forecasts turbine blade-icing events from weather and vibration data so wind-farm operators can pre-heat or feather blades before ice throws them off balance.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2026-049",
      dateOfDisclosure: "Jul 9, 2026",
      dateOfConception: "May 2026",
      dateOfReductionToPractice: "—",
      writtenRecordExists: false,
      inventionStage: ["concept_only", "discussion"],
      funding: [],
      briefSummary:
        "A model correlating met-mast weather with nacelle vibration signatures to predict icing-induced imbalance ahead of trip events.",
      advantages: "Uses existing SCADA signals; predictive maintenance angle.",
      limitations: "Concept stage; no validation data yet.",
      applications: "Wind-farm O&M optimization.",
      companiesOfInterest: "Wind-farm operators.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: [],
      inventors: [
        mkInventor("Dr. Owen Pruitt", "Professor", "Electrical Engineering", 100, "owen.pruitt@usd.edu"),
      ],
    }),
    stage: "new",
    onHold: false,
    route: null,
    published: false,
    updated: "2 days ago",
    interests: [],
    mentors: [],
  },
  {
    id: 10,
    title: "Bio-derived road de-icer",
    nonConfidentialSummary:
      "Turns sugar-beet processing byproduct into a road de-icer that is cheaper per lane-mile than brine additives and far less corrosive to bridges and vehicles.",
    university: UNIVERSITY,
    involvement: "contact",
    patentStatus: "provisional",
    disclosure: mkDisclosure({
      techNumber: "USD-2026-051",
      dateOfDisclosure: "Jul 15, 2026",
      dateOfConception: "Mar 2026",
      dateOfReductionToPractice: "Jun 2026",
      writtenRecordExists: true,
      inventionStage: ["prototype", "experimental_data"],
      funding: [{ sourceType: "state", sponsorName: "SD Dept. of Transportation", awardNumber: "SDDOT-RP-2026-04" }],
      briefSummary:
        "A fermentation-derived carbohydrate blend from sugar-beet byproduct that depresses freezing point and inhibits corrosion, applied as a pre-wet or direct liquid de-icer.",
      advantages: "Lower corrosion vs chloride brines; uses a local waste stream; competitive cost.",
      limitations: "Performance below -15°C drops off; storage stability being tested.",
      applications: "Municipal and DOT winter road maintenance.",
      companiesOfInterest: "State DOTs, municipal fleets.",
      disclosedExternally: false,
      plannedDisclosure: true,
      plannedDisclosureDetails: "SDDOT final report publishes Dec 2026.",
      dataMaterials: ["other"],
      inventors: [
        mkInventor("Dr. Anna Voss", "Professor", "Materials Science", 70, "anna.voss@usd.edu"),
        mkInventor("Dr. Lena Cho", "Assistant Professor", "Chemistry", 30, "lena.cho@usd.edu"),
      ],
    }),
    stage: "finalize",
    onHold: false,
    route: "hackathon",
    published: false,
    outcome: "abandoned",
    outcomeNote: "No team picked it up over two events and the inventor moved on — closed as abandoned.",
    updated: "6 weeks ago",
    interests: [],
    mentors: [],
  },
  {
    id: 11,
    title: "Rural telehealth triage protocol",
    nonConfidentialSummary:
      "A validated triage decision protocol licensed to rural telehealth providers so nurse-line staff can route patients to the right level of care consistently.",
    university: UNIVERSITY,
    involvement: "cofounder",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "USD-2026-038",
      dateOfDisclosure: "Jun 18, 2026",
      dateOfConception: "Jan 2026",
      dateOfReductionToPractice: "Apr 2026",
      writtenRecordExists: true,
      inventionStage: ["experimental_data", "discussion"],
      funding: [{ sourceType: "federal", sponsorName: "HRSA Rural Health", awardNumber: "HRSA-RH-2025-22" }],
      briefSummary:
        "A structured, evidence-graded triage decision tree tuned for low-acuity rural telehealth, with a scoring rubric validated in a retrospective chart review against physician disposition.",
      advantages: "Consistency across nurse-line staff; validated dispositions; low implementation cost.",
      limitations: "Retrospective validation only; copyright/know-how rather than patentable subject matter.",
      applications: "Rural telehealth nurse lines, critical-access hospital call centers.",
      companiesOfInterest: "Regional telehealth networks.",
      disclosedExternally: false,
      plannedDisclosure: false,
      dataMaterials: ["cda_nda"],
      inventors: [
        mkInventor("Dr. Sam Littlefeather", "Associate Professor", "Earth Sciences", 50, "sam.littlefeather@usd.edu"),
        mkInventor("Dr. Ruth Bishop", "Clinical Professor", "Nursing", 50, "ruth.bishop@usd.edu"),
      ],
    }),
    stage: "reviewing",
    onHold: false,
    route: null,
    published: false,
    updated: "4 days ago",
    interests: [],
    mentors: [],
  },
];

/* ── Other universities' published Founder-Match ideas ──────────────────────
   Founders browse published Founder-Match ideas ACROSS universities —
   university isolation applies to IP Managers, not to the marketplace.
   Only NON-confidential fields ever render to founders. */

export const OTHER_UNI_MATCH_IDEAS: IpIdea[] = [
  {
    id: 101,
    title: "Encrypted telemetry for rural co-op grids",
    nonConfidentialSummary:
      "A drop-in encryption layer for the SCADA telemetry rural electric co-ops still send in the clear. A small gateway box encrypts substation traffic without replacing legacy equipment, sold co-op by co-op with grant-funded pilots.",
    university: "Dakota State University",
    involvement: "contact",
    patentStatus: "provisional",
    disclosure: mkDisclosure({
      techNumber: "DSU-2025-011",
      briefSummary: "Confidential — held by Dakota State's TTO.",
      inventors: [mkInventor("Dr. Renee Calloway", "Professor", "Cyber Operations", 100, "renee.calloway@dsu.edu")],
    }),
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    interests: [],
    mentors: [],
  },
  {
    id: 102,
    title: "Automated grain-bin atmosphere controller",
    nonConfidentialSummary:
      "A retrofit controller for on-farm grain bins that manages aeration automatically from in-bin sensors, cutting spoilage losses. Sold through farm-supply dealers as a retrofit kit.",
    university: "Dakota State University",
    involvement: "cofounder",
    patentStatus: "not_filed",
    disclosure: mkDisclosure({
      techNumber: "DSU-2025-019",
      briefSummary: "Confidential — held by Dakota State's TTO.",
      inventors: [mkInventor("Dr. Marcus Roy", "Associate Professor", "Computer Science", 100, "marcus.roy@dsu.edu")],
    }),
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "2 weeks ago",
    interests: [],
    mentors: [],
  },
  {
    id: 103,
    title: "Dairy methane-capture membrane",
    nonConfidentialSummary:
      "A selective membrane module that fits existing dairy lagoon covers and concentrates methane for on-farm use at herd sizes far below current digester economics. Sold as a leased module with a maintenance contract.",
    university: "University of Wisconsin–Madison",
    involvement: "contact",
    patentStatus: "filed",
    disclosure: mkDisclosure({
      techNumber: "UW-2025-204",
      briefSummary: "Confidential — held by UW–Madison's TTO.",
      inventors: [mkInventor("Dr. Elena Brandt", "Professor", "Chemical Engineering", 100, "elena.brandt@wisc.edu")],
    }),
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "5 days ago",
    interests: [],
    mentors: [],
  },
  {
    id: 104,
    title: "Cheese-culture phage early-detection assay",
    nonConfidentialSummary:
      "A 30-minute benchtop assay that catches bacteriophage contamination in cheese starter cultures before a production vat is ruined. Sold as consumable test kits to specialty and industrial cheesemakers.",
    university: "University of Wisconsin–Madison",
    involvement: "contact",
    patentStatus: "provisional",
    disclosure: mkDisclosure({
      techNumber: "UW-2025-231",
      briefSummary: "Confidential — held by UW–Madison's TTO.",
      inventors: [mkInventor("Dr. Tom Okafor", "Associate Professor", "Food Science", 100, "tom.okafor@wisc.edu")],
    }),
    stage: "routed",
    onHold: false,
    route: "founder_match",
    published: true,
    updated: "1 week ago",
    interests: [],
    mentors: [],
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
      { name: "Kirby Fuglsby", active: true },
      { name: "Peter Ames", active: true },
    ],
    professors: USD_PROFESSORS.map((p) => ({ ...p, active: true })),
    ideas: { total: 11, inMotion: 3, done: 2 },
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
