import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({
  listarClientes: vi.fn(),
  criarCliente: vi.fn(),
  arquivarCliente: vi.fn(),
  reativarCliente: vi.fn(),
  papelAtende: vi.fn(),
}));

vi.mock("../../services", () => mocks);

import { ApiError } from "../../services/api/client";
import ClientesPage from "./index";

/** Marca onde a navegação parou, sem montar o detalhe inteiro -- o que este
 * arquivo testa é a listagem. */
function EspiaoDeRota() {
  const { clienteId } = useParams();
  return <div>{`detalhe ${clienteId}`}</div>;
}

function montar(rota = "/clientes") {
  return renderComProviders(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route path="/clientes" element={<ClientesPage />} />
        <Route path="/clientes/:clienteId" element={<EspiaoDeRota />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.papelAtende.mockReturnValue(true);
  mocks.listarClientes.mockResolvedValue({
    clientes: [
      {
        cliente_id: "1",
        nome: "Fulano",
        cpf_cnpj: "12345678901",
        processos: 3,
      },
    ],
    total: 1,
    total_paginas: 1,
  });
});

describe("ClientesPage", () => {
  it("mostra a lista depois de carregar, com pagina/tamanhoPagina e o estado padrão", async () => {
    montar();

    expect(await screen.findByText("Fulano")).toBeInTheDocument();
    /* 🔴 `estado` vai SEMPRE, e não só quando a pessoa escolhe: sem ele a API
       devolve os ativos por padrão, mas a tela ficaria dependendo desse
       padrão para dizer o que está mostrando. */
    expect(mocks.listarClientes).toHaveBeenCalledWith({
      pagina: 1,
      tamanhoPagina: 10,
      estado: "ativos",
    });
  });

  it("mostra quantos processos cada cliente tem", async () => {
    // Campo derivado, calculado pela API -- sem ele a tela teria que pedir
    // `GET /processos?cliente_id=X` por linha.
    montar();

    expect(await screen.findByText("3")).toBeInTheDocument();
  });

  it("deduz pessoa física ou jurídica pelo tamanho do documento", async () => {
    montar();

    expect(await screen.findByText("Pessoa física")).toBeInTheDocument();
  });

  it("busca troca os parâmetros pra {busca} e some a paginação", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    await user.type(screen.getByLabelText("Pesquisar cliente"), "ciclana");

    await waitFor(() =>
      expect(mocks.listarClientes).toHaveBeenCalledWith({ busca: "ciclana", estado: "ativos" }),
    );
    expect(screen.queryByText("Por página")).not.toBeInTheDocument();
  });

  it("busca sem resultado mostra a mensagem específica de busca vazia", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    mocks.listarClientes.mockResolvedValue({
      clientes: [],
      total: 0,
      total_paginas: 0,
    });
    await user.type(screen.getByLabelText("Pesquisar cliente"), "zzz");

    expect(
      await screen.findByText("Nenhum cliente para “zzz”."),
    ).toBeInTheDocument();
  });

  it("clicar na linha NAVEGA pro detalhe", async () => {
    // O detalhe deixou de ser modal: é rota, pelo mesmo motivo do detalhe
    // de processo -- precisa sobreviver a um F5 e a um link colado.
    const user = userEvent.setup();
    montar();

    await user.click(await screen.findByText("Fulano"));

    expect(await screen.findByText("detalhe 1")).toBeInTheDocument();
  });

  it("a linha abre pelo teclado -- Enter na linha focada", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    screen.getByText("Fulano").closest("tr")!.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByText("detalhe 1")).toBeInTheDocument();
  });

  it("cadastra com máscara na digitação, mas envia só dígitos", async () => {
    mocks.criarCliente.mockResolvedValue({});
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    await user.click(screen.getByRole("button", { name: "+ Novo cliente" }));
    await user.type(await screen.findByLabelText(/Nome/), "Ciclano");
    await user.type(screen.getByLabelText(/CPF\/CNPJ/), "12345678901");
    await user.type(screen.getByLabelText(/Telefone/), "31988887777");

    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    await waitFor(() =>
      expect(mocks.criarCliente).toHaveBeenCalledWith({
        nome: "Ciclano",
        cpfCnpj: "12345678901",
        telefone: "31988887777",
        email: "",
        // O bloco vai INTEIRO, mesmo em branco -- ver o gêmeo em
        // `ClienteDetalhePage`.
        endereco: { cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", uf: "" },
      }),
    );
  });

  it("e-mail malformado bloqueia o cadastro e avisa na hora", async () => {
    // O servidor recusa do mesmo jeito (`EmailInvalido`); isto é pra a
    // pessoa não preencher o formulário inteiro pra tomar erro no fim.
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    await user.click(screen.getByRole("button", { name: "+ Novo cliente" }));
    await user.type(await screen.findByLabelText(/Nome/), "Ciclano");
    await user.type(screen.getByLabelText(/E-mail/), "isso-nao-e-email");

    expect(await screen.findByText("E-mail inválido.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeDisabled();
    expect(mocks.criarCliente).not.toHaveBeenCalled();
  });

  it("e-mail vazio não é erro -- o campo é opcional", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    await user.click(screen.getByRole("button", { name: "+ Novo cliente" }));
    await user.type(await screen.findByLabelText(/Nome/), "Ciclano");

    expect(screen.queryByText("E-mail inválido.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cadastrar" })).toBeEnabled();
  });

  it("erro ao criar mostra a mensagem da ApiError", async () => {
    mocks.criarCliente.mockRejectedValue(
      // `ApiError(mensagem, status)` -- nessa ordem.
      new ApiError("Esse CPF/CNPJ já é de outro cliente", 409),
    );
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    await user.click(screen.getByRole("button", { name: "+ Novo cliente" }));
    await user.type(await screen.findByLabelText(/Nome/), "Ciclano");
    await user.click(screen.getByRole("button", { name: "Cadastrar" }));

    expect(
      await screen.findByText("Esse CPF/CNPJ já é de outro cliente"),
    ).toBeInTheDocument();
  });

  it("o chip troca o estado, e Arquivados pede a lista do servidor", async () => {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");

    /* 🔴 O chip nasce APAGADO em "Ativos": é o que a tela mostra para quem
       não escolheu nada, e pílula acesa aí diria que há filtro. O estado
       ligado só existe como cor, e `data-ativo` é o que deixa afirmá-lo sem
       comparar hexadecimal. */
    expect(screen.getByRole("button", { name: "Ativos" })).not.toHaveAttribute("data-ativo");

    await user.click(screen.getByRole("button", { name: "Ativos" }));
    await user.click(await screen.findByRole("menuitem", { name: "Arquivados" }));
    expect(await screen.findByRole("button", { name: "Arquivados" })).toHaveAttribute("data-ativo", "true");

    await waitFor(() =>
      expect(mocks.listarClientes).toHaveBeenCalledWith({
        pagina: 1,
        tamanhoPagina: 10,
        estado: "arquivados",
      }),
    );
  });

  it("🔴 estado desconhecido na URL vira Ativos, em vez de ir para a API", async () => {
    /* A URL é digitável, e `?estado=apagados` chegaria à API como filtro
       inválido: 422, e a tela diria só "não foi possível carregar". */
    montar("/clientes?estado=apagados");

    await screen.findByText("Fulano");
    expect(mocks.listarClientes).toHaveBeenCalledWith({
      pagina: 1,
      tamanhoPagina: 10,
      estado: "ativos",
    });
  });

  it("em Arquivados a coluna Processos sai e a linha ganha Reativar", async () => {
    /* Cliente com processo não se arquiva, então a coluna inteira seria uma
       fileira de zeros -- é o artefato validado que a tira. */
    mocks.listarClientes.mockResolvedValue({
      clientes: [
        {
          cliente_id: "1",
          nome: "Fulano",
          cpf_cnpj: "12345678901",
          arquivado_em: "2026-09-15T18:30:00+00:00",
          arquivado_por: "chefe@argos.invalid",
        },
      ],
      total: 1,
      total_paginas: 1,
    });
    mocks.reativarCliente.mockResolvedValue({});
    mocks.arquivarCliente.mockResolvedValue({});
    const user = userEvent.setup();
    montar("/clientes?estado=arquivados");

    expect(await screen.findByText("Fulano")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Processos" })).not.toBeInTheDocument();
    expect(screen.getByText(/Arquivado por chefe@argos.invalid em 15\/09\/2026/)).toBeVisible();
    /* A etiqueta é só de "Todos": aqui o filtro já disse o que cada linha é. */
    expect(screen.queryByText("Arquivado", { selector: "span" })).not.toBeInTheDocument();

    /* 🔴 A célula da coluna some junto com o cabeçalho: conferir só o `th`
       deixava passar uma linha com uma célula a mais, que desalinha a tabela
       inteira a partir dali. */
    expect(screen.getAllByRole("cell")).toHaveLength(4);

    await user.click(screen.getByRole("button", { name: "Reativar" }));
    /* 🔴 E NÃO abre a ficha: o clique da linha inteira está no `<tr>`, e sem
       parar a propagação o botão reativa e navega junto -- a pessoa perde a
       lista de vista no meio da ação. */
    expect(screen.queryByText("detalhe 1")).not.toBeInTheDocument();
    await waitFor(() => expect(mocks.reativarCliente).toHaveBeenCalledWith("1"));

    /* O "Desfazer" arquiva de novo -- e essa volta PODE ser recusada, então
       o aviso existe justamente para ela aparecer. */
    await user.click(await screen.findByRole("button", { name: "Desfazer" }));
    await waitFor(() => expect(mocks.arquivarCliente).toHaveBeenCalledWith("1"));
  });

  it("em Todos o arquivado vem com a etiqueta", async () => {
    mocks.listarClientes.mockResolvedValue({
      clientes: [
        { cliente_id: "1", nome: "Fulano", processos: 3 },
        { cliente_id: "2", nome: "Sicrano", arquivado_em: "2026-09-15T18:30:00+00:00", arquivado_por: "chefe" },
      ],
      total: 2,
      total_paginas: 1,
    });
    montar("/clientes?estado=todos");

    expect(await screen.findByText("Sicrano")).toBeInTheDocument();
    expect(screen.getByText("Arquivado")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Processos" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Reativar" })).toHaveLength(1);
  });

  it("sem permissão de manager, o arquivado não ganha Reativar", async () => {
    mocks.papelAtende.mockReturnValue(false);
    mocks.listarClientes.mockResolvedValue({
      clientes: [{ cliente_id: "1", nome: "Fulano", arquivado_em: "2026-09-15T18:30:00+00:00", arquivado_por: "chefe" }],
      total: 1,
      total_paginas: 1,
    });
    montar("/clientes?estado=arquivados");

    await screen.findByText("Fulano");
    expect(screen.queryByRole("button", { name: "Reativar" })).not.toBeInTheDocument();
  });

  it("sem permissão de manager, não mostra o botão de criar", async () => {
    mocks.papelAtende.mockReturnValue(false);
    montar();
    await screen.findByText("Fulano");

    expect(
      screen.queryByRole("button", { name: "+ Novo cliente" }),
    ).not.toBeInTheDocument();
  });
});

// ── 🔴 a guarda de descarte, e a armadilha da MÁSCARA ─────────────────────

describe("guarda de descarte no Novo cliente", () => {
  async function abrir() {
    const user = userEvent.setup();
    montar();
    await screen.findByText("Fulano");
    await user.click(screen.getByRole("button", { name: "+ Novo cliente" }));
    await screen.findByLabelText(/^Nome/);
    return user;
  }

  const perguntou = () => screen.queryByText("Sair sem salvar?") !== null;

  it("intacto, o Escape fecha direto", async () => {
    const user = await abrir();

    await user.keyboard("{Escape}");

    expect(perguntou()).toBe(false);
    expect(screen.queryByLabelText(/^Nome/)).not.toBeInTheDocument();
  });

  it("com o nome começado, pergunta -- e diz que é um CADASTRO", async () => {
    const user = await abrir();

    await user.type(screen.getByLabelText(/^Nome/), "Construtora");
    await user.keyboard("{Escape}");

    expect(perguntou()).toBe(true);
    // texto do caso "criacao", não o de edição
    expect(screen.getByRole("button", { name: "Continuar preenchendo" })).toBeInTheDocument();
  });

  it("🔴 limpar o telefone volta a fechar direto", async () => {
    const user = await abrir();
    const telefone = screen.getByLabelText(/Telefone/);

    await user.type(telefone, "31988887777");
    await user.clear(telefone);

    await user.keyboard("{Escape}");

    expect(perguntou()).toBe(false);
  });

  it("🔴 digitar e APAGAR o telefone com backspace volta a fechar direto", async () => {
    /* Este teste nasceu vermelho e ficou verde consertando `mascararTelefone`.
       Antes, o parêntese fechava já no segundo dígito e o campo travava em
       `(31)`: quem digitasse dois dígitos sem querer era perguntado ao sair,
       para sempre, sem conseguir desfazer. Foi a guarda de descarte que
       tornou o defeito visível. */
    const user = await abrir();
    const telefone = screen.getByLabelText(/Telefone/);

    await user.type(telefone, "31");
    await user.type(telefone, "{Backspace}{Backspace}");
    expect(telefone).toHaveValue("");

    await user.keyboard("{Escape}");

    expect(perguntou()).toBe(false);
  });
});
