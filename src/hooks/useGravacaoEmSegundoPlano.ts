import { useCallback, useState } from "react";

import { MENSAGEM_DE_INTERRUPCAO_DA_IMPORTACAO, TIPO_DO_FIM_DA_GRAVACAO, TRABALHO_FALHOU } from "../constants";
import { lerGravacao } from "../services/api";
import { useReleituraDoTrabalho } from "./useReleituraDoTrabalho";
import type { GravacaoLida } from "../types";

/** A espera da gravação em segundo plano: a espera única do trabalho, com o subgrupo da importação.
 *
 * ⚠️ Desistir (a gravação sumiu, ou perdeu o acesso) vira "falhou" com a frase da
 * interrupção: parte pode ter sido cadastrada, e a frase manda buscar de novo.
 */
export function useGravacaoEmSegundoPlano(subgrupoId: string, aoTerminar: (lida: GravacaoLida) => void) {
  const [esperada, setEsperada] = useState<string | null>(null);

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

  return { esperar, esquecer, semContato };
}
