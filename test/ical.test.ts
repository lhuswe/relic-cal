import { describe, it, expect } from 'vitest'
import { renderCalendar, escapeText, foldLine } from '../supabase/functions/_shared/lib/ical.ts'
import { materializeAll, defaultWindow } from '../supabase/functions/_shared/lib/engine.ts'
import { PUBLISHED_RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'
import type { CalEvent } from '../supabase/functions/_shared/lib/types.ts'

const enc = new TextEncoder()
const window = defaultWindow(new Date(Date.UTC(2026, 0, 1)))
const ics = renderCalendar({
  name: 'Enheten för schemalagd verksamhet – test',
  description: 'Beskrivning med ansvarsfriskrivning.',
  events: materializeAll(PUBLISHED_RULES, window),
})

describe('kalenderstruktur', () => {
  it('inramas av VCALENDAR och har rätt headers', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('VERSION:2.0')
    expect(ics).toContain('REFRESH-INTERVAL;VALUE=DURATION:PT12H')
    expect(ics).toContain('X-PUBLISHED-TTL:PT12H')
  })

  it('heldagshändelser utan tidszon och utan VALARM', () => {
    expect(ics).toContain('DTSTART;VALUE=DATE:')
    expect(ics).toContain('DTEND;VALUE=DATE:')
    expect(ics).not.toContain('TZID')
    expect(ics).not.toContain('VALARM')
  })

  it('använder CRLF radslut', () => {
    expect(ics.includes('\r\n')).toBe(true)
    // Ingen ensam \n utan föregående \r.
    expect(/[^\r]\n/.test(ics)).toBe(false)
  })
})

describe('folding vid 75 oktetter', () => {
  it('ingen fysisk rad överstiger 75 oktetter', () => {
    for (const line of ics.split('\r\n')) {
      expect(enc.encode(line).length).toBeLessThanOrEqual(75)
    }
  })

  it('bryter inte mitt i ett flerbytes-tecken (å ä ö intakta efter unfold)', () => {
    const long = 'Å' + 'ä'.repeat(100) + 'ö'
    const folded = foldLine(`SUMMARY:${long}`)
    const unfolded = folded.replace(/\r\n /g, '')
    expect(unfolded).toBe(`SUMMARY:${long}`)
  })
})

describe('escaping', () => {
  it('escapar \\ ; , och radbrytning i rätt ordning', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne')
  })

  it('renderad DESCRIPTION innehåller escapade tecken', () => {
    const ev: CalEvent = {
      uid: 'x-2026@cal.relic.se',
      summary: 'Rubrik',
      description: 'Ett; två, tre\nfyra',
      start: new Date(Date.UTC(2026, 0, 1)),
      end: new Date(Date.UTC(2026, 0, 2)),
      dtstamp: '20260826T000000Z',
      isWarning: false,
    }
    const out = renderCalendar({ name: 'n', description: 'd', events: [ev] })
    expect(out).toContain('DESCRIPTION:Ett\\; två\\, tre\\nfyra')
  })
})
