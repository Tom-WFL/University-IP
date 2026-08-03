import type { RedactionCriterion } from './types';

/**
 * What an AI-drafted summary must never contain.
 *
 * The stakeholder ask was to "make the prompt very strict… which pieces of
 * information should not be shared is going to be very critical." A prompt is
 * invisible to the people who carry the risk, so the criteria live here as
 * data instead: the drafter states which ones it wrote to, the IP manager
 * ticks each one at review, and the attestation is recorded on the item.
 *
 * A tech transfer office can read this list, argue with it, and change it —
 * which is not true of a system prompt buried in a service.
 */
export const DEFAULT_REDACTION_POLICY: RedactionCriterion[] = [
  {
    id: 'no-parameters',
    label: 'No formulations, parameters or process conditions',
    help: 'Compositions, ratios, temperatures, pressures, timings, tolerances. The recipe is the invention.',
  },
  {
    id: 'no-unpublished-results',
    label: 'No unpublished results or figures',
    help: 'Bench data, yields and performance numbers that have not been published or filed.',
  },
  {
    id: 'no-partners',
    label: 'No partner, licensee or sponsor names',
    help: 'Naming who is already interested tips off competitors and can breach an NDA.',
  },
  {
    id: 'no-claims',
    label: 'No references to specific patent claims',
    help: 'Pointing at claim numbers tells a reader exactly where the protection starts and stops.',
  },
  {
    id: 'no-overclaim',
    label: 'No performance claims the disclosure does not support',
    help: 'An overstated summary is a liability even when nothing confidential leaked.',
  },
];

/**
 * USD asked for a stricter line than the default, so their policy adds two.
 * Kept here rather than inline in the seed so the difference between schools
 * is legible in one place.
 */
export const STRICT_REDACTION_POLICY: RedactionCriterion[] = [
  ...DEFAULT_REDACTION_POLICY,
  {
    id: 'no-student-identifiers',
    label: 'No student names or course identifiers',
    help: 'Student-owned IP carries FERPA exposure on top of the commercial risk.',
  },
  {
    id: 'no-funding-terms',
    label: 'No funding source terms or award numbers',
    help: 'Award numbers are searchable and lead straight back to the full proposal.',
  },
];
