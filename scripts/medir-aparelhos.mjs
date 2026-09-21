/** A régua dos APARELHOS: a mesma tela em dois motores, quatro formatos e as
 * duas orientações.
 *
 *   node scripts/medir-aparelhos.mjs            tudo
 *   node scripts/medir-aparelhos.mjs --fotos    grava as capturas em /tmp/aparelhos
 *
 * 🔴 **Existe porque a régua do mobile só conhece o Chromium.** Tudo que
 * esta reestruturação construiu depende de coisa que o WebKit trata à sua
 * maneira: `100dvh`, `visualViewport`, consulta de container, `cqw`,
 * `hyphens: auto`, `position: sticky` em tabela e `env(safe-area-inset-*)`.
 * Medir só no Chrome é medir metade.
 *
 * ⚠️ Contra a API LOCAL (`yarn offline`) e o dev server da porta 5174 -- o
 * dado é o mesmo que a régua do mobile estica, e não o de produção.
 *
 * ⚠️ O teclado aqui é SIMULADO, como nas telas de entrada: nenhum navegador
 * sem janela tem teclado de software. Quem prova teclado de verdade é o
 * emulador Android, por `adb`.
 */
import { chromium, webkit } from "playwright";
import { mkdirSync } from "node:fs";

const APP = "http://localhost:5174";
const FOTOS = process.argv.includes("--fotos");
if (FOTOS) mkdirSync("/tmp/aparelhos", { recursive: true });

const MOTORES = { chromium, webkit };

/** Os formatos reais, medidos nos aparelhos que o simulador expõe. */
const APARELHOS = [
  { nome: "iphone-se", retrato: [375, 667], dpr: 2 },
  { nome: "iphone-15", retrato: [393, 659], dpr: 3 },
  { nome: "pixel-7", retrato: [412, 839], dpr: 2.625 },
  { nome: "ipad-mini", retrato: [768, 1024], dpr: 2 },
  { nome: "desktop", retrato: [1440, 900], dpr: 1, semPaisagem: true },
];

const ROTAS = ["/", "/processos", "/clientes", "/agenda", "/financeiro", "/grupo", "/documentos"];

const medir = () => {
  const raiz = document.documentElement;
  const largura = raiz.clientWidth;
  let pior = null;
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest("svg")) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    const passa = Math.round(r.right - largura);
    if (passa > 1 && (!pior || passa > pior.passa)) {
      pior = { passa, tag: el.tagName.toLowerCase(), texto: (el.textContent ?? "").trim().slice(0, 30) };
    }
  }
  return { pagina: raiz.scrollWidth, largura, pior, vazia: (document.querySelector("main")?.innerText ?? "").length < 40 };
};

let falhas = 0, total = 0;
for (const [nomeDoMotor, motor] of Object.entries(MOTORES)) {
  const navegador = await motor.launch();
  for (const ap of APARELHOS) {
    const orientacoes = ap.semPaisagem
      ? [["retrato", ap.retrato]]
      : [["retrato", ap.retrato], ["paisagem", [ap.retrato[1], ap.retrato[0]]]];
    for (const [orientacao, [w, h]] of orientacoes) {
      const ctx = await navegador.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: ap.dpr });
      const p = await ctx.newPage();
      await p.goto(APP, { waitUntil: "networkidle" });
      /* Login uma vez por contexto; a sessão vale para as rotas seguintes. */
      if (await p.locator('input[type="email"], input[name="email"]').count()) {
        await p.getByLabel(/e-?mail/i).fill("chefe@local.test");
        await p.getByRole("textbox", { name: "Senha" }).fill("Senha!Local1");
        await p.getByRole("button", { name: /entrar/i }).click();
        await p.waitForTimeout(3000);
      }
      for (const rota of ROTAS) {
        await p.goto(`${APP}${rota}`, { waitUntil: "networkidle" });
        await p.waitForTimeout(1200);
        const m = await p.evaluate(medir);
        total += 1;
        const etiqueta = `${nomeDoMotor}/${ap.nome}/${orientacao}`.padEnd(30);
        if (m.vazia) {
          console.log(`  ?   ${etiqueta} ${rota.padEnd(13)} não renderizou`);
        } else if (m.pagina - m.largura > 1) {
          falhas += 1;
          console.log(`  ✗   ${etiqueta} ${rota.padEnd(13)} página ${m.pagina} de ${m.largura}${m.pior ? ` · <${m.pior.tag}> +${m.pior.passa}px "${m.pior.texto}"` : ""}`);
        }
        if (FOTOS) await p.screenshot({ path: `/tmp/aparelhos/${nomeDoMotor}-${ap.nome}-${orientacao}${rota.replace(/\//g, "_")}.png` });
      }
      await ctx.close();
    }
  }
  await navegador.close();
}
console.log(`\n  ${total - falhas} de ${total} combinações couberam`);
process.exit(falhas ? 1 : 0);
