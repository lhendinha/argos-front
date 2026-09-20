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
  /** À direita: uma `Etiqueta`, uma data, um contador -- ou um CONTROLE.
   *
   * ⚠️ Ele fica acima da camada que abre o registro, então botão aqui
   * funciona. É onde mora uma ação de TEXTO: em `acoes`, ao lado do
   * conteúdo, "Voltar a cobrar" comia 140px de uma faixa de 322 e o
   * identificador quebrava em cinco linhas. `acoes` é para o que tem
   * tamanho de ícone. */
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
  /** O item pede atenção -- hoje só o envio NÃO LIDO do histórico.
   *
   * 🔴 É estado, não conteúdo: um booleano que escolhe entre dois fundos do
   * tema, e não uma cor que quem chama inventa. Sem ele, o não lido chegaria
   * ao celular com o ponto e mais nada, e a tela inteira de marcar como lido
   * perderia seu sinal mais visível.
   *
   * ⚠️ O peso do identificador NÃO muda com ele. A lista antiga escrevia o
   * lido em 400 e o não lido em 600, e as duas metades pareciam listas
   * diferentes; o fundo e o ponto dizem a mesma coisa sem isso. */
  destacado?: boolean;
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
  /** `id` do elemento que desenha o identificador, para um controle de
   * `acoes` poder apontar para ele com `aria-labelledby`.
   *
   * 🔴 Existe porque o interruptor da inscrição da OAB precisa se chamar
   * "263/MG Ligada", e o número que o nomeia é o identificador do item. Sem
   * isto, a alternativa era o controle desenhar o número DE NOVO, escondido
   * -- e aí o mesmo texto aparece duas vezes na árvore. */
  idDoIdentificador?: string;
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
