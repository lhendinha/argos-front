import { Box, Button, Flex, Heading, Text, Wrap } from "@chakra-ui/react";

import { CampoDeBusca, MultiSelect, Select } from "../../../../components";
import { RESPONSAVEL_EU, SEM_RESPONSAVEL } from "../../constants";
import FiltroDatas from "../FiltroDatas";
import { comOpcaoEscolhida } from "../../../../utils/opcoesEscolhidas";
import { contar } from "../../../../utils";
import { ACOES_DO_CABECALHO, LINHA_DE_FILTROS } from "../../../../theme/cabecalho";
import type { CabecalhoProcessosProps } from "./types";

/** Cabeçalho da tela de Processos: título, ação, filtros e contagem.
 *
 * Os filtros são **chips inline**, como no artifact -- não um painel que
 * abre. Cada chip mostra no próprio rótulo o que está selecionado, e é por
 * isso que não existe uma fileira de chips removíveis embaixo: o estado do
 * filtro mora no controle que o define, em vez de em dois lugares que podem
 * discordar.
 */
export default function CabecalhoProcessos({
  carregando,
  carregandoCatalogos,
  buscando,
  total,
  totalSemFiltro,
  busca,
  onBuscar,
  filtros,
  pessoas,
  mostrarPessoas,
  onMudarFiltro,
  clientes,
  fases,
  situacoes,
  subgrupos,
  erroNasFases,
  erroNasSituacoes,
  onRecarregarFases,
  onRecarregarSituacoes,
  onNovoProcesso,
  onImportarPorOab,
}: CabecalhoProcessosProps) {
  return (
    <Box mb="14px">
      {/* ⚠️ Esta faixa é uma CÓPIA do `CabecalhoDePagina`, com um recuo de
          baixo próprio (18px contra 20px). As duas correções abaixo são as
          mesmas que ele levou, e precisaram ser feitas duas vezes -- se um
          dia os 2px deixarem de importar, esta cópia sai. */}
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap="12px 16px" mb="18px">
        <Box flex="1 1 240px" minW="0">
          {/* 23px / -0.01em / 13px: medidos no artifact, não estimados. */}
          <Heading as="h1" fontSize="23px" fontWeight="800" letterSpacing="-0.01em">
            Processos
          </Heading>
          <Text fontSize="13px" color="fg.muted" mt="2px">
            Monitoramento automático de movimentações
          </Text>
        </Box>
        {/* 🔴 Sem `flexShrink: 0`: com ele o grupo não estreita abaixo da
            soma dos botões numa linha, e o `flexWrap` ao lado nunca chega a
            disparar. Era o que mantinha esta tela em 455px numa de 360.

            🔴 **A regra de largura vem do tema, e não copiada de novo.** O
            comentário acima previa isto: "as duas correções abaixo são as
            mesmas que ele levou, e precisaram ser feitas duas vezes". Esta
            seria a TERCEIRA vez. A marcação continua duplicada pelos 2px de
            recuo, mas o comportamento passou a ter um dono só.

            ⚠️ O intervalo virou 8px, o do sistema, contra os 9px que esta
            cópia tinha -- um pixel entre os dois botões, no desktop. */}
        <Box css={ACOES_DO_CABECALHO}>
          {/* ⚠️ Dois botões, não um menu: "Novo processo" é uso diário e
              "Importar por OAB" se procura com intenção. Esconder a segunda
              atrás de um clique a mais não ajudaria nenhuma das duas. */}
          {onImportarPorOab && (
            <Button
              variant="outline"
              fontWeight="700"
              /* 44px no apontador grosso -- ver `Botao`. Estes dois são
                 `Button` do Chakra direto, e não o `Botao` do sistema, então
                 a regra dele não os alcança. */
              css={{ "@media (pointer: coarse)": { minHeight: "44px" } }}
              px="16px"
              onClick={onImportarPorOab}
            >
              Importar por OAB
            </Button>
          )}
          <Button
            bg="fg.brand"
            color="white"
            fontWeight="700"
            px="18px"
            /* 44px no apontador grosso -- ver `Botao`, como o vizinho. */
            css={{ "@media (pointer: coarse)": { minHeight: "44px" } }}
            _hover={{ bg: "brand.dark" }}
            onClick={onNovoProcesso}
          >
            + Novo processo
          </Button>
        </Box>
      </Flex>

      <Wrap gap="10px" mb="10px" css={LINHA_DE_FILTROS}>
        {/* 🔴 **Primeiro, e não por último.** Ela era o último item da
            fileira, depois até dos filtros de data -- nas outras três listas
            do sistema a busca sempre veio na frente. E a posição aqui não é
            só ordem: `LINHA_DE_FILTROS` dá a linha inteira ao PRIMEIRO
            filho no celular, e quem precisa de largura para digitar é ela. */}
        <CampoDeBusca
          rotulo="Pesquisar processo por número, cliente ou apelido"
          placeholder="Pesquisar número, cliente ou apelido"
          valor={busca}
          onMudar={onBuscar}
          larguraMaxima="420px"
          buscando={buscando}
        />
        {/* Situação e fase aceitam VÁRIOS valores (é o que o artifact faz,
            e o backend passou a suportar em 21/08). Cliente é valor único --
            no artifact o painel dele usa botões, não caixas.

            As três aceitam digitação, por motivos diferentes: as duas
            primeiras já têm a lista inteira aqui e filtram na hora (são 39
            situações, 22 delas começando com "Aguardando" -- rolar não
            resolve); a de cliente pede ao servidor, porque a lista dela não
            tem teto. */}
        <MultiSelect
          variante="chip"
          placeholder="Todas as situações"
          opcoes={situacoes.map((s) => ({ value: s.opcao_id, label: s.rotulo }))}
          selecionados={filtros.situacaoIds}
          onMudar={(v) => onMudarFiltro({ situacaoIds: v })}
          carregando={carregandoCatalogos}
          permitirBusca
          placeholderBusca="Buscar situação"
          permitirLimpar
          erro={erroNasSituacoes}
          onTentarDeNovo={onRecarregarSituacoes}
        />
        <MultiSelect
          variante="chip"
          placeholder="Todas as fases"
          opcoes={fases.map((f) => ({ value: f.opcao_id, label: f.rotulo }))}
          selecionados={filtros.faseIds}
          onMudar={(v) => onMudarFiltro({ faseIds: v })}
          carregando={carregandoCatalogos}
          permitirBusca
          placeholderBusca="Buscar fase"
          permitirLimpar
          erro={erroNasFases}
          onTentarDeNovo={onRecarregarFases}
        />
        {/* ⚠️ Uma escolha só, como a de cliente: "Cível OU Trabalhista" é
            pergunta que ninguém faz -- quem quer ver dois olha a lista
            inteira, que é o estado padrão da tela.

            A pílula some para quem tem UM subgrupo: ali ela não filtra
            nada, e um controle sem efeito é pior que controle nenhum. */}
        {subgrupos.length > 1 && (
          <Select
            variante="chip"
            placeholder="Todos os subgrupos"
            opcoes={subgrupos.map((sg) => ({ value: sg.subgrupo_id, label: sg.nome }))}
            valor={filtros.subgrupoId ?? ""}
            onMudar={(v) => onMudarFiltro({ subgrupoId: v })}
            permitirLimpar
          />
        )}
        <Select
          variante="chip"
          placeholder="Todos os clientes"
          /* O escolhido entra na lista mesmo fora da página atual, senão a
             pílula fica acesa e sem rótulo -- ver `comOpcaoEscolhida`. */
          opcoes={comOpcaoEscolhida(clientes.opcoes, filtros.clienteId, filtros.clienteNome)}
          valor={filtros.clienteId}
          /* Guarda o NOME junto do id: é o rótulo da pílula, e ele não pode
             depender de a lista certa estar carregada. */
          onMudar={(v) =>
            onMudarFiltro({
              clienteId: v,
              clienteNome: clientes.opcoes.find((o) => o.value === v)?.label ?? "",
            })
          }
          carregando={clientes.carregando}
          onBuscar={clientes.buscar}
          placeholderBusca="Buscar cliente"
          permitirLimpar
          erro={clientes.erro}
          onTentarDeNovo={clientes.tentarDeNovo}
        />
        {/* ⚠️ **As opções fixas primeiro, a lista de pessoas depois.**
            "Todos", "Meus" e "Sem responsável" funcionam pra QUALQUER papel;
            a lista de pessoas vem de `GET /grupos/membros`, que tem piso
            `manager` -- pra um `user` ela chega vazia (com o estado de erro
            da pílula), e as três primeiras continuam servindo.

            🔴 "Sem responsável" é opção de filtro de propósito: é o sintoma
            de um item órfão, cujo aviso vai para os gestores do subgrupo (ou
            para o subgrupo inteiro, sem gestor). Sem um jeito de listar isso,
            ninguém entende por quê. E "Meus" já inclui o órfão de quem o
            recebe: é a régua de destinatário, a mesma do card da home. */}
        <Select
          variante="chip"
          placeholder="Todos os responsáveis"
          opcoes={[
            { value: RESPONSAVEL_EU, label: "Meus processos" },
            { value: SEM_RESPONSAVEL, label: "Sem responsável" },
            /* 🔴 A lista de PESSOAS só pra `manager`+.
               `GET /grupos/membros` responde 403 pra `user`, e uma opção que
               falha é pior que uma ausente. As duas de cima não dependem dela
               e são as que respondem à pergunta do dia a dia -- por isso a
               pílula continua existindo pra todo papel, só mais curta. */
            ...(mostrarPessoas
              ? comOpcaoEscolhida(pessoas.opcoes, filtros.responsavelId, "")
              : []),
          ]}
          valor={filtros.responsavelId}
          onMudar={(v) => onMudarFiltro({ responsavelId: v })}
          carregando={mostrarPessoas && pessoas.carregando}
          /* Sem a lista, não há o que buscar: a caixa de digitar sumiria
             prometendo um resultado que nunca vem. */
          onBuscar={mostrarPessoas ? pessoas.buscar : undefined}
          placeholderBusca="Buscar pessoa"
          permitirLimpar
          erro={mostrarPessoas && pessoas.erro}
          onTentarDeNovo={pessoas.tentarDeNovo}
        />
        <FiltroDatas
          dataVerificarAte={filtros.dataVerificarAte}
          prazoFinalAte={filtros.prazoFinalAte}
          onMudar={onMudarFiltro}
        />
      </Wrap>

      {/* Contagem embaixo dos filtros, como no artifact: ela descreve o
          RESULTADO do que os chips acima definiram. */}
      {/* Some enquanto carrega, em vez de dizer "carregando…": o esqueleto
          logo abaixo já é o recado, e duas mensagens da mesma espera na
          mesma tela é ruído. Mantém a linha ocupando o espaço pra a
          contagem não empurrar a tabela ao chegar. */}
      <Text fontSize="11.5px" color="fg.subtle" className="num" minH="17px">
        {carregando
          ? ""
          : `Mostrando ${total} de ${contar(totalSemFiltro, "processo", "processos")}`}
      </Text>
    </Box>
  );
}
