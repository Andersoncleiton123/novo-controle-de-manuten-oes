"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PlanosAtendidos } from "@/components/orders/PlanosAtendidos";
import { ORDER_TIPO_LABEL } from "@/lib/labels";
import type { OrderTipo } from "@/lib/types";

type ActionResult = { error?: string; id?: string };

export function CorrectOrderForm({
  tipo,
  planos,
  planosMarcados,
  action,
}: {
  tipo: OrderTipo;
  planos: { id: string; nome: string }[];
  planosMarcados: string[];
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [tipoAtual, setTipoAtual] = useState<OrderTipo>(tipo);
  const [marcados, setMarcados] = useState<string[]>(planosMarcados);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const retirados = planosMarcados.filter((id) => !marcados.includes(id));

  if (!aberto) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setAberto(true)}>
        Corrigir tipo / planos atendidos
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
      className="space-y-3 rounded-lg border border-gray-200 p-3"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <FieldGroup label="Tipo" htmlFor="correct_tipo" required>
        <Select
          id="correct_tipo"
          name="tipo"
          value={tipoAtual}
          onChange={(e) => setTipoAtual(e.target.value as OrderTipo)}
          className="sm:w-56"
        >
          {Object.entries(ORDER_TIPO_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </FieldGroup>
      <PlanosAtendidos
        planos={planos}
        marcados={marcados}
        onChange={setMarcados}
        obrigatorio={tipoAtual === "preventiva"}
        hint="Plano marcado agora passa a ter esta OS (data de conclusão, KM e horímetro) como última execução, se for a mais recente"
      />
      {retirados.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Plano desmarcado perde o vínculo com esta OS, mas a última execução registrada nele não volta atrás.
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Salvando…" : "Salvar correção"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setAberto(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
