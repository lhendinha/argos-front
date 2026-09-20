/** Guarda onde a página estava e devolve ao voltar.
 *
 * 🔴 **Medido antes de escrever:** na lista de processos, rolando até 1066 e
 * abrindo um processo, o botão Voltar trazia a lista de volta perto do topo.
 * Numa lista de mil linhas isso é a pessoa procurar de novo onde estava, toda
 * vez que abre e fecha um registro -- e o celular sofre mais, porque cada
 * linha ocupa muito mais altura.
 *
 * 🔴 **À mão, porque o `ScrollRestoration` do React Router exige o roteador
 * de dados.** Este app usa `BrowserRouter`, e trocá-lo por
 * `createBrowserRouter` mexeria em toda a árvore de rotas para resolver uma
 * coisa que cabe num gancho.
 *
 * 🔴 **A gravação NÃO pode acontecer na limpeza do efeito.** Foi a primeira
 * tentativa, e a limpeza roda DEPOIS de o DOM já ser a outra tela: ela
 * gravava a posição da tela errada. Quem sabe a posição é o ouvinte de
 * rolagem, enquanto a tela ainda é aquela; a limpeza só remove o ouvinte.
 *
 * ⚠️ **Só no POP.** Ao avançar para uma tela nova a página vai para o topo,
 * que é o que o navegador faria com um documento novo. Sem isso, abrir um
 * processo do fim da lista mostrava o detalhe já rolado.
 *
 * ⚠️ **Devolver a posição pede PACIÊNCIA.** A lista chega por consulta: no
 * instante em que a rota volta, o documento ainda tem a altura do esqueleto,
 * e um `scrollTo(1066)` numa página de 600px para em 0. Por isso tenta a
 * cada quadro até a página ter altura suficiente -- com um teto, senão uma
 * lista que encurtou (um filtro aplicado antes de sair) deixaria o laço
 * girando.
 *
 * ⚠️ **Dois desvios que custaram caro, e valem como aviso para quem for
 * verificar isto de novo.** Cheguei a construir duas defesas contra uma
 * "rolagem espúria" que aparecia entre o clique e a troca de rota -- uma
 * checagem de encurtamento do documento e uma captura de clique com
 * congelamento. Nenhuma das duas era necessária: quem rolava a página era o
 * `locator.click()` do Playwright, que leva o alvo até a vista ANTES de
 * clicar. O instrumento estava medindo a si mesmo. Clicando por
 * `elemento.click()`, sem rolagem, a versão simples devolve a posição exata.
 *
 * ⚠️ Vale para navegação de ROTA. No Histórico o clique abre modal e a rota
 * não muda -- ali não há o que devolver, e a página fica onde está.
 */
import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/** Onde cada entrada do histórico estava. A chave é a do `location`, que o
 * React Router troca a cada navegação -- inclusive entre duas idas à MESMA
 * rota, que é o que distingue "a lista de antes" de "a lista de agora". */
const POSICOES = new Map<string, number>();

/** ~1s a 60 quadros: o bastante para a consulta responder e a lista pintar,
 * e pouco para ninguém notar se não der. */
const TENTATIVAS = 60;

export function useRolagemPreservada(): void {
  const { key } = useLocation();
  const tipo = useNavigationType();
  const chaveAtual = useRef(key);

  useEffect(() => {
    const aoRolar = () => POSICOES.set(chaveAtual.current, window.scrollY);
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  useLayoutEffect(() => {
    /* A rota mudou: daqui em diante a conta é da tela nova. Antes do
       `scrollTo` abaixo, que também dispara rolagem. */
    chaveAtual.current = key;

    const alvo = tipo === "POP" ? (POSICOES.get(key) ?? 0) : 0;
    if (!alvo) {
      window.scrollTo(0, 0);
      return;
    }
    let tentativa = 0;
    let quadro = 0;
    const tentar = () => {
      const altura = document.documentElement.scrollHeight - window.innerHeight;
      if (altura >= alvo || tentativa >= TENTATIVAS) {
        window.scrollTo(0, Math.min(alvo, Math.max(altura, 0)));
        return;
      }
      tentativa += 1;
      quadro = requestAnimationFrame(tentar);
    };
    quadro = requestAnimationFrame(tentar);
    return () => cancelAnimationFrame(quadro);
  }, [key, tipo]);
}
