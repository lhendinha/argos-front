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
 * ⚠️ Ouve `resize` E `scroll` do `visualViewport`: no iOS o teclado também
 * DESLOCA a viewport visual, e sem o `scroll` a folha fica na altura certa
 * mas na posição errada.
 *
 * ⚠️ Só mede enquanto `ativo`. Um diálogo fechado não precisa de ouvinte, e
 * são dois por modal aberto numa tela que pode ter dois.
 */
import { useEffect, useState } from "react";

import { PISO_PARA_RODAPE_PRESO } from "../constants";
import type { AreaVisivel } from "../types/ui";

export function useAreaVisivel(ativo: boolean): AreaVisivel {
  const [area, setArea] = useState<AreaVisivel>({ altura: null, deslocamento: 0 });

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
      const curto = visual.height < PISO_PARA_RODAPE_PRESO;
      setArea({
        altura: fechado || curto ? null : Math.round(visual.height),
        deslocamento: fechado || curto ? 0 : Math.round(visual.offsetTop),
      });
    };
    medir();
    visual.addEventListener("resize", medir);
    visual.addEventListener("scroll", medir);
    return () => {
      visual.removeEventListener("resize", medir);
      visual.removeEventListener("scroll", medir);
    };
  }, [ativo]);

  /* 🔴 Derivado, e não lido cru: com o diálogo fechado o estado guardado é
     o da última medição, e devolvê-lo prenderia a folha a uma altura de
     teclado que não existe mais. */
  return ativo ? area : { altura: null, deslocamento: 0 };
}
