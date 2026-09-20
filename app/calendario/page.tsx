import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardHeader } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { NIVEL_ALERTA_COLOR } from "@/lib/labels";
import {
  MONTH_LABELS,
  WEEKDAY_LABELS,
  addDays,
  addMonths,
  monthGrid,
  parseISODate,
  startOfMonth,
  startOfWeek,
  toISODate,
} from "@/lib/calendar";
import type { MaintenanceOrder, Vehicle, VehiclePlanStatus } from "@/lib/types";

export const revalidate = 0;

type CalendarEvent = {
  date: string;
  title: string;
  href: string;
  colorClass: string;
};

type OrderWithVehicle = MaintenanceOrder & { vehicles: Pick<Vehicle, "nome" | "identificador" | "numero_interno"> | null };

async function loadEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();

  const [{ data: planStatus }, { data: orders }] = await Promise.all([
    supabase
      .from("v_vehicle_plan_status")
      .select("*")
      .not("proxima_data", "is", null)
      .returns<VehiclePlanStatus[]>(),
    supabase
      .from("maintenance_orders")
      .select("*, vehicles(nome, identificador, numero_interno)")
      .not("status", "in", "(concluida,cancelada)")
      .returns<OrderWithVehicle[]>(),
  ]);

  const events: CalendarEvent[] = [];

  for (const p of planStatus ?? []) {
    if (!p.proxima_data) continue;
    events.push({
      date: p.proxima_data,
      title: `${p.plano_nome} — ${p.vehicle_nome ?? p.vehicle_placa}`,
      href: `/veiculos/${p.vehicle_id}`,
      colorClass: NIVEL_ALERTA_COLOR[p.nivel_alerta],
    });
  }

  for (const o of orders ?? []) {
    const date = o.data_prevista ?? o.data_abertura;
    events.push({
      date,
      title: `${o.numero_os} — ${o.vehicles?.numero_interno ?? o.vehicles?.identificador ?? ""}`,
      href: `/ordens/${o.id}`,
      colorClass: "bg-blue-100 text-blue-800",
    });
  }

  return events;
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; data?: string }>;
}) {
  const { view = "mes", data } = await searchParams;
  const refDate = data ? parseISODate(data) : new Date();
  const events = await loadEvents();

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.date) ?? [];
    list.push(e);
    eventsByDate.set(e.date, list);
  }

  const today = toISODate(new Date());

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Calendário</h1>
          <p className="text-sm text-gray-500">Manutenções programadas e ordens previstas.</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {(["dia", "semana", "mes"] as const).map((v) => (
            <Link
              key={v}
              href={`/calendario?view=${v}&data=${toISODate(refDate)}`}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium",
                view === v ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {v === "dia" ? "Dia" : v === "semana" ? "Semana" : "Mês"}
            </Link>
          ))}
        </div>
      </div>

      {view === "mes" ? (
        <MonthView refDate={refDate} eventsByDate={eventsByDate} today={today} />
      ) : view === "semana" ? (
        <AgendaView start={startOfWeek(refDate)} days={7} eventsByDate={eventsByDate} refDate={refDate} view={view} />
      ) : (
        <AgendaView start={refDate} days={1} eventsByDate={eventsByDate} refDate={refDate} view={view} />
      )}
    </div>
  );
}

function MonthView({
  refDate,
  eventsByDate,
  today,
}: {
  refDate: Date;
  eventsByDate: Map<string, CalendarEvent[]>;
  today: string;
}) {
  const monthStart = startOfMonth(refDate);
  const days = monthGrid(monthStart);
  const prevMonth = toISODate(addMonths(monthStart, -1));
  const nextMonth = toISODate(addMonths(monthStart, 1));

  return (
    <Card>
      <CardHeader
        title={`${MONTH_LABELS[monthStart.getMonth()]} de ${monthStart.getFullYear()}`}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/calendario?view=mes&data=${prevMonth}`} variant="secondary" size="sm">
              ← Anterior
            </LinkButton>
            <LinkButton href={`/calendario?view=mes&data=${nextMonth}`} variant="secondary" size="sm">
              Próximo →
            </LinkButton>
          </div>
        }
      />
      <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-medium text-gray-500">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-2">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const iso = toISODate(day);
          const inMonth = day.getMonth() === monthStart.getMonth();
          const dayEvents = eventsByDate.get(iso) ?? [];
          return (
            <div
              key={iso}
              className={cn(
                "min-h-[92px] border-b border-r border-gray-100 p-1.5 align-top",
                !inMonth && "bg-gray-50/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-xs",
                  iso === today ? "bg-brand-600 text-white" : inMonth ? "text-gray-700" : "text-gray-300",
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((e, i) => (
                  <Link
                    key={i}
                    href={e.href}
                    className={cn("block truncate rounded px-1 py-0.5 text-[10px] leading-tight", e.colorClass)}
                    title={e.title}
                  >
                    {e.title}
                  </Link>
                ))}
                {dayEvents.length > 3 ? (
                  <span className="block px-1 text-[10px] text-gray-400">+{dayEvents.length - 3} mais</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function AgendaView({
  start,
  days,
  eventsByDate,
  refDate,
  view,
}: {
  start: Date;
  days: number;
  eventsByDate: Map<string, CalendarEvent[]>;
  refDate: Date;
  view: string;
}) {
  const dateList = Array.from({ length: days }, (_, i) => addDays(start, i));
  const prev = toISODate(addDays(refDate, -days));
  const next = toISODate(addDays(refDate, days));

  return (
    <Card>
      <CardHeader
        title={days === 1 ? formatDate(toISODate(refDate)) : `${formatDate(toISODate(dateList[0]))} – ${formatDate(toISODate(dateList[days - 1]))}`}
        action={
          <div className="flex gap-2">
            <LinkButton href={`/calendario?view=${view}&data=${prev}`} variant="secondary" size="sm">
              ← Anterior
            </LinkButton>
            <LinkButton href={`/calendario?view=${view}&data=${next}`} variant="secondary" size="sm">
              Próximo →
            </LinkButton>
          </div>
        }
      />
      <div className="divide-y divide-gray-100">
        {dateList.map((day) => {
          const iso = toISODate(day);
          const dayEvents = eventsByDate.get(iso) ?? [];
          return (
            <div key={iso} className="px-4 py-3">
              <p className="text-xs font-medium text-gray-500">{formatDate(iso)}</p>
              {dayEvents.length === 0 ? (
                <p className="mt-1 text-sm text-gray-300">Sem eventos</p>
              ) : (
                <ul className="mt-1 space-y-1">
                  {dayEvents.map((e, i) => (
                    <li key={i}>
                      <Link href={e.href} className={cn("inline-block rounded px-2 py-0.5 text-xs", e.colorClass)}>
                        {e.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
