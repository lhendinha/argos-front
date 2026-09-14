/** Abrir um envio do Histórico -- pela linha ou pelo link do e-mail -- é ler (decisão 2 do lido).
 *
 * 🔴 A linha e as contagens mudam no CACHE da página, quando o servidor confirma; a lista não recarrega, e com
 * "Só não lidos" o envio aberto continua ali até a pessoa trocar de filtro.
 *
 * ⚠️ Só marca o que está não lido e tem sequência: o lido não gasta chamada, e a resposta antiga, sem o campo, não é
 * motivo pra marcar nada.
 *
 * ➡️ `pages/HistoricoPage/index.test.tsx`.
 */
import { useQueryClient } from "@tanstack/react-query";

import { useMarcarLidoNoHistorico } from "../../../hooks/useMarcarLidoNoHistorico";
import { comEnvioLido } from "../leitura";
import type { HistoricoItem } from "../../../types";
import type { RespostaDeHistoricoPaginada } from "../../../types/respostas";

export function useAbrirEnvio(chaveDaLista: readonly unknown[], mostrar: (item: HistoricoItem) => void) {
  const queryClient = useQueryClient();
  const marcarLido = useMarcarLidoNoHistorico();

  return (item: HistoricoItem) => {
    mostrar(item);
    const { sequencia } = item;
    if (item.lido !== false || sequencia == null) return;
    marcarLido(
      { sequencia },
      {
        onSuccess: () =>
          queryClient.setQueryData<RespostaDeHistoricoPaginada>(chaveDaLista, (dados) => comEnvioLido(dados, sequencia)),
      },
    );
  };
}
