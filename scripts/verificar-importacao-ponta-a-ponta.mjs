/** A importação por OAB INTEIRA, pela tela, em PRODUÇÃO -- num grupo de teste.
 *
 *   node scripts/verificar-importacao-ponta-a-ponta.mjs EMAIL SENHA
 *
 * 🔴 **A Fase 5 do `PLANO_BALDE_DO_PJE`**: a busca pela fila alta com os processos
 * aparecendo, a gravação pelo `gravador` com a barra, e o resumo -- a cadeia inteira
 * que só a produção tem (IAM das filas, o despachante com reserva 1, o canal real).
 * 🔴 **Num grupo de teste, NUNCA no escritório real**: a conta é a do grupo fundado
 * por `POST /usuarios` para a conferência, e o grupo sai depois por
 * `api/scripts/apagar_grupo_de_conferencia.py` (que deixa as comunicações de números
 * que outro grupo acompanha).
 * ⚠️ Nada de dado de pessoa no console: só números e o que decide cada afirmação.
 */
import { chromium } from "playwright";

const [EMAIL, SENHA] = process.argv.slice(2);
if (!EMAIL || !SENHA) {
  console.error("uso: node scripts/verificar-importacao-ponta-a-ponta.mjs EMAIL SENHA");
  process.exit(2);
}
const APP = "https://argos-monitor.vercel.app";
const OAB = { numero: "206876", uf: "MG" };
const nav = await chromium.launch({ channel: "chrome", headless: false });
const p = await (await nav.newContext({ viewport: { width: 1440, height: 950 } })).newPage();
const problemas = [];
p.on("pageerror", (e) => problemas.push("erro de página: " + e.message.slice(0, 100)));
p.on("console", (m) => { if (m.type() === "error" && /Content Security|WebSocket/.test(m.text())) problemas.push(m.text().slice(0, 120)); });
const canal = { pagina: 0, fimDaBusca: 0, progresso: 0, fimDaGravacao: 0 };
p.on("websocket", (ws) => ws.on("framereceived", (f) => {
  const s = String(f.payload);
  if (s.includes('"importacao_busca"')) canal.pagina++;
  if (s.includes("importacao_busca_fim")) canal.fimDaBusca++;
  if (s.includes("importacao_progresso")) canal.progresso++;
  if (s.includes('"importacao_fim"')) canal.fimDaGravacao++;
}));
const ok = [];
const conferir = (o, n, d = "") => { ok.push(o); console.log(`${o ? "  ok  " : "FALHA "} ${n}${d ? " -- " + d : ""}`); };

await p.goto(APP);
await p.getByLabel(/e-?mail/i).fill(EMAIL);
await p.getByRole("textbox", { name: "Senha" }).fill(SENHA);
await p.getByRole("button", { name: /entrar/i }).click();
await p.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20_000 });
await Promise.all([
  p.waitForResponse((r) => new URL(r.url()).pathname.endsWith("/subgrupos") && r.ok()),
  p.goto(APP + "/processos"),
]);
await p.getByRole("button", { name: /Importar por OAB/i }).click();
await p.getByRole("textbox", { name: /Número da OAB/ }).fill(OAB.numero);
await p.getByRole("combobox", { name: /UF da OAB/ }).fill(OAB.uf);
await p.keyboard.press("Enter");

const t0 = Date.now();
await p.getByRole("button", { name: "Buscar processos" }).click();
/* ⚠️ A prévia se enche DURANTE a busca: "marcados" aparece logo no começo, com o que já
   chegou. A prévia final é quando o "Buscando no PJe…" some. */
await p.getByText("Buscando no PJe…").waitFor({ timeout: 10_000 }).catch(() => {});
await p.getByText("Buscando no PJe…").waitFor({ state: "hidden", timeout: 120_000 });
await p.getByText(/marcados$/).waitFor({ timeout: 60_000 });
const marcados = (await p.getByText(/marcados$/).textContent()).trim();
const n = Number(marcados.match(/^(\d+)/)[1]);
conferir(n > 0, "a busca pela fila alta traz a prévia", `"${marcados}" em ${Date.now() - t0} ms`);
conferir(canal.pagina >= 1 && canal.fimDaBusca === 1, "as páginas e o fim chegaram pelo canal", JSON.stringify(canal));

const t1 = Date.now();
await p.getByRole("button", { name: `Importar ${n} ${n === 1 ? "processo" : "processos"}` }).click();
await p.getByText(/processos? importados?/).first().waitFor({ timeout: 120_000 });
const resumo = (await p.getByText(/processos? importados?/).first().textContent()).trim();
conferir(resumo.startsWith(`${n} processo`), "a gravação pelo gravador termina com o resumo", `"${resumo}" em ${Date.now() - t1} ms`);
conferir(canal.progresso >= 1 && canal.fimDaGravacao === 1, "a barra e o fim da gravação chegaram pelo canal", JSON.stringify(canal));

/* ⚠️ Espera o número MUDAR: a lista já estava na tela com o valor de antes, e ler o
   primeiro texto pegava o "0 de 0" velho -- o medidor, e não a tela. */
const t2 = Date.now();
await p.getByRole("button", { name: "Ver os processos" }).click();
let mostrando = "";
while (Date.now() - t2 < 20_000) {
  mostrando = ((await p.getByText(/Mostrando \d+ de \d+ processos/).textContent().catch(() => "")) ?? "").trim();
  if (new RegExp(`de ${n} processos`).test(mostrando)) break;
  await p.waitForTimeout(300);
}
conferir(new RegExp(`de ${n} processos`).test(mostrando), "a lista mostra os importados", `"${mostrando}" em ${Date.now() - t2} ms`);
await p.screenshot({ path: "/tmp/importacao-ponta-a-ponta.png" });

console.log("");
for (const x of problemas) console.log("FALHA  " + x);
console.log(`\n${ok.filter(Boolean).length}/${ok.length} ok, ${problemas.length} problema(s) de página`);
await nav.close();
process.exit(ok.filter((o) => !o).length + problemas.length ? 1 : 0);
