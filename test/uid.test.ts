import { describe, it, expect } from 'vitest'
import { materializeAll, defaultWindow } from '../supabase/functions/_shared/lib/engine.ts'
import { renderCalendar } from '../supabase/functions/_shared/lib/ical.ts'
import { PUBLISHED_RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'

// Projektets viktigaste krav: samma bygge → samma UID:er → inga dubbletter för prenumeranter.
const window = defaultWindow(new Date(Date.UTC(2026, 0, 1)))

describe('UID-stabilitet', () => {
  it('två genereringar ger identisk UID-mängd', () => {
    const uids1 = materializeAll(PUBLISHED_RULES, window).map((e) => e.uid)
    const uids2 = materializeAll(PUBLISHED_RULES, window).map((e) => e.uid)
    expect(uids2).toEqual(uids1)
  })

  it('alla UID:er är unika', () => {
    const uids = materializeAll(PUBLISHED_RULES, window).map((e) => e.uid)
    expect(new Set(uids).size).toBe(uids.length)
  })

  it('oförändrad data → byte-identisk .ics', () => {
    const events = materializeAll(PUBLISHED_RULES, window)
    const a = renderCalendar({ name: 'Test', description: 'Test', events })
    const b = renderCalendar({ name: 'Test', description: 'Test', events })
    expect(b).toBe(a)
  })

  it('alla UID:er ligger i @cal.relic.se-namnrymden', () => {
    for (const uid of materializeAll(PUBLISHED_RULES, window).map((e) => e.uid)) {
      expect(uid.endsWith('@cal.relic.se')).toBe(true)
    }
  })
})
