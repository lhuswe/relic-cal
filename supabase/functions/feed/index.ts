// Genererar .ics-feeds live från Postgres. Att redigera en regel i Supabase Studio
// uppdaterar feeden direkt – ingen omdeploy behövs.
//
//   GET /feed                       → alla publicerade moduler i en feed
//   GET /feed/skatt-privat          → en modul
//   GET /feed?modules=skatt-privat,hushall  → flera moduler i en feed
//
// Läser ENDAST vyn published_rules (overifierat läcker aldrig ut).

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { cors, calendarResponse, errorResponse } from '../_shared/cors.ts'
import { materializeAll, defaultWindow } from '../_shared/lib/engine.ts'
import { renderCalendar } from '../_shared/lib/ical.ts'
import { DISCLAIMER } from '../_shared/lib/config.ts'
import type { Rule } from '../_shared/lib/types.ts'

interface ModuleRow {
  id: string
  title: string
}

interface RuleRow {
  id: string
  module_id: string
  type: Rule['type']
  params: Rule['params']
  weekend_rule: Rule['weekendRule']
  warnings: number[]
  title: string
  descriptions: string[]
  source: string
  verified: string | null
  updated_at: string
}

function toRule(row: RuleRow): Rule {
  return {
    id: row.id,
    moduleId: row.module_id,
    type: row.type,
    params: row.params,
    weekendRule: row.weekend_rule,
    warnings: row.warnings ?? [],
    title: row.title,
    descriptions: row.descriptions,
    source: row.source,
    verified: row.verified,
    updatedAt: row.updated_at,
  }
}

/** Plockar ut önskade modul-slugs ur path och query. */
function requestedModules(url: URL): string[] {
  const fromQuery = [
    ...(url.searchParams.get('modules')?.split(',') ?? []),
    ...(url.searchParams.get('module') ? [url.searchParams.get('module')!] : []),
  ]
  // Path: .../feed eller .../feed/<slug>
  const seg = url.pathname.split('/').filter(Boolean)
  const idx = seg.lastIndexOf('feed')
  const fromPath = idx >= 0 && seg[idx + 1] ? [seg[idx + 1].replace(/\.ics$/, '')] : []

  return [...fromPath, ...fromQuery].map((s) => s.trim()).filter(Boolean)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'GET') return errorResponse('Endast GET stöds.', 405)

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    // Publicerade moduler (RLS ger bara published = true).
    const { data: moduleRows, error: modErr } = await supabase
      .from('modules')
      .select('id, title')
      .order('sort_order')
    if (modErr) return errorResponse(`Kunde inte läsa moduler: ${modErr.message}`, 500)

    const modules = (moduleRows ?? []) as ModuleRow[]
    const available = new Set(modules.map((m) => m.id))

    let wanted = requestedModules(new URL(req.url))
    if (wanted.length === 0) wanted = [...available] // ingen angiven → alla

    const unknown = wanted.filter((m) => !available.has(m))
    if (unknown.length > 0) {
      return errorResponse(`Okänd eller opublicerad modul: ${unknown.join(', ')}`, 404)
    }

    const { data: ruleRows, error: ruleErr } = await supabase
      .from('published_rules')
      .select('*')
      .in('module_id', wanted)
    if (ruleErr) return errorResponse(`Kunde inte läsa regler: ${ruleErr.message}`, 500)

    const rules = ((ruleRows ?? []) as RuleRow[]).map(toRule)
    const events = materializeAll(rules, defaultWindow(new Date()))

    const single = wanted.length === 1 ? modules.find((m) => m.id === wanted[0]) : undefined
    const calName = single
      ? `${single.title} – Enheten för schemalagd verksamhet`
      : 'Enheten för schemalagd verksamhet'
    const calDesc = `Svenska deadlines i din kalender. ${DISCLAIMER}`
    const filename = `${single ? single.id : 'alla'}.ics`

    const body = renderCalendar({ name: calName, description: calDesc, events })
    return calendarResponse(body, filename)
  } catch (e) {
    return errorResponse(`Fel vid generering: ${String(e)}`, 500)
  }
})
