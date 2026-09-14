/** A linha do tempo do atendimento, 20 por vez -- em Chrome de verdade.
 *
 *   1) cd ../api && yarn offline
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 \
 *        yarn dev --port 5174
 *   3) node scripts/verificar-registros-do-atendimento.mjs
 *
 * Cria no offline um atendimento com 45 registros, confere a tela contra as
 * medidas do desenho aprovado (`.anteriores`, `.registro.chegou`) e exclui o
 * atendimento no fim, pela própria tela.
 *
 * 🔴 O que só Chrome responde: se "Ver registros anteriores" mantém na vista
 * o registro que a pessoa lia (jsdom não desenha, e lá a posição é simulada) e
 * se o keyframe do tema chega ao registro que acendeu.
 */
import { chromium } from "playwright";

const APP = "http://localhost:5174";
const API = "http://localhost:8099";
const CONTA = { email: "chefe@local.test", senha: "Senha!Local1" };
const SUBGRUPO = "sub-g-alfa";
const CLIENTE = "cli-g-alfa";
const QUANTOS = 45;

const checagens = [];
const conferir = (ok, nome, detalhe = "") => {
  checagens.push({ ok, nome });
  console.log(`${ok ? "  ok  " : "FALHA "} ${nome}${detalhe && !ok ? ` -- ${detalhe}` : ""}`);
};

async function api(metodo, rota, token, corpo) {
  const r = await fetch(API + rota, {
    method: metodo,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  return { status: r.status, corpo: r.status === 204 ? null : await r.json() };
}

// ─────────────────────────── semente
const { corpo: sessao } = await api("POST", "/login", null, { email: CONTA.email, password: CONTA.senha });
const texto = (i) =>
  i % 7 === 3
    ? `Registro ${String(i).padStart(2, "0")}: cliente ligou.\nPediu retorno sobre a minuta e a simulação com IGP-M e IPCA.`
    : `Registro ${String(i).padStart(2, "0")}`;
const criado = await api("POST", "/atendimentos", sessao.access_token, {
  subgrupo_id: SUBGRUPO, assunto: "Verificação da linha do tempo", cliente_ids: [CLIENTE], primeiro_registro: texto(0),
});
if (criado.status !== 201) throw new Error(`não criou o atendimento: ${criado.status}`);
const ATENDIMENTO = criado.corpo.atendimento_id;
for (let i = 1; i < QUANTOS; i++) {
  const r = await api("POST", `/subgrupos/${SUBGRUPO}/atendimentos/${ATENDIMENTO}/registros`, sessao.access_token, { texto: texto(i) });
  if (r.status !== 201) throw new Error(`registro ${i}: ${r.status}`);
}
console.log(`semeado: ${ATENDIMENTO} com ${QUANTOS} registros\n`);

const navegador = await chromium.launch({ channel: "chrome", headless: false, slowMo: 20 });
const contexto = await navegador.newContext({ viewport: { width: 1440, height: 950 } });
const pagina = await contexto.newPage();
const problemas = [];
let excluido = false;
pagina.on("pageerror", (e) => problemas.push(`erro de página: ${e.message.slice(0, 120)}`));
pagina.on("response", (r) => {
  if (r.status() >= 400 && !(excluido && r.status() === 404)) problemas.push(`${r.status()} ${new URL(r.url()).pathname}`);
});

await pagina.goto(APP);
await pagina.getByLabel(/e-?mail/i).fill(CONTA.email);
await pagina.getByRole("textbox", { name: "Senha" }).fill(CONTA.senha);
await pagina.getByRole("button", { name: /entrar/i }).click();
await pagina.getByText("Resumo rápido").waitFor();

const registros = pagina.locator("[data-registro]");
const textosNaTela = () => registros.evaluateAll((els) => els.map((el) => el.querySelector("p")?.textContent?.split(":")[0] ?? ""));
const estilo = (loc, props) =>
  loc.evaluate((el, ps) => Object.fromEntries(ps.map((p) => [p, getComputedStyle(el)[p]])), props);

// ─────────────────────────── abre com os 20 mais recentes
await pagina.goto(`${APP}/atendimentos/${SUBGRUPO}/${ATENDIMENTO}`);
await pagina.getByText(`Mostrando os 20 mais recentes de ${QUANTOS} registros`).waitFor();
conferir((await registros.count()) === 20, "abre com 20 registros");
const primeiros = await textosNaTela();
conferir(primeiros[0] === "Registro 25" && primeiros[19] === "Registro 44", "os 20 mais recentes, em ordem de escrita", primeiros.join(", "));

const botao = pagina.getByRole("button", { name: "Ver registros anteriores" });
const b = await estilo(botao, ["paddingTop", "paddingLeft", "fontSize", "lineHeight", "fontWeight", "borderTopColor", "backgroundColor", "color", "borderRadius"]);
conferir(b.paddingTop === "6px" && b.paddingLeft === "12px", "botão: padding 6px 12px", JSON.stringify(b));
conferir(b.fontSize === "12.5px" && b.lineHeight === "18px" && b.fontWeight === "700", "botão: 12.5px/18px, 700", JSON.stringify(b));
conferir(b.borderTopColor === "rgb(226, 232, 238)" && b.backgroundColor === "rgb(255, 255, 255)" && b.color === "rgb(21, 32, 41)", "botão: contorno (#e2e8ee, branco, #152029)", JSON.stringify(b));
const frase = pagina.getByText(`Mostrando os 20 mais recentes de ${QUANTOS} registros`);
const f = await estilo(frase, ["fontSize", "color", "marginTop", "marginBottom"]);
conferir(f.fontSize === "11.5px" && f.color === "rgb(132, 147, 161)", "frase: 11.5px #8493a1", JSON.stringify(f));
conferir(f.marginTop === "0px" && f.marginBottom === "0px", "frase: sem margem", JSON.stringify(f));
const topo = await estilo(botao.locator(".."), ["paddingTop", "paddingBottom", "borderBottomWidth", "borderBottomColor", "rowGap", "alignItems"]);
conferir(topo.paddingTop === "2px" && topo.paddingBottom === "12px" && topo.rowGap === "6px" && topo.alignItems === "center", "topo: 2px/12px, gap 6px, centrado", JSON.stringify(topo));
conferir(topo.borderBottomWidth === "1px" && topo.borderBottomColor === "rgb(237, 241, 244)", "topo: linha #edf1f4", JSON.stringify(topo));
const bolhaVelha = registros.first().locator("> div").last();
conferir((await estilo(bolhaVelha, ["animationName"])).animationName === "none", "registro da primeira pintura não acende");

// ─────────────────────────── a vista não pula
const lido = registros.filter({ hasText: "Registro 25" });
await lido.evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 300));
const antes = await lido.evaluate((el) => el.getBoundingClientRect().top);
await botao.click();
await pagina.getByText(`Mostrando os 40 mais recentes de ${QUANTOS} registros`).waitFor();
const depois = await lido.evaluate((el) => el.getBoundingClientRect().top);
conferir(Math.abs(depois - antes) <= 2, "o registro que se lia fica no mesmo lugar", `antes ${antes}, depois ${depois}`);
conferir((await registros.count()) === 40, "40 registros depois do primeiro clique");
const acendeu = await estilo(registros.first().locator("> div").last(), ["animationName", "animationDuration"]);
conferir(acendeu.animationName === "registro-chegou" && acendeu.animationDuration === "1.6s", "o anterior que chegou acende 1.6s", JSON.stringify(acendeu));
conferir((await estilo(lido.locator("> div").last(), ["animationName"])).animationName === "none", "o que já estava não acende de novo");
await pagina.screenshot({ path: "/tmp/claude-501/registros-40.png" });

// ─────────────────────────── até o começo, com menos movimento
await pagina.emulateMedia({ reducedMotion: "reduce" });
await botao.click();
await pagina.getByText(`Todos os ${QUANTOS} registros`).waitFor();
const todos = await textosNaTela();
conferir(todos.length === QUANTOS && todos[0] === "Registro 00" && todos[QUANTOS - 1] === "Registro 44", "todos os 45, do primeiro ao último", `${todos.length}: ${todos[0]} .. ${todos.at(-1)}`);
conferir(!(await botao.isVisible()), "sem anteriores, o botão some");
conferir((await estilo(registros.first().locator("> div").last(), ["animationName"])).animationName === "none", "com menos movimento, nada anima");
await pagina.emulateMedia({ reducedMotion: "no-preference" });

// ─────────────────────────── registrar pela tela
await pagina.getByLabel("Novo registro do atendimento").fill("Registro 45: escrito pela tela");
await pagina.getByRole("button", { name: "Adicionar registro" }).click();
await pagina.getByText(`Todos os ${QUANTOS + 1} registros`).waitFor();
const ultimoNaTela = (await textosNaTela()).at(-1);
conferir(ultimoNaTela === "Registro 45", "o registro escrito entra no fim", ultimoNaTela);
conferir((await registros.count()) === QUANTOS + 1, "a linha do tempo recarregada mantém os 46");
conferir((await estilo(registros.last().locator("> div").last(), ["animationName"])).animationName === "registro-chegou", "o escrito acende");

// ─────────────────────────── a lista mostra o último
/* ⚠️ Pela busca: a lista é alfabética, e o offline tem atendimentos de outras
   sementes -- sem ela o semeado cai na página 2. */
await pagina.goto(`${APP}/atendimentos?busca=${encodeURIComponent("Verificação da linha do tempo")}`);
const linha = pagina.getByRole("button", { name: /Verificação da linha do tempo/ });
await linha.waitFor();
conferir(await linha.getByText("Registro 45: escrito pela tela").isVisible(), "a lista mostra o último registro como prévia");

// ─────────────────────────── excluir pela tela, com a quantidade guardada
await linha.click();
await pagina.getByRole("button", { name: /Excluir/ }).click();
const dialogo = pagina.getByRole("dialog");
await dialogo.waitFor();
conferir((await dialogo.textContent()).includes(`todos os seus ${QUANTOS + 1} registros serão removidos`), "a confirmação conta os 46 guardados");
excluido = true;
await dialogo.getByRole("button", { name: "Excluir" }).click();
await pagina.waitForURL(`${APP}/atendimentos`);
const sobrou = await api("GET", `/subgrupos/${SUBGRUPO}/atendimentos/${ATENDIMENTO}/registros`, sessao.access_token);
conferir(sobrou.status === 404, "excluído: a rota dos registros responde 404", String(sobrou.status));

conferir(problemas.length === 0, "sem erro de página nem resposta 4xx/5xx inesperada", problemas.join(" | "));
await navegador.close();
const falhas = checagens.filter((c) => !c.ok);
console.log(`\n${checagens.length - falhas.length}/${checagens.length} ok`);
process.exit(falhas.length ? 1 : 0);
