import { describe, it, expect } from 'vitest'
import {
  materializeRule,
  materializeAll,
  defaultWindow,
} from '../supabase/functions/_shared/lib/engine.ts'
import { formatDate } from '../supabase/functions/_shared/lib/holidays.ts'
import { PUBLISHED_RULES, RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'
import type { Rule } from '../supabase/functions/_shared/lib/types.ts'

const window = defaultWindow(new Date(Date.UTC(2026, 0, 1)))
const byId = (id: string): Rule => {
  const r = RULES.find((x) => x.id === id)
  if (!r) throw new Error(`saknar regel ${id}`)
  return r
}

describe('regeltyper', () => {
  it('quarterly: fyra ISK-mätningar 2026 med distinkta UID:er', () => {
    const events = materializeRule(byId('isk-matning'), window).filter((e) =>
      e.uid.includes('-2026-')
    )
    const uids = events.map((e) => e.uid).sort()
    expect(uids).toEqual([
      'isk-matning-2026-01@cal.relic.se',
      'isk-matning-2026-04@cal.relic.se',
      'isk-matning-2026-07@cal.relic.se',
      'isk-matning-2026-10@cal.relic.se',
    ])
    expect(formatDate(events.find((e) => e.uid.includes('-01@'))!.start)).toBe('20260101')
  })

  it('nth_weekday last Sunday: sommartid 2026 är en söndag sent i mars', () => {
    const ev = materializeRule(byId('sommartid'), window).find((e) => e.uid.includes('-2026@'))!
    expect(ev.start.getUTCMonth()).toBe(2) // mars
    expect(ev.start.getUTCDay()).toBe(0) // söndag
    expect(ev.start.getUTCDate()).toBeGreaterThanOrEqual(25) // sista veckan
  })

  it('date_range vinterdäck 2026: 1 dec → exklusiv slut 1 apr 2027', () => {
    const ev = materializeRule(byId('vinterdack'), window).find((e) => e.uid.includes('-2026@'))!
    expect(formatDate(ev.start)).toBe('20261201')
    expect(formatDate(ev.end)).toBe('20270401')
  })

  it('day_of_month: tolv arbetsgivardeklarationer per år', () => {
    const rule = byId('arbetsgivardeklaration')
    const events2026 = materializeRule(rule, window).filter((e) => e.uid.includes('-2026-'))
    expect(events2026).toHaveLength(12)
  })
})

describe('förvarningar', () => {
  it('deklaration-sista-dag ger -w30 och -w7 med kortare titel utan emoji', () => {
    const events = materializeRule(byId('deklaration-sista-dag'), window)
    const w30 = events.find((e) => e.uid === 'deklaration-sista-dag-2026-w30@cal.relic.se')!
    expect(w30).toBeTruthy()
    expect(w30.summary).toBe('30 dagar kvar: Sista dagen att deklarera')
    expect(events.some((e) => e.uid.endsWith('-w7@cal.relic.se'))).toBe(true)
  })
})

describe('systemhändelse', () => {
  it('15 november genereras varje år', () => {
    const all = materializeAll([], window)
    const nov = all.filter((e) => e.uid.startsWith('system-verifiering-'))
    expect(nov.length).toBeGreaterThanOrEqual(1)
    expect(formatDate(nov[0].start).slice(4)).toBe('1115')
  })
})

describe('fönster', () => {
  it('materializeAll sorteras på startdatum', () => {
    const all = materializeAll(PUBLISHED_RULES, window)
    for (let i = 1; i < all.length; i++) {
      expect(all[i].start.getTime()).toBeGreaterThanOrEqual(all[i - 1].start.getTime())
    }
  })
})
