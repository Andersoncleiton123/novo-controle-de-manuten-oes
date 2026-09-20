import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { VehicleForm } from "@/components/vehicles/VehicleForm";
import { createVehicle } from "@/app/veiculos/actions";

export default function NovoVeiculoPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Novo veículo</h1>
        <p className="text-sm text-gray-500">Cadastro de caminhão betoneira da frota.</p>
      </div>
      <Card>
        <CardHeader title="Dados do veículo" />
        <CardBody>
          <VehicleForm action={createVehicle} submitLabel="Cadastrar veículo" showReadings />
        </CardBody>
      </Card>
    </div>
  );
}
