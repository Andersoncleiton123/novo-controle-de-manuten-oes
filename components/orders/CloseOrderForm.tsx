"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { PlanosAtendidos } from "@/components/orders/PlanosAtendidos";
import { todayISO } from "@/lib/format";
import { pareceRevisao } from "@/lib/orders";

type ActionResult = { error?: string; id?: string };

export function CloseOrderForm({
  km,
  horas,
  planos,
  planosMarcados,
  preventiva,
  descricao,
  action,
}: {
  km: number | null;
  horas: number | null;
  planos: { id: string; nome: string }[];
  planosMarcados: string[];
  preventiva: boolean;
  descricao: string;
  action: (formData: FormData) => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [marcados, setMarcados] = useState<string[]>(
    planosMarcados.length > 0 ? planosMarcados : preventiva && planos.length === 1 ? [planos[0].id] : [],
  );
  const [semPlanoConfirmado, setSemPlanoConfirmado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Preventiva precisa apontar o plano atendido, senão a contagem para a próxima troca não reinicia.
  const exigePlano = preventiva && planos.length > 0;
  // Corretiva com cara de revisão: pede confirmação explícita antes de fechar sem plano.
  const avisoRevisao = !preventiva && planos.length > 0 && marcados.length === 0 && pareceRevisao(descricao);

  if (!aberto) {
    return (
      <Button onClick={() => setAberto(true)}>Fechar ordem de serviço</Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        if (exigePlano && marcados.length === 0) {
          setError("Marque o plano preventivo atendido para reiniciar a contagem da próxima manutenção.");
          return;
        }
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
      className="space-y-3"
    >
      {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldGroup label="Data de conclusão" htmlFor="data_conclusao" required>
          <Input id="data_conclusao" name="data_conclusao" type="date" required defaultValue={todayISO()} />
        </FieldGroup>
        <FieldGroup label="KM na execução" htmlFor="close_km">
          <Input id="close_km" name="km" type="number" step="1" min={0} defaultValue={km ?? ""} />
        </FieldGroup>
        <FieldGroup label="Horímetro na execução" htmlFor="close_horas">
          <Input id="close_horas" name="horas" type="number" step="1" min={0} defaultValue={horas ?? ""} />
        </FieldGroup>
      </div>
      <PlanosAtendidos
        planos={planos}
        marcados={marcados}
        onChange={setMarcados}
        obrigatorio={exigePlano}
        hint="A data, o KM e o horímetro acima passam a ser a última execução de cada plano marcado e reiniciam a contagem para a próxima"
      />
      {avisoRevisao ? (
        <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <input
            type="checkbox"
            name="confirmar_sem_plano"
            value="1"
            required
            checked={semPlanoConfirmado}
            onChange={(e) => setSemPlanoConfirmado(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Esta OS parece uma revisão e nenhum plano foi marcado. Sem plano, a contagem da próxima manutenção não
            reinicia. Marque acima o plano atendido ou confirme aqui que nenhum plano foi feito.
          </span>
        </label>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Fechando…" : "Confirmar fechamento"}
        </Button>
        <Button variant="ghost" onClick={() => setAberto(false)} disabled={pending}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
