// A contagem de troca de óleo do motor só reinicia por OS que tenha o item de óleo do motor lançado.
const ITEM_OLEO_MOTOR = /[oó]leo\s+(lubrificante|(do\s+)?motor)/i;
const PLANO_OLEO_MOTOR = /[oó]leo\s+do\s+motor/i;

export function temTrocaDeOleo(descricoes: (string | null | undefined)[]): boolean {
  return descricoes.some((d) => ITEM_OLEO_MOTOR.test(d ?? ""));
}

export function ehPlanoDeOleo(nome: string | null | undefined): boolean {
  return PLANO_OLEO_MOTOR.test(nome ?? "");
}

export const MSG_SEM_ITEM_OLEO =
  "A contagem da troca de óleo só reinicia quando a OS tem o item de óleo do motor lançado. Adicione o item ou desmarque o plano de troca de óleo.";
