"use server";

import { createHash, timingSafeEqual } from "node:crypto";
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

// OS concluída ou cancelada só volta a andar pela reabertura com senha de administrador.
const STATUS_FINAIS: OrderStatus[] = ["concluida", "cancelada"];

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const status = str(formData.get("status")) as OrderStatus | null;
  if (!status) return { error: "Selecione um status." };
  if (status === "concluida") return { error: "Use o botão \"Fechar ordem de serviço\" para concluir." };

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (STATUS_FINAIS.includes(order.status)) {
    return { error: "Ordem encerrada. Para alterar, reabra com a senha de administrador." };
  }

  const payload: Partial<MaintenanceOrder> = {
    status,
    data_prevista: str(formData.get("data_prevista")),
  };

  const { error } = await supabase.from("maintenance_orders").update(payload).eq("id", orderId);
  if (error) return { error: `Não foi possível atualizar a ordem: ${error.message}` };

  if (status === "aguardando_peca" || status === "em_execucao") {
    await supabase.from("vehicles").update({ status: "em_manutencao" }).eq("id", order.vehicle_id);
  }

  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

export async function closeOrder(orderId: string, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (STATUS_FINAIS.includes(order.status)) return { error: "Esta ordem já está encerrada." };

  const dataConclusao = str(formData.get("data_conclusao"));
  if (!dataConclusao) return { error: "Informe a data de conclusão." };

  const km = num(formData.get("km"));
  const horas = num(formData.get("horas"));
  const planId = str(formData.get("vehicle_maintenance_plan_id"));
  if (planId && km === null && horas === null) {
    return { error: "Informe o KM ou o horímetro da execução para atualizar o plano preventivo." };
  }

  const { error } = await supabase
    .from("maintenance_orders")
    .update({
      status: "concluida",
      data_conclusao: dataConclusao,
      km,
      horas,
      vehicle_maintenance_plan_id: planId,
    })
    .eq("id", orderId);
  if (error) return { error: `Não foi possível fechar a ordem: ${error.message}` };

  // Fecha o ciclo preventivo: usa esta execução como nova base do plano.
  if (planId) {
    await supabase
      .from("vehicle_maintenance_plans")
      .update({ ultima_execucao_data: dataConclusao, ultima_execucao_km: km, ultima_execucao_horas: horas })
      .eq("id", planId);
  }
  if (order.corrective_issue_id) {
    await supabase.from("corrective_issues").update({ status: "resolvido" }).eq("id", order.corrective_issue_id);
  }
  // Se a OS registrou uma leitura de KM/horímetro, mantém o veículo atualizado.
  if (km !== null || horas !== null) {
    await supabase.from("measurements").insert({
      vehicle_id: order.vehicle_id,
      km,
      horas,
      data_leitura: dataConclusao,
      observacao: `Registrado ao fechar a OS ${order.numero_os}`,
    });
  }

  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

// Senha de administrador definida na Vercel (ADMIN_PASSWORD): mínimo 8 caracteres, com números e caractere especial.
function senhaAdminValida(informada: string): { ok: boolean; error?: string } {
  const configurada = process.env.ADMIN_PASSWORD ?? "";
  if (configurada.length < 8 || !/[0-9]/.test(configurada) || !/[^A-Za-z0-9]/.test(configurada)) {
    return {
      ok: false,
      error: "Senha de administrador não configurada. Cadastre ADMIN_PASSWORD na Vercel (mínimo 8 caracteres, com números e caractere especial).",
    };
  }
  const a = createHash("sha256").update(informada).digest();
  const b = createHash("sha256").update(configurada).digest();
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, error: "Senha de administrador incorreta." };
}

export async function reopenOrder(orderId: string, formData: FormData): Promise<ActionResult> {
  const senha = senhaAdminValida((formData.get("senha") ?? "").toString());
  if (!senha.ok) return { error: senha.error };

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("id, vehicle_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (!STATUS_FINAIS.includes(order.status)) return { error: "Esta ordem já está aberta." };

  const { error } = await supabase
    .from("maintenance_orders")
    .update({ status: "aberta", data_conclusao: null })
    .eq("id", orderId);
  if (error) return { error: `Não foi possível reabrir a ordem: ${error.message}` };

  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

function revalidateOrder(orderId: string, vehicleId: string) {
  revalidatePath("/ordens");
  revalidatePath(`/ordens/${orderId}`);
  revalidatePath(`/veiculos/${vehicleId}`);
  revalidatePath("/");
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
