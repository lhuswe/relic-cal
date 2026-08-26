-- Kärnschema för deadline-kalendern: moduler, regler (regelmotorn som data) och profiler.
-- Datadisciplin och UID-stabilitet är inbyggda i schemat, inte i byggskript.

-- Regeltyper och helgregler som enums (matchar _shared/lib/types.ts).
create type rule_type as enum (
  'fixed_date',
  'day_of_month',
  'quarterly',
  'nth_weekday',
  'date_range'
);

create type weekend_rule as enum (
  'next_business_day',
  'previous_business_day',
  'none'
);

-- Sätter updated_at vid ändring. updated_at driver DTSTAMP i feed-funktionen, så en
-- redigering flyttar fram DTSTAMP och får kalenderklienter att uppdatera.
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------- Moduler (en feed per publicerad modul) ----------
create table modules (
  id          text primary key,               -- slug, t.ex. 'skatt-privat'
  title       text not null,
  description text not null default '',
  published   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger modules_set_updated_at
  before update on modules
  for each row execute function set_updated_at();

-- ---------- Regler (regelmotorn som rader) ----------
create table rules (
  id           text primary key,              -- stabil kebab-case, ändras ALDRIG (UID-stabilitet)
  module_id    text not null references modules(id) on update cascade on delete restrict,
  type         rule_type not null,
  params       jsonb not null,                -- typspecifika parametrar
  weekend_rule weekend_rule not null default 'none',
  warnings     int[] not null default '{}',   -- förvarningsdagar, t.ex. {30,7}
  title        text not null,
  descriptions text[] not null,               -- >=1 variant, roteras på år
  data         jsonb not null default '{}',   -- strukturerad data (fribelopp m.m.), aldrig i brödtext
  source       text not null default '',
  verified     date,
  published    boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  constraint descriptions_nonempty check (cardinality(descriptions) >= 1),

  -- Datadisciplin: en publicerad regel MÅSTE ha källa och verifieringsdatum.
  -- Databasen vägrar publicera en overifierad regel (ersätter specens "bygget avbryter").
  constraint published_requires_source_verified check (
    published = false or (verified is not null and length(btrim(source)) > 0)
  )
);

create index rules_module_id_idx on rules (module_id);

create trigger rules_set_updated_at
  before update on rules
  for each row execute function set_updated_at();

-- ---------- Profiler (för framtida admin-UI; publika feeds kräver ingen inloggning) ----------
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'viewer',
  created_at timestamptz not null default now()
);

-- Skapar en profil automatiskt när en auth-användare skapas.
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, role) values (new.id, 'viewer')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Admin-check för skrivpolicies.
create or replace function is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
