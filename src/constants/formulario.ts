/** Quanto ocupa um controle de conteúdo CURTO -- a UF, de duas letras --
 * enquanto a linha de campos ainda está lado a lado.
 *
 * 🔴 **Aqui, e não dentro de `Campo`.** A medida é compartilhada com
 * `LinhaDeCampos`: os 120px só fazem sentido enquanto a linha tem duas
 * colunas, e quem decide isso é a grade, não o campo. Guardada dentro do
 * componente, ela seria um detalhe privado de um dos dois lados de um acordo
 * que tem dois lados -- e foi assim que o `120px` já tinha virado quatro
 * cópias espalhadas pelos formulários.
 *
 * ⚠️ O ponto de virada NÃO mora aqui: é o token `sm` do Chakra, o MESMO em
 * que `LinhaDeCampos` empilha. Li o CSS que sai no navegador para conferir,
 * e as duas regras são a mesma linha: `@media screen and (min-width: 30rem)`.
 * Repetir a medida como número neste arquivo criaria a segunda cópia logo
 * depois de apagar as quatro primeiras.
 */
export const LARGURA_DE_CAMPO_CURTO = "120px";
