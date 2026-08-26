// Minimal typning för Supabase-klienten. Endast det SPA:n läser (publika moduler).
// Feed-funktionen har egna typer i sitt Deno-sammanhang.

export interface Database {
  public: {
    Tables: {
      modules: {
        Row: {
          id: string
          title: string
          description: string
          published: boolean
          sort_order: number
        }
        Insert: never
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
  }
}
