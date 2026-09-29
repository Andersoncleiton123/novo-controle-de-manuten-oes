"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatHoras, formatKm } from "@/lib/format";
import type { Measurement } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function EditableMeasurementRow({
  measurement: m,
  updateAction,
  deleteAction,
}: {
  measurement: Measurement;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: (formData: FormData) => Promise<ActionResult>, form: HTMLFormElement) {
    setError(null);
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await action(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  if (!editing) {
    return (
      <li className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
        <span className="text-gray-500">{formatDate(m.data_leitura)}</span>
        <span className="text-gray-900">{m.km !== null ? formatKm(m.km) : "—"}</span>
        <span className="text-gray-900">{m.horas !== null ? formatHoras(m.horas) : "—"}</span>
        {m.correcao ? <Badge className="bg-gray-100 text-gray-500">correção</Badge> : <span />}
        <button
          type="button"
          aria-label="Corrigir medição"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </li>
    );
  }

  return (
    <li className="px-4 py-3">
      {error ? <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div> : null}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(updateAction, e.currentTarget);
        }}
        className="space-y-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <FieldGroup label="Data" htmlFor={`data_${m.id}`}>
            <Input id={`data_${m.id}`} name="data_leitura" type="date" required defaultValue={m.data_leitura} />
          </FieldGroup>
          <FieldGroup label="KM" htmlFor={`km_${m.id}`}>
            <Input id={`km_${m.id}`} name="km" type="number" step="1" min={0} defaultValue={m.km ?? ""} />
          </FieldGroup>
          <FieldGroup label="Horímetro" htmlFor={`horas_${m.id}`}>
            <Input id={`horas_${m.id}`} name="horas" type="number" step="1" min={0} defaultValue={m.horas ?? ""} />
          </FieldGroup>
        </div>
        <FieldGroup label="Observação" htmlFor={`obs_${m.id}`}>
          <Input id={`obs_${m.id}`} name="observacao" defaultValue={m.observacao ?? ""} />
        </FieldGroup>
        <FieldGroup label="Senha de administrador" htmlFor={`senha_${m.id}`}>
          <Input id={`senha_${m.id}`} name="senha" type="password" required autoComplete="current-password" className="w-56" />
        </FieldGroup>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "…" : "Salvar correção"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            disabled={pending}
            onClick={(e) => {
              const form = e.currentTarget.form;
              if (form && form.reportValidity() && window.confirm("Excluir esta medição?")) run(deleteAction, form);
            }}
          >
            Excluir medição
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
            Cancelar
          </Button>
        </div>
      </form>
    </li>
  );
}
