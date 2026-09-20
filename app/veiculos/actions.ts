"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { VehicleStatus, VehicleTipo } from "@/lib/types";

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

export async function createVehicle(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    tipo: (str(formData.get("tipo")) ?? "betoneira") as VehicleTipo,
    identificador: str(formData.get("identificador")) ?? "",
    nome: str(formData.get("nome")),
    numero_interno: str(formData.get("numero_interno")),
    marca: str(formData.get("marca")),
    modelo: str(formData.get("modelo")),
    ano: num(formData.get("ano")),
    chassi: str(formData.get("chassi")),
    km_atual: num(formData.get("km_atual")) ?? 0,
    horimetro_atual: num(formData.get("horimetro_atual")) ?? 0,
    cliente_atual: str(formData.get("cliente_atual")),
    local_atual: str(formData.get("local_atual")),
    contrato_inicio: str(formData.get("contrato_inicio")),
    contrato_fim: str(formData.get("contrato_fim")),
    status: (str(formData.get("status")) ?? "disponivel") as VehicleStatus,
    observacoes: str(formData.get("observacoes")),
  };

  const { data, error } = await supabase.from("vehicles").insert(payload).select("id").single();

  if (error) {
    return { error: `Não foi possível cadastrar o veículo: ${error.message}` };
  }

  revalidatePath("/veiculos");
  revalidatePath("/");
  return { id: data!.id };
}

export async function updateVehicle(vehicleId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    tipo: (str(formData.get("tipo")) ?? "betoneira") as VehicleTipo,
    identificador: str(formData.get("identificador")) ?? "",
    nome: str(formData.get("nome")),
    numero_interno: str(formData.get("numero_interno")),
    marca: str(formData.get("marca")),
    modelo: str(formData.get("modelo")),
    ano: num(formData.get("ano")),
    chassi: str(formData.get("chassi")),
    cliente_atual: str(formData.get("cliente_atual")),
    local_atual: str(formData.get("local_atual")),
    contrato_inicio: str(formData.get("contrato_inicio")),
    contrato_fim: str(formData.get("contrato_fim")),
    status: (str(formData.get("status")) ?? "disponivel") as VehicleStatus,
    observacoes: str(formData.get("observacoes")),
  };

  const { error } = await supabase.from("vehicles").update(payload).eq("id", vehicleId);

  if (error) {
    return { error: `Não foi possível salvar o veículo: ${error.message}` };
  }

  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/");
  return { id: vehicleId };
}

export async function deleteVehicle(vehicleId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.from("vehicles").delete().eq("id", vehicleId);

  if (error) {
    return { error: `Não foi possível excluir o veículo: ${error.message}` };
  }

  revalidatePath("/veiculos");
  revalidatePath("/");
  return {};
}

export async function createMeasurement(vehicleId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const payload = {
    vehicle_id: vehicleId,
    km: num(formData.get("km")),
    horas: num(formData.get("horas")),
    data_leitura: str(formData.get("data_leitura")) ?? new Date().toISOString().slice(0, 10),
    observacao: str(formData.get("observacao")),
    correcao: formData.get("correcao") === "on",
  };

  if (payload.km === null && payload.horas === null) {
    return { error: "Informe pelo menos o KM ou o horímetro." };
  }

  const { error } = await supabase.from("measurements").insert(payload);

  if (error) {
    return { error: `Não foi possível registrar a leitura: ${error.message}` };
  }

  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/");
  return { id: vehicleId };
}
