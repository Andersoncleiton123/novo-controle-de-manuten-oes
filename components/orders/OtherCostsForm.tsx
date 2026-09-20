"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; id?: string };

export function OtherCostsForm({
  defaultValue,
  action,
}: {
  defaultValue: number;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        startTransition(async () => {
          await action(formData);
          router.refresh();
        });
      }}
      className="flex items-end gap-2"
    >
      <div>
        <label className="mb-1 block text-xs font-medium text-gray-700">Outros custos (ex: reboque, taxas)</label>
        <Input name="outros_custos" type="number" step="0.01" min={0} defaultValue={defaultValue} className="w-40" />
      </div>
      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? "…" : "Salvar"}
      </Button>
    </form>
  );
}
