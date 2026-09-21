import { chromium } from "playwright";
const navegador = await chromium.connectOverCDP("http://localhost:9222");
const ctx = navegador.contexts()[0];
const p = ctx.pages().find((x) => x.url().includes("localhost")) ?? ctx.pages()[0];
await p.goto("http://localhost:5174/login", { waitUntil: "networkidle" });
await p.waitForTimeout(2500);

const ler = () => p.evaluate(() => {
  const senha = document.querySelector('input[type="password"], #senha');
  const r = senha?.getBoundingClientRect();
  return {
    visivel: window.visualViewport ? Math.round(visualViewport.height) : null,
    layout: innerHeight,
    fimDoCampo: r ? Math.round(r.bottom) : null,
    focado: document.activeElement?.id || document.activeElement?.type || "(nada)",
  };
});
console.log("  antes do toque: ", JSON.stringify(await ler()));
await p.locator('input[type="password"], #senha').first().click();
await p.waitForTimeout(3500);
const d = await ler();
console.log("  com o teclado:  ", JSON.stringify(d));
console.log(`\n  o campo ${d.fimDoCampo <= d.visivel ? "FICOU À VISTA" : "ficou ESCONDIDO"} (fim ${d.fimDoCampo} · visível ${d.visivel})`);
await navegador.close();
