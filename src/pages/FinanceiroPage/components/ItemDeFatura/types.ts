import type { Fatura } from "../../../../types";

export interface ItemDeFaturaProps {
  fatura: Fatura;
  /** O nome do cliente, resolvido por quem chama -- a fatura traz só o id. */
  nomeDoCliente: (clienteId: string) => string;
  onAbrir: (faturaId: string) => void;
}
