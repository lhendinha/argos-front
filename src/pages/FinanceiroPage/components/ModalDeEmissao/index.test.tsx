import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  emitirFatura: vi.fn(),
  listarAFaturarDoCliente: vi.fn(),
  naoCobrarLancamento: vi.fn(),
  voltarACobrarLancamento: vi.fn(),
  papelAtende: vi.fn(() => true),
}));
vi.mock("../../../../services", () => mocks);

import { renderComProviders } from "../../../../test/queryTestUtils";
import ModalDeEmissao from ".";
import type { ClienteAFaturar, Lancamento } from "../../../../types";

function lancamento(extra: Partial<Lancamento> = {}): Lancamento {
  return {
    lancamento_id: "l1", tipo: "honorario", descricao: "Honorários da contestação",
    valor_centavos: 800000, data_vencimento: "2026-09-20", situacao: "aberto",
    natureza: "entrada", conta_id: "c1", categoria_id: "cat1", centro_id: "",
    rateio: [], cliente_id: "cli1", contraparte: "", subgrupo_id: "",
    numero_processo: "", atendimento_id: "", responsavel: "", documento_numero: "",
    parcela: "", criado_por: "x", criado_em: "2026-09-01T00:00:00Z",
    ...extra,
  } as Lancamento;
}

/** O resumo que a LISTA entrega: sem os lançamentos. */
const CLIENTE: ClienteAFaturar = {
  cliente_id: "cli1",
  cliente_nome: "Construtora Alfa",
  honorarios_centavos: 1200000,
  despesas_centavos: 48000,
  total_centavos: 1248000,
  quantidade: 3,
  mais_antigo: "2026-09-20",
};

const DO_CLIENTE = {
  cliente_id: "cli1",
  lancamentos: [
    lancamento(),
    lancamento({ lancamento_id: "l2", descricao: "Honorários da audiência", valor_centavos: 400000 }),
    lancamento({
      lancamento_id: "l3", tipo: "saida", natureza: "saida", data_efetivacao: "2026-09-03",
      descricao: "Custas de distribuição", valor_centavos: 48000,
    }),
  ],
};

const onFechar = vi.fn();
const onEmitida = vi.fn();

function montar(cliente = CLIENTE) {
  return renderComProviders(
    <ModalDeEmissao cliente={cliente} onFechar={onFechar} onEmitida={onEmitida} />,
  );
}

/** Espera os lançamentos do cliente chegarem -- eles vêm ao abrir. */
const caixasCarregadas = () => screen.findAllByRole("checkbox");

beforeEach(() => {
  vi.clearAllMocks();
  /* ⚠️ `mockReset`, e não só o `clearAllMocks`: este não esvazia a fila de
     `mockRejectedValueOnce`, e um teste vazaria no seguinte. */
  mocks.listarAFaturarDoCliente.mockReset();
  mocks.listarAFaturarDoCliente.mockResolvedValue(DO_CLIENTE);
  mocks.emitirFatura.mockResolvedValue({ fatura_id: "f9", numero: "2026-0008" });
  mocks.naoCobrarLancamento.mockReset();
  mocks.naoCobrarLancamento.mockResolvedValue({});
  mocks.voltarACobrarLancamento.mockResolvedValue({});
});

describe("os lançamentos do cliente", () => {
  it("🔴 vêm do servidor AO ABRIR, pelo cliente -- a lista só trouxe o resumo", async () => {
    montar();
    await caixasCarregadas();
    expect(mocks.listarAFaturarDoCliente).toHaveBeenCalledWith("cli1");
  });

  it("⚠️ enquanto não chegam, não há caixa e o botão fica desabilitado", async () => {
    mocks.listarAFaturarDoCliente.mockReturnValue(new Promise(() => {}));
    montar();
    expect(screen.getByText(/Emitir fatura · Construtora Alfa/)).toBeInTheDocument();
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeDisabled();
  });

  it("falha ao carregar diz isso, e tentar de novo traz os lançamentos", async () => {
    mocks.listarAFaturarDoCliente.mockRejectedValueOnce(new Error("rede"));
    montar();
    expect(
      await screen.findByText("Não foi possível carregar os lançamentos deste cliente."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: /tentar/i }));
    expect(await caixasCarregadas()).toHaveLength(3);
  });

  it("⚠️ faturado por outra pessoa entre a lista e o clique: diz que não há nada, e não deixa emitir", async () => {
    mocks.listarAFaturarDoCliente.mockResolvedValue({ cliente_id: "cli1", lancamentos: [] });
    montar();
    expect(await screen.findByText("Nada deste cliente para faturar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeDisabled();
  });
});

describe("a prévia", () => {
  it("abre com TUDO marcado -- o caminho comum é cobrar tudo", async () => {
    montar();
    const caixas = await caixasCarregadas();
    expect(caixas).toHaveLength(3);
    for (const c of caixas) expect(c).toBeChecked();
  });

  it("🔴 a DESPESA se anuncia: ela não é cobrança, é reembolso", async () => {
    /* Somá-la como se o cliente devesse a despesa faria o total do documento
       não bater com o que ele paga. */
    montar();
    expect(await screen.findByText("Despesa adiantada · entra como reembolso")).toBeInTheDocument();
    /* E só ela: os dois honorários não recebem a frase. */
    expect(screen.getAllByText("Despesa adiantada · entra como reembolso")).toHaveLength(1);
  });

  it("🔴 desmarcar uma linha RECALCULA o total", async () => {
    /* A fatura é um documento que o cliente recebe: o número tem de ser o do
       que entrou. */
    montar();
    expect(await screen.findByText("R$ 12.480,00")).toBeInTheDocument();

    await userEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(await screen.findByText("R$ 8.480,00")).toBeInTheDocument();
    expect(screen.queryByText("R$ 12.480,00")).not.toBeInTheDocument();
  });

  it("e a contagem acompanha", async () => {
    montar();
    expect(await screen.findByText("3 lançamentos")).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(await screen.findByText("2 lançamentos")).toBeInTheDocument();
  });

  it("marcar de volta soma de novo -- o par negativo", async () => {
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getAllByRole("checkbox")[1]);
    await screen.findByText("R$ 8.480,00");
    await userEvent.click(screen.getAllByRole("checkbox")[1]);
    expect(await screen.findByText("R$ 12.480,00")).toBeInTheDocument();
  });
});

describe("a guarda de descarte", () => {
  it("⚠️ a CHEGADA dos lançamentos não conta como mudança: fechar sem mexer fecha", async () => {
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onFechar).toHaveBeenCalled();
  });

  it("desmarcar conta -- o par negativo: fechar não fecha direto", async () => {
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: "Fechar" }));
    expect(onFechar).not.toHaveBeenCalled();
  });
});

describe("emitir", () => {
  it("🔴 com ZERO marcadas o botão fica desabilitado", async () => {
    /* Fatura vazia não é documento. Deixar emitir e receber 400 seria
       empurrar ao servidor uma pergunta que a tela já sabe responder. */
    montar();
    for (const c of await caixasCarregadas()) await userEvent.click(c);
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeDisabled();
  });

  it("manda SÓ os marcados, com o vencimento", async () => {
    montar();
    await userEvent.click((await caixasCarregadas())[2]);
    await userEvent.click(screen.getByRole("button", { name: "Emitir fatura" }));

    await waitFor(() => expect(mocks.emitirFatura).toHaveBeenCalled());
    const corpo = mocks.emitirFatura.mock.calls[0][0];
    expect(corpo.cliente_id).toBe("cli1");
    expect(corpo.lancamento_ids).toEqual(["l1", "l2"]);
    expect(corpo.data_vencimento).toBeTruthy();
  });

  it("emitida, leva para o documento", async () => {
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getByRole("button", { name: "Emitir fatura" }));
    await waitFor(() => expect(onEmitida).toHaveBeenCalledWith("f9"));
  });

  it("🔴 a recusa do servidor aparece no FORMULÁRIO, e o modal fica aberto", async () => {
    const { ApiError } = await import("../../../../services/api/client");
    mocks.emitirFatura.mockRejectedValue(
      new ApiError("Um dos lançamentos já está em outra fatura", 409),
    );
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getByRole("button", { name: "Emitir fatura" }));

    expect(
      await screen.findByText("Um dos lançamentos já está em outra fatura"),
    ).toBeInTheDocument();
    expect(onEmitida).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Emitir fatura" })).toBeInTheDocument();
  });
});

describe("não cobrar", () => {
  it("🔴 só a DESPESA tem o botão -- o honorário em aberto já sai desmarcando", async () => {
    montar();
    await caixasCarregadas();
    expect(screen.getAllByRole("button", { name: /^Não cobrar/ })).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Não cobrar Custas de distribuição" })).toBeInTheDocument();
  });

  it("o texto diz a diferença entre desmarcar e não cobrar", async () => {
    montar();
    await caixasCarregadas();
    expect(screen.getByText("Desmarque")).toBeInTheDocument();
    expect(screen.getByText(/para tirar uma despesa de vez/)).toBeInTheDocument();
  });

  it("⚠️ a despesa paga diz 'adiantada em', e o honorário 'vence'", async () => {
    montar();
    await caixasCarregadas();
    expect(screen.getByText("adiantada em 03/09/2026")).toBeInTheDocument();
    expect(screen.getAllByText("vence 20/09/2026")).toHaveLength(2);
  });

  it("🔴 clicar tira a despesa da lista na hora, e o aviso traz o Desfazer", async () => {
    montar();
    await caixasCarregadas();
    /* ⚠️ A nova busca fica PENDENTE: se ela voltasse sem a despesa, a linha sumiria de qualquer jeito e o teste não
       provaria o "na hora" -- a mutação que tirava o `setQueryData` passava verde assim. */
    mocks.listarAFaturarDoCliente.mockReturnValue(new Promise(() => {}));
    await userEvent.click(screen.getByRole("button", { name: "Não cobrar Custas de distribuição" }));

    await waitFor(() => expect(mocks.naoCobrarLancamento).toHaveBeenCalledWith("l3"));
    await waitFor(() => expect(screen.getAllByRole("checkbox")).toHaveLength(2));
    expect(screen.queryByText("Custas de distribuição")).not.toBeInTheDocument();
    expect(await screen.findByText("Custas de distribuição não será cobrada.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Desfazer" }));
    await waitFor(() => expect(mocks.voltarACobrarLancamento).toHaveBeenCalledWith("l3"));
  });

  it("a recusa do servidor aparece no formulário, e a despesa fica -- o par negativo", async () => {
    const { ApiError } = await import("../../../../services/api/client");
    mocks.naoCobrarLancamento.mockRejectedValue(new ApiError("Essa despesa já está marcada para não cobrar", 409));
    montar();
    await caixasCarregadas();
    await userEvent.click(screen.getByRole("button", { name: "Não cobrar Custas de distribuição" }));

    expect(await screen.findByText("Essa despesa já está marcada para não cobrar")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
  });
});
