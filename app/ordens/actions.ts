"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigirAdmin, exigirAprovado } from "@/lib/auth";
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
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

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

// OS concluída ou cancelada só volta a andar pela reabertura feita pelo administrador.
const STATUS_FINAIS: OrderStatus[] = ["concluida", "cancelada"];

export async function updateOrderStatus(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

  const supabase = await createClient();

  const status = str(formData.get("status")) as OrderStatus | null;
  if (!status) return { error: "Selecione um status." };
  if (status === "concluida") return { error: "Use o botão \"Fechar ordem de serviço\" para concluir." };
  if (status === "cancelada" && (await exigirAdmin())) {
    return { error: "Somente o administrador pode cancelar ordem de serviço." };
  }

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (STATUS_FINAIS.includes(order.status)) {
    return { error: "Ordem encerrada. Somente o administrador pode reabrir." };
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
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

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
  if (!planId && order.tipo === "preventiva") {
    const { count } = await supabase
      .from("vehicle_maintenance_plans")
      .select("id", { count: "exact", head: true })
      .eq("vehicle_id", order.vehicle_id)
      .eq("ativo", true);
    if ((count ?? 0) > 0) {
      return { error: "Selecione o plano preventivo atendido para reiniciar a contagem da próxima manutenção." };
    }
  }

  // Registra a leitura da execução antes de fechar: o banco recusa KM/horímetro fora de ordem
  // em relação às medições anteriores e seguintes do veículo.
  // Reabrir e fechar de novo não duplica a leitura: só grava se ainda não houver a mesma.
  let jaRegistrada = false;
  if (km !== null || horas !== null) {
    let existente = supabase
      .from("measurements")
      .select("id")
      .eq("vehicle_id", order.vehicle_id)
      .eq("data_leitura", dataConclusao);
    existente = km === null ? existente.is("km", null) : existente.eq("km", km);
    existente = horas === null ? existente.is("horas", null) : existente.eq("horas", horas);
    const { data: iguais } = await existente.limit(1);
    jaRegistrada = (iguais ?? []).length > 0;
  }
  if (!jaRegistrada && (km !== null || horas !== null)) {
    const { error: leituraError } = await supabase.from("measurements").insert({
      vehicle_id: order.vehicle_id,
      km,
      horas,
      data_leitura: dataConclusao,
      observacao: `Registrado ao fechar a OS ${order.numero_os}`,
    });
    if (leituraError) {
      return { error: `KM/horímetro não conferem com as medições do veículo: ${leituraError.message}` };
    }
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
    const { error: planoError } = await supabase
      .from("vehicle_maintenance_plans")
      .update({ ultima_execucao_data: dataConclusao, ultima_execucao_km: km, ultima_execucao_horas: horas })
      .eq("id", planId);
    if (planoError) {
      revalidateOrder(orderId, order.vehicle_id);
      return { error: `Ordem fechada, mas o plano preventivo não foi atualizado: ${planoError.message}` };
    }
  }
  if (order.corrective_issue_id) {
    await supabase.from("corrective_issues").update({ status: "resolvido" }).eq("id", order.corrective_issue_id);
  }
  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

export async function updateOrderReadings(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("id, vehicle_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (STATUS_FINAIS.includes(order.status)) {
    return { error: "Ordem encerrada. Somente o administrador pode reabrir." };
  }

  const { error } = await supabase
    .from("maintenance_orders")
    .update({ km: num(formData.get("km")), horas: num(formData.get("horas")) })
    .eq("id", orderId);
  if (error) return { error: `Não foi possível salvar KM e horímetro: ${error.message}` };

  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

export async function reopenOrder(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAdmin();
  if (acesso) return { error: acesso };

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

const TIPOS: OrderTipo[] = ["preventiva", "corretiva"];
const PRIORIDADES: Prioridade[] = ["critica", "alta", "media", "baixa"];

export async function updateOrderDetails(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("maintenance_orders")
    .select("id, vehicle_id, status")
    .eq("id", orderId)
    .single();

  if (!order) return { error: "Ordem não encontrada." };
  if (STATUS_FINAIS.includes(order.status)) {
    return { error: "Ordem encerrada. Somente o administrador pode reabrir." };
  }

  const tipo = str(formData.get("tipo")) as OrderTipo | null;
  if (!tipo || !TIPOS.includes(tipo)) return { error: "Selecione o tipo da ordem." };

  const prioridade = str(formData.get("prioridade")) as Prioridade | null;
  if (!prioridade || !PRIORIDADES.includes(prioridade)) return { error: "Selecione a prioridade." };

  const dataAbertura = str(formData.get("data_abertura"));
  if (!dataAbertura) return { error: "Informe a data de abertura." };

  // Plano só faz sentido em preventiva; ao passar para corretiva o vínculo é removido.
  let planId = tipo === "preventiva" ? str(formData.get("vehicle_maintenance_plan_id")) : null;
  if (planId) {
    const { data: plano } = await supabase
      .from("vehicle_maintenance_plans")
      .select("id")
      .eq("id", planId)
      .eq("vehicle_id", order.vehicle_id)
      .maybeSingle();
    if (!plano) planId = null;
  }

  const fornecedorId = await resolveSupplierId(supabase, str(formData.get("fornecedor")));

  const { error } = await supabase
    .from("maintenance_orders")
    .update({
      tipo,
      prioridade,
      vehicle_maintenance_plan_id: planId,
      data_abertura: dataAbertura,
      data_prevista: str(formData.get("data_prevista")),
      fornecedor_id: fornecedorId,
      responsavel: str(formData.get("responsavel")),
      observacoes: str(formData.get("observacoes")),
    })
    .eq("id", orderId);
  if (error) return { error: `Não foi possível salvar a ordem: ${error.message}` };

  revalidateOrder(orderId, order.vehicle_id);
  return { id: orderId };
}

export async function updateOrderDescription(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

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
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

  const supabase = await createClient();
  const outrosCustos = num(formData.get("outros_custos")) ?? 0;

  const { error } = await supabase.from("maintenance_orders").update({ outros_custos: outrosCustos }).eq("id", orderId);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}

export async function addOrderItem(orderId: string, formData: FormData): Promise<ActionResult> {
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

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
  const acesso = await exigirAprovado();
  if (acesso) return { error: acesso };

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
  const acesso = await exigirAdmin();
  if (acesso) return { error: acesso };

  const supabase = await createClient();
  const { error } = await supabase.from("maintenance_order_items").delete().eq("id", itemId);
  if (error) return { error: `Não foi possível remover o item: ${error.message}` };

  revalidatePath(`/ordens/${orderId}`);
  return { id: orderId };
}
