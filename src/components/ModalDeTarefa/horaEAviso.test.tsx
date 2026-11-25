/** A hora e o aviso no modal de tarefa, e a leitura pela chave ao editar (D3, D4, D21). */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderComProviders } from "../../test/queryTestUtils";

const mocks = vi.hoisted(() => ({
  criarTarefa: vi.fn(),
  atualizarTarefa: vi.fn(),
  removerTarefa: vi.fn(),
  listarQuadro: vi.fn(),
  listarMembrosDoSubgrupo: vi.fn(),
  listarSubgrupos: vi.fn(),
  listarProcessos: vi.fn(),
  listarAtendimentos: vi.fn(),
  listarClientes: vi.fn(),
  detalhesTarefa: vi.fn(),
}));

vi.mock("../../services", () => mocks);

import ModalDeTarefa from "./index";
import { ApiError } from "../../services/api/client";
import type { Tarefa } from "../../types";

/** Como a LISTA a entrega: sem o aviso, que a lista das abertas não projeta. */
const DA_LISTA = {
  tarefa_id: "t1", subgrupo_id: "s1", titulo: "Audiência", data: "2026-12-01", hora: "14:00",
  prioridade: "Média", coluna_id: "c1",
} as Tarefa;
/** Como a CHAVE a entrega: inteira. */
const LIDA = { ...DA_LISTA, aviso_minutos: 60 } as Tarefa;

beforeEach(() => {
  vi.clearAllMocks();
  mocks.listarQuadro.mockResolvedValue({ colunas: [{ coluna_id: "c1", nome: "A fazer", ordem: 1 }] });
  mocks.listarMembrosDoSubgrupo.mockResolvedValue({ membros: [] });
  mocks.listarSubgrupos.mockResolvedValue({ subgrupos: [{ subgrupo_id: "s1", nome: "Cível", grupo_id: "g1" }] });
  mocks.listarProcessos.mockResolvedValue({ processos: [] });
  mocks.listarAtendimentos.mockResolvedValue({ atendimentos: [] });
  mocks.listarClientes.mockResolvedValue({ clientes: [] });
  mocks.detalhesTarefa.mockResolvedValue(LIDA);
  mocks.atualizarTarefa.mockResolvedValue({ mensagem: "atualizada" });
  mocks.criarTarefa.mockResolvedValue({ tarefa_id: "novo" });
});

function montar(tarefa?: Tarefa | null) {
  const onSalvo = vi.fn();
  const onFechar = vi.fn();
  const tela = renderComProviders(
    <MemoryRouter>
      <ModalDeTarefa tarefa={tarefa} subgrupoAtual="s1" onSalvo={onSalvo} onFechar={onFechar} />
    </MemoryRouter>,
  );
  return { onSalvo, onFechar, tela };
}

describe("editar lê a tarefa pela chave (D21)", () => {
  it("🔴 o aviso que a lista não trouxe aparece, porque o modal leu a tarefa", async () => {
    montar(DA_LISTA);
    expect(await screen.findByRole("radio", { name: "1 h" })).toHaveAttribute("aria-checked", "true");
    expect(mocks.detalhesTarefa).toHaveBeenCalledWith("s1", "t1");
  });

  it("salvar sem mexer manda a mesma hora e o mesmo aviso -- o servidor não rearma", async () => {
    const usuario = userEvent.setup();
    montar(DA_LISTA);
    await screen.findByRole("radio", { name: "1 h" });
    await screen.findByText("A fazer");
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(mocks.atualizarTarefa).toHaveBeenCalled());
    expect(mocks.atualizarTarefa.mock.calls[0][2]).toMatchObject({ hora: "14:00", aviso_minutos: 60 });
  });

  it("reabrir depois de salvar mostra o valor NOVO, e não o do cache", async () => {
    const primeira = montar(DA_LISTA);
    await screen.findByRole("radio", { name: "1 h" });
    primeira.tela.unmount();
    mocks.detalhesTarefa.mockResolvedValue({ ...LIDA, hora: "16:30", aviso_minutos: 15 });

    montar(DA_LISTA);
    expect(await screen.findByRole("radio", { name: "15 min" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Horário")).toHaveValue("16:30");
  });

  it("404 ao abrir: avisa que foi excluída, fecha e recarrega a lista", async () => {
    mocks.detalhesTarefa.mockRejectedValue(new ApiError("Tarefa não encontrada", 404));
    const { onSalvo, onFechar } = montar(DA_LISTA);

    expect(await screen.findByText("Esta tarefa foi excluída.")).toBeInTheDocument();
    expect(onFechar).toHaveBeenCalledTimes(1);
    expect(onSalvo).toHaveBeenCalledTimes(1);
  });

  it("par negativo: criar não lê nada", async () => {
    montar();
    await screen.findByText("A fazer");
    expect(mocks.detalhesTarefa).not.toHaveBeenCalled();
    expect(screen.queryByText("Aviso antes")).not.toBeInTheDocument();
  });
});

describe("hora e aviso no formulário", () => {
  it("🔴 Sem horário manda a hora E o aviso nulos (D3), e o aviso some", async () => {
    const usuario = userEvent.setup();
    montar(DA_LISTA);
    await screen.findByRole("radio", { name: "1 h" });
    await usuario.click(screen.getByRole("button", { name: "Sem horário" }));

    expect(screen.queryByText("Aviso antes")).not.toBeInTheDocument();
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocks.atualizarTarefa).toHaveBeenCalled());
    expect(mocks.atualizarTarefa.mock.calls[0][2]).toMatchObject({ hora: null, aviso_minutos: null });
  });

  it("apagar a hora pelo próprio campo também manda o aviso nulo", async () => {
    const usuario = userEvent.setup();
    montar(DA_LISTA);
    await screen.findByRole("radio", { name: "1 h" });
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "" } });
    await usuario.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() => expect(mocks.atualizarTarefa).toHaveBeenCalled());
    expect(mocks.atualizarTarefa.mock.calls[0][2]).toMatchObject({ hora: null, aviso_minutos: null });
  });

  it("ligar o aviso vem com 1 hora; criar com hora manda os dois", async () => {
    const usuario = userEvent.setup();
    montar();
    await screen.findByText("A fazer");
    await usuario.type(screen.getByLabelText(/Descrição da tarefa/), "Reunião");
    fireEvent.change(screen.getByLabelText("Horário"), { target: { value: "09:30" } });
    await usuario.click(screen.getByText("Avisar antes do horário"));
    expect(screen.getByRole("radio", { name: "1 h" })).toHaveAttribute("aria-checked", "true");

    await usuario.click(screen.getByRole("button", { name: "Salvar" }));
    await waitFor(() => expect(mocks.criarTarefa).toHaveBeenCalled());
    expect(mocks.criarTarefa.mock.calls[0][0]).toMatchObject({ hora: "09:30", aviso_minutos: 60 });
  });

  it("hora incompleta trava o Salvar, em vez de virar 'sem horário'", async () => {
    montar(DA_LISTA);
    await screen.findByText("A fazer");
    const campo = screen.getByLabelText("Horário");
    Object.defineProperty(campo, "validity", { value: { badInput: true }, configurable: true });
    fireEvent.change(campo, { target: { value: "" } });

    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();
    expect(screen.getByText("Complete o horário, ou apague-o.")).toBeInTheDocument();
  });

  it("'Outro' mostra o valor gravado exato: 90 minutos não vira 2 horas", async () => {
    mocks.detalhesTarefa.mockResolvedValue({ ...LIDA, aviso_minutos: 90 });
    montar(DA_LISTA);
    expect(await screen.findByRole("radio", { name: "Outro" })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Quantidade")).toHaveValue(90);
  });
});
