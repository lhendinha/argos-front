import { useCallback, useEffect, useRef } from "react";

import {
  INTERVALO_DE_RELEITURA_DO_TRABALHO_MS,
  MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO,
  TIPO_DO_FIM_DA_GRAVACAO,
  TRABALHO_FALHOU,
  TRABALHO_NA_FILA,
} from "../constants";
import { lerGravacao } from "../services/api";
import { assinarCanal } from "../utils/canalDeTempoReal";
import type { FimDaGravacao, GravacaoLida } from "../types";

/** A espera da gravação em segundo plano: o fim pelo canal, e a releitura pelo `GET`.
 *
 * 🔴 O `GET` é a fonte: o fim no canal só dispara a releitura, e enquanto grava a
 * tela relê a cada intervalo -- o canal pode ter caído, e o fim viria só por ele.
 * ⚠️ Fim de OUTRA gravação (uma que a pessoa abandonou) é descartado.
 */
export function useGravacaoEmSegundoPlano(
  subgrupoId: string,
  gravando: boolean,
  aoTerminar: (lida: GravacaoLida) => void,
) {
  const gravacaoAtual = useRef<string | null>(null);

  const reler = useCallback(
    async (trabalhoId: string) => {
      let lida: GravacaoLida;
      try {
        lida = await lerGravacao(subgrupoId, trabalhoId);
      } catch {
        lida = { trabalho_id: trabalhoId, estado: TRABALHO_FALHOU, erro: MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO };
      }
      if (trabalhoId !== gravacaoAtual.current || lida.estado === TRABALHO_NA_FILA) return;
      gravacaoAtual.current = null;
      aoTerminar(lida);
    },
    [subgrupoId, aoTerminar],
  );

  useEffect(
    () =>
      assinarCanal(TIPO_DO_FIM_DA_GRAVACAO, (mensagem) => {
        const fim = mensagem as unknown as FimDaGravacao;
        if (fim.trabalho_id === gravacaoAtual.current) void reler(fim.trabalho_id);
      }),
    [reler],
  );

  useEffect(() => {
    if (!gravando) return;
    const intervalo = setInterval(() => {
      if (gravacaoAtual.current) void reler(gravacaoAtual.current);
    }, INTERVALO_DE_RELEITURA_DO_TRABALHO_MS);
    return () => clearInterval(intervalo);
  }, [gravando, reler]);

  const esperar = useCallback((trabalhoId: string) => {
    gravacaoAtual.current = trabalhoId;
  }, []);
  const esquecer = useCallback(() => {
    gravacaoAtual.current = null;
  }, []);

  return { esperar, esquecer };
}
