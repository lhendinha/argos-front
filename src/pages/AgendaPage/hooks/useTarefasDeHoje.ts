import { useMemo } from "react";

import { useToastOnQueryError } from "../../../services/queryClient";
import { filtrarPorPessoa } from "../tarefasPorDia";
import type { ParametrosDasTarefasDeHoje } from "../types";
import { useTarefasDaAgenda } from "./useTarefasDaAgenda";

/** As tarefas de hoje para o cartão lateral, quando hoje está FORA da visão.
 *
 * 🔴 O cartão não pode ler só da consulta da visão: ela pede a janela
 * navegada, e em outro mês as tarefas de hoje não vêm -- o cartão diria
 * "Nenhuma tarefa para hoje" havendo tarefa.
 * ⚠️ Com hoje dentro da janela, NÃO pede nada: a visão já trouxe, e pedir
 * de novo dobraria a requisição de toda abertura da tela.
 * ⚠️ Em "Atrasadas" também não pede: o cartão mostra o aviso, não a lista.
 *
 * ➡️ `AgendaPage/index.test.tsx`, bloco "cartão de hoje".
 */
export function useTarefasDeHoje({
  subgrupoIds,
  intervalo,
  atrasadas,
  pessoa,
  isoDeHoje,
  daVisao,
}: ParametrosDasTarefasDeHoje) {
  const hojeNaVisao = intervalo.de <= isoDeHoje && isoDeHoje <= intervalo.ate;
  const foraDaVisao = !atrasadas && !hojeNaVisao;
  const consulta = useTarefasDaAgenda(
    subgrupoIds,
    { de: isoDeHoje, ate: isoDeHoje },
    "todos",
    foraDaVisao,
  );
  useToastOnQueryError(consulta.error, "Não foi possível carregar as tarefas de hoje.");

  const tarefas = useMemo(
    () => filtrarPorPessoa(consulta.data || [], pessoa),
    [consulta.data, pessoa],
  );
  /* O assunto dos atendimentos sai de UMA lista só: a da visão mais estas. */
  const paraAssuntos = useMemo(
    () => (foraDaVisao && consulta.data ? [...daVisao, ...consulta.data] : daVisao),
    [foraDaVisao, consulta.data, daVisao],
  );

  return { foraDaVisao, tarefas, carregando: consulta.isPending, paraAssuntos };
}
