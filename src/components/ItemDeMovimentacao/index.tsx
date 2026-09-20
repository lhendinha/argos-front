import { Box } from "@chakra-ui/react";

import ItemDeLista from "../ItemDeLista";
import Ponto from "../Ponto";
import type { ItemDeMovimentacaoProps } from "./types";

/** Uma movimentação numa lista.
 *
 * 🔴 **Passou a ser `ItemDeLista` como as outras listas do sistema.** Ela
 * tinha ficado para trás quando as quinze listas viraram o contrato: seguia
 * desenhando bolinha, título em 13.5/700 e uma SETA à direita -- a mesma
 * seta que o Histórico perdeu, e pela mesma razão. No toque não há hover
 * nem cursor para explicar o que a seta promete, e a linha inteira já é o
 * alvo. Ver o quadro "Histórico -- ganha etiquetas, perde a seta".
 *
 * 🔴 **O texto do tribunal NÃO vem aqui.** Cada item despejava a publicação
 * inteira num bloco rolável de 200px, e uma página de cinco itens virava
 * cinco áreas de rolagem empilhadas dentro da rolagem da página -- ninguém
 * percorre a lista assim, e o texto que importa é sempre o de UM item. O
 * teor vive no modal, que é onde há espaço. Ver `ModalDeMovimentacao`.
 *
 * ⚠️ **O não lido se mostra por PONTO e fundo, como no Histórico**, e quem
 * decide é quem chama: `Comunicacao.lido` é esparso, e distinguir os três
 * casos é o que separa "avisada e não lida" de "avisada e lida" de "nunca
 * avisada".
 *
 * ⚠️ **A divisória e o último item são do contrato**, e por isso `ultimo`
 * deixou de existir: o `ItemDeLista` já não desenha risca no último filho do
 * container. Quem lista precisa é envolver os itens numa caixa própria, para
 * que a barra de paginação não conte como "o último".
 */
export default function ItemDeMovimentacao({ titulo, meta, aviso, onAbrir }: ItemDeMovimentacaoProps) {
  const naoLida = aviso === "naoLido";

  return (
    <ItemDeLista
      onAbrir={onAbrir}
      /* O leitor de tela ouve o estado junto do nome -- senão ele é uma cor,
         e quem não enxerga não recebe nada. */
      rotulo={`${titulo}${naoLida ? ", não lida" : ""}. ${meta}`}
      identificador={titulo}
      destacado={naoLida}
      /* 🔴 **O ponto é quem carrega o estado; o fundo sozinho não carrega.**
         Medido: `brand.faint` contra o branco dá 1,04:1 -- MENOS contraste
         que a própria divisória da linha, que dá 1,14. No Histórico o par
         sempre andou junto, e eu tinha trazido só metade dele para cá.

         ⚠️ **Três estados, e o terceiro é um lugar vazio.** Sem aviso não há
         ponto nenhum: um vazado ali diria "lida", que é falso -- ninguém
         nunca avisou. O compartimento continua ocupando o lugar para a
         coluna de pontos não serrilhar quando 7 de 10 linhas não têm aviso. */
      selecao={
        aviso ? (
          <Ponto tom="marca" vazado={aviso === "lido"} noTopo />
        ) : (
          <Box aria-hidden="true" />
        )
      }
      rodape={{ texto: meta }}
    />
  );
}
