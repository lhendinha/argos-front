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
    /* 🔴 **Só rola se o campo estiver FORA da faixa.** O efeito corre a cada
       altura nova, e o teclado não entrega uma altura: entrega várias
       enquanto anima. Medido num iPhone 17 Pro Max, contra o build de
       produção: o iOS relatou 393 e depois 416, então `scrollIntoView` foi
       chamado DUAS vezes -- a segunda com o campo já à vista. Num aparelho
       de verdade a animação passa por mais alturas que a do simulador, e
       cada uma era mais uma chamada; quem digita vê a página deslizar de
       novo a cada uma.

       ⚠️ Comparar com `alturaVisivel`, e não confiar no `"nearest"` para não
       fazer nada: ele decide pelo que já está à vista SEGUNDO O LAYOUT, e o
       teclado não encolhe o layout no Android -- lá a faixa visível é a
       única que sabe onde o teclado está.

       ⚠️ A guarda é idempotente de propósito: rolar duas vezes para o mesmo
       lugar não é meio defeito, é o defeito. */
    const caixa = focado.getBoundingClientRect();
    if (caixa.top >= 0 && caixa.bottom <= alturaVisivel) return;
    focado.scrollIntoView?.({ block: "nearest" });
  }, [alturaVisivel, escopo]);
}
