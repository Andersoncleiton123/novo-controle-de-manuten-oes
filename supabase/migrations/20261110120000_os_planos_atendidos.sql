-- Uma OS pode atender mais de um plano preventivo (ex.: revisão com troca de óleo e lubrificação).
create table public.maintenance_order_plans (
  order_id uuid not null references public.maintenance_orders(id) on delete cascade,
  vehicle_plan_id uuid not null references public.vehicle_maintenance_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (order_id, vehicle_plan_id)
);
create index idx_order_plans_vehicle_plan on public.maintenance_order_plans (vehicle_plan_id);

-- Vínculos já existentes (um plano por OS).
insert into public.maintenance_order_plans (order_id, vehicle_plan_id)
select id, vehicle_maintenance_plan_id from public.maintenance_orders
where vehicle_maintenance_plan_id is not null
on conflict do nothing;

alter table public.maintenance_order_plans enable row level security;

create policy leitura_aprovado on public.maintenance_order_plans
  for select to anon, authenticated using (public.is_aprovado());

-- OS aberta: qualquer aprovado; OS encerrada: só administrador (mesma regra de fn_orders_guard).
create policy inclusao_aprovado on public.maintenance_order_plans
  for insert to anon, authenticated with check (
    public.is_aprovado() and (
      public.is_admin() or exists (
        select 1 from public.maintenance_orders o
        where o.id = order_id and o.status not in ('concluida', 'cancelada')
      )
    )
  );
create policy exclusao_aprovado on public.maintenance_order_plans
  for delete to anon, authenticated using (
    public.is_aprovado() and (
      public.is_admin() or exists (
        select 1 from public.maintenance_orders o
        where o.id = order_id and o.status not in ('concluida', 'cancelada')
      )
    )
  );

grant select, insert, delete on public.maintenance_order_plans to anon, authenticated;

create trigger trg_auditoria after insert or update or delete on public.maintenance_order_plans
for each row execute function public.fn_auditoria();
