"use client";

import { useState } from "react";
import { PNEU_POSICAO_LABEL } from "@/lib/labels";

// Campo "Instalação de pneus" da OS: ao marcar, mostra as posições dos pneus.
// Envia `instalacao_pneus` ("1") e uma ou mais `pneus_posicoes`.
export function PneusFields({
  idPrefix,
  defaultChecked = false,
  defaultPosicoes = [],
}: {
  idPrefix: string;
  defaultChecked?: boolean;
  defaultPosicoes?: string[];
}) {
  const [ativo, setAtivo] = useState(defaultChecked);

  return (
    <div className="rounded-lg border border-gray-200 px-3 py-2">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <input
          type="checkbox"
          name="instalacao_pneus"
          value="1"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
        />
        Instalação de pneus
      </label>
      {ativo ? (
        <fieldset className="mt-2">
          <legend className="mb-1 text-xs text-gray-500">Posições dos pneus</legend>
          <div className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
            {Object.entries(PNEU_POSICAO_LABEL).map(([value, label]) => (
              <label key={value} htmlFor={`${idPrefix}_${value}`} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  id={`${idPrefix}_${value}`}
                  type="checkbox"
                  name="pneus_posicoes"
                  value={value}
                  defaultChecked={defaultPosicoes.includes(value)}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
