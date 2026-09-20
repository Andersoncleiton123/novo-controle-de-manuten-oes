import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Field";
import { formatDate } from "@/lib/format";
import { CORRECTIVE_STATUS_LABEL, PRIORIDADE_COLOR, PRIORIDADE_LABEL } from "@/lib/labels";
import type { CorrectiveIssue, CorrectiveStatus, Prioridade, Vehicle } from "@/lib/types";

export const revalidate = 0;

type IssueWithVehicle = CorrectiveIssue & { vehicles: Pick<Vehicle, "nome" | "identificador" | "numero_interno"> | null };

export default async function ProblemasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; prioridade?: string }>;
}) {
  const { status, prioridade } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("corrective_issues")
    .select("*, vehicles(nome, identificador, numero_interno)")
    .order("data_registro", { ascending: false });

  if (status) query = query.eq("status", status as CorrectiveStatus);
  if (prioridade) query = query.eq("prioridade", prioridade as Prioridade);

  const { data: issues } = await query.returns<IssueWithVehicle[]>();

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Problemas</h1>
          <p className="text-sm text-gray-500">Manutenções corretivas registradas.</p>
        </div>
        <LinkButton href="/problemas/novo">+ Registrar problema</LinkButton>
      </div>

      <Card className="p-4">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <Select name="status" defaultValue={status ?? ""} className="sm:w-56">
            <option value="">Todos os status</option>
            {Object.entries(CORRECTIVE_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <Select name="prioridade" defaultValue={prioridade ?? ""} className="sm:w-56">
            <option value="">Todas as prioridades</option>
            {Object.entries(PRIORIDADE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Filtrar
          </button>
        </form>
      </Card>

      {!issues || issues.length === 0 ? (
        <EmptyState title="Nenhum problema registrado" />
      ) : (
        <Card className="p-0">
          <ul className="divide-y divide-gray-100">
            {issues.map((i) => (
              <li key={i.id}>
                <Link href={`/problemas/${i.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {i.vehicles?.numero_interno ?? i.vehicles?.identificador} — {i.descricao}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(i.data_registro)} · {CORRECTIVE_STATUS_LABEL[i.status]}
                    </p>
                  </div>
                  <Badge className={PRIORIDADE_COLOR[i.prioridade]}>{PRIORIDADE_LABEL[i.prioridade]}</Badge>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
