"use client";

// Lista de planos preventivos do veículo para marcar os atendidos pela OS (campo "planos").
export function PlanosAtendidos({
  planos,
  marcados,
  onChange,
  obrigatorio = false,
  hint,
}: {
  planos: { id: string; nome: string }[];
  marcados: string[];
  onChange: (ids: string[]) => void;
  obrigatorio?: boolean;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-1.5">
      <legend className="text-sm font-medium text-gray-700">
        Planos preventivos atendidos
        {obrigatorio ? <span className="text-red-500"> *</span> : null}
      </legend>
      {planos.length === 0 ? (
        <p className="text-sm text-gray-500">Este veículo não tem plano preventivo vinculado.</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {planos.map((p) => (
            <label key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="planos"
                value={p.id}
                checked={marcados.includes(p.id)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...marcados, p.id] : marcados.filter((id) => id !== p.id))
                }
              />
              {p.nome}
            </label>
          ))}
        </div>
      )}
      {hint && planos.length > 0 ? <p className="text-xs text-gray-500">{hint}</p> : null}
    </fieldset>
  );
}
