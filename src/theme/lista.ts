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

/** O prazo, em destaque no rodapé do item. Azul da marca, escuro o bastante
 * para texto pequeno -- `brand.darker` sobre `bg.brand.subtle`. */
export const CORES_DO_PRAZO = { bg: "bg.brand.subtle", color: "brand.darker" } as const;
