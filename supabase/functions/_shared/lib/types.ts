// Delade typer för regelmotorn. Fältnamn på engelska; DB-rader mappas hit i feed-funktionen.

export type RuleType =
  | 'fixed_date'
  | 'day_of_month'
  | 'quarterly'
  | 'nth_weekday'
  | 'date_range'

export type WeekendRule = 'next_business_day' | 'previous_business_day' | 'none'

export interface MonthDay {
  month: number // 1-12
  day: number //   1-31
}

/** Typspecifika parametrar. Motsvarar `params jsonb`-kolumnen i `rules`. */
export type RuleParams =
  | { month: number; day: number } // fixed_date
  | { day: number } //               day_of_month (samma dag varje månad)
  | { months: number[]; day: number } // quarterly (t.ex. [1,4,7,10], dag 1)
  | { n: number | 'last'; weekday: number; month: number } // nth_weekday (weekday 0=sön..6=lör)
  | { start: MonthDay; end: MonthDay } // date_range (kan korsa årsskiftet)

export interface Rule {
  id: string //           stabil kebab-case, ändras ALDRIG (UID-stabilitet)
  moduleId: string
  type: RuleType
  params: RuleParams
  weekendRule: WeekendRule
  warnings: number[] //   förvarningsdagar, t.ex. [30, 7]
  title: string
  descriptions: string[] // ≥1 variant, roteras på år
  source: string
  verified: string | null // ISO-datum
  updatedAt: string //    ISO-timestamp, ger deterministisk DTSTAMP
}

/** Ett konkret, materialiserat kalenderhändelse redo för iCal-rendering. */
export interface CalEvent {
  uid: string
  summary: string
  description: string
  start: Date //   heldag, midnatt UTC
  end: Date //     exklusiv (dagen efter för punkthändelser)
  dtstamp: string // UTC-timestamp (YYYYMMDDTHHMMSSZ)
  isWarning: boolean
}
