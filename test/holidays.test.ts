import { describe, it, expect } from 'vitest'
import {
  easterSunday,
  formatDate,
  isRedDay,
  isBusinessDay,
  ymd,
  redDays,
} from '../supabase/functions/_shared/lib/holidays.ts'

describe('påskberäkning (Computus)', () => {
  // Tre kända år.
  it.each([
    [2024, '20240331'],
    [2025, '20250420'],
    [2026, '20260405'],
  ])('påskdagen %i = %s', (year, expected) => {
    expect(formatDate(easterSunday(year))).toBe(expected)
  })
})

describe('röda dagar 2026', () => {
  it.each([
    ['20260101', 'nyårsdagen'],
    ['20260106', 'trettondedag jul'],
    ['20260403', 'långfredag'],
    ['20260405', 'påskdagen'],
    ['20260406', 'annandag påsk'],
    ['20260501', 'första maj'],
    ['20260514', 'kristi himmelsfärd'],
    ['20260606', 'nationaldagen'],
    ['20261225', 'juldagen'],
    ['20261226', 'annandag jul'],
  ])('%s är röd (%s)', (yyyymmdd) => {
    const d = ymd(+yyyymmdd.slice(0, 4), +yyyymmdd.slice(4, 6), +yyyymmdd.slice(6, 8))
    expect(isRedDay(d)).toBe(true)
  })

  it('midsommardagen är en lördag mellan 20 och 26 juni', () => {
    const set = redDays(2026)
    const inRange = [20, 21, 22, 23, 24, 25, 26]
      .map((day) => ymd(2026, 6, day))
      .filter((d) => set.has(formatDate(d)) && d.getUTCDay() === 6)
    expect(inRange).toHaveLength(1)
  })

  it('alla helgons dag är en lördag mellan 31 okt och 6 nov', () => {
    const set = redDays(2026)
    const candidates = [ymd(2026, 10, 31), ...[1, 2, 3, 4, 5, 6].map((d) => ymd(2026, 11, d))]
    const found = candidates.filter((d) => set.has(formatDate(d)) && d.getUTCDay() === 6)
    expect(found).toHaveLength(1)
  })
})

describe('vardagsberäkning', () => {
  it('2 maj 2026 (lördag) är inte vardag', () => {
    expect(isBusinessDay(ymd(2026, 5, 2))).toBe(false)
  })
  it('4 maj 2026 (måndag) är vardag', () => {
    expect(isBusinessDay(ymd(2026, 5, 4))).toBe(true)
  })
  it('långfredag 2026 är inte vardag', () => {
    expect(isBusinessDay(ymd(2026, 4, 3))).toBe(false)
  })
  it('första maj 2026 (röd fredag) är inte vardag', () => {
    expect(isBusinessDay(ymd(2026, 5, 1))).toBe(false)
  })
})
