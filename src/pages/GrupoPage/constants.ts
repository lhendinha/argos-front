import {
  ESTADO_ARQUIVADOS,
  ESTADO_ATIVOS,
  ESTADO_TODOS,
  ESTADOS_DE_ARQUIVAMENTO,
} from "../../constants";
import type { EstadoDeArquivamento } from "../../types";

/** As colunas da tabela de inscrições avulsas, na ordem do artifact.
 *
 * ⚠️ A última é `""` porque no artifact a coluna de ações é `<th></th>`: o
 * cabeçalho existe pra a contagem de colunas bater, e não tem nome.
 *
 * ⚠️ Aqui e não dentro de `InscricoesDoGrupo`, pela mesma régua que tirou
 * `COLUNAS_DA_PREVIA` de dentro de `PreviaDaImportacao` -- e, como lá, o NOME
 * muda junto com a casa: fora do componente, `COLUNAS` não diz de que tabela
 * é. */
export const COLUNAS_DAS_INSCRICOES = [
  "Inscrição",
  "Importação automática",
  "Subgrupos de destino",
  "",
] as const;

/** As cores do contador "N de 50" (`.etq-info` do artifact). */
export const CORES_DO_CONTADOR_DE_INSCRICOES = {
  bg: "bg.brand.subtle",
  color: "brand.darker",
  borderColor: "brand.tint2",
} as const;

/** As três opções do chip de arquivamento, na ordem do artefato: "Todos"
 * primeiro, e a tela abrindo em "Ativos".
 *
 * ⚠️ `rotulo` é texto de tela; o `id` é a palavra que vai para a API (ou que
 * filtra na memória). Ficaram lado a lado de propósito. */
export const OPCOES_DE_ESTADO = [
  { id: ESTADO_TODOS, rotulo: "Todos" },
  { id: ESTADO_ATIVOS, rotulo: "Ativos" },
  { id: ESTADO_ARQUIVADOS, rotulo: "Arquivados" },
] as const;

/** O estado que veio da URL, ou "Ativos".
 *
 * 🔴 A URL é digitável: um valor inventado chegaria à API como filtro
 * desconhecido e voltaria 422, com a tela dizendo só "não foi possível
 * carregar". Aqui o desconhecido vira o padrão. */
export function estadoDeArquivamentoValido(valor: string): EstadoDeArquivamento {
  return (ESTADOS_DE_ARQUIVAMENTO as readonly string[]).includes(valor)
    ? (valor as EstadoDeArquivamento)
    : ESTADO_ATIVOS;
}
