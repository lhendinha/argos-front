/** A página do Histórico no cache, com um envio marcado como lido -- sem ir ao servidor.
 *
 * ➡️ `pages/HistoricoPage/leitura.test.ts`.
 */
import { LEITURA_LIDOS, LEITURA_NAO_LIDOS } from "../../constants";
import type { ContagensDaLeitura, RespostaDeHistoricoPaginada } from "../../types/respostas";

/** As contagens da resposta no formato do menu do filtro: pelo `id` de cada opção de `FILTROS_DE_LEITURA`.
 *
 * ⚠️ Ausentes na leitura antiga, e aí o menu não mostra número nenhum -- zero seria mentira. */
export function contagensDoFiltroDeLeitura(contagens: ContagensDaLeitura | undefined): Record<string, number> | undefined {
  if (!contagens) return undefined;
  return { todos: contagens.total, [LEITURA_NAO_LIDOS]: contagens[LEITURA_NAO_LIDOS], [LEITURA_LIDOS]: contagens[LEITURA_LIDOS] };
}

/** O envio da sequência passa a lido, e as contagens da leitura se acertam.
 *
 * ⚠️ Só muda o que estava NÃO lido nesta página: devolver o mesmo objeto nos outros casos é o que impede descontar duas
 * vezes o mesmo envio -- e o `total` fica, porque com "Só não lidos" o envio aberto continua na lista.
 */
export function comEnvioLido(
  dados: RespostaDeHistoricoPaginada | undefined,
  sequencia: number,
): RespostaDeHistoricoPaginada | undefined {
  const alvo = dados?.historico.find((item) => item.sequencia === sequencia);
  if (!dados || !alvo || alvo.lido !== false) return dados;
  const contagens = dados.contagens_da_leitura;
  return {
    ...dados,
    historico: dados.historico.map((item) => (item === alvo ? { ...item, lido: true } : item)),
    contagens_da_leitura: contagens && {
      ...contagens,
      [LEITURA_NAO_LIDOS]: contagens[LEITURA_NAO_LIDOS] - 1,
      [LEITURA_LIDOS]: contagens[LEITURA_LIDOS] + 1,
    },
  };
}
