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

// Chave no banco (app_config.login_obrigatorio). Desligada: acesso livre, todos com
// permissões de administrador. Sem a tabela ou em caso de erro, login continua obrigatório.
export const loginObrigatorio = cache(async (): Promise<boolean> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("app_config").select("login_obrigatorio").eq("id", 1).maybeSingle();
  if (error || !data) return true;
  return data.login_obrigatorio;
});

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
  if (!(await loginObrigatorio())) return true;
  const u = await getUsuarioAtual();
  return Boolean(u && u.aprovado && u.emailConfirmado && u.perfil === "admin");
}

// Retorna a mensagem de erro para a server action, ou null quando o acesso é permitido.
export async function exigirAprovado(): Promise<string | null> {
  if (!(await loginObrigatorio())) return null;
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
