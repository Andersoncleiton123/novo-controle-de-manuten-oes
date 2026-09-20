"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error?: string };

function num(v: FormDataEntryValue | null, fallback: number): number {
  const n = Number((v ?? "").toString().replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function updateAlertSettings(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    aviso_km: num(formData.get("aviso_km"), 1000),
    aviso_horas: num(formData.get("aviso_horas"), 50),
    aviso_dias: num(formData.get("aviso_dias"), 15),
    atencao_km: num(formData.get("atencao_km"), 300),
    atencao_horas: num(formData.get("atencao_horas"), 15),
    atencao_dias: num(formData.get("atencao_dias"), 5),
  };

  const { error } = await supabase.from("alert_settings").update(payload).eq("id", 1);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/configuracoes");
  revalidatePath("/");
  revalidatePath("/veiculos");
  return {};
}
