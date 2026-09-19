export interface TopbarProps {
  onSair: () => void;
  /** Abre a gaveta no celular, recolhe o menu no desktop -- o mesmo botão,
   * no mesmo lugar. Só o efeito muda com o espaço disponível. */
  onAlternarMenu: () => void;
  /** Para o `aria-expanded` do botão: quem navega por leitor de tela precisa
   * saber se o menu já está aberto antes de acioná-lo. */
  menuAberto: boolean;
  /** O rótulo muda com o estado e com o espaço: "Abrir menu" não descreve o
   * que o botão faz quando o menu está fixo e aberto na tela. */
  rotuloDoBotao: string;
}
