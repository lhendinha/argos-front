import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useEstadoNaUrl } from "../../hooks/useEstadoNaUrl";
import { usePaginacaoDaLista } from "../../hooks/usePaginacaoDaLista";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  AreaAtualizando,
  CartaoDeTabela,
  EstadoDeErro,
  Pagination,
  Esqueleto,
} from "../../components";
import { useValorComEspera } from "../../hooks/useValorComEspera";
import { arquivarCliente, listarClientes, papelAtende, reativarCliente } from "../../services";
import { useToast } from "../../contexts/ToastContext";
import { toastErroMutation } from "../../services/queryClient";
import { ESTADO_DE_CLIENTE_ATIVOS } from "../../constants";
import type { Cliente, EstadoDeCliente } from "../../types";
import { estadoDeClienteValido } from "./constants";
import { useToastOnQueryError } from "../../services/queryClient";
import { qk } from "../../services/queryKeys";
import CabecalhoClientes from "./components/CabecalhoClientes";
import NovoClienteForm from "./components/NovoClienteForm";
import TabelaClientes from "./components/TabelaClientes";
import type {
  RespostaDeClientesPaginada,
} from "../../types/respostas";

/** Listagem de clientes.
 *
 * O detalhe é rota (`/clientes/:id`), como em Processos: a tela precisa
 * sobreviver a um F5 e a um link colado, e o `GET /clientes/{id}` existe
 * justamente pra isso.
 */
export default function ClientesPage() {
  const { pagina, setPagina, tamanhoPagina, setTamanhoPagina } = usePaginacaoDaLista();
  const [modalAberto, setModalAberto] = useState(false);
  const [buscaInput, setBuscaInput] = useEstadoNaUrl("busca", "", { tambemApaga: ["pagina"] });
  /** ⚠️ Debounce de verdade, não `useDeferredValue`. Aquele não tem
   * componente de TEMPO: só pula valores intermediários quando o render é
   * lento o bastante, e nesta tabela ele é rápido -- então cada tecla virava
   * uma `queryKey` nova e uma requisição. Digitar "silva" eram cinco. */
  const busca = useValorComEspera(buscaInput);
  /* O chip vive na URL, como a busca e o status de Atendimentos: a tela
     sobrevive a um F5 e o endereço conta o que está sendo visto. Voltar a
     "Ativos" apaga o parâmetro -- é o padrão de quem não escolheu nada. */
  const [estadoNaUrl, setEstado] = useEstadoNaUrl("estado", ESTADO_DE_CLIENTE_ATIVOS as string, {
    tambemApaga: ["pagina"],
  });
  /* A URL é digitável: o que não for um dos três vira "Ativos" -- ver
     `estadoDeClienteValido`. */
  const estado: EstadoDeCliente = estadoDeClienteValido(estadoNaUrl);
  const queryClient = useQueryClient();
  const toast = useToast();

  const podeCriar = papelAtende("manager");
  /* Arquivar e reativar são `manager`+, o mesmo piso de criar e editar --
     é a régua da API. */
  const podeArquivar = papelAtende("manager");

  // Buscando, a API devolve o conjunto filtrado inteiro num envelope só --
  // por isso a paginação some enquanto há termo.
  const parametros = busca ? { busca, estado } : { pagina, tamanhoPagina, estado };
  const query = useQuery<RespostaDeClientesPaginada>({
    queryKey: qk.clientes(parametros),
    /* Mantém a página anterior na tela enquanto a nova vem. Sem isto a
       `queryKey` muda, a chave nasce fria, `isPending` vira `true` e a
       tabela DESMONTA -- pisca a cada página, a cada filtro e a cada tecla
       da busca. O `AreaAtualizando` em volta é que diz que o conteúdo
       visível ainda é o antigo. */
    placeholderData: keepPreviousData,
    queryFn: () => listarClientes(parametros),
  });
  useToastOnQueryError(query.error, "Não foi possível carregar os clientes.");

  const invalidarClientes = () => queryClient.invalidateQueries({ queryKey: qk.prefixoClientes() });

  /* ⚠️ Desfazer uma reativação é ARQUIVAR de novo, e isso pode ser recusado
     (um vínculo novo entrou nesse meio-tempo, ou o cliente sempre teve um).
     O botão continua existindo -- é o artefato validado --, mas a recusa
     precisa aparecer: daí o `onError` avisar e recarregar a lista, em vez de
     falhar em silêncio e deixar a tela dizendo o contrário do que houve. */
  const arquivarDeNovo = useMutation({
    mutationFn: (cliente: Cliente) => arquivarCliente(cliente.cliente_id),
    onSuccess: invalidarClientes,
    onError: (err) => {
      invalidarClientes();
      toastErroMutation(toast, err, "Não foi possível arquivar de novo.");
    },
  });

  const reativarMutation = useMutation({
    mutationFn: (cliente: Cliente) => reativarCliente(cliente.cliente_id),
    onSuccess: (_dados, cliente) => {
      invalidarClientes();
      toast.sucesso(`${cliente.nome} voltou para a lista de clientes.`, {
        onDesfazer: () => arquivarDeNovo.mutate(cliente),
      });
    },
    onError: (err) => toastErroMutation(toast, err, "Não foi possível reativar o cliente."),
  });

  const clientes = query.data?.clientes || [];
  const total = query.data?.total ?? 0;
  const totalPaginas = query.data?.total_paginas ?? 0;

  const carregando = query.isPending;

  return (
    <>
      <CabecalhoClientes
        carregando={carregando}
        total={total}
        exibidos={clientes.length}
        busca={buscaInput}
        estado={estado}
        onMudarEstado={setEstado}
        /* Duas fases, e as duas são "o que você vê não é o que você
           escreveu": a espera entre teclas (o input já mudou, `busca` não) e
           a consulta em voo (`isPlaceholderData`). */
        buscando={buscaInput !== busca || query.isPlaceholderData}
        onBuscar={setBuscaInput}
        podeCriar={podeCriar}
        onNovoCliente={() => setModalAberto(true)}
      />

      {carregando ? (
        <Esqueleto />
      ) : query.isError ? (
        <CartaoDeTabela>
          <EstadoDeErro
            mensagem="Não foi possível carregar os clientes."
            onTentarDeNovo={() => query.refetch()}
            tentando={query.isFetching}
          />
        </CartaoDeTabela>
      ) : (
        <CartaoDeTabela>
          <AreaAtualizando atualizando={query.isPlaceholderData}>
            <TabelaClientes
              clientes={clientes}
              busca={busca}
              estado={estado}
              podeArquivar={podeArquivar}
              onReativar={(cliente) => reativarMutation.mutate(cliente)}
              reativandoId={reativarMutation.isPending ? reativarMutation.variables?.cliente_id : undefined}
              onLimparBusca={() => setBuscaInput("")}
            />
          </AreaAtualizando>
          {!busca && clientes.length > 0 && (
            <Pagination
              pagina={pagina}
              totalPaginas={totalPaginas}
              total={total}
              tamanhoPagina={tamanhoPagina}
              onMudarPagina={setPagina}
              onMudarTamanho={setTamanhoPagina}
            />
          )}
        </CartaoDeTabela>
      )}

      {modalAberto && (
        <NovoClienteForm
          onCadastrado={() => queryClient.invalidateQueries({ queryKey: ["clientes"] })}
          onFechar={() => setModalAberto(false)}
        />
      )}
    </>
  );
}
