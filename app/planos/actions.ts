"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string; id?: string };

function str(v: FormDataEntryValue | null): string | null {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
}

function num(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (s === null) return null;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createPlan(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    nome: str(formData.get("nome")) ?? "",
    descricao: str(formData.get("descricao")),
    intervalo_km: num(formData.get("intervalo_km")),
    intervalo_horas: num(formData.get("intervalo_horas")),
    intervalo_dias: num(formData.get("intervalo_dias")),
    observacoes: str(formData.get("observacoes")),
  };

  if (payload.intervalo_km === null && payload.intervalo_horas === null && payload.intervalo_dias === null) {
    return { error: "Informe ao menos um intervalo (KM, horas ou dias)." };
  }

  const { data, error } = await supabase.from("maintenance_plans").insert(payload).select("id").single();
  if (error) return { error: `Não foi possível criar o plano: ${error.message}` };

  revalidatePath("/planos");
  return { id: data!.id };
}

export async function updatePlan(planId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    nome: str(formData.get("nome")) ?? "",
    descricao: str(formData.get("descricao")),
    intervalo_km: num(formData.get("intervalo_km")),
    intervalo_horas: num(formData.get("intervalo_horas")),
    intervalo_dias: num(formData.get("intervalo_dias")),
    observacoes: str(formData.get("observacoes")),
    ativo: formData.get("ativo") === "on",
  };

  const { error } = await supabase.from("maintenance_plans").update(payload).eq("id", planId);
  if (error) return { error: `Não foi possível salvar o plano: ${error.message}` };

  revalidatePath("/planos");
  revalidatePath(`/planos/${planId}`);
  return { id: planId };
}

export async function linkPlanToVehicle(planId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const vehicleId = str(formData.get("vehicle_id"));
  if (!vehicleId) return { error: "Selecione um veículo." };

  const payload = {
    vehicle_id: vehicleId,
    plan_id: planId,
    ultima_execucao_data: str(formData.get("ultima_execucao_data")),
    ultima_execucao_km: num(formData.get("ultima_execucao_km")),
    ultima_execucao_horas: num(formData.get("ultima_execucao_horas")),
  };

  const { error } = await supabase
    .from("vehicle_maintenance_plans")
    .upsert(payload, { onConflict: "vehicle_id,plan_id" });

  if (error) return { error: `Não foi possível vincular o plano: ${error.message}` };

  revalidatePath(`/planos/${planId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
  return { id: planId };
}

export async function unlinkVehiclePlan(planId: string, vehiclePlanId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("vehicle_maintenance_plans")
    .update({ ativo: false })
    .eq("id", vehiclePlanId);

  if (error) return { error: `Não foi possível remover o vínculo: ${error.message}` };

  revalidatePath(`/planos/${planId}`);
  revalidatePath("/veiculos");
  revalidatePath("/");
  return { id: planId };
}
