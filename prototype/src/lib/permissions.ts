import type { PersonaKind } from '@/data/types';

/**
 * Who holds IP-manager authority.
 *
 * One list, consumed by the route guard in `App.tsx` and by the university
 * switcher in `TopBar.tsx`. They were drifting apart: the routes already
 * admitted the Wildfire admin while the switcher did not, so the admin could
 * reach every manager screen and had no way to choose which school it was
 * looking at. Whatever the answer is, both places have to agree on it.
 *
 * In a real backend this collapses into one role check; here it is the closest
 * honest equivalent.
 */
export const MANAGER_PERSONAS: PersonaKind[] = ['ip_manager', 'super_admin'];

export const isManager = (persona: PersonaKind) => MANAGER_PERSONAS.includes(persona);

/** Wildfire staff — cross-tenant, and the only persona allowed to look at
 *  every school at once. */
export const isPlatformAdmin = (persona: PersonaKind) => persona === 'super_admin';
