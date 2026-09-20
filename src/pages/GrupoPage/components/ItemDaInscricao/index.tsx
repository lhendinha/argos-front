import { Flex } from "@chakra-ui/react";

import { BotaoQuadrado, EtiquetasDeSubgrupo, IconeLixeira, ItemDeLista } from "../../../../components";
import InterruptorDaInscricao from "../InterruptorDaInscricao";
import type { ItemDaInscricaoProps } from "./types";

/** A inscrição da OAB onde não cabem as quatro colunas.
 *
 * 🔴 **O interruptor vai em `acoes`, junto da lixeira.** É o único lugar do
 * item que fica ACIMA da camada que abre o registro -- e interruptor dentro
 * dela seria alternado pelo toque que deveria abrir a edição. Não é o lugar
 * mais bonito; é o único que não mente sobre o que o dedo faz.
 *
 * ⚠️ Medido em 390px: interruptor, palavra e lixeira somam ~156px, e sobram
 * ~166px para a inscrição, que pede ~100. Cabe sem espremer.
 *
 * ⚠️ O interruptor é o MESMO componente da linha de tabela -- eu o tinha
 * copiado inteiro para cá, com os três comentários de defeitos já pagos
 * junto. Ver `InterruptorDaInscricao`.
 */
export default function ItemDaInscricao({
  inscricao,
  subgrupos,
  emAndamento,
  onAbrir,
  onDesligar,
  onRemover,
}: ItemDaInscricaoProps) {
  const ligada = inscricao.importacao_automatica;
  const idDoRotulo = `inscricao-${inscricao.inscricao}`;
  /* ⚠️ NOME, e não id: o servidor guarda `subgrupo_id`, e a etiqueta com o id
     cru não diz nada a ninguém. Um destino que não casa com subgrupo nenhum
     cai no id -- é o que sobra quando o subgrupo foi apagado. */
  const nomes = inscricao.subgrupos_destino.map(
    (id) => subgrupos.find((s) => s.subgrupo_id === id)?.nome ?? id,
  );

  return (
    <ItemDeLista
      onAbrir={onAbrir}
      rotulo={`Editar ${inscricao.inscricao}`}
      identificador={inscricao.inscricao}
      identificadorMono
      idDoIdentificador={idDoRotulo}
      etiquetas={<EtiquetasDeSubgrupo nomes={nomes} />}
      acoes={
        <Flex align="center" gap="10px">
          <InterruptorDaInscricao
            inscricao={inscricao.inscricao}
            idDoRotulo={idDoRotulo}
            ligada={ligada}
            desabilitado={emAndamento}
            onLigar={onAbrir}
            onDesligar={onDesligar}
          />

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
        </Flex>
      }
    />
  );
}
