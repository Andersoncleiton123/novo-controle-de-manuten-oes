"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; id?: string };

export function ItemForm({ action }: { action: (formData: FormData) => Promise<ActionResult> }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        const form = e.currentTarget;
        const formData = new FormData(form);
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) {
            setError(result.error);
            return;
          }
          form.reset();
          router.refresh();
        });
      }}
      className="grid grid-cols-2 gap-2 border-t border-gray-100 px-4 py-3 sm:grid-cols-6"
    >
      {error ? <div className="col-span-full rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div> : null}
      <Input name="descricao" placeholder="Serviço ou peça" required className="col-span-2 sm:col-span-2" />
      <Input name="quantidade" type="number" step="0.01" min={0} placeholder="Qtd" defaultValue={1} />
      <Input name="valor_unitario" type="number" step="0.01" min={0} placeholder="Valor unit." />
      <Input name="mao_de_obra" type="number" step="0.01" min={0} placeholder="Mão de obra" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "…" : "+ Item"}
      </Button>
    </form>
  );
}
