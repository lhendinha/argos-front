import { Flex, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { Botao, Etiqueta, ItemDeLista } from "../../../../components";
import { ESTADO_DE_CLIENTE_TODOS } from "../../../../constants";
import { formatarDataDeInstante, mascararCpfCnpj, mascararTelefone } from "../../../../utils";
import { CORES_DO_CLIENTE_ARQUIVADO } from "../../../../theme/cliente";
import type { ItemDeClienteProps } from "./types";

/** Um cliente como ITEM de várias linhas, onde não há largura para as
 * colunas.
 *
 * 🔴 **A ordem responde à pergunta de quem abre a lista**: quem é, como
 * falar com ele, e quantos processos tem. Por isso o nome vem sozinho, o
 * contato vem logo abaixo -- é o que se procura no celular, onde tocar num
 * telefone é uma ação -- e a contagem fecha o item.
 *
 * ⚠️ **O documento sai daqui.** Ele identifica o cliente no papel, não na
 * tela: ninguém varre uma lista procurando um CPF. Fica no detalhe, a um
 * toque. O que entra no lugar dele é o contato, que a tabela relegava à
 * terceira coluna.
 *
 * ⚠️ "Reativar" é irmã do botão do item, não filha -- ver `ItemDeLista`.
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

  return (
    <ItemDeLista
      onAbrir={() => navegar(`/clientes/${cliente.cliente_id}`)}
      rotulo={cliente.nome}
      acoes={
        arquivado && podeReativar ? (
          <Botao variante="ghost" onClick={onReativar} disabled={reativando}>
            {reativando ? "Reativando…" : "Reativar"}
          </Botao>
        ) : undefined
      }
    >
      <Flex align="center" gap="6px" wrap="wrap" minW="0">
        <Text fontSize="14px" fontWeight="700" lineHeight="1.35">
          {cliente.nome}
        </Text>
        {arquivado && estado === ESTADO_DE_CLIENTE_TODOS && (
          <Etiqueta cores={CORES_DO_CLIENTE_ARQUIVADO}>Arquivado</Etiqueta>
        )}
      </Flex>

      {arquivado ? (
        <Text fontSize="12px" color="fg.subtle" mt="3px">
          {`Arquivado por ${cliente.arquivado_por ?? "—"} em ${formatarDataDeInstante(cliente.arquivado_em ?? "")}`}
        </Text>
      ) : (
        (telefone || cliente.email) && (
          <Text fontSize="12.5px" color="fg.muted" mt="3px" truncate>
            {[telefone, cliente.email].filter(Boolean).join(" · ")}
          </Text>
        )
      )}

      <Flex align="center" gap="8px" mt="8px" color="fg.subtle" fontSize="12px">
        {documento && (
          <Text as="span" fontFamily="mono">
            {documento}
          </Text>
        )}
        {!arquivado && (
          <Text as="span" className="num">
            {`${cliente.processos ?? 0} processo${(cliente.processos ?? 0) === 1 ? "" : "s"}`}
          </Text>
        )}
      </Flex>
    </ItemDeLista>
  );
}
