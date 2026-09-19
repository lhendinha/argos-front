export interface MarcaArgosProps {
  /** `barra` é a da barra do topo (26px, deitada); `gate` é a das telas de
   * entrada (42px, empilhada e centralizada), onde a marca é a primeira
   * coisa que a pessoa vê.
   *
   * ⚠️ Chamava-se `menu` enquanto a marca morava no topo do menu lateral. O
   * nome passou a mentir quando ela mudou para a barra do topo, que é onde
   * ela fica igual em toda largura. */
  tamanho?: "barra" | "gate";
}
