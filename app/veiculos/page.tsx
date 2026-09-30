import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { VehicleFilters } from "@/components/vehicles/VehicleFilters";
import { PlacaMercosul } from "@/components/ui/PlacaMercosul";
import {
  NIVEL_ALERTA_COLOR,
  NIVEL_ALERTA_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
  VEHICLE_TIPO_COLOR,
  VEHICLE_TIPO_LABEL,
} from "@/lib/labels";
import { formatHoras, formatKm, formatRestante } from "@/lib/format";
import type { Vehicle, VehicleStatus, VehicleTipo, VehiclePlanStatus } from "@/lib/types";

const NIVEL_ORDER: Record<string, number> = { atrasada: 0, atencao: 1, proxima: 2, sem_baseline: 3, em_dia: 4 };

export const revalidate = 0;

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; tipo?: string }>;
}) {
  const { q, status, tipo } = await searchParams;
  const supabase = await createClient();
  const admin = await isAdmin();

  let query = supabase
    .from("vehicles")
    .select("*")
    .order("numero_interno", { ascending: true })
    .order("nome", { ascending: true });

  if (status) {
    query = query.eq("status", status as VehicleStatus);
  }
  if (tipo) {
    query = query.eq("tipo", tipo as VehicleTipo);
  }
  if (q) {
    // Placas são gravadas sem hífen; "RGK-1F44" também encontra RGK1F44.
    const placa = q.replace(/-/g, "");
    query = query.or(
      `nome.ilike.%${q}%,identificador.ilike.%${q}%,identificador.ilike.%${placa}%,numero_interno.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%`,
    );
  }

  const [{ data: vehicles }, { data: planStatus }, { data: allVehicles }] = await Promise.all([
    query.returns<Vehicle[]>(),
    supabase.from("v_vehicle_plan_status").select("*").returns<VehiclePlanStatus[]>(),
    supabase
      .from("vehicles")
      .select("id, identificador, numero_interno, km_atual, horimetro_atual, caminhao_id")
      .returns<Pick<Vehicle, "id" | "identificador" | "numero_interno" | "km_atual" | "horimetro_atual" | "caminhao_id">[]>(),
  ]);

  // Vínculo betoneira ↔ caminhão para mostrar a placa/leituras do caminhão na betoneira e vice-versa.
  const byId = new Map((allVehicles ?? []).map((v) => [v.id, v]));
  const betoneiraDoCaminhao = new Map(
    (allVehicles ?? []).filter((v) => v.caminhao_id).map((v) => [v.caminhao_id as string, v]),
  );

  const worstPlanByVehicle = new Map<string, VehiclePlanStatus>();
  for (const p of planStatus ?? []) {
    const current = worstPlanByVehicle.get(p.vehicle_id);
    if (!current || (NIVEL_ORDER[p.nivel_alerta] ?? 9) < (NIVEL_ORDER[current.nivel_alerta] ?? 9)) {
      worstPlanByVehicle.set(p.vehicle_id, p);
    }
  }

  const titulo = tipo === "betoneira" ? "Betoneiras" : tipo === "veiculo" ? "Caminhões" : "Veículos";
  const novoLabel = tipo === "betoneira" ? "+ Nova betoneira" : tipo === "veiculo" ? "+ Novo caminhão" : "+ Novo veículo";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{titulo}</h1>
          <p className="text-sm text-gray-500">Frota da Unic Car.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {tipo === "betoneira" || tipo === "veiculo" ? (
            <>
              <LinkButton href={`/ordens?categoria=${tipo}`} variant="secondary">
                {tipo === "betoneira" ? "Ordens das betoneiras" : "Ordens dos caminhões"}
              </LinkButton>
              <LinkButton href={`/ordens/nova?categoria=${tipo}`} variant="secondary">
                + Abrir ordem de serviço
              </LinkButton>
            </>
          ) : null}
          {admin ? (
            <LinkButton href={tipo ? `/veiculos/novo?tipo=${tipo}` : "/veiculos/novo"}>{novoLabel}</LinkButton>
          ) : null}
        </div>
      </div>

      <Card className="p-4">
        <VehicleFilters q={q} status={status} tipo={tipo} />
      </Card>

      {!vehicles || vehicles.length === 0 ? (
        <EmptyState title="Nenhum veículo encontrado" description="Ajuste a pesquisa ou cadastre um novo veículo." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => {
            const plan = worstPlanByVehicle.get(v.id);
            const caminhao = v.caminhao_id ? byId.get(v.caminhao_id) : undefined;
            const betoneira = betoneiraDoCaminhao.get(v.id);
            const leituras = caminhao ?? v;
            return (
            <Card key={v.id} className="h-full p-4 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <Link href={`/veiculos/${v.id}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {v.numero_interno ?? v.identificador}
                  </p>
                  <p className="truncate text-xs text-gray-500">{v.nome ?? v.identificador}</p>
                </Link>
                <div className="flex shrink-0 items-start gap-2">
                  <div className="flex flex-col items-end gap-1">
                    <Badge className={VEHICLE_STATUS_COLOR[v.status]}>{VEHICLE_STATUS_LABEL[v.status]}</Badge>
                    <Badge className={VEHICLE_TIPO_COLOR[v.tipo]}>{VEHICLE_TIPO_LABEL[v.tipo]}</Badge>
                  </div>
                  {admin ? (
                    <Link
                      href={`/veiculos/${v.id}/editar`}
                      aria-label="Editar veículo"
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  ) : null}
                </div>
              </div>
              <Link href={`/veiculos/${v.id}`} className="mt-3 block">
                <div className="flex items-center justify-between gap-2 text-xs text-gray-600">
                  <PlacaMercosul placa={caminhao?.identificador ?? v.identificador} />
                  <span>{formatKm(leituras.km_atual)}</span>
                  <span>{formatHoras(leituras.horimetro_atual)}</span>
                </div>
                {caminhao ? <p className="mt-1 text-xs text-gray-500">Montada no caminhão {caminhao.identificador}</p> : null}
                {betoneira ? (
                  <p className="mt-1 text-xs text-gray-500">Betoneira montada: {betoneira.numero_interno ?? betoneira.identificador}</p>
                ) : null}
                {v.cliente_atual ? (
                  <p className="mt-1 truncate text-xs font-medium text-gray-700">{v.cliente_atual}</p>
                ) : null}
                {v.local_atual ? <p className="mt-0.5 truncate text-xs text-gray-500">📍 {v.local_atual}</p> : null}
                {v.observacoes ? (
                  <Badge className="mt-1 max-w-full overflow-hidden bg-red-100 text-red-700">
                    <span className="truncate">
                      {v.observacoes.length > 40 ? `${v.observacoes.slice(0, 40)}…` : v.observacoes}
                    </span>
                  </Badge>
                ) : null}
                {plan ? (
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-gray-100 pt-2">
                    <span className="truncate text-xs text-gray-600">
                      {plan.plano_nome}
                      {plan.restante_horas !== null
                        ? ` · ${formatRestante(Number(plan.restante_horas), formatHoras, (t) => `faltam ${t}`)}`
                        : ""}
                      {plan.restante_km !== null
                        ? ` · ${formatRestante(Number(plan.restante_km), formatKm, (t) => `faltam ${t}`)}`
                        : ""}
                    </span>
                    <Badge className={NIVEL_ALERTA_COLOR[plan.nivel_alerta]}>
                      {NIVEL_ALERTA_LABEL[plan.nivel_alerta]}
                    </Badge>
                  </div>
                ) : null}
              </Link>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
