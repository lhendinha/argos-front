import ItemDeLista from "../ItemDeLista";
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
 * ⚠️ **O destaque de não lida é o mesmo `destacado` do Histórico**, e quem
 * decide é quem chama: `Comunicacao.lido` é esparso, e comparar com `false`
 * é o que separa "avisada e não lida" de "nunca avisada".
 *
 * ⚠️ **A divisória e o último item são do contrato**, e por isso `ultimo`
 * deixou de existir: o `ItemDeLista` já não desenha risca no último filho do
 * container. Quem lista precisa é envolver os itens numa caixa própria, para
 * que a barra de paginação não conte como "o último".
 */
export default function ItemDeMovimentacao({ titulo, meta, naoLido, onAbrir }: ItemDeMovimentacaoProps) {
  return (
    <ItemDeLista
      onAbrir={onAbrir}
      /* O leitor de tela ouve o estado junto do nome, como no Histórico --
         senão o destaque é uma cor que só quem enxerga percebe. */
      rotulo={`${titulo}${naoLido ? ", não lida" : ""}. ${meta}`}
      identificador={titulo}
      destacado={naoLido}
      rodape={{ texto: meta }}
    />
  );
}
