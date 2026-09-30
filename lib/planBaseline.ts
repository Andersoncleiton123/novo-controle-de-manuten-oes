// Só para uso no servidor (server actions).
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Planos de troca de óleo/fluidos: a OS que registra a troca vira a última execução do plano.
export const PLANOS_TROCA_FLUIDOS = ["Troca de óleo do motor", "Troca de fluidos da betoneira"];

// A contagem regressiva parte da OS mais recente (não cancelada) ligada ao plano:
// data de abertura, KM e horímetro dessa OS.
export async function syncPlanBaseline(supabase: Supabase, planId: string | null) {
  if (!planId) return;
  const { data: os } = await supabase
    .from("maintenance_orders")
    .select("data_abertura, km, horas")
    .eq("vehicle_maintenance_plan_id", planId)
    .neq("status", "cancelada")
    .order("data_abertura", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!os || (os.km === null && os.horas === null)) return;
  await supabase
    .from("vehicle_maintenance_plans")
    .update({ ultima_execucao_data: os.data_abertura, ultima_execucao_km: os.km, ultima_execucao_horas: os.horas })
    .eq("id", planId);
}

// Plano de troca de óleo (caminhão) ou de fluidos (betoneira) ativo do veículo.
export async function planoTrocaFluidosId(supabase: Supabase, vehicleId: string): Promise<string | null> {
  const { data } = await supabase
    .from("vehicle_maintenance_plans")
    .select("id, maintenance_plans!inner(nome, ativo)")
    .eq("vehicle_id", vehicleId)
    .eq("ativo", true)
    .eq("maintenance_plans.ativo", true)
    .in("maintenance_plans.nome", PLANOS_TROCA_FLUIDOS)
    .limit(1)
    .returns<{ id: string }[]>();
  return data?.[0]?.id ?? null;
}
