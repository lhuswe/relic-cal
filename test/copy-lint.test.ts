import { describe, it, expect } from 'vitest'
import { RULES, PUBLISHED_RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'
import { warningSummary, warningDescription } from '../supabase/functions/_shared/lib/copy.ts'

const emojiCount = (s: string): number => (s.match(/\p{Extended_Pictographic}/gu) ?? []).length

describe('ton: titlar', () => {
  it.each(RULES.map((r) => [r.id, r.title] as const))('%s: titeln följer tonreglerna', (_id, title) => {
    expect(title).not.toContain('!') //     inga utropstecken
    expect(emojiCount(title)).toBeLessThanOrEqual(1) // max en emoji
  })
})

describe('ton: beskrivningar', () => {
  it.each(RULES.flatMap((r) => r.descriptions.map((d) => [r.id, d] as const)))(
    '%s: beskrivning saklig och emojifri',
    (_id, description) => {
      expect(description).not.toContain('!')
      expect(emojiCount(description)).toBe(0)
    }
  )
})

describe('ton: förvarningstexter', () => {
  it.each(PUBLISHED_RULES.filter((r) => r.warnings.length > 0).map((r) => [r.id, r] as const))(
    '%s: förvarning kort, emojifri, utan utropstecken',
    (_id, rule) => {
      const days = rule.warnings[0]
      const summary = warningSummary(rule, days)
      const desc = warningDescription(rule, 2026)
      expect(emojiCount(summary)).toBe(0)
      expect(summary).not.toContain('!')
      expect(emojiCount(desc)).toBe(0)
      expect(desc).not.toContain('!')
    }
  )
})
