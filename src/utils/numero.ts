/** Um inteiro com o separador de milhar do português: "1.234".
 *
 * 🔴 As contagens do lido são exatas e sem teto (decisão 11 do `PLANO_LIDO_NO_HISTORICO.md`): o contador do menu e o
 * resumo mostram o número inteiro -- e "1234" sem o ponto se lê mal justamente quando o número cresce.
 *
 * ➡️ `utils/numero.test.ts`.
 */
export function formatarQuantidade(quantidade: number): string {
  return quantidade.toLocaleString("pt-BR");
}

/** A quantidade formatada e a palavra concordando com ela: "1.234 envios", "1 envio". */
export function contarFormatado(quantidade: number, singular: string, plural: string): string {
  return `${formatarQuantidade(quantidade)} ${quantidade === 1 ? singular : plural}`;
}
