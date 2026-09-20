import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

export const revalidate = 0;

export default async function CustosPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: history }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .neq("status", "desmobilizado")
      .order("numero_interno")
      .returns<Vehicle[]>(),
    supabase.from("v_full_history").select("vehicle_id, data, custo").returns<{ vehicle_id: string; data: string; custo: number }[]>(),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const byVehicle = new Map<string, { mes: number; seisMeses: number; ano: number; total: number }>();
  for (const v of vehicles ?? []) byVehicle.set(v.id, { mes: 0, seisMeses: 0, ano: 0, total: 0 });

  let custoMesFrota = 0;
  for (const h of history ?? []) {
    const bucket = byVehicle.get(h.vehicle_id);
    if (!bucket) continue;
    const data = new Date(h.data);
    const custo = Number(h.custo);
    bucket.total += custo;
    if (data >= startOfYear) bucket.ano += custo;
    if (data >= sixMonthsAgo) bucket.seisMeses += custo;
    if (data >= startOfMonth) {
      bucket.mes += custo;
      custoMesFrota += custo;
    }
  }

  const custoTotalFrota = [...byVehicle.values()].reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Custos de manutenção</h1>
        <p className="text-sm text-gray-500">Visão por veículo e da frota.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Custo da frota no mês" value={formatCurrency(custoMesFrota)} />
        <StatCard label="Custo total acumulado" value={formatCurrency(custoTotalFrota)} />
        <StatCard label="Veículos" value={vehicles?.length ?? 0} />
      </div>

      <Card>
        <CardHeader title="Custo por veículo" />
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs text-gray-500">
                  <th className="px-4 py-2 font-medium">Veículo</th>
                  <th className="px-2 py-2 font-medium">Mês</th>
                  <th className="px-2 py-2 font-medium">6 meses</th>
                  <th className="px-2 py-2 font-medium">Ano</th>
                  <th className="px-2 py-2 font-medium">Total</th>
                  <th className="px-2 py-2 font-medium">Custo/KM</th>
                  <th className="px-2 py-2 font-medium">Custo/hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(vehicles ?? []).map((v) => {
                  const b = byVehicle.get(v.id)!;
                  const custoPorKm = v.km_atual > 0 ? b.total / v.km_atual : null;
                  const custoPorHora = v.horimetro_atual > 0 ? b.total / v.horimetro_atual : null;
                  return (
                    <tr key={v.id}>
                      <td className="px-4 py-2">
                        <Link href={`/veiculos/${v.id}`} className="font-medium text-gray-900 hover:text-brand-700">
                          {v.numero_interno ?? v.identificador}
                        </Link>
                      </td>
                      <td className="px-2 py-2 text-gray-600">{formatCurrency(b.mes)}</td>
                      <td className="px-2 py-2 text-gray-600">{formatCurrency(b.seisMeses)}</td>
                      <td className="px-2 py-2 text-gray-600">{formatCurrency(b.ano)}</td>
                      <td className="px-2 py-2 font-medium text-gray-900">{formatCurrency(b.total)}</td>
                      <td className="px-2 py-2 text-gray-600">{custoPorKm !== null ? formatCurrency(custoPorKm) : "—"}</td>
                      <td className="px-2 py-2 text-gray-600">{custoPorHora !== null ? formatCurrency(custoPorHora) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
