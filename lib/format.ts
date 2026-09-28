export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return "—";
  return `${day}/${month}/${year}`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatCurrency(value: number | null | undefined): string {
  const n = value ?? 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatKm(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value).toLocaleString("pt-BR")} km`;
}

export function formatHoras(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return `${Math.round(value).toLocaleString("pt-BR")} h`;
}

// Rótulo de veículo para seletores: "BT 01 - Convicta" (betoneira) ou "SDT-5F07 — Caminhão da BT 01" (caminhão).
export function vehicleOptionLabel(v: {
  numero_interno: string | null;
  nome: string | null;
  identificador: string;
}): string {
  const principal = v.numero_interno ?? v.identificador;
  const detalhe = v.nome && v.nome !== principal ? v.nome : null;
  return detalhe ? `${principal} — ${detalhe}` : principal;
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("pt-BR");
}
