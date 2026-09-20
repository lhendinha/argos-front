import { Flex, Table, Text } from "@chakra-ui/react";

import { CelulaComSub, Etiqueta, EtiquetasDeSubgrupo, Ponto } from "../../../../components";
import { TIPO_ENVIO_LEMBRETE } from "../../../../constants";
import { formatarDataHora, mascararNumeroProcesso } from "../../../../utils";
import { CORES_DO_ENVIO } from "../../../../theme/envio";
import type { LinhaDeHistoricoProps } from "./types";

/** Um envio como LINHA de tabela, acima do limiar da lista.
 *
 * 🔴 **As colunas já existiam, grudadas por pontos.** A linha antiga
 * empilhava `data e hora · tipo · órgão` num texto só -- três campos
 * colados. A tabela os descola, e "quais falharam no envio" vira uma coluna
 * em vez de uma caçada.
 *
 * 🔴 **`<tr>` com `tabIndex`, e não `div` com `role="button"`.** A linha
 * antiga fingia ser botão: papel declarado à mão, `tabIndex` e teclas
 * próprias, dentro de uma lista que não era tabela. Aqui a linha É linha de
 * tabela, e o teclado vem do mesmo padrão de `LinhaProcesso`.
 *
 * ⚠️ O estado de leitura continua no NOME (`aria-label`) e em `data-lido`: o
 * fundo tingido e o peso são só visuais, e quem usa leitor de tela precisa
 * ouvir o que a linha mostra.
 */
export default function LinhaDeHistorico({
  item,
  subgruposVisiveis,
  onAbrir,
}: LinhaDeHistoricoProps) {
  const falhou = Boolean(item.falhou);
  /* ⚠️ Só `false` é não lido: resposta antiga, sem o campo, não destaca nada
     -- não saber não é motivo pra chamar atenção. */
  const naoLido = item.lido === false;

  /** Lembrete de tarefa não tem processo: o assunto ocupa o lugar dele. */
  const ehDeTarefa = Boolean(item.tarefa_id);
  const titulo = ehDeTarefa
    ? item.assunto || "Lembrete de tarefa"
    : mascararNumeroProcesso(item.numero_processo);

  const tipo = item.tipo_envio === TIPO_ENVIO_LEMBRETE ? "Lembrete" : item.tipo_comunicacao;
  const destinatarios = item.destinatarios?.length ? `Pra: ${item.destinatarios.join(", ")}` : undefined;
  /* Lembrete de tarefa não tem órgão: sem isto a célula abria com uma linha
     vazia e o "Pra:" caía no lugar do apoio, desalinhado da linha de cima. */
  const subgrupos = subgruposVisiveis(item.subgrupos_notificados);

  return (
    <Table.Row
      tabIndex={0}
      /* O estado vai no NOME: o fundo, o peso e o anel são só visuais. */
      aria-label={`${titulo}, ${naoLido ? "não lido" : "lido"}${falhou ? ", falha no envio" : ""}`}
      data-lido={naoLido ? "false" : "true"}
      bg={naoLido ? "brand.faint" : undefined}
      cursor="pointer"
      transition="background .1s"
      _hover={{ bg: naoLido ? "bg.brand.subtle" : "bg.canvas" }}
      /* Última linha sem divisória: a borda do cartão já fecha a tabela. */
      _last={{ "& td": { borderBottomWidth: 0 } }}
      _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      onClick={() => onAbrir(item)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(item);
        }
      }}
    >
      <CelulaComSub
        variante={ehDeTarefa ? "destaque" : "processo"}
        principal={
          <Flex align="center" gap="9px" minW="0">
            {/* O ponto repete em COR o que a etiqueta diz em texto, e é o
                que deixa uma falha visível numa lista longa sem ler linha
                por linha. */}
            <Ponto tom={falhou ? "ruim" : "marca"} vazado={!naoLido} />
            <Text as="span" truncate>
              {titulo}
            </Text>
          </Flex>
        }
      />

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle" color="fg.muted">
        <Text truncate>{tipo}</Text>
      </Table.Cell>

      <CelulaComSub
        principal={item.nome_orgao || destinatarios}
        sub={item.nome_orgao ? destinatarios : undefined}
      />

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle">
        <Flex align="center" wrap="wrap" gap="6px">
          <Etiqueta cores={falhou ? CORES_DO_ENVIO.falhou : CORES_DO_ENVIO.enviado}>
            {falhou ? "Falha" : "Enviado"}
          </Etiqueta>
          {/* 🔴 Só os subgrupos QUE VOCÊ PARTICIPA, e este é o único lugar do
              sistema com essa regra. Um envio entra na sua lista por
              INTERSEÇÃO: basta um dos `subgrupos_notificados` cruzar com os
              seus. Os outros podem ser de gente que você nem enxerga, e
              despejar o id deles aqui seria mostrar identificador alheio ao
              lado dos nomes. Ver `useNomesDeSubgruposVisiveis`. */}
          {/* ⚠️ O travessão do vazio FICA. Tentei suprimi-lo achando que um
              traço depois de "ENVIADO" não dizia nada, e há um teste que o
              exige, por uma razão melhor que a minha: registro antigo pode
              não ter o campo, e a linha precisa continuar legível em vez de
              perder um pedaço em silêncio. O que estava errado era o
              cabeçalho, que dizia só "Situação" -- é ele que dá referente ao
              traço. */}
          <EtiquetasDeSubgrupo nomes={subgrupos} />
        </Flex>
      </Table.Cell>

      <Table.Cell
        p="13px 14px"
        borderBottomColor="border.subtle"
        textAlign="right"
        color="fg.subtle"
        whiteSpace="nowrap"
      >
        {formatarDataHora(item.enviado_em)}
      </Table.Cell>
    </Table.Row>
  );
}
