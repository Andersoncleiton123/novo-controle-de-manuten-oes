"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { Input, Select } from "@/components/ui/Field";
import { VEHICLE_STATUS_LABEL, VEHICLE_TIPO_LABEL } from "@/lib/labels";

export function VehicleFilters({
  q,
  status,
  tipo,
}: {
  q?: string;
  status?: string;
  tipo?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} className="flex flex-col gap-3 sm:flex-row" method="get">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Pesquisar por número, placa, marca ou modelo…"
          className="pl-9"
        />
      </div>
      <Select
        name="tipo"
        defaultValue={tipo ?? ""}
        className="sm:w-48"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Todas as categorias</option>
        {Object.entries(VEHICLE_TIPO_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        name="status"
        defaultValue={status ?? ""}
        className="sm:w-56"
        onChange={() => formRef.current?.requestSubmit()}
      >
        <option value="">Todos os status</option>
        {Object.entries(VEHICLE_STATUS_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        Filtrar
      </button>
    </form>
  );
}
