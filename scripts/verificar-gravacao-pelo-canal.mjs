/** A gravação da importação em segundo plano, em Chrome de verdade: o 202, a barra
 * andando pelo canal, e o resumo no fim.
 *
 *   1) cd ../api && yarn offline          (a API da Fase 4 do balde)
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 \
 *        yarn dev --port 5174
 *   3) node scripts/verificar-gravacao-pelo-canal.mjs
 *
 * ⚠️ Cria um subgrupo NOVO a cada rodada e importa nele: o roteiro da busca espera
 * os 24 processos da OAB como novos no primeiro subgrupo, e importar lá o quebraria.
 * A busca vai ao PJe real pelo despachante do offline (dado público).
 */
import { chromium } from "playwright";

const APP = "http://localhost:5174";
const API = "http://localhost:8099";
const OAB = { numero: "206876", uf: "MG" };
const nav = await chromium.launch({ channel: "chrome", headless: false });
const p = await (await nav.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const problemas = [];
p.on("pageerror", (e) => problemas.push("erro de página: " + e.message.slice(0, 120)));
const ok = [];
const conferir = (o, n, d = "") => {
  ok.push(o);
  console.log(`${o ? "  ok  " : "FALHA "} ${n}${d ? " -- " + d : ""}`);
};
const quadros = [];
p.on("websocket", (ws) => ws.on("framereceived", (f) => {
  const s = String(f.payload);
  if (s.includes("importacao_progresso") || s.includes("importacao_fim")) quadros.push(s.slice(0, 80));
}));

const token = await (await fetch(`${API}/login`, { method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "chefe@local.test", password: "Senha!Local1" }) })).json();
const nome = `Gravação ${Date.now() % 100000}`;
const criado = await fetch(`${API}/subgrupos`, { method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token.access_token}` },
  body: JSON.stringify({ nome }) });
conferir(criado.ok, "o subgrupo da rodada foi criado", `${criado.status} "${nome}"`);

await p.goto(APP);
await p.getByLabel(/e-?mail/i).fill("chefe@local.test");
await p.getByRole("textbox", { name: "Senha" }).fill("Senha!Local1");
await p.getByRole("button", { name: /entrar/i }).click();
await p.getByText("Resumo rápido").waitFor();
await Promise.all([
  p.waitForResponse((r) => new URL(r.url()).pathname === "/subgrupos" && r.ok()),
  p.goto(APP + "/processos"),
]);
await p.getByRole("button", { name: /Importar por OAB/i }).click();
await p.getByRole("combobox", { name: /Subgrupo/ }).fill(nome);
await p.keyboard.press("Enter");
await p.getByRole("textbox", { name: /Número da OAB/ }).fill(OAB.numero);
await p.getByRole("combobox", { name: /UF da OAB/ }).fill(OAB.uf);
await p.keyboard.press("Enter");
await p.getByRole("button", { name: "Buscar processos" }).click();
/* ⚠️ A prévia se enche DURANTE a busca: "marcados" aparece logo no começo, com o que já
   chegou. A prévia final é quando o "Buscando no PJe…" some. */
await p.getByText("Buscando no PJe…").waitFor({ timeout: 10_000 }).catch(() => {});
await p.getByText("Buscando no PJe…").waitFor({ state: "hidden", timeout: 120_000 });
await p.getByText(/marcados$/).waitFor({ timeout: 60_000 });
const marcados = (await p.getByText(/marcados$/).textContent()).trim();
const n = Number(marcados.match(/^(\d+)/)[1]);
conferir(n > 0, "a prévia tem processos novos para este subgrupo", `"${marcados}"`);

const t0 = Date.now();
let respostaDoPost = null;
p.on("response", (r) => { if (r.url().endsWith("/processos/importar")) respostaDoPost = r.status(); });
await p.getByRole("button", { name: `Importar ${n} ${n === 1 ? "processo" : "processos"}` }).click();
await p.getByText(/processos? importados?/).waitFor({ timeout: 120_000 });
const resumo = (await p.getByText(/processos? importados?/).first().textContent()).trim();
await p.screenshot({ path: "/tmp/gravacao-pelo-canal.png" });
conferir(respostaDoPost === 202, "o POST respondeu 202, sem esperar a gravação", String(respostaDoPost));
conferir(resumo.startsWith(`${n} processo`), "o resumo conta os que entraram", `"${resumo}" em ${Date.now() - t0} ms`);
conferir(quadros.some((q) => q.includes("importacao_fim")), "o fim chegou pelo canal", `${quadros.length} quadros de progresso/fim`);
conferir(quadros.some((q) => q.includes("importacao_progresso")), "a barra andou pelo canal");

console.log("");
for (const x of problemas) console.log("FALHA  " + x);
console.log(`\n${ok.filter(Boolean).length}/${ok.length} ok, ${problemas.length} problema(s) de página`);
console.log("captura: /tmp/gravacao-pelo-canal.png");
await nav.close();
process.exit(ok.filter((o) => !o).length + problemas.length ? 1 : 0);
