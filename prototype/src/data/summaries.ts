/**
 * Canned "AI synthesis" text (UIP-8). Every string here is concept-only: it says what the
 * invention is for and who might buy it, never how it works.
 *
 * The one exception is `LEAKY_DRAFT_ID`, written deliberately to trip the guardrail scan so
 * UIP-10 has something real to show at a walkthrough.
 */

export const LEAKY_DRAFT_ID = 'uip-063';

export const SUMMARY_TEXT: Record<string, string> = {
  'uip-041':
    'A rapid bedside test that flags sepsis hours earlier than current lab workflows by reading a panel of blood markers. Aimed at emergency departments and rural critical-access hospitals, where the delay between suspicion and confirmation drives most of the mortality risk. The team has bench data from banked clinical samples and is looking for a founder who can navigate diagnostics regulation and hospital procurement.',
  'uip-051':
    'A prosthetic socket liner that adapts to limb volume changes across the day, addressing the fit problems that cause skin breakdown and drive prosthesis abandonment. Targets lower-limb amputees and the clinics that fit them. Early user testing suggests meaningful comfort gains over static liners. Best suited to a founder with medical-device or DTC health-hardware experience.',
  'uip-007':
    'A transformer core material that cuts idle energy losses in distribution equipment. Relevant to rural electric cooperatives and utility suppliers replacing aging grid hardware. The disclosure is old and the inventor has retired, so any commercialization would start from the written record rather than an active lab.',
  'uip-018':
    'A permanent-magnet manufacturing approach that removes the dependence on imported rare-earth elements. Of interest to motor and generator manufacturers exposed to supply-chain risk. Still lab-scale; would need a founder comfortable with materials scale-up and industrial sales cycles.',
  'uip-024':
    'A genetic marker panel that lets wheat breeders select drought-tolerant lines years earlier than field trials allow. Customers are seed companies and breeding programs across the northern plains. Field-validated across several growing seasons.',
  'uip-063':
    'A solid-state electrolyte for sodium batteries offering a cheaper alternative to lithium chemistries for grid storage.',
  'uip-029':
    'A camera-based system that scores livestock lameness automatically as animals walk a chute, replacing subjective visual scoring. Buyers are feedlots, dairies, and the veterinary services that support them. Works with off-the-shelf cameras, which keeps the hardware cost low.',
  'uip-033':
    'A soil amendment that improves nutrient uptake in row crops grown on the region\'s poorer soils. Aimed at agricultural retailers and cooperatives. Greenhouse results are strong; field validation is partial.',
  'uip-009':
    'A wearable that estimates blood glucose without a skin puncture, worn in the ear rather than on the arm. Aimed at people managing type 2 diabetes who abandon finger-stick routines. Accuracy is not yet at the level regulators require for dosing decisions, so the near-term positioning is wellness and trend monitoring.',
  'uip-012':
    'A label that gives a clear visual signal when a vaccine vial has been exposed to temperatures outside its safe range. Intended for public-health distribution in settings where cold-chain monitoring equipment is impractical. Shelf-stable and inexpensive per unit.',
  'uip-046':
    'An acoustic method for locating leaks in rural water mains without excavating. Customers are small municipal water systems and rural water districts, who lose a large share of treated water to undetected leaks and cannot justify the cost of commercial leak-detection surveys.',
  'uip-055':
    'A speech-therapy practice framework that keeps children engaged in at-home exercises between clinic visits, with progress visibility for the therapist. Aimed at pediatric speech-language pathology practices and school districts. The inventor wants to stay hands-on with this one.',
  'uip-016':
    'A sorting system that separates native prairie seed by species at throughput rates useful for commercial restoration work. Buyers are seed producers and restoration contractors, who currently rely on slow manual sorting.',
  'uip-071':
    'A collar-mounted monitor that flags respiratory illness in cattle before visible symptoms appear, when treatment is cheaper and more effective. Customers are feedlots and cow-calf operations. Newly disclosed; no external validation yet.',

  'uip-102':
    'A selective recovery process that pulls lithium out of oil-and-gas produced water, turning a disposal liability into a feedstock. Relevant to operators in the Bakken and to battery-materials buyers seeking domestic supply.',
  'uip-108':
    'A navigation stack that lets inspection drones fly reliably in mine shafts and other GPS-denied underground spaces. Buyers are mining operators and the inspection services that serve them, where sending a person down is slow and hazardous.',
  'uip-115':
    'A concrete additive that closes small cracks as they form, extending the service life of bridges and pavement in freeze-thaw climates. Customers are DOTs and ready-mix suppliers.',
  'uip-121':
    'A mapping method that identifies promising geothermal sites from existing survey data, reducing the number of exploratory wells needed. Aimed at geothermal developers and utilities evaluating baseload alternatives.',
  'uip-127':
    'A polymer treatment that holds down haul-road dust with less water than current practice. Buyers are mine operators facing both air-quality limits and water constraints.',
  'uip-133':
    'A sensor mesh that reports corrosion in rock bolts before failure, addressing a ground-support risk that is currently managed by scheduled inspection. Customers are underground mines and tunneling contractors.',
};

/** Deliberately leaky variant — the draft an IP Manager should catch (UIP-10). */
export const LEAKY_DRAFT_TEXT =
  'A solid-state sodium battery electrolyte for grid storage. The ceramic is produced by sintering the ' +
  'precursor at 1150 °C for six hours under 40 MPa, then doping with 4.5 wt% zirconia to stabilise the ' +
  'conductive phase. The method is to first mill the powders, then anneal in argon before pressing. ' +
  'Ionic conductivity reaches values competitive with lithium analogues at room temperature.';

const FALLBACK: Record<string, string> = {
  'Medical device':
    'A medical-device concept disclosed by the university and awaiting review. The summary below is a placeholder generated for a newly imported record — the IP Manager should replace it with a concept-only description before releasing it.',
  'Agriculture / Food':
    'An agricultural technology disclosed by the university and awaiting review. This placeholder summary was generated on import and needs the IP Manager\'s edit before release.',
  'Materials':
    'A materials-science disclosure awaiting review. This placeholder summary was generated on import and needs the IP Manager\'s edit before release.',
  'Software':
    'A software disclosure awaiting review. This placeholder summary was generated on import and needs the IP Manager\'s edit before release.',
};

export function summaryFor(id: string, classification: string): string {
  if (id === LEAKY_DRAFT_ID) return LEAKY_DRAFT_TEXT;
  return (
    SUMMARY_TEXT[id] ??
    FALLBACK[classification] ??
    'A university disclosure awaiting review. This placeholder summary was generated for a record with no ' +
      'canned text — the IP Manager edits it into a concept-only description before anything is released.'
  );
}
