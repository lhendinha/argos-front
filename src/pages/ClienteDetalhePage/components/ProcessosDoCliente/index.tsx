import { Stack } from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  EstadoDeErro,
  EstadoVazio,
  Esqueleto,
  EtiquetasDeSubgrupo,
  ItemDeLista,
} from "../../../../components";
import { useCatalogosDeProcesso } from "../../../../hooks/useCatalogosDeProcesso";
import { useToastOnQueryError } from "../../../../services/queryClient";
import { mascararNumeroProcesso } from "../../../../utils";
import { useProcessosDoCliente } from "../../hooks/useProcessosDoCliente";
import ModalDoProcesso from "../ModalDoProcesso";
import type { Processo } from "../../../../types";
import type { ProcessosDoClienteProps } from "./types";

/** Os processos deste cliente.
 *
 * Sai de `GET /processos?cliente_id=X`, filtro que já existia -- é a mesma
 * pergunta que a coluna "Processos" da listagem responde em número, aqui
 * respondida por extenso.
 *
 * As linhas ABREM um resumo: uma lista de números mascarados que não leva a
 * lugar nenhum obriga a copiar o número, sair pra listagem de processos e
 * colar na busca.
 */
export default function ProcessosDoCliente({ clienteId }: ProcessosDoClienteProps) {
  const apoio = useCatalogosDeProcesso();
  const navegar = useNavigate();
  const [aberto, setAberto] = useState<Processo | null>(null);
  const query = useProcessosDoCliente(clienteId);
  useToastOnQueryError(query.error, "Não foi possível carregar os processos do cliente.");

  if (query.isPending) return <Esqueleto linhas={2} />;

  // 🔴 Erro NÃO é lista vazia.
  //
  // Sem isto, `query.data || []` fazia o cartão AFIRMAR "Nenhum processo
  // vinculado a este cliente" pra um cliente que tem 25. O toast some em
  // 4,5s; a afirmação falsa fica na tela.
  //
  // O irmão desta mesma leva -- `TarefasVinculadas` -- já tratava assim, e
  // com o mesmo raciocínio escrito. Porta irmã que ficou aberta um arquivo
  // ao lado.
  if (query.isError) {
    return (
      <EstadoDeErro
        mensagem="Não foi possível carregar os processos deste cliente."
        onTentarDeNovo={() => query.refetch()}
        tentando={query.isFetching}
      />
    );
  }

  const processos = query.data || [];
  if (processos.length === 0) {
    return <EstadoVazio mensagem="Nenhum processo vinculado a este cliente." />;
  }

  return (
    <Stack gap="0">
      {processos.map((p) => (
        /* 🔴 **Era uma fileira só, e ela espremia o que identifica.**
           Medido em 375px: número, apelido, etiqueta de subgrupo e a linha
           de situação disputavam a MESMA linha -- lia-se
           "1000003-65.2026.8.26.0150 V..." com o apelido cortado em duas
           letras. O contrato dá uma linha ao identificador e manda o resto
           para baixo.

           ⚠️ **Sem o nome do cliente**, ao contrário do `ItemDeProcesso` da
           listagem: aqui a tela INTEIRA é de um cliente só, e repetir o nome
           em cada linha é dizer o que o cabeçalho já disse.

           ⚠️ A bolinha não vem, pela mesma razão das tarefas: o
           compartimento da frente é para o que se toca, e ali ela era
           decoração. */
        <ItemDeLista
          key={`${p.subgrupo_id}-${p.numero_processo}`}
          onAbrir={() => setAberto(p)}
          rotulo={p.apelido || mascararNumeroProcesso(p.numero_processo)}
          identificador={p.apelido || mascararNumeroProcesso(p.numero_processo)}
          identificadorMono={!p.apelido}
          /* O apelido é o nome que alguém deu pra reconhecer o processo;
             vinte dígitos não dizem qual é qual. Quando ele existe, o número
             desce para o apoio -- quando não, ele JÁ é o identificador. */
          apoio={p.apelido ? mascararNumeroProcesso(p.numero_processo) : undefined}
          apoioMono
          /* 🔴 Um cliente pode ter processos em subgrupos diferentes, e é
             aqui que a lista os põe lado a lado.

             ⚠️ `apoio.subgrupoNome`, e não `useNomeDeSubgrupo()`: este
             componente já chama `useCatalogosDeProcesso`, que expõe a mesma
             tradução sobre o mesmo catálogo. */
          etiquetas={<EtiquetasDeSubgrupo nomes={[apoio.subgrupoNome(p.subgrupo_id)]} />}
          rodape={{
            texto:
              [apoio.situacaoRotulo(p.situacao_id), apoio.faseRotulo(p.fase_id)]
                .filter(Boolean)
                .join(" · ") || undefined,
          }}
        />
      ))}

      {aberto && (
        <ModalDoProcesso
          processo={aberto}
          situacao={apoio.situacaoRotulo(aberto.situacao_id)}
          fase={apoio.faseRotulo(aberto.fase_id)}
          /* 🔴 O resumo NÃO tem endereço próprio, ao contrário da aba e do
             teor da movimentação -- e de propósito: a coisa que ele resume
             já tem um, que é a tela do processo. Dar URL ao resumo seria
             criar um segundo endereço pro mesmo processo. */
          onAbrirProcesso={() =>
            navegar(`/processos/${aberto.subgrupo_id}/${aberto.numero_processo}`)
          }
          onFechar={() => setAberto(null)}
        />
      )}
    </Stack>
  );
}
