"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string };

export function DeleteVehicleButton({
  vehicleLabel,
  action,
}: {
  vehicleLabel: string;
  action: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-2">
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <Button
        type="button"
        variant="danger"
        disabled={pending}
        onClick={() => {
          const confirmed = window.confirm(
            `Excluir o veículo ${vehicleLabel}?\n\nIsso apaga também todo o histórico dele: medições, ordens de manutenção, problemas registrados e planos vinculados. Não é possível desfazer.\n\nSe é só para tirar de operação, use o status "Desmobilizado" em vez de excluir.`,
          );
          if (!confirmed) return;
          setError(null);
          startTransition(async () => {
            const result = await action();
            if (result?.error) {
              setError(result.error);
              return;
            }
            router.push("/veiculos");
            router.refresh();
          });
        }}
      >
        {pending ? "Excluindo…" : "Excluir veículo"}
      </Button>
    </div>
  );
}
