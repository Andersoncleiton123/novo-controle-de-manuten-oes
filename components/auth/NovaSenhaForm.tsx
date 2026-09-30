"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";

export function NovaSenhaForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <Card>
      <CardBody>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            const senha = String(new FormData(e.currentTarget).get("senha") ?? "");
            if (senha.length < 8 || !/[0-9]/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
              return setError("A senha precisa ter no mínimo 8 caracteres, com números e caractere especial.");
            }
            startTransition(async () => {
              const supabase = createClient();
              const { error } = await supabase.auth.updateUser({ password: senha });
              if (error) return setError("Link expirado. Peça um novo em Esqueci minha senha.");
              await supabase.auth.signOut();
              router.replace("/login?msg=senha");
            });
          }}
          className="space-y-3"
        >
          {error ? <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
          <FieldGroup label="Nova senha" htmlFor="senha" required hint="Mínimo 8 caracteres, com números e caractere especial">
            <Input id="senha" name="senha" type="password" required autoComplete="new-password" />
          </FieldGroup>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Salvando…" : "Salvar nova senha"}
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
