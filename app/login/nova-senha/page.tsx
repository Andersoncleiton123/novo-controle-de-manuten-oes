import { NovaSenhaForm } from "@/components/auth/NovaSenhaForm";

export default function NovaSenhaPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-lg font-semibold text-gray-900">Criar nova senha</h1>
        <NovaSenhaForm />
      </div>
    </div>
  );
}
