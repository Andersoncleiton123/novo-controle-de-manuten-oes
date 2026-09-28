-- RHD5H12 sem troca de óleo registrada: plano fica como "Sem última execução registrada".
update public.vehicle_maintenance_plans vmp
set ultima_execucao_km = null, ultima_execucao_horas = null, ultima_execucao_data = null
from public.vehicles v, public.maintenance_plans mp
where v.id = vmp.vehicle_id and mp.id = vmp.plan_id
  and v.tipo = 'veiculo' and v.identificador = 'RHD5H12'
  and mp.nome = 'Troca de óleo do motor';
