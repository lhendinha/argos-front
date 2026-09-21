/** O pedaço da tela que o teclado deixou à mostra.
 *
 * 🔴 **É a única coisa aqui que o CSS não responde.** Medi nos dois
 * sistemas, com teclado de software de verdade: nem o Safari nem o Chrome
 * encolhem a viewport de LAYOUT quando o teclado abre. No Android, em
 * `/login`, a altura de layout ficou em 536 e só a do `visualViewport` caiu
 * para 213. Ou seja: `100dvh` continua valendo a tela
 * inteira com o teclado na frente, e um rodapé preso em `bottom: 0` fica
 * atrás dele. Quem sabe a verdade é o `visualViewport`, e só por JS.
 *
 * 🔴 **Devolve `null` quando não se deve prender nada**, e são três casos:
 * sem `visualViewport` (jsdom, navegador antigo), com o teclado fechado
 * (nada a corrigir) e abaixo do piso de altura. O último é o iPhone grande
 * deitado, onde sobram 51px: prender o rodapé ali o poria por cima do campo
 * que está sendo digitado.
 *
 * 🔴 **`comPiso = false` para quem NÃO prende rodapé, e isso não é detalhe:
 * o piso desligava a correção justamente onde ela mais serve.** Medido em
 * Chrome de verdade, num Android de 360x640: o teclado derruba a área
 * visível para 172px -- abaixo dos 180 do piso --, o gancho devolvia `null`,
 * e o campo de senha da tela de entrada ficava atrás do teclado, parado em
 * 363 com 172 à mostra. No `visualViewport` que eu tinha forjado sobravam
 * 460px e o piso nunca entrava em jogo; o aparelho real entrou.
 *
 * ⚠️ O piso continua valendo para quem PRENDE rodapé, que é a decisão para
 * a qual ele foi medido. Encolher uma folha para 172px é ruim; prender um
 * rodapé nela é pior, porque ele cobre o campo.
 *
 * ⚠️ Ouve `resize` E `scroll` do `visualViewport`: no iOS o teclado também
 * DESLOCA a viewport visual, e sem o `scroll` a folha fica na altura certa
 * mas na posição errada.
 *
 * ⚠️ Só mede enquanto `ativo`. Um diálogo fechado não precisa de ouvinte, e
 * são dois por modal aberto numa tela que pode ter dois.
 */
import { useEffect, useRef, useState } from "react";

import { PISO_PARA_RODAPE_PRESO } from "../constants";
import type { AreaVisivel } from "../types/ui";

export function useAreaVisivel(ativo: boolean, comPiso = true): AreaVisivel {
  const [area, setArea] = useState<AreaVisivel>({ altura: null, deslocamento: 0, layoutEncolheu: false });
  /* A altura de layout com o teclado FECHADO, para comparar depois. Em ref
     porque é memória entre medições, não coisa que redesenhe a tela. */
  const layoutComTecladoFechado = useRef<number | null>(null);

  useEffect(() => {
    const visual = typeof window !== "undefined" ? window.visualViewport : undefined;
    /* ⚠️ Sai sem gravar nada: `setState` síncrono dentro do efeito encadeia
       renderizações, e o valor devolvido já é derivado de `ativo` lá
       embaixo -- não há estado velho a limpar aqui. */
    if (!ativo || !visual) return;
    const medir = () => {
      /* A folga de 1px absorve o arredondamento do zoom que o Safari aplica
         ao campo em foco -- sem ela, a folha reagiria a uma diferença que
         ninguém enxerga. */
      const fechado = visual.height >= window.innerHeight - 1;
      if (fechado) layoutComTecladoFechado.current = window.innerHeight;
      const base = layoutComTecladoFechado.current;
      const curto = comPiso && visual.height < PISO_PARA_RODAPE_PRESO;
      setArea({
        altura: fechado || curto ? null : Math.round(visual.height),
        deslocamento: fechado || curto ? 0 : Math.round(visual.offsetTop),
        layoutEncolheu: base != null && window.innerHeight < base - 1,
      });
    };
    medir();
    visual.addEventListener("resize", medir);
    visual.addEventListener("scroll", medir);
    return () => {
      visual.removeEventListener("resize", medir);
      visual.removeEventListener("scroll", medir);
    };
  }, [ativo, comPiso]);

  /* 🔴 Derivado, e não lido cru: com o diálogo fechado o estado guardado é
     o da última medição, e devolvê-lo prenderia a folha a uma altura de
     teclado que não existe mais. */
  return ativo ? area : { altura: null, deslocamento: 0, layoutEncolheu: false };
}
