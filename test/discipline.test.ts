import { describe, it, expect } from 'vitest'
import {
  RULES,
  PUBLISHED_RULES,
  MODULES,
} from '../supabase/functions/_shared/lib/seed-rules.ts'
import { materializeAll, defaultWindow } from '../supabase/functions/_shared/lib/engine.ts'

const window = defaultWindow(new Date(Date.UTC(2026, 0, 1)))

describe('datadisciplin', () => {
  it('publicerbara regler bär alltid källa och verifiering', () => {
    for (const r of PUBLISHED_RULES) {
      expect(r.source.trim().length).toBeGreaterThan(0)
      expect(r.verified).not.toBeNull()
    }
  })

  it('overifierad modul D läcker aldrig in bland publicerbara regler', () => {
    const dRuleIds = RULES.filter((r) => r.moduleId === 'foretagare').map((r) => r.id)
    const publishedIds = PUBLISHED_RULES.map((r) => r.id)
    for (const id of dRuleIds) expect(publishedIds).not.toContain(id)
  })

  it('modul foretagare är inte publicerad', () => {
    expect(MODULES.find((m) => m.id === 'foretagare')!.published).toBe(false)
  })

  it('ingen händelse från en overifierad regel hamnar i en genererad feed', () => {
    const events = materializeAll(PUBLISHED_RULES, window)
    const leaked = events.filter((e) =>
      RULES.some((r) => !r.published && e.uid.startsWith(`${r.id}-`))
    )
    expect(leaked).toEqual([])
  })
})
