import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlacaMercosul } from "@/components/ui/PlacaMercosul";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatHoras, formatKm, formatRestante } from "@/lib/format";
import {
  NIVEL_ALERTA_COLOR,
  NIVEL_ALERTA_ICON,
  NIVEL_ALERTA_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
} from "@/lib/labels";
import type { AlertFeedItem, DashboardSummary, Vehicle, VehiclePlanStatus } from "@/lib/types";
import {
  Truck,
  Wrench,
  ParkingCircle,
  AlertTriangle,
  Clock,
  ClipboardList,
  CircleDollarSign,
  CheckCircle2,
} from "lucide-react";

export const revalidate = 0;

const NIVEL_ORDER: Record<string, number> = { atrasada: 0, atencao: 1, proxima: 2, sem_baseline: 3, em_dia: 4 };

// A contagem regressiva das trocas depende da medição semanal de KM/horímetro.
const DIAS_SEM_MEDICAO = 7;

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: summary }, { data: alerts }, { data: planStatus }, { data: fleetVehicles }] = await Promise.all([
    supabase.from("v_dashboard_summary").select("*").single<DashboardSummary>(),
    supabase
      .from("v_alerts")
      .select("*")
      .returns<AlertFeedItem[]>(),
    supabase
      .from("v_vehicle_plan_status")
      .select("*")
      .in("nivel_alerta", ["atrasada", "atencao", "proxima"])
      .returns<VehiclePlanStatus[]>(),
    supabase
      .from("vehicles")
      .select("id, numero_interno, identificador, nome, status, cliente_atual, local_atual")
      .eq("tipo", "veiculo")
      .neq("status", "desmobilizado")
      .order("nome")
      .returns<Pick<Vehicle, "id" | "numero_interno" | "identificador" | "nome" | "status" | "cliente_atual" | "local_atual">[]>(),
  ]);

  // Última medição de cada caminhão da frota ativa.
  const frotaIds = (fleetVehicles ?? []).map((v) => v.id);
  const { data: medicoes } = frotaIds.length
    ? await supabase
        .from("measurements")
        .select("vehicle_id, data_leitura")
        .in("vehicle_id", frotaIds)
        .order("data_leitura", { ascending: false })
        .returns<{ vehicle_id: string; data_leitura: string }[]>()
    : { data: [] as { vehicle_id: string; data_leitura: string }[] };
  const ultimaMedicao = new Map<string, string>();
  for (const m of medicoes ?? []) if (!ultimaMedicao.has(m.vehicle_id)) ultimaMedicao.set(m.vehicle_id, m.data_leitura);
  const hoje = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00Z`).getTime();
  const semMedicao = (fleetVehicles ?? [])
    .map((v) => {
      const data = ultimaMedicao.get(v.id) ?? null;
      const dias = data ? Math.floor((hoje - new Date(`${data}T00:00:00Z`).getTime()) / 86_400_000) : null;
      return { ...v, data, dias };
    })
    .filter((v) => v.dias === null || v.dias > DIAS_SEM_MEDICAO)
    .sort((a, b) => (b.dias ?? Infinity) - (a.dias ?? Infinity));

  const sortedAlerts = (alerts ?? []).sort(
    (a, b) => (NIVEL_ORDER[a.nivel] ?? 9) - (NIVEL_ORDER[b.nivel] ?? 9),
  );

  const sortedPlanStatus = (planStatus ?? []).sort((a, b) => {
    const order = (NIVEL_ORDER[a.nivel_alerta] ?? 9) - (NIVEL_ORDER[b.nivel_alerta] ?? 9);
    if (order !== 0) return order;
    const da = a.proxima_data ? new Date(a.proxima_data).getTime() : Infinity;
    const db = b.proxima_data ? new Date(b.proxima_data).getTime() : Infinity;
    return da - db;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Visão geral da frota Unic Car.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total de veículos" value={summary?.total_veiculos ?? 0} icon={<Truck className="h-4 w-4 text-gray-400" />} />
        <StatCard label="Em operação" value={summary?.em_operacao ?? 0} tone="blue" icon={<Truck className="h-4 w-4 text-blue-400" />} />
        <StatCard label="Disponíveis" value={summary?.disponiveis ?? 0} tone="green" icon={<CheckCircle2 className="h-4 w-4 text-green-400" />} />
        <StatCard label="Em manutenção" value={summary?.em_manutencao ?? 0} tone="orange" icon={<Wrench className="h-4 w-4 text-orange-400" />} />
        <StatCard label="Parados" value={summary?.parados ?? 0} tone="red" icon={<ParkingCircle className="h-4 w-4 text-red-400" />} />
        <StatCard
          label="Manutenções atrasadas"
          value={summary?.manutencoes_atrasadas ?? 0}
          tone="red"
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
        />
        <StatCard
          label="Manutenções próximas"
          value={summary?.manutencoes_proximas ?? 0}
          tone="yellow"
          icon={<Clock className="h-4 w-4 text-yellow-400" />}
        />
        <StatCard
          label="Ordens em aberto"
          value={summary?.os_abertas ?? 0}
          icon={<ClipboardList className="h-4 w-4 text-gray-400" />}
        />
        <StatCard
          label="Custo de manutenção do mês"
          value={formatCurrency(summary?.custo_mes ?? 0)}
          icon={<CircleDollarSign className="h-4 w-4 text-gray-400" />}
        />
      </div>

      {semMedicao.length > 0 ? (
        <Card className="border-amber-200">
          <CardHeader
            title={`Medição semanal pendente (${semMedicao.length})`}
            subtitle={`Caminhões sem medição de KM/horímetro há mais de ${DIAS_SEM_MEDICAO} dias — a contagem para a próxima troca fica parada`}
          />
          <CardBody className="p-0">
            <ul className="divide-y divide-gray-100">
              {semMedicao.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <PlacaMercosul placa={v.identificador} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{v.nome ?? v.identificador}</p>
                      <p className="text-xs text-amber-700">
                        {v.data
                          ? `Última medição em ${formatDate(v.data)} · há ${v.dias} dias`
                          : "Nenhuma medição registrada"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/veiculos/${v.id}/medicao`}
                    className="shrink-0 rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Lançar medição
                  </Link>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Atenção" subtitle="Veículos que precisam de alguma ação" />
          <CardBody className="p-0">
            {sortedAlerts.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhuma pendência no momento" description="Tudo em dia na frota." />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sortedAlerts.map((a, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <Link
                        href={`/veiculos/${a.vehicle_id}`}
                        className="block truncate text-sm font-medium text-gray-900 hover:text-brand-700"
                      >
                        {NIVEL_ALERTA_ICON[a.nivel]} {a.vehicle_nome ?? a.vehicle_placa}
                      </Link>
                      <p className="truncate text-xs text-gray-500">{a.descricao}</p>
                    </div>
                    <Badge className={NIVEL_ALERTA_COLOR[a.nivel]}>{NIVEL_ALERTA_LABEL[a.nivel]}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Próximas manutenções" subtitle="Preventivas próximas ou atrasadas" />
          <CardBody className="p-0">
            {sortedPlanStatus.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Nenhuma manutenção próxima" description="Nenhum plano vencendo em breve." />
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sortedPlanStatus.map((p) => (
                  <li key={p.vehicle_plan_id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/veiculos/${p.vehicle_id}`}
                        className="flex min-w-0 items-center gap-2 text-sm font-medium text-gray-900 hover:text-brand-700"
                      >
                        <PlacaMercosul placa={p.vehicle_placa} />
                        <span className="truncate">
                          {p.vehicle_numero_interno ?? p.vehicle_nome} · {p.plano_nome}
                        </span>
                      </Link>
                      <Badge className={NIVEL_ALERTA_COLOR[p.nivel_alerta]}>
                        {NIVEL_ALERTA_LABEL[p.nivel_alerta]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {p.restante_km !== null ? formatRestante(Number(p.restante_km), formatKm, (t) => `Faltam ${t}`) : null}
                      {p.restante_km !== null && p.restante_horas !== null ? " · " : null}
                      {p.restante_horas !== null ? formatRestante(Number(p.restante_horas), formatHoras, (t) => `Faltam ${t}`) : null}
                      {p.proxima_data ? ` · Previsto para ${formatDate(p.proxima_data)}` : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Cliente atual por veículo" subtitle="Onde cada veículo está locado agora" />
        <CardBody className="p-0">
          {!fleetVehicles || fleetVehicles.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhum veículo cadastrado" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {fleetVehicles.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Link href={`/veiculos/${v.id}`} className="flex min-w-0 items-center gap-3 hover:text-brand-700">
                    <PlacaMercosul placa={v.identificador} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{v.numero_interno ?? v.nome}</p>
                      <p className="truncate text-xs text-gray-500">
                        {v.cliente_atual ?? "Sem cliente informado"}
                        {v.local_atual ? ` · ${v.local_atual}` : ""}
                      </p>
                    </div>
                  </Link>
                  <Badge className={VEHICLE_STATUS_COLOR[v.status]}>{VEHICLE_STATUS_LABEL[v.status]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
