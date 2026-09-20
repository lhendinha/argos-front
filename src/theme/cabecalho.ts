import type { SystemStyleObject } from "@chakra-ui/react";

import { CONTAINER_DE_CELULAR } from "../constants";

/** As ações do cabeçalho de uma tela -- o "+ Novo alguma coisa" e seus
 * irmãos.
 *
 * 🔴 **No celular elas ocupam a linha inteira, e dividem entre si.** Duas
 * ações viram metade e metade; uma vira a linha toda. O alvo do polegar é a
 * largura da tela, e não a largura do texto do botão -- e o que estava lá
 * antes era pior do que pequeno: no detalhe do lançamento os três botões
 * desciam um por linha, encostados à direita, e o "Salvar" ficava sozinho
 * numa terceira fileira.
 *
 * ⚠️ **Só abaixo de `CONTAINER_DE_CELULAR`.** Num iPad mini, e em qualquer
 * desktop, botão esticado de ponta a ponta é estranho -- lá eles seguem do
 * tamanho do texto, e a tela não muda um pixel.
 *
 * ⚠️ **`flex: 1 1 auto`, e não `1 1 0`:** com base zero, "Excluir" e "Marcar
 * como recebido" ficariam do MESMO tamanho, e o segundo quebraria em duas
 * linhas para caber na metade. Com base automática cada um parte do seu
 * texto e cresce a partir dali.
 */
export const ACOES_DO_CABECALHO: SystemStyleObject = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  maxWidth: "100%",
  [`@container ${CONTAINER_DE_CELULAR}`]: {
    width: "100%",
    "& > *": { flex: "1 1 auto" },
  },
};

/** A fileira de busca e filtros de uma lista.
 *
 * 🔴 **No celular a busca ocupa a linha e os filtros descem.** Elas
 * disputavam a mesma fileira, e o campo de texto -- que é onde se digita --
 * ficava com o que sobrasse das pílulas. Filtro se escolhe de vez em quando;
 * busca se usa toda hora, e é ela que precisa da largura.
 *
 * ⚠️ **O campo de busca tem de ser o PRIMEIRO filho.** A regra é de
 * posição, não de classe, porque a fileira é montada com componentes
 * diferentes em cada tela. Foi por isso que a busca de Processos mudou de
 * lugar: ela era a última, depois dos filtros de data, e as outras três
 * telas já a traziam na frente.
 *
 * ⚠️ **Posição no DOM, e nunca `order` do CSS.** A ordem visual e a de
 * leitura têm de ser a mesma -- é o que se mediu quando as telas passaram a
 * empilhar, e nenhuma delas usa `order` justamente por isso.
 */
export const LINHA_DE_FILTROS: SystemStyleObject = {
  [`@container ${CONTAINER_DE_CELULAR}`]: {
    "& > *:first-of-type": { flexBasis: "100%", maxWidth: "100%" },
  },
};
