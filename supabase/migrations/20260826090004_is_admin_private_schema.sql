-- Flyttar is_admin() till ett privat schema så den inte exponeras som RPC via PostgREST
-- (rensar sista security-advisor-varningen). RLS-policies kan fortfarande anropa den,
-- och SECURITY DEFINER gör att den slipper RLS-rekursion mot profiles.

create schema if not exists private;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- Bara inloggade behöver kunna utvärdera den (via RLS). PostgREST exponerar inte
-- private-schemat, så funktionen blir inte anropsbar via /rest/v1/rpc.
revoke execute on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Peka om policies till private.is_admin() och släpp den publika varianten.
drop policy modules_admin_all on modules;
drop policy rules_admin_all on rules;
drop policy profiles_self_read on profiles;

create policy modules_admin_all on modules
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy rules_admin_all on rules
  for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or private.is_admin());

drop function public.is_admin();
