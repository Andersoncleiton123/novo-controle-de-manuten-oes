-- Plano da betoneira passa a ser identificado pela numeração da betoneira (ex.: "BT 09"),
-- e não pela placa do caminhão em que está montada. KM/horímetro continuam vindo do caminhão.
do $$
declare d text;
begin
  d := pg_get_viewdef('public.v_vehicle_plan_status'::regclass, true);
  if position('COALESCE(c.identificador, v.identificador) AS vehicle_placa' in d) = 0 then
    raise exception 'v_vehicle_plan_status: trecho da placa não encontrado';
  end if;
  d := replace(d, 'COALESCE(c.identificador, v.identificador) AS vehicle_placa', 'v.identificador AS vehicle_placa');
  execute 'create or replace view public.v_vehicle_plan_status with (security_invoker = true) as ' || d;
end $$;
