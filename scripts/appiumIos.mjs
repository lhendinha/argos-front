/** O mínimo para falar com o Safari do simulador por W3C WebDriver.
 *
 * ⚠️ `fetch` cru, sem cliente: o protocolo é HTTP e JSON, e um pacote a mais
 * no disco por meia dúzia de rotas não se paga.
 *
 * 🔴 **Dois contextos, dois trabalhos.** `WEBVIEW_*` dá DOM -- `querySelector`,
 * `visualViewport`, `activeElement`. `NATIVE_APP` dá o gesto de verdade. A
 * medida vem de um, o toque vem do outro, e nenhum dos dois precisa de
 * coordenada escolhida a dedo.
 */
const BASE = "http://localhost:4723";

async function chamar(metodo, caminho, corpo) {
  const r = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${metodo} ${caminho} → ${r.status} ${JSON.stringify(j).slice(0, 260)}`);
  return j.value;
}

export async function abrirSafari({ udid, aparelho, versao = "26.1" }) {
  const valor = await chamar("POST", "/session", {
    capabilities: {
      alwaysMatch: {
        platformName: "iOS",
        browserName: "Safari",
        "appium:automationName": "XCUITest",
        "appium:udid": udid,
        "appium:deviceName": aparelho,
        "appium:platformVersion": versao,
        /* O simulador já está de pé; sem isto o driver o reinicia. */
        "appium:noReset": true,
        "appium:newCommandTimeout": 300,
        "appium:wdaLaunchTimeout": 600000,
        "appium:wdaConnectionTimeout": 600000,
        /* ⚠️ Desligado de propósito: a calibração dele falha no iOS 26
           ("the calibration overlay has not observed this tap yet"), e não
           faz falta -- o Safari expõe os campos na árvore nativa, e clicar
           no elemento nativo é melhor que converter coordenada. */
        "appium:nativeWebTap": false,
      },
      firstMatch: [{}],
    },
  });
  const id = valor.sessionId;

  /** 🔴 **O Safari expõe MAIS DE UM contexto de webview, e só o ÚLTIMO está
   * vivo.** Medido com o teclado aberto: o primeiro respondia
   * `visualViewport` 549 e foco no e-mail -- o estado de ANTES --, e o
   * segundo respondia 251 e foco na senha. Pegar o primeiro fazia o teste
   * medir uma página congelada e concluir que a correção não agiu: defeito
   * do instrumento, não do código.
   *
   * ⚠️ E NÃO dá para sondar qual está vivo: rodar `document.hasFocus()` no
   * contexto morto trava o depurador do Safari por dois minutos e a chamada
   * volta 408. A ordem é o único sinal barato que existe aqui. */
  const web = async () => {
    const todos = (await chamar("GET", `/session/${id}/contexts`)).filter((x) => String(x).startsWith("WEBVIEW"));
    const vivo = todos[todos.length - 1];
    if (vivo) await chamar("POST", `/session/${id}/context`, { name: vivo });
    return vivo;
  };

  return {
    id,
    web,
    ir: async (url) => { await chamar("POST", `/session/${id}/url`, { url }); },
    contextos: () => chamar("GET", `/session/${id}/contexts`),
    js: async (script, args = []) => { await web(); return chamar("POST", `/session/${id}/execute/sync`, { script, args }); },
    orientar: (orientation) => chamar("POST", `/session/${id}/orientation`, { orientation }),
    /** 🔴 **O Safari expõe os campos da PÁGINA na árvore nativa.** Um
     * `<input type=password>` vira `XCUIElementTypeSecureTextField`; um campo
     * comum, `XCUIElementTypeTextField`. Clicar nele é clique de ELEMENTO --
     * zero coordenada -- e o teclado real sobe porque quem tocou foi o
     * XCUITest, e não a página. */
    tocarNativo: async (predicado) => {
      await chamar("POST", `/session/${id}/context`, { name: "NATIVE_APP" });
      const el = await chamar("POST", `/session/${id}/element`, { using: "-ios predicate string", value: predicado });
      await chamar("POST", `/session/${id}/element/${Object.values(el)[0]}/click`);
      await web();
    },
    digitarNativo: async (texto) => {
      await chamar("POST", `/session/${id}/context`, { name: "NATIVE_APP" });
      await chamar("POST", `/session/${id}/actions`, {
        actions: [{ type: "key", id: "teclado", actions: [...texto].flatMap((c) => [
          { type: "keyDown", value: c }, { type: "keyUp", value: c }]) }],
      });
      await web();
    },
    /** Diagnóstico: o que a árvore NATIVA oferece de campo e botão, com a
     * caixa de cada um -- é assim que se vê se o toque vai cair no teclado. */
    campos: async () => {
      await chamar("POST", `/session/${id}/context`, { name: "NATIVE_APP" });
      const achar = async (predicado) => {
        const els = await chamar("POST", `/session/${id}/elements`, { using: "-ios predicate string", value: predicado }).catch(() => []);
        const saida = [];
        for (const el of els) {
          const ref = Object.values(el)[0];
          const r = await chamar("GET", `/session/${id}/element/${ref}/rect`).catch(() => null);
          const nome = await chamar("GET", `/session/${id}/element/${ref}/attribute/name`).catch(() => null);
          saida.push({ nome, caixa: r && `${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)}` });
        }
        return saida;
      };
      const janela = await chamar("GET", `/session/${id}/window/rect`).catch(() => null);
      const saida = {
        janela: janela && `${Math.round(janela.width)}x${Math.round(janela.height)}`,
        seguros: await achar("type == 'XCUIElementTypeSecureTextField'"),
        textos: await achar("type == 'XCUIElementTypeTextField'"),
        teclado: await achar("type == 'XCUIElementTypeKeyboard'"),
      };
      await web();
      return saida;
    },
    fechar: () => chamar("DELETE", `/session/${id}`),
  };
}
