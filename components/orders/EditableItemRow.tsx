"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { DeleteItemButton } from "@/components/orders/DeleteItemButton";
import { formatCurrency } from "@/lib/format";
import type { MaintenanceOrderItem } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function EditableItemRow({
  item,
  updateAction,
  deleteAction,
}: {
  item: MaintenanceOrderItem;
  updateAction: (formData: FormData) => Promise<ActionResult>;
  deleteAction: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <tr className="bg-brand-50/40">
        <td colSpan={6} className="px-4 py-3">
          {error ? <div className="mb-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</div> : null}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              const formData = new FormData(e.currentTarget);
              startTransition(async () => {
                const result = await updateAction(formData);
                if (result?.error) {
                  setError(result.error);
                  return;
                }
                setEditing(false);
                router.refresh();
              });
            }}
            className="grid grid-cols-2 gap-2 sm:grid-cols-6"
          >
            <Input name="descricao" defaultValue={item.descricao} required className="col-span-2 sm:col-span-2" />
            <Input name="quantidade" type="number" step="0.01" min={0} defaultValue={item.quantidade} placeholder="Qtd" />
            <Input
              name="valor_unitario"
              type="number"
              step="0.01"
              min={0}
              defaultValue={item.valor_unitario}
              placeholder="Valor unit."
            />
            <Input
              name="mao_de_obra"
              type="number"
              step="0.01"
              min={0}
              defaultValue={item.mao_de_obra}
              placeholder="Mão de obra"
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? "…" : "Salvar"}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
                Cancelar
              </Button>
            </div>
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="px-4 py-2 text-gray-900">{item.descricao}</td>
      <td className="px-2 py-2 text-gray-600">{item.quantidade}</td>
      <td className="px-2 py-2 text-gray-600">{formatCurrency(item.valor_unitario)}</td>
      <td className="px-2 py-2 text-gray-600">{formatCurrency(item.mao_de_obra)}</td>
      <td className="px-2 py-2 font-medium text-gray-900">{formatCurrency(item.valor_total)}</td>
      <td className="px-2 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Editar item"
            onClick={() => setEditing(true)}
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <DeleteItemButton action={deleteAction} />
        </div>
      </td>
    </tr>
  );
}
