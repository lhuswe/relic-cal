import { describe, it, expect } from 'vitest'
import { materializeRule, defaultWindow } from '../supabase/functions/_shared/lib/engine.ts'
import { formatDate } from '../supabase/functions/_shared/lib/holidays.ts'
import type { Rule } from '../supabase/functions/_shared/lib/types.ts'

const window = defaultWindow(new Date(Date.UTC(2026, 0, 1)))

function base(overrides: Partial<Rule>): Rule {
  return {
    id: 'test',
    moduleId: 'test',
    type: 'fixed_date',
    params: { month: 5, day: 2 },
    weekendRule: 'none',
    warnings: [],
    title: 'Test',
    descriptions: ['Beskrivning.'],
    source: 'https://example.se',
    verified: '2026-08-26',
    updatedAt: '2026-08-26T00:00:00Z',
    ...overrides,
  }
}

function mainStartFor(rule: Rule, year: number): string {
  const ev = materializeRule(rule, window).find((e) => e.uid.startsWith(`${rule.id}-${year}@`))
  if (!ev) throw new Error('händelse saknas')
  return formatDate(ev.start)
}

describe('weekend_rule', () => {
  it('next_business_day: 2 maj 2026 (lör) → 4 maj (mån)', () => {
    const rule = base({ id: 'deadline', weekendRule: 'next_business_day' })
    expect(mainStartFor(rule, 2026)).toBe('20260504')
  })

  it('next_business_day hoppar över röd dag: 1 maj 2026 (röd fre) → 4 maj (mån)', () => {
    const rule = base({ id: 'redday', params: { month: 5, day: 1 }, weekendRule: 'next_business_day' })
    expect(mainStartFor(rule, 2026)).toBe('20260504')
  })

  it('previous_business_day: 2 maj 2026 (lör) → 1 maj är röd → 30 apr (tors)', () => {
    const rule = base({ id: 'prev', weekendRule: 'previous_business_day' })
    expect(mainStartFor(rule, 2026)).toBe('20260430')
  })

  it('none: ligger kvar på 2 maj 2026', () => {
    const rule = base({ id: 'stay', weekendRule: 'none' })
    expect(mainStartFor(rule, 2026)).toBe('20260502')
  })
})
