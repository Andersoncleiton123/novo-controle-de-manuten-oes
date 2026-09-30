import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { createVehicle } from "@/app/veiculos/actions";
import type { Vehicle, VehicleTipo } from "@/lib/types";

export default async function NovoVeiculoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  if (!(await isAdmin())) notFound();
  const { tipo } = await searchParams;
  const defaultTipo: VehicleTipo = tipo === "veiculo" ? "veiculo" : "betoneira";
  const supabase = await createClient();
  const { data: caminhoes } = await supabase
    .from("vehicles")
    .select("id, identificador, nome")
    .eq("tipo", "veiculo")
    .order("nome")
    .returns<Pick<Vehicle, "id" | "identificador" | "nome">[]>();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Novo veículo</h1>
        <p className="text-sm text-gray-500">Cadastro de betoneira ou caminhão da frota.</p>
      </div>
      <Card>
        <CardHeader title="Dados do veículo" />
        <CardBody>
          <VehicleForm
            action={createVehicle}
            defaultValues={{ tipo: defaultTipo }}
            submitLabel="Cadastrar veículo"
            showReadings
            caminhoes={caminhoes ?? []}
          />
        </CardBody>
      </Card>
    </div>
  );
}
