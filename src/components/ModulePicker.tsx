import { useMemo, useState } from 'react'
import CopyButton from './CopyButton'
import { feedUrl, webcalUrl, type FeedModule } from '../lib/feeds'

/** Kryssa i moduler och få en enda prenumererbar kombinerad feed-URL. */
export default function ModulePicker({ modules }: { modules: FeedModule[] }) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(modules.map((m) => m.id)))

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const ids = useMemo(
    () => modules.filter((m) => selected.has(m.id)).map((m) => m.id),
    [modules, selected]
  )
  const url = ids.length > 0 ? feedUrl(ids) : ''

  return (
    <div className="rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-brand-800">Bygg din egen feed</h3>
      <p className="mt-1 text-sm text-brand-500">
        Välj vad du vill ha. Allt hamnar i en och samma prenumeration.
      </p>

      <fieldset className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {modules.map((m) => (
          <label key={m.id} className="flex items-center gap-2 text-sm text-brand-700">
            <input
              type="checkbox"
              checked={selected.has(m.id)}
              onChange={() => toggle(m.id)}
              className="h-4 w-4 rounded border-brand-300 text-brand-700 focus:ring-brand-500"
            />
            {m.title}
          </label>
        ))}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {url ? (
          <>
            <a
              href={webcalUrl(url)}
              className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-800"
            >
              Prenumerera på urvalet
            </a>
            <CopyButton value={url} />
          </>
        ) : (
          <p className="text-sm text-brand-400">Välj minst en modul.</p>
        )}
      </div>
    </div>
  )
}
