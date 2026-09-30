import { notFound } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { DeleteVehicleButton } from "@/components/vehicles/DeleteVehicleButton";
import { deleteVehicle, updateVehicle } from "@/app/veiculos/actions";
import type { Vehicle } from "@/lib/types";

export default async function EditarVeiculoPage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) notFound();
  const { id } = await params;
  const supabase = await createClient();
  const [{ data: vehicle }, { data: caminhoes }] = await Promise.all([
    supabase.from("vehicles").select("*").eq("id", id).single<Vehicle>(),
    supabase
      .from("vehicles")
      .select("id, identificador, nome")
      .eq("tipo", "veiculo")
      .order("nome")
      .returns<Pick<Vehicle, "id" | "identificador" | "nome">[]>(),
  ]);

  if (!vehicle) notFound();

  const action = updateVehicle.bind(null, id);
  const removeAction = deleteVehicle.bind(null, id);
  const vehicleLabel = vehicle.numero_interno ?? vehicle.nome ?? vehicle.identificador;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Editar veículo</h1>
        <p className="text-sm text-gray-500">{vehicle.nome ?? vehicle.identificador}</p>
      </div>
      <Card>
        <CardHeader title="Dados do veículo" />
        <CardBody>
          <VehicleForm
            action={action}
            defaultValues={vehicle}
            submitLabel="Salvar alterações"
            caminhoes={caminhoes ?? []}
          />
        </CardBody>
      </Card>
      <Card>
        <CardHeader title="Excluir veículo" subtitle="Ação permanente — apaga também o histórico do veículo" />
        <CardBody>
          <DeleteVehicleButton vehicleLabel={vehicleLabel} action={removeAction} />
        </CardBody>
      </Card>
    </div>
  );
}
