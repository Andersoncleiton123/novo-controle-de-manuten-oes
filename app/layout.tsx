import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Controle de Manutenção da Frota – Unic Car",
  description: "Gestão de manutenção da frota de caminhões betoneira da Unic Car.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-sans antialiased text-gray-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
