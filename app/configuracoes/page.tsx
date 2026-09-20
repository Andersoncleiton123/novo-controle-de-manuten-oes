import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { AlertSettingsForm } from "@/components/settings/AlertSettingsForm";
import { updateAlertSettings } from "@/app/configuracoes/actions";
import type { AlertSettings } from "@/lib/types";

export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase.from("alert_settings").select("*").eq("id", 1).single<AlertSettings>();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500">Parâmetros de alerta de manutenção.</p>
      </div>
      <Card>
        <CardHeader title="Limites de aviso" subtitle="Usados em toda a frota para calcular os níveis de alerta" />
        <CardBody>
          {settings ? <AlertSettingsForm defaultValues={settings} action={updateAlertSettings} /> : null}
        </CardBody>
      </Card>
    </div>
  );
}
