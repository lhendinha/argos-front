/** O rótulo do "verificado até" de um processo: o mesmo texto na lista e no detalhe.
 *
 * 🔴 O dia vem PRONTO do servidor (`verificado_ate`), calculado pelo regime: a tela não refaz a conta com
 * `ultima_verificacao`, que depois da virada envelhece sem que nada tenha parado.
 * ➡️ `src/utils/verificacao.test.ts`.
 */
import type { Processo, RotuloDaVerificacao } from "../types";
import { formatarData } from "./date";

export function rotuloDaVerificacao(
  p: Pick<Processo, "verificado_ate" | "verificacao_atrasada" | "historico_em_carga">,
): RotuloDaVerificacao {
  if (p.historico_em_carga) return { texto: "histórico em carga", atrasada: false };
  const atrasada = Boolean(p.verificacao_atrasada);
  // Só dia e mês: o ano de um dia que é ontem ou hoje só ocupa espaço na célula.
  if (p.verificado_ate) return { texto: `verificado até ${formatarData(p.verificado_ate).slice(0, 5)}`, atrasada };
  return { texto: "ainda não verificado", atrasada };
}
