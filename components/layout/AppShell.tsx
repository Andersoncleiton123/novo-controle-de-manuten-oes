"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Wrench,
  AlertTriangle,
  History,
  CircleDollarSign,
  Calendar,
  Settings,
  ShieldCheck,
  Users,
  ScrollText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { sair } from "@/app/login/actions";

export type UsuarioShell = { email: string; nome: string | null; isAdmin: boolean };

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Truck,
  ClipboardList,
  Wrench,
  AlertTriangle,
  History,
  CircleDollarSign,
  Calendar,
  Settings,
  ShieldCheck,
  Users,
  ScrollText,
};

function isActive(href: string, pathname: string, search: URLSearchParams | null) {
  if (href === "/") return pathname === "/";
  const [path, query] = href.split("?");
  if (!pathname.startsWith(path)) return false;
  if (!query || !search) return true;
  // Atalhos com filtro (ex.: Betoneiras / Caminhões) só ficam ativos quando o filtro bate.
  return Array.from(new URLSearchParams(query)).every(([k, v]) => search.get(k) === v);
}

type NavProps = { onNavigate?: () => void; isAdmin: boolean };

function NavLinksWithSearch(props: NavProps) {
  const searchParams = useSearchParams();
  return <NavLinksBase {...props} search={searchParams} />;
}

function NavLinks(props: NavProps) {
  return (
    <Suspense fallback={<NavLinksBase {...props} search={null} />}>
      <NavLinksWithSearch {...props} />
    </Suspense>
  );
}

function NavLinksBase({ onNavigate, search, isAdmin }: NavProps & { search: URLSearchParams | null }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {NAV_ITEMS.filter((item) => isAdmin || !item.admin).map((item) => {
        const Icon = ICONS[item.icon];
        const active = isActive(item.href, pathname, search);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function UsuarioBox({ usuario }: { usuario: UsuarioShell }) {
  return (
    <div className="border-t border-gray-100 px-4 py-3">
      <p className="truncate text-sm font-medium text-gray-900">{usuario.nome ?? usuario.email}</p>
      <p className="truncate text-xs text-gray-500">
        {usuario.email} · {usuario.isAdmin ? "Administrador" : "Consultor"}
      </p>
      <form action={sair} className="mt-2">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </form>
    </div>
  );
}

export function AppShell({ children, usuario }: { children: React.ReactNode; usuario: UsuarioShell }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Unic Service" className="h-9 w-9 rounded-lg" />
          <div>
            <p className="text-sm font-semibold text-gray-900">Unic Service</p>
            <p className="text-xs text-gray-500">Controle de Manutenção</p>
          </div>
        </div>
        <NavLinks isAdmin={usuario.isAdmin} />
        <UsuarioBox usuario={usuario} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icons/icon-192.png" alt="Unic Service" className="h-8 w-8 rounded-lg" />
          <p className="text-sm font-semibold text-gray-900">Unic Service</p>
        </div>
        <button
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <p className="text-sm font-semibold text-gray-900">Menu</p>
              <button
                aria-label="Fechar menu"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavLinks isAdmin={usuario.isAdmin} onNavigate={() => setOpen(false)} />
            <UsuarioBox usuario={usuario} />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
