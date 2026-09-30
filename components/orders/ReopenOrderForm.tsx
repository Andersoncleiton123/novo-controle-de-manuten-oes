"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; id?: string };

// Visível só para o administrador; a action também confere o perfil.
export function ReopenOrderForm({ action }: { action: (formData: FormData) => Promise<ActionResult> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (!window.confirm("Reabrir esta ordem de serviço?")) return;
          setError(null);
          startTransition(async () => {
            const result = await action(new FormData());
            if (result?.error) return setError(result.error);
            router.refresh();
          });
        }}
      >
        {pending ? "Reabrindo…" : "Reabrir ordem"}
      </Button>
    </div>
  );
}
