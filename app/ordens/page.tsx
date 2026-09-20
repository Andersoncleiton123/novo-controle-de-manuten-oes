import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import { ORDER_STATUS_COLOR, ORDER_STATUS_LABEL, ORDER_TIPO_LABEL, PRIORIDADE_COLOR, PRIORIDADE_LABEL } from "@/lib/labels";
import type { MaintenanceOrder, OrderStatus, OrderTipo, Vehicle } from "@/lib/types";

export const revalidate = 0;

type OrderWithVehicle = MaintenanceOrder & { vehicles: Pick<Vehicle, "nome" | "identificador" | "numero_interno"> | null };

export default async function OrdensPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tipo?: string }>;
}) {
  const { status, tipo } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("maintenance_orders")
    .select("*, vehicles(nome, identificador, numero_interno)")
    .order("data_abertura", { ascending: false });

  if (status) query = query.eq("status", status as OrderStatus);
  if (tipo) query = query.eq("tipo", tipo as OrderTipo);

  const { data: orders } = await query.returns<OrderWithVehicle[]>();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Ordens de manutenção</h1>
          <p className="text-sm text-gray-500">Preventivas e corretivas.</p>
        </div>
        <LinkButton href="/ordens/nova">+ Nova ordem</LinkButton>
      </div>

      <Card className="p-4">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <Select name="status" defaultValue={status ?? ""} className="sm:w-56">
            <option value="">Todos os status</option>
            {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="tipo" defaultValue={tipo ?? ""} className="sm:w-56">
            <option value="">Todos os tipos</option>
            {Object.entries(ORDER_TIPO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Filtrar
          </button>
        </form>
      </Card>

      {!orders || orders.length === 0 ? (
        <EmptyState title="Nenhuma ordem encontrada" />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/ordens/${o.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {o.numero_os} · {o.vehicles?.numero_interno ?? o.vehicles?.identificador} — {o.problema_servico}
                    </p>
                    <p className="text-xs text-gray-500">
                      {ORDER_TIPO_LABEL[o.tipo]} · Aberta em {formatDate(o.data_abertura)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge className={PRIORIDADE_COLOR[o.prioridade]}>{PRIORIDADE_LABEL[o.prioridade]}</Badge>
                    <Badge className={ORDER_STATUS_COLOR[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
