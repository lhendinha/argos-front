/** A linha do tempo do atendimento, 20 registros por vez, dos mais recentes para trás.
 *
 * 🔴 Carrega à parte do cabeçalho: o atendimento não traz os registros (regra 9
 * da seção 0), e a linha do tempo tem o próprio carregando e o próprio erro.
 *
 * ⚠️ As páginas chegam da mais nova para a mais antiga, e cada uma vem em ordem
 * de escrita: a linha do tempo junta as páginas de trás para frente. Na ordem
 * de chegada, os 20 mais recentes ficariam ANTES dos anteriores.
 *
 * ➡️ `pages/AtendimentoDetalhePage/index.test.tsx`, "linha do tempo, 20 por vez".
 */
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { registrosDoAtendimento } from "../../../services";
import { qk } from "../../../services/queryKeys";

export function useRegistrosDoAtendimento(subgrupoId: string, atendimentoId: string) {
  const consulta = useInfiniteQuery({
    queryKey: qk.registrosDoAtendimento(subgrupoId, atendimentoId),
    queryFn: ({ pageParam }) => registrosDoAtendimento(subgrupoId, atendimentoId, pageParam),
    initialPageParam: "",
    getNextPageParam: (ultima) => ultima.anteriores ?? undefined,
    enabled: Boolean(subgrupoId && atendimentoId),
    /* Mesmo motivo do cabeçalho: atendimento excluído responde 404, e retentar só atrasa o recado. */
    retry: false,
  });

  const registros = useMemo(
    () => [...(consulta.data?.pages ?? [])].reverse().flatMap((pagina) => pagina.registros),
    [consulta.data],
  );

  return { consulta, registros, quantidade: consulta.data?.pages[0]?.quantidade ?? 0 };
}
