-- Login com perfis (administrador / consultor), acesso só para usuários aprovados e auditoria.
-- Administrador: vendas@uniccar.com.br (após confirmar o e-mail). Demais contas entram como
-- consultor e só acessam depois de aprovadas pelo administrador.

-- ---------------------------------------------------------------- Perfis
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  nome text,
  perfil text not null default 'consultor' check (perfil in ('admin', 'consultor')),
  aprovado boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function public.fn_novo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  eh_admin boolean := lower(new.email) = 'vendas@uniccar.com.br';
begin
  insert into public.profiles (id, email, nome, perfil, aprovado)
  values (
    new.id,
    lower(new.email),
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    case when eh_admin then 'admin' else 'consultor' end,
    eh_admin
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_novo_usuario
after insert on auth.users
for each row execute function public.fn_novo_usuario();

-- Aprovado e com e-mail confirmado.
create or replace function public.is_aprovado()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.aprovado and u.email_confirmed_at is not null
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.aprovado and p.perfil = 'admin' and u.email_confirmed_at is not null
  );
$$;

create policy perfil_proprio_ou_admin on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy perfil_admin_altera on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------- Auditoria
create table public.audit_log (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  user_email text,
  tabela text not null,
  acao text not null,
  registro_id text,
  antes jsonb,
  depois jsonb
);
create index audit_log_created_at_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
create policy auditoria_admin_le on public.audit_log
  for select to authenticated using (public.is_admin());

create or replace function public.fn_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_linha jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  select email into v_email from public.profiles where id = auth.uid();
  insert into public.audit_log (user_id, user_email, tabela, acao, registro_id, antes, depois)
  values (
    auth.uid(),
    v_email,
    tg_table_name,
    tg_op,
    v_linha ->> 'id',
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end
  );
  return null;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array[
    'vehicles', 'measurements', 'maintenance_orders', 'maintenance_order_items', 'corrective_issues',
    'maintenance_plans', 'vehicle_maintenance_plans', 'alert_settings', 'suppliers', 'profiles'
  ] loop
    execute format(
      'create trigger trg_auditoria after insert or update or delete on public.%I for each row execute function public.fn_auditoria()',
      t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------- Travas por perfil
-- Consultor só altera status e leituras do veículo (efeito de OS e medições).
create or replace function public.fn_vehicles_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin()
     and (to_jsonb(new) - array['status', 'km_atual', 'horimetro_atual', 'updated_at'])
         is distinct from (to_jsonb(old) - array['status', 'km_atual', 'horimetro_atual', 'updated_at']) then
    raise exception 'Somente o administrador pode alterar o cadastro do veículo.';
  end if;
  return new;
end;
$$;
create trigger trg_vehicles_guard before update on public.vehicles
for each row execute function public.fn_vehicles_guard();

-- Consultor não cancela OS nem altera OS encerrada.
create or replace function public.fn_orders_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin() then
    if old.status in ('concluida', 'cancelada') then
      raise exception 'Ordem encerrada. Somente o administrador pode reabrir.';
    end if;
    if new.status = 'cancelada' then
      raise exception 'Somente o administrador pode cancelar ordem de serviço.';
    end if;
  end if;
  return new;
end;
$$;
create trigger trg_orders_guard before update on public.maintenance_orders
for each row execute function public.fn_orders_guard();

-- Consultor só atualiza a última execução do plano (efeito de fechar OS).
create or replace function public.fn_vehicle_plans_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not public.is_admin()
     and (to_jsonb(new) - array['ultima_execucao_data', 'ultima_execucao_km', 'ultima_execucao_horas', 'updated_at'])
         is distinct from (to_jsonb(old) - array['ultima_execucao_data', 'ultima_execucao_km', 'ultima_execucao_horas', 'updated_at']) then
    raise exception 'Somente o administrador pode alterar o vínculo de planos.';
  end if;
  return new;
end;
$$;
create trigger trg_vehicle_plans_guard before update on public.vehicle_maintenance_plans
for each row execute function public.fn_vehicle_plans_guard();

-- ---------------------------------------------------------------- Regras de acesso (RLS)
do $$
declare t text;
begin
  foreach t in array array[
    'alert_settings', 'attachments', 'corrective_issues', 'lubricant_changes', 'maintenance_history',
    'maintenance_order_items', 'maintenance_orders', 'maintenance_plan_parts', 'maintenance_plans',
    'maintenance_records', 'measurements', 'oil_changes', 'parts', 'suppliers', 'tire_changes',
    'vehicle_maintenance_plans', 'vehicles'
  ] loop
    execute format('drop policy if exists app_full_access on public.%I', t);
    -- Leitura: qualquer usuário aprovado.
    execute format('create policy leitura_aprovado on public.%I for select to authenticated using (public.is_aprovado())', t);
    -- Exclusão: só administrador.
    execute format('create policy exclusao_admin on public.%I for delete to authenticated using (public.is_admin())', t);
  end loop;

  -- Tabelas só do administrador (cadastros e configuração).
  foreach t in array array[
    'alert_settings', 'attachments', 'lubricant_changes', 'maintenance_history', 'maintenance_plan_parts',
    'maintenance_plans', 'maintenance_records', 'oil_changes', 'parts', 'tire_changes'
  ] loop
    execute format('create policy inclusao_admin on public.%I for insert to authenticated with check (public.is_admin())', t);
    execute format('create policy alteracao_admin on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;

  -- Operação do dia a dia: aprovado inclui e altera.
  foreach t in array array['corrective_issues', 'maintenance_order_items', 'maintenance_orders'] loop
    execute format('create policy inclusao_aprovado on public.%I for insert to authenticated with check (public.is_aprovado())', t);
    execute format('create policy alteracao_aprovado on public.%I for update to authenticated using (public.is_aprovado()) with check (public.is_aprovado())', t);
  end loop;
end $$;

-- Veículos: cadastro só administrador; alteração com a trava de colunas acima.
create policy inclusao_admin on public.vehicles
  for insert to authenticated with check (public.is_admin());
create policy alteracao_aprovado on public.vehicles
  for update to authenticated using (public.is_aprovado()) with check (public.is_aprovado());

-- Vínculo de planos: incluir só administrador; alteração com a trava de colunas acima.
create policy inclusao_admin on public.vehicle_maintenance_plans
  for insert to authenticated with check (public.is_admin());
create policy alteracao_aprovado on public.vehicle_maintenance_plans
  for update to authenticated using (public.is_aprovado()) with check (public.is_aprovado());

-- Medições: aprovado lança; correção administrativa, alteração e exclusão só administrador.
create policy inclusao_aprovado on public.measurements
  for insert to authenticated with check (public.is_aprovado() and (not correcao or public.is_admin()));
create policy alteracao_admin on public.measurements
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Fornecedores: aprovado inclui (ao abrir OS); alteração só administrador.
create policy inclusao_aprovado on public.suppliers
  for insert to authenticated with check (public.is_aprovado());
create policy alteracao_admin on public.suppliers
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Views respeitam as regras das tabelas.
do $$
declare v text;
begin
  for v in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
           where n.nspname = 'public' and c.relkind = 'v' loop
    execute format('alter view public.%I set (security_invoker = true)', v);
  end loop;
end $$;

-- Sem login, nada: remove o acesso anônimo.
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke execute on functions from public, anon;
