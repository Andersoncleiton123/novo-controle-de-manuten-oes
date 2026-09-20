import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { OrderForm } from "@/components/orders/OrderForm";
import { createOrder } from "@/app/ordens/actions";
import type { CorrectiveIssue, Vehicle } from "@/lib/types";

export default async function NovaOrdemPage({
  searchParams,
}: {
  searchParams: Promise<{ veiculo?: string; problema?: string; plano?: string }>;
}) {
  const { veiculo, problema, plano } = await searchParams;
  const supabase = await createClient();

  const [{ data: vehicles }, issueResult] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, nome, identificador, numero_interno")
      .neq("status", "desmobilizado")
      .order("numero_interno")
      .returns<Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[]>(),
    problema
      ? supabase.from("corrective_issues").select("*").eq("id", problema).single<CorrectiveIssue>()
      : Promise.resolve({ data: null }),
  ]);

  const issue = issueResult.data;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Nova ordem de manutenção</h1>
        <p className="text-sm text-gray-500">Preventiva ou corretiva.</p>
      </div>
      <Card>
        <CardHeader title="Dados da ordem" />
        <CardBody>
          <OrderForm
            vehicles={vehicles ?? []}
            defaultVehicleId={issue?.vehicle_id ?? veiculo}
            defaultTipo={issue ? "corretiva" : plano ? "preventiva" : undefined}
            correctiveIssueId={issue?.id}
            vehicleMaintenancePlanId={plano}
            defaultProblemaServico={issue?.descricao}
            action={createOrder}
          />
        </CardBody>
      </Card>
    </div>
  );
}
