import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { IssueForm } from "@/components/issues/IssueForm";
import { createIssue } from "@/app/problemas/actions";
import type { Vehicle } from "@/lib/types";

export default async function NovoProblemaPage({
  searchParams,
}: {
  searchParams: Promise<{ veiculo?: string }>;
}) {
  const { veiculo } = await searchParams;
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("id, nome, identificador, numero_interno")
    .neq("status", "desmobilizado")
    .order("numero_interno")
    .returns<Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Registrar problema</h1>
        <p className="text-sm text-gray-500">Manutenção corretiva.</p>
      </div>
      <Card>
        <CardHeader title="Dados do problema" />
        <CardBody>
          <IssueForm vehicles={vehicles ?? []} defaultVehicleId={veiculo} action={createIssue} />
        </CardBody>
      </Card>
    </div>
  );
}
