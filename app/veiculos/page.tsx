import Link from "next/link";
import { Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input, Select } from "@/components/ui/Field";
import { VEHICLE_STATUS_COLOR, VEHICLE_STATUS_LABEL } from "@/lib/labels";
import { formatHoras, formatKm } from "@/lib/format";
import type { Vehicle, VehicleStatus } from "@/lib/types";

export const revalidate = 0;

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q, status } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("vehicles").select("*").order("numero_interno", { ascending: true });

  if (status) {
    query = query.eq("status", status as VehicleStatus);
  }
  if (q) {
    query = query.or(
      `nome.ilike.%${q}%,identificador.ilike.%${q}%,numero_interno.ilike.%${q}%,marca.ilike.%${q}%,modelo.ilike.%${q}%`,
    );
  }

  const { data: vehicles } = await query.returns<Vehicle[]>();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Veículos</h1>
          <p className="text-sm text-gray-500">Frota de caminhões betoneira da Unic Car.</p>
        </div>
        <LinkButton href="/veiculos/novo">+ Novo veículo</LinkButton>
      </div>

      <Card className="p-4">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="search"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Pesquisar por número, placa, marca ou modelo…"
              className="pl-9"
            />
          </div>
          <Select name="status" defaultValue={status ?? ""} className="sm:w-56">
            <option value="">Todos os status</option>
            {Object.entries(VEHICLE_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {!vehicles || vehicles.length === 0 ? (
        <EmptyState title="Nenhum veículo encontrado" description="Ajuste a pesquisa ou cadastre um novo veículo." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <Link key={v.id} href={`/veiculos/${v.id}`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {v.numero_interno ?? v.identificador}
                    </p>
                    <p className="truncate text-xs text-gray-500">{v.nome ?? v.identificador}</p>
                  </div>
                  <Badge className={VEHICLE_STATUS_COLOR[v.status]}>{VEHICLE_STATUS_LABEL[v.status]}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                  <span>{v.identificador}</span>
                  <span>{formatKm(v.km_atual)}</span>
                  <span>{formatHoras(v.horimetro_atual)}</span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
