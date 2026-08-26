import CopyButton from './CopyButton'
import { feedUrl, webcalUrl, type FeedModule } from '../lib/feeds'

/** Ett kort per modul med prenumerations- och kopieringsknapp. */
export default function FeedCard({ module }: { module: FeedModule }) {
  const url = feedUrl([module.id])

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-brand-800">{module.title}</h3>
        <p className="mt-1 text-sm text-brand-500">{module.description}</p>
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-2">
        <a
          href={webcalUrl(url)}
          className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-800"
        >
          Prenumerera
        </a>
        <CopyButton value={url} />
      </div>
    </div>
  )
}
