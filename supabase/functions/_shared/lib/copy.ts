// Tonhantering: väljer beskrivningsvariant per år och formulerar förvarningstexter.
//
// Tonregler (specen §6), som copy-lint-testet vaktar mekaniskt:
//  - saklig titel, skämtet i beskrivningen
//  - max en emoji i titeln, ingen i beskrivningen
//  - inga utropstecken
//  - variera: rotera beskrivningsvarianter på år

import type { Rule } from './types.ts'

/** Väljer årets beskrivningsvariant. Roterar deterministiskt så samma år ger samma text. */
export function pickDescription(rule: Rule, year: number): string {
  const variants = rule.descriptions
  if (variants.length === 0) return ''
  // Icke-negativ modulo även om year skulle vara märkligt.
  const idx = ((year % variants.length) + variants.length) % variants.length
  return variants[idx]
}

/** Tar bort en inledande emoji (+ ev. mellanslag) så förvarningstiteln blir emojifri. */
export function stripLeadingEmoji(title: string): string {
  // \p{Extended_Pictographic} täcker emoji; ta bort ledande sådana + efterföljande blank.
  return title.replace(/^\s*\p{Extended_Pictographic}️?\s*/u, '').trim()
}

/** Kort, sekundär förvarningstitel utan emoji: "30 dagar kvar: Sista dagen att deklarera". */
export function warningSummary(rule: Rule, days: number): string {
  return `${days} dagar kvar: ${stripLeadingEmoji(rule.title)}`
}

/** Första meningen ur en text (för en kortare förvarningsbeskrivning). */
function firstSentence(text: string): string {
  const trimmed = text.trim()
  const match = trimmed.match(/^[^.]*\./)
  return (match ? match[0] : trimmed).trim()
}

/** Kort förvarningsbeskrivning – återanvänder årets variant men bara första meningen. */
export function warningDescription(rule: Rule, year: number): string {
  return `Förvarning. ${firstSentence(pickDescription(rule, year))}`
}
