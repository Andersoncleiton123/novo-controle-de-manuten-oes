"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { MaintenancePlan } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function PlanForm({
  action,
  defaultValues,
  submitLabel = "Salvar",
  showAtivo = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: Partial<MaintenancePlan>;
  submitLabel?: string;
  showAtivo?: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
          router.push(`/planos/${result?.id ?? ""}`);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <FieldGroup label="Nome do serviço" htmlFor="nome" required>
        <Input id="nome" name="nome" required defaultValue={defaultValues?.nome ?? ""} placeholder="Troca de óleo do motor" />
      </FieldGroup>

      <FieldGroup label="Descrição" htmlFor="descricao">
        <Textarea id="descricao" name="descricao" rows={2} defaultValue={defaultValues?.descricao ?? ""} />
      </FieldGroup>

      <div>
        <p className="mb-1 text-xs font-medium text-gray-700">
          Intervalo — o que ocorrer primeiro
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="A cada (KM)" htmlFor="intervalo_km">
            <Input
              id="intervalo_km"
              name="intervalo_km"
              type="number"
              min={0}
              defaultValue={defaultValues?.intervalo_km ?? ""}
            />
          </FieldGroup>
          <FieldGroup label="A cada (horas)" htmlFor="intervalo_horas">
            <Input
              id="intervalo_horas"
              name="intervalo_horas"
              type="number"
              min={0}
              defaultValue={defaultValues?.intervalo_horas ?? ""}
            />
          </FieldGroup>
          <FieldGroup label="A cada (dias)" htmlFor="intervalo_dias">
            <Input
              id="intervalo_dias"
              name="intervalo_dias"
              type="number"
              min={0}
              defaultValue={defaultValues?.intervalo_dias ?? ""}
            />
          </FieldGroup>
        </div>
      </div>

      <FieldGroup label="Observações" htmlFor="observacoes">
        <Textarea id="observacoes" name="observacoes" rows={2} defaultValue={defaultValues?.observacoes ?? ""} />
      </FieldGroup>

      {showAtivo ? (
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" name="ativo" defaultChecked={defaultValues?.ativo ?? true} />
          Plano ativo
        </label>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
