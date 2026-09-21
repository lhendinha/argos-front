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
   Eu tinha só dois, e cada erro meu acrescentou um. O terceiro é o que
   derrubou a regra de escolher caminho por "o layout encolheu": no MESMO
   iPhone 17 Pro Max, mesma versão, o layout foi de 796 para 696 numa rodada
   e ficou em 796 na seguinte. Se a régua varia sozinha, ela não serve para
   decidir nada -- e por isso agora NENHUM cenário pode prender a tela ao
   viewport. */
/* ⚠️ `semTeclado` é a altura da JANELA antes do teclado, e ela precisa ser a
   do aparelho: o hook guarda o maior layout que viu, e é contra ele que mede
   o encolhimento. Com uma janela de 874px a conta do iOS dava 414 em vez de
   89, e a guarda aprovava o código quebrado -- medido, o controle negativo
   não mordeu até isto entrar. */
const CENARIOS = [
  { nome: "Android sem a meta ", semTeclado: 640, layout: null, visual: 172 },
  { nome: "iOS, layout encolhe", semTeclado: 549, layout: 460, visual: 274 },
  { nome: "iOS, layout NÃO    ", semTeclado: 796, layout: null, visual: 508 },
  { nome: "Android com a meta ", semTeclado: 536, layout: 213, visual: 213 },
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
  const r = await pagina.evaluate((esperado) => {
    let no = document.querySelector("#senha");
    let preso = null;
    let comRecuo = null;
    while (no && no !== document.body) {
      const e = getComputedStyle(no);
      if (e.position === "fixed") preso = { altura: e.height };
        /* ⚠️ O recuo CERTO é a altura do teclado: layout menos faixa. Uma
         versão desta guarda exigia "mais de 200px" e reprovava o código
         correto -- inclusive o caso em que o layout já encolheu junto com o
         teclado, onde o recuo certo é ZERO. */
      if (Math.abs(parseFloat(e.paddingBottom) - esperado) <= 1) comRecuo = e.paddingBottom;
      no = no.parentElement;
    }
    return { preso: !!preso, comRecuo };
  }, Math.max(0, (cenario.layout ?? cenario.semTeclado) - cenario.visual));
  await contexto.close();
  return r;
}

let falhou = false;
for (const c of CENARIOS) {
  const r = await medir(c);
  const ok = !r.preso && !!r.comRecuo;
  console.log(`  ${c.nome} layout ${c.layout ?? "inteiro"} · faixa ${c.visual} -> ${r.preso ? "PRESO ao viewport" : `recuo ${r.comRecuo ?? "(nenhum)"}`} ${ok ? "ok" : "✗"}`);
  if (!ok) falhou = true;
}
/* 🔴 **Trocar de teclado não pode mover a tela.** É o defeito que o usuário
   viu: ir do e-mail para a senha troca o teclado, a faixa muda (medido num
   iPhone 17 Pro Max: 393 com um, 416 com o outro), e tudo que reagir a esse
   número mexe a página junto. Na versão em que o recuo era igual à faixa, a
   rolagem pulava 35px a cada toque.

   ⚠️ As duas faixas entram de propósito, uma depois da outra, na mesma
   página: é a troca que importa, não o valor. */
const contexto2 = await navegador.newContext({ viewport: { width: 402, height: 874 } });
const pagina2 = await contexto2.newPage();
await pagina2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await pagina2.waitForTimeout(1200);
await pagina2.focus("#email");
const posicoes = [];
for (const faixa of [393, 416, 393]) {
  await pagina2.evaluate((alt) => {
    Object.defineProperty(window.visualViewport, "height", { configurable: true, get: () => alt });
    window.visualViewport.dispatchEvent(new Event("resize"));
  }, faixa);
  await pagina2.waitForTimeout(400);
  posicoes.push(
    await pagina2.evaluate(() => {
      let c = document.querySelector("#email");
      while (c && getComputedStyle(c).maxWidth !== "380px") c = c.parentElement;
      return { topo: Math.round(c.getBoundingClientRect().top), y: Math.round(window.scrollY) };
    }),
  );
}
await contexto2.close();
const mexeu = posicoes.some((p) => p.topo !== posicoes[0].topo || p.y !== posicoes[0].y);
console.log(`  trocar de teclado: ${posicoes.map((p) => `topo ${p.topo}/y ${p.y}`).join(" · ")} ${mexeu ? "✗" : "ok"}`);
if (mexeu) falhou = true;

await navegador.close();
if (falhou) {
  console.error("\n  ✗  algum cenário tomou o caminho errado -- ver o cabeçalho deste arquivo\n");
  process.exit(1);
}
console.log("\n  ok  cada caminho no seu cenário\n");