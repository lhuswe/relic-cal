// Regelmotor: regel → konkreta kalenderhändelser över ett rullande fönster.
//
// UID-strategi (specens viktigaste krav – determinism och stabilitet):
//   - En händelse per år (fixed_date, nth_weekday, date_range):  {id}-{år}[-w{d}]
//   - Flera per år (day_of_month, quarterly):                    {id}-{år}-{MM}[-w{d}]
// UID:t nycklas på NOMINELLT år/månad, aldrig på det helgjusterade datumet, så att en
// korrigerad dag flyttar händelsen i stället för att skapa en dubblett.

import { UID_DOMAIN, WINDOW_MONTHS_AHEAD, REPO_URL } from './config.ts'
import {
  ymd,
  addDays,
  weekday,
  isBusinessDay,
} from './holidays.ts'
import { pickDescription, warningSummary, warningDescription } from './copy.ts'
import type { CalEvent, Rule, WeekendRule } from './types.ts'

export interface Window {
  start: Date // inklusive
  end: Date //   inklusive
}

/** Rullande fönster: från årets början (för kontext) till nu + 24 månader. */
export function defaultWindow(now: Date): Window {
  const start = ymd(now.getUTCFullYear(), 1, 1)
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + WINDOW_MONTHS_AHEAD, now.getUTCDate())
  )
  return { start, end }
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** N:te veckodagen i en månad. `n = 'last'` ger den sista. weekday: 0=sön..6=lör. */
function nthWeekdayOfMonth(year: number, month: number, wd: number, n: number | 'last'): Date {
  if (n === 'last') {
    const last = ymd(year, month, daysInMonth(year, month))
    const diff = (weekday(last) - wd + 7) % 7
    return addDays(last, -diff)
  }
  const first = ymd(year, month, 1)
  const diff = (wd - weekday(first) + 7) % 7
  return addDays(first, diff + (n - 1) * 7)
}

interface Occurrence {
  year: number //     nominellt år (för UID)
  uidExtra?: string // t.ex. '02' (månad) för typer med flera per år
  start: Date //      nominell start (före helgjustering)
  end: Date //        nominell exklusiv slut
  isRange: boolean
}

/** (month, day) < (month, day) i kalenderordning inom ett år. */
function beforeInYear(a: { month: number; day: number }, b: { month: number; day: number }): boolean {
  return a.month < b.month || (a.month === b.month && a.day < b.day)
}

function generateOccurrences(rule: Rule, year: number): Occurrence[] {
  const p = rule.params as Record<string, unknown>
  switch (rule.type) {
    case 'fixed_date': {
      const start = ymd(year, p.month as number, p.day as number)
      return [{ year, start, end: addDays(start, 1), isRange: false }]
    }
    case 'day_of_month': {
      const out: Occurrence[] = []
      for (let m = 1; m <= 12; m++) {
        const day = Math.min(p.day as number, daysInMonth(year, m))
        const start = ymd(year, m, day)
        out.push({
          year,
          uidExtra: m.toString().padStart(2, '0'),
          start,
          end: addDays(start, 1),
          isRange: false,
        })
      }
      return out
    }
    case 'quarterly': {
      const months = p.months as number[]
      return months.map((m) => {
        const start = ymd(year, m, p.day as number)
        return {
          year,
          uidExtra: m.toString().padStart(2, '0'),
          start,
          end: addDays(start, 1),
          isRange: false,
        }
      })
    }
    case 'nth_weekday': {
      const start = nthWeekdayOfMonth(year, p.month as number, p.weekday as number, p.n as number | 'last')
      return [{ year, start, end: addDays(start, 1), isRange: false }]
    }
    case 'date_range': {
      const s = p.start as { month: number; day: number }
      const e = p.end as { month: number; day: number }
      const start = ymd(year, s.month, s.day)
      const endYear = beforeInYear(e, s) ? year + 1 : year // korsar årsskiftet
      const endInclusive = ymd(endYear, e.month, e.day)
      return [{ year, start, end: addDays(endInclusive, 1), isRange: true }]
    }
  }
}

function shift(date: Date, rule: WeekendRule): Date {
  if (rule === 'none') return date
  const step = rule === 'previous_business_day' ? -1 : 1
  let d = date
  while (!isBusinessDay(d)) d = addDays(d, step)
  return d
}

/** YYYYMMDDTHHMMSSZ från en ISO-timestamp. Ger deterministisk DTSTAMP. */
export function icalTimestamp(iso: string): string {
  const d = new Date(iso)
  const p = (n: number, w = 2) => n.toString().padStart(w, '0')
  return (
    `${p(d.getUTCFullYear(), 4)}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}` +
    `T${p(d.getUTCHours())}${p(d.getUTCMinutes())}${p(d.getUTCSeconds())}Z`
  )
}

function intersectsWindow(startIncl: Date, endExcl: Date, w: Window): boolean {
  return startIncl.getTime() <= w.end.getTime() && endExcl.getTime() > w.start.getTime()
}

/** Stabil UID-kärna utan @domän, t.ex. "deklaration-sista-dag-2026" eller "isk-matning-2026-04". */
function uidCore(rule: Rule, occ: Occurrence): string {
  return occ.uidExtra ? `${rule.id}-${occ.year}-${occ.uidExtra}` : `${rule.id}-${occ.year}`
}

/** Materialiserar en regel till kalenderhändelser (huvud + förvarningar) inom fönstret. */
export function materializeRule(rule: Rule, window: Window): CalEvent[] {
  const dtstamp = icalTimestamp(rule.updatedAt)
  const events: CalEvent[] = []
  const startYear = window.start.getUTCFullYear() - 1
  const endYear = window.end.getUTCFullYear()

  for (let year = startYear; year <= endYear; year++) {
    for (const occ of generateOccurrences(rule, year)) {
      const start = shift(occ.start, rule.weekendRule)
      // För perioder justeras även slutet (inklusiv → justera → exklusiv igen).
      const end = occ.isRange
        ? addDays(shift(addDays(occ.end, -1), rule.weekendRule), 1)
        : addDays(start, 1)

      const core = uidCore(rule, occ)

      if (intersectsWindow(start, end, window)) {
        events.push({
          uid: `${core}@${UID_DOMAIN}`,
          summary: rule.title,
          description: pickDescription(rule, occ.year),
          start,
          end,
          dtstamp,
          isWarning: false,
        })
      }

      // Förvarningar utgår alltid från den (justerade) startdagen.
      for (const days of rule.warnings) {
        const wStart = addDays(start, -days)
        const wEnd = addDays(wStart, 1)
        if (intersectsWindow(wStart, wEnd, window)) {
          events.push({
            uid: `${core}-w${days}@${UID_DOMAIN}`,
            summary: warningSummary(rule, days),
            description: warningDescription(rule, occ.year),
            start: wStart,
            end: wEnd,
            dtstamp,
            isWarning: true,
          })
        }
      }
    }
  }
  return events
}

/**
 * System-händelse den 15 november varje år: tjänsten påminner sin egen underhållare
 * att verifiera nästa års datum. Kräver ingen källa/verifiering (genereras av oss).
 */
export function systemMaintenanceEvents(window: Window): CalEvent[] {
  const events: CalEvent[] = []
  for (let year = window.start.getUTCFullYear(); year <= window.end.getUTCFullYear(); year++) {
    const start = ymd(year, 11, 15)
    const end = addDays(start, 1)
    if (!intersectsWindow(start, end, window)) continue
    events.push({
      uid: `system-verifiering-${year}@${UID_DOMAIN}`,
      summary: 'Dags att verifiera nästa års datum',
      description: `Kontrollera att kommande datum stämmer mot myndigheternas kalendrar. Regler och källor: ${REPO_URL}`,
      start,
      end,
      dtstamp: icalTimestamp(`${year}-11-15T09:00:00Z`),
      isWarning: false,
    })
  }
  return events
}

/** Materialiserar flera regler + systemhändelser, sorterade på startdatum. */
export function materializeAll(rules: Rule[], window: Window): CalEvent[] {
  const events = rules.flatMap((r) => materializeRule(r, window))
  events.push(...systemMaintenanceEvents(window))
  events.sort((a, b) => a.start.getTime() - b.start.getTime() || a.uid.localeCompare(b.uid))
  return events
}
