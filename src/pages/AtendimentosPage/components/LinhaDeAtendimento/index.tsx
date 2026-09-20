import { Flex, Table, Text } from "@chakra-ui/react";

import { Avatar, Etiqueta, EtiquetasDeSubgrupo } from "../../../../components";
import { coresDoStatus } from "../../../../theme/atendimento";
import { formatarDataDeInstante } from "../../../../utils";
import type { LinhaDeAtendimentoProps } from "./types";

/** O atendimento como LINHA de tabela, acima do limiar da lista.
 *
 * 🔴 **Era uma lista de itens no meio de sete tabelas.** Medido em 1440px:
 * as sete tabelas do sistema usam célula `13px 14px`, cabeçalho
 * `0 14px 10px · 11px/800` e divisória de 1px -- iguais, porque
 * `celulaDeTabela.test.ts` cobra. Atendimentos e Histórico eram as duas
 * exceções, com recuo e tipografia próprios e sem cabeçalho nenhum: nada
 * nomeava a data, o assunto, as pílulas nem o avatar.
 *
 * 🔴 **Situação e subgrupo dividem uma coluna** -- ver
 * `COLUNAS_DE_ATENDIMENTOS`. É o que devolve 141px à coluna do último
 * registro, e o que faz a tabela mostrar quase o mesmo que a caixa antiga.
 */
export default function LinhaDeAtendimento({
  atendimento,
  subgrupoNome,
  onAbrir,
}: LinhaDeAtendimentoProps) {
  const ultimo = atendimento.ultimo_registro;

  /* Id que não resolve cai no próprio id -- some da tela seria pior: a
     linha não diria a quem o atendimento pertence. */
  const clientes = (
    atendimento.cliente_nomes?.length ? atendimento.cliente_nomes : atendimento.cliente_ids
  ).join(", ");

  return (
    <Table.Row
      /* A linha inteira é clicável, então precisa ser alcançável pelo
         teclado: `tabIndex` + Enter/Espaço, como em `LinhaProcesso`. Sem
         isso, quem navega por Tab não abre atendimento nenhum -- e não há
         outro caminho, porque não existe ação na linha. */
      tabIndex={0}
      cursor="pointer"
      _hover={{ bg: "bg.canvas" }}
      /* Última linha sem divisória: a borda do cartão já fecha a tabela. */
      _last={{ "& td": { borderBottomWidth: 0 } }}
      _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      aria-label={atendimento.assunto}
      onClick={() => onAbrir(atendimento)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onAbrir(atendimento);
        }
      }}
    >
      <Table.Cell p="13px 14px" borderBottomColor="border.subtle">
        <Text fontWeight="700" truncate>
          {atendimento.assunto}
        </Text>
      </Table.Cell>

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle" color="fg.muted">
        <Text truncate>{clientes}</Text>
      </Table.Cell>

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle">
        <Flex align="center" wrap="wrap" gap="6px">
          <Etiqueta cores={coresDoStatus(atendimento.status)}>{atendimento.status}</Etiqueta>
          <EtiquetasDeSubgrupo nomes={[subgrupoNome(atendimento.subgrupo_id)]} />
        </Flex>
      </Table.Cell>

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle" color="fg.muted">
        {/* A coluna mais larga da tabela, e de propósito: é a única que
            responde "preciso abrir este?" sem abrir. */}
        <Text truncate>{ultimo?.texto ?? ""}</Text>
      </Table.Cell>

      <Table.Cell p="13px 14px" borderBottomColor="border.subtle" textAlign="right">
        {ultimo && (
          <Flex align="center" justify="flex-end" gap="8px">
            {/* 🔴 O nome vem NO registro (`autor_nome`), resolvido pelo
                servidor. Esta linha recebia um tradutor, e quem o montava
                baixava TODAS as pessoas do grupo -- numa consulta que só
                rodava pra `manager` pra cima, então o avatar de quem é
                `user` mostrava iniciais de e-mail.

                `?? autor_id` cobre quem não tem apelido e quem é de outro
                grupo. */}
            <Avatar nome={ultimo.autor_nome ?? ultimo.autor_id} tamanho="pequeno" />
            <Text color="fg.subtle" whiteSpace="nowrap">
              {formatarDataDeInstante(ultimo.registrado_em)}
            </Text>
          </Flex>
        )}
      </Table.Cell>
    </Table.Row>
  );
}
