import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { OrderStatusForm } from "@/components/orders/OrderStatusForm";
import { ItemForm } from "@/components/orders/ItemForm";
import { DeleteItemButton } from "@/components/orders/DeleteItemButton";
import { OtherCostsForm } from "@/components/orders/OtherCostsForm";
import { addOrderItem, deleteOrderItem, updateOrderStatus, updateOtherCosts } from "@/app/ordens/actions";
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

  const itemsTotal = (items ?? []).reduce((acc, i) => acc + Number(i.valor_total), 0);
  const totalCost = itemsTotal + Number(order.outros_custos);

  const statusAction = updateOrderStatus.bind(null, id);
  const itemAction = addOrderItem.bind(null, id);
  const costsAction = updateOtherCosts.bind(null, id);

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
          <p className="text-sm text-gray-900">{order.problema_servico}</p>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-500 sm:grid-cols-3">
            <span>Aberta em {formatDate(order.data_abertura)}</span>
            {order.data_prevista ? <span>Prevista para {formatDate(order.data_prevista)}</span> : null}
            {order.data_conclusao ? <span>Concluída em {formatDate(order.data_conclusao)}</span> : null}
            {order.km !== null ? <span>{formatKm(order.km)}</span> : null}
            {order.horas !== null ? <span>{formatHoras(order.horas)}</span> : null}
            {order.suppliers ? <span>Oficina: {order.suppliers.nome}</span> : null}
            {order.responsavel ? <span>Responsável: {order.responsavel}</span> : null}
          </div>
          {order.observacoes ? <p className="mt-2 text-sm text-gray-600">{order.observacoes}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Status da ordem" />
        <CardBody>
          <OrderStatusForm currentStatus={order.status} dataPrevista={order.data_prevista} action={statusAction} />
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
                    <tr key={item.id}>
                      <td className="px-4 py-2 text-gray-900">{item.descricao}</td>
                      <td className="px-2 py-2 text-gray-600">{item.quantidade}</td>
                      <td className="px-2 py-2 text-gray-600">{formatCurrency(item.valor_unitario)}</td>
                      <td className="px-2 py-2 text-gray-600">{formatCurrency(item.mao_de_obra)}</td>
                      <td className="px-2 py-2 font-medium text-gray-900">{formatCurrency(item.valor_total)}</td>
                      <td className="px-2 py-2">
                        <DeleteItemButton action={deleteOrderItem.bind(null, id, item.id)} />
                      </td>
                    </tr>
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
          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-gray-700">Custo total da ordem</span>
            <span className="text-lg font-semibold text-gray-900">{formatCurrency(totalCost)}</span>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
