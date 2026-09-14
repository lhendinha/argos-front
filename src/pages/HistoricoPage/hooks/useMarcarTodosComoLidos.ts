/** "Marcar todos como lidos" e o Desfazer: tudo o que a pessoa vê, ignorando os filtros (decisão 5 do lido).
 *
 * 🔴 O aviso diz "inclusive os fora dos filtros" quando há filtro ligado -- e a tela abre em Movimentações, então quase
 * sempre há. Sem isso, quem marca com "Só com falha" acharia que marcou só as falhas.
 *
 * ⚠️ O Desfazer vive no aviso, e o servidor o aceita por um minuto: depois disso, ou se a pessoa marcou de novo, a
 * resposta é 409 e a frase dela vira o aviso de erro.
 *
 * ➡️ `pages/HistoricoPage/index.test.tsx`.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "../../../contexts/ToastContext";
import { ApiError, desfazerMarcarTodos, marcarTodosComoLidos } from "../../../services";
import { qk } from "../../../services/queryKeys";
import { contarFormatado } from "../../../utils";
import type { RespostaDeMarcarTodosLidos } from "../../../types/respostas";

export function useMarcarTodosComoLidos(comFiltro: boolean) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const recarregar = () => queryClient.invalidateQueries({ queryKey: qk.prefixoHistorico() });

  const desfazer = useMutation({
    mutationFn: (geracao: number) => desfazerMarcarTodos(geracao),
    onSuccess: recarregar,
    onError: (erro) => toast.erro(erro instanceof ApiError ? erro.message : "Não foi possível desfazer."),
  });

  const marcar = useMutation({
    mutationFn: () => marcarTodosComoLidos() as Promise<RespostaDeMarcarTodosLidos>,
    onSuccess: ({ marcados, geracao }) => {
      void recarregar();
      const fora = comFiltro ? ", inclusive os fora dos filtros" : "";
      toast.sucesso(`${contarFormatado(marcados, "envio marcado como lido", "envios marcados como lidos")}${fora}.`, {
        onDesfazer: () => desfazer.mutate(geracao),
      });
    },
    onError: () => toast.erro("Não foi possível marcar os envios como lidos."),
  });

  return { marcarTodos: () => marcar.mutate(), marcando: marcar.isPending };
}
