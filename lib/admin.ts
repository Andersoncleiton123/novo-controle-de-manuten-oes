// Só para uso no servidor (server actions).
import { createHash, timingSafeEqual } from "node:crypto";

// Senha de administrador definida na Vercel (ADMIN_PASSWORD): mínimo 8 caracteres, com números e caractere especial.
export function senhaAdminValida(informada: string): { ok: boolean; error?: string } {
  const configurada = process.env.ADMIN_PASSWORD ?? "";
  if (configurada.length < 8 || !/[0-9]/.test(configurada) || !/[^A-Za-z0-9]/.test(configurada)) {
    return {
      ok: false,
      error: "Senha de administrador não configurada. Cadastre ADMIN_PASSWORD na Vercel (mínimo 8 caracteres, com números e caractere especial).",
    };
  }
  const a = createHash("sha256").update(informada).digest();
  const b = createHash("sha256").update(configurada).digest();
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, error: "Senha de administrador incorreta." };
}
