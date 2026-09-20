import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { PlanForm } from "@/components/plans/PlanForm";
import { updatePlan } from "@/app/planos/actions";
import type { MaintenancePlan } from "@/lib/types";

export default async function EditarPlanoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: plan } = await supabase.from("maintenance_plans").select("*").eq("id", id).single<MaintenancePlan>();

  if (!plan) notFound();

  const action = updatePlan.bind(null, id);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Editar plano</h1>
        <p className="text-sm text-gray-500">{plan.nome}</p>
      </div>
      <Card>
        <CardHeader title="Dados do plano" />
        <CardBody>
          <PlanForm action={action} defaultValues={plan} submitLabel="Salvar alterações" showAtivo />
        </CardBody>
      </Card>
    </div>
  );
}
