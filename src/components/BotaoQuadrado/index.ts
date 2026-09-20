import { chakra } from "@chakra-ui/react";

/** Botão quadrado só com ícone (`.btn-sq` do artifact).
 *
 * `tamanho="compacto"` é a versão de 26px que o artifact usa dentro do
 * calendário; o padrão de 34px é o das barras de ação.
 *
 * ⚠️ `borderStyle: solid` explícito: o reset por tag zera a largura da
 * borda, e largura sem estilo computa 0 -- a borda simplesmente não
 * aparece. Mesmo motivo do `Gatilho`.
 */
export const BotaoQuadrado = chakra("button", {
  base: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    borderRadius: "sm",
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "border",
    bg: "bg.surface",
    color: "fg.muted",
    cursor: "pointer",
    _hover: { bg: "border.subtle", color: "fg" },
    /* Usado enquanto a ação da linha está EM VOO. Sem isto, clicar na
       lixeira de uma lista não mudava nada até o servidor responder -- e
       quem não vê retorno clica de novo. O hover some junto: botão travado
       que ainda reage ao mouse continua parecendo clicável. */
    _disabled: {
      opacity: 0.5,
      cursor: "default",
      _hover: { bg: "bg.surface", color: "fg.muted", borderColor: "border" },
    },
  },
  variants: {
    /** `.btn-sq.danger` do artifact: em repouso é igual ao neutro -- é só
     * no hover que ele fica vermelho. Ação destrutiva que já nasce vermelha
     * chama atenção o tempo todo numa lista onde o normal é não excluir. */
    tom: {
      neutro: {},
      perigo: {
        _hover: {
          bg: "status.bad.bg",
          color: "status.bad",
          borderColor: "status.bad",
        },
      },
    },
    tamanho: {
      /* 🔴 **34px no apontador fino, 44 no grosso.** Medido em 375px com
         toque: renomear e remover um subgrupo, e virar o mês na Agenda,
         eram alvos de 34x34 -- o dedo cobre uns 44, e a régua de toque é
         essa. Aqui o botão CRESCE de verdade, e não por uma camada
         invisível como no círculo de concluir: ele é um quadrado com borda,
         então esticar o desenho é o que mantém alvo e desenho no mesmo
         lugar. Duas camadas seriam duas verdades.

         ⚠️ A linha onde ele mora já tem 48px ou mais, então nada cresce por
         causa disto -- conferido nas listas de catálogo e de membros. */
      padrao: {
        width: "34px",
        height: "34px",
        "@media (pointer: coarse)": { width: "44px", height: "44px" },
      },
      /* ⚠️ O compacto NÃO cresce: ele é a seta dentro da célula do
         calendário, e um quadrado de 44px ali empurraria a grade do mês. */
      compacto: { width: "26px", height: "26px" },
    },
  },
  defaultVariants: { tamanho: "padrao", tom: "neutro" },
});
