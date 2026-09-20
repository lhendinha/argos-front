import { Box, Flex, Heading, Text } from "@chakra-ui/react";

import { Botao, CampoDeBusca, PilulaDeMenu } from "../../../../components";
import { ESTADO_DE_CLIENTE_ATIVOS } from "../../../../constants";
import { OPCOES_DE_ESTADO } from "../../constants";
import { contar } from "../../../../utils";
import { ACOES_DO_CABECALHO, LINHA_DE_FILTROS } from "../../../../theme/cabecalho";
import type { CabecalhoClientesProps } from "./types";

/** Cabeçalho da tela de Clientes: título, ação, busca e contagem -- mesma
 * estrutura do cabeçalho de Processos. */
export default function CabecalhoClientes({
  carregando,
  buscando,
  total,
  exibidos,
  busca,
  onBuscar,
  estado,
  onMudarEstado,
  podeCriar,
  onNovoCliente,
}: CabecalhoClientesProps) {
  return (
    <Box mb="14px">
      {/* 🔴 **Quebra, como o `CabecalhoDePagina` das outras telas.** Este
          cabeçalho é próprio e tinha ficado de fora: sem `wrap`, e com o
          botão `flexShrink: 0`, "+ Novo cliente" ficava colado ao lado do
          título mesmo no celular, espremendo "Contatos e partes vinculadas
          aos processos" em três linhas. Agora ele desce para baixo do
          subtítulo e ocupa a linha, como nas irmãs. */}
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap="12px 16px" mb="18px">
        <Box flex="1 1 240px" minW="0">
          <Heading as="h1" fontSize="23px" fontWeight="800" letterSpacing="-0.01em">
            Clientes
          </Heading>
          <Text fontSize="13px" color="fg.muted" mt="2px">
            Contatos e partes vinculadas aos processos.
          </Text>
        </Box>
        {podeCriar && (
          <Box css={ACOES_DO_CABECALHO}>
            <Botao onClick={onNovoCliente}>+ Novo cliente</Botao>
          </Box>
        )}
      </Flex>

      {/* O chip fica na LINHA DA BUSCA, como o status em Atendimentos: é
          onde a tela já tem uma barra de filtro, e o artefato validado o
          desenha ali. */}
      {/* A busca ocupa a linha no celular e as pílulas descem -- ver
          `LINHA_DE_FILTROS`, que pede a busca como primeiro filho. */}
      <Flex gap="10px" mb="10px" align="center" wrap="wrap" css={LINHA_DE_FILTROS}>
        <CampoDeBusca
          rotulo="Pesquisar cliente"
          placeholder="Pesquisar cliente"
          valor={busca}
          onMudar={onBuscar}
          larguraMaxima="420px"
          buscando={buscando}
        />
        <PilulaDeMenu
          opcoes={OPCOES_DE_ESTADO.map((o) => ({ id: o.id, rotulo: o.rotulo }))}
          selecionado={estado}
          /* Aceso fora do padrão: "Ativos" é o que a tela mostra sem ninguém
             escolher nada, e pílula acesa nesse caso diria que há filtro. */
          ativo={estado !== ESTADO_DE_CLIENTE_ATIVOS}
          onEscolher={(id) => onMudarEstado(id as typeof estado)}
        />
      </Flex>

      {/* Some enquanto carrega, em vez de dizer "carregando…": o esqueleto
          logo abaixo já é o recado, e duas mensagens da mesma espera na
          mesma tela é ruído. Mantém a linha ocupando o espaço pra a
          contagem não empurrar a tabela ao chegar. */}
      <Text fontSize="11.5px" color="fg.subtle" className="num" minH="17px">
        {carregando
          ? ""
          : !buscando && busca && exibidos < total
            ? `Mostrando ${exibidos} de ${contar(total, "cliente", "clientes")} — refine a busca`
            : contar(total, "cliente", "clientes")}
      </Text>
    </Box>
  );
}
