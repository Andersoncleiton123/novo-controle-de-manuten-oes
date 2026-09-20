import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/StatCard";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatHoras, formatKm } from "@/lib/format";
import { NIVEL_ALERTA_COLOR, NIVEL_ALERTA_ICON, NIVEL_ALERTA_LABEL } from "@/lib/labels";
import type { AlertFeedItem, DashboardSummary, VehiclePlanStatus } from "@/lib/types";
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

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: summary }, { data: alerts }, { data: planStatus }] = await Promise.all([
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
  ]);

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
                        className="truncate text-sm font-medium text-gray-900 hover:text-brand-700"
                      >
                        {p.vehicle_nome ?? p.vehicle_placa} · {p.plano_nome}
                      </Link>
                      <Badge className={NIVEL_ALERTA_COLOR[p.nivel_alerta]}>
                        {NIVEL_ALERTA_LABEL[p.nivel_alerta]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {p.restante_km !== null ? `Faltam ${formatKm(p.restante_km)}` : null}
                      {p.restante_km !== null && p.restante_horas !== null ? " · " : null}
                      {p.restante_horas !== null ? `Faltam ${formatHoras(p.restante_horas)}` : null}
                      {p.proxima_data ? ` · Previsto para ${formatDate(p.proxima_data)}` : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
