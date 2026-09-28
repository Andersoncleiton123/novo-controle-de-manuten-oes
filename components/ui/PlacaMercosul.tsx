import { cn } from "@/lib/cn";

// Placa no padrão Mercosul: faixa azul com "BRASIL" e os 7 caracteres sem hífen (ex.: RHD5H12).
export function formatPlaca(placa: string) {
  return placa.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Placa brasileira: 3 letras + 4 caracteres (padrão antigo ABC1234 ou Mercosul ABC1D23).
export function isPlaca(valor: string) {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(formatPlaca(valor));
}

// Padrão Mercosul: 3 letras, 1 número, 1 letra, 2 números (ex.: RHD5H12).
export function isPlacaMercosul(valor: string) {
  return /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(formatPlaca(valor));
}

export function PlacaMercosul({ placa, className }: { placa: string; className?: string }) {
  // Identificação que não é placa (ex.: betoneira "BT 01") aparece como selo simples.
  if (!isPlaca(placa)) {
    return (
      <span
        className={cn(
          "inline-flex w-[5.25rem] shrink-0 items-center justify-center rounded-[3px] border border-gray-300 bg-gray-50 py-1 text-xs font-semibold text-gray-700",
          className,
        )}
      >
        {placa}
      </span>
    );
  }
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
