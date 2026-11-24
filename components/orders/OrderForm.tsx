"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ORDER_TIPO_LABEL, PRIORIDADE_LABEL } from "@/lib/labels";
import { todayISO, vehicleOptionLabel } from "@/lib/format";
import type { Vehicle } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function OrderForm({
  vehicles,
  defaultVehicleId,
  defaultTipo,
  correctiveIssueId,
  vehicleMaintenancePlanId,
  defaultProblemaServico,
  ordensAbertas = [],
  action,
}: {
  vehicles: Pick<Vehicle, "id" | "nome" | "identificador" | "numero_interno">[];
  defaultVehicleId?: string;
  defaultTipo?: "preventiva" | "corretiva";
  correctiveIssueId?: string;
  vehicleMaintenancePlanId?: string;
  defaultProblemaServico?: string;
  ordensAbertas?: { id: string; numero_os: string; vehicle_id: string; tipo: "preventiva" | "corretiva" }[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [vehicleId, setVehicleId] = useState(defaultVehicleId ?? "");
  const [tipo, setTipo] = useState<"preventiva" | "corretiva">(defaultTipo ?? "corretiva");
  const [duplicadaConfirmada, setDuplicadaConfirmada] = useState(false);

  const duplicadas = ordensAbertas.filter((o) => o.vehicle_id === vehicleId && o.tipo === tipo);

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
          <Select
            id="vehicle_id"
            name="vehicle_id"
            required
            value={vehicleId}
            onChange={(e) => {
              setVehicleId(e.target.value);
              setDuplicadaConfirmada(false);
            }}
          >
            <option value="" disabled>
              Selecione…
            </option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {vehicleOptionLabel(v)}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Tipo" htmlFor="tipo" required>
          <Select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => {
              setTipo(e.target.value as "preventiva" | "corretiva");
              setDuplicadaConfirmada(false);
            }}
          >
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

      {duplicadas.length > 0 ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <input
            type="checkbox"
            name="confirmar_duplicada"
            value="1"
            required
            checked={duplicadaConfirmada}
            onChange={(e) => setDuplicadaConfirmada(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Este veículo já tem {duplicadas.length === 1 ? "uma OS" : "OS"} {ORDER_TIPO_LABEL[tipo].toLowerCase()}{" "}
            em andamento:{" "}
            {duplicadas.map((o, i) => (
              <span key={o.id}>
                {i > 0 ? ", " : ""}
                <Link href={`/ordens/${o.id}`} target="_blank" className="font-medium underline">
                  {o.numero_os}
                </Link>
              </span>
            ))}
            . Confirme que esta é outra ordem e não uma duplicidade.
          </span>
        </label>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Abrir ordem"}
        </Button>
      </div>
    </form>
  );
}
