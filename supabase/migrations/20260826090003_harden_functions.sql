-- Härdning efter Supabase security-advisors.

-- 1. Lås search_path på trigger-funktionen (den använder bara now()).
alter function public.set_updated_at() set search_path = '';

-- 2. handle_new_user är en trigger-funktion och ska inte gå att anropa via RPC.
--    Triggern körs som ägaren oavsett grants, så detta bryter inget. EXECUTE ges
--    till PUBLIC vid skapandet, så det måste återkallas därifrån.
revoke execute on function public.handle_new_user() from public;

-- 3. Admin-policyerna gäller bara inloggade. Då slipper anon-rollen utvärdera
--    is_admin(). Funktionen exekveras bara av authenticated (för RLS-adminpolicy).
drop policy modules_admin_all on modules;
drop policy rules_admin_all on rules;
create policy modules_admin_all on modules
  for all to authenticated using (is_admin()) with check (is_admin());
create policy rules_admin_all on rules
  for all to authenticated using (is_admin()) with check (is_admin());

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
