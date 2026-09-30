// Só para uso no servidor.
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type Perfil = "admin" | "consultor";

export type UsuarioAtual = {
  id: string;
  email: string;
  nome: string | null;
  perfil: Perfil;
  aprovado: boolean;
  emailConfirmado: boolean;
};

export const getUsuarioAtual = cache(async (): Promise<UsuarioAtual | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, nome, perfil, aprovado")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? "",
    nome: profile?.nome ?? null,
    perfil: (profile?.perfil as Perfil | undefined) ?? "consultor",
    aprovado: profile?.aprovado ?? false,
    emailConfirmado: Boolean(user.email_confirmed_at),
  };
});

export async function isAdmin(): Promise<boolean> {
  const u = await getUsuarioAtual();
  return Boolean(u && u.aprovado && u.emailConfirmado && u.perfil === "admin");
}

// Retorna a mensagem de erro para a server action, ou null quando o acesso é permitido.
export async function exigirAprovado(): Promise<string | null> {
  const u = await getUsuarioAtual();
  if (!u) return "Sessão expirada. Entre novamente.";
  if (!u.aprovado || !u.emailConfirmado) return "Seu acesso ainda não foi aprovado pelo administrador.";
  return null;
}

export async function exigirAdmin(): Promise<string | null> {
  const erro = await exigirAprovado();
  if (erro) return erro;
  return (await isAdmin()) ? null : "Somente o administrador pode fazer esta operação.";
}
