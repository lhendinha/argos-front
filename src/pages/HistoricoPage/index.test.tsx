import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLocation } from "react-router-dom";

import { renderComRota } from "../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({
  listarHistorico: vi.fn(),
  /* O lido de cada pessoa: o contador do botão, marcar ao abrir, marcar todos e o Desfazer. */
  contarNaoLidosDoHistorico: vi.fn(),
  marcarEnvioComoLido: vi.fn(),
  marcarTodosComoLidos: vi.fn(),
  desfazerMarcarTodos: vi.fn(),
  /* 🔴 Rota PRÓPRIA do link do e-mail (03/09/2026). Antes o deep link usava
     `listarHistorico({ numeroProcesso })`; ela passou a PAGINAR quando o
     número virou filtro de tela, e procurar numa página devolveria "não
     encontrei" para algo que está na seguinte. */
  historicoDoProcesso: vi.fn(),
  detalhesProcesso: vi.fn(),
  teorDaMovimentacao: vi.fn(),
  listarSubgrupos: vi.fn(),
}));

vi.mock("../../services", async (importOriginal) => {
  const real = await importOriginal<typeof import("../../services")>();
  return {
    ...real,
    listarHistorico: mocks.listarHistorico,
    historicoDoProcesso: mocks.historicoDoProcesso,
    detalhesProcesso: mocks.detalhesProcesso,
    teorDaMovimentacao: mocks.teorDaMovimentacao,
    /* ⚠️ Entrou quando a linha passou a mostrar o subgrupo: sem mock, o
       catálogo era uma chamada de rede de verdade dentro do teste. */
    listarSubgrupos: mocks.listarSubgrupos,
    contarNaoLidosDoHistorico: mocks.contarNaoLidosDoHistorico,
    marcarEnvioComoLido: mocks.marcarEnvioComoLido,
    marcarTodosComoLidos: mocks.marcarTodosComoLidos,
    desfazerMarcarTodos: mocks.desfazerMarcarTodos,
  };
});

import HistoricoPage from "./index";
import { ApiError } from "../../services";
import { LEITURA_LIDOS, LEITURA_NAO_LIDOS } from "../../constants";
import type { OpcoesListarHistorico } from "../../types";

/** Espelha a query string na tela.
 *
 * 🔴 `renderComRota` monta um `MemoryRouter`: a URL vive na memória do
 * roteador e o `window.location` do jsdom NUNCA muda. Uma asserção sobre
 * `window.location.search` passa em falso -- ela compara `""` com `""` e diz
 * que o filtro foi para o endereço mesmo quando nada foi. Mesma sonda de
 * `useEstadoNaUrl.test.tsx`. */
function SondaDeUrl() {
  return <div data-testid="url">{useLocation().search || "(sem query)"}</div>;
}

const urlDaSonda = () => screen.getByTestId("url").textContent;

const ITEM = {
  numero_processo: "00002668720218130559",
  enviado_em: "2026-08-15T03:02:13.990064+00:00",
  tipo_comunicacao: "Intimação",
  nome_orgao: "Vara Única",
  comunicacao_id: 671027498,
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.detalhesProcesso.mockResolvedValue({ comunicacoes: [], processos: [] });
  mocks.teorDaMovimentacao.mockResolvedValue({ comunicacao_id: 1, texto: "", apelido: null });
  mocks.listarHistorico.mockResolvedValue({ historico: [ITEM], total: 1, total_paginas: 1 });
  /* A pessoa participa de UM subgrupo. `GET /subgrupos` é escopado, então o
     catálogo já vem recortado -- é ele que define o que ela pode ver. */
  mocks.listarSubgrupos.mockResolvedValue({
    subgrupos: [{ subgrupo_id: "s1", nome: "Cível", grupo_id: "g1" }],
    total: 1,
    total_paginas: 1,
  });
});

describe("o subgrupo na linha", () => {
  it("🔴 mostra SÓ os subgrupos que a pessoa participa -- nunca o id de subgrupo alheio", async () => {
    /* A regra exclusiva desta tela. Um envio entra na lista por INTERSEÇÃO:
       basta um dos `subgrupos_notificados` cruzar com os seus. Os outros
       podem ser de gente que ela nem enxerga -- `GET /subgrupos` é escopado
       (`subgrupos_service.listar_pagina`).

       🔴 Nas outras seis telas o id desconhecido APARECE, e ali está certo:
       significa subgrupo apagado, e sumir faria a coluna afirmar "sem
       subgrupo". Aqui significa "não é seu", e mostrar seria despejar
       identificador alheio ao lado dos nomes. */
    mocks.listarHistorico.mockResolvedValue({
      historico: [{ ...ITEM, subgrupos_notificados: ["s1", "s-alheio", "s-outro"] }],
      total: 1,
      total_paginas: 1,
    });
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    expect(await screen.findByTitle("Cível")).toHaveTextContent("Cível");
    expect(screen.queryByText(/s-alheio/)).not.toBeInTheDocument();
    expect(screen.queryByText(/s-outro/)).not.toBeInTheDocument();
  });

  it("⚠️ sem notificados, mostra o travessão -- e não some nem quebra", async () => {
    /* Registro antigo pode não ter o campo. A linha continua legível. */
    mocks.listarHistorico.mockResolvedValue({
      historico: [{ ...ITEM, subgrupos_notificados: [] }],
      total: 1,
      total_paginas: 1,
    });
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    /* ⚠️ Sem `title` aqui: no caso vazio o componente devolve só o
       travessão, sem o `Flex` que carrega o atributo. Asserção pelo texto. */
    expect(await screen.findByText("—")).toBeInTheDocument();
  });
});

describe("HistoricoPage", () => {
  it("abre filtrado em Movimentações -- lembrete é diário e dominaria a lista", async () => {
    renderComRota(<HistoricoPage />);

    expect(await screen.findByText("Intimação", { exact: false })).toBeInTheDocument();
    expect(mocks.listarHistorico).toHaveBeenCalledWith(
      expect.objectContaining({
        pagina: 1,
        tamanhoPagina: 10,
        tipoEnvio: "movimentacao",
        apenasComFalha: false,
        dias: 0,
      }),
    );
    // Filtro ligado precisa PARECER ligado: senão a pessoa vê uma lista
    // incompleta achando que está vendo tudo.
    expect(screen.getByRole("button", { name: /Movimentações/ })).toBeInTheDocument();
  });

  it("trocar o filtro refaz a busca e volta pra primeira página", async () => {
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.click(screen.getByRole("button", { name: /Movimentações/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Lembretes" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "lembrete",
          apenasComFalha: false,
          dias: 0,
        }),
      ),
    );
  });

  it("'Todos' TIRA o filtro -- controle do valor vazio", async () => {
    // Este é o caso que quebrou: "Todos" manda valor vazio, e item de menu
    // com `value=""` o zag não registra -- a opção simplesmente não
    // selecionava. Os outros dois funcionavam, então o teste precisa ser
    // dela.
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.click(screen.getByRole("button", { name: /Movimentações/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Todos" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "",
          apenasComFalha: false,
          dias: 0,
        }),
      ),
    );
  });

  it("envio que falhou aparece marcado -- é o que responde 'não fui avisado'", async () => {
    // O backend registra a falha justamente pra dar o que investigar; a
    // tela não mostrava isso.
    mocks.listarHistorico.mockResolvedValue({
      historico: [{ ...ITEM, falhou: true }],
      total: 1,
      total_paginas: 1,
    });
    renderComRota(<HistoricoPage />);

    expect(await screen.findByText("Falha")).toBeInTheDocument();
  });

  it("vazio POR FILTRO oferece o caminho de volta", async () => {
    // Como a tela abre filtrada, "não tem nada" costuma ser mentira.
    mocks.listarHistorico.mockImplementation((opcoes: OpcoesListarHistorico) =>
      opcoes?.tamanhoPagina === 1
        ? Promise.resolve({ historico: [], total: 7, total_paginas: 7 })
        : Promise.resolve({ historico: [], total: 0, total_paginas: 0 }),
    );
    const user = userEvent.setup();
    /* 🔴 Monta com os TRÊS filtros ligados, e não com os padrões.
       A primeira versão deste teste montava sem props: a tela nasce com
       `apenasComFalha: false` e `dias: 0`, então o assert lá embaixo passava
       mesmo que o botão limpasse SÓ o tipo -- que era exatamente o defeito.
       Um teste que não pode falhar não guarda nada. */
    renderComRota(
      <HistoricoPage tipoEnvioInicial="lembrete" apenasComFalhaInicial diasInicial={7} />,
    );

    /* ⚠️ "deste tipo" virou "com esses filtros" em 26/08/2026: com três
       filtros na tela, o vazio pode vir da falha ou do período, e a frase
       antiga mandava a pessoa olhar pro filtro errado. */
    expect(await screen.findByText("Nenhum envio com esses filtros.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver todos os envios" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "",
          apenasComFalha: false,
          dias: 0,
        }),
      ),
    );
  });

  it("o detalhe mostra o apelido embaixo do número e um destinatário por linha", async () => {
    // 20 dígitos não dizem de que processo se trata; o apelido é o nome que
    // alguém deu pra reconhecê-lo. E a lista de quem recebeu é o que se vem
    // conferir aqui -- uma fila de endereços colada por vírgula não se lê.
    /* ⚠️ O apelido vem da ROTA DO ITEM desde 18/09/2026, e não mais do
       detalhe do processo -- ver `DetalheHistorico`. */
    mocks.teorDaMovimentacao.mockResolvedValue({
      comunicacao_id: ITEM.comunicacao_id, texto: "<p>um teor</p>", apelido: "Ação de cobrança",
    });
    mocks.listarHistorico.mockResolvedValue({
      historico: [{ ...ITEM, destinatarios: ["ana@argos.local", "joao@argos.local"] }],
      total: 1,
      total_paginas: 1,
    });
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);

    await user.click(await screen.findByText("Intimação", { exact: false }));

    const dialogo = within(await screen.findByRole("dialog"));
    expect(await dialogo.findByText("Ação de cobrança")).toBeInTheDocument();
    expect(dialogo.getByText("ana@argos.local")).toBeInTheDocument();
    expect(dialogo.getByText("joao@argos.local")).toBeInTheDocument();
  });

  it("o detalhe mostra o TEOR da publicação", async () => {
    /* 🔴 O teste que FALTAVA, e a regressão que ele teria pego.

       Em 18/09/2026 o teor saiu da lista de movimentações do processo (ele
       pesava 97% de cada item, e a tela de processos não o mostra). Este
       painel lia o teor DALI -- e passou a renderizar VAZIO, sem erro nenhum.
       Nenhum teste percebeu, porque os daqui conferiam apelido e
       destinatários, e nunca o texto. */
    mocks.teorDaMovimentacao.mockResolvedValue({
      comunicacao_id: ITEM.comunicacao_id,
      texto: "<p>Fica intimada a parte para manifestar-se</p>",
      apelido: "Ação de cobrança",
    });
    mocks.listarHistorico.mockResolvedValue({ historico: [ITEM], total: 1, total_paginas: 1 });
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);

    await user.click(await screen.findByText("Intimação", { exact: false }));
    const dialogo = within(await screen.findByRole("dialog"));

    expect(await dialogo.findByText("Fica intimada a parte para manifestar-se")).toBeInTheDocument();
    expect(mocks.teorDaMovimentacao).toHaveBeenCalledWith(ITEM.numero_processo, ITEM.comunicacao_id);
  });

  it("o detalhe NÃO carrega a lista de movimentações do processo", async () => {
    /* ⚠️ O outro lado do conserto: o painel pedia o detalhe INTEIRO para
       pegar o teor e o apelido. Agora os dois vêm numa chamada só. */
    mocks.teorDaMovimentacao.mockResolvedValue({
      comunicacao_id: ITEM.comunicacao_id, texto: "<p>um teor</p>", apelido: "Ação",
    });
    mocks.listarHistorico.mockResolvedValue({ historico: [ITEM], total: 1, total_paginas: 1 });
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);

    await user.click(await screen.findByText("Intimação", { exact: false }));
    await within(await screen.findByRole("dialog")).findByText("um teor");
    expect(mocks.detalhesProcesso).not.toHaveBeenCalled();
  });

  it("vazio de verdade diz outra coisa, sem botão", async () => {
    mocks.listarHistorico.mockResolvedValue({ historico: [], total: 0, total_paginas: 0 });
    renderComRota(<HistoricoPage />);

    expect(
      await screen.findByText(
        "Nenhum e-mail enviado ainda. Os avisos de movimentação e de prazo aparecem aqui.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver todos os envios" })).not.toBeInTheDocument();
  });

  it("deep link com match abre o modal certo sozinho e consome o link", async () => {
    mocks.historicoDoProcesso.mockReturnValue(Promise.resolve({ historico: [ITEM] }));
    mocks.listarHistorico.mockReturnValue(Promise.resolve({ historico: [ITEM], total: 1, total_paginas: 1 }));
    const onDeepLinkConsumido = vi.fn();
    renderComRota(
      <HistoricoPage
        deepLink={{ processo: ITEM.numero_processo, comunicacaoId: String(ITEM.comunicacao_id) }}
        onDeepLinkConsumido={onDeepLinkConsumido}
      />
    );

    expect(await screen.findByText("Detalhes do envio")).toBeInTheDocument();
    expect(mocks.historicoDoProcesso).toHaveBeenCalledWith(ITEM.numero_processo);
    await waitFor(() => expect(onDeepLinkConsumido).toHaveBeenCalledTimes(1));
  });

  it("o modal abre DURANTE a busca do link, não só quando ela termina", async () => {
    /* Quem chega por um link de e-mail não tem contexto nenhum: sem isto
     * ela caía numa lista comum, sem nada indicando que o item do link
     * estava sendo buscado -- e, se falhasse, só um toast que ela podia nem
     * associar ao link.
     *
     * A busca da rota própria nunca assenta aqui: é a espera
     * congelada. Fica vermelho se o modal voltar a depender de `itemAberto`
     * pra existir. */
    /* A busca da ROTA PRÓPRIA nunca assenta: é a espera congelada. */
    mocks.historicoDoProcesso.mockReturnValue(new Promise(() => {}));
    mocks.listarHistorico.mockResolvedValue({ historico: [ITEM], total: 1, total_paginas: 1 });
    renderComRota(
      <HistoricoPage
        deepLink={{ processo: ITEM.numero_processo, comunicacaoId: String(ITEM.comunicacao_id) }}
        onDeepLinkConsumido={vi.fn()}
      />
    );

    const dialogo = within(await screen.findByRole("dialog"));
    expect(dialogo.getByText("Detalhes do envio")).toBeInTheDocument();
    expect(
      dialogo.getByText("Localizando a notificação do link recebido…")
    ).toBeInTheDocument();
  });

  it("deep link sem match no comunicacao_id mostra toast e ainda consome o link", async () => {
    mocks.historicoDoProcesso.mockReturnValue(Promise.resolve({ historico: [] }));
    mocks.listarHistorico.mockReturnValue(Promise.resolve({ historico: [ITEM], total: 1, total_paginas: 1 }));
    const onDeepLinkConsumido = vi.fn();
    renderComRota(
      <HistoricoPage
        deepLink={{ processo: "outro-numero", comunicacaoId: "999" }}
        onDeepLinkConsumido={onDeepLinkConsumido}
      />
    );

    expect(
      await screen.findByText("Não foi possível localizar a notificação do link recebido.")
    ).toBeInTheDocument();
    await waitFor(() => expect(onDeepLinkConsumido).toHaveBeenCalledTimes(1));
    expect(screen.queryByText("Detalhes do envio")).not.toBeInTheDocument();
  });

  it("sem deepLink, não busca o histórico de processo nenhum", async () => {
    /* ⚠️ A asserção mudou de alvo em 03/09/2026, e o motivo é o contrato.
       Antes ela olhava `listarHistorico` sem `numeroProcesso` -- e hoje ele
       vai SEMPRE, vazio, porque o número virou filtro de tela. Quem dispara
       a busca do link é `historicoDoProcesso`, e é ela que não pode ser
       chamada sem link. */
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    expect(mocks.historicoDoProcesso).not.toHaveBeenCalled();
    // e a lista normal foi pedida sem recorte por processo
    expect(mocks.listarHistorico).toHaveBeenCalledWith(
      expect.objectContaining({ numeroProcesso: "" }),
    );
  });
});

describe("os filtros que a Área de trabalho aciona", () => {
  /* 🔴 Medido em 26/08/2026, no ambiente local: "Envios com falha" contava
     2 e abria uma lista de 6; "Movimentações (7 dias)" contava 3 e abria 4.
     A rota `/historico` só aceitava `numero_processo` e `tipo_envio` --
     não havia filtro de falha nem de data, nem na API nem aqui.

     Número que não bate com a lista que ele abre é pior que número sem
     link: a pessoa deixa de confiar nos dois. */

  it("abre já filtrado em SÓ COM FALHA quando a home manda", async () => {
    renderComRota(<HistoricoPage tipoEnvioInicial="" apenasComFalhaInicial />);

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "",
          apenasComFalha: true,
          dias: 0,
        }),
      ),
    );
    /* ⚠️ E a pílula tem que PARECER ligada. Filtro invisível faz a pessoa
       ver uma lista incompleta achando que está vendo tudo -- a mesma regra
       que a pílula de tipo já seguia. */
    expect(await screen.findByRole("button", { name: "Só com falha" })).toHaveAttribute(
      "data-ativo",
    );
  });

  it("abre já recortado nos últimos dias quando a home manda", async () => {
    renderComRota(<HistoricoPage tipoEnvioInicial="movimentacao" diasInicial={7} />);

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "movimentacao",
          apenasComFalha: false,
          dias: 7,
        }),
      ),
    );
    expect(await screen.findByRole("button", { name: "Últimos 7 dias" })).toHaveAttribute(
      "data-ativo",
    );
  });

  it("as pílulas valem JUNTAS", async () => {
    /* Nenhum card da home leva a essa combinação -- mas a pessoa pode
       montá-la, e um filtro que ignora o outro mostra lista errada em
       silêncio. */
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.click(screen.getByRole("button", { name: "Todos os envios" }));
    await user.click(await screen.findByRole("menuitem", { name: "Só com falha" }));
    await user.click(screen.getByRole("button", { name: "Todos os períodos" }));
    await user.click(await screen.findByRole("menuitem", { name: "Últimos 7 dias" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tamanhoPagina: 10,
          tipoEnvio: "movimentacao",
          apenasComFalha: true,
          dias: 7,
        }),
      ),
    );
  });

  it("🔴 o filtro entra na CHAVE de cache, não só na chamada", async () => {
    /* Sem isso, ligar um filtro reusaria o resultado do anterior: lista
       errada, sem erro nenhum. O jeito de provar é ver que a consulta é
       REFEITA -- se a chave não mudasse, o React Query serviria o cache. */
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });
    const antes = mocks.listarHistorico.mock.calls.length;

    await user.click(screen.getByRole("button", { name: "Todos os períodos" }));
    await user.click(await screen.findByRole("menuitem", { name: "Últimos 7 dias" }));

    await waitFor(() =>
      expect(mocks.listarHistorico.mock.calls.length).toBeGreaterThan(antes),
    );
  });
});

describe("botão 'Adicionar tarefa' nos Detalhes do envio", () => {
  /** Abre o modal de detalhes do primeiro item da lista. */
  async function abrirDetalhes(item: Record<string, unknown>) {
    mocks.listarHistorico.mockResolvedValue({
      historico: [{ ...ITEM, ...item }],
      total: 1,
      total_paginas: 1,
    });
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await user.click(await screen.findByText("Intimação", { exact: false }));
    await screen.findByText("Detalhes do envio");
    return user;
  }

  const botao = () => screen.queryByRole("button", { name: /Adicionar tarefa/ });

  it("aparece quando há UM subgrupo notificado", async () => {
    await abrirDetalhes({ subgrupos_notificados: ["s1"] });

    expect(botao()).toBeInTheDocument();
  });

  it("🔴 NÃO aparece em lembrete de tarefa -- ali não há processo nenhum", async () => {
    /* `numero_processo` num lembrete guarda `TAREFA#{id}`, porque é chave de
       partição. Vincular a tarefa nova a isso gravaria lixo num campo que a
       tela lê como número de processo. */
    await abrirDetalhes({
      subgrupos_notificados: ["s1"],
      tarefa_id: "t1",
      numero_processo: "TAREFA#t1",
    });

    expect(botao()).not.toBeInTheDocument();
  });

  it("🔴 NÃO aparece com VÁRIOS subgrupos -- não há resposta certa", async () => {
    /* O mesmo número vive em N subgrupos e o e-mail foi pra todos. Escolher
       um arbitrariamente faria a tarefa nascer no lugar errado sem ninguém
       perceber -- e `ModalDeTarefa` não tem estado "nenhum subgrupo":
       `subgrupoAtual` é obrigatório e semeia o seletor. */
    await abrirDetalhes({ subgrupos_notificados: ["s1", "s2"] });

    expect(botao()).not.toBeInTheDocument();
  });

  it("🔴 NÃO aparece quando `subgrupos_notificados` está AUSENTE", async () => {
    /* O campo é opcional, e registro anterior a 26/08/2026 não o tem -- 9 de
       73 medidos em produção. `undefined` é "não sei", e não se oferece o
       que não se sabe. Um `[0]` cru estouraria aqui. */
    await abrirDetalhes({});

    expect(botao()).not.toBeInTheDocument();
  });

  it("🔴 NÃO aparece com a lista VAZIA", async () => {
    /* Lista vazia não é o mesmo que um subgrupo: não há de onde a tarefa
       nascer, e `[0]` seria `undefined`. */
    await abrirDetalhes({ subgrupos_notificados: [] });

    expect(botao()).not.toBeInTheDocument();
  });

  it("abre a tarefa com o processo vinculado, e o detalhe segue aberto", async () => {
    const user = await abrirDetalhes({ subgrupos_notificados: ["s1"] });

    await user.click(botao()!);

    expect(await screen.findByText("Nova tarefa")).toBeInTheDocument();

    /* ⚠️ Procurado DENTRO do modal de tarefa, e não pela página: o número
       mascarado aparece três vezes com os dois modais abertos (na lista
       atrás, no detalhe do envio e na etiqueta do vínculo), então contar
       ocorrências prova o número errado e quebra ao mexer na lista. */
    const dialogos = await screen.findAllByRole("dialog");
    const modalDaTarefa = dialogos.find((d) => within(d).queryByText("Nova tarefa"));
    expect(within(modalDaTarefa!).getByText("0000266-87.2021.8.13.0559")).toBeInTheDocument();

    // Os dois empilhados: fechar os dois devolveria a pessoa pra lista sem
    // o envio que ela estava lendo.
    expect(screen.getByText("Detalhes do envio")).toBeInTheDocument();
  });
});

describe("o link do e-mail usa a rota PRÓPRIA, não a lista", () => {
  it("🔴 acha a notificação mesmo além da primeira página", async () => {
    /* O caso que motivou separar as rotas, e que nenhum teste guardava.

       O link traz `?processo=` e `?comunicacao=`, e o front procura o item
       daquele `comunicacao_id`. Se essa busca usasse `listarHistorico`, que
       PAGINA de 10 em 10 desde que o número virou filtro de tela, uma
       notificação a partir do 11º item devolveria "não foi possível
       localizar" -- mentira, porque ela existe.

       ⚠️ Aqui a lista paginada devolve 10 itens que NÃO contêm o alvo, e a
       rota própria devolve os 11. Se alguém trocar a chamada de volta, o
       modal abre no item errado ou mostra o toast de erro. */
    const outros = Array.from({ length: 10 }, (_, i) => ({
      ...ITEM, comunicacao_id: 900 + i, assunto: `Outro ${i}`,
    }));
    const alvo = { ...ITEM, comunicacao_id: 999, assunto: "O do link" };

    mocks.listarHistorico.mockResolvedValue({
      historico: outros, total: 11, total_paginas: 2,
    });
    mocks.historicoDoProcesso.mockResolvedValue({ historico: [...outros, alvo] });

    renderComRota(
      <HistoricoPage
        deepLink={{ processo: ITEM.numero_processo, comunicacaoId: "999" }}
        onDeepLinkConsumido={vi.fn()}
      />,
    );

    expect(await screen.findByText("Detalhes do envio")).toBeInTheDocument();
    expect(await screen.findByText("O do link")).toBeInTheDocument();
    expect(mocks.historicoDoProcesso).toHaveBeenCalledWith(ITEM.numero_processo);
  });
});

describe("os dois filtros novos da barra", () => {
  beforeEach(() => {
    /* DOIS subgrupos: com um só o chip não aparece, e o teste passaria sem
       ter olhado para nada. */
    mocks.listarSubgrupos.mockResolvedValue({
      subgrupos: [
        { subgrupo_id: "s1", nome: "Cível", grupo_id: "g1" },
        { subgrupo_id: "s2", nome: "Trabalhista", grupo_id: "g1" },
      ],
      total: 2,
      total_paginas: 1,
    });
  });

  it("🔴 o chip de subgrupo manda o escolhido para a API", async () => {
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.click(await screen.findByRole("button", { name: /Todos os subgrupos/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Trabalhista" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({ subgrupoId: "s2" }),
      ),
    );
  });

  it("⚠️ com UM subgrupo só, o chip NÃO aparece -- ele não filtraria nada", async () => {
    mocks.listarSubgrupos.mockResolvedValue({
      subgrupos: [{ subgrupo_id: "s1", nome: "Cível", grupo_id: "g1" }],
      total: 1,
      total_paginas: 1,
    });
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    expect(screen.queryByRole("button", { name: /Todos os subgrupos/ })).not.toBeInTheDocument();
  });

  it("🔴 o campo de número manda o digitado, e SOMA com os outros", async () => {
    /* O que a separação de rotas destravou: antes o número mandava sozinho e
       zerava os demais filtros no servidor. */
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.type(screen.getByLabelText("Buscar por número do processo"), "10004766920184013801");

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          numeroProcesso: "10004766920184013801",
          tipoEnvio: "movimentacao",
        }),
      ),
    );
  });

  it("🔴 espera as teclas pararem -- senão são VINTE requisições por número", async () => {
    /* Um número de processo tem 20 dígitos. Sem `useValorComEspera`, cada
       tecla vira uma `queryKey` nova, uma requisição e uma piscada da lista.
       A prova é o que NÃO foi pedido: nenhuma consulta com número pela
       metade. */
    const user = userEvent.setup({ delay: null });
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    const numero = "10004766920184013801";
    await user.type(screen.getByLabelText("Buscar por número do processo"), numero);

    // o completo chega
    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({ numeroProcesso: numero }),
      ),
    );
    // e os pedaços, não
    const pedidos = mocks.listarHistorico.mock.calls
      .map(([o]) => (o as OpcoesListarHistorico)?.numeroProcesso)
      .filter((n): n is string => Boolean(n));
    const pelaMetade = pedidos.filter((n) => n !== numero);
    expect(pelaMetade).toEqual([]);
  });

  it("🔴 os dois vão para a URL -- senão morrem no F5 e o link não vale", async () => {
    /* Convenção do projeto ("o estado da listagem mora na URL"): sem isto o
       filtro não sobrevive ao F5 e não vira link para mandar a alguém. */
    const user = userEvent.setup();
    renderComRota(
      <>
        <HistoricoPage />
        <SondaDeUrl />
      </>,
    );
    await screen.findByText("Intimação", { exact: false });

    await user.type(screen.getByLabelText("Buscar por número do processo"), "123");
    await waitFor(() => expect(urlDaSonda()).toContain("processo=123"));

    await user.click(await screen.findByRole("button", { name: /Todos os subgrupos/ }));
    await user.click(await screen.findByRole("menuitem", { name: "Trabalhista" }));
    await waitFor(() => expect(urlDaSonda()).toContain("subgrupo=s2"));
  });

  it("🔴 «Ver todos os envios» limpa os CINCO, inclusive os dois novos", async () => {
    /* O comentário do `limparFiltros` guarda o defeito de quando ele limpava
       só o tipo: com outro filtro ligado, o botão de saída não saía -- a lista
       seguia vazia e o único caminho de volta não levava a lugar nenhum. Com
       dois filtros novos, o mesmo defeito volta a caber.

       🔴 Monta com os CINCO ligados, e não com os padrões: se algum nascesse
       já vazio, o assert passaria mesmo com o botão ignorando ele. */
    mocks.listarHistorico.mockImplementation((opcoes: OpcoesListarHistorico) =>
      opcoes?.tamanhoPagina === 1
        ? Promise.resolve({ historico: [], total: 7, total_paginas: 7 })
        : Promise.resolve({ historico: [], total: 0, total_paginas: 0 }),
    );
    const user = userEvent.setup();
    renderComRota(
      <>
        <HistoricoPage tipoEnvioInicial="lembrete" apenasComFalhaInicial diasInicial={7} />
        <SondaDeUrl />
      </>,
      "/historico?subgrupo=s2&processo=999&pagina=2",
    );

    expect(await screen.findByText("Nenhum envio com esses filtros.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver todos os envios" }));

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({
          pagina: 1,
          tipoEnvio: "",
          apenasComFalha: false,
          dias: 0,
          subgrupoId: "",
          numeroProcesso: "",
        }),
      ),
    );
    /* E o endereço não guarda mais VALOR nenhum -- senão o F5 traria os
       filtros de volta e o botão de saída teria sido uma ilusão.

       ⚠️ A query não fica vazia: `atualizar` grava os padrões (`?tipo=&falha=0`),
       comportamento que já existia com três filtros. O que importa é que
       `s2` e `999` sumiram, e que a `pagina=2` foi junto (`tambemApaga`) --
       limpar filtro e continuar na página 2 devolveria uma lista vazia. */
    await waitFor(() => {
      expect(urlDaSonda()).not.toContain("s2");
      expect(urlDaSonda()).not.toContain("999");
      expect(urlDaSonda()).not.toContain("pagina");
    });
  });

  it("⚠️ catálogo de subgrupos FALHA: o chip some, a lista continua", async () => {
    /* Caminho de erro do chip. O catálogo é uma segunda requisição, alheia à
       do histórico: se ela cair, o filtro não tem o que oferecer -- mas a
       tela é a do HISTÓRICO, e derrubá-la junto trocaria um controle a menos
       por uma tela inteira a menos. */
    mocks.listarSubgrupos.mockRejectedValue(new Error("500"));
    renderComRota(<HistoricoPage />);

    // a lista chegou, apesar do catálogo caído
    expect(await screen.findByText("Intimação", { exact: false })).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: /Todos os subgrupos/ })).not.toBeInTheDocument(),
    );
  });

  it("⚠️ a LISTA falha com filtro ligado: erro de verdade, não «não tem nada»", async () => {
    /* O par negativo do estado vazio. Sem a checagem de erro antes da de
       lista vazia, uma falha de rede virava "Nenhum e-mail enviado ainda" --
       e como o total também caía pra 0, nem o botão de saída aparecia pra
       desmentir. Com filtro na URL o engano é pior: a pessoa culpa o filtro
       que acabou de digitar. */
    mocks.listarHistorico.mockRejectedValue(new Error("500"));
    renderComRota(<HistoricoPage />, "/historico?processo=999&subgrupo=s2");

    expect(await screen.findByText("Não foi possível carregar o histórico.")).toBeInTheDocument();
    expect(screen.queryByText("Nenhum e-mail enviado ainda.", { exact: false })).not.toBeInTheDocument();
    expect(screen.queryByText("Nenhum envio com esses filtros.")).not.toBeInTheDocument();
  });

  it("🔴 manda o PEDAÇO digitado, sem exigir os 20 dígitos", async () => {
    /* A queixa de 03/09/2026: "digitei 3802 e não achou nada". A busca por
       pedaço é da API (`email_historico_repository` compara por dígito), e o
       que cabe à tela é MANDAR o pedaço em vez de segurá-lo esperando um
       número completo. */
    const user = userEvent.setup({ delay: null });
    renderComRota(<HistoricoPage />);
    await screen.findByText("Intimação", { exact: false });

    await user.type(screen.getByLabelText("Buscar por número do processo"), "3802");

    await waitFor(() =>
      expect(mocks.listarHistorico).toHaveBeenCalledWith(
        expect.objectContaining({ numeroProcesso: "3802" }),
      ),
    );
  });

  it("⚠️ o rótulo diz BUSCAR, não filtrar -- é o que evita a queixa de novo", () => {
    /* Um par com o teste acima: mandar o pedaço não adianta se a tela promete
       igualdade. O rótulo antigo ("Filtrar por número do processo") e o
       placeholder ("Número do processo") faziam quem tem só o fim do número
       nem tentar. */
    renderComRota(<HistoricoPage />);
    const campo = screen.getByLabelText("Buscar por número do processo");
    expect(campo).toHaveAttribute("placeholder", "Número do processo ou parte");
  });
});

describe("o lido de cada pessoa", () => {
  const NAO_LIDO = { ...ITEM, sequencia: 2, lido: false };
  const LIDO = { ...ITEM, enviado_em: "2026-08-14T03:02:13.990064+00:00", comunicacao_id: 1, sequencia: 1, lido: true };
  const CONTAGENS = { total: 2, [LEITURA_NAO_LIDOS]: 1, [LEITURA_LIDOS]: 1 };
  const chamadasDaLista = () => mocks.listarHistorico.mock.calls.filter(([o]) => o?.tamanhoPagina !== 1).length;
  const linha = (estado: "não lido" | "lido") => screen.findByRole("button", { name: new RegExp(`, ${estado}$`) });

  beforeEach(() => {
    mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 1 });
    mocks.marcarEnvioComoLido.mockResolvedValue({ marcados: 1 });
    mocks.marcarTodosComoLidos.mockResolvedValue({ marcados: 2, geracao: 1 });
    mocks.desfazerMarcarTodos.mockResolvedValue({ geracao: 0 });
    mocks.listarHistorico.mockResolvedValue({ historico: [NAO_LIDO, LIDO], total: 2, total_paginas: 1, contagens_da_leitura: CONTAGENS });
  });

  it("a linha não lida e a lida dizem o estado no nome, e só a não lida destaca", async () => {
    renderComRota(<HistoricoPage />);
    expect((await linha("não lido")).getAttribute("data-lido")).toBe("false");
    expect((await linha("lido")).getAttribute("data-lido")).toBe("true");
  });

  it("🔴 abrir o não lido marca pela sequência, muda a linha e NÃO recarrega a lista", async () => {
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    const naoLido = await linha("não lido");
    const antes = chamadasDaLista();
    const contadorAntes = mocks.contarNaoLidosDoHistorico.mock.calls.length;

    await user.click(naoLido);

    expect(mocks.marcarEnvioComoLido).toHaveBeenCalledWith({ sequencia: 2 });
    await waitFor(() => expect(screen.getAllByRole("button", { name: /, lido$/ })).toHaveLength(2));
    expect(chamadasDaLista()).toBe(antes);
    await waitFor(() => expect(mocks.contarNaoLidosDoHistorico.mock.calls.length).toBeGreaterThan(contadorAntes));
    expect(await screen.findByText(/· 0 não lidos/)).toBeInTheDocument();
  });

  it("🔴 com 'Só não lidos', o envio aberto continua na lista", async () => {
    const user = userEvent.setup();
    mocks.listarHistorico.mockResolvedValue({ historico: [NAO_LIDO], total: 1, total_paginas: 1, contagens_da_leitura: CONTAGENS });
    renderComRota(<HistoricoPage />, `/historico?leitura=${LEITURA_NAO_LIDOS}`);
    await user.click(await linha("não lido"));
    await screen.findByText("Detalhes do envio");
    await user.keyboard("{Escape}");
    expect(await linha("lido")).toBeInTheDocument();
  });

  it.each([
    ["o envio já lido", LIDO],
    ["o envio sem sequência (resposta antiga)", { ...ITEM, lido: false }],
    ["o envio sem o campo lido", ITEM],
  ])("PAR NEGATIVO: abrir %s não gasta chamada", async (_caso, item) => {
    const user = userEvent.setup();
    mocks.listarHistorico.mockResolvedValue({ historico: [item], total: 1, total_paginas: 1 });
    renderComRota(<HistoricoPage />);
    await user.click(await screen.findByRole("button", { name: /, (não )?lido$/ }));
    await screen.findByText("Detalhes do envio");
    expect(mocks.marcarEnvioComoLido).not.toHaveBeenCalled();
  });

  it("⚠️ marcar que falha deixa o envio não lido -- o estado verdadeiro -- e não mostra erro", async () => {
    const user = userEvent.setup();
    mocks.marcarEnvioComoLido.mockRejectedValue(new ApiError("Envio não encontrado no histórico", 404));
    renderComRota(<HistoricoPage />);
    await user.click(await linha("não lido"));
    await waitFor(() => expect(mocks.marcarEnvioComoLido).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(await linha("não lido")).toBeInTheDocument();
    expect(screen.queryByText("Envio não encontrado no histórico")).not.toBeInTheDocument();
  });

  it("o link do e-mail também marca o envio que abre", async () => {
    mocks.historicoDoProcesso.mockResolvedValue({ historico: [{ ...NAO_LIDO, sequencia: 7 }] });
    renderComRota(
      <HistoricoPage deepLink={{ processo: ITEM.numero_processo, comunicacaoId: String(ITEM.comunicacao_id) }} onDeepLinkConsumido={vi.fn()} />,
    );
    await waitFor(() => expect(mocks.marcarEnvioComoLido).toHaveBeenCalledWith({ sequencia: 7 }));
  });

  it("o filtro de leitura manda a escolha, mostra a contagem de cada opção e a da pílula ligada", async () => {
    const user = userEvent.setup();
    mocks.listarHistorico.mockResolvedValue({
      historico: [NAO_LIDO], total: 1, total_paginas: 1, contagens_da_leitura: { total: 1234, [LEITURA_NAO_LIDOS]: 1000, [LEITURA_LIDOS]: 234 },
    });
    renderComRota(<><HistoricoPage /><SondaDeUrl /></>);
    await user.click(await screen.findByRole("button", { name: "Lidos e não lidos" }));
    expect(await screen.findByRole("menuitem", { name: /Lidos e não lidos\s*1\.234/ })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Só lidos\s*234/ })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: /Só não lidos\s*1\.000/ }));

    await waitFor(() => expect(mocks.listarHistorico).toHaveBeenCalledWith(expect.objectContaining({ leitura: LEITURA_NAO_LIDOS, pagina: 1 })));
    expect(urlDaSonda()).toContain(`leitura=${LEITURA_NAO_LIDOS}`);
    expect(await screen.findByRole("button", { name: "Só não lidos · 1.000" })).toBeInTheDocument();
    expect(screen.getByText(/· 1\.000 não lidos/)).toBeInTheDocument();
  });

  it("⚠️ sem contagens (leitura antiga), o resumo e o menu não inventam zero", async () => {
    const user = userEvent.setup();
    mocks.listarHistorico.mockResolvedValue({ historico: [NAO_LIDO], total: 1, total_paginas: 1 });
    renderComRota(<HistoricoPage />);
    await linha("não lido");
    expect(screen.getByText(/^Mostrando/).textContent).not.toContain("não lido");
    await user.click(screen.getByRole("button", { name: "Lidos e não lidos" }));
    expect(await screen.findByRole("menuitem", { name: "Só não lidos" })).toBeInTheDocument();
  });

  it("🔴 marcar todos avisa que inclui os fora dos filtros, recarrega, e o Desfazer volta com a geração", async () => {
    const user = userEvent.setup();
    renderComRota(<HistoricoPage />);
    await linha("não lido");
    const antes = chamadasDaLista();
    await user.click(await screen.findByRole("button", { name: "Marcar todos como lidos" }));

    expect(await screen.findByText("2 envios marcados como lidos, inclusive os fora dos filtros.")).toBeInTheDocument();
    await waitFor(() => expect(chamadasDaLista()).toBeGreaterThan(antes));
    await user.click(screen.getByRole("button", { name: "Desfazer" }));
    await waitFor(() => expect(mocks.desfazerMarcarTodos).toHaveBeenCalledWith(1));
  });

  it("PAR NEGATIVO: sem filtro nenhum ligado, o aviso não fala dos filtros", async () => {
    const user = userEvent.setup();
    mocks.marcarTodosComoLidos.mockResolvedValue({ marcados: 1, geracao: 3 });
    renderComRota(<HistoricoPage tipoEnvioInicial="" />);
    await linha("não lido");
    await user.click(await screen.findByRole("button", { name: "Marcar todos como lidos" }));
    expect(await screen.findByText("1 envio marcado como lido.")).toBeInTheDocument();
  });

  it("⚠️ o Desfazer recusado (passou o minuto) vira aviso com a frase do servidor", async () => {
    const user = userEvent.setup();
    mocks.desfazerMarcarTodos.mockRejectedValue(new ApiError("Não dá mais para desfazer: passou o minuto", 409));
    renderComRota(<HistoricoPage />);
    await linha("não lido");
    await user.click(await screen.findByRole("button", { name: "Marcar todos como lidos" }));
    await user.click(await screen.findByRole("button", { name: "Desfazer" }));
    expect(await screen.findByText("Não dá mais para desfazer: passou o minuto")).toBeInTheDocument();
  });

  it("⚠️ marcar todos que falha avisa, e nada muda", async () => {
    const user = userEvent.setup();
    mocks.marcarTodosComoLidos.mockRejectedValue(new ApiError("Erro interno", 500));
    renderComRota(<HistoricoPage />);
    await linha("não lido");
    await user.click(await screen.findByRole("button", { name: "Marcar todos como lidos" }));
    expect(await screen.findByText("Não foi possível marcar os envios como lidos.")).toBeInTheDocument();
    expect(mocks.desfazerMarcarTodos).not.toHaveBeenCalled();
  });

  it("sem não lidos, o botão diz 'Tudo lido' e fica desabilitado", async () => {
    mocks.contarNaoLidosDoHistorico.mockResolvedValue({ nao_lidos: 0 });
    renderComRota(<HistoricoPage />);
    expect(await screen.findByRole("button", { name: "Tudo lido" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Marcar todos como lidos" })).not.toBeInTheDocument();
  });

  it.each([
    [LEITURA_NAO_LIDOS, "Você está em dia: nenhum envio não lido com esses filtros."],
    [LEITURA_LIDOS, "Nenhum envio lido com esses filtros."],
  ])("o vazio com a leitura %s diz o que faltou -- e 'Ver todos' limpa a leitura", async (leitura, recado) => {
    const user = userEvent.setup();
    mocks.listarHistorico.mockImplementation((o: OpcoesListarHistorico) =>
      Promise.resolve(o?.tamanhoPagina === 1 ? { historico: [ITEM], total: 3, total_paginas: 3 } : { historico: [], total: 0, total_paginas: 0 }),
    );
    renderComRota(<><HistoricoPage /><SondaDeUrl /></>, `/historico?leitura=${leitura}`);
    expect(await screen.findByText(recado)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Ver todos os envios" }));
    await waitFor(() => expect(mocks.listarHistorico).toHaveBeenCalledWith(expect.objectContaining({ leitura: "" })));
    expect(urlDaSonda()).not.toContain(`leitura=${leitura}`);
  });
});
