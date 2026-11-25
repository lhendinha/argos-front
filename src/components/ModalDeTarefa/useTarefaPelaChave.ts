/** A tarefa que o modal de EDITAR mostra, lida pela chave a cada abertura -- nunca a da lista nem a do cache.
 *
 * 🔴 A lista projeta só o que mostra (a das abertas não traz o aviso), e `qk.tarefa` fica fora do prefixo
 * `"tarefas"`: reaberto do cache, o modal semearia a hora velha, e salvar a gravaria de volta. Por isso `gcTime: 0`
 * e o formulário só com `isFetchedAfterMount`.
 * ➡️ `components/ModalDeTarefa/index.test.tsx`
 */
import { useQuery } from "@tanstack/react-query";

import { detalhesTarefa } from "../../services";
import { ApiError } from "../../services/api/client";
import { qk } from "../../services/queryKeys";
import type { Tarefa } from "../../types";
import type { ChaveDoModalDeTarefa } from "./types";

export function useTarefaPelaChave(chave: ChaveDoModalDeTarefa | null) {
  const consulta = useQuery<Tarefa>({
    queryKey: chave ? qk.tarefa(chave.subgrupo_id, chave.tarefa_id) : ["tarefa", "nenhuma"],
    queryFn: () => detalhesTarefa(chave!.subgrupo_id, chave!.tarefa_id) as Promise<Tarefa>,
    enabled: Boolean(chave),
    gcTime: 0,
    /* Mesmo com a tarefa já em cache (o link do e-mail a acabou de ler), lê de novo: o formulário só monta com ela. */
    refetchOnMount: "always",
    retry: false,
  });
  return {
    tarefa: consulta.isFetchedAfterMount ? consulta.data : undefined,
    sumiu: consulta.error instanceof ApiError && consulta.error.status === 404,
    falhou: Boolean(consulta.error),
  };
}
