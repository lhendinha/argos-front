import { useCallback, useEffect, useRef, useState } from "react";

import {
  TRABALHO_CONCLUIDO,
  MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO,
  TIPO_DA_PAGINA_DA_BUSCA,
  TIPO_DO_FIM_DA_BUSCA,
} from "../constants";
import { buscarProcessosPorOab, importarProcessos, lerBusca } from "../services/api";
import { esquecerImportacao, guardarImportacao, lerImportacaoGuardada } from "../utils/importacaoGuardada";
import { assinarCanal } from "../utils/canalDeTempoReal";
import { fundirPagina } from "../utils/importacao";
import { useGravacaoEmSegundoPlano } from "./useGravacaoEmSegundoPlano";
import { useReleituraDoTrabalho } from "./useReleituraDoTrabalho";
import type {
  BuscaLida,
  GravacaoLida,
  PaginaDaBusca,
  PreviaDaImportacao,
  ProcessoEncontrado,
  ResultadoDaImportacao,
  EtapaDaImportacao,
  ContagemDaImportacao,
} from "../types";

/** A importação por OAB inteira: a busca, a prévia e a gravação, no subgrupo da busca.
 *
 * 🔴 O subgrupo TRAVA da busca até recomeçar: a prévia é montada para ele ("já está
 * aqui"), e a gravação entra nele -- trocá-lo no meio gravava a prévia de um
 * subgrupo em outro.
 * ⚠️ A aba guarda a importação (`importacaoGuardada`), e a tela recarregada volta à
 * busca, à prévia ou à gravação -- no subgrupo guardado, e não no do seletor.
 */
export function useImportacaoPorOab(subgrupoEscolhido: string, email: string) {
  const [guardada] = useState(() => lerImportacaoGuardada(email));
  /** O subgrupo da importação em curso; `null` é nenhuma, e vale o do seletor. */
  const [subgrupoDaImportacao, setSubgrupoDaImportacao] = useState<string | null>(guardada?.subgrupoId ?? null);
  const subgrupoId = subgrupoDaImportacao ?? subgrupoEscolhido;
  const [etapa, setEtapa] = useState<EtapaDaImportacao>(
    guardada?.gravacao ? "importando" : guardada ? "buscando" : "formulario",
  );
  const [previa, setPrevia] = useState<PreviaDaImportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoDaImportacao | null>(null);
  const [erro, setErro] = useState("");
  /** O total pedido, para a barra nascer em zero antes do primeiro pulso. */
  const [pedidos, setPedidos] = useState<ContagemDaImportacao | null>(null);
  /** O que a busca em segundo plano já achou, fundido página a página. */
  const [parcial, setParcial] = useState<ProcessoEncontrado[]>([]);
  /** 🔴 A busca que esta tela espera. Mensagem de OUTRA busca (uma anterior, que
   * a pessoa abandonou) é descartada -- senão a lista misturaria duas OABs. */
  const [buscaEsperada, setBuscaEsperada] = useState<string | null>(
    guardada && !guardada.gravacao ? guardada.busca : null,
  );
  /** A busca da importação em curso -- guardada junto com a gravação. */
  const [buscaDaImportacao, setBuscaDaImportacao] = useState<string | null>(guardada?.busca ?? null);

  /** Encerra a importação desta aba: o seletor volta a valer, e a recarga não volta a ela. */
  const encerrar = useCallback(() => {
    esquecerImportacao();
    setSubgrupoDaImportacao(null);
    setBuscaDaImportacao(null);
  }, []);

  /** Aplica o que o `GET` leu no fim da busca: a prévia, ou o erro do PJe. */
  const aoTerminarBusca = useCallback(
    (lida: BuscaLida) => {
      setBuscaEsperada(null);
      if (lida.estado === TRABALHO_CONCLUIDO) {
        const processos = lida.processos ?? [];
        setPrevia({
          id: lida.id ?? "",
          total_encontrado: lida.total_encontrado ?? processos.length,
          atingiu_o_teto: Boolean(lida.atingiu_o_teto),
          processos,
        });
        /* ⚠️ A prévia fica guardada (a recarga volta a ela); o vazio não tem a que voltar. */
        if (processos.length === 0) encerrar();
        setEtapa(processos.length === 0 ? "vazio" : "previa");
      } else {
        encerrar();
        setErro(lida.erro ?? "Não foi possível buscar agora.");
        setEtapa("erro");
      }
    },
    [encerrar],
  );

  /** A busca sumiu (expirou, ou é de outra pessoa) ou a pessoa perdeu o acesso. */
  const aoDesistirDaBusca = useCallback(
    (e: unknown) => {
      setBuscaEsperada(null);
      encerrar();
      setErro(e instanceof Error ? e.message : "Não foi possível buscar agora.");
      setEtapa("erro");
    },
    [encerrar],
  );

  const semContatoNaBusca = useReleituraDoTrabalho<BuscaLida>({
    trabalhoId: buscaEsperada,
    ler: (id) => lerBusca(subgrupoId, id),
    tipoDoFim: TIPO_DO_FIM_DA_BUSCA,
    aoTerminar: aoTerminarBusca,
    aoDesistir: aoDesistirDaBusca,
  });

  useEffect(
    () =>
      assinarCanal(TIPO_DA_PAGINA_DA_BUSCA, (mensagem) => {
        const pagina = mensagem as unknown as PaginaDaBusca;
        if (!buscaEsperada || pagina.trabalho_id !== buscaEsperada) return;
        setParcial((atual) => fundirPagina(atual, pagina.processos));
      }),
    [buscaEsperada],
  );

  /** ⚠️ Evita que uma resposta de busca antiga sobrescreva a nova.
   *
   * Buscar, corrigir a OAB e buscar de novo pode fazer a primeira chegar
   * depois -- e a tela mostraria a lista da inscrição errada, sem nada
   * indicando isso. */
  const buscaAtual = useRef(0);

  const buscar = useCallback(
    async (numeroOab: string, ufOab: string, periodo: { de?: string; ate?: string } = {}) => {
      const minha = ++buscaAtual.current;
      /* 🔴 Sem subgrupo não sai pedido: a lista de subgrupos pode ainda estar
         chegando, e o `POST` iria para `/subgrupos//...` -- um 404 que a tela
         mostrava como "Not Found" (visto no Chrome). */
      if (!subgrupoId) {
        setErro("Escolha o subgrupo onde os processos vão ficar.");
        setEtapa("erro");
        return;
      }
      setEtapa("buscando");
      setErro("");
      setPedidos(null);
      setParcial([]);
      setBuscaEsperada(null);
      setSubgrupoDaImportacao(subgrupoId);
      try {
        const resposta = await buscarProcessosPorOab(subgrupoId, numeroOab, ufOab, periodo);
        if (minha !== buscaAtual.current) return;
        if ("trabalho_id" in resposta) {
          /* A API em segundo plano: a lista vem pelo canal, e o fim pelo `GET`. */
          setBuscaEsperada(resposta.trabalho_id);
          setBuscaDaImportacao(resposta.trabalho_id);
          guardarImportacao({ email, subgrupoId, busca: resposta.trabalho_id });
          return;
        }
        setPrevia(resposta);
        setEtapa(resposta.processos.length === 0 ? "vazio" : "previa");
      } catch (e) {
        if (minha !== buscaAtual.current) return;
        encerrar();
        setErro(e instanceof Error ? e.message : "Não foi possível buscar agora.");
        setEtapa("erro");
      }
    },
    [subgrupoId, email, encerrar],
  );

  /** O fim da gravação em segundo plano: os três números, ou o erro de quem caiu. */
  const aoTerminarGravacao = useCallback((lida: GravacaoLida) => {
    if (lida.estado === TRABALHO_CONCLUIDO) {
      setResultado({
        cadastrados: lida.cadastrados ?? 0,
        ja_existiam: lida.ja_existiam ?? 0,
        falharam: lida.falharam ?? [],
      });
      setEtapa("concluido");
    } else {
      setErro(lida.erro ?? MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO);
      setEtapa("erro");
    }
  }, []);
  const gravacao = useGravacaoEmSegundoPlano(subgrupoId, aoTerminarGravacao, guardada?.gravacao ?? null);

  const importar = useCallback(
    async (numeros: string[], responsaveis: string[]) => {
      if (!previa) return;
      setEtapa("importando");
      setErro("");
      /* Nasce em zero para a barra existir antes do primeiro pulso do canal
         -- se ele não chegar, ela fica indeterminada em vez de ausente. */
      setPedidos({ feitos: 0, total: numeros.length });
      try {
        const resposta = await importarProcessos(subgrupoId, previa.id, numeros, responsaveis);
        if ("trabalho_id" in resposta) {
          /* A API em segundo plano: o progresso segue pelo canal, e o fim também. */
          gravacao.esperar(resposta.trabalho_id);
          if (buscaDaImportacao) {
            guardarImportacao({ email, subgrupoId, busca: buscaDaImportacao, gravacao: resposta.trabalho_id });
          }
          return;
        }
        setResultado(resposta);
        setEtapa("concluido");
      } catch (e) {
        /* 🔴 A mensagem NÃO pode afirmar que nada foi gravado -- ver a constante. */
        setErro(e instanceof Error ? e.message : MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO);
        setEtapa("erro");
      }
    },
    [previa, subgrupoId, gravacao, buscaDaImportacao, email],
  );

  const recomecar = useCallback(() => {
    buscaAtual.current++;
    gravacao.esquecer();
    setBuscaEsperada(null);
    encerrar();
    setParcial([]);
    setEtapa("formulario");
    setPrevia(null);
    setResultado(null);
    setErro("");
    setPedidos(null);
  }, [gravacao, encerrar]);

  /** A importação guardada não vale mais (o subgrupo dela foi apagado): encerra, com o motivo. */
  const descartar = useCallback(
    (motivo: string) => {
      recomecar();
      setErro(motivo);
      setEtapa("erro");
    },
    [recomecar],
  );

  /** 🔴 Sem contato com o servidor enquanto espera: a tela avisa, e continua tentando. */
  const semContato = semContatoNaBusca || gravacao.semContato;

  /** A barra: o progresso da SUA gravação, ou o zero do pedido até o primeiro pulso. */
  const progresso = etapa === "importando" ? (gravacao.progresso ?? pedidos) : null;
  /** 🔴 O seletor trava enquanto há importação -- ver o docstring. */
  const subgrupoTravado = subgrupoDaImportacao !== null && ["buscando", "previa", "importando"].includes(etapa);

  return {
    etapa, previa, parcial, resultado, erro, progresso, semContato, subgrupoId, subgrupoTravado,
    buscar, importar, recomecar, descartar,
  };
}
