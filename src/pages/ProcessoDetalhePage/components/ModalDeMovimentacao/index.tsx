import { Stack, Text } from "@chakra-ui/react";

import {
  Botao,
  CampoDeLeitura,
  IconePlus,
  Modal,
  RodapeDeAcoes,
  TextoDaComunicacao,
} from "../../../../components";
import { formatarData } from "../../../../utils";
import { useTeorDaMovimentacao } from "../../hooks/useTeorDaMovimentacao";
import type { ModalDeMovimentacaoProps } from "./types";

/** Os detalhes de UMA movimentação.
 *
 * 🔴 Existe porque a lista NÃO traz o texto do tribunal (ver
 * `ItemDeMovimentacao`): cinco publicações inteiras empilhadas, cada uma
 * num bloco rolável de 200px, tornavam a lista impercorrível -- e o teor
 * que interessa é sempre o de UM item. Tem endereço próprio na URL
 * (`?comunicacao=`), então dá pra mandar pra alguém e sobrevive a um F5.
 *
 * ⚠️ **Não leva pro documento no tribunal.** O teor da publicação é o que se
 * lê pra saber o que aconteceu, e a peça no site do tribunal é uma porta pra
 * FORA do sistema: em 7 dos 71 links medidos em 26/08/2026 ela nem abria (6
 * devolviam 403 e 1 apontava pra um host da rede interna do TST, vazado no
 * dado do PJe). O campo `link` continua chegando da API e guardado, caso um
 * dia sirva pra outra coisa.
 *
 * ⚠️ **Não é o "Detalhes do envio" do Histórico, e a diferença é o assunto.**
 * Lá se olha uma NOTIFICAÇÃO -- quem recebeu, se entregou; aqui, a
 * PUBLICAÇÃO. Uma movimentação existe tenha ou não gerado e-mail, e a
 * maioria não gerou: o robô grava o acervo inteiro do processo e só notifica
 * o que está dentro da janela. Por isso os detalhes daqui nunca dependem do
 * envio -- ele só acrescenta um caminho, quando existe.
 */
export default function ModalDeMovimentacao({
  comunicacao,
  numeroProcesso,
  onVerOEnvio,
  onAdicionarTarefa,
  onFechar,
}: ModalDeMovimentacaoProps) {
  /* 🔴 O teor é buscado AQUI, e não recebido da lista: a lista mostra tipo,
     data e órgão, e carregar o texto de todas para mostrar nenhuma custava
     100 KB no processo mais movimentado do escritório. O modal só monta
     quando alguém abre -- é exatamente quando o texto passa a ser preciso. */
  const teor = useTeorDaMovimentacao(numeroProcesso, comunicacao.comunicacao_id);

  return (
    <Modal
      descarte="semFormulario"
      largo
      titulo="Detalhes da movimentação"
      onFechar={onFechar}
      /* No CABEÇALHO, e não no rodapé logo abaixo: aquele rodapé é
         condicional de propósito (só existe quando há e-mail pra onde ir), e
         pôr a tarefa lá o tornaria incondicional pra todo mundo. */
      acaoNoCabecalho={
        <Botao variante="ghost" onClick={onAdicionarTarefa}>
          <IconePlus />
          Adicionar tarefa
        </Botao>
      }
      /* Rodapé SÓ quando há pra onde ir. `RodapeDeAcoes` vazio desenharia
         uma faixa cinza no pé do modal sem nada dentro -- que lê como
         controle que sumiu, não como "não há ação aqui".

         ⚠️ Sem "Fechar": o X do cabeçalho já é esse controle, e dois botões
         com o MESMO nome acessível no mesmo diálogo fazem o leitor de tela
         anunciar a escolha duas vezes -- e quebram qualquer busca por
         nome. */
      rodape={
        onVerOEnvio ? (
          <RodapeDeAcoes>
            <Botao onClick={onVerOEnvio}>Ver o e-mail enviado</Botao>
          </RodapeDeAcoes>
        ) : undefined
      }
    >
      <Stack gap="16px">
        {/* Rótulo e valor, e não etiquetas soltas no topo: isto é uma tela
            de DETALHE, e "TJMG" sozinho não diz se é o órgão, o tribunal ou
            o autor. Mesmo par de leitura do detalhe do envio. */}
        <CampoDeLeitura rotulo="Tipo de comunicação">
          <Text fontSize="13.5px">{comunicacao.tipo_comunicacao || "—"}</Text>
        </CampoDeLeitura>

        <CampoDeLeitura rotulo="Disponibilizada em">
          <Text fontSize="13.5px">
            {comunicacao.data_disponibilizacao
              ? formatarData(comunicacao.data_disponibilizacao)
              : "—"}
          </Text>
        </CampoDeLeitura>

        <CampoDeLeitura rotulo="Órgão">
          <Text fontSize="13.5px">{comunicacao.nome_orgao || "—"}</Text>
        </CampoDeLeitura>

        <CampoDeLeitura rotulo="Teor da publicação">
          {/* 🔴 TRÊS estados, e os três precisam ser distintos: buscando,
              falhou e chegou. Enquanto o teor vinha na lista havia só dois,
              e reaproveitar o ramo de "sem texto" para o carregamento faria
              a tela AFIRMAR que a publicação não tem teor enquanto ele ainda
              está a caminho -- mentira que some sozinha, que é a pior.

              O ramo do texto ausente continua explícito: `TextoDaComunicacao`
              não desenha nada sem conteúdo, e um campo com rótulo e nada
              embaixo parece tela quebrada, não publicação sem teor. */}
          {teor.isPending ? (
            <Text fontSize="13px" color="fg.subtle">
              Carregando o teor…
            </Text>
          ) : teor.isError ? (
            <Text fontSize="13px" color="fg.error">
              Não foi possível carregar o teor desta movimentação.
            </Text>
          ) : teor.data?.texto ? (
            <TextoDaComunicacao inteiro html={teor.data.texto} />
          ) : (
            <Text fontSize="13px" color="fg.subtle">
              Esta movimentação chegou sem o texto da publicação.
            </Text>
          )}
        </CampoDeLeitura>
      </Stack>
    </Modal>
  );
}
