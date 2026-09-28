-- Lubrificação deixa de ser controlada: plano e vínculos desativados (histórico preservado).
update public.maintenance_plans set ativo = false, updated_at = now() where nome = 'Lubrificação';
update public.vehicle_maintenance_plans set ativo = false
where plan_id in (select id from public.maintenance_plans where nome = 'Lubrificação');

-- Toda betoneira tem o plano "Troca de fluidos da betoneira" (a cada 1.000 h do horímetro do caminhão).
insert into public.vehicle_maintenance_plans (vehicle_id, plan_id)
select v.id, mp.id
from public.vehicles v
cross join public.maintenance_plans mp
where v.tipo = 'betoneira'
  and mp.nome = 'Troca de fluidos da betoneira'
  and not exists (
    select 1 from public.vehicle_maintenance_plans x where x.vehicle_id = v.id and x.plan_id = mp.id
  );

-- Betoneira cadastrada a partir de agora recebe o plano automaticamente.
create or replace function public.vincula_plano_fluidos_betoneira()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.tipo = 'betoneira' then
    insert into public.vehicle_maintenance_plans (vehicle_id, plan_id)
    select new.id, mp.id
    from public.maintenance_plans mp
    where mp.nome = 'Troca de fluidos da betoneira'
      and not exists (
        select 1 from public.vehicle_maintenance_plans x where x.vehicle_id = new.id and x.plan_id = mp.id
      );
  end if;
  return new;
end;
$$;

revoke execute on function public.vincula_plano_fluidos_betoneira() from public, anon, authenticated;

drop trigger if exists trg_vincula_plano_fluidos_betoneira on public.vehicles;
create trigger trg_vincula_plano_fluidos_betoneira
after insert or update of tipo on public.vehicles
for each row execute function public.vincula_plano_fluidos_betoneira();
