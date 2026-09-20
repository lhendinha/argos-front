import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import {
  EstadoDeErro,
  EstadoVazio,
  EtiquetaDeMetadado,
  Esqueleto,
  ItemDeLista,
  ModalDeTarefa,
} from "../../../../components";
import { useCatalogosDeProcesso } from "../../../../hooks/useCatalogosDeProcesso";
import { useToastOnQueryError } from "../../../../services/queryClient";
import { formatarData } from "../../../../utils";
import { useTarefasDoProcesso } from "../../hooks/useTarefasDoProcesso";
import type { Tarefa } from "../../../../types";
import type { TarefasVinculadasProps } from "./types";

/** As tarefas abertas neste processo.
 *
 * É a única informação da página que não está em nenhuma outra tela: a
 * listagem mostra prazos do processo, não o que alguém marcou pra fazer.
 * Depende do filtro `processo_numero` de `GET /tarefas`.
 *
 * As linhas ABREM a tarefa: uma lista que diz que há três coisas a fazer e
 * não deixa mexer em nenhuma obriga a decorar o título, sair pra Agenda ou
 * pro Kanban e procurar lá.
 */
export default function TarefasVinculadas({ numeroProcesso }: TarefasVinculadasProps) {
  const query = useTarefasDoProcesso(numeroProcesso);
  useToastOnQueryError(query.error, "Não foi possível carregar as tarefas do processo.");

  const queryClient = useQueryClient();
  const [aberta, setAberta] = useState<Tarefa | null>(null);

  /* O mesmo hook que a página já chama. Não custa requisição: as consultas
     de catálogo dividem chave, então a segunda declaração lê do cache. E
     chamar aqui evita atravessar `apoio` inteiro por prop só pra traduzir
     UM id em nome. */
  const apoio = useCatalogosDeProcesso();

  if (query.isPending) return <Esqueleto linhas={2} />;

  // 🔴 Erro não é "não tem tarefa".
  //
  // Sem este ramo, uma falha de rede deixava `data` indefinido, a lista caía
  // pra `[]` e o cartão AFIRMAVA que o processo não tem tarefa nenhuma. O
  // toast some em 4,5s; a afirmação falsa fica. Pior: o diálogo de exclusão
  // desta mesma página já trata `isError` com rigor -- a tela dizia duas
  // coisas diferentes sobre o mesmo dado.
  if (query.isError) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar as tarefas deste processo."
        onTentarDeNovo={() => query.refetch()}
        tentando={query.isFetching}
      />
    );
  }

  const tarefas = query.data?.tarefas || [];
  if (tarefas.length === 0) {
    return <EstadoVazio mensagem="Nenhuma tarefa vinculada a este processo." />;
  }

  return (
    <>
      {tarefas.map((t) => (
        /* 🔴 **Era uma fileira só, e no celular ela espremia o título.**
           Medido em 375px: o título ficava com ~60px porque as três
           etiquetas não encolhem (`flexShrink: 0`) e ele sim -- lia-se
           "COMPROV" e "GRATUIDAD" em duas linhas, com as pílulas ao lado.
           O contrato resolve pela estrutura: o título é o identificador e
           tem a linha inteira; as etiquetas descem para a fileira delas.

           ⚠️ **A bolinha não vem.** O compartimento da frente custa 44px em
           toda linha e é para o que se toca ou se varre -- o `Ponto` aqui
           era decoração, e o contrato já recusou decoração ali no catálogo
           do Financeiro.

           ⚠️ **Concluída desbota em vez de riscar.** O identificador é
           `string` por contrato, então não há como riscá-lo -- e não faz
           falta: `coluna_nome` já diz em que pé a tarefa está, e o
           `esmaecido` é o mesmo sinal que o catálogo usa para arquivado. */
        <ItemDeLista
          key={t.tarefa_id}
          onAbrir={() => setAberta(t)}
          rotulo={`${t.titulo}${t.esta_concluida ? ", concluída" : ""}`}
          identificador={t.titulo}
          esmaecido={t.esta_concluida}
          etiquetas={
            <>
              {/* Em que pé a tarefa está. Derivado no servidor
                  (`coluna_nome`): omitido quando o quadro não conhece a
                  coluna, em vez de mostrar um id cru. */}
              {t.coluna_nome && <EtiquetaDeMetadado>{t.coluna_nome}</EtiquetaDeMetadado>}
              <EtiquetaDeMetadado>{t.prioridade}</EtiquetaDeMetadado>
            </>
          }
          rodape={{ texto: formatarData(t.data) }}
        />
      ))}

      {aberta && (
        <ModalDeTarefa
          tarefa={aberta}
          subgrupoAtual={aberta.subgrupo_id}
          subgrupoAtualNome={apoio.subgrupoNome(aberta.subgrupo_id)}
          onSalvo={() => {
            setAberta(null);
            /* Prefixo, e uma invalidação só: `qk.tarefasDoProcesso`
               COMEÇA com "tarefas", então isto já derruba a lista deste
               cartão junto com Agenda, Kanban e Área de trabalho, que
               podem estar em cache. */
            queryClient.invalidateQueries({ queryKey: ["tarefas"] });
          }}
          onFechar={() => setAberta(null)}
        />
      )}
    </>
  );
}
