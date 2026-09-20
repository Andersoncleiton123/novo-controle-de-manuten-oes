"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PRIORIDADE_LABEL } from "@/lib/labels";
import { todayISO } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function IssueForm({
  vehicles,
  defaultVehicleId,
  action,
}: {
  vehicles: Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[];
  defaultVehicleId?: string;
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
          router.push(`/problemas/${result?.id ?? ""}`);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Veículo" htmlFor="vehicle_id" required>
          <Select id="vehicle_id" name="vehicle_id" required defaultValue={defaultVehicleId ?? ""}>
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
        <FieldGroup label="Data" htmlFor="data_registro" required>
          <Input id="data_registro" name="data_registro" type="date" required defaultValue={todayISO()} />
        </FieldGroup>
        <FieldGroup label="KM" htmlFor="km">
          <Input id="km" name="km" type="number" min={0} />
        </FieldGroup>
        <FieldGroup label="Horímetro" htmlFor="horas">
          <Input id="horas" name="horas" type="number" min={0} />
        </FieldGroup>
        <FieldGroup label="Prioridade" htmlFor="prioridade" required>
          <Select id="prioridade" name="prioridade" defaultValue="media">
            {Object.entries(PRIORIDADE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Responsável" htmlFor="responsavel">
          <Input id="responsavel" name="responsavel" />
        </FieldGroup>
      </div>

      <FieldGroup label="Descrição do problema" htmlFor="descricao" required>
        <Textarea id="descricao" name="descricao" rows={3} required />
      </FieldGroup>

      <FieldGroup label="Observação" htmlFor="observacoes">
        <Textarea id="observacoes" name="observacoes" rows={2} />
      </FieldGroup>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FieldGroup label="Fotos" htmlFor="fotos">
          <input
            id="fotos"
            name="fotos"
            type="file"
            accept="image/*"
            multiple
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </FieldGroup>
        <FieldGroup label="Documentos" htmlFor="documentos">
          <input
            id="documentos"
            name="documentos"
            type="file"
            multiple
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </FieldGroup>
        <FieldGroup label="Orçamento" htmlFor="orcamento">
          <input
            id="orcamento"
            name="orcamento"
            type="file"
            multiple
            className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-xs file:font-medium"
          />
        </FieldGroup>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Registrar problema"}
        </Button>
      </div>
    </form>
  );
}
