import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusForm } from "@/components/orders/OrderStatusForm";
import { CloseOrderForm } from "@/components/orders/CloseOrderForm";
import { ReopenOrderForm } from "@/components/orders/ReopenOrderForm";
import { ItemForm } from "@/components/orders/ItemForm";
import { EditableItemRow } from "@/components/orders/EditableItemRow";
import { EditableDescription } from "@/components/orders/EditableDescription";
import { EditableReadings } from "@/components/orders/EditableReadings";
import { OtherCostsForm } from "@/components/orders/OtherCostsForm";
import {
  addOrderItem,
  closeOrder,
  deleteOrderItem,
  reopenOrder,
  updateOrderItem,
  updateOrderReadings,
  updateOrderDescription,
  updateOrderStatus,
  updateOtherCosts,
} from "@/app/ordens/actions";
import { formatCurrency, formatDate, formatHoras, formatKm } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, ORDER_TIPO_LABEL, PRIORIDADE_COLOR, PRIORIDADE_LABEL } from "@/lib/labels";
import type { MaintenanceOrder, MaintenanceOrderItem, Supplier, Vehicle } from "@/lib/types";

export const revalidate = 0;

type OrderWithRelations = MaintenanceOrder & { vehicles: Vehicle | null; suppliers: Supplier | null };

export default async function OrdemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("*, vehicles(*), suppliers(*)")
    .eq("id", id)
    .single<OrderWithRelations>();

  if (!order) notFound();

  const { data: items } = await supabase
    .from("maintenance_order_items")
    .select("*")
    .eq("order_id", id)
    .order("created_at", { ascending: true })
    .returns<MaintenanceOrderItem[]>();

  const { data: planos } = await supabase
    .from("vehicle_maintenance_plans")
    .select("id, maintenance_plans!inner(nome, ativo)")
    .eq("vehicle_id", order.vehicle_id)
    .eq("ativo", true)
    .eq("maintenance_plans.ativo", true)
    .returns<{ id: string; maintenance_plans: { nome: string; ativo: boolean } }[]>();

  const encerrada = order.status === "concluida" || order.status === "cancelada";

  const totalPecas = (items ?? []).reduce((acc, i) => acc + Number(i.quantidade) * Number(i.valor_unitario), 0);
  const totalServico = (items ?? []).reduce((acc, i) => acc + Number(i.mao_de_obra), 0);
  const itemsTotal = totalPecas + totalServico;
  const totalCost = itemsTotal + Number(order.outros_custos);

  const statusAction = updateOrderStatus.bind(null, id);
  const itemAction = addOrderItem.bind(null, id);
  const costsAction = updateOtherCosts.bind(null, id);
  const descriptionAction = updateOrderDescription.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">{order.numero_os}</h1>
            <Badge className={PRIORIDADE_COLOR[order.prioridade]}>{PRIORIDADE_LABEL[order.prioridade]}</Badge>
            <Badge className={ORDER_STATUS_COLOR[order.status]}>{ORDER_STATUS_LABEL[order.status]}</Badge>
            <Badge className="bg-gray-100 text-gray-600">{ORDER_TIPO_LABEL[order.tipo]}</Badge>
          </div>
          {order.vehicles ? (
            <Link href={`/veiculos/${order.vehicle_id}`} className="text-sm text-brand-600 hover:underline">
              {order.vehicles.numero_interno ?? order.vehicles.nome ?? order.vehicles.identificador} (
              {order.vehicles.identificador})
            </Link>
          ) : null}
        </div>
      </div>

      <Card>
        <CardBody>
          <EditableDescription description={order.problema_servico} action={descriptionAction} />
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 sm:grid-cols-3">
            <span>Aberta em {formatDate(order.data_abertura)}</span>
            {order.data_prevista ? <span>Prevista para {formatDate(order.data_prevista)}</span> : null}
            {order.data_conclusao ? <span>Concluída em {formatDate(order.data_conclusao)}</span> : null}
            {encerrada && order.km !== null ? <span>{formatKm(order.km)}</span> : null}
            {encerrada && order.horas !== null ? <span>{formatHoras(order.horas)}</span> : null}
            {order.suppliers ? <span>Oficina: {order.suppliers.nome}</span> : null}
            {order.responsavel ? <span>Responsável: {order.responsavel}</span> : null}
          </div>
          {!encerrada ? (
            <div className="mt-2">
              <EditableReadings km={order.km} horas={order.horas} action={updateOrderReadings.bind(null, id)} />
            </div>
          ) : null}
          {order.observacoes ? <p className="mt-2 text-sm text-gray-600">{order.observacoes}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Status da ordem" />
        <CardBody>
          {encerrada ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {order.status === "concluida"
                  ? `Ordem fechada em ${formatDate(order.data_conclusao)}.`
                  : "Ordem cancelada."}{" "}
                Alterações de status exigem reabertura pelo administrador.
              </p>
              <ReopenOrderForm action={reopenOrder.bind(null, id)} />
            </div>
          ) : (
            <div className="space-y-4">
              <OrderStatusForm currentStatus={order.status} dataPrevista={order.data_prevista} action={statusAction} />
              <div className="border-t border-gray-100 pt-4">
                <CloseOrderForm
                  km={order.km}
                  horas={order.horas}
                  planos={(planos ?? []).map((p) => ({ id: p.id, nome: p.maintenance_plans.nome }))}
                  planoAtualId={order.vehicle_maintenance_plan_id}
                  action={closeOrder.bind(null, id)}
                />
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Peças, serviços e mão de obra" subtitle="Custo total calculado automaticamente" />
        <CardBody className="p-0">
          {!items || items.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhum item lançado ainda" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                    <th className="px-4 py-2 font-medium">Descrição</th>
                    <th className="px-2 py-2 font-medium">Qtd</th>
                    <th className="px-2 py-2 font-medium">Valor unit.</th>
                    <th className="px-2 py-2 font-medium">Mão de obra</th>
                    <th className="px-2 py-2 font-medium">Total</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <EditableItemRow
                      key={item.id}
                      item={item}
                      updateAction={updateOrderItem.bind(null, id, item.id)}
                      deleteAction={deleteOrderItem.bind(null, id, item.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <ItemForm action={itemAction} />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          <OtherCostsForm defaultValue={order.outros_custos} action={costsAction} />
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <StatCard label="Total em peças" value={formatCurrency(totalPecas)} />
            <StatCard label="Total em serviço" value={formatCurrency(totalServico)} />
          </div>
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-gray-700">Custo total da ordem</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
