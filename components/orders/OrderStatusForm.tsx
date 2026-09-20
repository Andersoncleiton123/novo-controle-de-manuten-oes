"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { todayISO } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function OrderStatusForm({
  currentStatus,
  dataPrevista,
  action,
}: {
  currentStatus: OrderStatus;
  dataPrevista: string | null;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
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
          router.refresh();
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      {error ? <div className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <FieldGroup label="Status" htmlFor="status">
        <Select
          id="status"
          name="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="w-56"
        >
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <FieldGroup label="Data prevista" htmlFor="data_prevista">
        <Input id="data_prevista" name="data_prevista" type="date" defaultValue={dataPrevista ?? ""} />
      </FieldGroup>
      {status === "concluida" ? (
        <FieldGroup label="Data de conclusão" htmlFor="data_conclusao">
          <Input id="data_conclusao" name="data_conclusao" type="date" defaultValue={todayISO()} />
        </FieldGroup>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Salvando…" : "Atualizar status"}
      </Button>
    </form>
  );
}
