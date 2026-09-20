"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Prioridade } from "@/lib/types";

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

async function uploadAttachments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  issueId: string,
  formData: FormData,
) {
  const fieldsToType: { field: string; tipo: "foto" | "documento" | "orcamento" }[] = [
    { field: "fotos", tipo: "foto" },
    { field: "documentos", tipo: "documento" },
    { field: "orcamento", tipo: "orcamento" },
  ];

  for (const { field, tipo } of fieldsToType) {
    const files = formData.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
    for (const file of files) {
      const path = `problema/${issueId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("attachments").upload(path, file);
      if (uploadError) continue;

      await supabase.from("attachments").insert({
        entity_type: "problema",
        entity_id: issueId,
        tipo,
        storage_path: path,
        nome_arquivo: file.name,
      });
    }
  }
}

export async function createIssue(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const vehicleId = str(formData.get("vehicle_id"));
  if (!vehicleId) return { error: "Selecione um veículo." };

  const descricao = str(formData.get("descricao"));
  if (!descricao) return { error: "Descreva o problema." };

  const payload = {
    vehicle_id: vehicleId,
    data_registro: str(formData.get("data_registro")) ?? new Date().toISOString().slice(0, 10),
    km: num(formData.get("km")),
    horas: num(formData.get("horas")),
    descricao,
    prioridade: (str(formData.get("prioridade")) ?? "media") as Prioridade,
    responsavel: str(formData.get("responsavel")),
    observacoes: str(formData.get("observacoes")),
  };

  const { data, error } = await supabase.from("corrective_issues").insert(payload).select("id").single();
  if (error) return { error: `Não foi possível registrar o problema: ${error.message}` };

  await uploadAttachments(supabase, data!.id, formData);

  revalidatePath("/problemas");
  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/");
  return { id: data!.id };
}

export async function updateIssueStatus(issueId: string, status: "aberto" | "resolvido"): Promise<ActionResult> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("corrective_issues")
    .update({ status })
    .eq("id", issueId)
    .select("vehicle_id")
    .single();

  if (error) return { error: `Não foi possível atualizar o status: ${error.message}` };

  revalidatePath("/problemas");
  revalidatePath(`/problemas/${issueId}`);
  if (data?.vehicle_id) revalidatePath(`/veiculos/${data.vehicle_id}`);
  revalidatePath("/");
  return { id: issueId };
}
