import { Box } from "@chakra-ui/react";

import { BotaoDeTexto, Cartao, EstadoVazio, Esqueleto } from "../../../../components";
import LinhaDeTarefa from "../LinhaDeTarefa";
import type { CartaoDoDiaProps } from "./types";

const DIA_DA_SEMANA = new Intl.DateTimeFormat("pt-BR", { weekday: "long" });
const DATA = new Intl.DateTimeFormat("pt-BR");

/** O dia selecionado na grade do mês, na lateral da Agenda.
 *
 * A grade mostra só PONTOS; é aqui que se lê o que eles são. Abre em hoje, e
 * o clique num dia troca o que o cartão mostra.
 * ⚠️ Só existe na visão "Por mês": em Semana, Dia e Lista os títulos já
 * estão na tela, e o cartão só repetiria. Por isso também não tem caixa de
 * seleção: entrar em "Selecionar" leva a tela para "Em lista".
 *
 * ➡️ `AgendaPage/index.test.tsx`, bloco "cartão do dia".
 */
export default function CartaoDoDia({
  dia,
  ehHoje,
  tarefas,
  carregando,
  subgrupoNome,
  assuntoDoAtendimento,
  onAbrir,
  onAbrirDia,
}: CartaoDoDiaProps) {
  const nome = ehHoje ? "Hoje" : DIA_DA_SEMANA.format(dia).replace(/^./, (c) => c.toUpperCase());
  return (
    <Cartao
      titulo={`${nome} · ${DATA.format(dia)}`}
      acoes={<BotaoDeTexto onClick={onAbrirDia}>Abrir dia</BotaoDeTexto>}
    >
      {carregando ? (
        <Box px="16px" py="10px">
          <Esqueleto linhas={3} />
        </Box>
      ) : tarefas.length === 0 ? (
        <EstadoVazio mensagem={ehHoje ? "Nenhuma tarefa para hoje." : "Nenhuma tarefa neste dia."} />
      ) : (
        <Box px="16px" py="4px">
          {tarefas.map((tarefa, indice) => (
            <LinhaDeTarefa
              key={`${tarefa.subgrupo_id}:${tarefa.tarefa_id}`}
              tarefa={tarefa}
              concluida={tarefa.esta_concluida ?? false}
              nomeDaColuna={tarefa.coluna_nome ?? undefined}
              subgrupoNome={subgrupoNome(tarefa.subgrupo_id)}
              assuntoDoAtendimento={
                tarefa.atendimento_id ? assuntoDoAtendimento(tarefa.atendimento_id) : undefined
              }
              onAbrir={onAbrir}
              ultima={indice === tarefas.length - 1}
              horaNoDetalhe
            />
          ))}
        </Box>
      )}
    </Cartao>
  );
}
