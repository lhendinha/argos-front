/** As três barras do botão que abre o menu.
 *
 * 18px como `IconeSino`, que é o vizinho dele na barra do topo: os dois
 * ficam dentro de `BotaoDeIcone`, e um tamanho próprio faria um parecer
 * maior que o outro no mesmo alinhamento.
 */
export default function IconeMenu() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
