import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { createVehicle } from "@/app/veiculos/actions";
import type { VehicleTipo } from "@/lib/types";

export default async function NovoVeiculoPage({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  const defaultTipo: VehicleTipo = tipo === "veiculo" ? "veiculo" : "betoneira";
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Novo veículo</h1>
        <p className="text-sm text-gray-500">Cadastro de betoneira ou caminhão da frota.</p>
      </div>
      <Card>
        <CardHeader title="Dados do veículo" />
        <CardBody>
          <VehicleForm action={createVehicle} defaultValues={{ tipo: defaultTipo }} submitLabel="Cadastrar veículo" showReadings />
        </CardBody>
      </Card>
    </div>
  );
}
