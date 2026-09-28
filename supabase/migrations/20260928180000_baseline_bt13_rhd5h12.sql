-- BT 13 e o caminhão RHD5H12 nunca passaram por troca de fluidos: contagem parte do zero.
update public.vehicle_maintenance_plans vmp
set ultima_execucao_horas = 0
from public.vehicles v, public.maintenance_plans mp
where v.id = vmp.vehicle_id and mp.id = vmp.plan_id
  and v.tipo = 'betoneira' and v.numero_interno = 'BT 13'
  and mp.nome = 'Troca de fluidos da betoneira'
  and vmp.ultima_execucao_horas is null and vmp.ultima_execucao_km is null and vmp.ultima_execucao_data is null;

insert into public.vehicle_maintenance_plans (vehicle_id, plan_id, ultima_execucao_km, ultima_execucao_horas)
select v.id, mp.id, 0, 0
from public.vehicles v, public.maintenance_plans mp
where v.tipo = 'veiculo' and v.identificador = 'RHD5H12'
  and mp.nome = 'Troca de óleo do motor'
  and not exists (select 1 from public.vehicle_maintenance_plans x where x.vehicle_id = v.id and x.plan_id = mp.id);
