// Tabela de permissões por perfil. É a referência exibida em /permissoes; a aplicação
// real das regras fica no banco (RLS e travas) e nas server actions.
export const PERMISSOES: { grupo: string; funcionalidade: string; admin: boolean; consultor: boolean }[] = [
  { grupo: "Consulta", funcionalidade: "Ver Dashboard, veículos, planos, OS, problemas, histórico, custos e calendário", admin: true, consultor: true },
  { grupo: "Medições", funcionalidade: "Lançar medição de KM e horímetro", admin: true, consultor: true },
  { grupo: "Medições", funcionalidade: "Lançar correção administrativa (valor menor que o anterior)", admin: true, consultor: false },
  { grupo: "Medições", funcionalidade: "Corrigir ou excluir medição passada", admin: true, consultor: false },
  { grupo: "Problemas", funcionalidade: "Registrar problema e alterar status", admin: true, consultor: true },
  { grupo: "Ordens de serviço", funcionalidade: "Abrir OS", admin: true, consultor: true },
  { grupo: "Ordens de serviço", funcionalidade: "Lançar e editar peças, serviços e outros custos", admin: true, consultor: true },
  { grupo: "Ordens de serviço", funcionalidade: "Editar descrição, KM e horímetro de OS aberta", admin: true, consultor: true },
  { grupo: "Ordens de serviço", funcionalidade: "Mudar status e fechar OS", admin: true, consultor: true },
  { grupo: "Ordens de serviço", funcionalidade: "Excluir item lançado na OS", admin: true, consultor: false },
  { grupo: "Ordens de serviço", funcionalidade: "Cancelar OS", admin: true, consultor: false },
  { grupo: "Ordens de serviço", funcionalidade: "Reabrir OS concluída ou cancelada", admin: true, consultor: false },
  { grupo: "Veículos", funcionalidade: "Cadastrar veículo", admin: true, consultor: false },
  { grupo: "Veículos", funcionalidade: "Alterar cadastro de veículo", admin: true, consultor: false },
  { grupo: "Veículos", funcionalidade: "Excluir veículo", admin: true, consultor: false },
  { grupo: "Planos", funcionalidade: "Criar e editar plano preventivo; ligar e desligar plano de veículo", admin: true, consultor: false },
  { grupo: "Configurações", funcionalidade: "Alterar limites de alerta", admin: true, consultor: false },
  { grupo: "Administração", funcionalidade: "Aprovar usuários e definir perfil", admin: true, consultor: false },
  { grupo: "Administração", funcionalidade: "Ver registro de auditoria", admin: true, consultor: false },
];
