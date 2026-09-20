import { Table } from "@chakra-ui/react";

import { BotaoNu, BotaoQuadrado, EtiquetasDeSubgrupo, IconeLixeira } from "../../../../components";
import InterruptorDaInscricao from "../InterruptorDaInscricao";
import type { LinhaDaInscricaoProps } from "./types";

/** Uma inscrição avulsa na tabela: interruptor, destinos e remover.
 *
 * 🔴 **A linha é de LEITURA, menos por três gestos** -- desligar, remover e
 * abrir. Quem EDITA é o modal, e a razão é o servidor: ele zera
 * `subgrupos_destino` ao desligar e recusa ligar sem destino, então "ligar"
 * nunca é um gesto de um clique só. Um interruptor que às vezes liga e às
 * vezes precisa de mais informação é pior que um que sempre abre onde a
 * informação se dá.
 *
 * ➡️ Por isso LIGAR abre o modal e DESLIGAR grava direto: desligar não precisa
 * de nada, e obrigar a abrir um modal para dizer "pare" seria atrito puro.
 */
export default function LinhaDaInscricao({
  inscricao,
  subgrupos,
  emAndamento,
  onAbrir,
  onDesligar,
  onRemover,
}: LinhaDaInscricaoProps) {
  const ligada = inscricao.importacao_automatica;
  const idDoRotulo = `inscricao-${inscricao.inscricao}`;

  /* ⚠️ NOME, e não id: o servidor guarda `subgrupo_id`, e a etiqueta com o id
     cru não diz nada a ninguém. Um destino que não casa com subgrupo nenhum
     cai no id -- é o que sobra quando o subgrupo foi apagado, e mostrar algo
     é melhor que a etiqueta sumir sem explicação. */
  const nomes = inscricao.subgrupos_destino.map(
    (id) => subgrupos.find((s) => s.subgrupo_id === id)?.nome ?? id,
  );

  return (
    <Table.Row>
      <Table.Cell
        p="13px 14px"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
        width="150px"
      >
        {/* Mono e 600, como o artifact: é número que se compara de cima a
            baixo, e a fonte proporcional faz os dígitos dançarem de linha em
            linha. */}
        <BotaoNu
          id={idDoRotulo}
          type="button"
          title="Editar inscrição"
          fontFamily="mono"
          fontSize="13px"
          fontWeight="600"
          color="fg"
          _hover={{ color: "brand" }}
          disabled={emAndamento}
          onClick={onAbrir}
        >
          {inscricao.inscricao}
        </BotaoNu>
      </Table.Cell>

      <Table.Cell
        p="13px 14px"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
        width="180px"
      >
        <InterruptorDaInscricao
          inscricao={inscricao.inscricao}
          idDoRotulo={idDoRotulo}
          ligada={ligada}
          desabilitado={emAndamento}
          onLigar={onAbrir}
          onDesligar={onDesligar}
        />
      </Table.Cell>

      <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <EtiquetasDeSubgrupo nomes={nomes} />
      </Table.Cell>

      <Table.Cell
        p="13px 14px"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
        width="56px"
      >
        {/* 🔴 A LIXEIRA de Subgrupos, e não o × do artifact. O artifact desenha
            um × redondo, mas o sistema já tem um gesto de "tirar da lista", com
            uma forma e uma cor -- e Subgrupos, Clientes e Membros usam ele. Um
            segundo desenho para a mesma ação faria a pessoa aprender duas
            vezes; o artifact é o desenho da tela, não o do sistema. */}
        <BotaoQuadrado
          type="button"
          tom="perigo"
          title="Remover inscrição"
          aria-label={`Remover ${inscricao.inscricao}`}
          disabled={emAndamento}
          onClick={onRemover}
        >
          <IconeLixeira />
        </BotaoQuadrado>
      </Table.Cell>
    </Table.Row>
  );
}
