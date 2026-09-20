// Tipos do banco de dados (Supabase). Escritos manualmente cobrindo apenas
// as tabelas/views usadas pela aplicação V1.

export type VehicleStatus =
  | "em_operacao"
  | "disponivel"
  | "em_manutencao"
  | "parado"
  | "desmobilizado";

export type VehicleTipo = "betoneira" | "veiculo";

export type Prioridade = "critica" | "alta" | "media" | "baixa";

export type CorrectiveStatus = "aberto" | "em_ordem" | "resolvido";

export type OrderStatus =
  | "aberta"
  | "aguardando_aprovacao"
  | "aguardando_peca"
  | "em_execucao"
  | "concluida"
  | "cancelada";

export type OrderTipo = "preventiva" | "corretiva";

export type NivelAlerta = "em_dia" | "proxima" | "atencao" | "atrasada" | "sem_baseline";

export type Vehicle = {
  id: string;
  tipo: VehicleTipo;
  identificador: string;
  nome: string | null;
  numero_interno: string | null;
  marca: string | null;
  modelo: string | null;
  ano: number | null;
  chassi: string | null;
  km_atual: number;
  horimetro_atual: number;
  cliente_atual: string | null;
  status: VehicleStatus;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  nome: string;
  contato: string | null;
  telefone: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type Part = {
  id: string;
  nome: string;
  unidade: string;
  preco_padrao: number;
  created_at: string;
  updated_at: string;
};

export type MaintenancePlan = {
  id: string;
  nome: string;
  descricao: string | null;
  intervalo_km: number | null;
  intervalo_horas: number | null;
  intervalo_dias: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type VehicleMaintenancePlan = {
  id: string;
  vehicle_id: string;
  plan_id: string;
  ativo: boolean;
  intervalo_km_override: number | null;
  intervalo_horas_override: number | null;
  intervalo_dias_override: number | null;
  ultima_execucao_data: string | null;
  ultima_execucao_km: number | null;
  ultima_execucao_horas: number | null;
  created_at: string;
  updated_at: string;
};

export type Measurement = {
  id: string;
  vehicle_id: string;
  km: number | null;
  horas: number | null;
  data_leitura: string;
  observacao: string | null;
  correcao: boolean;
  created_at: string;
};

export type CorrectiveIssue = {
  id: string;
  vehicle_id: string;
  data_registro: string;
  km: number | null;
  horas: number | null;
  descricao: string;
  prioridade: Prioridade;
  responsavel: string | null;
  observacoes: string | null;
  status: CorrectiveStatus;
  maintenance_order_id: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceOrder = {
  id: string;
  numero_os: string;
  vehicle_id: string;
  tipo: OrderTipo;
  vehicle_maintenance_plan_id: string | null;
  corrective_issue_id: string | null;
  data_abertura: string;
  km: number | null;
  horas: number | null;
  problema_servico: string;
  prioridade: Prioridade;
  fornecedor_id: string | null;
  responsavel: string | null;
  status: OrderStatus;
  data_prevista: string | null;
  data_conclusao: string | null;
  outros_custos: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
};

export type MaintenanceOrderItem = {
  id: string;
  order_id: string;
  descricao: string;
  part_id: string | null;
  quantidade: number;
  valor_unitario: number;
  mao_de_obra: number;
  valor_total: number;
  observacao: string | null;
  created_at: string;
};

export type Attachment = {
  id: string;
  entity_type: "problema" | "ordem";
  entity_id: string;
  tipo: "foto" | "documento" | "orcamento";
  storage_path: string;
  nome_arquivo: string | null;
  created_at: string;
};

export type AlertSettings = {
  id: number;
  aviso_km: number;
  aviso_horas: number;
  aviso_dias: number;
  atencao_km: number;
  atencao_horas: number;
  atencao_dias: number;
  created_at: string;
  updated_at: string;
};

export type MaintenanceHistoryEntry = {
  id: string;
  vehicle_id: string;
  data: string;
  categoria: string;
  servico: string;
  km: number | null;
  horas: number | null;
  custo: number;
  responsavel: string | null;
  fornecedor: string | null;
  observacoes: string | null;
  origem: string;
};

export type VehiclePlanStatus = {
  vehicle_plan_id: string;
  vehicle_id: string;
  vehicle_nome: string | null;
  vehicle_placa: string;
  vehicle_numero_interno: string | null;
  plan_id: string;
  plano_nome: string;
  intervalo_km: number | null;
  intervalo_horas: number | null;
  intervalo_dias: number | null;
  ultima_execucao_data: string | null;
  ultima_execucao_km: number | null;
  ultima_execucao_horas: number | null;
  km_atual: number;
  horimetro_atual: number;
  proximo_km: number | null;
  proxima_horas: number | null;
  proxima_data: string | null;
  restante_km: number | null;
  restante_horas: number | null;
  restante_dias: number | null;
  nivel_alerta: NivelAlerta;
};

export type AlertFeedItem = {
  origem: "plano" | "problema" | "ordem_servico" | "veiculo_parado";
  nivel: NivelAlerta;
  vehicle_id: string;
  vehicle_nome: string | null;
  vehicle_placa: string;
  descricao: string;
  data_referencia: string | null;
};

export type FullHistoryEntry = {
  id: string;
  vehicle_id: string;
  data: string;
  categoria: string;
  servico: string;
  km: number | null;
  horas: number | null;
  custo: number;
  fornecedor: string | null;
  responsavel: string | null;
  origem: string;
};

export type DashboardSummary = {
  total_veiculos: number;
  em_operacao: number;
  disponiveis: number;
  em_manutencao: number;
  parados: number;
  manutencoes_atrasadas: number;
  manutencoes_proximas: number;
  os_abertas: number;
  custo_mes: number;
};

// Minimal Database generic so supabase-js typing compiles. Not exhaustive
// (legacy tables/views from before V1 are intentionally omitted).
//
// NOTE: row types above are declared with `type X = {...}`, not
// `interface X {...}`. postgrest-js's insert()/update() overloads resolve
// the payload type through nested conditional types keyed off `Row`/`Insert`;
// with an `interface` in that position they silently collapse to `never`
// (every insert/update call looks like it expects `never[]`), while a plain
// object type alias resolves correctly. Verified empirically against
// @supabase/supabase-js 2.116. Keep these as `type`, not `interface`.
export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      vehicles: { Row: Vehicle; Insert: Partial<Vehicle>; Update: Partial<Vehicle>; Relationships: [] };
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier>; Relationships: [] };
      parts: { Row: Part; Insert: Partial<Part>; Update: Partial<Part>; Relationships: [] };
      maintenance_plans: {
        Row: MaintenancePlan;
        Insert: Partial<MaintenancePlan>;
        Update: Partial<MaintenancePlan>;
        Relationships: [];
      };
      vehicle_maintenance_plans: {
        Row: VehicleMaintenancePlan;
        Insert: Partial<VehicleMaintenancePlan>;
        Update: Partial<VehicleMaintenancePlan>;
        Relationships: [];
      };
      measurements: {
        Row: Measurement;
        Insert: Partial<Measurement>;
        Update: Partial<Measurement>;
        Relationships: [];
      };
      corrective_issues: {
        Row: CorrectiveIssue;
        Insert: Partial<CorrectiveIssue>;
        Update: Partial<CorrectiveIssue>;
        Relationships: [];
      };
      maintenance_orders: {
        Row: MaintenanceOrder;
        Insert: Partial<MaintenanceOrder>;
        Update: Partial<MaintenanceOrder>;
        Relationships: [];
      };
      maintenance_order_items: {
        Row: MaintenanceOrderItem;
        Insert: Partial<MaintenanceOrderItem>;
        Update: Partial<MaintenanceOrderItem>;
        Relationships: [];
      };
      attachments: {
        Row: Attachment;
        Insert: Partial<Attachment>;
        Update: Partial<Attachment>;
        Relationships: [];
      };
      alert_settings: {
        Row: AlertSettings;
        Insert: Partial<AlertSettings>;
        Update: Partial<AlertSettings>;
        Relationships: [];
      };
      maintenance_history: {
        Row: MaintenanceHistoryEntry;
        Insert: Partial<MaintenanceHistoryEntry>;
        Update: Partial<MaintenanceHistoryEntry>;
        Relationships: [];
      };
    };
    Views: {
      v_vehicle_plan_status: { Row: VehiclePlanStatus; Relationships: [] };
      v_alerts: { Row: AlertFeedItem; Relationships: [] };
      v_full_history: { Row: FullHistoryEntry; Relationships: [] };
      v_dashboard_summary: { Row: DashboardSummary; Relationships: [] };
    };
    Functions: Record<string, never>;
  };
};
