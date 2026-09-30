"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

type Modo = "entrar" | "criar" | "esqueci";

const ERROS: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos.",
  "Email not confirmed": "Confirme seu e-mail pelo link enviado antes de entrar.",
  "User already registered": "Este e-mail já tem conta. Use Entrar.",
};

export function LoginForm() {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>("entrar");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function traduz(msg: string) {
    return ERROS[msg] ?? msg;
  }

  return (
    <Card>
      <CardBody>
        <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
          {(["entrar", "criar"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setModo(m);
                setError(null);
                setInfo(null);
              }}
              className={`flex-1 rounded-md px-3 py-1.5 font-medium ${
                modo === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {m === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setInfo(null);
            const fd = new FormData(e.currentTarget);
            const email = String(fd.get("email") ?? "").trim().toLowerCase();
            const senha = String(fd.get("senha") ?? "");
            const nome = String(fd.get("nome") ?? "").trim();
            const supabase = createClient();
            const redirectTo = `${window.location.origin}/auth/confirm`;
            startTransition(async () => {
              if (modo === "entrar") {
                const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
                if (error) return setError(traduz(error.message));
                router.replace("/");
                router.refresh();
              } else if (modo === "criar") {
                if (senha.length < 8 || !/[0-9]/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
                  return setError("A senha precisa ter no mínimo 8 caracteres, com números e caractere especial.");
                }
                const { error } = await supabase.auth.signUp({
                  email,
                  password: senha,
                  options: { emailRedirectTo: redirectTo, data: { nome } },
                });
                if (error) return setError(traduz(error.message));
                setInfo("Conta criada. Confirme pelo link enviado ao seu e-mail e depois entre com sua senha.");
                setModo("entrar");
              } else {
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                  redirectTo: `${redirectTo}?next=/login/nova-senha`,
                });
                if (error) return setError(traduz(error.message));
                setInfo("Se o e-mail tiver conta, você vai receber um link para criar nova senha.");
                setModo("entrar");
              }
            });
          }}
          className="space-y-3"
        >
          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          {info ? <div className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{info}</div> : null}
          {modo === "criar" ? (
            <FieldGroup label="Nome" htmlFor="nome" required>
              <Input id="nome" name="nome" required autoComplete="name" />
            </FieldGroup>
          ) : null}
          <FieldGroup label="E-mail" htmlFor="email" required>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </FieldGroup>
          {modo !== "esqueci" ? (
            <FieldGroup
              label="Senha"
              htmlFor="senha"
              required
              hint={modo === "criar" ? "Mínimo 8 caracteres, com números e caractere especial" : undefined}
            >
              <Input
                id="senha"
                name="senha"
                type="password"
                required
                autoComplete={modo === "criar" ? "new-password" : "current-password"}
              />
            </FieldGroup>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Aguarde…" : modo === "entrar" ? "Entrar" : modo === "criar" ? "Criar conta" : "Enviar link"}
          </Button>
          {modo === "entrar" ? (
            <button
              type="button"
              onClick={() => {
                setModo("esqueci");
                setError(null);
                setInfo(null);
              }}
              className="w-full text-center text-xs text-gray-500 hover:text-gray-800"
            >
              Esqueci minha senha
            </button>
          ) : null}
          {modo === "criar" ? (
            <p className="text-xs text-gray-500">
              Novas contas entram como consultor e só acessam o sistema depois de aprovadas pelo administrador.
            </p>
          ) : null}
        </form>
      </CardBody>
    </Card>
  );
}
