"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ORDER_TIPO_LABEL, PRIORIDADE_LABEL } from "@/lib/labels";
import type { OrderTipo, Prioridade } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function EditOrderForm({
  tipo,
  prioridade,
  dataAbertura,
  dataPrevista,
  fornecedor,
  responsavel,
  observacoes,
  planoId,
  planos,
  action,
}: {
  tipo: OrderTipo;
  prioridade: Prioridade;
  dataAbertura: string;
  dataPrevista: string | null;
  fornecedor: string | null;
  responsavel: string | null;
  observacoes: string | null;
  planoId: string | null;
  planos: { id: string; nome: string }[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [tipoAtual, setTipoAtual] = useState<OrderTipo>(tipo);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setTipoAtual(tipo);
          setError(null);
          setEditing(true);
        }}
      >
        <Pencil className="mr-1.5 h-3.5 w-3.5" />
        Editar dados da OS
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setEditing(false);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Tipo" htmlFor="edit_tipo" required>
          <Select
            id="edit_tipo"
            name="tipo"
            value={tipoAtual}
            onChange={(e) => setTipoAtual(e.target.value as OrderTipo)}
          >
            {Object.entries(ORDER_TIPO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Prioridade" htmlFor="edit_prioridade" required>
          <Select id="edit_prioridade" name="prioridade" defaultValue={prioridade}>
            {Object.entries(PRIORIDADE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        {tipoAtual === "preventiva" ? (
          <FieldGroup
            label="Plano preventivo"
            htmlFor="edit_plano"
            hint="Plano que esta OS atende; pode ser ajustado também no fechamento"
          >
            <Select id="edit_plano" name="vehicle_maintenance_plan_id" defaultValue={planoId ?? ""}>
              <option value="">Definir no fechamento</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </FieldGroup>
        ) : null}
        <FieldGroup label="Data de abertura" htmlFor="edit_data_abertura" required>
          <Input id="edit_data_abertura" name="data_abertura" type="date" required defaultValue={dataAbertura} />
        </FieldGroup>
        <FieldGroup label="Data prevista de conclusão" htmlFor="edit_data_prevista">
          <Input id="edit_data_prevista" name="data_prevista" type="date" defaultValue={dataPrevista ?? ""} />
        </FieldGroup>
        <FieldGroup label="Oficina / fornecedor" htmlFor="edit_fornecedor">
          <Input id="edit_fornecedor" name="fornecedor" defaultValue={fornecedor ?? ""} />
        </FieldGroup>
        <FieldGroup label="Responsável" htmlFor="edit_responsavel">
          <Input id="edit_responsavel" name="responsavel" defaultValue={responsavel ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup label="Observações" htmlFor="edit_observacoes">
        <Textarea id="edit_observacoes" name="observacoes" rows={2} defaultValue={observacoes ?? ""} />
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar alterações"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
