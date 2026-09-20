# Controle de Manutenção da Frota – Unic Car

Aplicação interna para controle de manutenção da frota de caminhões betoneira da Unic Car: cadastro de veículos, medições de KM/horímetro, planos de manutenção preventiva, manutenções corretivas, ordens de manutenção, histórico e custos.

## Stack

- **Frontend:** Next.js 16 (App Router, TypeScript, Tailwind CSS)
- **Banco de dados / backend:** Supabase (Postgres)
- **Hospedagem:** Vercel

## Configuração local

```bash
npm install
cp .env.example .env.local   # preencher com a URL e a anon key do projeto Supabase
npm run dev
```

Variáveis de ambiente necessárias (`.env.local`, nunca commitadas):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Arquitetura

- `app/` — rotas (App Router). Cada módulo (`veiculos`, `planos`, `ordens`, `problemas`, `historico`, `custos`, `calendario`, `configuracoes`) tem sua própria pasta com `page.tsx` e, quando há escrita de dados, um `actions.ts` com Server Actions.
- `components/` — componentes de UI reutilizáveis (`components/ui`) e componentes específicos por módulo.
- `lib/types.ts` — tipos do banco de dados e da aplicação. **Importante:** os tipos de linha são declarados com `type X = {...}`, nunca `interface` — usar `interface` quebra a inferência de tipos do `insert()`/`update()` do Supabase nessa combinação de versões (ver comentário no arquivo).
- `lib/supabase/` — cliente Supabase (client-side e server-side). V1 não tem login, então é usado o cliente padrão do `@supabase/supabase-js` com a chave anônima; RLS está habilitado com políticas abertas, prontas para serem restringidas quando a autenticação for implementada.

## Banco de dados

Tabelas principais: `vehicles`, `measurements`, `maintenance_plans`, `vehicle_maintenance_plans`, `corrective_issues`, `maintenance_orders`, `maintenance_order_items`, `parts`, `suppliers`, `attachments`, `alert_settings`, `maintenance_history`.

Views calculadas (sempre atualizadas, sem job de sincronização): `v_vehicle_plan_status` (status/alerta de cada plano por veículo), `v_alerts` (feed "Atenção" do dashboard), `v_full_history` (histórico completo: registros legados + ordens concluídas), `v_dashboard_summary` (cards do dashboard).

Regra de alerta: cada plano de manutenção pode ter intervalo por KM, por horas e/ou por dias. O nível (🟢 em dia / 🟡 próxima / 🟠 atenção / 🔴 atrasada) é calculado comparando a leitura atual do veículo com o previsto em cada dimensão configurada — o que ocorrer primeiro dispara o alerta. Os limites de aviso são configuráveis em **Configurações**, não fixos no código.

## Próximas versões (não implementadas nesta V1)

V2: clientes, contratos, faturamento, documentação dos veículos (a coluna `vehicles.cliente_atual` já existe como texto livre, preparada para virar FK de um módulo de clientes).
V3: pneus, combustível, ARLA, rastreamento.
V4: WhatsApp, notificações automáticas, relatórios automáticos, IA.
