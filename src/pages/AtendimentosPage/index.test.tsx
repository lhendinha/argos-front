import { screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({
  listarAtendimentos: vi.fn(),
  listarClientes: vi.fn(),
  listarSubgrupos: vi.fn(),
  listarTodosOsMembrosDoGrupo: vi.fn(),
  listarProcessos: vi.fn(),
  criarAtendimento: vi.fn(),
  papelAtende: vi.fn(),
}));
const navegou = vi.hoisted(() => vi.fn());

vi.mock("../../services", () => mocks);
vi.mock("react-router-dom", async (original) => ({
  ...(await original<typeof import("react-router-dom")>()),
  useNavigate: () => navegou,
}));

import AtendimentosPage from "./index";

function atendimento(parcial: Record<string, unknown> = {}) {
  return {
    subgrupo_id: "s1",
    atendimento_id: "a1",
    assunto: "Revisão de contrato",
    status: "Em andamento",
    criado_em: "2026-08-10T09:00:00+00:00",
    cliente_ids: ["c1"],
    cliente_nomes: ["Maria Souza"],
    /* Data do registro DIFERENTE da criação de propósito: a linha mostra as
       duas (criação à esquerda, último registro à direita), e com a mesma
       data não dá pra distinguir qual está sendo verificada. */
    ultimo_registro:
      { autor_id: "ana@x.com", autor_nome: "Ana Paula", registrado_em: "2026-08-12T09:00:00+00:00", texto: "Primeiro contato" },
    quantidade_de_registros: 1,
    ...parcial,
  };
}

function comLista(lista: Record<string, unknown>[], total = lista.length) {
  mocks.listarAtendimentos.mockResolvedValue({
    atendimentos: lista,
    total,
    total_paginas: Math.max(1, Math.ceil(total / 10)),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.papelAtende.mockReturnValue(true);
  mocks.listarClientes.mockResolvedValue({
    clientes: [{ cliente_id: "c1", nome: "Maria Souza", grupo_id: "g1" }],
  });
  mocks.listarSubgrupos.mockResolvedValue({
    subgrupos: [{ subgrupo_id: "s1", nome: "Cível" }],
  });
  mocks.listarProcessos.mockResolvedValue({ processos: [] });
  mocks.listarTodosOsMembrosDoGrupo.mockResolvedValue({
    membros: [{ email: "ana@x.com", apelido: "Ana Paula" }],
  });
  comLista([atendimento()]);
});

/** ⚠️ Dentro de `MemoryRouter`, como o teste de `ProcessosPage`. A tela
 * passou a ler `useLocation()` -- a Área de trabalho abre ela já filtrada
 * por "Atendimentos em andamento" --, e `useLocation` fora de um Router
 * lança. `useNavigate` continua mockado, então nada navega de verdade.
 *
 * `estadoInicial` é o que a navegação carrega: é assim que o número do
 * Resumo rápido chega aqui. */
async function montar(estadoInicial?: Record<string, unknown>) {
  renderComProviders(
    <MemoryRouter initialEntries={[{ pathname: "/atendimentos", state: estadoInicial }]}>
      <AtendimentosPage />
    </MemoryRouter>,
  );
  return await screen.findByRole("heading", { name: "Atendimentos" });
}

describe("lista", () => {
  it("🔴 mostra de qual SUBGRUPO é o atendimento, ao lado do status", async () => {
    /* A lista mistura os subgrupos da pessoa, e sem isto dois atendimentos de
       assunto parecido ficam indistinguíveis -- que é o relato que originou
       esta frente.

       ⚠️ A etiqueta fica ao lado da de status, no mesmo `Flex`, e não numa
       linha própria: ali já existe uma etiqueta, e agrupar as duas é mais
       limpo que espalhá-las. Medido em Chrome antes de escrever: sobram 124px
       na linha, contra ~90px da etiqueta.

       ⚠️ O discriminador é o `title` de `EtiquetasDeSubgrupo` -- o que texto
       solto não tem. Cor e raio quebrariam no primeiro ajuste de tema. */
    await montar();
    await screen.findByText(/Revisão de contrato/);

    expect(screen.getByTitle("Cível")).toHaveTextContent("Cível");
  });

  it("⚠️ o par negativo: sem o subgrupo no catálogo, mostra o id -- e não some", async () => {
    /* Sumir faria a linha mentir: leria como atendimento sem subgrupo, o que
       não existe. O id é feio e honesto. */
    mocks.listarSubgrupos.mockResolvedValue({ subgrupos: [] });
    await montar();
    await screen.findByText(/Revisão de contrato/);

    expect(screen.getByTitle("s1")).toHaveTextContent("s1");
  });

  it("mostra assunto, status e o nome do cliente -- não o id", async () => {
    await montar();
    expect(await screen.findByText(/Revisão de contrato/)).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();
    /* 🔴 Mostrar "c1" não diz nada a ninguém. O nome vem em
       `cliente_nomes`, DENTRO do atendimento -- antes a tela baixava o
       catálogo inteiro de clientes pra traduzir. */
    expect(screen.getByText("Maria Souza")).toBeInTheDocument();
    expect(screen.queryByText("c1")).not.toBeInTheDocument();
  });

  it("a prévia é o último registro que vem pronto no atendimento", async () => {
    /* A pergunta de quem varre a lista é "em que pé isso está" -- o
     * primeiro registro é o que ela já sabe. */
    comLista([
      atendimento({
        ultimo_registro: { autor_id: "ana@x.com", autor_nome: "Ana Paula", registrado_em: "2026-08-12T09:00:00Z", texto: "Cliente retornou" },
      }),
    ]);
    await montar();
    expect(await screen.findByText("Cliente retornou")).toBeInTheDocument();
  });

  it("🔴 a lista antiga de registros, se ainda vier, NÃO vira prévia", async () => {
    /* A lista sai da resposta no passo 4 (regra 9 da seção 0): a tela que
       ainda a lesse mostraria a prévia até lá e a perderia depois. */
    comLista([
      atendimento({
        ultimo_registro: null,
        registros: [
          { autor_id: "ana@x.com", autor_nome: "Ana Paula", registrado_em: "2026-08-10T09:00:00Z", texto: "Da lista antiga" },
        ],
      }),
    ]);
    await montar();
    await screen.findByText(/Revisão de contrato/);
    expect(screen.queryByText("Da lista antiga")).not.toBeInTheDocument();
  });

  it("conta quantos mostra de quantos existem", async () => {
    comLista([atendimento()], 12);
    await montar();
    expect(await screen.findByText("Mostrando 1 de 12 atendimentos")).toBeInTheDocument();
  });

  it("abre o detalhe pelo par (subgrupo, id)", async () => {
    /* O id sozinho não endereça: a chave primária é o par. */
    await montar();
    /* A linha da tabela, e não um `<button>`: acima do limiar esta lista é
       tabela como as outras sete, e a linha carrega `tabIndex` + Enter. */
    await userEvent.click(await screen.findByText("Revisão de contrato"));
    expect(navegou).toHaveBeenCalledWith("/atendimentos/s1/a1");
  });
});

describe("autor do último registro", () => {
  it("o avatar usa o APELIDO, não o e-mail", async () => {
    /* O avatar tira as iniciais do que recebe. Sem resolver, a lista dava
     * "AN" (de "ana@x.com") enquanto o detalhe dava "AP" (de "Ana Paula"),
     * pra mesma pessoa. */
    await montar();
    expect(await screen.findByText("AP")).toBeInTheDocument();
  });

  it("cai no e-mail quando o apelido não existe", async () => {
    /* `autor_nome` ausente: quem nunca definiu apelido, ou autor de outro
       grupo. As iniciais do e-mail ainda identificam, e sumir com o avatar
       seria pior. */
    comLista([atendimento({
      ultimo_registro: { autor_id: "ana@x.com", autor_nome: null,
                         registrado_em: "2026-08-12T09:00:00Z", texto: "Primeiro contato" },
    })]);
    await montar();
    expect(await screen.findByText("AN")).toBeInTheDocument();
  });
});

describe("filtros", () => {
  it("manda o status escolhido pro servidor", async () => {
    await montar();
    await userEvent.click(screen.getByRole("button", { name: /Todos/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Fechados" }));

    await waitFor(() =>
      expect(mocks.listarAtendimentos).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Fechado" }),
      ),
    );
  });

  it("'Todos' NÃO manda status -- é como o servidor entende 'sem filtro'", async () => {
    await montar();
    await waitFor(() => expect(mocks.listarAtendimentos).toHaveBeenCalled());
    expect(mocks.listarAtendimentos).toHaveBeenCalledWith(
      expect.objectContaining({ status: undefined }),
    );
  });

  it("busca vai pro SERVIDOR, não é peneirada no cliente", async () => {
    // Peneirar aqui esconderia atendimento que está na página seguinte.
    await montar();
    await userEvent.type(screen.getByLabelText("Buscar atendimentos"), "contrato");

    await waitFor(
      () =>
        expect(mocks.listarAtendimentos).toHaveBeenCalledWith(
          expect.objectContaining({ busca: "contrato" }),
        ),
      { timeout: 3000 },
    );
  });
});

describe("vazio", () => {
  it("sem nada e sem filtro, diz que não há nada", async () => {
    comLista([]);
    await montar();
    expect(await screen.findByText("Nenhum atendimento registrado ainda.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
  });

  it("vazio POR FILTRO diz outra coisa, e oferece limpar", async () => {
    /* Confundir os dois faz a pessoa concluir que o sistema está vazio. */
    comLista([]);
    await montar();
    await userEvent.click(screen.getByRole("button", { name: /Todos/ }));
    await userEvent.click(await screen.findByRole("menuitem", { name: "Fechados" }));

    expect(await screen.findByText("Nenhum atendimento com os filtros atuais.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    expect(await screen.findByText("Nenhum atendimento registrado ainda.")).toBeInTheDocument();
  });
});

describe("criar", () => {
  it("Salvar fica travado enquanto falta obrigatório", async () => {
    await montar();
    await userEvent.click(screen.getByRole("button", { name: /Adicionar atendimento/ }));

    const modal = await screen.findByRole("dialog");
    expect(within(modal).getByRole("button", { name: "Salvar" })).toBeDisabled();
  });

  it("cria com clientes, assunto, subgrupo e primeiro registro", async () => {
    mocks.criarAtendimento.mockResolvedValue({ atendimento_id: "novo" });
    await montar();
    await userEvent.click(screen.getByRole("button", { name: /Adicionar atendimento/ }));

    const modal = await screen.findByRole("dialog");
    await userEvent.type(within(modal).getByRole("combobox", { name: /Clientes/ }), "Maria");
    await userEvent.click(await within(modal).findByRole("button", { name: "Maria Souza" }));

    await userEvent.type(within(modal).getByLabelText(/Assunto/), "Nova demanda");
    await userEvent.type(within(modal).getByLabelText(/1º registro/), "Cliente ligou hoje");

    await userEvent.click(within(modal).getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(mocks.criarAtendimento).toHaveBeenCalled());
    expect(mocks.criarAtendimento).toHaveBeenCalledWith({
      subgrupo_id: "s1",
      assunto: "Nova demanda",
      cliente_ids: ["c1"],
      primeiro_registro: "Cliente ligou hoje",
      /* ⚠️ VAZIO de propósito, e não o e-mail de quem cria: o default é
         resolvido no SERVIDOR (vira quem está criando, SE for membro do
         subgrupo). Repor aqui exigiria replicar essa régua na tela -- e é
         justamente o que faz o `manager` não-membro continuar conseguindo
         cadastrar, num fluxo que já funcionava. */
      responsaveis: [],
      processo_numero: null,
    });
  });

  it("a etiqueta do cliente escolhido mostra o NOME", async () => {
    await montar();
    await userEvent.click(screen.getByRole("button", { name: /Adicionar atendimento/ }));

    const modal = await screen.findByRole("dialog");
    await userEvent.type(within(modal).getByRole("combobox", { name: /Clientes/ }), "Maria");
    await userEvent.click(await within(modal).findByRole("button", { name: "Maria Souza" }));

    // A busca esvazia depois de escolher; a etiqueta é o único lugar onde a
    // pessoa confere se escolheu certo.
    expect(
      within(modal).getByRole("button", { name: "Remover Maria Souza" }),
    ).toBeInTheDocument();
  });
});

describe("erro", () => {
  it("oferece tentar de novo", async () => {
    mocks.listarAtendimentos.mockRejectedValue(new Error("caiu"));
    renderComProviders(
      <MemoryRouter>
        <AtendimentosPage />
      </MemoryRouter>,
    );
    expect(
      await screen.findByRole("button", { name: /Tentar de novo/ }, { timeout: 8000 }),
    ).toBeInTheDocument();
  });
});

describe("a forma de tabela", () => {
  /* 🔴 **Estes dois testes travavam o desenho que foi SUBSTITUÍDO.** Um
   * exigia a data de criação como elemento próprio, em primeiro lugar --
   * esta era a única lista do sistema que começava por QUANDO em vez de por
   * O QUÊ. O outro exigia o ícone de pessoas antes do nome do cliente, que
   * numa tabela é o cabeçalho quem diz.
   *
   * Eles não foram apagados por incômodo: a lista virou tabela de cinco
   * colunas, e o que eles travavam deixou de existir. O que fica travado é
   * o que a tabela precisa ter. */

  it("tem cabeçalho, e é ele que nomeia as colunas", async () => {
    /* A lista antiga não tinha nenhum: data, assunto, duas pílulas e um
       avatar, e você aprendia a ler pela posição. */
    await montar();
    expect(await screen.findByText("Assunto")).toBeInTheDocument();
    for (const coluna of ["Cliente", "Situação", "Último registro", "Atualizado"]) {
      expect(screen.getByText(coluna)).toBeInTheDocument();
    }
  });

  it("a linha é alcançável pelo teclado", async () => {
    /* A linha inteira é clicável e não há ação dentro dela: sem `tabIndex`,
       quem navega por Tab não abre atendimento nenhum. */
    await montar();
    const linha = (await screen.findByText("Revisão de contrato")).closest("tr");
    expect(linha).toHaveAttribute("tabindex", "0");
  });
});

describe("filtro por subgrupo", () => {
  /* 🔴 Mesma régua de Processos e Documentos: com UM subgrupo o controle não
     filtra nada, e controle sem efeito é pior que controle nenhum.

     ⚠️ E aqui o filtro não é só conveniência -- `atendimentos_repository`
     faz uma Query POR SUBGRUPO, então escolher um troca N idas ao banco por
     uma. Ver o guarda `test_escolher_subgrupo_faz_UMA_query...` na API. */
  const DOIS = [
    { subgrupo_id: "s1", nome: "Cível" },
    { subgrupo_id: "s2", nome: "Trabalhista" },
  ];

  it("aparece quando a pessoa vê mais de um subgrupo", async () => {
    mocks.listarSubgrupos.mockResolvedValue({ subgrupos: DOIS });
    await montar();
    expect(await screen.findByText("Todos os subgrupos")).toBeInTheDocument();
  });

  it("NÃO aparece com um subgrupo só", async () => {
    /* O par negativo. O `beforeEach` já deixa um subgrupo só, então este
       teste também prova que o padrão da suíte não mascara o de cima. */
    await montar();
    expect(screen.queryByText("Todos os subgrupos")).not.toBeInTheDocument();
  });

  it("escolher um subgrupo manda `subgrupoId` para a API", async () => {
    mocks.listarSubgrupos.mockResolvedValue({ subgrupos: DOIS });
    await montar();
    await userEvent.click(await screen.findByText("Todos os subgrupos"));
    await userEvent.click(await screen.findByText("Trabalhista"));
    await waitFor(() =>
      expect(mocks.listarAtendimentos).toHaveBeenLastCalledWith(
        expect.objectContaining({ subgrupoId: "s2" }),
      ),
    );
  });
});
