-- Allow admin users to delete buildings from the admin dashboard.

begin;

drop policy if exists "Admin delete buildings" on public.buildings;
create policy "Admin delete buildings"
on public.buildings
for delete
to authenticated
using (
  exists (
    select 1
    from public.admin_users admin
    where admin.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);

commit;
