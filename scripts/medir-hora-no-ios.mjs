/** O campo de hora do modal de tarefa no Safari REAL do iOS (simulador), vazio e preenchido.
 *
 *   appium server --port 4723 &
 *   xcrun simctl boot <udid>
 *   UDID=<udid> APARELHO="iPhone 18 Pro" VERSAO=27.2 node scripts/medir-hora-no-ios.mjs
 *
 * Contra o dev server da porta 5174 e o `yarn offline`.
 *
 * 🔴 Por que o iOS: o Safari desenha `<input type="time">` com controle próprio, e VAZIO ele pode encolher para
 * a altura do texto (ou para zero) -- o campo some ao criar a tarefa, justamente quando a pessoa precisa dele. O
 * Chrome e o jsdom não mostram isso.
 * ⚠️ Entra pela API e grava a sessão no `localStorage`, como `services/auth.salvarTokens`: digitar no teclado do
 * simulador é o caminho lento e instável que `medir-ios.mjs` já documenta.
 */
import { abrirSafari } from "./appiumIos.mjs";

const BASE = process.env.BASE ?? "http://localhost:5174";
const API = process.env.API ?? "http://localhost:8099";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let checagens = 0;
const falhas = [];
function confere(nome, ok, detalhe = "") {
  checagens += 1;
  console.log(`${ok ? "OK   " : "FALHA"} ${nome}${ok ? "" : ` ${JSON.stringify(detalhe)}`}`);
  if (!ok) falhas.push(nome);
}

const s = await abrirSafari({ udid: process.env.UDID, aparelho: process.env.APARELHO, versao: process.env.VERSAO });
try {
  await s.ir(`${BASE}/login`);
  await espera(4000);
  await s.js(`
    var r = new XMLHttpRequest();
    r.open("POST", "${API}/login", false);
    r.setRequestHeader("Content-Type", "application/json");
    r.send(JSON.stringify({ email: "chefe@local.test", password: "Senha!Local1" }));
    var t = JSON.parse(r.responseText);
    var p = JSON.parse(atob(t.access_token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    localStorage.setItem("pje-monitor-access-token", t.access_token);
    localStorage.setItem("pje-monitor-refresh-token", t.refresh_token);
    localStorage.setItem("pje-monitor-expira-em", String(t.expira_em));
    localStorage.setItem("pje-monitor-email", t.email);
    localStorage.setItem("pje-monitor-papel", p.papel || "");
    localStorage.setItem("pje-monitor-grupo-id", p.grupo_id || "");
    return true;`);
  await s.ir(`${BASE}/agenda`);
  await espera(6000);

  const medir = () => s.js(`
    var h = document.getElementById("tf-hora"), d = document.querySelector("[role=dialog]");
    var dataBotao = document.getElementById("tf-data");
    if (!h || !d) return null;
    var rh = h.getBoundingClientRect(), rd = d.getBoundingClientRect();
    var rdata = dataBotao ? dataBotao.getBoundingClientRect() : null;
    return { altura: Math.round(rh.height), largura: Math.round(rh.width), esquerda: Math.round(rh.left),
             direita: Math.round(rh.right), dialogoEsq: Math.round(rd.left), dialogoDir: Math.round(rd.right),
             alturaDaData: rdata ? Math.round(rdata.height) : null, valor: h.value, janela: innerWidth };`);

  /* 1) Criar: o campo VAZIO. */
  await s.js(`[...document.querySelectorAll("button")].find(b => /Nova tarefa/.test(b.textContent)).click(); return true;`);
  await espera(2500);
  const vazio = await medir();
  confere("criar: o campo de hora existe no modal", Boolean(vazio), vazio);
  confere("criar: vazio, ele tem a altura do campo de data", vazio && Math.abs(vazio.altura - vazio.alturaDaData) <= 2, vazio);
  confere("criar: vazio, ele tem largura de campo (não encolheu)", vazio && vazio.largura >= 80, vazio);
  confere("criar: cabe no modal", vazio && vazio.esquerda >= vazio.dialogoEsq && vazio.direita <= vazio.dialogoDir, vazio);
  await s.js(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Cancelar").click(); return true;`);
  await espera(1500);

  /* 2) Editar: o campo PREENCHIDO, lido pela chave. */
  await s.js(`[...document.querySelectorAll("button")].find(b => /Por mês|Por semana|Por dia|Em lista/.test(b.textContent)).click(); return true;`);
  await espera(800);
  await s.js(`[...document.querySelectorAll("button")].find(b => b.textContent.trim() === "Em lista").click(); return true;`);
  await espera(3000);
  await s.js(`var e = [...document.querySelectorAll("p,span")].find(x => x.children.length === 0 && x.textContent.trim() === "23:30");
              (e.closest("button,[role=button]") || e).click(); return true;`);
  await espera(3000);
  const cheio = await medir();
  confere("editar: o campo mostra a hora gravada", cheio && cheio.valor === "23:30", cheio);
  confere("editar: preenchido, a mesma altura da data", cheio && Math.abs(cheio.altura - cheio.alturaDaData) <= 2, cheio);
  confere("editar: cabe no modal", cheio && cheio.esquerda >= cheio.dialogoEsq && cheio.direita <= cheio.dialogoDir, cheio);
} finally {
  await s.fechar().catch(() => {});
}
console.log(`\n${checagens} checagens; FALHAS: ${falhas.length ? falhas.join(", ") : "nenhuma"}`);
process.exit(falhas.length || checagens < 7 ? 1 : 0);
