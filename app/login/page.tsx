import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ msg?: string }> }) {
  const { msg } = await searchParams;
  const aviso =
    msg === "confirmado"
      ? "E-mail confirmado. Entre com seu e-mail e senha."
      : msg === "senha"
        ? "Senha alterada. Entre com a nova senha."
        : msg === "link"
          ? "Link inválido ou expirado. Tente novamente."
          : null;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-5">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Unic Service" className="h-10 w-10 rounded-lg" />
          <div>
            <p className="text-base font-semibold text-gray-900">Unic Service</p>
            <p className="text-xs text-gray-500">Controle de Manutenção</p>
          </div>
        </div>
        {aviso ? <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800">{aviso}</div> : null}
        <LoginForm />
      </div>
    </div>
  );
}
