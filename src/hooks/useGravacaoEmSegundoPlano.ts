import { useCallback, useEffect, useState } from "react";

import {
  MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO,
  TIPO_DE_PROGRESSO,
  TIPO_DO_FIM_DA_GRAVACAO,
  TRABALHO_FALHOU,
} from "../constants";
import { lerGravacao } from "../services/api";
import { assinarCanal } from "../utils/canalDeTempoReal";
import { useReleituraDoTrabalho } from "./useReleituraDoTrabalho";
import type { ContagemDaImportacao, GravacaoLida, ProgressoDaImportacao } from "../types";

/** A espera da gravação em segundo plano, e o progresso DELA -- não o de qualquer gravação da pessoa.
 *
 * 🔴 O progresso é guardado por gravação, desde a montagem: o primeiro pulso sai
 * antes de o `202` devolver o id, e só assim ele não se perde. A barra só avança.
 * ⚠️ Desistir (a gravação sumiu, ou perdeu o acesso) vira "falhou" com a frase da
 * interrupção: parte pode ter sido cadastrada, e a frase manda buscar de novo.
 */
export function useGravacaoEmSegundoPlano(
  subgrupoId: string,
  aoTerminar: (lida: GravacaoLida) => void,
  retomada: string | null = null,
) {
  const [esperada, setEsperada] = useState<string | null>(retomada);
  const [progressos, setProgressos] = useState<Record<string, ContagemDaImportacao>>({});

  useEffect(
    () =>
      assinarCanal(TIPO_DE_PROGRESSO, (mensagem) => {
        const { trabalho_id, feitos, total } = mensagem as unknown as ProgressoDaImportacao;
        /* ⚠️ Guardado pelo DONO: o sem dono (ou de outra aba) nunca é o esperado, e não aparece. */
        setProgressos((atual) => ({
          ...atual,
          [trabalho_id]: { feitos: Math.max(feitos, atual[trabalho_id]?.feitos ?? 0), total },
        }));
      }),
    [],
  );

  const semContato = useReleituraDoTrabalho<GravacaoLida>({
    trabalhoId: esperada,
    ler: (id) => lerGravacao(subgrupoId, id),
    tipoDoFim: TIPO_DO_FIM_DA_GRAVACAO,
    aoTerminar: (lida) => {
      setEsperada(null);
      aoTerminar(lida);
    },
    aoDesistir: () => {
      const id = esperada ?? "";
      setEsperada(null);
      aoTerminar({ trabalho_id: id, estado: TRABALHO_FALHOU, erro: MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO });
    },
  });

  const esperar = useCallback((trabalhoId: string) => setEsperada(trabalhoId), []);
  const esquecer = useCallback(() => setEsperada(null), []);
  const progresso = esperada ? (progressos[esperada] ?? null) : null;

  return { esperar, esquecer, semContato, progresso };
}
