import type { IpDraft } from '@/data/store';

/**
 * Minimal CSV handling for the import wizard. Deliberately small — the real
 * app would parse server-side; this exists so the demo can take a genuine
 * spreadsheet with unfamiliar column names and map it to our fields.
 */

export interface ParsedCsv {
  headers: string[];
  rows: string[][];
}

/** Handles quoted fields and escaped double-quotes. */
export function parseCsv(text: string): ParsedCsv {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell.trim());
    cell = '';
  };
  const pushRow = () => {
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      pushCell();
    } else if (char === '\n') {
      pushCell();
      pushRow();
    } else if (char !== '\r') {
      cell += char;
    }
  }
  pushCell();
  pushRow();

  const [headers = [], ...body] = rows;
  return { headers, rows: body.filter((r) => r.some((c) => c !== '')) };
}

export interface TargetField {
  key: keyof IpDraft | 'title';
  label: string;
  help: string;
  required?: boolean;
  /** Lowercase fragments we look for in the source header. */
  aliases: string[];
}

export const TARGET_FIELDS: TargetField[] = [
  {
    key: 'title',
    label: 'Title',
    help: 'The name of the disclosure.',
    required: true,
    aliases: ['title', 'name', 'invention', 'technology'],
  },
  {
    key: 'publicSummary',
    label: 'Non-confidential summary',
    help: 'The only text that ever gets published.',
    aliases: ['summary', 'abstract', 'public', 'description', 'brief'],
  },
  {
    key: 'confidentialDetail',
    label: 'Confidential detail',
    help: 'Stays private to IP staff.',
    aliases: ['confidential', 'detail', 'notes', 'internal'],
  },
  {
    key: 'disclosureNumber',
    label: 'Disclosure number',
    help: 'Your internal reference.',
    aliases: ['disclosure', 'ref', 'number', 'id', 'case'],
  },
  {
    key: 'field',
    label: 'Field',
    help: 'Discipline or technology area.',
    aliases: ['field', 'area', 'discipline', 'department', 'category'],
  },
  {
    key: 'inventors',
    label: 'Inventors',
    help: 'Named inventors on the disclosure.',
    aliases: ['inventor', 'author', 'creator', 'pi'],
  },
  {
    key: 'patentStatus',
    label: 'Patent status',
    help: 'not filed / provisional / filed / granted.',
    aliases: ['patent', 'status', 'filing'],
  },
  {
    key: 'fundingSource',
    label: 'Funding source',
    help: 'Grant or sponsor.',
    aliases: ['funding', 'grant', 'sponsor'],
  },
  {
    key: 'ownership',
    label: 'Ownership',
    help: 'bor / student / entangled.',
    aliases: ['ownership', 'owner', 'owned'],
  },
  {
    key: 'professorName',
    label: 'Professor name',
    help: 'Who to associate the idea with.',
    aliases: ['professor', 'faculty', 'contact name', 'lead'],
  },
  {
    key: 'professorEmail',
    label: 'Professor email',
    help: 'Used to send the account invite.',
    aliases: ['email', 'e-mail', 'contact'],
  },
];

/** Best-effort header matching so the mapping step starts mostly correct. */
export function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const taken = new Set<string>();

  TARGET_FIELDS.forEach((field) => {
    const match = headers.find((h) => {
      if (taken.has(h)) return false;
      const norm = h.toLowerCase();
      return field.aliases.some((alias) => norm.includes(alias));
    });
    if (match) {
      mapping[field.key] = match;
      taken.add(match);
    }
  });

  return mapping;
}

function normalisePatentStatus(value: string): IpDraft['patentStatus'] {
  const v = value.toLowerCase();
  if (v.includes('grant')) return 'granted';
  if (v.includes('provisional')) return 'provisional';
  if (v.includes('file') && !v.includes('not')) return 'filed';
  return 'not_filed';
}

function normaliseOwnership(value: string): IpDraft['ownership'] {
  const v = value.toLowerCase();
  if (v.includes('student')) return 'student';
  if (v.includes('entangl') || v.includes('joint') || v.includes('mixed')) return 'entangled';
  return 'bor';
}

export interface DraftRow {
  draft: IpDraft;
  valid: boolean;
  issues: string[];
}

export function toDrafts(parsed: ParsedCsv, mapping: Record<string, string>): DraftRow[] {
  const index = (key: string) => {
    const header = mapping[key];
    return header ? parsed.headers.indexOf(header) : -1;
  };
  const cols = Object.fromEntries(
    TARGET_FIELDS.map((f) => [f.key, index(f.key as string)]),
  ) as Record<string, number>;

  const get = (row: string[], key: string) => (cols[key] >= 0 ? row[cols[key]] ?? '' : '');

  return parsed.rows.map((row) => {
    const title = get(row, 'title');
    const professorEmail = get(row, 'professorEmail');
    const draft: IpDraft = {
      title,
      publicSummary: get(row, 'publicSummary'),
      confidentialDetail: get(row, 'confidentialDetail'),
      disclosureNumber: get(row, 'disclosureNumber'),
      field: get(row, 'field'),
      inventors: get(row, 'inventors'),
      patentStatus: normalisePatentStatus(get(row, 'patentStatus')),
      fundingSource: get(row, 'fundingSource'),
      ownership: normaliseOwnership(get(row, 'ownership')),
      // A spreadsheet can't tell us the professor's intent — the invite settles
      // it. With no contact at all there is nobody to attach, so idea-only is
      // the honest default rather than a claim the row doesn't support.
      facultyAttachment: professorEmail ? 'attached' : 'idea-only',
      professorName: get(row, 'professorName'),
      professorEmail,
      sendInvite: Boolean(professorEmail),
    };

    const issues: string[] = [];
    if (!title.trim()) issues.push('missing title');
    if (!draft.publicSummary.trim()) issues.push('no summary — add one before publishing');

    return {
      draft,
      // A missing summary is a warning, not a blocker: it can be written later,
      // and the item can't be published without one anyway.
      valid: Boolean(title.trim()),
      issues,
    };
  });
}

/** A realistic spreadsheet with deliberately non-matching column names. */
export const SAMPLE_CSV = `Invention Title,Case Ref,Discipline,Named Inventors,Filing Status,Grant / Sponsor,Public Abstract,Internal Notes,Owned By,Faculty Contact,Contact E-mail
Cryogenic valve seat for hydrogen service,SDM-2026-021,Mechanical Engineering,"E. Sandoval",provisional,DOE hydrogen program,"A valve seat that stays sealed through repeated cryogenic cycling, aimed at hydrogen fueling infrastructure that currently fails on thermal cycling.","Seat geometry and the elastomer blend are the differentiators.",Board of Regents,Dr. Elena Sandoval,elena.sandoval@sdmines.example.edu
Bio-based binder for foundry sand,SDM-2026-022,Chemical Engineering,"R. Whitfield, T. Cho",not filed,USDA rural innovation,"A plant-derived binder that replaces phenolic resins in foundry sand, cutting emissions in small casting operations.","Cure kinetics and the additive package.",Board of Regents,Dr. Reed Whitfield,reed.whitfield@sdmines.example.edu
Passive radon mitigation membrane,SDM-2026-023,Civil Engineering,"L. Okafor",filed,State health department,"A building membrane that reduces radon ingress without a powered fan, targeted at rural housing stock.","Layer stack and perforation pattern.",Board of Regents,Dr. Lydia Okafor,lydia.okafor@sdmines.example.edu
Compact XRF sorter for scrap metal,SDM-2026-024,Materials,"J. Bergstrom (student)",not filed,Senior design project,"A benchtop sorter that identifies alloy grades in scrap metal fast enough for small recyclers to use on a line.","Student-owned — from a senior design course.",Student,,
Drone-based methane leak survey method,SDM-2026-025,Environmental Engineering,"M. Tan, K. Reyes (student)",provisional,EPA methane initiative,"A flight pattern and inference method that locates methane leaks across a well pad in a single pass.","Joint faculty/student work — ownership needs review.",Entangled,Dr. Mira Tan,mira.tan@sdmines.example.edu
`;
