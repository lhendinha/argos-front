import { screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({
  /* ⚠️ O catálogo de subgrupos: sem ele a consulta erra em silêncio e a
     etiqueta cai para o id -- o teste passaria sem exercitar o caminho real. */
  listarSubgrupos: vi.fn(),
  detalhesAtendimento: vi.fn(),
  atualizarAtendimento: vi.fn(),
  adicionarRegistro: vi.fn(),
  registrosDoAtendimento: vi.fn(),
  removerAtendimento: vi.fn(),
  listarDocumentos: vi.fn(),
  listarClientes: vi.fn(),
  listarTodosOsMembrosDoGrupo: vi.fn(),
  papelAtende: vi.fn(),
  getApelido: vi.fn(),
  getEmail: vi.fn(),
}));
const navegou = vi.hoisted(() => vi.fn());

vi.mock("../../services", () => mocks);
vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => navegou,
  useParams: () => ({ subgrupoId: "s1", atendimentoId: "a1" }),
}));

import AtendimentoDetalhePage from "./index";

const ATENDIMENTO = {
  subgrupo_id: "s1",
  atendimento_id: "a1",
  assunto: "Revisão de contrato",
  status: "Em andamento",
  criado_em: "2026-08-10T09:00:00+00:00",
  cliente_ids: ["c1"],
  cliente_nomes: ["Maria Souza"],
  processo_numero: "00002668720218130559",
  ultimo_registro: { autor_id: "joao@x.com", autor_nome: "João",
                     registrado_em: "2026-08-12T14:30:00+00:00", texto: "Cliente retornou" },
  quantidade_de_registros: 2,
};

/* 🔴 A linha do tempo vem da rota dos registros, À PARTE do atendimento. E
   `autor_nome` vem NO registro, resolvido pelo servidor: antes a linha do
   tempo traduzia e-mail em apelido com o catálogo inteiro de pessoas do grupo
   -- e aquela consulta só rodava pra `manager` pra cima, então quem é `user`
   via e-mail cru. */
const REGISTROS = [
  { registro_id: "a1#2026-08-10T09:00:00+00:00#01", autor_id: "ana@x.com", autor_nome: "Ana Paula",
    registrado_em: "2026-08-10T09:00:00+00:00", texto: "Primeiro contato" },
  { registro_id: "a1#2026-08-12T14:30:00+00:00#02", autor_id: "joao@x.com", autor_nome: "João",
    registrado_em: "2026-08-12T14:30:00+00:00", texto: "Cliente retornou" },
];

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarSubgrupos.mockResolvedValue({
    subgrupos: [{ subgrupo_id: "s1", nome: "Cível", grupo_id: "g1" }],
  });
  mocks.papelAtende.mockReturnValue(true);
  mocks.getApelido.mockReturnValue("Ana");
  mocks.getEmail.mockReturnValue("ana@x.com");
  mocks.detalhesAtendimento.mockResolvedValue(ATENDIMENTO);
  /* ⚠️ `mockReset`, e não só o `clearAllMocks` acima: ele limpa as chamadas, mas não a fila de respostas de uma vez
     só, e a página que um teste não pediu vazava para o seguinte. */
  mocks.registrosDoAtendimento.mockReset();
  mocks.registrosDoAtendimento.mockResolvedValue({ registros: REGISTROS, anteriores: null, quantidade: 2 });
  mocks.listarClientes.mockResolvedValue({
    clientes: [{ cliente_id: "c1", nome: "Maria Souza", grupo_id: "g1" }],
  });
  mocks.listarTodosOsMembrosDoGrupo.mockResolvedValue({
    membros: [
      { email: "ana@x.com", apelido: "Ana Paula" },
      { email: "joao@x.com", apelido: "João" },
    ],
  });
  mocks.adicionarRegistro.mockResolvedValue({});
  mocks.atualizarAtendimento.mockResolvedValue({});
  mocks.removerAtendimento.mockResolvedValue({});
  mocks.listarDocumentos.mockResolvedValue({
    documentos: [
      { subgrupo_id: "s1", documento_id: "d1", grupo_id: "g1", tipo: "arquivo",
        titulo: "Procuração", tamanho_bytes: 2048, criado_em: "2026-08-20T10:00:00+00:00" },
    ],
    total: 1,
    total_paginas: 1,
  });
});

/** 🔴 Dentro de um `MemoryRouter`, e não solto.
 *
 * A tela passou a ter abas, e a aba vive na URL (`?aba=`) como nas duas
 * telas de detalhe irmãs. `useSearchParams` exige um roteador em volta --
 * sem ele o componente estoura antes de renderizar qualquer coisa.
 *
 * O mock de `react-router-dom` abaixo continua trocando só `useNavigate` e
 * `useParams`: `useSearchParams` fica o REAL, porque é justamente a leitura
 * da URL que os testes de aba precisam exercitar. */
function envolver(ui: React.ReactElement, rota = "/atendimentos/s1/a1") {
  return <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>;
}

async function montar(rota?: string) {
  renderComProviders(envolver(<AtendimentoDetalhePage />, rota));
  return await screen.findByRole("heading", { name: "Revisão de contrato" });
}

describe("cabeçalho", () => {
  it("mostra status, cliente por NOME e o processo mascarado", async () => {
    await montar();
    /* Duas vezes de propósito: a etiqueta (o estado atual, que se lê de
     * relance) e o seletor (por onde se muda). A etiqueta é o `<span>`. */
    expect(screen.getByText("Em andamento", { selector: "span" })).toBeInTheDocument();
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.getByText("0000266-87.2021.8.13.0559")).toBeInTheDocument();
  });
});

describe("linha do tempo", () => {
  it("mostra os registros na ordem de escrita", async () => {
    await montar();
    await screen.findByText("Cliente retornou");
    const textos = screen.getAllByText(/Primeiro contato|Cliente retornou/);
    expect(textos.map((t) => t.textContent)).toEqual(["Primeiro contato", "Cliente retornou"]);
  });

  it("mostra o APELIDO de quem escreveu, não o e-mail", async () => {
    await montar();
    expect(await screen.findByText("Ana Paula")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
    expect(screen.queryByText("joao@x.com")).not.toBeInTheDocument();
  });

  it("cai no e-mail quando o apelido não existe", async () => {
    /* `autor_nome` ausente: quem nunca definiu apelido, ou autor de outro
       grupo (o servidor resolve dentro do grupo de quem lê). O e-mail ainda
       identifica, e sumir com o autor seria pior. */
    mocks.registrosDoAtendimento.mockResolvedValue({
      registros: [{ ...REGISTROS[0], autor_nome: null }],
      anteriores: null,
      quantidade: 1,
    });
    await montar();
    expect(await screen.findByText("ana@x.com")).toBeInTheDocument();
  });

  it("não oferece editar nem excluir registro -- é append-only", async () => {
    await montar();
    expect(screen.queryByRole("button", { name: /Editar registro/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Excluir registro/i })).not.toBeInTheDocument();
  });
});

describe("novo registro", () => {
  it("envia o texto e limpa o campo", async () => {
    await montar();
    const campo = screen.getByLabelText("Novo registro do atendimento");
    await userEvent.type(campo, "Enviei a minuta");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar registro" }));

    await waitFor(() =>
      expect(mocks.adicionarRegistro).toHaveBeenCalledWith("s1", "a1", "Enviei a minuta"),
    );
    await waitFor(() => expect(campo).toHaveValue(""));
  });

  it("🔴 NÃO limpa o campo quando o envio falha", async () => {
    /* Quem escreveu três parágrafos e viu a rede cair não pode perdê-los. */
    mocks.adicionarRegistro.mockRejectedValue(new Error("caiu"));
    await montar();

    const campo = screen.getByLabelText("Novo registro do atendimento");
    await userEvent.type(campo, "Texto que não pode sumir");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar registro" }));

    await waitFor(() => expect(mocks.adicionarRegistro).toHaveBeenCalled());
    expect(campo).toHaveValue("Texto que não pode sumir");
  });

  it("o botão é SÓ ícone, e por isso precisa de nome acessível", async () => {
    /* É o único nome que ele tem -- sem o `aria-label`, leitor de tela lê
     * um botão vazio e o teste aqui seria a única forma de perceber. */
    await montar();
    const botao = screen.getByRole("button", { name: "Adicionar registro" });
    expect(botao.textContent).toBe("");
    expect(botao.querySelector("svg")).toBeTruthy();
  });

  it("botão travado com o campo vazio", async () => {
    await montar();
    expect(screen.getByRole("button", { name: "Adicionar registro" })).toBeDisabled();
  });

  it("só espaço em branco não conta como texto", async () => {
    await montar();
    await userEvent.type(screen.getByLabelText("Novo registro do atendimento"), "   ");
    expect(screen.getByRole("button", { name: "Adicionar registro" })).toBeDisabled();
  });
});

describe("aba Detalhes", () => {
  /** 🔴 **Este bloco MUDOU em 26/08/2026, e a mudança é a feature.**
   *
   * O status era um `Select` solto no cabeçalho que salvava SOZINHO ao
   * escolher -- um controle sem "Salvar", ao lado do botão de excluir,
   * enquanto o assunto não tinha onde ser editado.
   *
   * Virou campo da aba Detalhes: status é campo, e campo se edita em
   * formulário.
   */
  async function abrirDetalhes() {
    await montar();
    await userEvent.click(screen.getByRole("tab", { name: "Detalhes" }));
  }

  it("salva num PATCH só, e manda SÓ o que mudou", async () => {
    /* Um PATCH por campo faria o servidor comparar e notificar três vezes o
       que é uma edição só -- por isso o corpo é um.

       🔴 E o corpo leva só o campo tocado. Reenviar o resto devolve por cima
       o que outra pessoa mudou enquanto esta tela estava aberta, e no caso do
       `status` chegava a IMPEDIR a edição. Mesma regra de
       `FormularioProcesso`; ver `utils/atendimentos.ts`. */
    await abrirDetalhes();

    await userEvent.click(screen.getByLabelText("Status"));
    await userEvent.click(await screen.findByRole("option", { name: "Fechado" }));
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mocks.atualizarAtendimento).toHaveBeenCalledWith("s1", "a1", {
        status: "Fechado",
      }),
    );
  });

  it("mexer só no assunto não manda o status junto", async () => {
    await abrirDetalhes();

    await userEvent.clear(screen.getByLabelText(/Assunto/));
    await userEvent.type(screen.getByLabelText(/Assunto/), "Assunto corrigido");
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(mocks.atualizarAtendimento).toHaveBeenCalledWith("s1", "a1", {
        assunto: "Assunto corrigido",
      }),
    );
  });

  it("🔴 'Salvar' fica DESABILITADO enquanto nada mudou", async () => {
    /* Sem isto, salvar um formulário intocado manda um PATCH que reenvia a
       mesma lista de responsáveis. O servidor compara antes de notificar, mas
       a requisição à toa continua sendo à toa. */
    await abrirDetalhes();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("🔴 assunto VAZIO desabilita o Salvar -- igual à tela de criar", async () => {
    /* Apagar o assunto CONTAVA como mudança, então o Salvar acendia, a pessoa
       clicava e a recusa vinha do servidor -- que exige o assunto ao criar e
       ao editar. Nada se perdia; era uma ida ao servidor para ouvir um "não"
       que a tela já sabia. `NovoAtendimentoForm` sempre barrou antes. */
    await abrirDetalhes();
    await userEvent.clear(screen.getByLabelText(/Assunto/));

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(mocks.atualizarAtendimento).not.toHaveBeenCalled();
  });

  it("e o Assunto passa a mostrar o asterisco de obrigatório", async () => {
    /* O rótulo tinha de contar isso: sem o asterisco, o campo lia como
       dispensável ao lado de um Salvar que ele desliga. */
    await abrirDetalhes();

    const rotulo = document.querySelector('label[for="assunto-atendimento"]');
    expect(rotulo?.textContent).toContain("*");
  });

  it("o campo de status NÃO aparece com a aba Registros aberta", async () => {
    /* O par negativo: sem ele, deixar o `Select` antigo no cabeçalho por
       engano passaria -- e a tela teria dois jeitos de mudar a mesma coisa,
       um deles salvando sozinho.

       ⚠️ **`toBeVisible`, não `toBeInTheDocument`.** Os painéis vão MONTADOS
       de propósito (o rascunho de `NovoRegistro` não pode ser descartado ao
       trocar de aba), então o campo EXISTE no DOM mesmo escondido. A pergunta
       certa é o que a pessoa vê. */
    await montar();
    expect(screen.getByLabelText("Status")).not.toBeVisible();
  });

  it("a ETIQUETA de status continua no cabeçalho", async () => {
    /* Ela informa, e é o que se quer ver de relance ao abrir -- só o
       CONTROLE mudou de lugar. */
    await montar();
    expect(screen.getByText("Em andamento", { selector: "span" })).toBeVisible();
  });
});

describe("exclusão", () => {

  it("pede confirmação e diz quantos registros somem", async () => {
    await montar();
    /* ⚠️ Por /Excluir/, e não pelo `aria-label` "Excluir atendimento": o
       botão passou a ter TEXTO em 26/08/2026, no visual de
       `FormularioProcesso` -- só o ícone obrigava a passar o mouse pra
       descobrir o que ele faz. */
    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }));

    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveTextContent(
      "O atendimento Revisão de contrato e todos os seus 2 registros serão removidos.",
    );
    expect(mocks.removerAtendimento).not.toHaveBeenCalled();
  });

  it("o nome do atendimento vem em NEGRITO", async () => {
    /* É o nome que a pessoa confere antes de apagar -- tem que saltar da
     * frase. Todas as outras confirmações do sistema fazem assim. */
    await montar();
    /* ⚠️ Por /Excluir/, e não pelo `aria-label` "Excluir atendimento": o
       botão passou a ter TEXTO em 26/08/2026, no visual de
       `FormularioProcesso` -- só o ícone obrigava a passar o mouse pra
       descobrir o que ele faz. */
    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }));

    const dialogo = await screen.findByRole("dialog");
    const negrito = dialogo.querySelector("strong");
    expect(negrito?.textContent).toBe("Revisão de contrato");
  });

  it("com UM registro, a frase vai no singular por extenso", async () => {
    // "1 registro" soa a formulário; o artifact escreve "o seu único".
    mocks.detalhesAtendimento.mockResolvedValue({ ...ATENDIMENTO, quantidade_de_registros: 1 });
    await montar();
    /* ⚠️ Por /Excluir/, e não pelo `aria-label` "Excluir atendimento": o
       botão passou a ter TEXTO em 26/08/2026, no visual de
       `FormularioProcesso` -- só o ícone obrigava a passar o mouse pra
       descobrir o que ele faz. */
    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }));

    const dialogo = await screen.findByRole("dialog");
    expect(dialogo).toHaveTextContent("o seu único registro será removido");
    expect(dialogo).not.toHaveTextContent("1 registro será");
  });

  it("confirmando, exclui e volta pra lista", async () => {
    await montar();
    /* ⚠️ Por /Excluir/, e não pelo `aria-label` "Excluir atendimento": o
       botão passou a ter TEXTO em 26/08/2026, no visual de
       `FormularioProcesso` -- só o ícone obrigava a passar o mouse pra
       descobrir o que ele faz. */
    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }));
    const dialogo = await screen.findByRole("dialog");
    await userEvent.click(within(dialogo).getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(mocks.removerAtendimento).toHaveBeenCalledWith("s1", "a1"));
    await waitFor(() => expect(navegou).toHaveBeenCalledWith("/atendimentos"));
  });
});

describe("erro", () => {
  it("link velho pra atendimento excluído explica o que houve", async () => {
    mocks.detalhesAtendimento.mockRejectedValue(new Error("404"));
    renderComProviders(envolver(<AtendimentoDetalhePage />));
    expect(await screen.findByText(/pode ter sido excluído/)).toBeInTheDocument();
  });
});

describe("fidelidade ao artifact", () => {
  /* Os chips daqui levam ÍCONE, ao contrário dos do detalhe do processo
   * (que no artifact são só texto): aqui eles dizem coisas de naturezas
   * diferentes -- quem é o cliente e a que processo isto se liga --, e sem
   * o ícone as duas pílulas ficam indistinguíveis à primeira vista.
   *
   * As MEDIDAS ficam na verificação em Chrome; aqui trava-se a estrutura. */

  it("o chip do cliente tem ícone", async () => {
    await montar();
    const chip = (await screen.findByText("Maria Souza")).closest("div");
    expect(chip?.querySelector("svg")).toBeTruthy();
  });

  it("o chip do processo tem ícone", async () => {
    await montar();
    const chip = screen.getByText("0000266-87.2021.8.13.0559").closest("div");
    expect(chip?.querySelector("svg")).toBeTruthy();
  });
});

describe("abas", () => {
  /* 🔴 Esta tela NÃO tinha abas -- era a linha do tempo direto, enquanto
   * processo e cliente já se dividiam assim. Documentos entrou como aba nas
   * três, e uma tela sem abas ao lado de duas com abas faria o mesmo
   * conteúdo ser procurado em dois lugares diferentes. */

  /** O painel que a aba comanda. Painel escondido tem nome acessível vazio,
   * então `getByRole("tabpanel", { name })` não acha os inativos -- mesmo
   * gêmeo de `ProcessoDetalhePage` e `ClienteDetalhePage`. */
  function painel(nome: string) {
    const aba = screen.getByRole("tab", { name: nome });
    const alvo = document.getElementById(aba.getAttribute("aria-controls") ?? "");
    if (!alvo) throw new Error(`A aba "${nome}" aponta pra um painel que não existe.`);
    return alvo;
  }

  it("abre em Registros -- é o que a tela sempre foi", async () => {
    await montar();
    expect(screen.getByRole("tab", { name: "Registros" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("a aba vem da URL, pra a tela sobreviver a um F5", async () => {
    await montar("/atendimentos/s1/a1?aba=documentos");
    expect(screen.getByRole("tab", { name: "Documentos" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("aba desconhecida na URL cai na primeira, não em tela branca", async () => {
    await montar("/atendimentos/s1/a1?aba=inventada");
    expect(screen.getByRole("tab", { name: "Registros" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("🔴 o que foi digitado em 'Novo registro' SOBREVIVE à troca de aba", async () => {
    /* É o que obriga os painéis a ficarem MONTADOS. `NovoRegistro` tem
     * estado local; desmontá-lo ao trocar de aba jogaria fora a anotação que
     * a pessoa acabou de escrever -- num campo cujo conteúdo, depois de
     * salvo, não se edita nem se apaga.
     *
     * Sem isso o defeito seria invisível em revisão: a aba volta, o campo
     * está vazio, e parece que a pessoa não digitou. */
    await montar();

    const campo = screen.getByLabelText("Novo registro do atendimento");
    await userEvent.type(campo, "Cliente ligou às 15h pedindo cópia");

    await userEvent.click(screen.getByRole("tab", { name: "Documentos" }));
    await userEvent.click(screen.getByRole("tab", { name: "Registros" }));

    expect(
      screen.getByLabelText<HTMLTextAreaElement>("Novo registro do atendimento").value,
    ).toBe("Cliente ligou às 15h pedindo cópia");
  });

  it("a aba de documentos filtra POR ESTE atendimento", async () => {
    /* Sem o filtro ela mostraria os documentos do escritório inteiro dentro
     * de um atendimento -- e a aba passaria a mentir sobre o que reúne. */
    await montar("/atendimentos/s1/a1?aba=documentos");
    await waitFor(() =>
      expect(mocks.listarDocumentos).toHaveBeenCalledWith(
        expect.objectContaining({ atendimentoId: "a1" }),
      ),
    );
    expect(within(painel("Documentos")).getByText("Procuração")).toBeInTheDocument();
  });
});

describe("o subgrupo no cabeçalho", () => {
  it("🔴 mostra de qual subgrupo é o atendimento", async () => {
    /* As três telas de detalhe eram irmãs e só a de PROCESSO mostrava o
       subgrupo. Esta e a de documento divergiam -- e quem participa de vários
       abria o item sem saber de onde ele vinha.

       ⚠️ Sem ícone, ao contrário dos chips de cliente e processo: o ícone lá
       separa duas coisas que se confundem entre si, e o subgrupo não se
       confunde com nenhuma delas. */
    montar();

    expect(await screen.findByText("Cível")).toBeInTheDocument();
  });
});

describe("linha do tempo, 20 por vez", () => {
  /** Uma página da rota dos registros, em ordem de escrita. */
  function pagina(textos: string[], anteriores: string | null, quantidade: number) {
    return {
      registros: textos.map((texto, i) => ({
        registro_id: `a1#${texto}#${i}`, autor_id: "ana@x.com", autor_nome: "Ana Paula",
        registrado_em: `2026-08-1${i}T09:00:00+00:00`, texto,
      })),
      anteriores,
      quantidade,
    };
  }

  function anterioresEmDuasPaginas() {
    mocks.registrosDoAtendimento
      .mockResolvedValueOnce(pagina(["r3", "r4"], "a1#cursor", 4))
      .mockResolvedValueOnce(pagina(["r1", "r2"], null, 4));
  }

  it("pede os mais recentes, sem cursor", async () => {
    await montar();
    await waitFor(() => expect(mocks.registrosDoAtendimento).toHaveBeenCalledWith("s1", "a1", ""));
  });

  it("🔴 'Ver registros anteriores' traz a página de trás e a põe EM CIMA, em ordem de escrita", async () => {
    anterioresEmDuasPaginas();
    await montar();
    expect(await screen.findByText("Mostrando os 2 mais recentes de 4 registros")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Ver registros anteriores" }));

    expect(await screen.findByText("Todos os 4 registros")).toBeInTheDocument();
    expect(mocks.registrosDoAtendimento).toHaveBeenLastCalledWith("s1", "a1", "a1#cursor");
    expect(screen.getAllByText(/^r[1-4]$/).map((t) => t.textContent)).toEqual(["r1", "r2", "r3", "r4"]);
    expect(screen.queryByRole("button", { name: "Ver registros anteriores" })).not.toBeInTheDocument();
  });

  it("sem anteriores, não oferece o botão -- e a frase diz que são todos", async () => {
    await montar();
    expect(await screen.findByText("Todos os 2 registros")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Ver registros anteriores" })).not.toBeInTheDocument();
  });

  it("o botão é o de contorno, como no desenho aprovado", async () => {
    anterioresEmDuasPaginas();
    await montar();
    expect(await screen.findByRole("button", { name: "Ver registros anteriores" })).toHaveAttribute(
      "data-variante",
      "ghost",
    );
  });

  it("enquanto os anteriores chegam, o botão diz 'Carregando…' e fica travado", async () => {
    let entregar: (valor: unknown) => void = () => {};
    mocks.registrosDoAtendimento
      .mockResolvedValueOnce(pagina(["r3", "r4"], "a1#cursor", 4))
      .mockReturnValueOnce(new Promise((resolve) => { entregar = resolve; }));
    await montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver registros anteriores" }));

    expect(await screen.findByRole("button", { name: "Carregando…" })).toBeDisabled();
    entregar(pagina(["r1", "r2"], null, 4));
    expect(await screen.findByText("Todos os 4 registros")).toBeInTheDocument();
  });

  it("🔴 se os anteriores falham, avisa -- e a linha do tempo fica", async () => {
    mocks.registrosDoAtendimento
      .mockResolvedValueOnce(pagina(["r3", "r4"], "a1#cursor", 4))
      .mockRejectedValueOnce(new Error("caiu"));
    await montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver registros anteriores" }));

    expect(await screen.findByText("Não foi possível carregar os registros anteriores.")).toBeInTheDocument();
    expect(screen.getByText("r3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ver registros anteriores" })).toBeEnabled();
  });

  it("🔴 carrega À PARTE: o cabeçalho e o campo de escrever não esperam os registros", async () => {
    mocks.registrosDoAtendimento.mockReturnValue(new Promise(() => {}));
    await montar();
    expect(screen.getByLabelText("Novo registro do atendimento")).toBeInTheDocument();
    expect(screen.queryByText("Primeiro contato")).not.toBeInTheDocument();
  });

  it("erro nos registros não derruba a tela: diz o que houve e tenta de novo", async () => {
    mocks.registrosDoAtendimento.mockRejectedValueOnce(new Error("caiu"));
    await montar();
    expect(await screen.findByText("Não foi possível carregar os registros.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Tentar de novo" }));
    expect(await screen.findByText("Primeiro contato")).toBeInTheDocument();
  });

  it("🔴 os registros que ainda vêm DENTRO do atendimento não aparecem", async () => {
    /* A lista sai da resposta no passo 4: a tela que ainda a lesse mudaria
       sozinha quando ela saísse. */
    mocks.detalhesAtendimento.mockResolvedValue({
      ...ATENDIMENTO,
      registros: [{ autor_id: "ana@x.com", autor_nome: "Ana Paula",
                    registrado_em: "2026-08-01T09:00:00+00:00", texto: "Da lista antiga" }],
    });
    await montar();
    await screen.findByText("Primeiro contato");
    expect(screen.queryByText("Da lista antiga")).not.toBeInTheDocument();
  });

  it("registrar recarrega a linha do tempo", async () => {
    await montar();
    await screen.findByText("Primeiro contato");
    const antes = mocks.registrosDoAtendimento.mock.calls.length;

    await userEvent.type(screen.getByLabelText("Novo registro do atendimento"), "Enviei a minuta");
    await userEvent.click(screen.getByRole("button", { name: "Adicionar registro" }));

    await waitFor(() => expect(mocks.registrosDoAtendimento.mock.calls.length).toBeGreaterThan(antes));
  });

  it("o que chega depois acende; o da primeira pintura, não", async () => {
    anterioresEmDuasPaginas();
    await montar();
    await userEvent.click(await screen.findByRole("button", { name: "Ver registros anteriores" }));
    await screen.findByText("r1");

    const acesos = [...document.querySelectorAll("[data-chegou]")].map((el) => el.textContent).join(" ");
    expect(acesos).toMatch(/r1.*r2/);
    expect(acesos).not.toMatch(/r3|r4/);
  });

  it("🔴 os anteriores entram em cima SEM a vista pular", async () => {
    /* jsdom não desenha: a posição de cada registro é simulada pela ordem na
       tela, 100px cada. Dois registros novos em cima empurram o que se lia
       200px para baixo, e a janela tem de rolar os mesmos 200px. */
    const rolou = vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    const posicao = vi
      .spyOn(HTMLElement.prototype, "getBoundingClientRect")
      .mockImplementation(function (this: HTMLElement) {
        return { top: [...document.querySelectorAll("[data-registro]")].indexOf(this) * 100 } as DOMRect;
      });
    try {
      anterioresEmDuasPaginas();
      await montar();
      await userEvent.click(await screen.findByRole("button", { name: "Ver registros anteriores" }));
      await screen.findByText("r1");

      await waitFor(() => expect(rolou).toHaveBeenCalledWith(0, 200));
    } finally {
      rolou.mockRestore();
      posicao.mockRestore();
    }
  });

  it("🔴 a confirmação de excluir conta pela QUANTIDADE guardada, não pelos da tela", async () => {
    mocks.detalhesAtendimento.mockResolvedValue({ ...ATENDIMENTO, quantidade_de_registros: 87 });
    mocks.registrosDoAtendimento.mockResolvedValue(pagina(["r68", "r69"], "a1#cursor", 87));
    await montar();
    await screen.findByText("r69");

    await userEvent.click(screen.getByRole("button", { name: /Excluir/ }));
    expect(await screen.findByRole("dialog")).toHaveTextContent("todos os seus 87 registros serão removidos");
  });
});
