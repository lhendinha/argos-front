import type { ButtonProps } from "@chakra-ui/react";
import type { ReactNode } from "react";

export interface EtiquetaProps {
  /** Fundo e texto -- vêm de fora porque o significado da cor é de quem
   * usa: papel, status de envio, o que for.
   *
   * ⚠️ `borderColor` é OPCIONAL e sem ela não há borda nenhuma: o artifact
   * declara `.etq { border: 1px solid transparent }` e só as variantes que
   * precisam a pintam (`.etq-neutra`, `.etq-info`). Torná-la obrigatória
   * mudaria a altura de todas as pílulas que já existem em 2px. */
  cores: Pick<ButtonProps, "bg" | "color" | "borderColor">;
  /** O que a pílula carrega, e portanto como ela se escreve.
   *
   * 🔴 **`nome` existe porque a segunda forma já estava escrita à mão, duas
   * vezes.** `ItemDeProcesso` e `ItemDeDocumento` desenhavam a mesma pílula
   * de 12px/700 em caixa normal -- para o nome do cliente e para o tipo do
   * documento --, copiada linha por linha. Ela não é a `estado`: caixa alta
   * em nome próprio grita, e "SONIA MARIA ALVES" ao lado de "CÍVEL" faz as
   * duas parecerem a mesma categoria de coisa.
   *
   * ⚠️ Uma pílula só, com duas formas -- e não duas pílulas. Era o caminho
   * para a terceira cópia. */
  variante?: "estado" | "nome";
  children: ReactNode;
}
