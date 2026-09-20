"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { todayISO } from "@/lib/format";

type ActionResult = { error?: string; id?: string };

export function MeasurementForm({
  vehicleId,
  currentKm,
  currentHoras,
  action,
}: {
  vehicleId: string;
  currentKm: number;
  currentHoras: number;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [correcao, setCorrecao] = useState(false);
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
          router.push(`/veiculos/${vehicleId}`);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="KM" htmlFor="km" hint={`Leitura atual: ${currentKm.toLocaleString("pt-BR")} km`}>
          <Input id="km" name="km" type="number" step="1" min={0} placeholder={String(currentKm)} />
        </FieldGroup>
        <FieldGroup
          label="Horímetro"
          htmlFor="horas"
          hint={`Leitura atual: ${currentHoras.toLocaleString("pt-BR")} h`}
        >
          <Input id="horas" name="horas" type="number" step="1" min={0} placeholder={String(currentHoras)} />
        </FieldGroup>
        <FieldGroup label="Data da leitura" htmlFor="data_leitura" required>
          <Input id="data_leitura" name="data_leitura" type="date" required defaultValue={todayISO()} />
        </FieldGroup>
      </div>

      <FieldGroup label="Observação" htmlFor="observacao">
        <Textarea id="observacao" name="observacao" rows={2} />
      </FieldGroup>

      <label className="flex items-start gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          name="correcao"
          checked={correcao}
          onChange={(e) => setCorrecao(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          Correção administrativa (permite registrar um valor menor que a leitura atual — use apenas para
          corrigir um erro de cadastro)
        </span>
      </label>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Registrar leitura"}
        </Button>
      </div>
    </form>
  );
}
