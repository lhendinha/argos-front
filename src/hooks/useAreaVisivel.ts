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

import { ENCOLHIMENTO_QUE_E_TECLADO, PISO_PARA_RODAPE_PRESO } from "../constants";
import type { AreaVisivel } from "../types/ui";

export function useAreaVisivel(ativo: boolean, comPiso = true): AreaVisivel {
  const [area, setArea] = useState<AreaVisivel>({ altura: null, deslocamento: 0, layoutEncolheu: false });
  /* O MAIOR layout já visto nesta largura -- a régua do "sem teclado".
     Em ref porque é memória entre medições, não coisa que redesenhe a tela.
     A largura entra junto porque girar o aparelho muda o layout por motivo
     legítimo, e a marca velha mentiria. */
  const maiorLayout = useRef<{ largura: number; altura: number } | null>(null);

  useEffect(() => {
    const visual = typeof window !== "undefined" ? window.visualViewport : undefined;
    /* ⚠️ Sai sem gravar nada: `setState` síncrono dentro do efeito encadeia
       renderizações, e o valor devolvido já é derivado de `ativo` lá
       embaixo -- não há estado velho a limpar aqui. */
    if (!ativo || !visual) return;
    const medir = () => {
      /* 🔴 **DOIS sinais, porque há dois comportamentos de navegador.**
         O clássico: o teclado encolhe só o viewport visual, e o layout fica
         inteiro -- então `visual < innerHeight` denuncia o teclado. O novo,
         que a meta `interactive-widget=resizes-content` liga: o layout
         encolhe JUNTO, os dois ficam iguais, e o sinal clássico cala. Medido
         num Android real com Chrome 134: sem a meta, 536 de layout e 172 de
         visual; com ela, 213 nos dois.

         Somar os dois cobre navegador que aceita a palavra-chave e navegador
         que a ignora, sem perguntar qual é qual. */
      const larguraAgora = window.innerWidth;
      if (!maiorLayout.current || maiorLayout.current.largura !== larguraAgora) {
        maiorLayout.current = { largura: larguraAgora, altura: window.innerHeight };
      } else if (window.innerHeight > maiorLayout.current.altura) {
        maiorLayout.current.altura = window.innerHeight;
      }
      /* 🔴 **Duas perguntas diferentes, dois limites.** Misturei as duas num
         número só e quebrei o iPhone: o piso de 120px existe para não
         confundir teclado com a barra do navegador, mas no iOS o layout
         encolhe só 89px (549 -> 460) -- abaixo do piso. `layoutEncolheu`
         ficou falso, a tela de entrada voltou para a moldura fixa, e o salto
         voltou junto. O usuário viu no aparelho dele.

         "HÁ teclado?" precisa do piso, porque a barra do navegador também
         mexe no `innerHeight` ao recolher. "O layout encolheu JUNTO?" não
         precisa: ela só é consultada quando já se sabe que há teclado, e aí
         qualquer encolhimento é do teclado. */
      const encolhimento = maiorLayout.current.altura - window.innerHeight;
      const encolheuMuito = encolhimento >= ENCOLHIMENTO_QUE_E_TECLADO;
      /* A folga de 1px absorve o arredondamento do zoom que o Safari aplica
         ao campo em foco -- sem ela, a folha reagiria a uma diferença que
         ninguém enxerga. */
      const visualMenor = visual.height < window.innerHeight - 1;
      const fechado = !encolheuMuito && !visualMenor;
      const curto = comPiso && visual.height < PISO_PARA_RODAPE_PRESO;
      setArea({
        altura: fechado || curto ? null : Math.round(visual.height),
        deslocamento: fechado || curto ? 0 : Math.round(visual.offsetTop),
        layoutEncolheu: encolhimento > 1,
      });
    };
    medir();
    visual.addEventListener("resize", medir);
    visual.addEventListener("scroll", medir);
    /* ⚠️ A JANELA também: quando o layout encolhe junto com o teclado, é o
       `innerHeight` que muda, e há navegador que dispara só este. */
    window.addEventListener("resize", medir);
    return () => {
      visual.removeEventListener("resize", medir);
      visual.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [ativo, comPiso]);

  /* 🔴 Derivado, e não lido cru: com o diálogo fechado o estado guardado é
     o da última medição, e devolvê-lo prenderia a folha a uma altura de
     teclado que não existe mais. */
  return ativo ? area : { altura: null, deslocamento: 0, layoutEncolheu: false };
}
