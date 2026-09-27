/** O "verificado até" na lista cheia e no detalhe -- em Chrome de verdade.
 *
 *   1) cd ../api && yarn offline
 *      .venv/bin/python scripts/offline/semear_verificado_ate.py
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 \
 *        yarn dev --port 5174
 *   3) node scripts/verificar-verificado-ate.mjs
 *
 * 🔴 O que só o Chrome responde: a COR computada do "(atrasado)" e se ele cabe na linha de baixo da célula sem
 * quebrar -- jsdom não pinta nem mede. As linhas atrasadas e as em dia têm de ter a mesma altura.
 */
import { chromium } from "playwright";

const APP = "http://localhost:5174";
const CONTA = { email: "chefe@local.test", senha: "Senha!Local1" };
/** `tokens.ts`, `warnDark` -- o `status.warn.text` do tema. */
const AMBAR_ESCURO = "rgb(153, 93, 0)";
const PISO = 8;

const navegador = await chromium.launch({ channel: "chrome", headless: false, slowMo: 20 });
const pagina = await (await navegador.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();

const problemas = [];
let checagens = 0;
const conferir = (ok, oQue) => {
  checagens += 1;
  console.log(`${ok ? "  ok  " : "FALHA "} ${oQue}`);
  if (!ok) problemas.push(oQue);
};

await pagina.goto(APP);
await pagina.getByLabel(/e-?mail/i).fill(CONTA.email);
await pagina.getByRole("textbox", { name: "Senha" }).fill(CONTA.senha);
await pagina.getByRole("button", { name: /entrar/i }).click();
await pagina.getByText("Resumo rápido").waitFor();

await pagina.goto(`${APP}/processos`);
await pagina.getByPlaceholder("Pesquisar número, cliente ou apelido").fill("Verificação");
await pagina.locator("tbody tr", { hasText: "Verificação 00" }).waitFor();
const linhaDe = (n) => pagina.locator("tbody tr", { hasText: `Verificação ${String(n).padStart(2, "0")}` });

// ── a lista: os pares atrasados, os ímpares em dia ──────────────────────
const alturas = { atrasada: new Set(), emDia: new Set() };
let atrasadasComCor = 0;
let emDiaSemAtraso = 0;
for (let n = 0; n < 10; n += 1) {
  const linha = linhaDe(n);
  const atraso = linha.getByText("(atrasado)");
  const altura = Math.round((await linha.boundingBox()).height);
  if (n % 2 === 0) {
    alturas.atrasada.add(altura);
    if ((await atraso.count()) === 1 && (await atraso.evaluate((e) => getComputedStyle(e).color)) === AMBAR_ESCURO) {
      atrasadasComCor += 1;
    }
  } else {
    alturas.emDia.add(altura);
    if ((await atraso.count()) === 0 && (await linha.getByText(/verificado até \d\d\/\d\d/).count()) === 1) {
      emDiaSemAtraso += 1;
    }
  }
}
conferir(atrasadasComCor === 5, `"(atrasado)" em âmbar escuro nas 5 linhas atrasadas (achei ${atrasadasComCor})`);
conferir(emDiaSemAtraso === 5, `"verificado até dd/mm" sem atraso nas 5 em dia (achei ${emDiaSemAtraso})`);
const [alturaAtrasada] = alturas.atrasada;
const [alturaEmDia] = alturas.emDia;
conferir(alturas.atrasada.size === 1 && alturas.emDia.size === 1 && alturaAtrasada === alturaEmDia,
  `a linha atrasada tem a altura da em dia -- o "(atrasado)" não quebra (${[...alturas.atrasada]} x ${[...alturas.emDia]})`);
const celula = linhaDe(0).getByText("(atrasado)").locator("xpath=ancestor::td[1]");
conferir(await celula.evaluate((td) => td.scrollWidth <= td.clientWidth + 1), "a célula da atrasada não transborda");
conferir((await pagina.getByText(/verificado \d\d\/\d\d\/\d{4}/).count()) === 0, "a hora da última consulta não aparece mais");

// ── o detalhe: o mesmo texto, com maiúscula ─────────────────────────────
await linhaDe(0).click();
const noDetalhe = pagina.getByText(/^Verificado até \d\d\/\d\d/);
await noDetalhe.waitFor();
conferir(await noDetalhe.isVisible(), '"Verificado até dd/mm" no detalhe');
const atrasoNoDetalhe = pagina.getByText("(atrasado)");
conferir((await atrasoNoDetalhe.count()) === 1
  && (await atrasoNoDetalhe.evaluate((e) => getComputedStyle(e).color)) === AMBAR_ESCURO, "e o atraso em âmbar escuro");
await pagina.goBack();
await linhaDe(1).click();
await pagina.getByText(/^Verificado até \d\d\/\d\d/).waitFor();
conferir((await pagina.getByText("(atrasado)").count()) === 0, "o detalhe em dia não mostra atraso");

await navegador.close();
console.log(`\n${checagens} checagens; FALHAS: ${problemas.length ? problemas.join("; ") : "nenhuma"}`);
if (checagens < PISO) {
  console.log(`⚠️ só ${checagens} checagens (piso ${PISO}): o roteiro morreu cedo`);
  process.exit(2);
}
process.exit(problemas.length ? 1 : 0);
