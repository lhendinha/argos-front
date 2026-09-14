import { Flex, Text } from "@chakra-ui/react";

import { Ponto } from "../../../../components";
import { contarFormatado, formatarQuantidade } from "../../../../utils";
import type { ResumoDaListaProps } from "./types";

/** A linha acima da lista: quantos a lista mostra, de quantos, quantos não lidos -- e a legenda do ponto.
 *
 * ⚠️ Some enquanto carrega, em vez de dizer "carregando…": o esqueleto logo abaixo já é o recado, e duas mensagens da
 * mesma espera na mesma tela é ruído. A linha continua ocupando o espaço, pra a contagem não empurrar a tabela ao chegar.
 *
 * 🔴 Todos os números exatos (decisão 11 do lido): "Mostrando 100 de 1.234 envios · 187 não lidos".
 */
export default function ResumoDaLista({ carregando, total, totalSemFiltro, naoLidos }: ResumoDaListaProps) {
  const texto = carregando
    ? ""
    : `Mostrando ${formatarQuantidade(total)} de ${contarFormatado(totalSemFiltro, "envio", "envios")}` +
      (naoLidos == null ? "" : ` · ${contarFormatado(naoLidos, "não lido", "não lidos")}`);

  return (
    <Flex align="baseline" justify="space-between" gap="12px" wrap="wrap" mb="10px" minH="17px" fontSize="11.5px" color="fg.subtle">
      <Text aria-live="polite">{texto}</Text>
      {/* A legenda diz em palavras o que o ponto diz em forma; para o leitor de tela, quem diz é o nome de cada linha. */}
      <Flex as="span" aria-hidden="true" align="center" gap="12px">
        <Flex as="span" align="center" gap="6px">
          <Ponto />
          não lido
        </Flex>
        <Flex as="span" align="center" gap="6px">
          <Ponto vazado />
          lido
        </Flex>
        <Flex as="span" align="center" gap="6px">
          <Ponto tom="ruim" />
          falha no envio
        </Flex>
      </Flex>
    </Flex>
  );
}
