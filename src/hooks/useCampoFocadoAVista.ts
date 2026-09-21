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

/** Um respiro entre o campo e a borda do teclado -- encostado, ele parece
 * cortado, e o cursor fica rente à linha. */
const FOLGA_ABAIXO_DO_CAMPO = 8;

/** Quanto esperar antes de corrigir -- ver o porquê dentro do efeito. */
const ESPERA_PELO_NAVEGADOR = 250;

export function useCampoFocadoAVista(alturaVisivel: number | null, escopo?: string): void {
  useEffect(() => {
    /* Sem altura é teclado fechado: não há correção a fazer. */
    if (!alturaVisivel) return;
    const focado = document.activeElement;
    if (!(focado instanceof HTMLElement)) return;
    if (escopo && !focado.closest(escopo)) return;
    /* 🔴 **Rola pela DIFERENÇA medida, e não por `scrollIntoView`.** Ele
       alinha pelo viewport de LAYOUT, e é justamente o layout que não sabe
       do teclado: no Android ele não encolhe, e no iOS encolhe às vezes --
       medido no mesmo iPhone 17 Pro Max, mesma versão, o layout foi de 796
       para 696 numa rodada e ficou em 796 na seguinte. Qualquer regra
       apoiada nele varia sozinha.

       A faixa visível sabe. Então a conta é direta: o quanto o campo passa
       dela é o quanto se rola, e ponto.

       ⚠️ **Só rola se passar.** O efeito corre a cada altura nova, e o
       teclado não entrega uma altura: entrega várias enquanto anima, e
       ainda troca de altura quando se vai do e-mail para a senha (medido:
       393 e 416, teclados diferentes). Sem esta guarda, cada uma delas era
       mais um empurrão -- e quem digita vê a tela deslizar a cada toque.

       ⚠️ `scrollBy` na JANELA, e não no elemento: o que precisa mover é a
       página, e mover o elemento mais próximo que rola escolheria uma caixa
       interna qualquer. */
    /* 🔴 **Espera o navegador agir primeiro, e só corrige o resto.** O
       Safari também rola o campo em foco, e rolar por cima dele leva o campo
       para longe demais: medido num iPhone SE, a senha ia parar em 174 numa
       faixa de 274 -- 80px acima do necessário -- e em PAISAGEM terminava em
       -4, ou seja, inteiramente fora da tela por cima. A bateria dizia "À
       VISTA" porque só cobrava o lado de baixo.

       ⚠️ 250ms é o tempo de o navegador terminar o que ele já faz. Medir
       antes disso é medir o meio da animação, e corrigir o meio de uma
       animação é a receita do pulo. */
    const relogio = setTimeout(() => {
      const caixa = focado.getBoundingClientRect();
      const passa = caixa.bottom - alturaVisivel;
      if (passa <= 1) return;
      window.scrollBy({ top: passa + FOLGA_ABAIXO_DO_CAMPO, behavior: "auto" });
    }, ESPERA_PELO_NAVEGADOR);
    return () => clearTimeout(relogio);
  }, [alturaVisivel, escopo]);
}
