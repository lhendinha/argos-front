import { Box, Stack, Text } from "@chakra-ui/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";

import { Abas, BotaoDeTexto, Cartao, DocumentosVinculados, IconeSeta, Esqueleto, ModalDeAviso, ModalDeConfirmacao, PainelDaAba } from "../../components";
import { useToast } from "../../contexts/ToastContext";
import { arquivarCliente, detalheCliente, papelAtende, reativarCliente } from "../../services";
import { toastErroMutation } from "../../services/queryClient";
import { ApiError } from "../../services/api/client";
import { qk } from "../../services/queryKeys";
import { abaValida, PARAM_DA_ABA } from "../../utils";
import FormularioCliente from "./components/FormularioCliente";
import ProcessosDoCliente from "./components/ProcessosDoCliente";
import { ABAS_DO_CLIENTE, GRUPO_DE_ABAS } from "./constants";
import type { AbaDoCliente } from "./types";
import type { Cliente } from "../../types";
import { useVoltarParaLista } from "../../hooks/useVoltarParaLista";

/** Página de detalhe de um cliente.
 *
 * É rota pelo mesmo motivo do detalhe de processo: precisa sobreviver a um
 * F5 e a um link colado. O `GET /clientes/{id}` existe justamente pra isso
 * -- antes só existia o cliente que a listagem já tinha em mãos.
 */
export default function ClienteDetalhePage() {
  const { clienteId = "" } = useParams();
  const queryClient = useQueryClient();
  const toast = useToast();

  /* `PATCH /clientes` e as duas rotas de arquivamento são `manager` -- o
     mesmo piso, e é assim no backend. Cliente arquivado continua editável,
     então o formulário não muda de regra por causa do estado. */
  const podeEditar = papelAtende("manager");
  const podeArquivar = papelAtende("manager");
  const [confirmandoArquivamento, setConfirmandoArquivamento] = useState(false);
  /* Os motivos vêm do 409 (`motivos`), não de uma pré-checagem: só o
     servidor sabe de fatura em aberto e cobrança pendente, e perguntar antes
     seria uma leitura a mais que ainda assim correria o risco de envelhecer
     entre a pergunta e o clique. */
  const [motivos, setMotivos] = useState<string[] | null>(null);

  /* A aba vive na URL, como no detalhe do processo -- ver `PARAM_DA_ABA`.
     `replace` porque trocar de aba não é um passo do histórico: sem isso,
     quem visse as duas precisaria de dois "voltar" pra sair da tela. */
  const [params, setParams] = useSearchParams();
  const aba = abaValida(ABAS_DO_CLIENTE, params.get(PARAM_DA_ABA));
  const irParaAba = (nova: AbaDoCliente) => {
    const proximos = new URLSearchParams(params);
    proximos.set(PARAM_DA_ABA, nova);
    setParams(proximos, { replace: true });
  };

  const query = useQuery<Cliente>({
    queryKey: qk.detalheCliente(clienteId),
    queryFn: () => detalheCliente(clienteId),
  });

  /* ⚠️ Volta no HISTÓRICO -- ver `useVoltarParaLista`. */
  const voltar = useVoltarParaLista("/clientes");

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: qk.detalheCliente(clienteId) });
    queryClient.invalidateQueries({ queryKey: ["clientes"] });
  };

  const reativarMutation = useMutation({
    mutationFn: () => reativarCliente(clienteId),
    onSuccess: () => {
      invalidar();
      toast.sucesso(`${query.data?.nome ?? "Cliente"} voltou para a lista de clientes.`);
    },
    onError: (err) => toastErroMutation(toast, err, "Não foi possível reativar o cliente."),
  });

  const arquivarMutation = useMutation({
    mutationFn: () => arquivarCliente(clienteId),
    onSuccess: () => {
      setConfirmandoArquivamento(false);
      invalidar();
      /* Fica NA FICHA, e não volta para a lista: o cliente continua
         existindo, e quem arquivou pode querer conferir o que ficou. O
         "Desfazer" reativa -- e reativar não é recusado por nada. */
      toast.sucesso(`${query.data?.nome ?? "Cliente"} arquivado.`, {
        onDesfazer: () => reativarMutation.mutate(),
      });
    },
    onError: (err) => {
      setConfirmandoArquivamento(false);
      /* 🔴 O 409 do arquivamento não é "deu erro": é a lista do que falta
         resolver, e ela vira o diálogo de bloqueio. Qualquer outro erro
         segue pelo toast de sempre. */
      const doServidor = err instanceof ApiError ? err.corpo.motivos : null;
      if (Array.isArray(doServidor) && doServidor.length > 0) {
        setMotivos(doServidor.map(String));
        return;
      }
      toastErroMutation(toast, err, "Não foi possível arquivar o cliente.");
    },
  });

  if (query.isPending) return <Esqueleto linhas={4} />;
  if (query.isError) {
    return (
      <Stack gap="14px" align="flex-start">
        <BotaoDeTexto onClick={voltar}>
          <IconeSeta />
          Voltar
        </BotaoDeTexto>
        <Text color="fg.muted">
          {query.error instanceof Error ? query.error.message : "Não foi possível carregar."}
        </Text>
      </Stack>
    );
  }

  return (
    <Box>
      <Box mb="14px">
        <BotaoDeTexto onClick={voltar}>
          <IconeSeta />
          Voltar
        </BotaoDeTexto>
      </Box>

      <Abas
        grupo={GRUPO_DE_ABAS}
        abas={ABAS_DO_CLIENTE.map((a) => ({ id: a.id, rotulo: a.rotulo }))}
        ativa={aba}
        onMudar={irParaAba}
      />

      {/* ⚠️ Os dois painéis vão MONTADOS -- ver `PainelDaAba`. O que obriga
          é o de Detalhes: é um formulário com estado local (nome, CPF,
          telefone), e desmontá-lo ao trocar de aba jogaria fora o que a
          pessoa acabou de digitar.

          O de processos vai junto porque não custa nada: a consulta dele
          já está montada AQUI (`processosQuery`, que o diálogo de exclusão
          usa) e as duas dividem a chave -- esconder ou desmontar daria na
          mesma em requisições. */}
      <PainelDaAba grupo={GRUPO_DE_ABAS} id="detalhes" ativa={aba}>
        <FormularioCliente
          cliente={query.data}
          podeEditar={podeEditar}
          podeArquivar={podeArquivar}
          arquivando={arquivarMutation.isPending}
          reativando={reativarMutation.isPending}
          onSalvo={() => {
            queryClient.invalidateQueries({ queryKey: qk.detalheCliente(clienteId) });
            queryClient.invalidateQueries({ queryKey: ["clientes"] });
            /* 🔴 Processos e atendimentos também, e o motivo é o campo
               DERIVADO: o nome do cliente que essas telas mostram não vem do
               cache de clientes -- vem de `cliente_nomes`, resolvido pelo
               servidor DENTRO da resposta deles. Sem invalidar, renomear um
               cliente deixava as duas telas mostrando o nome velho até o
               polling de 60s ou uma revisita, e em conexão lenta a janela é
               maior ainda.

               Prefixo, não a chave exata: pega qualquer combinação de filtro
               e página, como no `removerProcesso`. */
            queryClient.invalidateQueries({ queryKey: ["processos"] });
            queryClient.invalidateQueries({ queryKey: ["atendimentos"] });
            toast.sucesso("Cliente atualizado.");
          }}
          onArquivar={() => setConfirmandoArquivamento(true)}
          onReativar={() => reativarMutation.mutate()}
        />
      </PainelDaAba>

      <PainelDaAba grupo={GRUPO_DE_ABAS} id="processos" ativa={aba}>
        <Cartao titulo="Processos vinculados">
          <ProcessosDoCliente clienteId={clienteId} />
        </Cartao>
      </PainelDaAba>

      <PainelDaAba grupo={GRUPO_DE_ABAS} id="documentos" ativa={aba}>
        <Cartao titulo="Documentos">
          <DocumentosVinculados
            filtro={{ clienteId }}
            /* ⚠️ Sem `subgrupoInicial`: cliente é do GRUPO e não pertence a
               subgrupo nenhum, então não há qual oferecer. O modal cai no
               primeiro da lista, e a pessoa escolhe. */
            clienteInicial={{ id: clienteId, nome: query.data.nome }}
            vazio="Nenhum documento vinculado a este cliente."
          />
        </Cartao>
      </PainelDaAba>

      {/* 🔴 Arquivamento BLOQUEADO usa `ModalDeAviso`, sem botão de
          confirmar: o servidor já recusou, e deixar o caminho aberto faria a
          pessoa insistir num 409. Os motivos vêm em LISTA, um por linha --
          quatro impedimentos numa frase corrida viram um parágrafo que
          ninguém conta. */}
      {motivos && (
        <ModalDeAviso
          titulo="Não dá pra arquivar ainda"
          mensagem={
            <>
              <strong>{query.data.nome}</strong>:
            </>
          }
          itens={motivos}
          detalhe="Resolva cada um antes de arquivar: desvincule dos processos, feche os atendimentos, receba ou cancele as faturas, e fature ou marque as cobranças para não cobrar."
          onFechar={() => setMotivos(null)}
        />
      )}

      {confirmandoArquivamento && (
        <ModalDeConfirmacao
          titulo="Arquivar cliente"
          mensagem={
            <>
              O cliente <strong>{query.data.nome}</strong> sai da lista de clientes e dos seletores.
            </>
          }
          /* Reversível: some a lixeira e o "não pode ser desfeita", que
             mentiriam -- reativar traz o cliente de volta inteiro. */
          reversivel
          varianteDoBotao="primario"
          rotulo="Arquivar"
          rotuloConfirmando="Arquivando…"
          nota="O histórico continua com o nome dele, e o CPF/CNPJ fica reservado. Dá para reativar em Clientes › Arquivados."
          confirmando={arquivarMutation.isPending}
          onConfirmar={() => arquivarMutation.mutate()}
          onFechar={() => setConfirmandoArquivamento(false)}
        />
      )}
    </Box>
  );
}
