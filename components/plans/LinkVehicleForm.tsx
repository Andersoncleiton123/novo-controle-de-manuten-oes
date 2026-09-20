"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { Vehicle } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function LinkVehicleForm({
  vehicles,
  action,
}: {
  vehicles: Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[];
  action: (formData: FormData) => Promise<ActionResult>;
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
          (e.target as HTMLFormElement).reset();
          router.refresh();
        });
      }}
      className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Veículo" htmlFor="vehicle_id" required>
          <Select id="vehicle_id" name="vehicle_id" required defaultValue="">
            <option value="" disabled>
              Selecione…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.numero_interno ?? v.identificador} — {v.nome ?? v.identificador}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Data da última execução" htmlFor="ultima_execucao_data">
          <Input id="ultima_execucao_data" name="ultima_execucao_data" type="date" />
        </FieldGroup>
        <FieldGroup label="KM na última execução" htmlFor="ultima_execucao_km">
          <Input id="ultima_execucao_km" name="ultima_execucao_km" type="number" min={0} />
        </FieldGroup>
        <FieldGroup label="Horímetro na última execução" htmlFor="ultima_execucao_horas">
          <Input id="ultima_execucao_horas" name="ultima_execucao_horas" type="number" min={0} />
        </FieldGroup>
      </div>
      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Vinculando…" : "Vincular veículo"}
        </Button>
      </div>
    </form>
  );
}
