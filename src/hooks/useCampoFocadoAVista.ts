/** Leva o campo em foco de volta à vista quando o teclado entra.
 *
 * 🔴 **Encolher a caixa não move o que está dentro dela.** `useAreaVisivel`
 * diz quanto da tela sobrou, e quem a usa encolhe a sua caixa para caber --
 * só que um campo no fim de um formulário longo continua abaixo do corte, e
 * quem está digitando não vê o que digita.
 *
 * 🔴 **O navegador não resolve sozinho nestes dois casos.** Em página comum
 * ele leva o campo à vista ao receber o foco; aqui o foco veio ANTES, e o
 * que mudou depois foi a altura da área visível. O `Modal` ainda tem rolagem
 * própria (`position: fixed`), e o `CartaoDeAutenticacao` é uma coluna presa
 * à faixa visível -- em nenhum dos dois a rolagem do documento alcança.
 *
 * ⚠️ `block: "nearest"` e não `"center"`: move o mínimo para o campo
 * aparecer. Centralizar daria um salto a cada toque em campo, mesmo nos que
 * já estavam à vista.
 *
 * ⚠️ O `escopo` existe por causa dos modais empilhados: com dois abertos, o
 * de baixo não pode mover o foco do de cima. Quem não empilha o omite.
 */
import { useEffect } from "react";

export function useCampoFocadoAVista(alturaVisivel: number | null, escopo?: string): void {
  useEffect(() => {
    /* Sem altura é teclado fechado: não há correção a fazer. */
    if (!alturaVisivel) return;
    const focado = document.activeElement;
    if (!(focado instanceof HTMLElement)) return;
    if (escopo && !focado.closest(escopo)) return;
    focado.scrollIntoView?.({ block: "nearest" });
  }, [alturaVisivel, escopo]);
}
