-- Startdata. Speglar supabase/functions/_shared/lib/seed-rules.ts (drift-vaktas av
-- test/seed-sql.test.ts). Modul D (foretagare) är overifierad och publiceras aldrig.
--
-- DATADISCIPLIN: källorna nedan MÅSTE kontrolleras mot myndigheternas kalendrar inför
-- publik lansering. Ett felaktigt datum är sämre än inget datum.

insert into modules (id, title, description, published, sort_order) values
  ('skatt-privat', 'Skatt & deklaration', 'Deklarationsdatum och skattekonto för privatpersoner.', true,  1),
  ('sparande',     'Sparande',            'ISK-mätdatum och statslåneränta.',                          true,  2),
  ('hushall',      'Hushåll',             'Sommar-/vintertid, vinterdäck och brandvarnare.',           true,  3),
  ('foretagare',   'Företagare',          'Ännu ej verifierat - publiceras inte.',                     false, 4)
on conflict (id) do nothing;

-- Fast updated_at ger deterministiska DTSTAMP tills en rad redigeras.
insert into rules
  (id, module_id, type, params, weekend_rule, warnings, title, descriptions, data, source, verified, published, updated_at)
values
  -- ---------- Modul A - Skatt & deklaration ----------
  ('skattekonto-extra-inbetalning', 'skatt-privat', 'fixed_date',
   '{"month":2,"day":12}', 'next_business_day', '{7}',
   'Extra inbetalning till skattekontot',
   array[
     'Räknar du med kvarskatt över 30 000 kr börjar kostnadsräntan ticka efter idag. En inbetalning i tid slipper du den.',
     'Efter idag kostar en väntad kvarskatt över 30 000 kr ränta. Ju tidigare inbetalning, desto mindre ränta.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('deklaration-utskick', 'skatt-privat', 'date_range',
   '{"start":{"month":3,"day":2},"end":{"month":3,"day":6}}', 'none', '{}',
   'Deklarationen skickas ut',
   array[
     'Under de här dagarna landar deklarationen i digitala brevlådor. Har du en sådan kommer den tidigt.',
     'Nu skickas deklarationerna till digitala brevlådor. Papperslådan får vänta några veckor till.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('etjanst-oppnar', 'skatt-privat', 'fixed_date',
   '{"month":3,"day":17}', 'none', '{}',
   'E-tjänsten för deklaration öppnar',
   array[
     'Deklarationen finns nu i Skatteverkets app och e-tjänst. Ja, en del gör den samma kväll.',
     'Nu går det att deklarera digitalt. Exakt datum kan flytta något mellan år.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('deklarera-digitalt-tidig-aterbaring', 'skatt-privat', 'fixed_date',
   '{"month":3,"day":31}', 'none', '{7}',
   'Godkänn digitalt för tidig återbäring',
   array[
     'Godkänner du utan ändringar idag kommer eventuell återbäring i april i stället för i juni. Två månader för fem minuters jobb.',
     'Sista chansen att godkänna utan ändringar och få återbäringen tidigt. Efter idag hamnar den längre bak i kön.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('deklaration-sista-dag', 'skatt-privat', 'fixed_date',
   '{"month":5,"day":2}', 'next_business_day', '{30,7}',
   '📮 Sista dagen att deklarera',
   array[
     'Efter idag byter Skatteverket ut ordet återbäring mot förseningsavgift.',
     'Sista dagen att lämna deklarationen utan anstånd. Därefter blir det förseningsavgift i stället.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('kvarskatt-info', 'skatt-privat', 'fixed_date',
   '{"month":6,"day":1}', 'none', '{}',
   'Så räknas datumet för kvarskatt',
   array[
     'Kvarskatt ska betalas 90 dagar efter beslutet om din slutliga skatt. Datumet är alltså personligt och står på ditt slutskattebesked.'
   ],
   '{}', 'https://www.skatteverket.se/privat/skatter/deklaration/skattaterbaringochkvarskatt', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  -- ---------- Modul B - Sparande ----------
  ('isk-matning', 'sparande', 'quarterly',
   '{"months":[1,4,7,10],"day":1}', 'none', '{}',
   '💰 ISK-mätning',
   array[
     'Värdet på kontot mäts idag och vägs in i årets kapitalunderlag. Ett av fyra mättillfällen.',
     'Idag mäts ISK-värdet för kapitalunderlaget. Ingen panik, det upprepas varje kvartal.'
   ],
   '{"fribelopp_kr":300000,"schablonranta":0.0355,"ar":2026}',
   'https://www.skatteverket.se/privat/skatter/vardepapper/investeringssparkontoisk', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('statslanerantan-faststalls', 'sparande', 'fixed_date',
   '{"month":11,"day":30}', 'none', '{}',
   'Statslåneräntan fastställs',
   array[
     'Riksgälden sätter räntan som avgör nästa års ISK-skatt. Ren nyfikenhetspost.',
     'Idag bestäms statslåneräntan i slutet av november. Den styr schablonskatten på ISK nästa år.'
   ],
   '{}', 'https://www.riksgalden.se/sv/var-verksamhet/statslanerantan/', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  -- ---------- Modul C - Hushåll ----------
  ('sommartid', 'hushall', 'nth_weekday',
   '{"n":"last","weekday":0,"month":3}', 'none', '{}',
   'Sommartid börjar',
   array[
     'Klockan ställs fram en timme i natt. Du sover en timme kortare men får ljusare kvällar.',
     'Sommartid: klockan fram en timme. Kaffebryggaren vet inte om det förrän du berättar.'
   ],
   '{}', 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-200152-om-sommartid_sfs-2001-52/', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('vintertid', 'hushall', 'nth_weekday',
   '{"n":"last","weekday":0,"month":10}', 'none', '{}',
   'Vintertid börjar',
   array[
     'Klockan ställs tillbaka en timme i natt. En timme extra sömn, mörkare eftermiddagar.',
     'Vintertid: klockan tillbaka en timme. Den enda natten på året du gärna vaknar för tidigt.'
   ],
   '{}', 'https://www.riksdagen.se/sv/dokument-och-lagar/dokument/svensk-forfattningssamling/forordning-200152-om-sommartid_sfs-2001-52/', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('vinterdack', 'hushall', 'date_range',
   '{"start":{"month":12,"day":1},"end":{"month":3,"day":31}}', 'none', '{}',
   'Vinterdäcksperiod',
   array[
     'Krav på vinterdäck vid vinterväglag under perioden. Det snöade inte i morse är inte ett godkänt argument.'
   ],
   '{}', 'https://www.transportstyrelsen.se/sv/vagtrafik/Trafikregler/Generella-trafikregler/dack/', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  ('brandvarnare-batteri', 'hushall', 'fixed_date',
   '{"month":12,"day":1}', 'none', '{}',
   '🔋 Byt batteri i brandvarnaren',
   array[
     'Annars piper den klockan tre på natten någon gång i februari. Det gör de alltid.',
     'Dags för nytt batteri i brandvarnaren. Passa på nu, inte vid nästa nattliga pip.'
   ],
   '{}', 'https://www.msb.se/sv/rad-till-privatpersoner/brandsakerhet-i-hemmet/brandvarnare/', '2026-08-26', true, '2026-08-26T00:00:00Z'),

  -- ---------- Modul D - Företagare (OVERIFIERAT, publiceras aldrig) ----------
  ('arbetsgivardeklaration', 'foretagare', 'day_of_month',
   '{"day":12}', 'next_business_day', '{}',
   'Arbetsgivardeklaration',
   array['Arbetsgivardeklaration och skatt ska vara inne. Datum ej verifierat.'],
   '{}', '', null, false, '2026-08-26T00:00:00Z'),

  ('moms-kvartal', 'foretagare', 'quarterly',
   '{"months":[2,5,8,11],"day":12}', 'next_business_day', '{}',
   'Momsdeklaration (kvartal)',
   array['Momsperiod för kvartalsredovisning. Datum ej verifierat.'],
   '{}', '', null, false, '2026-08-26T00:00:00Z'),

  ('inkomstdeklaration-2', 'foretagare', 'fixed_date',
   '{"month":7,"day":1}', 'next_business_day', '{}',
   'Inkomstdeklaration 2 (aktiebolag)',
   array['Beror på räkenskapsårets slut. Datum ej verifierat.'],
   '{}', '', null, false, '2026-08-26T00:00:00Z'),

  ('arsredovisning-bolagsverket', 'foretagare', 'fixed_date',
   '{"month":7,"day":31}', 'next_business_day', '{}',
   'Årsredovisning till Bolagsverket',
   array['Sju månader efter räkenskapsårets slut. Datum ej verifierat.'],
   '{}', '', null, false, '2026-08-26T00:00:00Z')
on conflict (id) do nothing;
