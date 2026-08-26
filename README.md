# Enheten för schemalagd verksamhet

Svensk deadline-kalender som prenumererbar `.ics`-feed. Deklaration, ISK-mätdatum,
däckbyte och liknande – uträknade från regler, inte hårdkodade datum – levererade live
från en databas så att en redigering syns i feeden utan omdeploy.

Domän: **cal.relic.se** · UID-namnrymd (permanent): **`@cal.relic.se`**

## Arkitektur

```
Kalenderapp ──prenumererar──▶  Supabase Edge Function (Deno)  ──läser──▶  Postgres
                               genererar .ics live                        (vyn published_rules)
Webbläsare ──▶  cal.relic.se (React/Vite): landning, prenumerationsknappar, modulväljare
```

Regelmotorn, iCal-genereringen, helgdagarna och tonhanteringen ligger som ramverksfria
TS-moduler i `supabase/functions/_shared/lib/` och används av **både** edge-funktionen
(Deno) och testerna (Vitest).

Eftersom feeden genereras per anrop med ett rullande 24-månadersfönster **behövs ingen
månadscron** – fönstret flyttar sig av sig självt.

## Kärnkrav som bevaras

- **Deterministiska UID:er** `{regel-id}-{år}[-{MM}][-w{dagar}]@cal.relic.se` – samma
  händelse får samma UID varje gång, inga dubbletter hos prenumeranter.
- **Datadisciplin** – en `CHECK`-constraint vägrar publicera en regel utan `source` +
  `verified`; vyn `published_rules` filtrerar bort allt overifierat. Modul D (företagare)
  är seedad som opublicerad och når aldrig en feed.
- **iCal-korrekthet** – heldagshändelser, folding vid 75 oktetter, escaping, ingen VALARM,
  rätt kalenderheaders, ansvarsfriskrivning.
- **Ton** – sakliga titlar, torrt skämt i beskrivningen, max en emoji i titeln, inga
  utropstecken, varierade beskrivningar som roteras på år.

## Utveckling

```bash
npm install
npm test                 # regelmotor, helgdagar, UID-stabilitet, folding, disciplin

# Lokal Supabase (kräver Supabase CLI + Docker):
supabase start
supabase db reset        # kör migrationer + seed.sql
supabase functions serve feed --env-file supabase/.env.local

# SPA:
cp .env.example .env     # fyll i värden från det NYA Supabase-projektet
npm run dev
```

Feed-exempel: `GET /feed/skatt-privat`, `GET /feed?modules=skatt-privat,hushall`,
`GET /feed` (alla publicerade moduler).

## Redigera datum (V1)

Allt underhåll sker i **Supabase Studio**, tabellen `rules`. Sätt `published = true` med
`source` och `verified` ifyllda – annars vägrar databasen. Feeden uppdateras direkt.
Ett inloggat admin-UI är förberett i schemat (`profiles.role`, RLS) och kommer senare.

> ⚠️ Källorna i `seed.sql` är kanoniska myndighetssidor men **måste kontrolleras** mot
> Skatteverkets och övriga myndigheters kalendrar inför publik lansering. Ett felaktigt
> datum är sämre än inget datum.

## Deploy

- **SPA** → GitHub Pages via `.github/workflows/deploy.yml` (repo-variabler
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_FEED_BASE_URL`). Custom domain
  `cal.relic.se` via `public/CNAME`.
- **Edge-funktion** → `.github/workflows/deploy-functions.yml` (secrets
  `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`), eller manuellt
  `supabase functions deploy feed`.
