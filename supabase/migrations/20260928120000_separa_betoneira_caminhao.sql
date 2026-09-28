-- Separa o equipamento betoneira do caminhão em cadastros distintos.
-- Os cadastros existentes (BT 01..BT 13) passam a ser os caminhões (placa, km, cliente, OS).
-- Para cada um é criada uma betoneira vinculada via caminhao_id.

-- Backup antes da alteração (schema não exposto pela API).
create schema if not exists backup_20260928;
revoke all on schema backup_20260928 from anon, authenticated;
create table backup_20260928.vehicles as select * from public.vehicles;
create table backup_20260928.vehicle_maintenance_plans as select * from public.vehicle_maintenance_plans;

alter table public.vehicles
  add column caminhao_id uuid references public.vehicles(id) on delete set null;
create unique index vehicles_caminhao_id_key on public.vehicles (caminhao_id) where caminhao_id is not null;

-- Cria as betoneiras a partir dos cadastros atuais.
insert into public.vehicles (tipo, identificador, nome, numero_interno, marca, status, caminhao_id)
select 'betoneira', v.numero_interno, v.nome, v.numero_interno,
       nullif(split_part(v.nome, ' - ', 2), ''), v.status, v.id
from public.vehicles v
where v.numero_interno like 'BT %';

-- Plano específico da betoneira passa para o cadastro da betoneira.
update public.vehicle_maintenance_plans vmp
set vehicle_id = b.id
from public.vehicles b, public.maintenance_plans mp
where b.caminhao_id = vmp.vehicle_id
  and mp.id = vmp.plan_id
  and mp.nome = 'Troca de fluidos da betoneira';

-- Os cadastros originais viram caminhões.
update public.vehicles t
set tipo = 'veiculo', nome = 'Caminhão da ' || t.numero_interno, numero_interno = null
where t.id in (select caminhao_id from public.vehicles where caminhao_id is not null);

-- Betoneira montada usa placa e leituras (km/horímetro) do caminhão.
do $$
declare d text;
begin
  d := pg_get_viewdef('public.v_vehicle_plan_status'::regclass, true);
  d := replace(d, 'v.identificador AS vehicle_placa', 'COALESCE(c.identificador, v.identificador) AS vehicle_placa');
  d := replace(d, 'v.km_atual,', 'COALESCE(c.km_atual, v.km_atual) AS km_atual,');
  d := replace(d, 'v.horimetro_atual,', 'COALESCE(c.horimetro_atual, v.horimetro_atual) AS horimetro_atual,');
  d := replace(d, 'JOIN vehicles v ON v.id = vmp.vehicle_id', 'JOIN vehicles v ON v.id = vmp.vehicle_id LEFT JOIN vehicles c ON c.id = v.caminhao_id');
  if position('LEFT JOIN vehicles c' in d) = 0 or position('COALESCE(c.horimetro_atual' in d) = 0 then
    raise exception 'v_vehicle_plan_status: substituição falhou';
  end if;
  execute 'create or replace view public.v_vehicle_plan_status with (security_invoker = true) as ' || d;

  -- Contadores de frota do Dashboard contam os caminhões (unidade locada).
  d := pg_get_viewdef('public.v_dashboard_summary'::regclass, true);
  d := replace(d, 'WHERE vehicles.status', 'WHERE vehicles.tipo = ''veiculo''::text AND vehicles.status');
  execute 'create or replace view public.v_dashboard_summary with (security_invoker = true) as ' || d;
end $$;
