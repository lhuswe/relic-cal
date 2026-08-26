import { useEffect, useState } from 'react'
import { fetchModules, type FeedModule } from '../lib/feeds'
import FeedCard from '../components/FeedCard'
import ModulePicker from '../components/ModulePicker'

export default function Home() {
  const [modules, setModules] = useState<FeedModule[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchModules()
      .then(setModules)
      .catch((e) => setError(String(e)))
  }, [])

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-brand-400">
          Enheten för schemalagd verksamhet
        </p>
        <h1 className="mt-2 text-3xl font-bold text-brand-900 sm:text-4xl">
          Svenska deadlines, direkt i din kalender
        </h1>
        <p className="mt-3 text-brand-600">
          Prenumerera en gång. Deklaration, ISK-mätdatum, däckbyte och annat dyker upp
          automatiskt, år efter år. Datumen räknas ut – de är inte hårdkodade – så de flyttar
          rätt när en deadline hamnar på en helg.
        </p>
      </header>

      <div className="mt-6 rounded-lg border border-accent-300 bg-accent-100 px-4 py-3 text-sm text-brand-800">
        Informationen är ingen garanti. Kontrollera alltid mot Skatteverket och andra
        myndigheter.
      </div>

      <section className="mt-10">
        {error && (
          <p className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Kunde inte hämta feeds: {error}
          </p>
        )}
        {!modules && !error && <p className="text-brand-400">Hämtar moduler …</p>}
        {modules && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {modules.map((m) => (
                <FeedCard key={m.id} module={m} />
              ))}
            </div>
            <div className="mt-6">
              <ModulePicker modules={modules} />
            </div>
          </>
        )}
      </section>

      <section className="mt-10 text-sm text-brand-500">
        <h2 className="text-base font-semibold text-brand-700">Så prenumererar du</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Tryck på Prenumerera, eller kopiera länken.</li>
          <li>Klistra in den i din kalenderapp (Google, Apple eller Outlook) som ny kalender-URL.</li>
          <li>Klart. Nya datum kommer in av sig själva.</li>
        </ol>
      </section>
    </div>
  )
}
