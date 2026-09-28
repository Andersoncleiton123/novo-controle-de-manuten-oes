"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/format";

type ActionResult = { error?: string; id?: string };

export function CloseOrderForm({
  km,
  horas,
  planos,
  planoAtualId,
  action,
}: {
  km: number | null;
  horas: number | null;
  planos: { id: string; nome: string }[];
  planoAtualId: string | null;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!aberto) {
    return (
      <Button onClick={() => setAberto(true)}>Fechar ordem de serviço</Button>
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
          setAberto(false);
          router.refresh();
        });
      }}
      className="space-y-3"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldGroup label="Data de conclusão" htmlFor="data_conclusao" required>
          <Input id="data_conclusao" name="data_conclusao" type="date" required defaultValue={todayISO()} />
        </FieldGroup>
        <FieldGroup label="KM na execução" htmlFor="close_km">
          <Input id="close_km" name="km" type="number" step="1" min={0} defaultValue={km ?? ""} />
        </FieldGroup>
        <FieldGroup label="Horímetro na execução" htmlFor="close_horas">
          <Input id="close_horas" name="horas" type="number" step="1" min={0} defaultValue={horas ?? ""} />
        </FieldGroup>
      </div>
      <FieldGroup
        label="Plano preventivo atendido"
        htmlFor="vehicle_maintenance_plan_id"
        hint="A data, o KM e o horímetro acima passam a ser a última execução do plano"
      >
        <Select id="vehicle_maintenance_plan_id" name="vehicle_maintenance_plan_id" defaultValue={planoAtualId ?? ""}>
          <option value="">Nenhum</option>
          {planos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Fechando…" : "Confirmar fechamento"}
        </Button>
        <Button variant="ghost" onClick={() => setAberto(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
