import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import { getUsuarioAtual, isAdmin, loginObrigatorio } from "@/lib/auth";
import { sair } from "@/app/login/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "UNIC SERVICE",
  description: "Controle de manutenção da frota de caminhões betoneira da Unic Car.",
  appleWebApp: {
    title: "UNIC SERVICE",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0a0a",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getUsuarioAtual();

  let conteudo: React.ReactNode;
  if (!(await loginObrigatorio())) {
    // Acesso livre enquanto a chave de login estiver desligada.
    conteudo = (
      <AppShell usuario={{ email: usuario?.email ?? "", nome: usuario?.nome ?? null, isAdmin: true, acessoLivre: !usuario }}>
        {children}
      </AppShell>
    );
  } else if (!usuario) {
    // Telas de login (o proxy manda para /login quem não está logado).
    conteudo = children;
  } else if (!usuario.aprovado || !usuario.emailConfirmado) {
    conteudo = (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-sm space-y-3 rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-base font-semibold text-gray-900">Acesso aguardando aprovação</p>
          <p className="text-sm text-gray-600">
            A conta {usuario.email} foi criada. O administrador precisa aprovar o acesso antes do primeiro uso.
          </p>
          <form action={sair}>
            <button type="submit" className="text-sm font-medium text-brand-600 hover:underline">
              Sair
            </button>
          </form>
        </div>
      </div>
    );
  } else {
    conteudo = (
      <AppShell usuario={{ email: usuario.email, nome: usuario.nome, isAdmin: await isAdmin() }}>{children}</AppShell>
    );
  }

  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased text-gray-900">{conteudo}</body>
    </html>
  );
}
