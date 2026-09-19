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
  /** Há uma GAVETA por cima da tela agora.
   *
   * 🔴 É isto, e não `menuAberto`, que decide entre `≡` e `✕`. O `✕` promete
   * "fecha o que está por cima"; com o menu FIXO aberto não há nada por
   * cima, e o botão passava a parecer o fechar da página inteira -- visto
   * na captura do desktop. */
  sobreposto: boolean;
}
