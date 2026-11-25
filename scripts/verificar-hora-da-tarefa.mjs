/** A hora e o aviso da tarefa nas telas, medidos em Chrome com janela a 1440, 390 e 360.
 *
 *   1) cd ../api && yarn offline   (com tarefas com hora no sub-g-alfa, do chefe@local.test)
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 yarn dev --port 5174
 *   3) node scripts/verificar-hora-da-tarefa.mjs
 *
 * O que o jsdom não mede: a página não rola de lado em nenhuma largura; na lista da Agenda a coluna de hora começa
 * no MESMO x em todas as linhas (decidida pela lista inteira, não dia a dia); no modal o campo de hora e as
 * escolhas do aviso cabem dentro do modal; e a etiqueta de prazo com a hora não é cortada.
 * ⚠️ Conta as checagens e recusa verde abaixo do piso: um roteiro que morre cedo imprimiria "nenhuma falha".
 */
import { chromium } from "playwright";

const APP = "http://localhost:5174";
const CONTA = { email: "chefe@local.test", senha: "Senha!Local1" };
const PISO = 18;
let checagens = 0;
const falhas = [];

function confere(nome, ok, detalhe = "") {
  checagens += 1;
  console.log(`${ok ? "OK   " : "FALHA"} ${nome}${ok ? "" : ` ${detalhe}`}`);
  if (!ok) falhas.push(nome);
}

const navegador = await chromium.launch({ channel: "chrome", headless: false });
for (const largura of [1440, 390, 360]) {
  const pagina = await (await navegador.newContext({ viewport: { width: largura, height: 900 } })).newPage();
  await pagina.goto(APP);
  await pagina.getByLabel(/e-?mail/i).fill(CONTA.email);
  await pagina.getByRole("textbox", { name: "Senha" }).fill(CONTA.senha);
  await pagina.getByRole("button", { name: /entrar/i }).click();
  await pagina.waitForLoadState("networkidle");

  const semRolagemLateral = async (onde) => {
    const [rola, janela] = await pagina.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
    confere(`${largura}: ${onde} sem rolagem lateral`, rola <= janela, `${rola} > ${janela}`);
  };

  await pagina.goto(`${APP}/agenda`);
  await pagina.getByRole("heading", { name: "Agenda" }).waitFor();
  await pagina.getByRole("button", { name: /Por mês|Por semana|Por dia|Em lista/ }).first().click();
  await pagina.getByRole("button", { name: /^Em lista$/ }).click();
  await pagina.waitForLoadState("networkidle");
  await pagina.getByText("23:30", { exact: true }).first().waitFor();
  await semRolagemLateral("Agenda em lista");
  const colunas = await pagina.evaluate(() =>
    [...document.querySelectorAll("p, span")]
      .filter((e) => e.children.length === 0 && /^(\d\d:\d\d|Dia todo)$/.test(e.textContent.trim()))
      .map((e) => Math.round(e.getBoundingClientRect().left)));
  confere(`${largura}: coluna de hora em toda linha da lista`, colunas.length >= 3, `${colunas.length}`);
  confere(`${largura}: a coluna de hora começa no mesmo x`, new Set(colunas).size === 1, JSON.stringify([...new Set(colunas)]));

  await pagina.getByText("Audiência").filter({ hasNotText: "às" }).nth(1).click();
  const modal = pagina.getByRole("dialog");
  await modal.getByLabel("Horário", { exact: true }).waitFor();
  const cabe = await pagina.evaluate(() => {
    const dialogo = document.querySelector("[role=dialog]").getBoundingClientRect();
    const alvos = [document.getElementById("tf-hora"), ...document.querySelectorAll("[role=radiogroup] [role=radio]")];
    return alvos.filter(Boolean).every((e) => {
      const r = e.getBoundingClientRect();
      return r.left >= dialogo.left - 0.5 && r.right <= dialogo.right + 0.5;
    }) && alvos.length > 1;
  });
  confere(`${largura}: hora e escolhas do aviso cabem no modal`, cabe);
  await semRolagemLateral("modal da tarefa");
  await pagina.keyboard.press("Escape");

  await pagina.goto(`${APP}/`);
  await pagina.waitForLoadState("networkidle");
  const etiquetas = await pagina.evaluate(() =>
    [...document.querySelectorAll("span")]
      .filter((s) => /^(Hoje|Amanhã|Ontem) \d\d:\d\d$/i.test(s.textContent.trim()))
      .map((s) => ({ texto: s.textContent.trim(), cortada: s.scrollWidth > s.clientWidth + 1 })));
  confere(`${largura}: etiquetas com hora na Área de trabalho`, etiquetas.length >= 1, JSON.stringify(etiquetas));
  confere(`${largura}: nenhuma etiqueta com hora cortada`, etiquetas.every((e) => !e.cortada), JSON.stringify(etiquetas));
  await semRolagemLateral("Área de trabalho");
  await pagina.context().close();
}
await navegador.close();

console.log(`\n${checagens} checagens; FALHAS: ${falhas.length ? falhas.join(", ") : "nenhuma"}`);
process.exit(falhas.length || checagens < PISO ? 1 : 0);
