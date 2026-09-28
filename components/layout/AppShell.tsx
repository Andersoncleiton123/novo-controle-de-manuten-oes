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
  Menu,
  X,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { cn } from "@/lib/cn";

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
};

function isActive(href: string, pathname: string, search: URLSearchParams | null) {
  if (href === "/") return pathname === "/";
  const [path, query] = href.split("?");
  if (!pathname.startsWith(path)) return false;
  if (!query || !search) return true;
  // Atalhos com filtro (ex.: Betoneiras / Caminhões) só ficam ativos quando o filtro bate.
  return Array.from(new URLSearchParams(query)).every(([k, v]) => search.get(k) === v);
}

function NavLinksWithSearch({ onNavigate }: { onNavigate?: () => void }) {
  const searchParams = useSearchParams();
  return <NavLinksBase onNavigate={onNavigate} search={searchParams} />;
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <Suspense fallback={<NavLinksBase onNavigate={onNavigate} search={null} />}>
      <NavLinksWithSearch onNavigate={onNavigate} />
    </Suspense>
  );
}

function NavLinksBase({ onNavigate, search }: { onNavigate?: () => void; search: URLSearchParams | null }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {NAV_ITEMS.map((item) => {
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

export function AppShell({ children }: { children: React.ReactNode }) {
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
        <NavLinks />
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
            <NavLinks onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
