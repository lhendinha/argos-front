import { STATUS_DE_ATENDIMENTO } from "../constants";
import type {
  CamposDoAtendimento,
  CamposEditaveisDoAtendimento,
  RegistroDeAtendimento,
  StatusDeAtendimento,
} from "../types";
import { mesmoValor } from "./iguais";

/* 🔴 Mora em `utils/`, e não em `services/api/atendimentos.ts`: é montagem
   de corpo de requisição, não chamada de API. Gêmeo de `camposAlterados`
   em `utils/processos.ts`, que é onde a regra foi escrita primeiro. */

/** O status lido é um dos que este front conhece?
 *
 * ⚠️ Existe porque a LEITURA é tolerante de propósito -- `Atendimento.status`
 * é `string`, e `theme/atendimento.ts` pinta status desconhecido em vez de
 * escondê-lo, para o servidor poder crescer. A ESCRITA não pode ser
 * tolerante: a API recusa palavra fora do vocabulário com 400.
 */
export function ehStatusDeAtendimento(valor: string): valor is StatusDeAtendimento {
  return (STATUS_DE_ATENDIMENTO as readonly string[]).includes(valor);
}

/** Só o que MUDOU em relação ao atendimento que está gravado.
 *
 * 🔴 **O formulário mandava sempre os três campos, e isso travava a edição.**
 * Um atendimento com status que este front não conhece devolvia esse status
 * no `PATCH` de um assunto, e a API respondia 400 "Status inválido" -- erro
 * apontando um campo que a pessoa não tocou, com o assunto perdido junto.
 * Mandando só o alterado, o status desconhecido fica onde está.
 *
 * ⚠️ Os outros dois motivos são os mesmos de `camposAlterados`, e valem aqui
 * igual: **corrida** (quem salva o assunto devolveria por cima o status que
 * outra pessoa acabou de mudar) e **permissão** (reenviar a lista de
 * responsáveis inalterada faz o servidor rodar a régua de "tirar OUTRA
 * pessoa" à toa).
 *
 * ⚠️ Status que não está no vocabulário NÃO é enviado, nem quando "mudou":
 * não existe como escolhê-lo na tela -- o `Select` só oferece os dois --,
 * então um valor desses aqui só poderia vir do que foi lido.
 *
 * ➡️ `pages/AtendimentoDetalhePage/index.test.tsx` e
 * `utils/atendimentos.test.ts`.
 */
export function camposAlteradosDoAtendimento(
  original: CamposEditaveisDoAtendimento,
  atual: CamposEditaveisDoAtendimento,
): CamposDoAtendimento {
  const mudou: CamposDoAtendimento = {};
  if (!mesmoValor(original.assunto, atual.assunto)) mudou.assunto = atual.assunto;
  if (!mesmoValor(original.responsaveis, atual.responsaveis)) {
    mudou.responsaveis = atual.responsaveis;
  }
  if (!mesmoValor(original.status, atual.status) && ehStatusDeAtendimento(atual.status)) {
    mudou.status = atual.status;
  }
  return mudou;
}

/** A chave de um registro na tela: o `registro_id`, quando ele mora na tabela
 * de registros.
 *
 * ⚠️ O registro que ainda mora dentro do atendimento não tem `registro_id` até
 * a migração; aí a chave é o instante e o autor.
 *
 * ➡️ `utils/atendimentos.test.ts`. */
export function chaveDoRegistro(registro: RegistroDeAtendimento): string {
  return registro.registro_id ?? `${registro.registrado_em}#${registro.autor_id}`;
}

/** A frase do topo da linha do tempo: quantos registros a tela mostra de
 * quantos existem.
 *
 * ⚠️ Com todos na tela a frase muda, e com um só vai no singular -- "Todos os
 * 1 registros" não é português.
 *
 * ➡️ `utils/atendimentos.test.ts`. */
export function contagemDaLinhaDoTempo(mostrados: number, quantidade: number): string {
  if (mostrados >= quantidade) return quantidade === 1 ? "1 registro" : `Todos os ${quantidade} registros`;
  return `Mostrando os ${mostrados} mais recentes de ${quantidade} registros`;
}
