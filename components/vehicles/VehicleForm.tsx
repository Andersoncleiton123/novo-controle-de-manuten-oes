"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { VEHICLE_STATUS_LABEL } from "@/lib/labels";
import type { Vehicle } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function VehicleForm({
  action,
  defaultValues,
  submitLabel = "Salvar",
  showReadings = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  defaultValues?: Partial<Vehicle>;
  submitLabel?: string;
  showReadings?: boolean;
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
          router.push(`/veiculos/${result?.id ?? ""}`);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Número interno" htmlFor="numero_interno" hint='Ex: "BT 13"'>
          <Input id="numero_interno" name="numero_interno" defaultValue={defaultValues?.numero_interno ?? ""} />
        </FieldGroup>
        <FieldGroup label="Placa" htmlFor="identificador" required>
          <Input
            id="identificador"
            name="identificador"
            required
            defaultValue={defaultValues?.identificador ?? ""}
            placeholder="ABC-1D23"
          />
        </FieldGroup>
        <FieldGroup label="Nome / apelido" htmlFor="nome" hint='Ex: "BT 13 - Convicta"'>
          <Input id="nome" name="nome" defaultValue={defaultValues?.nome ?? ""} />
        </FieldGroup>
        <FieldGroup label="Status" htmlFor="status" required>
          <Select id="status" name="status" defaultValue={defaultValues?.status ?? "disponivel"}>
            {Object.entries(VEHICLE_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Marca" htmlFor="marca">
          <Input id="marca" name="marca" defaultValue={defaultValues?.marca ?? ""} />
        </FieldGroup>
        <FieldGroup label="Modelo" htmlFor="modelo">
          <Input id="modelo" name="modelo" defaultValue={defaultValues?.modelo ?? ""} />
        </FieldGroup>
        <FieldGroup label="Ano" htmlFor="ano">
          <Input id="ano" name="ano" type="number" min={1980} max={2100} defaultValue={defaultValues?.ano ?? ""} />
        </FieldGroup>
        <FieldGroup label="Chassi" htmlFor="chassi">
          <Input id="chassi" name="chassi" defaultValue={defaultValues?.chassi ?? ""} />
        </FieldGroup>
        <FieldGroup label="Cliente atual" htmlFor="cliente_atual" hint="Preenchimento livre — módulo de contratos chega em versão futura">
          <Input id="cliente_atual" name="cliente_atual" defaultValue={defaultValues?.cliente_atual ?? ""} />
        </FieldGroup>

        {showReadings ? (
          <>
            <FieldGroup label="KM inicial" htmlFor="km_atual">
              <Input id="km_atual" name="km_atual" type="number" step="1" min={0} defaultValue={defaultValues?.km_atual ?? 0} />
            </FieldGroup>
            <FieldGroup label="Horímetro inicial" htmlFor="horimetro_atual">
              <Input
                id="horimetro_atual"
                name="horimetro_atual"
                type="number"
                step="1"
                min={0}
                defaultValue={defaultValues?.horimetro_atual ?? 0}
              />
            </FieldGroup>
          </>
        ) : null}
      </div>

      <FieldGroup label="Observações" htmlFor="observacoes">
        <Textarea id="observacoes" name="observacoes" rows={3} defaultValue={defaultValues?.observacoes ?? ""} />
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
