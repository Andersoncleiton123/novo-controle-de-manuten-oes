"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { MaintenanceOrder, OrderStatus, OrderTipo, Prioridade } from "@/lib/types";

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

async function resolveSupplierId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  nome: string | null,
): Promise<string | null> {
  if (!nome) return null;

  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .ilike("nome", nome)
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase.from("suppliers").insert({ nome }).select("id").single();
  if (error) return null;
  return created.id;
}

export async function createOrder(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const vehicleId = str(formData.get("vehicle_id"));
  if (!vehicleId) return { error: "Selecione um veículo." };

  const problemaServico = str(formData.get("problema_servico"));
  if (!problemaServico) return { error: "Descreva o problema ou serviço." };

  const fornecedorId = await resolveSupplierId(supabase, str(formData.get("fornecedor")));
  const correctiveIssueId = str(formData.get("corrective_issue_id"));
  const vehicleMaintenancePlanId = str(formData.get("vehicle_maintenance_plan_id"));

  const payload = {
    vehicle_id: vehicleId,
    tipo: (str(formData.get("tipo")) ?? "corretiva") as OrderTipo,
    corrective_issue_id: correctiveIssueId,
    vehicle_maintenance_plan_id: vehicleMaintenancePlanId,
    data_abertura: str(formData.get("data_abertura")) ?? new Date().toISOString().slice(0, 10),
    km: num(formData.get("km")),
    horas: num(formData.get("horas")),
    problema_servico: problemaServico,
    prioridade: (str(formData.get("prioridade")) ?? "media") as Prioridade,
    fornecedor_id: fornecedorId,
    responsavel: str(formData.get("responsavel")),
    data_prevista: str(formData.get("data_prevista")),
    observacoes: str(formData.get("observacoes")),
  };

  const { data, error } = await supabase.from("maintenance_orders").insert(payload).select("id").single();
  if (error) return { error: `Não foi possível criar a ordem: ${error.message}` };

  if (correctiveIssueId) {
    await supabase
      .from("corrective_issues")
      .update({ status: "em_ordem", maintenance_order_id: data!.id })
      .eq("id", correctiveIssueId);
  }

  revalidatePath("/ordens");
  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/");
  return { id: data!.id };
}

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const status = str(formData.get("status")) as OrderStatus | null;
  if (!status) return { error: "Selecione um status." };

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };

  const payload: Partial<MaintenanceOrder> = {
    status,
    data_prevista: str(formData.get("data_prevista")),
  };

  if (status === "concluida") {
    payload.data_conclusao = str(formData.get("data_conclusao")) ?? new Date().toISOString().slice(0, 10);
  }

  const { error } = await supabase.from("maintenance_orders").update(payload).eq("id", orderId);
  if (error) return { error: `Não foi possível atualizar a ordem: ${error.message}` };

  if (status === "concluida") {
    // Fecha o ciclo preventivo: usa esta execução como nova base do plano.
    if (order.vehicle_maintenance_plan_id) {
      await supabase
        .from("vehicle_maintenance_plans")
        .update({
          ultima_execucao_data: payload.data_conclusao as string,
          ultima_execucao_km: order.km,
          ultima_execucao_horas: order.horas,
        })
        .eq("id", order.vehicle_maintenance_plan_id);
    }
    if (order.corrective_issue_id) {
      await supabase.from("corrective_issues").update({ status: "resolvido" }).eq("id", order.corrective_issue_id);
    }
    // Se a OS registrou uma leitura de KM/horímetro mais nova, mantém o veículo atualizado.
    if (order.km !== null || order.horas !== null) {
      await supabase.from("measurements").insert({
        vehicle_id: order.vehicle_id,
        km: order.km,
        horas: order.horas,
        data_leitura: payload.data_conclusao as string,
        observacao: `Registrado ao concluir a OS ${order.numero_os}`,
      });
    }
  }

  if (status === "aguardando_peca" || status === "em_execucao") {
    await supabase.from("vehicles").update({ status: "em_manutencao" }).eq("id", order.vehicle_id);
  }

  revalidatePath("/ordens");
  revalidatePath(`/ordens/${orderId}`);
  revalidatePath(`/veiculos/${order.vehicle_id}`);
  revalidatePath("/");
  return { id: orderId };
}

export async function updateOrderDescription(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const problemaServico = str(formData.get("problema_servico"));
  if (!problemaServico) return { error: "Descreva o problema ou serviço." };

  const { error } = await supabase
    .from("maintenance_orders")
    .update({ problema_servico: problemaServico })
    .eq("id", orderId);
  if (error) return { error: `Não foi possível salvar a descrição: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  revalidatePath("/ordens");
  return { id: orderId };
}

export async function updateOtherCosts(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const outrosCustos = num(formData.get("outros_custos")) ?? 0;

  const { error } = await supabase.from("maintenance_orders").update({ outros_custos: outrosCustos }).eq("id", orderId);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}

export async function addOrderItem(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const descricao = str(formData.get("descricao"));
  if (!descricao) return { error: "Descreva o item." };

  const payload = {
    order_id: orderId,
    descricao,
    quantidade: num(formData.get("quantidade")) ?? 1,
    valor_unitario: num(formData.get("valor_unitario")) ?? 0,
    mao_de_obra: num(formData.get("mao_de_obra")) ?? 0,
    observacao: str(formData.get("observacao")),
  };

  const { error } = await supabase.from("maintenance_order_items").insert(payload);
  if (error) return { error: `Não foi possível adicionar o item: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}

export async function updateOrderItem(orderId: string, itemId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const descricao = str(formData.get("descricao"));
  if (!descricao) return { error: "Descreva o item." };

  const payload = {
    descricao,
    quantidade: num(formData.get("quantidade")) ?? 1,
    valor_unitario: num(formData.get("valor_unitario")) ?? 0,
    mao_de_obra: num(formData.get("mao_de_obra")) ?? 0,
    observacao: str(formData.get("observacao")),
  };

  const { error } = await supabase.from("maintenance_order_items").update(payload).eq("id", itemId);
  if (error) return { error: `Não foi possível salvar o item: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}

export async function deleteOrderItem(orderId: string, itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_order_items").delete().eq("id", itemId);
  if (error) return { error: `Não foi possível remover o item: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}
