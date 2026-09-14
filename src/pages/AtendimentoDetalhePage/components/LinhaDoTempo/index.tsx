import { Box, Flex, Text } from "@chakra-ui/react";
import { useLayoutEffect, useRef, useState } from "react";

import { Avatar, Botao } from "../../../../components";
import { ANIMACAO_DO_REGISTRO_QUE_CHEGOU } from "../../../../theme/atendimento";
import { chaveDoRegistro, contagemDaLinhaDoTempo, formatarDataHora } from "../../../../utils";
import type { AncoraDaLinhaDoTempo, LinhaDoTempoProps } from "./types";

/** A linha do tempo do atendimento (`.timeline` do artifact), com "Ver registros anteriores" no topo.
 *
 * Ordem de escrita, do mais antigo pro mais novo: é uma conversa, e ler de
 * trás pra frente perde o encadeamento. O campo de escrever fica no fim,
 * logo abaixo do último -- onde a leitura termina.
 *
 * 🔴 Os anteriores entram EM CIMA sem a vista pular: ao pedir, guarda onde
 * estava o primeiro registro da tela; quando eles chegam, rola a janela pela
 * diferença. Sem isso, 20 registros no topo empurram para baixo o que a
 * pessoa estava lendo.
 *
 * ⚠️ O registro que chega depois da primeira pintura -- anterior carregado ou
 * novo escrito -- acende por um instante; os da primeira pintura, não.
 *
 * ➡️ `pages/AtendimentoDetalhePage/index.test.tsx`, "linha do tempo, 20 por vez".
 */
export default function LinhaDoTempo({
  registros,
  quantidade,
  temAnteriores,
  carregandoAnteriores,
  onVerAnteriores,
}: LinhaDoTempoProps) {
  const lista = useRef<HTMLDivElement>(null);
  const ancora = useRef<AncoraDaLinhaDoTempo | null>(null);
  /* As chaves da primeira pintura, lidas uma vez: quem não está aqui chegou depois. */
  const [daPrimeiraPintura] = useState(() => new Set(registros.map(chaveDoRegistro)));

  function verAnteriores() {
    const primeiro = lista.current?.querySelector<HTMLElement>("[data-registro]");
    if (primeiro?.dataset.registro) {
      ancora.current = {
        chave: primeiro.dataset.registro,
        topo: primeiro.getBoundingClientRect().top,
        quantos: registros.length,
      };
    }
    onVerAnteriores();
  }

  useLayoutEffect(() => {
    const guardada = ancora.current;
    if (!guardada || !lista.current) return;
    if (registros.length === guardada.quantos) {
      /* Não chegaram. Com o pedido encerrado, ele falhou: a âncora velha não
         pode rolar a tela quando um registro novo chegar depois. */
      if (!carregandoAnteriores) ancora.current = null;
      return;
    }
    ancora.current = null;
    const mesmo = [...lista.current.querySelectorAll<HTMLElement>("[data-registro]")].find(
      (el) => el.dataset.registro === guardada.chave,
    );
    if (!mesmo) return;
    const diferenca = mesmo.getBoundingClientRect().top - guardada.topo;
    if (diferenca) window.scrollBy(0, diferenca);
  }, [registros, carregandoAnteriores]);

  return (
    <Flex direction="column" ref={lista}>
      {/* O topo (`.anteriores` do artifact): o botão enquanto houver registros
          antes dos da tela, e a frase sempre. */}
      <Flex
        direction="column"
        align="center"
        gap="6px"
        pt="2px"
        pb="12px"
        borderBottomWidth="1px"
        borderBottomStyle="solid"
        borderBottomColor="border.subtle"
      >
        {temAnteriores && (
          <Botao
            variante="ghost"
            p="6px 12px"
            fontSize="12.5px"
            lineHeight="18px"
            disabled={carregandoAnteriores}
            onClick={verAnteriores}
          >
            {carregandoAnteriores ? "Carregando…" : "Ver registros anteriores"}
          </Botao>
        )}
        <Text fontSize="11.5px" color="fg.subtle">
          {contagemDaLinhaDoTempo(registros.length, quantidade)}
        </Text>
      </Flex>
      {registros.map((registro, indice) => {
        const chave = chaveDoRegistro(registro);
        const chegou = !daPrimeiraPintura.has(chave);
        return (
          <Flex
            key={chave}
            data-registro={chave}
            gap="12px"
            py="14px"
            borderBottomWidth={indice === registros.length - 1 ? "0" : "1px"}
            borderBottomStyle="solid"
            borderBottomColor="border.subtle"
          >
            {/* 🔴 O nome vem NO registro, resolvido pelo servidor -- antes vinha de
                um tradutor montado com TODAS as pessoas do grupo, e a lista só
                chegava pra `manager` pra cima. */}
            <Avatar nome={registro.autor_nome ?? registro.autor_id} tamanho="pequeno" />
            <Box
              flex="1"
              minW="0"
              bg="bg.canvas"
              borderWidth="1px"
              borderStyle="solid"
              borderColor="border.subtle"
              borderRadius="md"
              p="11px 14px"
              data-chegou={chegou ? "true" : undefined}
              css={chegou ? ANIMACAO_DO_REGISTRO_QUE_CHEGOU : undefined}
            >
              <Flex align="center" gap="8px" mb="4px" wrap="wrap">
                <Text as="span" fontWeight="800" fontSize="12.5px">
                  {registro.autor_nome ?? registro.autor_id}
                </Text>
                <Text as="span" fontSize="11.5px" color="fg.subtle" fontFamily="mono">
                  {formatarDataHora(registro.registrado_em)}
                </Text>
              </Flex>
              {/* `pre-wrap` porque o texto vem de um textarea: sem isso as
                  quebras de linha que a pessoa digitou viram um parágrafo
                  corrido. */}
              <Text fontSize="13px" whiteSpace="pre-wrap">
                {registro.texto}
              </Text>
            </Box>
          </Flex>
        );
      })}
    </Flex>
  );
}
