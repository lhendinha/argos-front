import type { ReactNode } from "react";

/** Uma coluna que precisa dizer mais que o nome.
 *
 * 🔴 Existe por causa da coluna de DINHEIRO: os valores são alinhados à
 * direita (é o que deixa duas quantias comparáveis numa coluna), e o
 * cabeçalho ficava à esquerda, pendurado longe do número que nomeia. No
 * artefato os dois são `.direita` -- a célula E o `th`. */
export interface ColunaDaTabela {
  rotulo: string;
  aDireita?: boolean;
}

export interface TabelaProps {
  /** Uma string por coluna, na ordem -- ou um `ColunaDaTabela` quando a
   * coluna precisa de alinhamento próprio. Vazia (`""`) pra coluna de ações,
   * que no artifact é `<th></th>`: o cabeçalho existe pra a contagem de
   * colunas bater, mas não tem nome. */
  colunas: readonly (string | ColunaDaTabela)[];
  /** Renderizado NO LUGAR da tabela quando não há linha nenhuma -- um
   * `EstadoVazio`. Sem cabeçalho de colunas vazias em cima, que é o que
   * sobraria de uma tabela sem corpo. */
  vazio?: ReactNode;
  /** A tabela é mais larga que o espaço DE PROPÓSITO, e rola de lado com
   * os avisos do `RolagemHorizontal` no lugar da `Table.ScrollArea` crua.
   *
   * 🔴 **É opt-in porque é ele que dispensa a régua do mobile.** Ela cobra
   * toda tabela que passe da própria área visível, e `RolagemHorizontal`
   * marca `data-larga` -- se toda tabela do sistema passasse por ele, o
   * guarda perderia o dente. Quem usa isto está dizendo "eu sei que rola, e
   * paguei o preço de avisar".
   *
   * ⚠️ Hoje só o documento da fatura. Medido em 360px com descrição longa:
   * 327px em 318, e cada pixel tem dono -- 108 do cabeçalho "Lançamento",
   * que é `nowrap`, 105 da data e 114 do valor, dos quais 84 são o recuo de
   * 14px que a guarda `celulaDeTabela.test.ts` cobra. Em 390px ela cabe. */
  rolagem?: { rotulo: string; dica?: string };
  /** As `Table.Row` do corpo. */
  children: ReactNode;
}
