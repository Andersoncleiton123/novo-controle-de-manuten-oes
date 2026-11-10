// Descrição que indica serviço preventivo; usada para avisar quando a OS fecha sem plano marcado.
const REVISAO = /revis[aã]o|troca\s+de\s+[oó]leo|preventiv/i;

export function pareceRevisao(texto: string | null | undefined): boolean {
  return REVISAO.test(texto ?? "");
}
