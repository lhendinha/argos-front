import { Flex, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import { PilulaDeFiltro, SeletorDePeriodo } from "../../../../components";
import { PERIODOS_DE_DINHEIRO } from "../../../../constants";
import { useClientesBuscaveis } from "../../../../hooks/useClientesBuscaveis";
import { useEstadoNaUrl } from "../../../../hooks/useEstadoNaUrl";
import { usePaginacaoDaLista } from "../../../../hooks/usePaginacaoDaLista";
import { useToast } from "../../../../contexts/ToastContext";
import { listarAFaturar, listarFaturas, listarNaoCobradas, naoCobrarLancamento, voltarACobrarLancamento } from "../../../../services";
import { ApiError } from "../../../../services/api/client";
import { qk } from "../../../../services/queryKeys";
import { intervaloDoPeriodo } from "../../../../utils";
import { abaValida } from "../../../../utils/abas";
import { SECOES_DE_FATURAS } from "../../constants";
import ModalDeEmissao from "../ModalDeEmissao";
import SecaoAFaturar from "../SecaoAFaturar";
import SecaoEmitidas from "../SecaoEmitidas";
import SecaoNaoCobradas from "../SecaoNaoCobradas";
import type { SecaoDeFaturas } from "../../types";
import type { ClienteAFaturar, NaoCobrada } from "../../../../types";
import type { RespostaAFaturar, RespostaDeFaturas, RespostaDeNaoCobradas } from "../../../../types/respostas";

/** A aba de Faturas: o que há para cobrar, e o que já foi cobrado.
 *
 * 🔴 **"A faturar" NÃO é uma lista de faturas** -- é uma lista de CLIENTES
 * com dinheiro esperando cobrança, agrupada pelo servidor. Clicar num
 * cliente abre a emissão dele, e é o único caminho para criar uma fatura:
 * fatura sem cliente não existe.
 *
 * ⚠️ **A pílula de período só aparece em "Emitidas".** Em "A faturar" ela
 * não teria sentido -- aquilo é "o que está aberto HOJE", não um recorte de
 * tempo --, e uma pílula que não filtra nada engana.
 *
 * ⚠️ **Cada seção carrega a SUA consulta.** As duas juntas seriam duas
 * requisições para mostrar uma tela só.
 *
 * 🔴 **"Não cobradas" é a terceira seção** (artefato do "Não cobrar"): as despesas tiradas de "A faturar" de vez. A
 * pílula mostra a CONTAGEM -- é o dinheiro adiantado que não volta, e ele não pode sumir de vista --, e por isso a
 * primeira página dela é pedida em qualquer seção: o `total` da resposta é o número.
 *
 * 🔴 **As seções paginam no servidor.** "A faturar" chegou a não
 * paginar ("são poucos clientes"), mas num escritório grande são milhares
 * com pendência: a API lê o índice dos cobráveis e devolve só o resumo de
 * cada cliente, e os lançamentos vêm ao abrir a emissão.
 *
 * ➡️ `index.test.tsx`.
 */
export default function ListaDeFaturas() {
  const navegar = useNavigate();
  /* ⚠️ Trocar de seção apaga a página: as duas paginam, e a 3ª de "Emitidas"
     não tem nada a ver com a 3ª de "A faturar". */
  const [secaoNaUrl, setSecao] = useEstadoNaUrl<string>("secao", "a-faturar", {
    tambemApaga: ["pagina"],
  });
  /* 🔴 VALIDADA na leitura: `secao` é o mesmo nome que a aba Configurações usa
     com os valores DELA ("categorias", "contas", "centros"), e o endereço das
     quatro abas é um só. Valor que não é uma das seções daqui cai na
     primeira, em vez de deixar a aba sem lista nenhuma. */
  const secao: SecaoDeFaturas = abaValida(SECOES_DE_FATURAS, secaoNaUrl);
  /* ⚠️ Trocar o período volta para a primeira página: a 4ª de "todos" quase
     nunca existe em "este mês", e o servidor devolveria vazio. É a mesma
     régua que `usePaginacaoDaLista` aplica ao tamanho. */
  const [periodoId, setPeriodoId] = useEstadoNaUrl("periodo", "todos", {
    tambemApaga: ["pagina"],
  });
  const { pagina, setPagina, tamanhoPagina, setTamanhoPagina } = usePaginacaoDaLista();
  const [clienteNoModal, setClienteNoModal] = useState<ClienteAFaturar | null>(null);

  const intervalo = intervaloDoPeriodo(periodoId);

  const paginaDeAFaturar = { pagina, tamanhoPagina };

  const aFaturar = useQuery<RespostaAFaturar>({
    queryKey: qk.aFaturarPagina(paginaDeAFaturar),
    queryFn: () => listarAFaturar(paginaDeAFaturar) as Promise<RespostaAFaturar>,
    enabled: secao === "a-faturar",
    /* A página anterior fica na tela enquanto a próxima vem, como em
       "Emitidas". */
    placeholderData: (anterior) => anterior,
  });

  const queryClient = useQueryClient();
  const toast = useToast();
  /* ⚠️ A contagem da pílula sai do `total` da página pedida: na própria seção, a página escolhida; fora dela, a
     primeira -- é a mesma resposta, e a mesma chave quando a pessoa está na página 1. */
  const paginaDeNaoCobradas = secao === "nao-cobradas" ? { pagina, tamanhoPagina } : { pagina: 1, tamanhoPagina };
  const naoCobradas = useQuery<RespostaDeNaoCobradas>({
    queryKey: qk.naoCobradasPagina(paginaDeNaoCobradas),
    queryFn: () => listarNaoCobradas(paginaDeNaoCobradas) as Promise<RespostaDeNaoCobradas>,
    placeholderData: (anterior) => anterior,
  });

  function aposMudarACobranca() {
    queryClient.invalidateQueries({ queryKey: qk.naoCobradas() });
    queryClient.invalidateQueries({ queryKey: qk.aFaturar() });
    queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
  }

  const naoCobrarDeNovo = useMutation({
    mutationFn: (d: NaoCobrada) => naoCobrarLancamento(d.lancamento_id),
    onSuccess: aposMudarACobranca,
    onError: (err) => toast.erro(err instanceof ApiError ? err.message : "Não foi possível desfazer."),
  });

  /** 🔴 "Voltar a cobrar" com o Desfazer no AVISO, o padrão do sistema: desfazer marca de novo. */
  const voltarACobrar = useMutation({
    mutationFn: (d: NaoCobrada) => voltarACobrarLancamento(d.lancamento_id),
    onSuccess: (_resposta, d) => {
      aposMudarACobranca();
      toast.sucesso(`${d.descricao} voltou para "A faturar".`, { onDesfazer: () => naoCobrarDeNovo.mutate(d) });
    },
    onError: (err) =>
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível voltar a cobrar a despesa."),
  });

  const filtrosDeEmitidas = {
    de: intervalo?.de,
    ate: intervalo?.ate,
    pagina,
    tamanhoPagina,
  };

  const emitidas = useQuery<RespostaDeFaturas>({
    queryKey: qk.faturas(filtrosDeEmitidas),
    queryFn: () => listarFaturas(filtrosDeEmitidas) as Promise<RespostaDeFaturas>,
    enabled: secao === "emitidas",
    /* Mantém a página anterior na tela enquanto a próxima vem: sem isso a
       tabela pisca para o esqueleto a cada clique na paginação. */
    placeholderData: (anterior) => anterior,
  });

  /* 🔴 O nome do cliente NÃO vem na fatura -- só o id. A busca de clientes é
     a mesma que os formulários usam, então a lista já costuma estar em
     cache; e ela cai para o id quando o cliente saiu do sistema, que é a
     régua do projeto (`useNomeDeSubgrupo` faz igual).

     ⚠️ `sempreLigada` só em "Emitidas": é lá que o nome é PEDIDO sem ninguém
     abrir seletor nenhum. Em "A faturar" o próprio servidor já manda o nome
     junto, e a consulta seria desperdício. */
  const clientes = useClientesBuscaveis(secao === "emitidas");
  const nomeDoCliente = (clienteId: string) =>
    clientes.opcoes.find((o) => o.value === clienteId)?.label ?? clienteId;

  return (
    <>
      <Flex align="center" gap="8px" wrap="wrap" mb="12px">
        {SECOES_DE_FATURAS.map((s) => (
          <PilulaDeFiltro key={s.id} ativo={secao === s.id} onClick={() => setSecao(s.id)}>
            {s.rotulo}
            {s.id === "nao-cobradas" && Boolean(naoCobradas.data?.total) && (
              <Text as="span" fontFamily="mono" fontSize="11.5px" fontWeight="600" letterSpacing="0">
                · {naoCobradas.data?.total}
              </Text>
            )}
          </PilulaDeFiltro>
        ))}
        {secao === "emitidas" && (
          <SeletorDePeriodo
            periodoId={periodoId}
            blocos={PERIODOS_DE_DINHEIRO}
            onMudar={(novo) => setPeriodoId(novo)}
          />
        )}
      </Flex>

      {secao === "nao-cobradas" && (
        <SecaoNaoCobradas
          itens={naoCobradas.data?.lancamentos ?? []}
          carregando={naoCobradas.isPending}
          erro={naoCobradas.isError}
          onTentarDeNovo={() => naoCobradas.refetch()}
          paginacao={{
            pagina,
            totalPaginas: naoCobradas.data?.total_paginas ?? 0,
            total: naoCobradas.data?.total ?? 0,
            tamanhoPagina,
            onMudarPagina: setPagina,
            onMudarTamanho: setTamanhoPagina,
          }}
          onAbrir={(lancamentoId) => navegar(`/financeiro/lancamentos/${lancamentoId}`)}
          onVoltarACobrar={(d) => voltarACobrar.mutate(d)}
          voltando={voltarACobrar.isPending ? (voltarACobrar.variables?.lancamento_id ?? "") : ""}
        />
      )}
      {secao === "a-faturar" && (
        <SecaoAFaturar
          clientes={aFaturar.data?.clientes ?? []}
          carregando={aFaturar.isPending}
          erro={aFaturar.isError}
          onTentarDeNovo={() => aFaturar.refetch()}
          paginacao={{
            pagina,
            totalPaginas: aFaturar.data?.total_paginas ?? 0,
            total: aFaturar.data?.total ?? 0,
            tamanhoPagina,
            onMudarPagina: setPagina,
            onMudarTamanho: setTamanhoPagina,
          }}
          onEmitir={setClienteNoModal}
        />
      )}
      {secao === "emitidas" && (
        <SecaoEmitidas
          faturas={emitidas.data?.faturas ?? []}
          carregando={emitidas.isPending}
          erro={emitidas.isError}
          onTentarDeNovo={() => emitidas.refetch()}
          paginacao={{
            pagina,
            /* ⚠️ Zero enquanto a consulta não voltou: é o que impede o
               `Pagination` de mandar a pessoa para a página 1 no meio de uma
               navegação legítima. */
            totalPaginas: emitidas.data?.total_paginas ?? 0,
            total: emitidas.data?.total ?? 0,
            tamanhoPagina,
            onMudarPagina: setPagina,
            onMudarTamanho: setTamanhoPagina,
          }}
          nomeDoCliente={nomeDoCliente}
          onAbrir={(faturaId) => navegar(`/financeiro/faturas/${faturaId}`)}
        />
      )}

      {clienteNoModal && (
        <ModalDeEmissao
          cliente={clienteNoModal}
          onFechar={() => setClienteNoModal(null)}
          onEmitida={(faturaId) => {
            setClienteNoModal(null);
            navegar(`/financeiro/faturas/${faturaId}`);
          }}
        />
      )}
    </>
  );
}
