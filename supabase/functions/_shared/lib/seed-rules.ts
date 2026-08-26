// Kanoniskt regelinnehåll (modul A/B/C verifierade, D overifierad).
//
// Detta är enda källan för copy och regeldata. Både testerna och supabase/seed.sql
// speglar denna fil (drift-vaktas av test/seed-sql.test.ts).
//
// DATADISCIPLIN: källorna nedan är kanoniska myndighetssidor men MÅSTE kontrolleras
// på nytt inför publik lansering. Overifierade rader (modul D) har published=false och
// verified=null och genereras aldrig in i en publicerad feed.

import type { Rule } from './types.ts'

export interface SeedModule {
  id: string
  title: string
  description: string
  published: boolean
}

export interface SeedRule extends Rule {
  published: boolean
  data?: Record<string, unknown> // strukturerad data, aldrig i brödtext
}

const VERIFIED = '2026-08-26'
const UPDATED = '2026-08-26T00:00:00Z'

export const MODULES: SeedModule[] = [
  {
    id: 'skatt-privat',
    title: 'Skatt & deklaration',
    description: 'Deklarationsdatum och skattekonto för privatpersoner.',
    published: true,
  },
  {
    id: 'sparande',
    title: 'Sparande',
    description: 'ISK-mätdatum och statslåneränta.',
    published: true,
  },
  {
    id: 'hushall',
    title: 'Hushåll',
    description: 'Sommar-/vintertid, vinterdäck och brandvarnare.',
    published: true,
  },
  {
    id: 'foretagare',
    title: 'Företagare',
    description: 'Ännu ej verifierat - publiceras inte.',
    published: false,
  },
]

export const RULES: SeedRule[] = [
  // ---------- Modul A - Skatt & deklaration (verifierat 2026-08-26) ----------
  {
    id: 'skattekonto-extra-inbetalning',
    moduleId: 'skatt-privat',
    type: 'fixed_date',
    params: { month: 2, day: 12 },
    weekendRule: 'next_business_day',
    warnings: [7],
    title: 'Extra inbetalning till skattekontot',
    descriptions: [
      'Räknar du med kvarskatt över 30 000 kr börjar kostnadsräntan ticka efter idag. En inbetalning i tid slipper du den.',
      'Efter idag kostar en väntad kvarskatt över 30 000 kr ränta. Ju tidigare inbetalning, desto mindre ränta.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'deklaration-utskick',
    moduleId: 'skatt-privat',
    type: 'date_range',
    params: { start: { month: 3, day: 2 }, end: { month: 3, day: 6 } },
    weekendRule: 'none',
    warnings: [],
    title: 'Deklarationen skickas ut',
    descriptions: [
      'Under de här dagarna landar deklarationen i digitala brevlådor. Har du en sådan kommer den tidigt.',
      'Nu skickas deklarationerna till digitala brevlådor. Papperslådan får vänta några veckor till.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'etjanst-oppnar',
    moduleId: 'skatt-privat',
    // OBS: 17 mars kan flytta mellan år. Kräver årlig kontroll.
    type: 'fixed_date',
    params: { month: 3, day: 17 },
    weekendRule: 'none',
    warnings: [],
    title: 'E-tjänsten för deklaration öppnar',
    descriptions: [
      'Deklarationen finns nu i Skatteverkets app och e-tjänst. Ja, en del gör den samma kväll.',
      'Nu går det att deklarera digitalt. Exakt datum kan flytta något mellan år.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'deklarera-digitalt-tidig-aterbaring',
    moduleId: 'skatt-privat',
    // OBS: 31 mars kan flytta mellan år. Kräver årlig kontroll.
    type: 'fixed_date',
    params: { month: 3, day: 31 },
    weekendRule: 'none',
    warnings: [7],
    title: 'Godkänn digitalt för tidig återbäring',
    descriptions: [
      'Godkänner du utan ändringar idag kommer eventuell återbäring i april i stället för i juni. Två månader för fem minuters jobb.',
      'Sista chansen att godkänna utan ändringar och få återbäringen tidigt. Efter idag hamnar den längre bak i kön.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'deklaration-sista-dag',
    moduleId: 'skatt-privat',
    type: 'fixed_date',
    params: { month: 5, day: 2 },
    weekendRule: 'next_business_day',
    warnings: [30, 7],
    title: '📮 Sista dagen att deklarera',
    descriptions: [
      'Efter idag byter Skatteverket ut ordet återbäring mot förseningsavgift.',
      'Sista dagen att lämna deklarationen utan anstånd. Därefter blir det förseningsavgift i stället.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'kvarskatt-info',
    moduleId: 'skatt-privat',
    // Rent informationsevent - ingen deadline. Kvarskattens betaldatum är personligt.
    type: 'fixed_date',
    params: { month: 6, day: 1 },
    weekendRule: 'none',
    warnings: [],
    title: 'Så räknas datumet för kvarskatt',
    descriptions: [
      'Kvarskatt ska betalas 90 dagar efter beslutet om din slutliga skatt. Datumet är alltså personligt och står på ditt slutskattebesked.',
    ],
    source: 'https://www.skatteverket.se/privat/skatter/deklaration/skattaterbaringochkvarskatt',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },

  // ---------- Modul B - Sparande ----------
  {
    id: 'isk-matning',
    moduleId: 'sparande',
    type: 'quarterly',
    params: { months: [1, 4, 7, 10], day: 1 },
    weekendRule: 'none',
    warnings: [],
    title: '💰 ISK-mätning',
    descriptions: [
      'Värdet på kontot mäts idag och vägs in i årets kapitalunderlag. Ett av fyra mättillfällen.',
      'Idag mäts ISK-värdet för kapitalunderlaget. Ingen panik, det upprepas varje kvartal.',
    ],
    // Fribelopp och schablonränta som DATA, aldrig i brödtext. Ändras mellan år.
    data: { fribelopp_kr: 300000, schablonranta: 0.0355, ar: 2026 },
    source: 'https://www.skatteverket.se/privat/skatter/vardepapper/investeringssparkontoisk',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'statslanerantan-faststalls',
    moduleId: 'sparande',
    type: 'fixed_date',
    params: { month: 11, day: 30 },
    weekendRule: 'none',
    warnings: [],
    title: 'Statslåneräntan fastställs',
    descriptions: [
      'Riksgälden sätter räntan som avgör nästa års ISK-skatt. Ren nyfikenhetspost.',
      'Idag bestäms statslåneräntan i slutet av november. Den styr schablonskatten på ISK nästa år.',
    ],
    source: 'https://www.riksgalden.se/sv/var-verksamhet/statslanerantan/',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },

  // ---------- Modul C - Hushåll ----------
  {
    id: 'sommartid',
    moduleId: 'hushall',
    type: 'nth_weekday',
    params: { n: 'last', weekday: 0, month: 3 },
    weekendRule: 'none',
    warnings: [],
    title: 'Sommartid börjar',
    descriptions: [
      'Klockan ställs fram en timme i natt. Du sover en timme kortare men får ljusare kvällar.',
      'Sommartid: klockan fram en timme. Kaffebryggaren vet inte om det förrän du berättar.',
    ],
    source: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-200152-om-sommartid_sfs-2001-52/',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'vintertid',
    moduleId: 'hushall',
    type: 'nth_weekday',
    params: { n: 'last', weekday: 0, month: 10 },
    weekendRule: 'none',
    warnings: [],
    title: 'Vintertid börjar',
    descriptions: [
      'Klockan ställs tillbaka en timme i natt. En timme extra sömn, mörkare eftermiddagar.',
      'Vintertid: klockan tillbaka en timme. Den enda natten på året du gärna vaknar för tidigt.',
    ],
    source: 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-200152-om-sommartid_sfs-2001-52/',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'vinterdack',
    moduleId: 'hushall',
    type: 'date_range',
    params: { start: { month: 12, day: 1 }, end: { month: 3, day: 31 } },
    weekendRule: 'none',
    warnings: [],
    title: 'Vinterdäcksperiod',
    descriptions: [
      'Krav på vinterdäck vid vinterväglag under perioden. Det snöade inte i morse är inte ett godkänt argument.',
    ],
    source: 'https://www.transportstyrelsen.se/sv/vagtrafik/Trafikregler/Generella-trafikregler/dack/',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },
  {
    id: 'brandvarnare-batteri',
    moduleId: 'hushall',
    type: 'fixed_date',
    params: { month: 12, day: 1 },
    weekendRule: 'none',
    warnings: [],
    title: '🔋 Byt batteri i brandvarnaren',
    descriptions: [
      'Annars piper den klockan tre på natten någon gång i februari. Det gör de alltid.',
      'Dags för nytt batteri i brandvarnaren. Passa på nu, inte vid nästa nattliga pip.',
    ],
    source: 'https://www.msb.se/sv/rad-till-privatpersoner/brandsakerhet-i-hemmet/brandvarnare/',
    verified: VERIFIED,
    updatedAt: UPDATED,
    published: true,
  },

  // ---------- Modul D - Företagare (OVERIFIERAT, publiceras aldrig) ----------
  {
    id: 'arbetsgivardeklaration',
    moduleId: 'foretagare',
    type: 'day_of_month',
    params: { day: 12 },
    weekendRule: 'next_business_day',
    warnings: [],
    title: 'Arbetsgivardeklaration',
    descriptions: ['Arbetsgivardeklaration och skatt ska vara inne. Datum ej verifierat.'],
    source: '',
    verified: null,
    updatedAt: UPDATED,
    published: false,
  },
  {
    id: 'moms-kvartal',
    moduleId: 'foretagare',
    type: 'quarterly',
    params: { months: [2, 5, 8, 11], day: 12 },
    weekendRule: 'next_business_day',
    warnings: [],
    title: 'Momsdeklaration (kvartal)',
    descriptions: ['Momsperiod för kvartalsredovisning. Datum ej verifierat.'],
    source: '',
    verified: null,
    updatedAt: UPDATED,
    published: false,
  },
  {
    id: 'inkomstdeklaration-2',
    moduleId: 'foretagare',
    type: 'fixed_date',
    params: { month: 7, day: 1 },
    weekendRule: 'next_business_day',
    warnings: [],
    title: 'Inkomstdeklaration 2 (aktiebolag)',
    descriptions: ['Beror på räkenskapsårets slut. Datum ej verifierat.'],
    source: '',
    verified: null,
    updatedAt: UPDATED,
    published: false,
  },
  {
    id: 'arsredovisning-bolagsverket',
    moduleId: 'foretagare',
    type: 'fixed_date',
    params: { month: 7, day: 31 },
    weekendRule: 'next_business_day',
    warnings: [],
    title: 'Årsredovisning till Bolagsverket',
    descriptions: ['Sju månader efter räkenskapsårets slut. Datum ej verifierat.'],
    source: '',
    verified: null,
    updatedAt: UPDATED,
    published: false,
  },
]

/** Endast publicerbara regler (motsvarar vyn published_rules). */
export const PUBLISHED_RULES: SeedRule[] = RULES.filter(
  (r) => r.published && r.verified !== null && r.source.trim() !== ''
)
