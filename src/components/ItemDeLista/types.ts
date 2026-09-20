import type { ReactNode } from "react";

export interface ItemDeListaProps {
  onAbrir: () => void;
  /** O que o leitor de tela anuncia no lugar do conteúdo inteiro -- sem
   * isso ele lê as quatro linhas do item seguidas, sem pausa. */
  rotulo: string;
  /** Ações que vivem FORA do botão, como irmãs dele.
   *
   * 🔴 Não podem ir dentro: `<button>` dentro de `<button>` é HTML
   * inválido, o navegador fecha o de fora sozinho e o clique na ação
   * abriria o item. A lista de clientes tem "Reativar" na linha, e foi ela
   * que trouxe esta prop. */
  acoes?: ReactNode;
  children: ReactNode;
}
