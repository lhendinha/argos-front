/** O TEOR da movimentação vem por rota própria -- conferido em Chrome de verdade.
 *
 *   1) cd ../api && yarn offline
 *   2) VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 yarn dev --port 5174
 *   3) node scripts/verificar-teor-da-movimentacao.mjs
 *
 * 🔴 O que os testes de jsdom NÃO provam: que a requisição sai de verdade, com o id certo, e que o teor aparece na
 * tela. Aqui a prova é a REDE: o script escuta as chamadas do navegador.
 *
 * 🔴 As três afirmações:
 *   - abrir a LISTA não pede teor nenhum;
 *   - abrir UMA movimentação pede `/processos/<numero>/comunicacoes/<id>`, uma vez;
 *   - o teor aparece na tela.
 *
 * ⚠️ PISO DE CHECAGENS: roteiro que morre cedo imprime "FALHAS: nenhuma".
 */
import { chromium } from "playwright";

const APP = "http://localhost:5174";
const CONTA = { email: "chefe@local.test", senha: "Senha!Local1" };
const PISO_DE_CHECAGENS = 7;

const falhas = [];
let checagens = 0;
function conferir(condicao, oque) {
  checagens += 1;
  if (!condicao) {
    falhas.push(oque);
    console.log(`  ✗ ${oque}`);
  }
}

const navegador = await chromium.launch({ channel: "chrome", headless: false });
const pagina = await (await navegador.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();

/** Toda chamada ao teor, na ordem. É a prova que jsdom não dá. */
const pedidosDeTeor = [];
pagina.on("request", (r) => {
  const url = new URL(r.url());
  if (/\/processos\/\d+\/comunicacoes\/\w+/.test(url.pathname)) pedidosDeTeor.push(url.pathname);
});

await pagina.goto(APP);
await pagina.getByLabel(/e-?mail/i).fill(CONTA.email);
await pagina.getByRole("textbox", { name: "Senha" }).fill(CONTA.senha);
await pagina.getByRole("button", { name: /entrar/i }).click();
await pagina.getByText("Resumo rápido").waitFor();

/* O processo semeado do grupo do `chefe`, com 13 movimentações.
   ⚠️ Direto pela URL do detalhe, e não pela busca: a lista MASCARA o número
   (`1000476-69.2018...`), então procurar os dígitos crus nunca acha. */
const NUMERO = "10004766920184013801";
const SUBGRUPO = "0e5ed71c5b17";
await pagina.goto(`${APP}/processos/${SUBGRUPO}/${NUMERO}?aba=movimentacoes`);

const naLista = pagina.locator("text=/Intimação|Comunicação|Expedição/i").first();
await naLista.waitFor({ timeout: 15000 });
conferir(pedidosDeTeor.length === 0, `a LISTA pediu teor sem ninguém abrir: ${JSON.stringify(pedidosDeTeor)}`);

await naLista.click();
await pagina.getByText("Teor da publicação").waitFor({ timeout: 15000 });
await pagina.waitForTimeout(1200);

conferir(pedidosDeTeor.length === 1, `abrir UMA movimentação deu ${pedidosDeTeor.length} pedido(s): ${JSON.stringify(pedidosDeTeor)}`);
conferir(/\/comunicacoes\/\d+$/.test(pedidosDeTeor[0] || ""), `o pedido não levou o id: ${pedidosDeTeor[0]}`);

const carregando = await pagina.getByText("Carregando o teor…").count();
conferir(carregando === 0, "ficou parado em 'Carregando o teor…'");
const semTexto = await pagina.getByText("Esta movimentação chegou sem o texto da publicação.").count();
const comErro = await pagina.getByText("Não foi possível carregar o teor desta movimentação.").count();
conferir(comErro === 0, "a tela disse que falhou ao carregar o teor");

// O teor de verdade: algum parágrafo com texto dentro do campo.
const teor = await pagina.locator("text=Teor da publicação").locator("xpath=..").innerText();
const temTexto = teor.replace("Teor da publicação", "").trim().length > 40;
conferir(semTexto === 1 || temTexto, `o campo do teor ficou vazio: ${JSON.stringify(teor.slice(0, 120))}`);
conferir(semTexto === 0, "esta movimentação veio SEM teor -- escolha outra para a conferência valer");

console.log(`\nchecagens: ${checagens}`);
if (checagens < PISO_DE_CHECAGENS) {
  console.log(`FALHA: ${checagens} checagens, abaixo do piso de ${PISO_DE_CHECAGENS} -- o roteiro morreu no meio`);
  await navegador.close();
  process.exit(1);
}
console.log("FALHAS: " + (falhas.length ? falhas.join(", ") : "nenhuma"));
await navegador.close();
process.exit(falhas.length ? 1 : 0);
