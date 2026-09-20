import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatHoras, formatKm } from "@/lib/format";
import type { MaintenancePlan } from "@/lib/types";

export const revalidate = 0;

export default async function PlanosPage() {
  const supabase = await createClient();
  const { data: plans } = await supabase
    .from("maintenance_plans")
    .select("*")
    .order("nome", { ascending: true })
    .returns<MaintenancePlan[]>();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Planos de manutenção preventiva</h1>
          <p className="text-sm text-gray-500">Catálogo de serviços e seus intervalos.</p>
        </div>
        <LinkButton href="/planos/novo">+ Novo plano</LinkButton>
      </div>

      {!plans || plans.length === 0 ? (
        <EmptyState title="Nenhum plano cadastrado" description="Crie o primeiro plano de manutenção preventiva." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((p) => (
            <Link key={p.id} href={`/planos/${p.id}`}>
              <Card className="h-full p-4 transition-shadow hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900">{p.nome}</p>
                  {!p.ativo ? <Badge className="bg-gray-100 text-gray-500">Inativo</Badge> : null}
                </div>
                {p.descricao ? <p className="mt-1 text-xs text-gray-500">{p.descricao}</p> : null}
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                  {p.intervalo_km ? <span>A cada {formatKm(p.intervalo_km)}</span> : null}
                  {p.intervalo_horas ? <span>A cada {formatHoras(p.intervalo_horas)}</span> : null}
                  {p.intervalo_dias ? <span>A cada {p.intervalo_dias} dias</span> : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
