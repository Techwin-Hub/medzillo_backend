// utils/constants.ts
/**
 * @file Centralized constants for the application.
 * This file helps in avoiding hardcoded values and ensures consistency across the app.
 */

/**
 * Standard Indian National Immunization Schedule data.
 * Used for calculating vaccination due dates and tracking patient immunization.
 * Sourced from the Indian Academy of Pediatrics (IAP).
 */
export const IMMUNIZATION_SCHEDULE = [
  { name: 'BCG', doses: [{ dose: 1, due: { at: 'birth' } }] },
  { name: 'Hepatitis B', doses: [{ dose: 1, due: { at: 'birth' } }] },
  { name: 'OPV', doses: [{ dose: 0, due: { at: 'birth' } }, { dose: 1, due: { value: 6, unit: 'weeks' } }, { dose: 2, due: { value: 10, unit: 'weeks' } }, { dose: 3, due: { value: 14, unit: 'weeks' } }] },
  { name: 'Pentavalent', doses: [{ dose: 1, due: { value: 6, unit: 'weeks' } }, { dose: 2, due: { value: 10, unit: 'weeks' } }, { dose: 3, due: { value: 14, unit: 'weeks' } }] },
  { name: 'Rotavirus', doses: [{ dose: 1, due: { value: 6, unit: 'weeks' } }, { dose: 2, due: { value: 10, unit: 'weeks' } }, { dose: 3, due: { value: 14, unit: 'weeks' } }] },
  { name: 'PCV', doses: [{ dose: 1, due: { value: 6, unit: 'weeks' } }, { dose: 2, due: { value: 14, unit: 'weeks' } }, { dose: 3, due: { value: 9, unit: 'months' } }] },
  { name: 'IPV', doses: [{ dose: 1, due: { value: 6, unit: 'weeks' } }, { dose: 2, due: { value: 14, unit: 'weeks' } }] },
  { name: 'MMR', doses: [{ dose: 1, due: { value: 9, unit: 'months' } }, { dose: 2, due: { value: 16, unit: 'months' } }] },
  { name: 'DPT Booster', doses: [{ dose: 1, due: { value: 16, unit: 'months' } }, { dose: 2, due: { value: 5, unit: 'years' } }] },
  { name: 'Td', doses: [{ dose: 1, due: { value: 10, unit: 'years' } }, { dose: 2, due: { value: 16, unit: 'years' } }] },
];

/**
 * Standard debounce delay for search inputs in milliseconds.
 */
export const DEBOUNCE_DELAY = 300;

/**
 * Default number of items to display per page in paginated lists.
 */
export const DEFAULT_ITEMS_PER_PAGE = 10;
