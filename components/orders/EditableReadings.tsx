"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatHoras, formatKm } from "@/lib/format";

type ActionResult = { error?: string; id?: string };

export function EditableReadings({
  km,
  horas,
  action,
}: {
  km: number | null;
  horas: number | null;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <div>
        {error ? <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div> : null}
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
              setEditing(false);
              router.refresh();
            });
          }}
          className="flex flex-wrap items-end gap-3"
        >
          <FieldGroup label="KM" htmlFor="edit_km">
            <Input id="edit_km" name="km" type="number" step="1" min={0} defaultValue={km ?? ""} className="w-36" />
          </FieldGroup>
          <FieldGroup label="Horímetro" htmlFor="edit_horas">
            <Input id="edit_horas" name="horas" type="number" step="1" min={0} defaultValue={horas ?? ""} className="w-36" />
          </FieldGroup>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "…" : "Salvar"}
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
            Cancelar
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span>
        {formatKm(km)} · {formatHoras(horas)}
      </span>
      <button
        type="button"
        aria-label="Editar KM e horímetro"
        onClick={() => setEditing(true)}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
