import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { UsuarioRow } from "@/components/auth/UsuarioRow";
import { atualizarUsuario } from "@/app/usuarios/actions";
import type { Profile } from "@/lib/types";

export default async function UsuariosPage() {
  if (!(await isAdmin())) notFound();
  const supabase = await createClient();
  const { data: usuarios } = await supabase
    .from("profiles")
    .select("*")
    .order("aprovado", { ascending: true })
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const pendentes = (usuarios ?? []).filter((u) => !u.aprovado);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Usuários</h1>
        <p className="text-sm text-gray-500">
          Contas criadas pela tela de login. Aprove o acesso e defina o perfil de cada uma.
        </p>
      </div>
      {pendentes.length > 0 ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {pendentes.length} conta(s) aguardando aprovação.
        </div>
      ) : null}
      <Card>
        <CardHeader title="Contas" />
        <CardBody className="p-0">
          {!usuarios || usuarios.length === 0 ? (
            <div className="p-4">
              <EmptyState title="Nenhuma conta" />
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {usuarios.map((u) => (
                <UsuarioRow key={u.id} usuario={u} action={atualizarUsuario.bind(null, u.id)} />
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
