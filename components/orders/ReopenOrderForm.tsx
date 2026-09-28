"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; id?: string };

export function ReopenOrderForm({ action }: { action: (formData: FormData) => Promise<ActionResult> }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!aberto) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
        Reabrir ordem (administrador)
      </Button>
    );
  }

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
          setAberto(false);
          router.refresh();
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      {error ? <div className="w-full rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <FieldGroup label="Senha de administrador" htmlFor="senha">
        <Input id="senha" name="senha" type="password" required autoComplete="current-password" className="w-56" />
      </FieldGroup>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Reabrindo…" : "Reabrir"}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setAberto(false)} disabled={pending}>
        Cancelar
      </Button>
    </form>
  );
}
