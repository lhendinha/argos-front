/** A bateria do iOS: Safari REAL, nas duas orientações, com teclado REAL.
 *
 *   appium server --port 4723 &            # uma vez por sessão
 *   xcrun simctl boot <udid>               # o simulador precisa estar de pé
 *   node scripts/medir-ios.mjs
 *
 * Contra o dev server da porta 5174 (API local), e não produção.
 *
 * ## O que NÃO serve, e por quê -- leia antes de tentar de novo
 *
 * 🔴 **`npx playwright install webkit` NÃO controla o Safari do iOS.** Ele
 * baixa uma build do motor WebKit que roda no seu Mac, sem janela. Serve para
 * comparar layout entre motores rápido (é o que `medir-aparelhos.mjs` faz, e
 * foi assim que o estouro do iPad apareceu nos dois). Não prova comportamento
 * de Safari em iOS.
 *
 * 🔴 **`idb` é automação de APARELHO, não de navegador.** Ele boota, instala,
 * toca, digita e fotografa -- e não enxerga o DOM. Para ele o Safari é um
 * retângulo. Medido: `idb ui text` COME CARACTERE ("chefe" virou "cefe", duas
 * vezes), e tocar na barra de acessório do teclado não troca de campo. Uma
 * sessão inteira foi gasta tentando pilotar o iOS assim, por coordenada e
 * foto, antes de concluir -- erradamente -- que o iOS só permitia isso.
 *
 * ## O que serve
 *
 * Appium + driver XCUITest, com `browserName: "Safari"` e `app` vazio. Por
 * baixo roda o WebDriverAgent, um servidor WebDriver dentro do simulador. A
 * primeira sessão COMPILA o WDA e demora; as seguintes são rápidas.
 *
 * ## As cinco pedras, todas medidas nesta casa
 *
 * 🔴 **1. Existe MAIS DE UM contexto de webview, e só o ÚLTIMO está vivo.**
 * Com o teclado aberto, o primeiro respondia `visualViewport` 549 e foco no
 * e-mail -- o estado de ANTES --, e o segundo, 251 e foco na senha. Pegar o
 * primeiro faz o teste medir uma página congelada e concluir que a correção
 * não agiu. Foi defeito do instrumento, não do código.
 *
 * 🔴 **2. NÃO sonde qual contexto está vivo.** Rodar `document.hasFocus()` no
 * contexto morto trava o depurador do Safari por dois minutos e a chamada
 * volta 408. A ordem é o único sinal barato.
 *
 * 🔴 **3. `nativeWebTap` não funciona no iOS 26.** A calibração dele falha
 * com "the calibration overlay has not observed this tap yet". Fica `false`.
 *
 * 🔴 **4. O jeito de subir o teclado real é o toque NATIVO, e ele é
 * semântico.** O Safari expõe os campos da PÁGINA na árvore de acessibilidade:
 * `<input type=password>` vira `XCUIElementTypeSecureTextField` e o rótulo
 * vira o `name`. Então `name == 'Senha'` acha o campo, e o clique é de
 * elemento -- zero coordenada. Converter caixa de elemento em ponto de tela
 * também foi tentado e não serve: a webview reporta a tela inteira (y=0,
 * 375x667) e o deslocamento da barra do Safari some na conta.
 *
 * 🔴 **5. Cada `simctl openurl` abre uma ABA NOVA.** Depois de umas dez, o
 * depurador engasga e toda chamada volta 408. Por isso este roteiro derruba o
 * Safari (`simctl terminate ... com.apple.mobilesafari`) antes de cada
 * aparelho.
 *
 * ⚠️ **O teclado de software do simulador depende de uma tecla humana.**
 * Com "Connect Hardware Keyboard" ligado, o teclado não sobe -- só a barra de
 * acessório. Escrever a preferência (global ou por aparelho, em
 * `com.apple.iphonesimulator`) NÃO resolve no Xcode 26: virou estado de
 * janela. É **⇧⌘K** com a janela do Simulator em foco. Mandar o atalho por
 * `osascript` exige permissão de Acessibilidade, que não está concedida.
 *
 * ## A diferença de motor que este roteiro existe para pegar
 *
 * Medido na mesma tela de entrada, com teclado real:
 *
 * - **iOS**: o layout ENCOLHE junto (549 → 460) e o `visualViewport` vai a 274
 * - **Android**: o layout NÃO encolhe (536 fixo) e só o `visualViewport` cai,
 *   para 172
 *
 * É por isso que o piso de 180px do `useAreaVisivel` desligava a correção no
 * Android e não no iOS -- e por isso os dois precisam ser medidos.
 *
 * ➡️ O Android é mais barato e não precisa de Appium: `adb reverse tcp:5174
 * tcp:5174`, abrir o Chrome, `adb forward tcp:9222
 * localabstract:chrome_devtools_remote` e `chromium.connectOverCDP`. Dá DOM,
 * toque e teclado reais com o Playwright de sempre.
 */
import { abrirSafari } from "./appiumIos.mjs";
import { execSync } from "node:child_process";

const APARELHOS = [
  { nome: "iPhone SE", udid: "AE011249-7F69-4A97-92E8-417AAEF34BE1", modelo: "iPhone SE (3rd generation)" },
  { nome: "iPad mini", udid: "A45F8030-6D75-44D4-A8E8-0BDE5248DE5C", modelo: "iPad mini (A17 Pro)" },
];
const ROTAS = ["/", "/processos", "/clientes", "/agenda", "/financeiro", "/grupo", "/documentos"];
/** ⚠️ Dá para apontar a bateria para o BUILD:
 *   `BASE=http://localhost:4173 node scripts/medir-ios.mjs`. É o mesmo
 *   motivo da régua -- o que o aparelho recebe é o bundle, não o dev. */
const BASE = process.env.BASE ?? "http://localhost:5174";
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

for (const ap of APARELHOS) {
  execSync(`xcrun simctl bootstatus ${ap.udid} -b`, { stdio: "ignore" });
  execSync(`xcrun simctl terminate ${ap.udid} com.apple.mobilesafari || true`, { stdio: "ignore", shell: "/bin/bash" });
  await espera(2000);
  const s = await abrirSafari({ udid: ap.udid, aparelho: ap.modelo });

  for (const orientacao of ["PORTRAIT", "LANDSCAPE"]) {
    await s.orientar(orientacao).catch(() => {});
    await espera(2500);

    /* 1) o teclado, na tela de entrada */
    await s.ir(`${BASE}/login`);
    await espera(5000);
    const ler = () => s.js(`return {
      visivel: window.visualViewport ? Math.round(visualViewport.height) : null,
      layout: innerHeight, largura: innerWidth,
      focado: (document.activeElement && (document.activeElement.id||document.activeElement.type))||'(nada)',
      fim: (function(){var e=document.querySelector('#senha');return e?Math.round(e.getBoundingClientRect().bottom):null;})(),
      topo: (function(){var e=document.querySelector('#senha');return e?Math.round(e.getBoundingClientRect().top):null;})(),
      alturaDoCampo: (function(){var e=document.querySelector('#senha');return e?Math.round(e.getBoundingClientRect().height):null;})() }`);
    const antes = await ler();
    /* 🔴 **Dois predicados, e a ORDEM importa.** Por tipo é o certo -- é o
       que o Safari promete para `<input type=password>`. Mas num iPad mini
       deitado o casamento por tipo falhava e o teste dizia "NÃO SUBIU",
       enquanto o login logo abaixo, que busca por NOME, achava o mesmo campo
       e entrava. Mesmo aparelho, mesma orientação, mesmo campo. Então tenta
       o tipo e cai para o nome -- e se os dois falharem, o teste se declara
       não rodado, como já fazia. */
    /* 🔴 **O toque se CONFIRMA, e insiste uma vez.** `tocarNativo` não falha
       quando o toque não pega: para o WebDriver, achar o elemento e clicar
       deu certo -- então `.catch()` em volta dele é decorativo. Medido: o
       mesmo toque, no mesmo iPad deitado, funciona numa página recém-aberta
       (foco vai para a senha, área cai de 616 para 188) e não funciona
       dentro da bateria, depois da passagem de retrato. Conferi rota,
       contextos e a caixa do campo na árvore nativa nas quatro combinações:
       são idênticos. A causa é transitória e três hipóteses minhas já
       morreram nela -- aba errada, predicado por tipo, teclado de pé.

       ⚠️ Recarregar entre as tentativas é o que separa esta insistência de
       uma repetição cega: é a única diferença conhecida entre o caso que
       funciona e o que não funciona. */
    /* 🔴 **Os DOIS campos, e não só a senha.** A bateria media a senha e
       aprovava; o usuário tocou no E-MAIL num iPad deitado e o cartão subiu
       tanto que o campo saiu pela borda de cima. Um formulário tem mais de
       um campo, e o de cima é o que mais sobe. */
    const tocarSenha = async () => {
      await s.tocarNativo("type == 'XCUIElementTypeSecureTextField'")
        .catch(() => s.tocarNativo("name == 'Senha'"))
        .catch(() => {});
      await espera(4000);
      return ler();
    };
    let dep = await tocarSenha();
    let tentativas = 1;
    if (!(dep.focado === "senha" && dep.visivel < antes.visivel)) {
      await s.ir(`${BASE}/login`);
      await espera(4000);
      dep = await tocarSenha();
      tentativas = 2;
    }
    /* 🔴 **O teclado precisa ter SUBIDO para o resultado valer.** Nas duas
       paisagens o toque não pegou: o foco ficou no e-mail e a área visível
       não mudou -- e o teste imprimia "À VISTA", porque o campo cabia numa
       tela sem teclado. Isso não é aprovação, é teste que não rodou. */
    const subiu = dep.focado === "senha" && dep.visivel < antes.visivel;
    /* 🔴 **Os DOIS lados.** Cobrar só o de baixo aprovava campo empurrado
       para FORA por cima: medido num iPhone SE deitado, a senha terminava em
       -4 -- fora da tela -- e isto aqui dizia "À VISTA". */
    const ok =
      subiu && dep.fim != null && dep.fim <= dep.visivel + 1 && dep.topo != null && dep.topo >= -1;
    /* 🔴 **Campo mais alto que a faixa não é defeito nosso: é o iOS.** Num
       iPhone SE DEITADO o teclado come 279 dos 311px e sobram 32 -- e o
       campo tem 40. Nenhuma rolagem faz 40 caber em 32, e `scrollIntoView`
       já encosta o topo do campo no topo da faixa, que é o melhor possível.
       Marcar isso de vermelho seria mentir duas vezes: dizer que há conserto
       e enterrar as falhas de verdade no meio do ruído. Então o resultado
       sai nomeado, com os dois números, e NÃO conta como reprovação.

       ⚠️ A comparação é com a ALTURA DO CAMPO, e não com uma lista de
       aparelhos: qualquer tela que aperte assim cai na mesma regra, e
       nenhuma que tenha espaço escapa dela. */
    const naoCabe = subiu && !ok && dep.alturaDoCampo != null && dep.alturaDoCampo > dep.visivel;
    console.log(`\n  ${ap.nome} · ${orientacao === "PORTRAIT" ? "retrato" : "paisagem"} · ${antes.largura}x${antes.layout}`);
    console.log(`    senha${tentativas > 1 ? " (2ª tentativa)" : ""}: visível ${antes.visivel} → ${dep.visivel} · termina em ${dep.fim} · topo ${dep.topo} → ${!subiu ? "NÃO SUBIU (teste não rodou)" : ok ? "À VISTA" : dep.topo != null && dep.topo < -1 ? `SAIU POR CIMA (topo ${dep.topo})` : naoCabe ? `LIMITE DO iOS (campo de ${dep.alturaDoCampo}px não cabe em ${dep.visivel}px)` : "ESCONDIDO"}`);

    /* agora o campo de CIMA, com o teclado já aberto */
    await s.js("document.querySelector('#email').focus(); return true;");
    await espera(1200);
    const email = await s.js(`var e = document.querySelector('#email'); var r = e.getBoundingClientRect();
      return { topo: Math.round(r.top), fim: Math.round(r.bottom),
               visivel: window.visualViewport ? Math.round(visualViewport.height) : null };`);
    const emailOk = email.topo >= -1 && email.fim <= email.visivel + 1;
    console.log(`    e-mail: ${email.topo}..${email.fim} na faixa ${email.visivel} → ${emailOk ? "À VISTA" : email.topo < -1 ? `SAIU POR CIMA (topo ${email.topo})` : "ESCONDIDO"}`);

    /* 2) o layout, nas rotas logadas */
    /* 🔴 **O login vai por JAVASCRIPT, e o motivo é o teclado.** O toque
       nativo não erra o elemento: ele acerta as COORDENADAS dele, e quando o
       alvo está atrás do teclado quem recebe o toque é a tecla. Medido, passo
       a passo, num iPhone SE em retrato: tocar em "E-mail" funciona e sobe o
       teclado (549 → 274); digitar funciona; tocar em "Senha" NÃO muda o
       foco, e "Senha!Local1" vai parar no fim do e-mail
       (`chefe@local.testSenha!Local1`); tocar em "Entrar" acrescenta a letra
       "t" -- que é a tecla `t` do teclado, no lugar onde o botão estaria.
       Por isso as 14 medições do iPhone davam 0 de 7 rotas.

       ⚠️ Isto NÃO enfraquece a bateria. Quem prova teclado real é o passo 1,
       logo acima, que continua por toque nativo. O passo 2 mede LAYOUT em
       tela logada, e para isso o caminho até a sessão é meio, não fim.

       ⚠️ `set` nativo e evento `input`: o campo é controlado pelo React, e
       atribuir `.value` direto não avisa o estado -- o formulário submeteria
       vazio. */
    await s.ir(`${BASE}/login`);
    await espera(3500);
    const campos = await s.js("return document.querySelectorAll('input').length");
    if (campos === 2) {
      await s.js(`var set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        var e = document.querySelector('#email'), p = document.querySelector('#senha');
        set.call(e, 'chefe@local.test'); e.dispatchEvent(new Event('input', { bubbles: true }));
        set.call(p, 'Senha!Local1'); p.dispatchEvent(new Event('input', { bubbles: true }));
        var f = e.closest('form');
        var b = f.querySelector('button[type=submit]');
        if (!b) { var todos = f.querySelectorAll('button'); b = todos[todos.length - 1]; }
        b.click(); return true;`);
      await espera(6000);
    }
    let falhas = 0;
    let vazias = 0;
    for (const rota of ROTAS) {
      await s.ir(`${BASE}${rota}`);
      await espera(2500);
      const m = await s.js(`var raiz = document.documentElement; var pior = null;
        var els = document.querySelectorAll('body *');
        for (var i = 0; i < els.length; i++) { var el = els[i];
          if (el.closest('svg')) continue;
          var r = el.getBoundingClientRect(); if (!r.width) continue;
          var passa = Math.round(r.right - raiz.clientWidth);
          if (passa > 1 && (!pior || passa > pior.passa)) pior = { passa: passa, texto: (el.textContent||'').trim().slice(0,26) }; }
        return { pagina: raiz.scrollWidth, largura: raiz.clientWidth, pior: pior,
                 vazia: (document.querySelector('main')||{innerText:''}).innerText.length < 40 };`).catch(() => null);
      if (!m) continue;
      if (m.vazia) { vazias += 1; console.log(`    ?  ${rota.padEnd(13)} não renderizou`); continue; }
      if (m.pagina - m.largura > 1) { falhas += 1; console.log(`    ✗  ${rota.padEnd(13)} página ${m.pagina} de ${m.largura}${m.pior ? ` · +${m.pior.passa}px "${m.pior.texto}"` : ""}`); }
    }
    /* 🔴 **Tela que não renderizou NÃO é tela que coube.** A primeira versão
       imprimia "todas as 7 rotas couberam" logo abaixo de sete linhas de
       "não renderizou" -- o login por teclado nativo tinha falhado, tudo
       caiu de volta no /login, e o resumo deu verde. Verde falso é pior que
       vermelho: some do radar. */
    if (vazias) console.log(`    ⚠️  ${vazias} de ${ROTAS.length} rotas NÃO RENDERIZARAM -- login não completou, nada foi medido aqui`);
    else if (!falhas) console.log(`    todas as ${ROTAS.length} rotas couberam`);
  }
  await s.fechar().catch(() => {});
}
