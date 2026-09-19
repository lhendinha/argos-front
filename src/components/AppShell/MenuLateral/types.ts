export interface MenuLateralProps {
  /** Chamado ao clicar em qualquer lugar da navegação.
   *
   * 🔴 Existe para a gaveta se fechar ao escolher uma tela. Sem isso ela
   * fica aberta por cima da tela recém-aberta, e a pessoa precisa de um
   * segundo gesto para ver o que acabou de pedir. No menu fixo não é
   * passado -- ali nada deve fechar. */
  onNavegar?: () => void;
}
