/** A régua do mobile: nenhuma tela pode rolar na horizontal.
 *
 *   node scripts/medir-mobile.mjs                 todas as rotas, os quatro formatos
 *   node scripts/medir-mobile.mjs /processos      só uma rota
 *   node scripts/medir-mobile.mjs --curto         dado do stub sem esticar
 *
 * Sai com 1 quando alguma combinação de rota e formato estoura, e nomeia o
 * elemento mais largo que causou -- é isso que faz a regressão aparecer no
 * commit em que ela entra, em vez de num relato de quem usa o celular.
 *
 * Precisa do `yarn dev` no ar (5173). A API é stubada por `stubsDaApi.mjs`,
 * então não precisa de token nem de backend -- e é o MESMO stub das outras
 * verificações, não uma segunda cópia que divergiria no primeiro ajuste.
 *
 * 🔴 **Dado LONGO por padrão, e é o ponto do script.** Medi as telas com o
 * dado curto do stub e com nome de cliente de tamanho real: a Área de
 * trabalho saiu de 653px para 1421, e a Agenda de 658 para 1343. Dado bonito
 * escondia 768px de estouro. `--curto` existe só para comparar as duas
 * leituras quando um número surpreende.
 *
 * ⚠️ **Headless aqui, ao contrário de `verificar-tela.mjs`.** Lá a janela é
 * obrigatória porque o defeito era de interação e de pintura, que headless
 * não reproduz. Aqui a medida é de layout: a mesma árvore dá a mesma largura
 * nos dois modos, e um script de guarda precisa rodar sem janela.
 */
import { chromium } from "playwright";

import { fingirSessao, instalarStubs } from "./stubsDaApi.mjs";

const BASE = "http://localhost:5173";

/** Os quatro formatos que a régua cobre, medidos em aparelho de verdade.
 *
 * 🔴 O piso é 360, e não os 390 do iPhone comum: é o Android pequeno, e foi
 * a largura em que `<main>` ficou com 124px dos 360. Medir só no aparelho
 * folgado é o mesmo erro do dado curto.
 *
 * 🔴 `paisagem` não é enfeite: o iPhone 17 Pro Max deitado mede 832x334 e
 * passa do breakpoint `md`, então é a combinação em que uma regra só de
 * largura entrega o menu fixo a um aparelho de 334px de altura. */
const FORMATOS = [
  { nome: "android-pequeno", largura: 360, altura: 640 },
  { nome: "iphone-comum", largura: 390, altura: 844 },
  { nome: "ipad-mini", largura: 744, altura: 1047 },
  { nome: "paisagem", largura: 832, altura: 334 },
];

/** As 14 rotas do app autenticado, todas alimentadas por `stubsDaApi.mjs`.
 *
 * ⚠️ `/perfil`, `/financeiro` e `/clientes/:id` entraram depois das outras:
 * o stub não respondia `/me` nem `/lancamentos`, e a forma delas foi
 * CAPTURADA da API local (`yarn offline`), não deduzida -- o comentário
 * sobre isso está em `stubsDaApi.mjs`, junto dos quatro stubs novos. */
const ROTAS = [
  "/",
  "/kanban",
  "/agenda",
  "/atendimentos",
  "/processos",
  "/processos/sg-civel/08012345620258050001",
  "/clientes",
  "/documentos",
  "/historico",
  "/grupo",
  "/perfil",
  "/financeiro",
  "/clientes/cli-1",
  /* 🔴 As duas tabelas mais largas do app, e as duas últimas a entrar aqui.
     O Fluxo rola 1544px DENTRO da própria área -- a régua não pegava porque
     não abria a aba dele --, e o documento da fatura estourava 57px em 360.
     Os dois stubs que alimentam estas rotas estão em `stubsDaApi.mjs`. */
  "/financeiro?aba=fluxo",
  "/financeiro/faturas/fat-1",
  /* 🔴 **As ABAS de dentro das telas de detalhe, que a régua nunca tinha
     aberto.** Ela visitava `/processos/:n` e parava na primeira aba; as
     outras onze telas -- tarefas, movimentações, documentos, os dois do
     cliente, os do atendimento, o perfil e as seções do Financeiro -- não
     tinham medida nenhuma. Foi onde estavam as três listas que nunca haviam
     sido migradas, e nenhuma delas estourava a página: o que se mede aqui é
     o estouro, e os defeitos de lá eram de layout. Mesmo assim entram, para
     que o estouro nunca volte por ali.

     ⚠️ As abas do `/grupo` NÃO estão aqui: elas são estado local, não vão
     para a URL. Ficam em `ESTADOS`, clicadas uma a uma. */
  "/processos/sg-civel/08012345620258050001?aba=tarefas",
  "/processos/sg-civel/08012345620258050001?aba=movimentacoes",
  "/processos/sg-civel/08012345620258050001?aba=documentos",
  "/clientes/cli-1?aba=processos",
  "/clientes/cli-1?aba=documentos",
  "/atendimentos/sg-civel/at-1",
  "/atendimentos/sg-civel/at-1?aba=detalhes",
  "/atendimentos/sg-civel/at-1?aba=documentos",
  "/perfil?aba=inscricao",
  "/financeiro?aba=faturas",
  "/financeiro?aba=configuracoes",
  "/financeiro?aba=configuracoes&secao=contas",
  "/financeiro?aba=configuracoes&secao=centros",
  /* 🔴 Onde a régua acharia sozinha o maior estouro que sobrou: medido em
     375px, o cabeçalho deste detalhe punha a página em 517px numa janela de
     375, com um botão terminando 60px fora da tela. */
  "/financeiro/lancamentos/lan-1",
  "/login",
];

/** Telas em ESTADO, e não recém-abertas.
 *
 * 🔴 Existe porque a régua mentia: ela dizia 56 de 56 com o modo de seleção
 * e os modais transbordando, simplesmente porque nunca os abria. Quem achou
 * foi o usuário, olhando a tela -- que é exatamente o que um guarda deveria
 * tornar desnecessário. Medido então: a barra de seleção somava 617px numa
 * página de 390, e o rodapé de três botões do honorário saía pela esquerda
 * do próprio modal.
 *
 * ⚠️ `botoes` é uma sequência: o lançamento do Financeiro abre por um menu,
 * e só o segundo clique põe o formulário na tela. */
const ESTADOS = [
  { nome: "seleção na área de trabalho", rota: "/", botoes: ["Selecionar"] },
  { nome: "seleção no kanban", rota: "/kanban", botoes: ["Selecionar"] },
  { nome: "novo processo", rota: "/processos", botoes: ["+ Novo processo"] },
  { nome: "importar por OAB", rota: "/processos", botoes: ["Importar por OAB"] },
  { nome: "novo cliente", rota: "/clientes", botoes: ["Novo cliente"] },
  { nome: "novo documento", rota: "/documentos", botoes: ["Adicionar documento"] },
  { nome: "novo atendimento", rota: "/atendimentos", botoes: ["Adicionar atendimento"] },
  { nome: "nova tarefa", rota: "/kanban", botoes: ["Nova tarefa"] },
  { nome: "novo honorário", rota: "/financeiro", botoes: ["+ Novo lançamento", "Honorário"] },
  /* 🔴 As abas do Grupo entram por AQUI, e não por `ROTAS`: elas são
     `useState` na página, não vão para a URL, e não há endereço para
     visitar. O clique é o único jeito de chegar nelas -- e a aba é um
     `<button>`, que é o que o seletor abaixo já alcança. */
  { nome: "grupo · membros", rota: "/grupo", botoes: ["Membros"] },
  { nome: "grupo · fases", rota: "/grupo", botoes: ["Fases"] },
  { nome: "grupo · situações", rota: "/grupo", botoes: ["Situações"] },
  { nome: "grupo · inscrições na OAB", rota: "/grupo", botoes: ["Inscrições na OAB"] },
];

/** Texto do tamanho que o dado real tem.
 *
 * ⚠️ Estica a resposta do stub em vez de substituí-la: a FORMA continua
 * sendo a do repositório, e só o conteúdo cresce. Um segundo payload
 * inventado mediria outra tela. */
const LONGOS = {
  nome: "Sindicato dos Trabalhadores em Transportes Rodoviários do Estado da Bahia",
  cliente_nome: "Sindicato dos Trabalhadores em Transportes Rodoviários do Estado da Bahia",
  contraparte: "Sindicato dos Trabalhadores em Transportes Rodoviários do Estado da Bahia",
  apelido: "Ação Civil Pública de Responsabilidade por Ato de Improbidade Administrativa",
  descricao: "Honorários contratuais referentes à fase de conhecimento e recursal",
  subgrupo_nome: "Direito Administrativo e Licitações",
  fase_rotulo: "Cumprimento de sentença — fase de liquidação",
  situacao_rotulo: "Aguardando julgamento de embargos de declaração",
  ultima_mov_tipo: "Conclusos para decisão de saneamento e organização do processo",
  titulo: "Protocolar contrarrazões ao recurso de apelação da parte adversa",
};

function esticar(valor) {
  if (Array.isArray(valor)) return valor.map(esticar);
  if (valor && typeof valor === "object") {
    const fora = {};
    for (const [chave, dentro] of Object.entries(valor)) {
      if (typeof dentro === "string" && LONGOS[chave]) fora[chave] = LONGOS[chave];
      else if (chave === "cliente_nomes" && Array.isArray(dentro)) fora[chave] = dentro.map(() => LONGOS.cliente_nome);
      else fora[chave] = esticar(dentro);
    }
    return fora;
  }
  return valor;
}

/** O que a página mede de si mesma.
 *
 * ⚠️ Devolve o culpado mais ALTO da árvore, e não todos: numa tela que
 * estoura, cada filho do culpado também estoura, e uma lista de 200
 * elementos esconde o único que importa. */
function medir() {
  const raiz = document.documentElement;
  const largura = raiz.clientWidth;
  const culpados = [];
  for (const elemento of document.querySelectorAll("body *")) {
    /* ⚠️ Nada de DENTRO de um `<svg>`: `<g>` e `<path>` devolvem caixa em
       coordenadas do desenho, que passam da viewport mesmo com o `<svg>`
       pai do tamanho certo. Medido: todo ícone do menu aparecia como
       culpado de 43px, enterrando o culpado de verdade na lista. O próprio
       `<svg>` continua sendo medido -- ele é quem ocupa espaço. */
    if (elemento.closest("svg")) continue;
    const caixa = elemento.getBoundingClientRect();
    if (!caixa.width && !caixa.height) continue;
    /* ⚠️ O campo escondido por acessibilidade não conta: `CampoDeArquivo` e
       os `input` de data usam 1x1 fora da tela (`left: -70px`) para ficarem
       alcançáveis por leitor de tela sem aparecer. Eles casavam com "passa
       da viewport" pela esquerda e empurravam o culpado de verdade para
       fora dos três primeiros. Quem some assim não ocupa espaço. */
    if (caixa.width <= 4 && caixa.height <= 4) continue;
    const estilo = getComputedStyle(elemento);
    if (estilo.display === "none" || estilo.visibility === "hidden") continue;
    if (caixa.right <= largura + 1 && caixa.left >= -1) continue;
    /* 🔴 Quem está dentro de uma área que ROLA não é culpado: a tabela de
       Processos mede 2374px e não empurra nada, porque a `Table.ScrollArea`
       a recorta. Ela aparecia no topo da lista de culpados em toda tela com
       tabela, escondendo o estouro de verdade -- que numa página de 455px
       era uma linha de botões de 308. */
    let acima = elemento.parentElement;
    let recortado = false;
    while (acima && acima !== document.body) {
      if (getComputedStyle(acima).overflowX !== "visible") { recortado = true; break; }
      acima = acima.parentElement;
    }
    if (recortado) continue;
    if (culpados.some(({ el }) => el.contains(elemento))) continue;
    culpados.push({
      el: elemento,
      info: {
        tag: elemento.tagName.toLowerCase(),
        largura: Math.round(caixa.width),
        direita: Math.round(caixa.right),
        texto: (elemento.textContent || "").trim().slice(0, 45),
      },
    });
  }
  /* 🔴 **A tabela que rola DENTRO de si.** O bloco acima descarta quem está
     recortado por um ancestral que rola -- e tem de descartar, senão toda
     tela com tabela acusaria a tabela em vez do estouro de verdade. Só que
     esse descarte tinha um preço que ninguém tinha cobrado: o Fluxo de caixa
     passava 1657px da área visível, dentro da própria `ScrollArea`, e a
     régua marcava 92 de 92. Quem viu foi o usuário, olhando a tela.

     Uma tabela larga de propósito se declara envolvendo-se em
     `RolagemHorizontal`, que marca `data-larga` -- e a declaração fica lá
     porque é ele que desenha a frase, o esmaecido e a sombra que tornam a
     rolagem achável. Tabela larga SEM esses sinais continua reprovada. Toda outra que passar da própria área é
     defeito: no celular, ela é uma coluna que ninguém vai achar. */
  const tabelasQueRolam = [];
  for (const tabela of document.querySelectorAll("table")) {
    if (tabela.closest("[data-larga]")) continue;
    let rolador = tabela.parentElement;
    while (rolador && getComputedStyle(rolador).overflowX === "visible") {
      rolador = rolador.parentElement;
    }
    if (!rolador) continue;
    const passa = Math.round(tabela.scrollWidth - rolador.clientWidth);
    if (passa <= 1) continue;
    tabelasQueRolam.push({
      passa,
      largura: Math.round(tabela.scrollWidth),
      visivel: Math.round(rolador.clientWidth),
      colunas: [...tabela.querySelectorAll("thead th")]
        .map((c) => c.textContent.trim() || "·")
        .join(" | ")
        .slice(0, 70),
    });
  }

  /* ⚠️ A cortina do modal é filha do `body`, fora do `main`: medir só o
     `main` aprovaria uma folha transbordando. O `scrollWidth` já é do
     documento; o que muda aqui é só de onde sai o "renderizou". */
  const principal = document.querySelector("main");
  return {
    viewport: largura,
    pagina: raiz.scrollWidth,
    /* Quantos caracteres o `main` tem: separa "a tela coube" de "a tela não
       renderizou", que dão o mesmo `scrollWidth`. */
    texto: principal ? (principal.textContent || "").length : 0,
    culpados: culpados.map(({ info }) => info).slice(0, 3),
    tabelasQueRolam,
  };
}

/** Abre cada menu da tela e mede o painel.
 *
 * 🔴 **Existe porque a régua não abria menu nenhum.** Ela mede telas
 * recém-abertas e nove estados, e o painel de "+ Novo lançamento" nascia em
 * -29px numa tela de 390 -- 29 pixels fora dela, com os pontinhos coloridos
 * de cada opção amputados. Marcava 92 de 92. Quem viu foi o usuário.
 *
 * ⚠️ Um por vez, fechando com Escape: dois painéis abertos ao mesmo tempo
 * mediriam a posição de um com o outro por cima.
 */
async function medirMenus(pagina) {
  const gatilhos = pagina.locator('[aria-haspopup="menu"], [data-scope="menu"][data-part="trigger"]');
  const quantos = await gatilhos.count();
  const fora = [];
  for (let i = 0; i < quantos; i++) {
    const gatilho = gatilhos.nth(i);
    let rotulo = "?";
    try {
      rotulo = ((await gatilho.textContent()) || "").trim().slice(0, 28) || "(sem texto)";
      await gatilho.click({ timeout: 3000 });
      await pagina.waitForTimeout(400);
    } catch {
      continue;
    }
    const medida = await pagina.evaluate(() => {
      const painel = document.querySelector('[role="menu"]:not([hidden]), [data-scope="menu"][data-part="content"]');
      if (!painel) return null;
      const c = painel.getBoundingClientRect();
      if (!c.width) return null;
      return {
        esquerda: Math.round(c.left),
        direita: Math.round(c.right),
        largura: Math.round(c.width),
        viewport: document.documentElement.clientWidth,
      };
    });
    await pagina.keyboard.press("Escape").catch(() => {});
    await pagina.waitForTimeout(250);
    if (!medida) continue;
    if (medida.esquerda < -1) fora.push({ rotulo, ...medida, lado: "pela esquerda" });
    else if (medida.direita > medida.viewport + 1) fora.push({ rotulo, ...medida, lado: "pela direita" });
  }
  return fora;
}

const argumentos = process.argv.slice(2);
const curto = argumentos.includes("--curto");
const soEsta = argumentos.find((a) => a.startsWith("/"));
const rotas = soEsta ? [soEsta] : ROTAS;

const navegador = await chromium.launch();
const resultados = [];
const naoRenderizaram = [];

const estados = soEsta ? ESTADOS.filter((e) => e.rota === soEsta) : ESTADOS;

console.log(`\n  medindo ${rotas.length} rota(s) e ${estados.length} estado(s) em ${FORMATOS.length} formatos, dado ${curto ? "curto" : "longo"}\n`);

for (const formato of FORMATOS) {
  const contexto = await navegador.newContext({
    viewport: { width: formato.largura, height: formato.altura },
  });
  await fingirSessao(contexto);

  /* O handler que `instalarStubs` registraria, capturado para poder esticar
     a resposta depois -- ver `esticar`. */
  let responder;
  await instalarStubs({ route: (_padrao, handler) => (responder = handler) });

  await contexto.route("**/*", (rota) => {
    const pedido = rota.request();
    if (pedido.resourceType() !== "fetch" && pedido.resourceType() !== "xhr") return rota.fallback();
    return responder({
      request: () => pedido,
      fulfill: ({ json }) => rota.fulfill({ json: curto ? json : esticar(json) }),
      fallback: () => rota.fallback(),
    });
  });

  const pagina = await contexto.newPage();
  console.log(`  ${formato.nome} (${formato.largura}x${formato.altura})`);

  for (const rota of rotas) {
    await pagina.goto(`${BASE}${rota}`, { waitUntil: "networkidle" });
    /* O app hidrata depois do `networkidle` -- sem esta espera a medição
       pega a casca vazia e aprova uma tela que ainda não desenhou. */
    await pagina.waitForTimeout(900);
    const medida = await pagina.evaluate(medir);

    if (!medida.texto && rota !== "/login") {
      naoRenderizaram.push(`${formato.nome} ${rota}`);
      console.log(`    ?   ${rota.padEnd(42)} não renderizou (main vazio)`);
      continue;
    }

    const menusFora = await medirMenus(pagina);
    const coube =
      medida.pagina <= medida.viewport + 1 &&
      medida.tabelasQueRolam.length === 0 &&
      menusFora.length === 0;
    resultados.push(coube);
    console.log(
      `    ${coube ? "ok " : "✗  "} ${rota.padEnd(42)} ${String(medida.pagina).padStart(5)}px de ${medida.viewport}`,
    );
    for (const culpado of medida.pagina <= medida.viewport + 1 ? [] : medida.culpados) {
      console.log(
        `          ${culpado.tag} de ${culpado.largura}px termina em ${culpado.direita} — ${JSON.stringify(culpado.texto)}`,
      );
    }
    for (const t of medida.tabelasQueRolam) {
      console.log(
        `          tabela rola ${t.passa}px dentro de si (${t.largura} em ${t.visivel}) — ${t.colunas}`,
      );
    }
    for (const m of menusFora) {
      console.log(
        `          menu "${m.rotulo}" sai ${m.lado}: ${m.largura}px de ${m.esquerda} a ${m.direita}`,
      );
    }
  }

  for (const estado of estados) {
    await pagina.goto(`${BASE}${estado.rota}`, { waitUntil: "networkidle" });
    await pagina.waitForTimeout(900);
    let abriu = true;
    for (const rotulo of estado.botoes) {
      try {
        /* ⚠️ `button` OU `menuitem`: o lançamento do Financeiro abre por um
           menu, e o item dele não é `button`. E filtro por TEXTO CONTIDO,
           porque o nome acessível do item carrega a descrição junto
           ("HonorárioA receber de um cliente"). */
        await pagina
          .locator('button, [role="menuitem"]')
          .filter({ hasText: rotulo })
          .first()
          .click({ timeout: 4000 });
        await pagina.waitForTimeout(600);
      } catch {
        abriu = false;
        break;
      }
    }
    if (!abriu) {
      naoRenderizaram.push(`${formato.nome} ${estado.nome}`);
      console.log(`    ?   ${estado.nome.padEnd(42)} botão não encontrado`);
      continue;
    }
    const medida = await pagina.evaluate(medir);
    const coube = medida.pagina <= medida.viewport + 1 && medida.tabelasQueRolam.length === 0;
    resultados.push(coube);
    console.log(
      `    ${coube ? "ok " : "✗  "} ${estado.nome.padEnd(42)} ${String(medida.pagina).padStart(5)}px de ${medida.viewport}`,
    );
    for (const culpado of medida.pagina <= medida.viewport + 1 ? [] : medida.culpados) {
      console.log(
        `          ${culpado.tag} de ${culpado.largura}px termina em ${culpado.direita} — ${JSON.stringify(culpado.texto)}`,
      );
    }
    for (const t of medida.tabelasQueRolam) {
      console.log(
        `          tabela rola ${t.passa}px dentro de si (${t.largura} em ${t.visivel}) — ${t.colunas}`,
      );
    }
  }
  console.log("");
  await contexto.close();
}

await navegador.close();

if (naoRenderizaram.length) console.log(`  não renderizaram: ${naoRenderizaram.join(", ")}`);

const passou = resultados.length > 0 && resultados.every(Boolean) && !naoRenderizaram.length;
console.log(`\n  ${passou ? "ok" : "✗"}  ${resultados.filter(Boolean).length} de ${resultados.length} combinações couberam\n`);
process.exit(passou ? 0 : 1);
