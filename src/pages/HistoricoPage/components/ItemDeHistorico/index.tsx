import { Box, Flex, Stack, Text } from "@chakra-ui/react";

import { Etiqueta, EtiquetasDeSubgrupo, Ponto } from "../../../../components";
import { TIPO_ENVIO_LEMBRETE } from "../../../../constants";
import { formatarDataHora, mascararNumeroProcesso } from "../../../../utils";
import { CORES_DO_ENVIO } from "../../../../theme/envio";
import type { ItemDeHistoricoProps } from "./types";

/** Um envio na lista do histórico (`.hist-item` do artifact).
 *
 * A linha inteira abre o detalhe, então precisa ser alcançável pelo
 * teclado: `tabIndex` + Enter/Espaço.
 */
export default function ItemDeHistorico({ item, subgruposVisiveis, onAbrir }: ItemDeHistoricoProps) {
  const falhou = Boolean(item.falhou);
  /* ⚠️ Só `false` é não lido: resposta antiga, sem o campo, não destaca nada -- não saber não é motivo pra chamar
     atenção. */
  const naoLido = item.lido === false;

  /** Lembrete de tarefa não tem processo -- `numero_processo` guarda
   * `TAREFA#{id}` porque é chave de partição. Mostrar isso mascarado como
   * número de processo seria inventar um processo que não existe. */
  const ehDeTarefa = Boolean(item.tarefa_id);
  const titulo = ehDeTarefa
    ? item.assunto || "Lembrete de tarefa"
    : mascararNumeroProcesso(item.numero_processo);

  const meta = [
    formatarDataHora(item.enviado_em),
    item.tipo_envio === TIPO_ENVIO_LEMBRETE ? "Lembrete" : undefined,
    item.tipo_comunicacao,
    item.nome_orgao,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Flex
      role="button"
      tabIndex={0}
      /* O estado vai no NOME: o fundo, o peso e o anel são só visuais, e quem usa leitor de tela precisa ouvir o que a
         linha mostra. */
      aria-label={`${titulo}, ${naoLido ? "não lido" : "lido"}${falhou ? ", falha no envio" : ""}`}
      data-lido={naoLido ? "false" : "true"}
      gap="14px"
      p="15px 14px"
      bg={naoLido ? "brand.faint" : undefined}
      borderBottomWidth="1px"
      borderBottomColor="border.subtle"
      _last={{ borderBottomWidth: 0 }}
      cursor="pointer"
      transition="background .1s"
      _hover={{ bg: naoLido ? "bg.brand.subtle" : "bg.canvas" }}
      _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      onClick={() => onAbrir(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(item);
        }
      }}
    >
      {/* O ponto repete em COR o que a etiqueta diz em texto, e é o que
          deixa uma falha visível numa lista longa sem ler linha por linha. */}
      <Ponto tom={falhou ? "ruim" : "marca"} noTopo vazado={!naoLido} />

      <Stack gap="3px" minW="0">
        {/* O não lido tem o título em negrito e em tinta; o lido, mais leve e em cinza -- como no artefato do lido. */}
        <Text
          fontSize="13.5px"
          fontWeight={ehDeTarefa ? (naoLido ? "800" : "500") : naoLido ? "600" : "400"}
          color={naoLido ? "fg" : "fg.muted"}
          fontFamily={ehDeTarefa ? undefined : "mono"}
        >
          {titulo}
        </Text>
        <Text fontSize="12px" color={naoLido ? "fg.muted" : "fg.subtle"}>
          {meta}
        </Text>
        {/* 🔴 Só os subgrupos QUE VOCÊ PARTICIPA, e este é o único lugar do
            sistema com essa regra.

            Um envio entra na sua lista por INTERSEÇÃO: basta um dos
            `subgrupos_notificados` cruzar com os seus. Os outros podem ser de
            gente que você nem enxerga, e despejar o id deles aqui não seria
            honestidade -- seria mostrar identificador alheio ao lado dos
            nomes. Ver `useNomesDeSubgruposVisiveis`, que carrega o porquê de
            o comportamento ser o OPOSTO do das outras telas.

            ⚠️ Lista de verdade, ao contrário das outras seis: aqui a régua
            "até dois nomes, depois a contagem" de `EtiquetasDeSubgrupo`
            realmente entra em jogo. */}
        <EtiquetasDeSubgrupo nomes={subgruposVisiveis(item.subgrupos_notificados)} />
        {item.destinatarios && item.destinatarios.length > 0 && (
          <Text fontSize="12px" color={naoLido ? "fg.muted" : "fg.subtle"}>
            Pra: {item.destinatarios.join(", ")}
          </Text>
        )}
      </Stack>

      <Box ml="auto" alignSelf="center" flex="0 0 auto">
        <Etiqueta cores={falhou ? CORES_DO_ENVIO.falhou : CORES_DO_ENVIO.enviado}>
          {falhou ? "Falha" : "Enviado"}
        </Etiqueta>
      </Box>
    </Flex>
  );
}
