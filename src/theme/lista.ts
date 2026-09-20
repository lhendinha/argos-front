/** As cores das pílulas que os itens de lista usam.
 *
 * 🔴 **Aqui, e não dentro de cada `Item*`.** Elas nasceram literais no meio
 * da marcação -- `bg="border.subtle" color="fg.muted"` copiado em Processos e
 * em Documentos, `bg="bg.brand.subtle"` só em Processos --, que é
 * exatamente onde a segunda cópia nasce. Mesma régua de
 * `CORES_DO_CLIENTE_ARQUIVADO` e das cores do lançamento.
 */

/** A pílula neutra que carrega um NOME: o cliente do processo, o tipo do
 * documento. Caixa normal, por isso `variante="nome"` na `Etiqueta`. */
export const CORES_DA_ETIQUETA_DE_NOME = { bg: "border.subtle", color: "fg.muted" } as const;

/** A etiqueta de subgrupo (`.etq-neutra` do artifact).
 *
 * ⚠️ É a `CORES_DA_ETIQUETA_DE_NOME` acima MAIS uma borda, e a diferença não
 * é enfeite: o artifact declara `.etq { border: 1px solid transparent }` e só
 * as variantes que precisam a pintam. Ficam juntas aqui justamente para a
 * proximidade denunciar se uma das duas andar sozinha.
 *
 * 🔴 Saiu de dentro de `EtiquetasDeSubgrupo`, onde era uma constante de
 * módulo -- e o comentário dela já dizia o motivo de não ser literal no JSX:
 * *cor é contrato, e um literal solto no meio da linha é onde a segunda cópia
 * nasce*. Dentro do componente ela era um contrato de um lado só. */
export const CORES_DA_ETIQUETA_DE_SUBGRUPO = {
  bg: "border.subtle",
  color: "fg.muted",
  borderColor: "border",
} as const;

/** O prazo, em destaque no rodapé do item. Azul da marca, escuro o bastante
 * para texto pequeno -- `brand.darker` sobre `bg.brand.subtle`. */
export const CORES_DO_PRAZO = { bg: "bg.brand.subtle", color: "brand.darker" } as const;
