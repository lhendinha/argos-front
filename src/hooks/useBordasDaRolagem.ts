/** De que lados um conteúdo largo continua depois da borda.
 *
 * 🔴 **Porque rolagem horizontal no toque é invisível.** Medi o Fluxo de
 * caixa em 390px: a tabela tem 1975px dentro de 348px, 1627px escondidos, e
 * NADA na tela diz isso -- o navegador do celular só desenha a barra
 * enquanto se arrasta, e quem não arrastou nunca soube que havia onze meses
 * à direita. Um relatório que existe para comparar meses mostrando um mês é
 * pior do que parece, porque não parece nada.
 *
 * 🔴 **Devolve os DOIS lados, e é o que faz o aviso não mentir.** Um
 * esmaecido fixo na direita continuaria aceso no fim da rolagem, dizendo que
 * há mais quando não há; e na esquerda ele precisa aparecer só depois de
 * sair do começo. Com tabela que cabe inteira, os dois ficam apagados e a
 * tela fica como era.
 *
 * 🔴 **`ref` de FUNÇÃO, pela lição de `useLarguraEstreita`:** a tabela chega
 * por consulta, e num `ref` de objeto o elemento ainda não existe no
 * primeiro render -- o efeito sai sem observar e não roda de novo.
 *
 * ⚠️ Ouve `scroll` E `ResizeObserver`: rolar muda a posição, redimensionar
 * muda quanto cabe, e trocar o período troca o número de colunas sem que
 * nenhum dos dois aconteça -- por isso o observador olha o CONTEÚDO também.
 *
 * ⚠️ Sem `ResizeObserver` (jsdom), os dois lados ficam apagados: é a tela
 * sem aviso nenhum, que é o que os testes existentes esperam ver.
 */
import { useLayoutEffect, useState } from "react";

import type { BordasDaRolagem } from "../types/ui";

/** Folga de 1px: o `scrollLeft` do zoom do navegador chega fracionário, e
 * sem ela o esmaecido da direita fica aceso no fim da rolagem. */
const FOLGA = 1;

export function useBordasDaRolagem(): [(no: HTMLElement | null) => void, BordasDaRolagem] {
  const [no, setNo] = useState<HTMLElement | null>(null);
  const [bordas, setBordas] = useState<BordasDaRolagem>({ antes: false, depois: false });

  useLayoutEffect(() => {
    if (!no || typeof ResizeObserver !== "function") return;
    const medir = () => {
      const fim = no.scrollWidth - no.clientWidth - no.scrollLeft;
      setBordas((atuais) => {
        const antes = no.scrollLeft > FOLGA;
        const depois = fim > FOLGA;
        /* Só grava quando muda: o `scroll` dispara a cada quadro do arraste,
           e um `setState` por quadro repintaria a tabela inteira. */
        return atuais.antes === antes && atuais.depois === depois ? atuais : { antes, depois };
      });
    };
    medir();
    no.addEventListener("scroll", medir, { passive: true });
    const observador = new ResizeObserver(medir);
    observador.observe(no);
    /* O conteúdo muda de largura sem o rolador mudar de tamanho -- trocar o
       período do fluxo troca doze colunas por três. */
    if (no.firstElementChild) observador.observe(no.firstElementChild);
    return () => {
      no.removeEventListener("scroll", medir);
      observador.disconnect();
    };
  }, [no]);

  return [setNo, bordas];
}
