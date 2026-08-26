-- Prestanda-städning av RLS (Supabase performance-advisors):
--  * undvik per-rad-utvärdering av auth.uid() genom (select auth.uid())
--  * en policy per roll+action (slå ihop publik läsning och admin-läsning för
--    authenticated; separata skrivpolicies per action)
-- Säkerheten är oförändrad: anon ser bara publikt, admin (inloggad) ser allt.

-- ---------- modules ----------
drop policy modules_public_read on modules;
drop policy modules_admin_all on modules;

create policy modules_anon_read on modules
  for select to anon using (published);
create policy modules_auth_read on modules
  for select to authenticated using (published or private.is_admin());
create policy modules_admin_insert on modules
  for insert to authenticated with check (private.is_admin());
create policy modules_admin_update on modules
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy modules_admin_delete on modules
  for delete to authenticated using (private.is_admin());

-- ---------- rules (läsvillkor = samma som vyn published_rules) ----------
drop policy rules_public_read on rules;
drop policy rules_admin_all on rules;

create policy rules_anon_read on rules
  for select to anon using (
    published and verified is not null and length(btrim(source)) > 0
    and exists (select 1 from modules m where m.id = module_id and m.published)
  );
create policy rules_auth_read on rules
  for select to authenticated using (
    private.is_admin() or (
      published and verified is not null and length(btrim(source)) > 0
      and exists (select 1 from modules m where m.id = module_id and m.published)
    )
  );
create policy rules_admin_insert on rules
  for insert to authenticated with check (private.is_admin());
create policy rules_admin_update on rules
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy rules_admin_delete on rules
  for delete to authenticated using (private.is_admin());

-- ---------- profiles ----------
drop policy profiles_self_read on profiles;
create policy profiles_self_read on profiles
  for select using (id = (select auth.uid()) or private.is_admin());
