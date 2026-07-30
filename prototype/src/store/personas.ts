import type { Persona, PersonaId } from './types';

export const PERSONAS: Persona[] = [
  {
    id: 'public',
    name: 'Public visitor',
    title: 'Not signed in',
    email: '',
    role: 'public',
  },
  {
    id: 'founder',
    name: 'Marcus Webb',
    title: 'Founder — Wildfire network',
    email: 'marcus.webb@example.com',
    role: 'founder',
  },
  {
    id: 'manager-usd',
    name: 'Kirby Hale',
    title: 'IP Manager — University of South Dakota',
    email: 'kirby.hale@usd.example.edu',
    role: 'ip_manager',
    institutionId: 'usd',
  },
  {
    id: 'manager-mines',
    name: 'Rachel Nolan',
    title: 'IP Manager — SD School of Mines',
    email: 'rachel.nolan@sdsmt.example.edu',
    role: 'ip_manager',
    institutionId: 'mines',
  },
  {
    id: 'leadership',
    name: 'Dan Roberts',
    title: 'VP of Research — University of South Dakota',
    email: 'dan.roberts@usd.example.edu',
    role: 'leadership',
    institutionId: 'usd',
  },
];

export const HOME_ROUTE: Record<PersonaId, string> = {
  public: '/welcome',
  founder: '/founder',
  'manager-usd': '/manager',
  'manager-mines': '/manager',
  leadership: '/leadership',
};

/** Short aliases so demo links can be handed out as ?role=manager or ?role=kirby. */
const ALIASES: Record<string, PersonaId> = {
  manager: 'manager-usd',
  kirby: 'manager-usd',
  usd: 'manager-usd',
  rachel: 'manager-mines',
  mines: 'manager-mines',
  dan: 'leadership',
  vpr: 'leadership',
  marcus: 'founder',
};

export function resolvePersonaId(raw: string | null | undefined): PersonaId | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase();
  if (PERSONAS.some((p) => p.id === key)) return key as PersonaId;
  return ALIASES[key] ?? null;
}

export function getPersona(id: PersonaId): Persona {
  return PERSONAS.find((p) => p.id === id) ?? PERSONAS[0];
}
