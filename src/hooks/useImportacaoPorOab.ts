import { useCallback, useEffect, useRef, useState } from "react";

import {
  BUSCA_CONCLUIDA,
  BUSCA_FALHOU,
  INTERVALO_DE_RELEITURA_DA_BUSCA_MS,
  TIPO_DA_PAGINA_DA_BUSCA,
  TIPO_DO_FIM_DA_BUSCA,
} from "../constants";
import { buscarProcessosPorOab, importarProcessos, lerBusca } from "../services/api";
import { esquecerBusca, guardarBusca, lerBuscaGuardada } from "../utils/buscaGuardada";
import { assinarCanal } from "../utils/canalDeTempoReal";
import { fundirPagina } from "../utils/importacao";
import type {
  BuscaLida,
  FimDaBusca,
  PaginaDaBusca,
  PreviaDaImportacao,
  ProcessoEncontrado,
  ProgressoDaImportacao,
  ResultadoDaImportacao,
  EtapaDaImportacao,
  ContagemDaImportacao,
} from "../types";

export function useImportacaoPorOab(subgrupoId: string) {
  /* A tela reaberta (ou recarregada) nasce na busca que estava em andamento. */
  const [guardadaAoAbrir] = useState(() => lerBuscaGuardada(subgrupoId));
  const [etapa, setEtapa] = useState<EtapaDaImportacao>(guardadaAoAbrir ? "buscando" : "formulario");
  const [previa, setPrevia] = useState<PreviaDaImportacao | null>(null);
  const [resultado, setResultado] = useState<ResultadoDaImportacao | null>(null);
  const [erro, setErro] = useState("");
  const [progresso, setProgresso] = useState<ContagemDaImportacao | null>(null);
  /** O que a busca em segundo plano já achou, fundido página a página. */
  const [parcial, setParcial] = useState<ProcessoEncontrado[]>([]);
  /** 🔴 A busca que esta tela espera. Mensagem de OUTRA busca (uma anterior, que
   * a pessoa abandonou) é descartada -- senão a lista misturaria duas OABs. */
  const trabalhoAtual = useRef<string | null>(guardadaAoAbrir);

  /** 🔴 A barra ouve o canal SEMPRE, não só durante a gravação.
   *
   * Assinar ao clicar em "Importar" abriria uma janela: a primeira mensagem
   * (`feitos: 0`) sai antes de o `await` sequer devolver o controle, e um
   * assinante registrado depois a perderia -- a barra começaria do segundo
   * pulso, ou de lugar nenhum numa importação curta.
   */
  useEffect(
    () =>
      assinarCanal("importacao_progresso", (mensagem) => {
        const { feitos, total } = mensagem as unknown as ProgressoDaImportacao;
        setProgresso({ feitos, total });
      }),
    [],
  );

  /** Aplica o que o `GET` leu: a prévia no fim, o erro do PJe, ou nada (ainda na fila). */
  const aplicar = useCallback(
    (lida: BuscaLida) => {
      if (lida.trabalho_id !== trabalhoAtual.current) return;
      if (lida.estado === BUSCA_CONCLUIDA) {
        trabalhoAtual.current = null;
        esquecerBusca(subgrupoId);
        const processos = lida.processos ?? [];
        setPrevia({
          id: lida.id ?? "",
          total_encontrado: lida.total_encontrado ?? processos.length,
          atingiu_o_teto: Boolean(lida.atingiu_o_teto),
          processos,
        });
        setEtapa(processos.length === 0 ? "vazio" : "previa");
      } else if (lida.estado === BUSCA_FALHOU) {
        trabalhoAtual.current = null;
        esquecerBusca(subgrupoId);
        setErro(lida.erro ?? "Não foi possível buscar agora.");
        setEtapa("erro");
      }
    },
    [subgrupoId],
  );

  /** Relê a busca pelo `GET` -- no fim anunciado pelo canal, e periodicamente,
   * porque o canal pode ter caído e o fim chegaria só por ele. */
  const reler = useCallback(
    async (trabalhoId: string) => {
      try {
        aplicar(await lerBusca(subgrupoId, trabalhoId));
      } catch (e) {
        if (trabalhoId !== trabalhoAtual.current) return;
        trabalhoAtual.current = null;
        esquecerBusca(subgrupoId);
        setErro(e instanceof Error ? e.message : "Não foi possível buscar agora.");
        setEtapa("erro");
      }
    },
    [aplicar, subgrupoId],
  );

  useEffect(
    () =>
      assinarCanal(TIPO_DA_PAGINA_DA_BUSCA, (mensagem) => {
        const pagina = mensagem as unknown as PaginaDaBusca;
        if (pagina.trabalho_id !== trabalhoAtual.current) return;
        setParcial((atual) => fundirPagina(atual, pagina.processos));
      }),
    [],
  );

  useEffect(
    () =>
      assinarCanal(TIPO_DO_FIM_DA_BUSCA, (mensagem) => {
        const fim = mensagem as unknown as FimDaBusca;
        if (fim.trabalho_id === trabalhoAtual.current) void reler(fim.trabalho_id);
      }),
    [reler],
  );

  /* ⚠️ A releitura periódica só existe enquanto há busca em voo. A primeira volta
     sai JÁ: a tela reaberta com uma busca guardada que terminou mostra a prévia
     sem esperar o intervalo. Numa busca nova ela não faz nada -- o id ainda não veio. */
  useEffect(() => {
    if (etapa !== "buscando") return;
    const relerAtual = () => {
      if (trabalhoAtual.current) void reler(trabalhoAtual.current);
    };
    const primeira = setTimeout(relerAtual, 0);
    const intervalo = setInterval(relerAtual, INTERVALO_DE_RELEITURA_DA_BUSCA_MS);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
    };
  }, [etapa, reler]);

  /** ⚠️ Evita que uma resposta de busca antiga sobrescreva a nova.
   *
   * Buscar, corrigir a OAB e buscar de novo pode fazer a primeira chegar
   * depois -- e a tela mostraria a lista da inscrição errada, sem nada
   * indicando isso. */
  const buscaAtual = useRef(0);

  const buscar = useCallback(
    async (numeroOab: string, ufOab: string, periodo: { de?: string; ate?: string } = {}) => {
      const minha = ++buscaAtual.current;
      setEtapa("buscando");
      setErro("");
      setProgresso(null);
      setParcial([]);
      trabalhoAtual.current = null;
      try {
        const resposta = await buscarProcessosPorOab(subgrupoId, numeroOab, ufOab, periodo);
        if (minha !== buscaAtual.current) return;
        if ("trabalho_id" in resposta) {
          /* A API em segundo plano: a lista vem pelo canal, e o fim pelo `GET`. */
          trabalhoAtual.current = resposta.trabalho_id;
          guardarBusca(subgrupoId, resposta.trabalho_id);
          return;
        }
        setPrevia(resposta);
        setEtapa(resposta.processos.length === 0 ? "vazio" : "previa");
      } catch (e) {
        if (minha !== buscaAtual.current) return;
        setErro(e instanceof Error ? e.message : "Não foi possível buscar agora.");
        setEtapa("erro");
      }
    },
    [subgrupoId],
  );

  const importar = useCallback(
    async (numeros: string[], responsaveis: string[]) => {
      if (!previa) return;
      setEtapa("importando");
      setErro("");
      /* Nasce em zero para a barra existir antes do primeiro pulso do canal
         -- se ele não chegar, ela fica indeterminada em vez de ausente. */
      setProgresso({ feitos: 0, total: numeros.length });
      try {
        setResultado(await importarProcessos(subgrupoId, previa.id, numeros, responsaveis));
        setEtapa("concluido");
      } catch (e) {
        /* 🔴 A mensagem NÃO pode afirmar que nada foi gravado.
         *
         * Um timeout no meio deixa os processos já criados no banco -- dizer
         * "a importação falhou" mandaria a pessoa procurar o que já está lá.
         * Repetir é seguro: o servidor pula o que já existe. */
        setErro(
          e instanceof Error
            ? e.message
            : "A importação foi interrompida; parte dos processos pode ter sido cadastrada. " +
              "Buscar de novo cadastra só o que falta.",
        );
        setEtapa("erro");
      }
    },
    [previa, subgrupoId],
  );

  const recomecar = useCallback(() => {
    buscaAtual.current++;
    trabalhoAtual.current = null;
    esquecerBusca(subgrupoId);
    setParcial([]);
    setEtapa("formulario");
    setPrevia(null);
    setResultado(null);
    setErro("");
    setProgresso(null);
  }, [subgrupoId]);

  return { etapa, previa, parcial, resultado, erro, progresso, buscar, importar, recomecar };
}
