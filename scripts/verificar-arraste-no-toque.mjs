/** O cartão do quadro se move com o DEDO, e a coluna ainda rola.
 *
 *   node scripts/verificar-arraste-no-toque.mjs
 *
 * 🔴 Existe porque o arraste no toque passou meses sem funcionar e nenhum
 * teste acusava. Medi no Safari 26.1 e no Chrome 134: os cartões chegavam
 * com `touch-action: auto` e o `PointerSensor` ativa por DISTÂNCIA -- no
 * dedo, qualquer distância também é o começo de uma rolagem, então a página
 * rolava e o cartão ficava parado. Em jsdom o dnd-kit não arrasta, e o
 * verificador irmão (`verificar-selecao-no-kanban`) usa MOUSE: nenhum dos
 * dois alcançava este defeito.
 *
 * 🔴 **Toque de verdade, pelo CDP.** `page.touchscreen` só dá toques
 * simples, e um arraste precisa de `touchStart`, vários `touchMove` e
 * `touchEnd` com o mesmo identificador. Um `dispatchEvent` de JavaScript
 * seria um evento não confiável, que não prova nada sobre o gesto real.
 *
 * ⚠️ **Os DOIS lados, e é o que impede este script de virar um "passou" que
 * não prova nada**: segurar e arrastar MOVE o cartão; passar o dedo sem
 * segurar ROLA a coluna e NÃO move nada. Uma correção que trave a rolagem
 * para fazer o arraste funcionar reprova aqui.
 *
 * A API é stubada (`stubsDaApi.mjs`): não precisa de token nem de backend, e
 * o quadro é sempre o mesmo. Precisa do `yarn dev` no ar (5173).
 */
import { chromium } from "playwright";

import { fingirSessao, instalarStubs } from "./stubsDaApi.mjs";

const BASE = "http://localhost:5173";
/** Acima do `delay` de `ATIVACAO_DO_TOQUE`, com folga para o navegador. */
const SEGURAR = 500;

const navegador = await chromium.launch();
/* ⚠️ Tablet com toque, e não celular: em 390px a segunda coluna fica fora
   da tela, e arrastar para uma coordenada invisível não é gesto que exista
   -- ali quem move o cartão usa o "Alterar status" da barra. O que este
   script prova é o SENSOR, e para isso as duas colunas precisam caber. */
const contexto = await navegador.newContext({
  viewport: { width: 900, height: 800 },
  hasTouch: true,
});
await fingirSessao(contexto);
await instalarStubs(contexto);
const pagina = await contexto.newPage();
const erros = [];
pagina.on("pageerror", (e) => erros.push(String(e).slice(0, 120)));

/** 🔴 A prova é o PEDIDO, e não a tela depois da solta. O stub devolve
 * sempre o mesmo quadro: a mutação otimista põe o cartão na coluna nova e o
 * refetch seguinte o traz de volta, então contar cartões no DOM reprova um
 * arraste que funcionou. O que diz que o gesto virou intenção é o
 * `PATCH .../tarefas/... {coluna_id}` que sai do app. */
const movimentos = [];
pagina.on("request", (r) => {
  if (r.method() !== "PATCH" || !/\/tarefas\//.test(r.url())) return;
  try {
    const corpo = JSON.parse(r.postData() || "{}");
    if (corpo.coluna_id) movimentos.push(corpo.coluna_id);
  } catch {
    /* corpo que não é JSON não é um movimento de coluna */
  }
});

const cdp = await contexto.newCDPSession(pagina);

/** Um gesto de dedo só, do jeito que o navegador o entrega: começa, anda em
 * passos e termina. `segurar` é a pausa antes do primeiro passo -- é ela que
 * separa "arrastar" de "rolar". */
async function dedo(de, ate, { segurar = 0, passos = 12 } = {}) {
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: de.x, y: de.y, id: 1 }],
  });
  if (segurar) await pagina.waitForTimeout(segurar);
  for (let i = 1; i <= passos; i++) {
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        {
          x: de.x + ((ate.x - de.x) * i) / passos,
          y: de.y + ((ate.y - de.y) * i) / passos,
          id: 1,
        },
      ],
    });
    await pagina.waitForTimeout(25);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await pagina.waitForTimeout(700);
}

/** O dnd-kit deixa o cartão pego com `opacity: 0.4` (ver `CartaoDeTarefa`).
 * Serve para separar "o sensor não ativou" de "ativou e soltou no lugar
 * errado" -- dois defeitos com o mesmo sintoma na contagem. */
const pegou = () =>
  pagina.evaluate(() =>
    [...document.querySelectorAll('[role="button"]')].some((c) => getComputedStyle(c).opacity === "0.4"),
  );

/** O quadro como a tela o mostra: coluna -> títulos.
 *
 * ⚠️ Por GEOMETRIA, e não por ancestral comum: o cartão arrastado sai do
 * `<div>` da coluna antes de a tela assentar, e uma leitura por DOM devolvia
 * o quadro de antes. Cada cartão pertence à coluna cuja faixa horizontal
 * contém o centro dele -- que é como quem olha a tela também decide. */
const lerQuadro = () =>
  pagina.evaluate(() => {
    const cabecalhos = [...document.querySelectorAll("div")]
      .filter((d) => /^(A Fazer|Fazendo|Concluído)\d+$/.test((d.textContent || "").trim()))
      .map((d) => {
        const caixa = d.getBoundingClientRect();
        return { nome: (d.textContent || "").trim().replace(/\d+$/, ""), meio: caixa.left + caixa.width / 2, largura: caixa.width };
      });
    const colunas = Object.fromEntries(cabecalhos.map((c) => [c.nome, []]));
    for (const cartao of document.querySelectorAll('[role="button"]')) {
      const caixa = cartao.getBoundingClientRect();
      const centro = caixa.left + caixa.width / 2;
      let perto = null;
      for (const c of cabecalhos) {
        const distancia = Math.abs(c.meio - centro);
        if (!perto || distancia < perto.d) perto = { nome: c.nome, d: distancia };
      }
      if (perto) colunas[perto.nome].push((cartao.textContent || "").trim().slice(0, 28));
    }
    return colunas;
  });

const resultados = [];

await pagina.goto(`${BASE}/kanban`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(1200);

const antes = await lerQuadro();
const nomes = Object.keys(antes);
console.log(`\n  quadro: ${nomes.map((n) => `${n}(${antes[n].length})`).join(" | ")}`);
if (nomes.length < 2 || antes[nomes[0]].length === 0) {
  console.log("  ✗  o stub não deu um quadro com duas colunas e um cartão");
  await navegador.close();
  process.exit(1);
}

const cartao = pagina.locator('[role="button"]').filter({ hasText: antes[nomes[0]][0].slice(0, 12) }).first();
const origem = await cartao.boundingBox();
/* ⚠️ O alvo é um CARTÃO da coluna vizinha, e não o cabeçalho dela: todo
   `useSortable` também é área de solta, e o cabeçalho não é nem uma coisa
   nem outra -- soltar nele não é soltar na coluna. É a mesma resolução que
   `useArrastarTarefa` faz do lado do app. */
const destino = await pagina
  .locator('[role="button"]')
  .filter({ hasText: antes[nomes[1]][0].slice(0, 12) })
  .first()
  .boundingBox();

/* 1) Segurar e arrastar MOVE. */
await cdp.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: origem.x + origem.width / 2, y: origem.y + origem.height / 2, id: 9 }],
});
await pagina.waitForTimeout(SEGURAR);
const ativou = await pegou();
await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
await pagina.waitForTimeout(400);
console.log(`  ${ativou ? "ok " : "✗  "} segurando ${SEGURAR}ms, o cartão é PEGO pelo sensor`);
resultados.push(ativou);

await dedo(
  { x: origem.x + origem.width / 2, y: origem.y + origem.height / 2 },
  { x: destino.x + destino.width / 2, y: destino.y + destino.height / 2 },
  { segurar: SEGURAR },
);
const moveu = movimentos.length === 1;
console.log(`  ${moveu ? "ok " : "✗  "} segurando e arrastando, o app MOVE o cartão de coluna (${movimentos.length} PATCH com coluna_id)`);
resultados.push(moveu);

/* 2) Passar o dedo sem segurar NÃO move -- senão a correção teria trocado o
      arraste pela rolagem, que é o defeito ao contrário. */
await pagina.goto(`${BASE}/kanban`, { waitUntil: "networkidle" });
await pagina.waitForTimeout(1200);
const antesDoSegundo = movimentos.length;
const antes2 = await lerQuadro();
const cartao2 = pagina.locator('[role="button"]').filter({ hasText: antes2[nomes[0]][0].slice(0, 12) }).first();
const origem2 = await cartao2.boundingBox();
await dedo(
  { x: origem2.x + origem2.width / 2, y: origem2.y + origem2.height / 2 },
  { x: origem2.x + origem2.width / 2, y: origem2.y - 200 },
  { segurar: 0 },
);
const naoMoveu = movimentos.length === antesDoSegundo;
console.log(`  ${naoMoveu ? "ok " : "✗  "} sem segurar, o dedo rola e NÃO move (nenhum PATCH novo)`);
resultados.push(naoMoveu);

/* 3) NO CELULAR a coluna vizinha fica fora da tela, e o arraste só serve se
      a prancha rolar sozinha enquanto o dedo está na borda. Sem isto o
      sensor funciona e o gesto continua inútil no aparelho em que ele mais
      importa. */
const celular = await navegador.newContext({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await fingirSessao(celular);
await instalarStubs(celular);
const tela = await celular.newPage();
const cdpCelular = await celular.newCDPSession(tela);
await tela.goto(`${BASE}/kanban`, { waitUntil: "networkidle" });
await tela.waitForTimeout(1200);

const rolagemDaPrancha = () =>
  tela.evaluate(() => {
    const prancha = [...document.querySelectorAll("div")].find(
      (d) => getComputedStyle(d).overflowX === "auto" && d.scrollWidth > d.clientWidth + 1,
    );
    return prancha ? prancha.scrollLeft : -1;
  });

const primeiro = await tela.locator('[role="button"]').first().boundingBox();
const meio = primeiro.y + primeiro.height / 2;
await cdpCelular.send("Input.dispatchTouchEvent", {
  type: "touchStart",
  touchPoints: [{ x: primeiro.x + primeiro.width / 2, y: meio, id: 1 }],
});
await tela.waitForTimeout(SEGURAR);
for (let i = 1; i <= 8; i++) {
  await cdpCelular.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: primeiro.x + ((370 - primeiro.x) * i) / 8, y: meio, id: 1 }],
  });
  await tela.waitForTimeout(40);
}
/* Fica parado na borda: é assim que se pede "leve para a próxima coluna". */
for (let i = 0; i < 20; i++) {
  await cdpCelular.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 378, y: meio, id: 1 }] });
  await tela.waitForTimeout(80);
}
const rolou = await rolagemDaPrancha();
await cdpCelular.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
const alcanca = rolou > 20;
console.log(`  ${alcanca ? "ok " : "✗  "} no celular, a prancha rola sozinha com o dedo na borda (scrollLeft ${rolou})`);
resultados.push(alcanca);

if (erros.length) console.log(`\n  erros no console: ${[...new Set(erros)].slice(0, 3).join(" | ")}`);
await navegador.close();

const passou = resultados.every(Boolean) && !erros.length;
console.log(`\n  ${passou ? "ok" : "✗"}  ${resultados.filter(Boolean).length} de ${resultados.length}\n`);
process.exit(passou ? 0 : 1);
