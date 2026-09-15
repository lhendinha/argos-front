import { Flex, Table, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { Botao, Etiqueta } from "../../../../components";
import { ESTADO_DE_CLIENTE_ARQUIVADOS, ESTADO_DE_CLIENTE_TODOS } from "../../../../constants";
import { formatarDataDeInstante, mascararCpfCnpj, mascararTelefone } from "../../../../utils";
import type { LinhaClienteProps } from "./types";

/** Cinza de estado neutro, o mesmo das etiquetas de subgrupo: "Arquivado"
 * não é bom nem ruim, é um lugar onde o cliente está. */
const CORES_DO_ARQUIVADO = {
  bg: "border.subtle",
  color: "fg.muted",
  borderColor: "border",
} as const;

/** Pessoa física ou jurídica, pelo tamanho do documento -- 11 dígitos é
 * CPF, 14 é CNPJ. Sem documento não dá pra afirmar nem uma coisa nem
 * outra, então não afirma. */
function tipoDoCliente(cpfCnpj?: string | null): string {
  const digitos = (cpfCnpj || "").replace(/\D/g, "");
  if (digitos.length === 11) return "Pessoa física";
  if (digitos.length === 14) return "Pessoa jurídica";
  return "";
}

/** Uma linha da tabela de clientes.
 *
 * A linha inteira leva ao detalhe (`/clientes/{id}`), e precisa ser
 * alcançável pelo teclado: as ações saíram da linha e foram pro detalhe,
 * então quem navega por Tab não teria outro caminho.
 *
 * ⚠️ "Reativar" é a exceção, e é o artefato validado que a desenha: em
 * "Arquivados" a tela existe justamente para trazer alguém de volta, e
 * obrigar a abrir cada ficha para isso seria um clique a mais por cliente.
 */
export default function LinhaCliente({ cliente, estado, podeReativar, onReativar, reativando }: LinhaClienteProps) {
  const navegar = useNavigate();
  const tipo = tipoDoCliente(cliente.cpf_cnpj);
  const arquivado = Boolean(cliente.arquivado_em);
  /* A coluna de ação existe fora de "Ativos" -- ali nenhuma linha tem
     "Reativar", e uma coluna vazia é ruído. */
  const temColunaDeAcao = estado !== "ativos";

  function abrir() {
    navegar(`/clientes/${cliente.cliente_id}`);
  }

  return (
    <Table.Row
      tabIndex={0}
      cursor="pointer"
      _hover={{ bg: "bg.canvas" }}
      _focusVisible={{ outline: "2px solid", outlineColor: "fg.brand", outlineOffset: "-2px" }}
      _last={{ "& td": { borderBottomWidth: 0 } }}
      onClick={abrir}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          abrir();
        }
      }}
    >
      <Table.Cell verticalAlign="top" p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Flex align="center" gap="6px">
          <Text fontSize="13px" fontWeight="700">
            {cliente.nome}
          </Text>
          {/* Só em "Todos": nas outras duas listas o filtro já disse o que
              cada linha é, e repetir a etiqueta em todas não informa nada. */}
          {arquivado && estado === ESTADO_DE_CLIENTE_TODOS && (
            <Etiqueta cores={CORES_DO_ARQUIVADO}>Arquivado</Etiqueta>
          )}
        </Flex>
        {/* No arquivado, quem arquivou e quando ocupam a linha do tipo:
            é o que a pessoa procura ali, e o tipo continua no detalhe. */}
        {arquivado ? (
          <Text fontSize="12px" color="fg.subtle" mt="2px">
            {`Arquivado por ${cliente.arquivado_por ?? "—"} em ${formatarDataDeInstante(cliente.arquivado_em ?? "")}`}
          </Text>
        ) : (
          tipo && (
            <Text fontSize="12px" color="fg.subtle" mt="2px">
              {tipo}
            </Text>
          )
        )}
      </Table.Cell>
      <Table.Cell
        verticalAlign="top"
        p="13px 14px"
        borderBottomWidth="1px"
        borderBottomColor="border.subtle"
        fontFamily="mono"
        fontSize="12.5px"
      >
        {mascararCpfCnpj(cliente.cpf_cnpj || "") || "—"}
      </Table.Cell>
      <Table.Cell verticalAlign="top" p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
        <Text fontSize="13px">{mascararTelefone(cliente.telefone || "") || "—"}</Text>
        {cliente.email && (
          <Text fontSize="12px" color="fg.subtle" mt="2px">
            {cliente.email}
          </Text>
        )}
      </Table.Cell>
      {/* 🔴 Some em "Arquivados", e não vem zerada: cliente com processo não
          se arquiva, então a coluna inteira seria uma fileira de zeros. */}
      {estado !== ESTADO_DE_CLIENTE_ARQUIVADOS && (
        <Table.Cell
          verticalAlign="top"
          p="13px 14px"
          borderBottomWidth="1px"
          borderBottomColor="border.subtle"
          className="num"
          fontSize="13px"
        >
          {cliente.processos ?? 0}
        </Table.Cell>
      )}
      {temColunaDeAcao && (
        <Table.Cell
          verticalAlign="top"
          p="13px 14px"
          borderBottomWidth="1px"
          borderBottomColor="border.subtle"
          textAlign="right"
        >
          {arquivado && podeReativar && (
            <Botao
              variante="ghost"
              disabled={reativando}
              /* 🔴 Sem isto o clique reativa E abre a ficha: o handler da
                 linha inteira está no `<tr>`, e o do botão sobe até ele. */
              onClick={(e) => {
                e.stopPropagation();
                onReativar();
              }}
            >
              {reativando ? "Reativando…" : "Reativar"}
            </Botao>
          )}
        </Table.Cell>
      )}
    </Table.Row>
  );
}
