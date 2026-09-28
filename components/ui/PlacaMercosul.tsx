import { cn } from "@/lib/cn";

// Placa no padrão Mercosul: faixa azul com "BRASIL" e os 7 caracteres sem hífen (ex.: RHD5H12).
export function formatPlaca(placa: string) {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function PlacaMercosul({ placa, className }: { placa: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex w-[5.25rem] shrink-0 flex-col overflow-hidden rounded-[3px] border border-gray-800 bg-white align-middle leading-none",
        className,
      )}
      title={`Placa ${formatPlaca(placa)}`}
    >
      <span className="flex items-center justify-between bg-[#003399] px-1 py-[1px] text-[6px] font-bold tracking-widest text-white">
        <span aria-hidden className="h-[5px] w-[7px] rounded-[1px] bg-[#009c3b]" />
        BRASIL
        <span aria-hidden className="h-[5px] w-[7px]" />
      </span>
      <span className="px-1 py-[2px] text-center font-mono text-[13px] font-bold tracking-wider text-gray-900">
        {formatPlaca(placa)}
      </span>
    </span>
  );
}
