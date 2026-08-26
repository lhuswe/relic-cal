import { Link } from 'react-router-dom'

// Platshållare för framtida inloggat admin-UI. I V1 sköts allt underhåll i Supabase Studio:
// lägg till/ändra rader i tabellen `rules`, sätt published=true (kräver source + verified),
// och feeden uppdateras direkt utan omdeploy.
export default function Admin() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold text-brand-900">Underhåll</h1>
      <p className="mt-3 text-brand-600">
        I den här versionen redigeras datum direkt i Supabase Studio – tabellen{' '}
        <code className="rounded bg-brand-100 px-1">rules</code>. Databasen vägrar publicera en
        regel utan källa och verifieringsdatum, så ett felaktigt eller ostyrkt datum kan inte
        nå en feed.
      </p>
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-brand-600">
        <li>
          Ändra en rad → sätt <code className="rounded bg-brand-100 px-1">published = true</code>{' '}
          (med <code className="rounded bg-brand-100 px-1">source</code> och{' '}
          <code className="rounded bg-brand-100 px-1">verified</code> ifyllda).
        </li>
        <li>
          Den 15 november varje år lägger tjänsten själv in en påminnelse om att verifiera nästa
          års datum.
        </li>
        <li>Inloggat admin-gränssnitt är förberett i schemat och kommer senare.</li>
      </ul>
      <p className="mt-6">
        <Link to="/" className="text-brand-700 underline hover:text-brand-800">
          ← Till startsidan
        </Link>
      </p>
    </div>
  )
}
