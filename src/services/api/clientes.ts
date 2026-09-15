import type { CamposCliente, OpcoesListarClientes } from "../../types";
import { corpoDoEndereco } from "../../utils";
import { chamar } from "./client";

/** GET /clientes -- paginado de verdade. `CamposProcesso` (dropdown de
 * Cliente no processo) pede `tamanhoPagina: 100` pra cobrir a lista
 * inteira em vez de paginar de verdade. Se `busca` vier preenchido, ignora
 * pagina/tamanhoPagina -- é uma busca pontual, não paginada (mesmo corte
 * que clientes_router.py usa). */
export function listarClientes(opcoes: OpcoesListarClientes = {}) {
  const { pagina, tamanhoPagina, busca, estado } = opcoes;
  const query: Record<string, string | undefined> = busca
    ? { busca }
    : { pagina: pagina ? String(pagina) : undefined, tamanho_pagina: tamanhoPagina ? String(tamanhoPagina) : undefined };
  /* ⚠️ Vale nos DOIS ramos: a busca também respeita o estado, e sem ele
     procurar por um cliente arquivado não acharia nada. */
  return chamar("/clientes", { query: { ...query, estado } });
}

/** Um cliente por id -- é o que hidrata a página de detalhe num F5 ou num
 * link colado. Devolve também `processos`, a contagem derivada. */
export function detalheCliente(clienteId: string) {
  return chamar(`/clientes/${clienteId}`);
}

export function criarCliente(campos: CamposCliente) {
  return chamar("/clientes", {
    method: "POST",
    body: {
      nome: campos.nome, cpf_cnpj: campos.cpfCnpj || "",
      telefone: campos.telefone || "", email: campos.email || "",
      ...corpoDoEndereco(campos.endereco),
    },
  });
}

export function atualizarCliente(clienteId: string, campos: CamposCliente) {
  return chamar(`/clientes/${clienteId}`, {
    method: "PATCH",
    body: {
      nome: campos.nome, cpf_cnpj: campos.cpfCnpj || "",
      telefone: campos.telefone || "", email: campos.email || "",
      ...corpoDoEndereco(campos.endereco),
    },
  });
}

/** `POST`, não `DELETE`: o cliente continua existindo, só sai da lista e dos
 * seletores. `409` com `motivos` (lista) enquanto houver processo,
 * atendimento em andamento, fatura em aberto ou cobrança pendente. */
export function arquivarCliente(clienteId: string) {
  return chamar(`/clientes/${clienteId}/arquivar`, { method: "POST" });
}

export function reativarCliente(clienteId: string) {
  return chamar(`/clientes/${clienteId}/reativar`, { method: "POST" });
}
