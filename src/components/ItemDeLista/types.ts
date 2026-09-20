import type { ReactNode } from "react";

/** O número que o item carrega à direita do identificador. */
export interface ValorDoItem {
  texto: string;
  /** Token de cor do tema. Sem ele, a cor do texto comum. */
  cor?: string;
  /** Segunda linha, menor, embaixo do valor -- o total quando o item
   * mostra só um pedaço dele. */
  sub?: string;
}

/** A última linha do item: o que sobrou de metadado, e um destaque. */
export interface RodapeDoItem {
  /** À esquerda. Corta com reticências quando não cabe. */
  texto?: string;
  /** O texto é um número (documento, processo) e vai em monoespaçada. */
  mono?: boolean;
  /** À direita: uma `Etiqueta`, uma data, um contador. */
  destaque?: ReactNode;
}

export interface ItemDeListaProps {
  onAbrir: () => void;
  /** O que o leitor de tela anuncia no lugar do conteúdo inteiro -- sem
   * isso ele lê as quatro linhas do item seguidas, sem pausa. */
  rotulo: string;
  /** A caixa de seleção, ANTES de tudo.
   *
   * 🔴 **Compartimento próprio, e não `acoes`.** Medido nas duas formas: em
   * `acoes` a caixa fica depois do que ela governa -- lê-se o item inteiro
   * para então achar como marcá-lo -- e, porque `acoes` centraliza na
   * vertical, a coluna de caixas desalinha assim que dois itens têm alturas
   * diferentes. Na frente ela alinha pelo topo, o polegar desce por uma
   * coluna só, e é a mesma posição da coluna vazia que a tabela já usa.
   *
   * ⚠️ Fora do botão, como `acoes`: `<button>` dentro de `<button>` é
   * inválido. */
  selecao?: ReactNode;
  /** O nome da coisa. Obrigatório, e nunca a data.
   *
   * 🔴 É `string`, e não `ReactNode`, e essa é a diferença entre um
   * contrato e uma caixa: enquanto qualquer marcação passava por aqui, cada
   * lista escolheu seu tamanho e seu peso -- 14/700 numas, 13.5/800 noutras
   * -- e a mesma lista ficou com três aparências. */
  identificador: string;
  /** O identificador é um número (de processo, de fatura) e vai em
   * monoespaçada. */
  identificadorMono?: boolean;
  /** A segunda linha: o que identifica em segundo lugar. */
  apoio?: string;
  apoioMono?: boolean;
  valor?: ValorDoItem;
  /** A fileira de pílulas. Só `Etiqueta` e suas irmãs entram aqui -- texto
   * solto no meio delas foi como o vencimento do lançamento acabou sem
   * parecer data nem etiqueta. */
  etiquetas?: ReactNode;
  rodape?: RodapeDoItem;
  /** Ações que vivem FORA do botão, como irmãs dele.
   *
   * 🔴 Não podem ir dentro: `<button>` dentro de `<button>` é HTML
   * inválido, o navegador fecha o de fora sozinho e o clique na ação
   * abriria o item. A lista de clientes tem "Reativar" na linha, e foi ela
   * que trouxe esta prop. */
  acoes?: ReactNode;
}
