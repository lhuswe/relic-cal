// Genererar en exempelfeed från seed-datan och skriver den till stdout.
// Kör: node --experimental-strip-types scripts/preview-feed.ts > sample.ics
import { materializeAll, defaultWindow } from '../supabase/functions/_shared/lib/engine.ts'
import { renderCalendar } from '../supabase/functions/_shared/lib/ical.ts'
import { DISCLAIMER } from '../supabase/functions/_shared/lib/config.ts'
import { PUBLISHED_RULES } from '../supabase/functions/_shared/lib/seed-rules.ts'

const events = materializeAll(PUBLISHED_RULES, defaultWindow(new Date(Date.UTC(2026, 0, 1))))
process.stdout.write(
  renderCalendar({
    name: 'Enheten för schemalagd verksamhet',
    description: `Svenska deadlines i din kalender. ${DISCLAIMER}`,
    events,
  })
)
