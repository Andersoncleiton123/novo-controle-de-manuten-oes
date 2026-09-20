import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { MeasurementForm } from "@/components/vehicles/MeasurementForm";
import { createMeasurement } from "@/app/veiculos/actions";
import type { Vehicle } from "@/lib/types";

export default async function NovaMedicaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, nome, identificador, km_atual, horimetro_atual")
    .eq("id", id)
    .single<Pick<Vehicle, "id" | "nome" | "identificador" | "km_atual" | "horimetro_atual">>();

  if (!vehicle) notFound();

  const action = createMeasurement.bind(null, id);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Atualizar medição</h1>
        <p className="text-sm text-gray-500">{vehicle.nome ?? vehicle.identificador}</p>
      </div>
      <Card>
        <CardHeader title="Registrar leitura de KM / horímetro" />
        <CardBody>
          <MeasurementForm
            vehicleId={id}
            currentKm={vehicle.km_atual}
            currentHoras={vehicle.horimetro_atual}
            action={action}
          />
        </CardBody>
      </Card>
    </div>
  );
}
