/** O lido do Histórico em Chrome de verdade, com a lista CHEIA.
 *
 *   1) cd ../api && yarn offline
 *   2) semear uma lista cheia de envios não lidos para o chefe@local.test (mais de 99, para a pílula crescer)
 *   3) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 yarn dev --port 5174 --strictPort
 *   4) node scripts/verificar-lido-do-historico.mjs
 *
 * 🔴 Por que Chrome e não jsdom: o destaque da linha, o anel do lido e a pílula que cresce com o número são COR, PESO e
 * MEDIDA -- o jsdom não calcula nenhum dos três, e já deu "passou" em tela quebrada neste projeto.
 *
 * ⚠️ Os números esperados vêm da API, na hora, e não de um valor fixo: a semente local muda de uma rodada para outra,
 * e um roteiro que compara com constante passa a acusar a semente, e não a tela.
 */
import { chromium } from "playwright";

const APP = process.env.APP_URL ?? "http://localhost:5174";
const API = process.env.API_URL ?? "http://localhost:8099";
const CONTA = { email: "chefe@local.test", senha: "Senha!Local1" };
const SAIDA = process.env.SAIDA ?? "/tmp/verificar-lido-do-historico.png";
const fmt = (n) => n.toLocaleString("pt-BR");

async function api(caminho, token, metodo = "GET") {
  const r = await fetch(`${API}${caminho}`, { method: metodo, headers: { Authorization: `Bearer ${token}` } });
  return r.json();
}
const { access_token: token } = await (
  await fetch(`${API}/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: CONTA.email, password: CONTA.senha }) })
).json();

const navegador = await chromium.launch({ channel: "chrome", headless: false, slowMo: 30 });
const pagina = await (await navegador.newContext({ viewport: { width: 1500, height: 980 } })).newPage();
const problemas = [];
pagina.on("pageerror", (e) => problemas.push(`erro de página: ${e.message.slice(0, 140)}`));
pagina.on("response", (r) => {
  const p = new URL(r.url()).pathname;
  if (r.status() >= 400 && !p.includes("favicon")) problemas.push(`${r.status()} ${p}`);
});
const checagens = [];
const conferir = (ok, nome, detalhe = "") => {
  checagens.push({ ok, nome });
  console.log(`${ok ? "✅" : "❌"} ${nome}${detalhe ? ` -- ${detalhe}` : ""}`);
};
const esperarTexto = async (fn, esperado, ms = 6000) => {
  const fim = Date.now() + ms;
  let atual;
  while (Date.now() < fim) {
    atual = await fn();
    if (atual === esperado) return atual;
    await pagina.waitForTimeout(150);
  }
  return atual;
};
const contadorDoMenu = () => pagina.locator('nav a[href="/historico"] [data-contador]').textContent({ timeout: 500 }).catch(() => null);

await pagina.goto(APP, { waitUntil: "networkidle" });
await pagina.getByLabel(/e-mail/i).fill(CONTA.email);
await pagina.getByRole("textbox", { name: "Senha" }).fill(CONTA.senha);
await pagina.getByRole("button", { name: /entrar/i }).click();
await pagina.waitForURL((u) => !u.pathname.includes("login"), { timeout: 20000 });

// ── o contador do menu
const n0 = (await api("/historico/nao-lidos", token)).nao_lidos;
conferir(n0 > 99, "a semente tem mais de 99 não lidos", String(n0));
conferir((await esperarTexto(contadorDoMenu, fmt(n0))) === fmt(n0), "o menu mostra o número exato, com milhar", fmt(n0));
const pilula = pagina.locator('nav a[href="/historico"] [data-contador]');
const estilo = await pilula.evaluate((el) => {
  const c = getComputedStyle(el);
  const link = el.closest("a").getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return { fundo: c.backgroundColor, cor: c.color, dentro: r.right <= link.right + 0.5, altura: link.height };
});
conferir(estilo.fundo === "rgb(0, 79, 122)" && estilo.cor === "rgb(255, 255, 255)", "a pílula é brand.darker com texto branco", `${estilo.fundo} / ${estilo.cor}`);
conferir(estilo.dentro, "a pílula cabe no item do menu");
const alturaProcessos = await pagina.locator('nav a[href="/processos"]').evaluate((el) => el.getBoundingClientRect().height);
conferir(Math.abs(estilo.altura - alturaProcessos) < 1, "o item do Histórico tem a mesma altura dos outros", `${estilo.altura} x ${alturaProcessos}`);
conferir(
  (await pagina.locator('nav a[href="/historico"]').getAttribute("aria-label")) === `Histórico, ${fmt(n0)} envios não lidos`,
  "o nome do link diz quantos não lidos",
);

// ── a lista: a linha não lida e a lida
await pagina.locator('nav a[href="/historico"]').click();
await pagina.waitForSelector("[data-lido]", { timeout: 20000 });
const estiloDaLinha = (lido) =>
  pagina.locator(`[data-lido="${lido}"]`).first().evaluate((el) => {
    const titulo = el.querySelector("p") ?? el.querySelector("div div");
    const ponto = el.firstElementChild;
    return { fundo: getComputedStyle(el).backgroundColor, peso: getComputedStyle(titulo).fontWeight, sombra: getComputedStyle(ponto).boxShadow };
  });
const naoLida = await estiloDaLinha("false");
const lida = await estiloDaLinha("true");
conferir(naoLida.fundo === "rgb(247, 251, 254)", "a linha não lida tem o fundo azulado", naoLida.fundo);
conferir(lida.fundo === "rgba(0, 0, 0, 0)", "a linha lida não tem fundo", lida.fundo);
conferir(Number(naoLida.peso) > Number(lida.peso), "o título não lido é mais pesado que o lido", `${naoLida.peso} x ${lida.peso}`);
conferir(lida.sombra.includes("inset") && !naoLida.sombra.includes("inset"), "o lido é anel, o não lido é ponto cheio");

// ── o resumo e as contagens do filtro, contra a API com o mesmo filtro da tela (abre em Movimentações)
const comFiltro = await api("/historico?tipo_envio=movimentacao&tamanho_pagina=10", token);
const c = comFiltro.contagens_da_leitura;
const resumo = await pagina.getByText(/^Mostrando/).textContent();
conferir(resumo.endsWith(`· ${fmt(c.nao_lidos)} não lidos`), "o resumo traz os não lidos exatos", resumo);
await pagina.getByRole("button", { name: "Lidos e não lidos" }).click();
const opcoes = await pagina.getByRole("menuitem").allTextContents();
conferir(
  opcoes.some((o) => o.endsWith(fmt(c.total))) && opcoes.some((o) => o.endsWith(fmt(c.nao_lidos))) && opcoes.some((o) => o.endsWith(fmt(c.lidos))),
  "o menu mostra a contagem de cada opção",
  opcoes.join(" | "),
);
await pagina.getByRole("menuitem", { name: /Só não lidos/ }).click();
await pagina.waitForFunction(() => document.querySelectorAll('[data-lido="true"]').length === 0 && document.querySelectorAll('[data-lido="false"]').length > 0);
conferir(await pagina.getByRole("button", { name: `Só não lidos · ${fmt(c.nao_lidos)}` }).isVisible(), "a pílula ligada mostra o número dela");

// ── abrir é ler: o contador desce, e com "Só não lidos" a linha fica
const linhas = pagina.locator("[data-lido]");
const quantasAntes = await linhas.count();
await linhas.first().click();
await pagina.getByText("Detalhes do envio").waitFor();
await pagina.keyboard.press("Escape");
conferir((await linhas.first().getAttribute("data-lido")) === "true", "a linha aberta vira lida e continua na lista");
conferir((await linhas.count()) === quantasAntes, "a lista não perdeu a linha aberta", `${quantasAntes}`);
conferir((await esperarTexto(contadorDoMenu, fmt(n0 - 1))) === fmt(n0 - 1), "o contador do menu desce um", fmt(n0 - 1));

// ── pelo teclado
await linhas.nth(1).focus();
await pagina.keyboard.press("Enter");
conferir(await pagina.getByText("Detalhes do envio").isVisible(), "Enter na linha abre o envio");
await pagina.keyboard.press("Escape");
await esperarTexto(contadorDoMenu, fmt(n0 - 2));
await pagina.screenshot({ path: SAIDA, fullPage: false });

// ── marcar todos e Desfazer
await pagina.getByRole("button", { name: "Marcar todos como lidos" }).click();
const aviso = pagina.getByText(/marcados? como lidos?, inclusive os fora dos filtros\./);
conferir(await aviso.isVisible({ timeout: 8000 }).catch(() => false), "o aviso diz que inclui os fora dos filtros");
const depois = (await api("/historico/nao-lidos", token)).nao_lidos;
conferir((await esperarTexto(contadorDoMenu, depois === 0 ? null : fmt(depois))) === (depois === 0 ? null : fmt(depois)), "o contador do menu acompanha", String(depois));
if (depois === 0) conferir(await pagina.getByRole("button", { name: "Tudo lido" }).isDisabled(), "sem não lidos, o botão diz Tudo lido e desabilita");
await pagina.getByRole("button", { name: "Desfazer" }).click();
conferir((await esperarTexto(contadorDoMenu, fmt(n0 - 2))) === fmt(n0 - 2), "o Desfazer devolve o contador", fmt(n0 - 2));

await navegador.close();
for (const p of problemas) console.log(`⚠️  ${p}`);
const falhas = checagens.filter((x) => !x.ok).length;
console.log(`\n${checagens.length - falhas}/${checagens.length} ok${problemas.length ? `, ${problemas.length} respostas/erros a olhar` : ""}; captura em ${SAIDA}`);
process.exit(falhas || problemas.length ? 1 : 0);
