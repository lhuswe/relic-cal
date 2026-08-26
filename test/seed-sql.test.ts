import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MODULES, RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'

// Vaktar att supabase/seed.sql och seed-rules.ts inte glider isär.
const sql = readFileSync(
  fileURLToPath(new URL('../supabase/seed.sql', import.meta.url)),
  'utf8'
)

describe('seed.sql speglar seed-rules.ts', () => {
  it.each(MODULES.map((m) => m.id))('modulen %s finns i seed.sql', (id) => {
    expect(sql).toContain(`'${id}'`)
  })

  it.each(RULES.map((r) => r.id))('regeln %s finns i seed.sql', (id) => {
    expect(sql).toContain(`'${id}'`)
  })

  it('varje publicerbar regels titel finns i seed.sql', () => {
    for (const r of RULES.filter((r) => r.published)) {
      expect(sql).toContain(r.title)
    }
  })
})
