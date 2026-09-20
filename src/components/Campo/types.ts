import type { ReactNode } from "react";

export interface CampoProps {
  rotulo: string;
  /** `id` do controle que o rótulo nomeia. Obrigatório: rótulo sem `for`
   * não é lido junto do campo, e clicar nele não foca nada.
   *
   * Controle que não aceita `id` num elemento focável (o `SeletorData`, por
   * exemplo, precisa deixar o `id` gerado pela lib intacto no gatilho) se
   * liga pelo caminho inverso: este rótulo também publica um
   * `id="{para}-rotulo"` pra ser apontado por `aria-labelledby`. */
  para: string;
  obrigatorio?: boolean;
  /** Texto de apoio embaixo (`.field-hint`). */
  dica?: ReactNode;
  /** Mensagem de erro. Substitui a dica enquanto existir -- as duas juntas
   * competiriam pela mesma linha, e o erro é o que importa naquele
   * momento. */
  erro?: string;
  /** Conteúdo ao LADO do rótulo -- hoje só o "i" de `DicaDeCampo`.
   *
   * 🔴 Fora do `<label>`, e não dentro. Clicar num `<label htmlFor>` foca o
   * controle que ele nomeia; um botão ali dentro herdaria esse gesto, e o
   * balão abriria e fecharia no mesmo clique. Como irmão, o "i" é só um
   * botão. */
  aposORotulo?: ReactNode;
  /** O controle tem conteúdo CURTO (a UF, de duas letras) e não merece a
   * largura inteira da linha -- enquanto houver linha.
   *
   * 🔴 Aqui, e não uma `largura` fixa no controle. O `Select` da UF nasceu
   * com `largura="120px"` em QUATRO formulários, e nos três em que ele divide
   * uma `LinhaDeCampos` o celular empilha a linha: o número fica com a faixa
   * inteira e a UF, logo abaixo, com 120px de um lado e um vazio do outro.
   * Quem apontou foi o usuário, olhando as telas de cliente e de inscrição.
   *
   * ⚠️ É teto, não largura: abaixo de `sm` o controle ocupa a faixa toda,
   * como os campos vizinhos. */
  curto?: boolean;
  children: ReactNode;
}
