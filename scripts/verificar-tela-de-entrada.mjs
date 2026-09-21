/** A tela de entrada tem DOIS caminhos, e cada um vale no seu cenário.
 *
 *   node scripts/verificar-tela-de-entrada.mjs
 *   BASE=http://localhost:4173 node scripts/verificar-tela-de-entrada.mjs
 *
 * Sai com 1 se algum dos dois se perder.
 *
 * 🔴 **O que decide é a MEDIDA, não o aparelho**: o viewport de layout
 * encolheu junto com o teclado?
 *
 * **Encolheu (iOS)** -> nada preso ao viewport, só recuo embaixo. Prender
 * aqui é o que causava o salto: a coluna fixa compensava o deslocamento do
 * viewport com um `translateY` que só entra no render seguinte, e no quadro
 * do meio a tela inteira aparecia fora do lugar. Gravado num iPhone 17 Pro
 * Max alternando os dois campos: o deslocamento crescia (45, 173, 209, 336,
 * 372, 403) e o topo da moldura ia a -128 e voltava a 0 em 100ms.
 *
 * **Não encolheu (Android)** -> a moldura fixa PRECISA existir. Medido com
 * faixa de 172px num layout de 640: sem ela o campo de senha termina em 345,
 * atrás do teclado, porque `scrollIntoView` alinha pelo layout -- que ali
 * não mudou. Com ela, termina em 172.
 *
 * ⚠️ Esta guarda existe porque eu quebrei os dois, um de cada vez: primeiro
 * mantive a moldura para todos (salto no iPhone), depois tirei para todos
 * (campo escondido no Android). Cada caminho sozinho passa numa metade da
 * realidade.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://localhost:5174";
const FAIXA = 172;

const navegador = await chromium.launch();
const contexto = await navegador.newContext({ viewport: { width: 402, height: 874 } });

async function medir(encolheOLayout) {
  const pagina = await contexto.newPage();
  await pagina.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1200);
  await pagina.focus("#senha");
  await pagina.evaluate(({ alt, enc }) => {
    if (enc) Object.defineProperty(window, "innerHeight", { configurable: true, get: () => alt + 40 });
    Object.defineProperty(window.visualViewport, "height", { configurable: true, get: () => alt });
    Object.defineProperty(window.visualViewport, "offsetTop", { configurable: true, get: () => 0 });
    window.visualViewport.dispatchEvent(new Event("resize"));
  }, { alt: FAIXA, enc: encolheOLayout });
  await pagina.waitForTimeout(600);
  const r = await pagina.evaluate((faixa) => {
    let no = document.querySelector("#senha");
    let preso = null;
    let comRecuo = null;
    while (no && no !== document.body) {
      const e = getComputedStyle(no);
      if (e.position === "fixed") preso = { altura: e.height, transform: e.transform };
      if (e.paddingBottom === faixa + "px") comRecuo = e.paddingBottom;
      no = no.parentElement;
    }
    return { preso, comRecuo };
  }, FAIXA);
  await pagina.close();
  return r;
}

const naoEncolhe = await medir(false);
const encolhe = await medir(true);
await navegador.close();

let falhou = false;
console.log(`  layout NÃO encolhe (Android): ${naoEncolhe.preso ? `preso, altura ${naoEncolhe.preso.altura}` : "nada preso"}`);
if (!naoEncolhe.preso) {
  console.error("  ✗  sem moldura presa à faixa, o campo fica atrás do teclado no Android");
  falhou = true;
}
console.log(`  layout encolhe (iOS):         ${encolhe.preso ? "preso" : "nada preso"} · recuo ${encolhe.comRecuo ?? "(nenhum)"}`);
if (encolhe.preso) {
  console.error("  ✗  preso ao viewport onde o layout encolhe -- volta o salto a cada troca de campo");
  falhou = true;
}
if (!encolhe.comRecuo) {
  console.error(`  ✗  sem recuo de ${FAIXA}px embaixo -- o campo em foco não tem para onde rolar`);
  falhou = true;
}
if (falhou) process.exit(1);
console.log("\n  ok  cada caminho no seu cenário\n");
