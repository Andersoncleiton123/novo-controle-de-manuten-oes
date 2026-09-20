import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkVehicleForm } from "@/components/plans/LinkVehicleForm";
import { UnlinkButton } from "@/components/plans/UnlinkButton";
import { linkPlanToVehicle, unlinkVehiclePlan } from "@/app/planos/actions";
import { formatDate, formatHoras, formatKm } from "@/lib/format";
import { NIVEL_ALERTA_COLOR, NIVEL_ALERTA_LABEL } from "@/lib/labels";
import type { MaintenancePlan, Vehicle, VehiclePlanStatus } from "@/lib/types";

export const revalidate = 0;

export default async function PlanoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: plan } = await supabase.from("maintenance_plans").select("*").eq("id", id).single<MaintenancePlan>();
  if (!plan) notFound();

  const [{ data: linkedVehicles }, { data: allVehicles }] = await Promise.all([
    supabase
      .from("v_vehicle_plan_status")
      .select("*")
      .eq("plan_id", id)
      .returns<VehiclePlanStatus[]>(),
    supabase
      .from("vehicles")
      .select("id, nome, identificador, numero_interno")
      .neq("status", "desmobilizado")
      .order("numero_interno")
      .returns<Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[]>(),
  ]);

  const linkedVehicleIds = new Set((linkedVehicles ?? []).map((v) => v.vehicle_id));
  const availableVehicles = (allVehicles ?? []).filter((v) => !linkedVehicleIds.has(v.id));

  const linkAction = linkPlanToVehicle.bind(null, id);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{plan.nome}</h1>
            {!plan.ativo ? <Badge className="bg-gray-100 text-gray-500">Inativo</Badge> : null}
          </div>
          {plan.descricao ? <p className="text-sm text-gray-500">{plan.descricao}</p> : null}
        </div>
        <LinkButton href={`/planos/${id}/editar`} variant="secondary" size="sm">
          Editar plano
        </LinkButton>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-700">
            <span>
              Intervalo: {[
                plan.intervalo_km ? formatKm(plan.intervalo_km) : null,
                plan.intervalo_horas ? formatHoras(plan.intervalo_horas) : null,
                plan.intervalo_dias ? `${plan.intervalo_dias} dias` : null,
              ]
                .filter(Boolean)
                .join(" ou ") || "—"}{" "}
              — o que ocorrer primeiro
            </span>
          </div>
          {plan.observacoes ? <p className="mt-2 text-sm text-gray-500">{plan.observacoes}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Veículos vinculados" subtitle={`${linkedVehicles?.length ?? 0} veículo(s)`} />
        <CardBody className="p-0">
          {!linkedVehicles || linkedVehicles.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhum veículo vinculado a este plano" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {linkedVehicles.map((v) => (
                <li key={v.vehicle_plan_id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <Link href={`/veiculos/${v.vehicle_id}`} className="text-sm font-medium text-gray-900 hover:text-brand-700">
                      {v.vehicle_nome ?? v.vehicle_placa}
                    </Link>
                    <p className="text-xs text-gray-500">
                      Última execução: {v.ultima_execucao_data ? formatDate(v.ultima_execucao_data) : "não registrada"}
                      {v.ultima_execucao_km !== null ? ` · ${formatKm(v.ultima_execucao_km)}` : ""}
                      {v.ultima_execucao_horas !== null ? ` · ${formatHoras(v.ultima_execucao_horas)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={NIVEL_ALERTA_COLOR[v.nivel_alerta]}>{NIVEL_ALERTA_LABEL[v.nivel_alerta]}</Badge>
                    <UnlinkButton action={unlinkVehiclePlan.bind(null, id, v.vehicle_plan_id)} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {availableVehicles.length > 0 ? (
        <Card>
          <CardHeader title="Vincular a um veículo" />
          <CardBody>
            <LinkVehicleForm vehicles={availableVehicles} action={linkAction} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
