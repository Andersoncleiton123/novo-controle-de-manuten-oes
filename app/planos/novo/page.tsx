import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { isAdmin } from "@/lib/auth";
import { PlanForm } from "@/components/plans/PlanForm";
import { createPlan } from "@/app/planos/actions";

export default async function NovoPlanoPage() {
  if (!(await isAdmin())) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Novo plano de manutenção</h1>
        <p className="text-sm text-gray-500">Defina o serviço e os intervalos de execução.</p>
      </div>
      <Card>
        <CardHeader title="Dados do plano" />
        <CardBody>
          <PlanForm action={createPlan} submitLabel="Criar plano" />
        </CardBody>
      </Card>
    </div>
  );
}
