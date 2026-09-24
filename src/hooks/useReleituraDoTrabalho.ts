import { useCallback, useEffect, useRef, useState } from "react";

import { INTERVALO_DE_RELEITURA_DO_TRABALHO_MS, LIMIAR_SEM_CONTATO_MS, TRABALHO_NA_FILA } from "../constants";
import { dispararAutenticacaoInvalida } from "../services/authBridge";
import { ehSessaoExpirada, podeTentarDeNovo } from "../services/errosDaApi";
import { assinarCanal } from "../utils/canalDeTempoReal";
import type { OpcoesDaReleitura, TrabalhoLido } from "../types";

/** A espera de um trabalho em segundo plano -- a busca ou a gravação; devolve se a tela está sem contato.
 *
 * 🔴 Só erro DEFINITIVO encerra a espera (404: o trabalho sumiu ou é de outra
 * pessoa; 403: perdeu o acesso). Rede, 5xx, 429 e o 401 com a sessão viva tentam
 * de novo no próximo intervalo: o trabalho segue no servidor, que tem prazo próprio
 * para encerrá-lo.
 * ⚠️ Uma leitura por vez: o fim pelo canal que chega durante uma leitura a repete
 * no fim dela. Duas em paralelo deixavam a que falhou apagar o sucesso da outra.
 * ⚠️ Sessão encerrada (o servidor recusou a renovação) leva ao login, como o resto.
 */
export function useReleituraDoTrabalho<T extends TrabalhoLido>({
  trabalhoId, ler, tipoDoFim, aoTerminar, aoDesistir,
}: OpcoesDaReleitura<T>): boolean {
  const [semContato, setSemContato] = useState(false);
  const atual = useRef(trabalhoId);
  const chamadas = useRef({ ler, aoTerminar, aoDesistir });
  /** Desde quando a leitura em voo espera resposta; `null` é nenhuma. */
  const emVoo = useRef<number | null>(null);
  const repetir = useRef(false);
  const primeiraFalha = useRef<number | null>(null);

  useEffect(() => {
    atual.current = trabalhoId;
    chamadas.current = { ler, aoTerminar, aoDesistir };
  });

  const reler = useCallback(async function releitura(id: string): Promise<void> {
    if (emVoo.current !== null) {
      repetir.current = true;
      return;
    }
    emVoo.current = Date.now();
    try {
      const lida = await chamadas.current.ler(id);
      if (id !== atual.current) return;
      primeiraFalha.current = null;
      setSemContato(false);
      if (lida.estado !== TRABALHO_NA_FILA) chamadas.current.aoTerminar(lida);
    } catch (erro) {
      if (id !== atual.current) return;
      if (ehSessaoExpirada(erro)) {
        dispararAutenticacaoInvalida();
      } else if (!podeTentarDeNovo(erro)) {
        chamadas.current.aoDesistir(erro);
      } else {
        primeiraFalha.current ??= Date.now();
        if (Date.now() - primeiraFalha.current >= LIMIAR_SEM_CONTATO_MS) setSemContato(true);
      }
    } finally {
      emVoo.current = null;
      if (repetir.current) {
        repetir.current = false;
        if (id === atual.current) void releitura(id);
      }
    }
  }, []);

  useEffect(
    () =>
      assinarCanal(tipoDoFim, (mensagem) => {
        const fim = mensagem as unknown as TrabalhoLido;
        if (fim.trabalho_id === atual.current) void reler(fim.trabalho_id);
      }),
    [tipoDoFim, reler],
  );

  /* A primeira leitura sai JÁ: a tela reaberta com um trabalho que terminou mostra o
     resultado sem esperar o intervalo. */
  useEffect(() => {
    if (!trabalhoId) return;
    primeiraFalha.current = null;
    const primeira = setTimeout(() => void reler(trabalhoId), 0);
    const intervalo = setInterval(() => {
      /* ⚠️ Leitura PRESA também é falta de contato: o `fetch` sem resposta não falha. */
      if (emVoo.current !== null && Date.now() - emVoo.current >= LIMIAR_SEM_CONTATO_MS) setSemContato(true);
      void reler(trabalhoId);
    }, INTERVALO_DE_RELEITURA_DO_TRABALHO_MS);
    return () => {
      clearTimeout(primeira);
      clearInterval(intervalo);
    };
  }, [trabalhoId, reler]);

  return semContato && trabalhoId !== null;
}
