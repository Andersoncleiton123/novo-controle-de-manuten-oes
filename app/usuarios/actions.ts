"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { exigirAdmin, getUsuarioAtual } from "@/lib/auth";

type ActionResult = { error?: string };

export async function atualizarUsuario(userId: string, formData: FormData): Promise<ActionResult> {
  const erro = await exigirAdmin();
  if (erro) return { error: erro };

  const atual = await getUsuarioAtual();
  const perfil = formData.get("perfil") === "admin" ? "admin" : "consultor";
  const aprovado = formData.get("aprovado") === "on";
  if (atual?.id === userId && (perfil !== "admin" || !aprovado)) {
    return { error: "Você não pode remover o seu próprio acesso de administrador." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ perfil, aprovado }).eq("id", userId);
  if (error) return { error: `Não foi possível salvar: ${error.message}` };

  revalidatePath("/usuarios");
  return {};
}
