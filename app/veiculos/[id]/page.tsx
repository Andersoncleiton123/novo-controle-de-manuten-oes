import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatDate, formatHoras, formatKm } from "@/lib/format";
import {
  CATEGORIA_HISTORICO_LABEL,
  NIVEL_ALERTA_COLOR,
  NIVEL_ALERTA_LABEL,
  ORDER_STATUS_COLOR,
  ORDER_STATUS_LABEL,
  PRIORIDADE_COLOR,
  PRIORIDADE_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
  VEHICLE_TIPO_COLOR,
  VEHICLE_TIPO_LABEL,
} from "@/lib/labels";
import type {
  CorrectiveIssue,
  FullHistoryEntry,
  MaintenanceOrder,
  Measurement,
  Vehicle,
  VehiclePlanStatus,
} from "@/lib/types";

export const revalidate = 0;

const NIVEL_ORDER: Record<string, number> = { atrasada: 0, atencao: 1, proxima: 2, sem_baseline: 3, em_dia: 4 };

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vehicle } = await supabase.from("vehicles").select("*").eq("id", id).single<Vehicle>();
  if (!vehicle) notFound();

  const [{ data: planStatus }, { data: issues }, { data: orders }, { data: history }, { data: measurements }] =
    await Promise.all([
      supabase
        .from("v_vehicle_plan_status")
        .select("*")
        .eq("vehicle_id", id)
        .returns<VehiclePlanStatus[]>(),
      supabase
        .from("corrective_issues")
        .select("*")
        .eq("vehicle_id", id)
        .order("data_registro", { ascending: false })
        .returns<CorrectiveIssue[]>(),
      supabase
        .from("maintenance_orders")
        .select("*")
        .eq("vehicle_id", id)
        .order("data_abertura", { ascending: false })
        .returns<MaintenanceOrder[]>(),
      supabase
        .from("v_full_history")
        .select("*")
        .eq("vehicle_id", id)
        .order("data", { ascending: false })
        .limit(15)
        .returns<FullHistoryEntry[]>(),
      supabase
        .from("measurements")
        .select("*")
        .eq("vehicle_id", id)
        .order("data_leitura", { ascending: false })
        .limit(10)
        .returns<Measurement[]>(),
    ]);

  const { data: allHistory } = await supabase
    .from("v_full_history")
    .select("data, custo")
    .eq("vehicle_id", id)
    .returns<{ data: string; custo: number }[]>();

  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const sum = (rows: { data: string; custo: number }[] | null, since: Date) =>
    (rows ?? [])
      .filter((r) => new Date(r.data) >= since)
      .reduce((acc, r) => acc + Number(r.custo), 0);

  const custoTotal = (allHistory ?? []).reduce((acc, r) => acc + Number(r.custo), 0);
  const custoMes = sum(allHistory, startOfMonth);
  const custo6Meses = sum(allHistory, sixMonthsAgo);
  const custoAno = sum(allHistory, startOfYear);
  const custoPorKm = vehicle.km_atual > 0 ? custoTotal / vehicle.km_atual : null;
  const custoPorHora = vehicle.horimetro_atual > 0 ? custoTotal / vehicle.horimetro_atual : null;

  const sortedPlanStatus = (planStatus ?? []).sort(
    (a, b) => (NIVEL_ORDER[a.nivel_alerta] ?? 9) - (NIVEL_ORDER[b.nivel_alerta] ?? 9),
  );
  const openIssues = (issues ?? []).filter((i) => i.status === "aberto");
  const openOrders = (orders ?? []).filter((o) => !["concluida", "cancelada"].includes(o.status));

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">
              {vehicle.numero_interno ?? vehicle.identificador}
            </h1>
            <Badge className={VEHICLE_STATUS_COLOR[vehicle.status]}>{VEHICLE_STATUS_LABEL[vehicle.status]}</Badge>
            <Badge className={VEHICLE_TIPO_COLOR[vehicle.tipo]}>{VEHICLE_TIPO_LABEL[vehicle.tipo]}</Badge>
          </div>
          <p className="text-sm text-gray-500">
            {[vehicle.nome, vehicle.marca, vehicle.modelo, vehicle.ano].filter(Boolean).join(" · ") ||
              vehicle.identificador}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/veiculos/${id}/medicao`} variant="secondary" size="sm">
            Atualizar medição
          </LinkButton>
          <LinkButton href={`/problemas/novo?veiculo=${id}`} variant="secondary" size="sm">
            Registrar problema
          </LinkButton>
          <LinkButton href={`/ordens/nova?veiculo=${id}`} size="sm">
            Abrir ordem de manutenção
          </LinkButton>
          <LinkButton href={`/veiculos/${id}/editar`} variant="ghost" size="sm">
            Editar
          </LinkButton>
        </div>
      </div>

      {vehicle.observacoes ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {vehicle.observacoes}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Placa" value={vehicle.identificador} />
        <StatCard label="KM atual" value={formatKm(vehicle.km_atual)} />
        <StatCard label="Horímetro atual" value={formatHoras(vehicle.horimetro_atual)} />
        <StatCard label="Cliente atual" value={vehicle.cliente_atual ?? "—"} />
        <StatCard label="Local onde está locado" value={vehicle.local_atual ?? "—"} />
      </div>

      <Card>
        <CardHeader title="Próximas manutenções e pendências preventivas" />
        <CardBody className="p-0">
          {sortedPlanStatus.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Nenhum plano preventivo vinculado"
                description="Vincule um plano de manutenção a este veículo na área de Planos preventivos."
                action={
                  <LinkButton href="/planos" size="sm" variant="secondary" className="mt-2">
                    Ir para planos
                  </LinkButton>
                }
              />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {sortedPlanStatus.map((p) => (
                <li key={p.vehicle_plan_id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{p.plano_nome}</p>
                    <p className="text-xs text-gray-500">
                      {p.restante_km !== null ? `${formatKm(p.restante_km)} restantes` : null}
                      {p.restante_km !== null && p.restante_horas !== null ? " · " : null}
                      {p.restante_horas !== null ? `${formatHoras(p.restante_horas)} restantes` : null}
                      {p.proxima_data ? ` · previsto ${formatDate(p.proxima_data)}` : null}
                      {p.nivel_alerta === "sem_baseline" ? "Sem última execução registrada" : null}
                    </p>
                  </div>
                  <Badge className={NIVEL_ALERTA_COLOR[p.nivel_alerta]}>{NIVEL_ALERTA_LABEL[p.nivel_alerta]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Problemas abertos" subtitle={`${openIssues.length} pendente(s)`} />
          <CardBody className="p-0">
            {openIssues.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhum problema aberto" />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {openIssues.map((i) => (
                  <li key={i.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{i.descricao}</p>
                      <Badge className={PRIORIDADE_COLOR[i.prioridade]}>{PRIORIDADE_LABEL[i.prioridade]}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">Registrado em {formatDate(i.data_registro)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ordens de manutenção abertas" subtitle={`${openOrders.length} em aberto`} />
          <CardBody className="p-0">
            {openOrders.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhuma ordem em aberto" />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {openOrders.map((o) => (
                  <li key={o.id}>
                    <Link href={`/ordens/${o.id}`} className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-gray-50">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {o.numero_os} · {o.problema_servico}
                        </p>
                        <p className="text-xs text-gray-500">Aberta em {formatDate(o.data_abertura)}</p>
                      </div>
                      <Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Custos de manutenção" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Custo no mês" value={formatCurrency(custoMes)} />
            <StatCard label="Últimos 6 meses" value={formatCurrency(custo6Meses)} />
            <StatCard label="No ano" value={formatCurrency(custoAno)} />
            <StatCard label="Total acumulado" value={formatCurrency(custoTotal)} />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <p className="text-sm text-gray-600">
              Custo por KM rodado:{" "}
              <span className="font-medium text-gray-900">
                {custoPorKm !== null ? formatCurrency(custoPorKm) : "dados insuficientes"}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Custo por hora trabalhada:{" "}
              <span className="font-medium text-gray-900">
                {custoPorHora !== null ? formatCurrency(custoPorHora) : "dados insuficientes"}
              </span>
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Histórico de manutenções" action={<Link href={`/historico?veiculo=${id}`} className="text-xs font-medium text-brand-600 hover:underline">Ver tudo</Link>} />
        <CardBody className="p-0">
          {!history || history.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Sem histórico registrado" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {history.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{h.servico}</p>
                    <p className="text-xs text-gray-500">
                      {formatDate(h.data)} · {CATEGORIA_HISTORICO_LABEL[h.categoria] ?? h.categoria}
                      {h.km !== null ? ` · ${formatKm(h.km)}` : ""}
                      {h.horas !== null ? ` · ${formatHoras(h.horas)}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium text-gray-700">{formatCurrency(h.custo)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Medições registradas" subtitle="Histórico de KM e horímetro" />
        <CardBody className="p-0">
          {!measurements || measurements.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhuma medição registrada" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {measurements.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                  <span className="text-gray-500">{formatDate(m.data_leitura)}</span>
                  <span className="text-gray-900">{m.km !== null ? formatKm(m.km) : "—"}</span>
                  <span className="text-gray-900">{m.horas !== null ? formatHoras(m.horas) : "—"}</span>
                  {m.correcao ? <Badge className="bg-gray-100 text-gray-500">correção</Badge> : <span />}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
