/** O contador de não lidos do Histórico: o número do item do menu.
 *
 * 🔴 A consulta é a fonte da verdade, e três coisas a mandam buscar de novo: voltar o foco à aba, marcar um envio como
 * lido (quem marca invalida esta chave) e o aviso de lembrete que chega pelo canal -- o mesmo ciclo que manda o
 * e-mail. A movimentação nova não tem aviso no canal: aparece no próximo foco.
 *
 * ➡️ `hooks/useNaoLidosDoHistorico.test.tsx`.
 */
import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { TIPO_LEMBRETE } from "../constants";
import { contarNaoLidosDoHistorico } from "../services";
import { qk } from "../services/queryKeys";
import { assinarCanal } from "../utils/canalDeTempoReal";
import type { RespostaDeNaoLidosDoHistorico } from "../types/respostas";

export function useNaoLidosDoHistorico(): number {
  const queryClient = useQueryClient();
  const query = useQuery<RespostaDeNaoLidosDoHistorico>({
    queryKey: qk.naoLidosDoHistorico(),
    queryFn: () => contarNaoLidosDoHistorico() as Promise<RespostaDeNaoLidosDoHistorico>,
    refetchOnWindowFocus: true,
  });

  useEffect(
    () =>
      /* ⚠️ Só o lembrete: o sino recebe outros avisos pelo mesmo canal, e nenhum deles muda o Histórico. */
      assinarCanal("notificacao", (mensagem) => {
        if (mensagem.notificacao?.tipo === TIPO_LEMBRETE) {
          void queryClient.invalidateQueries({ queryKey: qk.naoLidosDoHistorico() });
        }
      }),
    [queryClient],
  );

  return query.data?.nao_lidos ?? 0;
}
