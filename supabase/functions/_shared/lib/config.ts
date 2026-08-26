// Delade konstanter för feed-genereringen.

/**
 * PERMANENT UID-namnrymd. Får ALDRIG ändras efter publicering – varje prenumerants
 * kalender identifierar händelser på {rule-id}-{år}[-w{dagar}]@cal.relic.se.
 */
export const UID_DOMAIN = 'cal.relic.se'

export const PRODID = '-//Enheten för schemalagd verksamhet//cal.relic.se//SV'

/** Rullande fönster framåt: feeds innehåller alltid ~24 månader. */
export const WINDOW_MONTHS_AHEAD = 24

export const REPO_URL = 'https://github.com/relic/cal'

/** Ansvarsfriskrivning – ligger i X-WR-CALDESC och på landningssidan. */
export const DISCLAIMER =
  'Informationen är ingen garanti. Kontrollera alltid mot Skatteverket och andra myndigheter.'
