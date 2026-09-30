import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { Card, CardBody } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import type { AuditLogEntry } from "@/lib/types";

export const revalidate = 0;

const TABELA_LABEL: Record<string, string> = {
  vehicles: "Veículo",
  measurements: "Medição",
  maintenance_orders: "Ordem de serviço",
  maintenance_order_items: "Item de OS",
  corrective_issues: "Problema",
  maintenance_plans: "Plano preventivo",
  vehicle_maintenance_plans: "Plano do veículo",
  alert_settings: "Limites de alerta",
  suppliers: "Fornecedor",
  profiles: "Usuário",
};

const ACAO_LABEL: Record<string, string> = { INSERT: "Incluiu", UPDATE: "Alterou", DELETE: "Excluiu" };

// Campos que mudam sozinhos e só poluem o resumo.
const IGNORAR = new Set(["updated_at", "created_at"]);

function resumo(e: AuditLogEntry): string {
  const base = e.depois ?? e.antes ?? {};
  const ident = (base.numero_os ?? base.identificador ?? base.numero_interno ?? base.nome ?? base.email ?? base.descricao) as
    | string
    | undefined;
  if (e.acao !== "UPDATE" || !e.antes || !e.depois) return ident ? String(ident) : "";
  const antes = e.antes;
  const depois = e.depois;
  const mudou = Object.keys(depois)
    .filter((k) => !IGNORAR.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(depois[k]))
    .map((k) => `${k}: ${antes[k] ?? "—"} → ${depois[k] ?? "—"}`);
  return [ident, ...mudou].filter(Boolean).join(" · ");
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tabela?: string; usuario?: string }>;
}) {
  if (!(await isAdmin())) notFound();
  const { tabela, usuario } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(300);
  if (tabela) query = query.eq("tabela", tabela);
  if (usuario) query = query.eq("user_email", usuario);
  const { data: registros } = await query.returns<AuditLogEntry[]>();

  const { data: emails } = await supabase.from("profiles").select("email").order("email");

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Auditoria</h1>
        <p className="text-sm text-gray-500">Quem fez o quê e quando. Últimos 300 registros.</p>
      </div>
      <Card className="p-4">
        <form method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Select name="tabela" defaultValue={tabela ?? ""}>
            <option value="">Todas as áreas</option>
            {Object.entries(TABELA_LABEL).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </Select>
          <Select name="usuario" defaultValue={usuario ?? ""}>
            <option value="">Todos os usuários</option>
            {(emails ?? []).map((e) => (
              <option key={e.email} value={e.email}>
                {e.email}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 sm:w-40"
          >
            Filtrar
          </button>
        </form>
      </Card>
      {!registros || registros.length === 0 ? (
        <EmptyState title="Nenhum registro" />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {registros.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{e.user_email ?? "Sistema"}</span> {ACAO_LABEL[e.acao] ?? e.acao}{" "}
                  {TABELA_LABEL[e.tabela] ?? e.tabela}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(e.created_at).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" })}
                </p>
                {resumo(e) ? <p className="mt-1 break-words text-xs text-gray-600">{resumo(e)}</p> : null}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
