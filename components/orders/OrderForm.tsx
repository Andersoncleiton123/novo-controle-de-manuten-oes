"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ORDER_TIPO_LABEL, PRIORIDADE_LABEL } from "@/lib/labels";
import { todayISO } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function OrderForm({
  vehicles,
  defaultVehicleId,
  defaultTipo,
  correctiveIssueId,
  vehicleMaintenancePlanId,
  defaultProblemaServico,
  action,
}: {
  vehicles: Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[];
  defaultVehicleId?: string;
  defaultTipo?: "preventiva" | "corretiva";
  correctiveIssueId?: string;
  vehicleMaintenancePlanId?: string;
  defaultProblemaServico?: string;
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
          router.push(`/ordens/${result?.id ?? ""}`);
          router.refresh();
        });
      }}
      className="space-y-4"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      {correctiveIssueId ? <input type="hidden" name="corrective_issue_id" value={correctiveIssueId} /> : null}
      {vehicleMaintenancePlanId ? (
        <input type="hidden" name="vehicle_maintenance_plan_id" value={vehicleMaintenancePlanId} />
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldGroup label="Veículo" htmlFor="vehicle_id" required>
          <Select id="vehicle_id" name="vehicle_id" required defaultValue={defaultVehicleId ?? ""}>
            <option value="" disabled>
              Selecione…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.numero_interno ?? v.nome ?? v.identificador} ({v.identificador})
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Tipo" htmlFor="tipo" required>
          <Select id="tipo" name="tipo" defaultValue={defaultTipo ?? "corretiva"}>
            {Object.entries(ORDER_TIPO_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Data de abertura" htmlFor="data_abertura" required>
          <Input id="data_abertura" name="data_abertura" type="date" required defaultValue={todayISO()} />
        </FieldGroup>
        <FieldGroup label="Data prevista de conclusão" htmlFor="data_prevista">
          <Input id="data_prevista" name="data_prevista" type="date" />
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
        <FieldGroup label="Oficina / fornecedor" htmlFor="fornecedor">
          <Input id="fornecedor" name="fornecedor" />
        </FieldGroup>
        <FieldGroup label="Responsável" htmlFor="responsavel">
          <Input id="responsavel" name="responsavel" />
        </FieldGroup>
      </div>

      <FieldGroup label="Problema / serviço" htmlFor="problema_servico" required>
        <Textarea id="problema_servico" name="problema_servico" rows={3} required defaultValue={defaultProblemaServico ?? ""} />
      </FieldGroup>

      <FieldGroup label="Observações" htmlFor="observacoes">
        <Textarea id="observacoes" name="observacoes" rows={2} />
      </FieldGroup>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Abrir ordem"}
        </Button>
      </div>
    </form>
  );
}
