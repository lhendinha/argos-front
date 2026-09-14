import type { SystemStyleObject } from "@chakra-ui/react";

/** O painel de um menu suspenso (`.period-panel` do artifact). */
/** ⚠️ `SystemStyleObject`, e não props soltas: estes objetos vão pro `css`
 * dos componentes do Chakra. Espalhados como props, o `onSelect` que vem na
 * tipagem de `BoxProps` (um handler de evento) colidia com o `onSelect` do
 * `Menu.Item` (um `VoidFunction`) e o TypeScript recusava.
 */
export const PAINEL_DE_MENU: SystemStyleObject = {
  minWidth: "216px",
  padding: "6px",
  bg: "bg.surface",
  borderWidth: "1px",
  borderStyle: "solid",
  borderColor: "border",
  borderRadius: "md",
  boxShadow: "md",
  /** ⚠️ O painel recebe foco ao abrir, e o `:focus-visible` global do
   * tema desenha um anel de 2px da marca por cima da borda de 1px
   * -- uma moldura azul grossa que o artifact não tem. Tirar daqui não custa
   * acessibilidade: quem navega por teclado vê o item REALÇADO, que é onde o
   * foco de fato está. */
  _focusVisible: { outline: "none" },
};

/** Uma opção dentro dele (`.period-opt`).
 *
 * A escolhida fica com o fundo da marca, e não só com um tique ou negrito:
 * num menu de três itens que abre já filtrado, o realce é o que responde
 * "o que estou vendo agora?" antes de a pessoa ler as opções.
 */
export const OPCAO_DE_MENU: SystemStyleObject = {
  display: "block",
  width: "100%",
  textAlign: "left",
  padding: "8px 12px",
  borderRadius: "sm",
  fontSize: "13px",
  fontWeight: "600",
  color: "fg",
  cursor: "pointer",
  _hover: { bg: "bg.canvas" },
};

/** A opção que mostra quantos itens ela traz: o rótulo à esquerda, o número à direita (`.menu .n` do artefato do lido). */
export const OPCAO_COM_CONTAGEM: SystemStyleObject = {
  display: "flex",
  justifyContent: "space-between",
  gap: "16px",
};

/** O número da opção, em mono tabular: as contagens de um menu se alinham pela direita. */
export const CONTAGEM_NA_OPCAO: SystemStyleObject = {
  fontFamily: "mono",
  fontWeight: "500",
  color: "fg.subtle",
  fontVariantNumeric: "tabular-nums",
};

export const OPCAO_DE_MENU_ATIVA: SystemStyleObject = {
  bg: "bg.brand.subtle",
  color: "brand.darker",
  fontWeight: "800",
  _hover: { bg: "bg.brand.subtle" },
};
