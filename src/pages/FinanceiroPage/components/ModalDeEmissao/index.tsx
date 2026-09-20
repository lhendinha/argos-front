import { Box, Checkbox, Flex, Table, Text } from "@chakra-ui/react";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Botao,
  Campo,
  CartaoDeTabela,
  Esqueleto,
  EstadoDeErro,
  EstadoVazio,
  Modal,
  RodapeDeFormulario,
  SeletorData,
  Tabela,
} from "../../../../components";
import { LARGURA_MINIMA_DA_TABELA, NATUREZA_SAIDA } from "../../../../constants";
import { useToast } from "../../../../contexts/ToastContext";
import { useGuardaDeDescarte } from "../../../../hooks/useGuardaDeDescarte";
import { useLarguraEstreita } from "../../../../hooks/useLarguraEstreita";
import {
  emitirFatura,
  listarAFaturarDoCliente,
  naoCobrarLancamento,
  voltarACobrarLancamento,
} from "../../../../services";
import { ApiError } from "../../../../services/api/client";
import { invalidarCatalogoFinanceiro } from "../../../../services/queryClient";
import { qk } from "../../../../services/queryKeys";
import type { Lancamento } from "../../../../types";
import type { RespostaAFaturarDoCliente } from "../../../../types/respostas";
import { contar, formatarCentavos, formatarData, hojeISO } from "../../../../utils";
import { COLUNAS_DA_EMISSAO } from "../../constants";
import ItemDaEmissao from "../ItemDaEmissao";
import type { ModalDeEmissaoProps } from "./types";

/** Emitir a fatura de um cliente.
 *
 * 🔴 **Os lançamentos vêm ao ABRIR, pelo cliente**
 * (`GET /faturas/a-faturar/{cliente_id}`). A lista de "A faturar" traz só o
 * resumo de cada cliente: com os lançamentos dentro, a resposta de um
 * escritório grande passava dos 6 MB da API.
 *
 * 🔴 **O total é recalculado ao desmarcar**, e não é enfeite: a fatura é um
 * documento que o cliente recebe, e o número dela tem de ser o do que
 * entrou. Quem emite decide o que fica de fora desta vez.
 *
 * 🔴 **"Desmarcar" e "Não cobrar" são coisas diferentes, e o texto diz.** Desmarcar deixa para a próxima fatura; "Não
 * cobrar" tira a DESPESA de vez (o honorário não tem o botão: em aberto, ele já fica de fora desmarcando). Ao clicar,
 * ela sai da lista na hora, e o aviso traz o Desfazer.
 *
 * ⚠️ **Guarda os DESMARCADOS, e não os marcados.** Os lançamentos chegam
 * depois de o modal abrir: guardando os marcados, "tudo marcado ao abrir"
 * pediria um efeito copiando a resposta para o estado, e a guarda de
 * descarte leria a chegada deles como mudança feita pela pessoa.
 *
 * 🔴 **A DESPESA não é linha de cobrança.** Ela vira um recebível de
 * reembolso no valor dela, e a despesa em si é carimbada como cobrada. Por
 * isso a linha diz "reembolso" -- somá-la como se o cliente devesse a
 * despesa faria o total do documento não bater com o que ele paga.
 *
 * ⚠️ **Zero marcadas desabilita o botão** -- e também enquanto os lançamentos
 * não chegaram. Uma fatura vazia não é documento; deixar emitir e receber
 * 400 seria empurrar para o servidor uma pergunta que a tela já sabe
 * responder.
 *
 * ⚠️ **O NÚMERO não aparece aqui.** O artefato mostra um campo com
 * "2026-0008" travado, mas ele é sequencial do escritório e só existe DEPOIS
 * da emissão -- mostrar um palpite seria prometer um número que pode sair
 * outro se alguém emitir junto.
 *
 * ⚠️ **Uma divergência do artefato, de 3px:** ele dá à prévia um padding
 * menor (`.previa-fatura td{padding:10px 14px}`) que o das outras tabelas.
 * Aqui vale a régua do projeto -- toda `Table.Cell` declara `13px 14px`, e
 * há um guarda mecânico cobrando. Três pixels não pagam uma exceção numa
 * régua que existe para as linhas terem a mesma altura em toda tela.
 *
 * ➡️ `index.test.tsx`.
 */
export default function ModalDeEmissao({ cliente, onFechar, onEmitida }: ModalDeEmissaoProps) {
  const [medir, estreita] = useLarguraEstreita(LARGURA_MINIMA_DA_TABELA.emissaoDeFatura);
  const queryClient = useQueryClient();
  const toast = useToast();
  const doCliente = useQuery<RespostaAFaturarDoCliente>({
    queryKey: qk.aFaturarDoCliente(cliente.cliente_id),
    queryFn: () =>
      listarAFaturarDoCliente(cliente.cliente_id) as Promise<RespostaAFaturarDoCliente>,
  });
  const lancamentos = doCliente.data?.lancamentos ?? [];
  /* Nenhum desmarcado ao abrir: o caminho comum é cobrar tudo que está lá. */
  const [desmarcados, setDesmarcados] = useState<string[]>([]);
  const [vencimento, setVencimento] = useState(hojeISO());
  const [erro, setErro] = useState("");

  const escolhidos = lancamentos.filter((l) => !desmarcados.includes(l.lancamento_id));
  const total = escolhidos.reduce((soma, l) => soma + l.valor_centavos, 0);
  const semNada = escolhidos.length === 0;

  const { mudou } = useGuardaDeDescarte({
    desmarcados: desmarcados.join(","),
    vencimento: vencimento === hojeISO() ? "" : vencimento,
  });

  const emitir = useMutation({
    mutationFn: () =>
      emitirFatura({
        cliente_id: cliente.cliente_id,
        lancamento_ids: escolhidos.map((l) => l.lancamento_id),
        data_vencimento: vencimento,
      }) as Promise<{ fatura_id: string; numero: string }>,
    onSuccess: (resposta) => {
      /* 🔴 Derruba as faturas E os lançamentos: a emissão carimba cada
         lançamento com `fatura_id` e cria o recebível do reembolso -- a
         lista de lançamentos muda junto. O prefixo de "a faturar" leva a
         página e o cliente aberto. */
      queryClient.invalidateQueries({ queryKey: qk.aFaturar() });
      queryClient.invalidateQueries({ queryKey: ["faturas"] });
      queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
      invalidarCatalogoFinanceiro(queryClient);
      toast.sucesso(`Fatura ${resposta.numero} emitida.`);
      onEmitida(resposta.fatura_id);
    },
    onError: (err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível emitir a fatura."),
  });

  /** Tira da lista em cache e derruba o que depende da marca: "a faturar", as não cobradas e os lançamentos. */
  function aposMudarACobranca(lancamentoId: string, sai: boolean) {
    if (sai) {
      queryClient.setQueryData<RespostaAFaturarDoCliente>(qk.aFaturarDoCliente(cliente.cliente_id), (atual) =>
        atual && { ...atual, lancamentos: atual.lancamentos.filter((l) => l.lancamento_id !== lancamentoId) });
    }
    queryClient.invalidateQueries({ queryKey: qk.aFaturar() });
    queryClient.invalidateQueries({ queryKey: qk.naoCobradas() });
    queryClient.invalidateQueries({ queryKey: ["lancamentos"] });
  }

  const voltarACobrar = useMutation({
    mutationFn: (l: Lancamento) => voltarACobrarLancamento(l.lancamento_id),
    onSuccess: (_resposta, l) => aposMudarACobranca(l.lancamento_id, false),
    onError: (err) =>
      toast.erro(err instanceof ApiError ? err.message : "Não foi possível voltar a cobrar a despesa."),
  });

  const naoCobrar = useMutation({
    mutationFn: (l: Lancamento) => naoCobrarLancamento(l.lancamento_id),
    onSuccess: (_resposta, l) => {
      aposMudarACobranca(l.lancamento_id, true);
      toast.sucesso(`${l.descricao} não será cobrada.`, { onDesfazer: () => voltarACobrar.mutate(l) });
    },
    onError: (err) =>
      setErro(err instanceof ApiError ? err.message : "Não foi possível tirar a despesa da cobrança."),
  });

  function alternar(lancamentoId: string) {
    setDesmarcados((atuais) =>
      atuais.includes(lancamentoId)
        ? atuais.filter((i) => i !== lancamentoId)
        : [...atuais, lancamentoId],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (semNada) return;
    emitir.mutate();
  }

  let previa: ReactNode;
  if (doCliente.isPending) {
    previa = <Esqueleto linhas={3} />;
  } else if (doCliente.isError) {
    previa = (
      <CartaoDeTabela>
        <EstadoDeErro
          mensagem="Não foi possível carregar os lançamentos deste cliente."
          onTentarDeNovo={() => doCliente.refetch()}
        />
      </CartaoDeTabela>
    );
  } else {
    previa = (
      <CartaoDeTabela>
        <Box ref={medir}>
          {estreita ? (
            lancamentos.length === 0 ? (
              /* ⚠️ Alguém pode ter faturado este cliente entre a lista e o
                 clique: a lista é de antes. */
              <EstadoVazio mensagem="Nada deste cliente para faturar." />
            ) : (
              <Box px="6px">
                {lancamentos.map((l) => (
                  <ItemDaEmissao
                    key={l.lancamento_id}
                    lancamento={l}
                    incluido={!desmarcados.includes(l.lancamento_id)}
                    naoCobrarEmVoo={naoCobrar.isPending}
                    onAlternar={() => alternar(l.lancamento_id)}
                    onNaoCobrar={(alvo) => naoCobrar.mutate(alvo)}
                  />
                ))}
              </Box>
            )
          ) : (
        <Tabela
          colunas={COLUNAS_DA_EMISSAO}
          vazio={
            /* ⚠️ Alguém pode ter faturado este cliente entre a lista e o
               clique: a lista é de antes. */
            lancamentos.length === 0 ? (
              <EstadoVazio mensagem="Nada deste cliente para faturar." />
            ) : undefined
          }
        >
          {lancamentos.map((l) => {
            const eDespesa = l.natureza === NATUREZA_SAIDA;
            return (
              <Table.Row key={l.lancamento_id}>
                <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
                  <Checkbox.Root
                    checked={!desmarcados.includes(l.lancamento_id)}
                    onCheckedChange={() => alternar(l.lancamento_id)}
                    aria-label={`Incluir ${l.descricao}`}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                  </Checkbox.Root>
                </Table.Cell>
                <Table.Cell p="13px 14px" borderBottomWidth="1px" borderBottomColor="border.subtle">
                  <Text fontSize="13px" fontWeight="700">{l.descricao}</Text>
                  {/* ⚠️ A despesa se anuncia: ela não é cobrança, é
                      reembolso -- e o total soma o valor dela do mesmo
                      jeito, porque é isso que o cliente devolve. */}
                  {eDespesa && (
                    <Text fontSize="12px" color="fg.subtle">
                      Despesa adiantada · entra como reembolso
                    </Text>
                  )}
                </Table.Cell>
                {/* ⚠️ `whiteSpace="normal"` NA CÉLULA, e não no texto: a `Tabela` põe nowrap em toda célula. Medido
                    no Chrome, com a coluna do "Não cobrar" a tabela dava 723px numa caixa de 706 e cortava o botão;
                    é a data que pode quebrar ("adiantada em" em cima, a data embaixo). */}
                <Table.Cell p="13px 14px" whiteSpace="normal" borderBottomWidth="1px" borderBottomColor="border.subtle">
                  {/* ⚠️ "adiantada em" na despesa paga: é quando o ESCRITÓRIO pagou -- "paga em" se lia como pago
                      pelo cliente. */}
                  <Text fontSize="12.5px">
                    {eDespesa && l.data_efetivacao
                      ? `adiantada em ${formatarData(l.data_efetivacao)}`
                      : `vence ${formatarData(l.data_vencimento)}`}
                  </Text>
                </Table.Cell>
                <Table.Cell p="13px 14px" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                  <Text fontSize="13px" fontFamily="mono" whiteSpace="nowrap">
                    R$ {formatarCentavos(l.valor_centavos)}
                  </Text>
                </Table.Cell>
                <Table.Cell p="13px 14px" w="1%" whiteSpace="nowrap" textAlign="right" borderBottomWidth="1px" borderBottomColor="border.subtle">
                  {eDespesa && (
                    <Botao
                      variante="ghost"
                      aria-label={`Não cobrar ${l.descricao}`}
                      disabled={naoCobrar.isPending}
                      onClick={() => naoCobrar.mutate(l)}
                    >
                      Não cobrar
                    </Botao>
                  )}
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Tabela>
          )}
        </Box>

        <Flex justify="space-between" align="center" p="12px 14px" borderTopWidth="1px" borderTopColor="border">
          <Text fontSize="13px" fontWeight="700">
            Total da fatura
            <Text as="span" color="fg.subtle" fontWeight="400" ml="8px">
              {contar(escolhidos.length, "lançamento", "lançamentos")}
            </Text>
          </Text>
          <Text fontSize="14px" fontWeight="800" fontFamily="mono">
            R$ {formatarCentavos(total)}
          </Text>
        </Flex>
      </CartaoDeTabela>
    );
  }

  return (
    <Modal
      descarte={{ mudou, caso: "criacao" }}
      titulo={`Emitir fatura · ${cliente.cliente_nome}`}
      largo
      onFechar={onFechar}
      rodape={
        <RodapeDeFormulario salvando={emitir.isPending}>
          <Botao type="submit" form="form-da-fatura" disabled={semNada || emitir.isPending}>
            {emitir.isPending ? "Emitindo…" : "Emitir fatura"}
          </Botao>
        </RodapeDeFormulario>
      }
    >
      <form id="form-da-fatura" onSubmit={handleSubmit}>
        <Text fontSize="13px" color="fg.subtle" mb="14px">
          A fatura junta os lançamentos abaixo num documento só, com número sequencial do escritório.{" "}
          <Text as="strong" fontWeight="700">Desmarque</Text> o que fica para a próxima fatura; use{" "}
          <Text as="strong" fontWeight="700">Não cobrar</Text> para tirar uma despesa de vez.
        </Text>

        {previa}

        <Box mt="16px" maxW="320px">
          <Campo rotulo="Vencimento da fatura" para="fat-vencimento" obrigatorio>
            <SeletorData
              id="fat-vencimento"
              rotuladoPor="fat-vencimento-rotulo"
              valor={vencimento}
              onMudar={setVencimento}
            />
          </Campo>
        </Box>

        {erro && (
          <Text mt="6px" fontSize="12px" color="status.bad">
            {erro}
          </Text>
        )}
      </form>
    </Modal>
  );
}
