// iCal-rendering (RFC 5545). Skrivs för hand: heldagshändelser, korrekt folding och
// escaping, inga tidszoner, ingen VALARM. Detta är den vanligaste orsaken till att en
// feed vägrar importeras, så det görs noggrant.

import { PRODID } from './config.ts'
import { formatDate } from './holidays.ts'
import type { CalEvent } from './types.ts'

const enc = new TextEncoder()
const CRLF = '\r\n'

/** Escaping av TEXT-värden: bakåtsnedstreck först, sedan ; , och radbrytningar. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\n|\r/g, '\\n')
}

/**
 * Radbrytning (folding) vid 75 oktetter. Fortsättningsrader inleds med ett mellanslag.
 * Bryter aldrig mitt i ett UTF-8-tecken (räknar oktetter per tecken).
 */
export function foldLine(line: string): string {
  let out = ''
  let cur = ''
  let curBytes = 0
  let limit = 75 // första raden: 75 oktetter; fortsättningsrader: 74 + ledande blank = 75
  for (const ch of Array.from(line)) {
    const b = enc.encode(ch).length
    if (curBytes + b > limit) {
      out += cur + CRLF + ' '
      cur = ''
      curBytes = 0
      limit = 74
    }
    cur += ch
    curBytes += b
  }
  return out + cur
}

/** En egenskapsrad "NAME;PARAM:VALUE", foldad. */
function prop(name: string, value: string): string {
  return foldLine(`${name}:${value}`)
}

function renderEvent(ev: CalEvent): string[] {
  return [
    'BEGIN:VEVENT',
    prop('UID', ev.uid),
    prop('DTSTAMP', ev.dtstamp),
    prop('DTSTART;VALUE=DATE', formatDate(ev.start)),
    prop('DTEND;VALUE=DATE', formatDate(ev.end)),
    prop('SUMMARY', escapeText(ev.summary)),
    prop('DESCRIPTION', escapeText(ev.description)),
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
  ]
}

export interface CalendarInput {
  name: string //        X-WR-CALNAME
  description: string // X-WR-CALDESC (bör innehålla ansvarsfriskrivning)
  events: CalEvent[]
}

/** Renderar en komplett VCALENDAR med CRLF-radslut. */
export function renderCalendar(input: CalendarInput): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    prop('PRODID', PRODID),
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    prop('X-WR-CALNAME', escapeText(input.name)),
    prop('X-WR-CALDESC', escapeText(input.description)),
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
    ...input.events.flatMap(renderEvent),
    'END:VCALENDAR',
  ]
  return lines.join(CRLF) + CRLF
}
