import { useNavigate } from "react-router-dom";

import { Botao, Etiqueta, ItemDeLista } from "../../../../components";
import { ESTADO_DE_CLIENTE_TODOS } from "../../../../constants";
import { formatarDataDeInstante, mascararCpfCnpj, mascararTelefone } from "../../../../utils";
import { CORES_DO_CLIENTE_ARQUIVADO } from "../../../../theme/cliente";
import type { ItemDeClienteProps } from "./types";

/** A linha de Clientes onde não cabem colunas.
 *
 * ⚠️ A pílula "Arquivado" vai nas ETIQUETAS, e não colada ao nome: o
 * identificador é uma linha de texto só, e uma pílula ali dentro faria o
 * nome longo quebrar em volta dela.
 */
export default function ItemDeCliente({
  cliente,
  estado,
  podeReativar,
  onReativar,
  reativando,
}: ItemDeClienteProps) {
  const navegar = useNavigate();
  const arquivado = Boolean(cliente.arquivado_em);
  const telefone = mascararTelefone(cliente.telefone || "");
  const documento = mascararCpfCnpj(cliente.cpf_cnpj || "");
  const contato = [telefone, cliente.email].filter(Boolean).join(" · ");
  const mostrarEtiqueta = arquivado && estado === ESTADO_DE_CLIENTE_TODOS;

  return (
    <ItemDeLista
      onAbrir={() => navegar(`/clientes/${cliente.cliente_id}`)}
      rotulo={cliente.nome}
      identificador={cliente.nome}
      apoio={
        arquivado
          ? `Arquivado por ${cliente.arquivado_por ?? "—"} em ${formatarDataDeInstante(cliente.arquivado_em ?? "")}`
          : contato || undefined
      }
      etiquetas={
        mostrarEtiqueta ? (
          <Etiqueta cores={CORES_DO_CLIENTE_ARQUIVADO}>Arquivado</Etiqueta>
        ) : undefined
      }
      rodape={{
        texto: documento || undefined,
        mono: true,
        destaque: arquivado
          ? undefined
          : `${cliente.processos ?? 0} processo${(cliente.processos ?? 0) === 1 ? "" : "s"}`,
      }}
      acoes={
        arquivado && podeReativar ? (
          <Botao variante="ghost" onClick={onReativar} disabled={reativando}>
            {reativando ? "Reativando…" : "Reativar"}
          </Botao>
        ) : undefined
      }
    />
  );
}
