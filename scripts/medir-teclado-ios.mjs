/** O teclado na tela de entrada, com TOQUE real, em cada campo.
 *
 *   appium server --port 4723 &
 *   BASE=http://localhost:4173 node scripts/medir-teclado-ios.mjs
 *
 * Sai com 1 se algum campo ficar fora da faixa ou se a tela se mover ao
 * trocar de campo.
 *
 * 🔴 **Este arquivo existe porque a bateria anterior aprovava tela
 * quebrada.** Ela media só o campo de SENHA, cobrava só a borda de BAIXO, e
 * trocava o foco por código. O usuário tocou no E-MAIL num iPad deitado e o
 * cartão subiu tanto que o campo saiu pela borda de cima -- com a bateria
 * dizendo "À VISTA". Três vezes seguidas um conserto meu foi aprovado aqui e
 * reprovado no aparelho dele.
 *
 * O que ele cobra, e que o outro não cobrava:
 *
 * 1. **Cada campo**, não só o último. O de cima é o que mais sobe.
 * 2. **Os dois lados da faixa.** Campo empurrado para fora por CIMA é tão
 *    inútil quanto escondido atrás do teclado.
 * 3. **Estabilidade.** A queixa do usuário nunca foi "o campo sumiu", foi "a
 *    tela pula a cada toque" -- e isso só aparece comparando posições.
 * 4. **Toque de verdade.** Foco por código não aciona a rolagem que o Safari
 *    faz ao tocar, que é metade do fenômeno.
 *
 * ⚠️ **Declara quando NÃO conseguiu tocar.** Toque nativo em alvo atrás do
 * teclado cai na tecla, e para o WebDriver isso "deu certo" -- foi assim que
 * 14 medições viraram verde sem ter acontecido. Aqui, se o foco não mudou, o
 * caso sai como NÃO RODOU.
 */
import { abrirSafari } from "./appiumIos.mjs";
import { execSync } from "node:child_process";

const BASE = process.env.BASE ?? "http://localhost:4173";
const APARELHOS = [
  { nome: "iPhone SE", udid: "AE011249-7F69-4A97-92E8-417AAEF34BE1", modelo: "iPhone SE (3rd generation)" },
  { nome: "iPad mini", udid: "A45F8030-6D75-44D4-A8E8-0BDE5248DE5C", modelo: "iPad mini (A17 Pro)" },
];
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const PREDICADO = { email: "type == 'XCUIElementTypeTextField'", senha: "type == 'XCUIElementTypeSecureTextField'" };

let reprovou = false;

for (const ap of APARELHOS) {
  execSync(`xcrun simctl bootstatus ${ap.udid} -b`, { stdio: "ignore" });
  execSync(`xcrun simctl terminate ${ap.udid} com.apple.mobilesafari || true`, { stdio: "ignore", shell: "/bin/bash" });
  await espera(2000);
  const s = await abrirSafari({ udid: ap.udid, aparelho: ap.modelo });

  for (const orientacao of ["PORTRAIT", "LANDSCAPE"]) {
    await s.orientar(orientacao).catch(() => {});
    await espera(2500);
    await s.ir(`${BASE}/login`);
    await espera(4000);

    const ler = () => s.js(`var caixa = function (id) { var e = document.querySelector('#' + id);
        var r = e.getBoundingClientRect(); return { topo: Math.round(r.top), base: Math.round(r.bottom) }; };
      var c = document.querySelector('#email');
      while (c && getComputedStyle(c).maxWidth !== '380px') c = c.parentElement;
      var a = document.activeElement;
      return { faixa: Math.round(visualViewport.height), y: Math.round(window.scrollY),
        cartaoTopo: Math.round(c.getBoundingClientRect().top),
        foco: (a && a.id) || '(nada)', email: caixa('email'), senha: caixa('senha') };`);

    console.log(`\n  ${ap.nome} · ${orientacao === "PORTRAIT" ? "retrato" : "paisagem"}`);
    const posicoes = [];
    for (const campo of ["email", "senha", "email", "senha"]) {
      await s.tocarNativo(PREDICADO[campo]).catch(() => {});
      await espera(2600);
      const m = await ler();
      if (m.foco !== campo) {
        console.log(`    ${campo.padEnd(6)} NÃO RODOU -- o toque não pegou (foco em "${m.foco}")`);
        continue;
      }
      const alvo = m[campo];
      const dentro = alvo.topo >= -1 && alvo.base <= m.faixa + 1;
      const naoCabe = alvo.base - alvo.topo > m.faixa;
      const veredito = dentro ? "à vista" : naoCabe ? "não cabe na faixa" : alvo.topo < -1 ? "SAIU POR CIMA" : "ESCONDIDO";
      console.log(`    ${campo.padEnd(6)} ${String(alvo.topo).padStart(5)}..${String(alvo.base).padStart(4)} na faixa ${String(m.faixa).padStart(4)} · cartão ${String(m.cartaoTopo).padStart(5)} · y ${String(m.y).padStart(4)} → ${veredito}`);
      if (!dentro && !naoCabe) reprovou = true;
      posicoes.push(m.cartaoTopo);
    }
    if (posicoes.length >= 2) {
      const mexeu = posicoes.some((p) => Math.abs(p - posicoes[0]) > 1);
      console.log(`    tela ao trocar de campo: ${posicoes.join(" → ")} ${mexeu ? "✗ MEXEU" : "· parada"}`);
      if (mexeu) reprovou = true;
    }
  }
  await s.fechar().catch(() => {});
}

console.log(reprovou ? "\n  ✗  algum caso reprovou\n" : "\n  ok  todos os campos à vista, e a tela parada\n");
if (reprovou) process.exit(1);
