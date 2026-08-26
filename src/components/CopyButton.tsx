import { useState } from 'react'

/** Kopierar en text till urklipp och visar en kort bekräftelse. */
export default function CopyButton({ value, label = 'Kopiera länk' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Fallback: markera inget - låt användaren kopiera manuellt via länken.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100"
    >
      {copied ? 'Kopierad' : label}
    </button>
  )
}
