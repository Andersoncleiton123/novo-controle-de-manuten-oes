"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { AlertSettings } from "@/lib/types";

type ActionResult = { error?: string };

export function AlertSettingsForm({
  defaultValues,
  action,
}: {
  defaultValues: AlertSettings;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        setSaved(false);
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          setSaved(true);
          router.refresh();
        });
      }}
      className="space-y-5"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {saved ? <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Parâmetros salvos.</div> : null}

      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">🟡 Próxima — avisar quando faltar</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="KM" htmlFor="aviso_km">
            <Input id="aviso_km" name="aviso_km" type="number" min={0} defaultValue={defaultValues.aviso_km} />
          </FieldGroup>
          <FieldGroup label="Horas" htmlFor="aviso_horas">
            <Input id="aviso_horas" name="aviso_horas" type="number" min={0} defaultValue={defaultValues.aviso_horas} />
          </FieldGroup>
          <FieldGroup label="Dias" htmlFor="aviso_dias">
            <Input id="aviso_dias" name="aviso_dias" type="number" min={0} defaultValue={defaultValues.aviso_dias} />
          </FieldGroup>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-900">🟠 Atenção — avisar quando faltar</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="KM" htmlFor="atencao_km">
            <Input id="atencao_km" name="atencao_km" type="number" min={0} defaultValue={defaultValues.atencao_km} />
          </FieldGroup>
          <FieldGroup label="Horas" htmlFor="atencao_horas">
            <Input id="atencao_horas" name="atencao_horas" type="number" min={0} defaultValue={defaultValues.atencao_horas} />
          </FieldGroup>
          <FieldGroup label="Dias" htmlFor="atencao_dias">
            <Input id="atencao_dias" name="atencao_dias" type="number" min={0} defaultValue={defaultValues.atencao_dias} />
          </FieldGroup>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        🔴 Atrasada é automático: quando o KM, horímetro ou data já passou do previsto.
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar parâmetros"}
        </Button>
      </div>
    </form>
  );
}
