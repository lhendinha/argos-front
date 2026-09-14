/** Marca como lido o envio que a pessoa abriu, e recarrega só o contador.
 *
 * 🔴 Marcar NÃO recarrega a lista: quem abriu pela lista acerta o item e as contagens no próprio cache, no `onSuccess`
 * da chamada -- e com "Só não lidos" o envio aberto continua ali até a pessoa trocar de filtro.
 *
 * ⚠️ Sem aviso de erro: marcar é consequência de abrir, e não uma ação que a pessoa pediu -- como no sino. Se falhar,
 * o envio continua não lido, que é o estado verdadeiro.
 *
 * ➡️ `pages/HistoricoPage/index.test.tsx` e `pages/ProcessoDetalhePage/index.test.tsx`.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { marcarEnvioComoLido } from "../services";
import { qk } from "../services/queryKeys";
import type { AlvoDaLeitura } from "../types";
import type { RespostaDeLeituraDoHistorico } from "../types/respostas";

export function useMarcarLidoNoHistorico() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (alvo: AlvoDaLeitura) => marcarEnvioComoLido(alvo) as Promise<RespostaDeLeituraDoHistorico>,
    onSettled: () => queryClient.invalidateQueries({ queryKey: qk.naoLidosDoHistorico() }),
  });
  return mutation.mutate;
}
