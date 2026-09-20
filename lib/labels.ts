import type {
  CorrectiveStatus,
  NivelAlerta,
  OrderStatus,
  OrderTipo,
  Prioridade,
  VehicleStatus,
  VehicleTipo,
} from "@/lib/types";

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  em_operacao: "Em operação",
  disponivel: "Disponível",
  em_manutencao: "Em manutenção",
  parado: "Parado",
  desmobilizado: "Desmobilizado",
};

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  em_operacao: "bg-blue-100 text-blue-800",
  disponivel: "bg-green-100 text-green-800",
  em_manutencao: "bg-yellow-100 text-yellow-800",
  parado: "bg-red-100 text-red-800",
  desmobilizado: "bg-gray-200 text-gray-600",
};

export const VEHICLE_TIPO_LABEL: Record<VehicleTipo, string> = {
  betoneira: "Betoneira",
  veiculo: "Veículo",
};

export const VEHICLE_TIPO_COLOR: Record<VehicleTipo, string> = {
  betoneira: "bg-purple-100 text-purple-800",
  veiculo: "bg-slate-100 text-slate-700",
};

export const PRIORIDADE_LABEL: Record<Prioridade, string> = {
  critica: "Crítica",
  alta: "Alta",
  media: "Média",
  baixa: "Baixa",
};

export const PRIORIDADE_ICON: Record<Prioridade, string> = {
  critica: "🔴",
  alta: "🟠",
  media: "🟡",
  baixa: "🟢",
};

export const PRIORIDADE_COLOR: Record<Prioridade, string> = {
  critica: "bg-red-100 text-red-800",
  alta: "bg-orange-100 text-orange-800",
  media: "bg-yellow-100 text-yellow-800",
  baixa: "bg-green-100 text-green-800",
};

export const CORRECTIVE_STATUS_LABEL: Record<CorrectiveStatus, string> = {
  aberto: "Aberto",
  em_ordem: "Em ordem de manutenção",
  resolvido: "Resolvido",
};

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aberta: "Aberta",
  aguardando_aprovacao: "Aguardando aprovação",
  aguardando_peca: "Aguardando peça",
  em_execucao: "Em execução",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
  aberta: "bg-blue-100 text-blue-800",
  aguardando_aprovacao: "bg-yellow-100 text-yellow-800",
  aguardando_peca: "bg-orange-100 text-orange-800",
  em_execucao: "bg-purple-100 text-purple-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-gray-200 text-gray-600",
};

export const ORDER_TIPO_LABEL: Record<OrderTipo, string> = {
  preventiva: "Preventiva",
  corretiva: "Corretiva",
};

export const NIVEL_ALERTA_LABEL: Record<NivelAlerta, string> = {
  em_dia: "Em dia",
  proxima: "Próxima",
  atencao: "Atenção",
  atrasada: "Atrasada",
  sem_baseline: "Sem registro inicial",
};

export const NIVEL_ALERTA_ICON: Record<NivelAlerta, string> = {
  em_dia: "🟢",
  proxima: "🟡",
  atencao: "🟠",
  atrasada: "🔴",
  sem_baseline: "⚪",
};

export const NIVEL_ALERTA_COLOR: Record<NivelAlerta, string> = {
  em_dia: "bg-green-100 text-green-800",
  proxima: "bg-yellow-100 text-yellow-800",
  atencao: "bg-orange-100 text-orange-800",
  atrasada: "bg-red-100 text-red-800",
  sem_baseline: "bg-gray-100 text-gray-500",
};

export const CATEGORIA_HISTORICO_LABEL: Record<string, string> = {
  oleo: "Troca de óleo",
  pneu: "Troca de pneu",
  lubrificante: "Lubrificante",
  revisao: "Revisão preventiva",
  outro: "Outro",
};
