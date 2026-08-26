-- RLS och den publika vyn som feed-funktionen läser.

-- ---------- published_rules: enda källan feed-funktionen läser ----------
-- Endast regler i en publicerad modul, publicerade, med verifiering och källa.
-- security_invoker => vyn respekterar anroparens RLS (anon får bara publika rader).
create view published_rules
  with (security_invoker = on)
as
  select
    r.id,
    r.module_id,
    r.type,
    r.params,
    r.weekend_rule,
    r.warnings,
    r.title,
    r.descriptions,
    r.source,
    r.verified,
    r.updated_at
  from rules r
  join modules m on m.id = r.module_id
  where m.published
    and r.published
    and r.verified is not null
    and length(btrim(r.source)) > 0;

-- ---------- RLS ----------
alter table modules  enable row level security;
alter table rules    enable row level security;
alter table profiles enable row level security;

-- Publik läsning av publicerade moduler.
create policy modules_public_read on modules
  for select using (published);

-- Publik läsning av publicerbara regler (samma villkor som vyn).
create policy rules_public_read on rules
  for select using (
    published
    and verified is not null
    and length(btrim(source)) > 0
    and exists (select 1 from modules m where m.id = module_id and m.published)
  );

-- Admin får full skrivåtkomst (för kommande admin-UI). V1: redigering sker i Supabase
-- Studio med service-nyckeln, som kringgår RLS - ingen inloggning behövs ännu.
create policy modules_admin_all on modules
  for all using (is_admin()) with check (is_admin());
create policy rules_admin_all on rules
  for all using (is_admin()) with check (is_admin());

-- Profiler: användaren ser sin egen; admin ser alla.
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or is_admin());

-- Tabell-grants (RLS avgör vilka rader; grants avgör åtkomst till tabellen alls).
grant select on modules, rules, published_rules to anon, authenticated;
