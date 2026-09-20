import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { formatCurrency, formatDate, formatHoras, formatKm } from "@/lib/format";
import { CATEGORIA_HISTORICO_LABEL } from "@/lib/labels";
import type { FullHistoryEntry, Vehicle } from "@/lib/types";

export const revalidate = 0;

type HistoryFilters = {
  veiculo?: string;
  categoria?: string;
  de?: string;
  ate?: string;
  servico?: string;
  fornecedor?: string;
  custo_min?: string;
  custo_max?: string;
};

export default async function HistoricoPage({ searchParams }: { searchParams: Promise<HistoryFilters> }) {
  const filters = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("v_full_history").select("*").order("data", { ascending: false });

  if (filters.veiculo) query = query.eq("vehicle_id", filters.veiculo);
  if (filters.categoria) query = query.eq("categoria", filters.categoria);
  if (filters.de) query = query.gte("data", filters.de);
  if (filters.ate) query = query.lte("data", filters.ate);
  if (filters.servico) query = query.ilike("servico", `%${filters.servico}%`);
  if (filters.fornecedor) query = query.ilike("fornecedor", `%${filters.fornecedor}%`);
  if (filters.custo_min) query = query.gte("custo", Number(filters.custo_min));
  if (filters.custo_max) query = query.lte("custo", Number(filters.custo_max));

  const [{ data: history }, { data: vehicles }] = await Promise.all([
    query.limit(300).returns<FullHistoryEntry[]>(),
    supabase
      .from("vehicles")
      .select("id, nome, identificador, numero_interno")
      .order("numero_interno")
      .returns<Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[]>(),
  ]);

  const vehicleById = new Map((vehicles ?? []).map((v) => [v.id, v]));
  const total = (history ?? []).reduce((acc, h) => acc + Number(h.custo), 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Histórico de manutenções</h1>
        <p className="text-sm text-gray-500">{history?.length ?? 0} registro(s) · total {formatCurrency(total)}</p>
      </div>

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4" method="get">
          <Select name="veiculo" defaultValue={filters.veiculo ?? ""}>
            <option value="">Todos os veículos</option>
            {(vehicles ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.numero_interno ?? v.identificador}
              </option>
            ))}
          </Select>
          <Select name="categoria" defaultValue={filters.categoria ?? ""}>
            <option value="">Todos os tipos</option>
            {Object.entries(CATEGORIA_HISTORICO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Input name="servico" placeholder="Serviço" defaultValue={filters.servico ?? ""} />
          <Input name="fornecedor" placeholder="Fornecedor" defaultValue={filters.fornecedor ?? ""} />
          <Input name="de" type="date" defaultValue={filters.de ?? ""} />
          <Input name="ate" type="date" defaultValue={filters.ate ?? ""} />
          <Input name="custo_min" type="number" placeholder="Custo mínimo" defaultValue={filters.custo_min ?? ""} />
          <Input name="custo_max" type="number" placeholder="Custo máximo" defaultValue={filters.custo_max ?? ""} />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:col-span-3 lg:col-span-4 lg:w-40"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {!history || history.length === 0 ? (
        <EmptyState title="Nenhum registro encontrado" />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {history.map((h) => {
              const vehicle = vehicleById.get(h.vehicle_id);
              return (
              <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <Link href={`/veiculos/${h.vehicle_id}`} className="truncate text-sm font-medium text-gray-900 hover:text-brand-700">
                    {vehicle ? (
                      <>
                        {vehicle.numero_interno ?? vehicle.identificador}{" "}
                        <span className="font-normal text-gray-400">({vehicle.identificador})</span>
                      </>
                    ) : (
                      "—"
                    )}{" "}
                    — {h.servico}
                  </Link>
                  <p className="text-xs text-gray-500">
                    {formatDate(h.data)} · {CATEGORIA_HISTORICO_LABEL[h.categoria] ?? h.categoria}
                    {h.km !== null ? ` · ${formatKm(h.km)}` : ""}
                    {h.horas !== null ? ` · ${formatHoras(h.horas)}` : ""}
                    {h.fornecedor ? ` · ${h.fornecedor}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-medium text-gray-700">{formatCurrency(h.custo)}</span>
              </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
