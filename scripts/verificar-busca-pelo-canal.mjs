/** A busca por OAB em segundo plano, em Chrome de verdade: "Buscando…", os
 * processos aparecendo, a prévia no fim, e a volta depois de recarregar.
 *
 *   1) cd ../api && yarn offline          (a API da Fase 3b do balde)
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 \
 *        yarn dev --port 5174
 *   3) node scripts/verificar-busca-pelo-canal.mjs
 *
 * 🔴 **O que só o Chrome responde**: o canal WebSocket de verdade entregando as
 * páginas a um hook de verdade, e a lista crescendo na tela. O jsdom prova a
 * fusão; não prova que a mensagem chega.
 * ⚠️ A busca vai ao PJe REAL pelo despachante do offline, com a OAB que os
 * outros roteiros já usam (dado público). Nada é cadastrado: o roteiro para na
 * prévia.
 */
import { execFileSync } from "node:child_process";
import { chromium } from "playwright";

const APP = "http://localhost:5174";
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

await p.goto(APP);
await p.getByLabel(/e-?mail/i).fill("chefe@local.test");
await p.getByRole("textbox", { name: "Senha" }).fill("Senha!Local1");
await p.getByRole("button", { name: /entrar/i }).click();
await p.getByText("Resumo rápido").waitFor();

async function abrirEPreencher() {
  await p.goto(APP + "/processos");
  await p.getByRole("button", { name: /Importar por OAB/i }).click();
  /* Como uma pessoa faria: o subgrupo preenchido antes de buscar. */
  await p.waitForFunction(() => !document.getElementById("subgrupo-importacao")?.closest("[class]")?.textContent?.includes("Selecione"));
  await p.getByRole("textbox", { name: /Número da OAB/ }).fill(OAB.numero);
  await p.getByRole("combobox", { name: /UF da OAB/ }).fill(OAB.uf);
  await p.keyboard.press("Enter");
}

/* 🔴 SEM espera: `textContent()` de um elemento ausente espera 30 s. A primeira
   versão media "prévia aos 30 s" -- era o medidor parado, e a busca levava 1,3 s. */
const contagem = async () => {
  const alvo = p.getByText(/encontrados? até agora/);
  if ((await alvo.count()) === 0) return 0;
  const t = await alvo.first().textContent();
  return t ? Number(t.match(/\d+/)[0]) : 0;
};
const naPrevia = () => p.getByText(/marcados$/).isVisible().catch(() => false);

// 1. a busca inteira
await abrirEPreencher();
const t0 = Date.now();
await p.getByRole("button", { name: "Buscar processos" }).click();
/* ⚠️ Com o despachante acordado a busca inteira leva ~1,3 s: o "Buscando" existe
   por pouco tempo, e esperar por ele pode perder a janela. Vale ter aparecido OU
   a prévia já estar na tela. */
const viuBuscando = await p.getByText("Buscando no PJe…").waitFor({ timeout: 5000 }).then(() => true, () => false);
conferir(viuBuscando || (await naPrevia()), "o 'Buscando no PJe…' aparece (ou a busca já acabou)", `${Date.now() - t0} ms depois do clique`);

let primeiro = null;
let ultimaContagem = 0;
while (!(await naPrevia()) && Date.now() - t0 < 120_000) {
  const n = await contagem();
  if (n > 0 && primeiro === null) {
    primeiro = Date.now() - t0;
    await p.screenshot({ path: "/tmp/busca-pelo-canal-andando.png" });
  }
  ultimaContagem = Math.max(ultimaContagem, n);
  await p.waitForTimeout(250);
}
const noFim = Date.now() - t0;
/* ⚠️ Esta OAB cabe numa página: a página e o fim chegam juntos, e ver processos
   ANTES da prévia é sorte de amostragem. O "andando" se prova no passo 3. */
console.log(`       (processos vistos antes da prévia: ${primeiro !== null ? `sim, o 1º aos ${primeiro} ms` : "não -- uma página só"})`);
conferir(await naPrevia() && noFim < 20_000, "a prévia aparece no fim, bem abaixo do teto antigo de 18 s + Gateway", `aos ${noFim} ms`);
await p.screenshot({ path: "/tmp/busca-pelo-canal-previa.png" });
const marcados = await p.getByText(/marcados$/).textContent();
conferir(/24 de 24/.test(marcados), "a prévia tem os 24 processos da OAB", `"${marcados.trim()}"${ultimaContagem ? `, ${ultimaContagem} vistos buscando` : ""}`);
conferir(!(await p.getByText("Buscando no PJe…").isVisible()), "o par negativo: 'Buscando' sumiu com a prévia");

// 2. recarregar no meio e voltar
await abrirEPreencher();
await p.getByRole("button", { name: "Buscar processos" }).click();
await p.getByText("Buscando no PJe…").waitFor({ timeout: 5000 });
/* ⚠️ Recarrega DEPOIS do 202: o "Buscando" aparece no clique, antes da resposta,
   e uma recarga antes dela não tem id nenhum para retomar. */
const t202 = Date.now();
await p.waitForFunction(() => Object.keys(sessionStorage).some((k) => k.startsWith("argos:busca-por-oab:")), null, { timeout: 30_000 });
console.log(`       (o 202 com o id chegou ${Date.now() - t202} ms depois do "Buscando")`);
await p.reload();
await p.getByRole("button", { name: /Importar por OAB/i }).click();
const t1 = Date.now();
while (!(await naPrevia()) && Date.now() - t1 < 120_000) await p.waitForTimeout(250);
conferir(await naPrevia(), "recarregada no meio, a tela reaberta volta ao resultado", `${Date.now() - t1} ms depois de reabrir`);

// 3. a lista crescendo, página a página, pelo canal DE VERDADE
/* ⚠️ A OAB acima cabe numa página (78 comunicações, 100 por página): a página e o
   fim chegam juntos, e a lista nunca aparece "andando". Aqui as duas rotas da
   busca são interceptadas (o POST devolve um id nosso; o GET diz "na fila" até
   liberarmos) e as páginas saem pelo mesmo `ws_canal_service.publicar` do
   despachante -- o hook e o WebSocket são os de verdade; só o conteúdo é sintético. */
const cnj = (seq) => {
  const base = BigInt(`${String(seq).padStart(7, "0")}20248210001`);
  return `${String(seq).padStart(7, "0")}${String(98n - ((base * 100n) % 97n)).padStart(2, "0")}20248210001`;
};
const linha = (seq, n) => ({ numero_processo: cnj(seq), apelido: `Processo ${seq}`, tribunal: "TJRS",
  comunicacoes: n, ja_existe: false, noutros_subgrupos: [], em_outro_subgrupo: false, removido_antes: false });
const ID = "sintetico-" + Date.now();
let liberado = false;
await p.route(/buscar-por-oab$/, (r) => r.fulfill({ status: 202, contentType: "application/json", body: JSON.stringify({ trabalho_id: ID }) }));
await p.route(new RegExp(`buscas/${ID}$`), (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(
  liberado
    ? { trabalho_id: ID, estado: "concluido", id: "b".repeat(32), total_encontrado: 4, atingiu_o_teto: false,
        processos: [linha(1, 3), linha(2, 4), linha(3, 2), linha(4, 1)] }
    : { trabalho_id: ID, estado: "na_fila" }) }));
const publicar = (processos) => execFileSync("bash", ["-c",
  `cd ../api && AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=locallocal AWS_DEFAULT_REGION=sa-east-1 ` +
  `AWS_ENDPOINT_URL_DYNAMODB=http://localhost:8000 CONEXOES_TABLE=pje-monitor-conexoes-local ` +
  `WEBSOCKET_ENDPOINT=http://localhost:8098 .venv/bin/python -c 'import json,sys; ` +
  `from src.services import ws_canal_service as w; ` +
  `print(w.publicar("chefe@local.test", json.loads(sys.argv[1])))' '${JSON.stringify(processos)}' 2>/dev/null`]).toString().trim();
const linhas = () => p.getByText(/^Processo \d+$/).count();
await abrirEPreencher();
await p.getByRole("button", { name: "Buscar processos" }).click();
await p.getByText("Buscando no PJe…").waitFor();
await p.waitForTimeout(500);
const e1 = publicar({ tipo: "importacao_busca", trabalho_id: ID, processos: [linha(1, 3), linha(2, 1)] });
await p.waitForTimeout(800);
const depois1 = [await contagem(), await linhas()];
await p.screenshot({ path: "/tmp/busca-pelo-canal-pagina1.png" });
const e2 = publicar({ tipo: "importacao_busca", trabalho_id: ID, processos: [linha(2, 4), linha(3, 2), linha(4, 1)] });
await p.waitForTimeout(800);
const depois2 = [await contagem(), await linhas()];
await p.screenshot({ path: "/tmp/busca-pelo-canal-pagina2.png" });
conferir(depois1[0] === 2 && depois1[1] === 2, "a 1ª página desenha 2 processos", `${JSON.stringify(depois1)}, entregue a ${e1} conexão(ões)`);
conferir(depois2[0] === 4 && depois2[1] === 4, "a 2ª página FUNDE: 4, e não 5 (o processo 2 foi substituído)", `${JSON.stringify(depois2)}, entregue a ${e2}`);
conferir(!(await naPrevia()), "o par negativo: sem o fim, continua buscando");
liberado = true;
const tFim = Date.now();
publicar({ tipo: "importacao_busca_fim", trabalho_id: ID });
while (!(await naPrevia()) && Date.now() - tFim < 10_000) await p.waitForTimeout(100);
const final = await p.getByText(/marcados$/).textContent().catch(() => "");
conferir(/4 de 4 marcados/.test(final ?? ""), "o fim pelo canal traz a prévia (relida pelo GET)", `"${final?.trim()}" em ${Date.now() - tFim} ms`);

console.log("");
for (const x of problemas) console.log("FALHA  " + x);
console.log(`\n${ok.filter(Boolean).length}/${ok.length} ok, ${problemas.length} problema(s) de página`);
console.log("capturas: /tmp/busca-pelo-canal-{andando,previa,pagina1,pagina2}.png");
await nav.close();
process.exit(ok.filter((o) => !o).length + problemas.length ? 1 : 0);
