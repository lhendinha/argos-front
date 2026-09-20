/** Se o espaço que sobrou para a lista é estreito demais para uma tabela.
 *
 * 🔴 **É JS porque a resposta muda a ÁRVORE, não o estilo.** Onde basta
 * mudar aparência, a consulta de container resolve e é o que o resto desta
 * reestruturação usa. Aqui a linha vira item: o nome sobe, o número desce,
 * cliente e subgrupo viram etiquetas lado a lado e situação e prazo vão para
 * um rodapé. Não é a mesma marcação com outro CSS -- é outra marcação, e só
 * quem escolhe entre duas árvores é o JavaScript.
 *
 * 🔴 **`ResizeObserver` no elemento, e não `matchMedia` na janela**, pela
 * mesma razão de sempre neste trabalho: a MESMA lista tem larguras
 * diferentes na mesma janela. Com o menu recolhido, a área de conteúdo ganha
 * uns 236px sem a viewport mudar um pixel, e uma régua de janela responderia
 * igual nos dois casos.
 *
 * 🔴 **Devolve um `ref` de FUNÇÃO, e não aceita um `ref` de objeto.** A
 * primeira versão aceitava um objeto e não media nada nas telas que mostram
 * esqueleto antes da lista: no primeiro render o elemento ainda não existe,
 * o efeito sai sem observar, e ele não roda de novo quando a lista chega --
 * as dependências não mudaram. Visto no Financeiro, que ficou em tabela no
 * celular enquanto as outras três já viravam itens. Com o `ref` de função, é
 * a montagem do elemento que dispara a medição.
 *
 * ⚠️ **`useLayoutEffect`, e não `useEffect`**: a primeira medida acontece
 * antes da pintura. Com `useEffect` a tela mostra a tabela por um quadro e
 * troca para itens depois -- um pisca em toda abertura de lista.
 *
 * ⚠️ Sem `ResizeObserver` (jsdom), devolve `false`: a tabela é o que os
 * testes existentes esperam, e nenhum deles mede largura.
 */
import { useLayoutEffect, useState } from "react";

export function useLarguraEstreita(limiar: number): [(no: HTMLElement | null) => void, boolean] {
  const [no, setNo] = useState<HTMLElement | null>(null);
  const [estreita, setEstreita] = useState(false);

  useLayoutEffect(() => {
    if (!no || typeof ResizeObserver !== "function") return;
    const observador = new ResizeObserver(([entrada]) => {
      const largura = entrada.contentRect.width;
      /* A folga de 1px evita o vai-e-vem quando a largura para exatamente
         em cima do limiar e o arredondamento oscila entre dois valores. */
      setEstreita((antes) => (antes ? largura < limiar + 1 : largura < limiar));
    });
    observador.observe(no);
    return () => observador.disconnect();
  }, [no, limiar]);

  return [setNo, estreita];
}
