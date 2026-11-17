-- Sinaliza, dentro da própria OS, que há instalação/troca de pneus e em quais posições.
-- Vale para qualquer tipo de OS (preventiva ou corretiva). As posições seguem as de public.tire_changes.
alter table public.maintenance_orders add column instalacao_pneus boolean not null default false;
comment on column public.maintenance_orders.instalacao_pneus is 'Sinaliza que a ordem envolve instalação/troca de pneus. Vale para qualquer tipo de ordem (preventiva ou corretiva).';
create index maintenance_orders_instalacao_pneus_idx on public.maintenance_orders (instalacao_pneus) where instalacao_pneus;

alter table public.maintenance_orders add column pneus_posicoes text[] not null default '{}';
comment on column public.maintenance_orders.pneus_posicoes is 'Posições dos pneus instalados/trocados nesta ordem. Mesmas posições da tabela tire_changes. Só pode ter itens quando instalacao_pneus = true.';

alter table public.maintenance_orders add constraint maintenance_orders_pneus_posicoes_check check (
  pneus_posicoes <@ array[
    'dianteiro_esquerdo','dianteiro_direito','traseiro_esquerdo','traseiro_direito',
    'traseiro_eixo1_esquerdo_externo','traseiro_eixo1_esquerdo_interno','traseiro_eixo1_direito_interno','traseiro_eixo1_direito_externo',
    'traseiro_eixo2_esquerdo_externo','traseiro_eixo2_esquerdo_interno','traseiro_eixo2_direito_interno','traseiro_eixo2_direito_externo'
  ]::text[]
);
alter table public.maintenance_orders add constraint maintenance_orders_pneus_posicoes_flag_check check (
  instalacao_pneus or cardinality(pneus_posicoes) = 0
);
