"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import type { Profile } from "@/lib/types";

export function UsuarioRow({
  usuario: u,
  action,
}: {
  usuario: Profile;
  action: (formData: FormData) => Promise<{ error?: string }>;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <li className="px-4 py-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            const r = await action(fd);
            if (r?.error) return setError(r.error);
            router.refresh();
          });
        }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900">{u.nome ?? u.email}</p>
          <p className="truncate text-xs text-gray-500">
            {u.email} · conta criada em {formatDate(u.created_at.slice(0, 10))}
          </p>
        </div>
        <Select name="perfil" defaultValue={u.perfil} className="w-40">
          <option value="consultor">Consultor</option>
          <option value="admin">Administrador</option>
        </Select>
        <label className="flex items-center gap-1.5 text-sm text-gray-700">
          <input type="checkbox" name="aprovado" defaultChecked={u.aprovado} />
          Aprovado
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Salvar"}
        </Button>
        {error ? <p className="w-full text-xs text-red-700">{error}</p> : null}
      </form>
    </li>
  );
}
