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
/* 🔴 **Os três cenários são MEDIDOS, e o do meio existe por um erro meu.**
   Eu tinha só dois -- layout inteiro e layout encolhendo muito -- e passei a
   exigir 120px de encolhimento para chamar de teclado. No iOS o layout
   encolhe 89 (549 -> 460), abaixo disso: a tela voltou para a moldura fixa e
   o salto voltou com ela, no aparelho do usuário. A guarda aprovava, porque
   nenhum cenário dela tinha esse formato. */
/* ⚠️ `semTeclado` é a altura da JANELA antes do teclado, e ela precisa ser a
   do aparelho: o hook guarda o maior layout que viu, e é contra ele que mede
   o encolhimento. Com uma janela de 874px a conta do iOS dava 414 em vez de
   89, e a guarda aprovava o código quebrado -- medido, o controle negativo
   não mordeu até isto entrar. */
const CENARIOS = [
  { nome: "Android sem a meta ", semTeclado: 640, layout: null, visual: 172, esperaPreso: true },
  { nome: "iOS (Safari)       ", semTeclado: 549, layout: 460, visual: 274, esperaPreso: false },
  { nome: "Android com a meta ", semTeclado: 536, layout: 213, visual: 213, esperaPreso: false },
];

const navegador = await chromium.launch();

async function medir(cenario) {
  const contexto = await navegador.newContext({ viewport: { width: 402, height: cenario.semTeclado } });
  const pagina = await contexto.newPage();
  await pagina.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await pagina.waitForTimeout(1200);
  await pagina.focus("#senha");
  await pagina.evaluate((c) => {
    if (c.layout != null) Object.defineProperty(window, "innerHeight", { configurable: true, get: () => c.layout });
    Object.defineProperty(window.visualViewport, "height", { configurable: true, get: () => c.visual });
    Object.defineProperty(window.visualViewport, "offsetTop", { configurable: true, get: () => 0 });
    window.visualViewport.dispatchEvent(new Event("resize"));
  }, cenario);
  await pagina.waitForTimeout(600);
  const r = await pagina.evaluate((faixa) => {
    let no = document.querySelector("#senha");
    let preso = null;
    let comRecuo = null;
    while (no && no !== document.body) {
      const e = getComputedStyle(no);
      if (e.position === "fixed") preso = { altura: e.height };
      if (e.paddingBottom === faixa + "px") comRecuo = e.paddingBottom;
      no = no.parentElement;
    }
    return { preso: !!preso, comRecuo };
  }, cenario.visual);
  await contexto.close();
  return r;
}

let falhou = false;
for (const c of CENARIOS) {
  const r = await medir(c);
  const ok = r.preso === c.esperaPreso && (c.esperaPreso || !!r.comRecuo);
  console.log(`  ${c.nome} layout ${c.layout ?? "inteiro"} · faixa ${c.visual} -> ${r.preso ? "preso ao viewport" : `recuo ${r.comRecuo ?? "(nenhum)"}`} ${ok ? "ok" : "✗"}`);
  if (!ok) falhou = true;
}
await navegador.close();
if (falhou) {
  console.error("\n  ✗  algum cenário tomou o caminho errado -- ver o cabeçalho deste arquivo\n");
  process.exit(1);
}
console.log("\n  ok  cada caminho no seu cenário\n");