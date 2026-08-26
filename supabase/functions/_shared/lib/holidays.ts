// Svenska helgdagar (röda dagar) och vardagsberäkning.
//
// All datumaritmetik sker i UTC för att undvika tidszons- och sommartidsbuggar.
// Ett "datum" är en Date satt till midnatt UTC; bara år/månad/dag används.

/** Skapar ett datum vid midnatt UTC. `month` är 1–12. */
export function ymd(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day))
}

/** Lägger till `n` dagar (kan vara negativt). Returnerar ett nytt datum. */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date.getTime())
  d.setUTCDate(d.getUTCDate() + n)
  return d
}

/** YYYYMMDD för iCal DATE-värden. */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear().toString().padStart(4, '0')
  const m = (date.getUTCMonth() + 1).toString().padStart(2, '0')
  const d = date.getUTCDate().toString().padStart(2, '0')
  return `${y}${m}${d}`
}

/** 0 = söndag … 6 = lördag (UTC). */
export function weekday(date: Date): number {
  return date.getUTCDay()
}

/**
 * Påskdagen (gregoriansk) via den anonyma gregorianska algoritmen (Computus).
 * Returnerar datumet för påskdagen (en söndag).
 */
export function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) // 3 = mars, 4 = april
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return ymd(year, month, day)
}

/** Lördagen i ett givet intervall (t.ex. midsommar 20–26 juni). */
function saturdayBetween(year: number, month: number, fromDay: number, toDay: number): Date {
  for (let day = fromDay; day <= toDay; day++) {
    const date = ymd(year, month, day)
    if (weekday(date) === 6) return date
  }
  // Ska aldrig inträffa: ett sjudagarsintervall innehåller alltid en lördag.
  throw new Error(`Ingen lördag i intervallet ${year}-${month}-${fromDay}..${toDay}`)
}

const redDayCache = new Map<number, Set<string>>()

/** Mängden röda dagar (YYYYMMDD) för ett år. Memoiserat per år. */
export function redDays(year: number): Set<string> {
  const cached = redDayCache.get(year)
  if (cached) return cached

  const easter = easterSunday(year)
  const days = [
    ymd(year, 1, 1), //   Nyårsdagen
    ymd(year, 1, 6), //   Trettondedag jul
    addDays(easter, -2), // Långfredag
    easter, //             Påskdagen
    addDays(easter, 1), // Annandag påsk
    ymd(year, 5, 1), //   Första maj
    addDays(easter, 39), // Kristi himmelsfärds dag
    addDays(easter, 49), // Pingstdagen
    ymd(year, 6, 6), //   Sveriges nationaldag
    saturdayBetween(year, 6, 20, 26), // Midsommardagen (lördag 20–26 juni)
    allSaintsSaturday(year), //         Alla helgons dag (lördag 31 okt–6 nov)
    ymd(year, 12, 25), // Juldagen
    ymd(year, 12, 26), // Annandag jul
  ]

  const set = new Set(days.map(formatDate))
  redDayCache.set(year, set)
  return set
}

/** Alla helgons dag: lördagen mellan 31 oktober och 6 november. */
function allSaintsSaturday(year: number): Date {
  // Kandidater: 31 okt, samt 1–6 nov.
  const candidates = [ymd(year, 10, 31)]
  for (let day = 1; day <= 6; day++) candidates.push(ymd(year, 11, day))
  const sat = candidates.find((d) => weekday(d) === 6)
  if (!sat) throw new Error(`Ingen lördag 31 okt–6 nov ${year}`)
  return sat
}

/** Röd dag? (Söndagar räknas INTE som röda här – de fångas av vardagsregeln.) */
export function isRedDay(date: Date): boolean {
  return redDays(date.getUTCFullYear()).has(formatDate(date))
}

/**
 * Vardag = måndag–fredag som inte är röd dag.
 *
 * OBS: "helgdagsaftnar" (jul-, nyårs-, midsommar-, påskafton) behandlas INTE som
 * icke-vardagar här. Det följer specens uttryckliga definition. Vill vi senare
 * matcha Skatteverkets bankdagsbegrepp läggs aftnarna till i redDays().
 */
export function isBusinessDay(date: Date): boolean {
  const wd = weekday(date)
  if (wd === 0 || wd === 6) return false
  return !isRedDay(date)
}
