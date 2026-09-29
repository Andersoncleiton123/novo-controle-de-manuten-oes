-- Medições podem ser corrigidas ou excluídas: a leitura atual do veículo passa a ser
-- sempre a medição mais recente por data, e cada medição é validada contra as vizinhas.

drop trigger if exists trg_measurement_apply on public.measurements;

-- Valida a medição contra a anterior e a seguinte (por data). Correção administrativa não valida.
create or replace function public.fn_validate_measurement()
returns trigger
language plpgsql
set search_path to 'public'
as $$
declare
  ant_data date; ant_km numeric; ant_horas numeric;
  prox_data date; prox_km numeric; prox_horas numeric;
begin
  if new.correcao then
    return new;
  end if;

  select m.data_leitura, m.km, m.horas into ant_data, ant_km, ant_horas
  from public.measurements m
  where m.vehicle_id = new.vehicle_id and m.id <> new.id and m.data_leitura <= new.data_leitura
  order by m.data_leitura desc, m.created_at desc
  limit 1;

  select m.data_leitura, m.km, m.horas into prox_data, prox_km, prox_horas
  from public.measurements m
  where m.vehicle_id = new.vehicle_id and m.id <> new.id and m.data_leitura > new.data_leitura
  order by m.data_leitura asc, m.created_at asc
  limit 1;

  if new.km is not null and ant_km is not null and new.km < ant_km then
    raise exception 'KM % menor que o da medição de % (% km).', new.km, to_char(ant_data, 'DD/MM/YYYY'), ant_km;
  end if;
  if new.horas is not null and ant_horas is not null and new.horas < ant_horas then
    raise exception 'Horímetro % menor que o da medição de % (% h).', new.horas, to_char(ant_data, 'DD/MM/YYYY'), ant_horas;
  end if;
  if new.km is not null and prox_km is not null and new.km > prox_km then
    raise exception 'KM % maior que o da medição de % (% km).', new.km, to_char(prox_data, 'DD/MM/YYYY'), prox_km;
  end if;
  if new.horas is not null and prox_horas is not null and new.horas > prox_horas then
    raise exception 'Horímetro % maior que o da medição de % (% h).', new.horas, to_char(prox_data, 'DD/MM/YYYY'), prox_horas;
  end if;

  return new;
end;
$$;

-- Leitura atual do veículo = medição mais recente por data (KM e horímetro separadamente).
create or replace function public.fn_recalc_vehicle_readings(p_vehicle_id uuid)
returns void
language sql
set search_path to 'public'
as $$
  update public.vehicles v
  set km_atual = coalesce((
        select m.km from public.measurements m
        where m.vehicle_id = v.id and m.km is not null
        order by m.data_leitura desc, m.created_at desc limit 1), v.km_atual),
      horimetro_atual = coalesce((
        select m.horas from public.measurements m
        where m.vehicle_id = v.id and m.horas is not null
        order by m.data_leitura desc, m.created_at desc limit 1), v.horimetro_atual),
      updated_at = now()
  where v.id = p_vehicle_id;
$$;

create or replace function public.fn_measurement_recalc()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.fn_recalc_vehicle_readings(old.vehicle_id);
  end if;
  if tg_op in ('INSERT', 'UPDATE') then
    perform public.fn_recalc_vehicle_readings(new.vehicle_id);
  end if;
  return null;
end;
$$;

create trigger trg_measurement_validate
before insert or update on public.measurements
for each row execute function public.fn_validate_measurement();

create trigger trg_measurement_recalc
after insert or update or delete on public.measurements
for each row execute function public.fn_measurement_recalc();
