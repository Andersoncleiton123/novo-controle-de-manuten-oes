import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LinkButton } from "@/components/ui/Button";
import { StatusButton } from "@/components/issues/StatusButton";
import { updateIssueStatus } from "@/app/problemas/actions";
import { formatDate, formatHoras, formatKm } from "@/lib/format";
import { CORRECTIVE_STATUS_LABEL, PRIORIDADE_COLOR, PRIORIDADE_LABEL } from "@/lib/labels";
import type { Attachment, CorrectiveIssue, Vehicle } from "@/lib/types";

export const revalidate = 0;

type IssueWithVehicle = CorrectiveIssue & { vehicles: Vehicle | null };

const ATTACHMENT_TYPE_LABEL: Record<string, string> = {
  foto: "Foto",
  documento: "Documento",
  orcamento: "Orçamento",
};

export default async function ProblemaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: issue } = await supabase
    .from("corrective_issues")
    .select("*, vehicles(*)")
    .eq("id", id)
    .single<IssueWithVehicle>();

  if (!issue) notFound();

  const { data: attachments } = await supabase
    .from("attachments")
    .select("*")
    .eq("entity_type", "problema")
    .eq("entity_id", id)
    .returns<Attachment[]>();

  const attachmentsWithUrl = (attachments ?? []).map((a) => ({
    ...a,
    url: supabase.storage.from("attachments").getPublicUrl(a.storage_path).data.publicUrl,
  }));

  const resolveAction = updateIssueStatus.bind(null, id, "resolvido");
  const reopenAction = updateIssueStatus.bind(null, id, "aberto");

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Problema</h1>
            <Badge className={PRIORIDADE_COLOR[issue.prioridade]}>{PRIORIDADE_LABEL[issue.prioridade]}</Badge>
            <Badge className="bg-gray-100 text-gray-600">{CORRECTIVE_STATUS_LABEL[issue.status]}</Badge>
          </div>
          {issue.vehicles ? (
            <Link href={`/veiculos/${issue.vehicle_id}`} className="text-sm text-brand-600 hover:underline">
              {issue.vehicles.numero_interno ?? issue.vehicles.identificador} — {issue.vehicles.nome ?? issue.vehicles.identificador}
            </Link>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {issue.status === "aberto" ? (
            <>
              <LinkButton href={`/ordens/nova?veiculo=${issue.vehicle_id}&problema=${issue.id}`} size="sm">
                Abrir ordem de manutenção
              </LinkButton>
              <StatusButton label="Marcar como resolvido" action={resolveAction} />
            </>
          ) : (
            <StatusButton label="Reabrir problema" action={reopenAction} />
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          <p className="text-sm text-gray-900">{issue.descricao}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
            <span>Registrado em {formatDate(issue.data_registro)}</span>
            {issue.km !== null ? <span>{formatKm(issue.km)}</span> : null}
            {issue.horas !== null ? <span>{formatHoras(issue.horas)}</span> : null}
            {issue.responsavel ? <span>Responsável: {issue.responsavel}</span> : null}
          </div>
          {issue.observacoes ? <p className="mt-2 text-sm text-gray-600">{issue.observacoes}</p> : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Anexos" subtitle={`${attachmentsWithUrl.length} arquivo(s)`} />
        <CardBody className="p-0">
          {attachmentsWithUrl.length === 0 ? (
            <p className="px-4 py-3 text-sm text-gray-500">Nenhum anexo.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {attachmentsWithUrl.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm text-gray-700">
                    {ATTACHMENT_TYPE_LABEL[a.tipo] ?? a.tipo} — {a.nome_arquivo}
                  </span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Abrir
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
