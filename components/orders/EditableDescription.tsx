"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; id?: string };

export function EditableDescription({
  description,
  action,
}: {
  description: string;
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
        >
          <Textarea name="problema_servico" rows={3} required defaultValue={description} />
          <div className="mt-2 flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? "…" : "Salvar"}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-2">
      <p className="text-sm text-gray-900">{description}</p>
      <button
        type="button"
        aria-label="Editar descrição"
        onClick={() => setEditing(true)}
        className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}
