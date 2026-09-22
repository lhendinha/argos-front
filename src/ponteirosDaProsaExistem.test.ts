import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/** O ➡️ de um comentário aponta para documento e seção que existem.
 *
 * 🔴 É o irmão de `comentariosCitamCodigoReal.test.ts`, do outro lado da
 * prosa: lá o alvo é um símbolo, aqui é um `.md` e um título dentro dele.
 * Nasceu quando o `CONTEXT.md` foi fatiado e doze ponteiros passaram a
 * apontar para seções que tinham mudado de arquivo -- e **nenhum teste
 * ficou vermelho**. Ponteiro quebrado é pior que ausência: quem lê procura,
 * não acha, e conclui pelo que sobrou na memória.
 *
 * ⚠️ **Só a parte mecânica, de novo.** Que o ponteiro leve ao assunto CERTO
 * nenhum teste pega; o que dá para cobrar é que o arquivo e o título
 * existam, e é o que este faz.
 *
 * ⚠️ **Plano da API citado sem o prefixo `api/` vale.** Dez comentários
 * daqui dizem `PLANO_ACOES_EM_LOTE.md`, que mora no outro repositório. O
 * ponteiro é legítimo e corrigir os dez seria ruído, então a busca tenta
 * `front/` e depois `api/`. Por isso o guarda pula quando o front está
 * sozinho -- igual ao irmão.
 *
 * ⚠️ **O README também cita seção, e cita CRUZADO** (`api/CONTEXT.md` do
 * front, `front/CONTEXT.md` da api) -- ficou de fora na primeira versão e
 * dois ponteiros do `api/README.md` quebraram calados quando o `CONTEXT.md`
 * dele foi fatiado. Entra como fonte, com o arquivo inteiro tratado como
 * "comentário" -- ele já é só prosa.
 */

const COMENTARIO_DE_LINHA = /\/\/[^\n]*/g;
const COMENTARIO_DE_BLOCO = /\/\*[\s\S]*?\*\//g;

/** Termina em `.md` e NÃO é arquivo. Cada entrada foi conferida. */
const NAO_E_ARQUIVO = new Set([
  // Token de tamanho do Chakra (`px`/`py` em `size.md`), não documento.
  "size.md",
]);

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.resolve(AQUI, "../..");

/** Os títulos de um `.md`, sem o `#`. Vazio quando o arquivo não existe.
 *
 * 🔴 **`preferencia` desempata nome que existe nos DOIS repositórios**
 * (`CONTEXT.md`, `NARRATIVA.md`, `CLAUDE.md`). Sem prefixo, `api/README.md`
 * citando `NARRATIVA.md` batia primeiro em `front/NARRATIVA.md` -- existe,
 * então a ordem fixa parava ali, no repositório ERRADO. Quem cita sem
 * prefixo quer o PRÓPRIO; o outro é só fallback pro caso cross-repo
 * explícito (`api/CONTEXT.md` citado de dentro do front). */
function titulos(relativo: string, preferencia?: "front" | "api"): string[] {
  const ordem = preferencia
    ? [preferencia, "", preferencia === "front" ? "api" : "front"]
    : ["", "front", "api"];
  for (const base of ordem) {
    const abs = path.join(RAIZ, base, relativo);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) continue;
    return fs
      .readFileSync(abs, "utf8")
      .split("\n")
      .filter((l) => l.startsWith("#"))
      .map((l) => l.replace(/^#+\s*/, "").trim());
  }
  return [];
}

function arvore(base: string, extensoes: string[]): [string, string][] {
  const dir = path.join(RAIZ, base);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((rel) => extensoes.some((e) => rel.endsWith(e)))
    .map((rel) => path.join(dir, rel))
    .filter((abs) => fs.statSync(abs).isFile())
    .map((abs) => [path.relative(RAIZ, abs), fs.readFileSync(abs, "utf8")]);
}

const FONTES: [string, string][] = [
  ...arvore("front/src", [".ts", ".tsx"]),
  ...arvore("front/scripts", [".mjs", ".ts"]),
  // 🔴 O README também cita seção -- e cita CRUZADO (api/CONTEXT.md do
  // front, front/CONTEXT.md da api), então é código de verdade pro guarda.
  ...(["front/README.md", "api/README.md"] as const)
    .map((rel): [string, string] => [rel, path.join(RAIZ, rel)])
    .filter(([, abs]) => fs.existsSync(abs))
    .map(([rel, abs]): [string, string] => [rel, fs.readFileSync(abs, "utf8")]),
];

/** Os comentários de um arquivo numa linha só.
 *
 * ⚠️ As quebras do bloco (`\n * `) viram espaço: sem isso, um título citado
 * que atravessa duas linhas nunca casaria.
 * ⚠️ Um `.md` inteiro já É prosa -- nada de comentário pra extrair, o
 * arquivo inteiro entra, só com a quebra de linha normalizada igual.
 * ⚠️ **`>` de blockquote sobrevivia à junção** e colava no meio do título
 * ("Quem responde, > recebe") -- citação CORRETA acusada de quebrada
 * porque o texto extraído tinha lixo. */
const comentarios = (texto: string, caminho: string) =>
  caminho.endsWith(".md")
    ? texto
        .split("\n")
        .map((l) => l.replace(/^>\s*/, ""))
        .join("\n")
        .replace(/\s*\n\s*/g, " ")
    : [
        ...(texto.match(COMENTARIO_DE_BLOCO) ?? []),
        ...(texto.match(COMENTARIO_DE_LINHA) ?? []),
      ]
        .join("\n")
        .replace(/\s*\n\s*\*?\s*/g, " ");

const CITACAO = /(?:([\w-]+)\s+(?:do|da|de)\s+)?`?([\w./-]+\.md)`?([^`\n]{0,60})/g;
const SECAO_DEPOIS = /^[,:]?\s*(?:se(?:ç|c)(?:ão|ao)\s+([\w-]+)|,\s*\*?"([^"]+)")/i;
const SECAO_ANTES = /^se(?:ç|c)(?:ão|ao)$/i;

/** O título vem ANTES do arquivo, ligado por "no"/"na"/"em" -- não
 * "do/da/de" (essa forma o `SECAO_ANTES` já cobre). Sem este segundo
 * padrão a citação nem é reconhecida: não "resolve errado", é INVISÍVEL --
 * foi assim que uma mutação passou batido na primeira versão (README usa
 * esta forma o tempo todo).
 * ⚠️ Escrita SEM o exemplo entre crases de propósito: um exemplo literal
 * aqui seria uma citação de verdade, e o sentinela pegaria a si mesmo. */
const CITACAO_ANTES_DO_NOME = /\*?"([^"]+)"\*?\s+(?:no|na|em|do|da|de)\s+`([\w./-]+\.md)`/g;

/** Ponteiros citados num arquivo: `[nome do documento, seção]`. */
function ponteiros(texto: string, caminho: string): [string, string | null][] {
  const achados: [string, string | null][] = [];
  const comentado = comentarios(texto, caminho);
  for (const [, antes, arquivo, depois] of comentado.matchAll(CITACAO)) {
    if (NAO_E_ARQUIVO.has(arquivo)) continue;
    const seguinte = SECAO_DEPOIS.exec(depois);
    // "seção 3 do `CONTEXT.md`" -- o número vem ANTES do nome do arquivo.
    // ⚠️ `antes` captura a palavra colada ao "do"; só vale se a anterior
    // for mesmo "seção", senão "Fase 3 do PLANO" viraria seção.
    const anterior = SECAO_ANTES.test(
      (texto.match(new RegExp(`(\\S+)\\s+${antes}\\s+(?:do|da|de)\\s+\`?${arquivo.replace(/[.\\/]/g, "\\$&")}`)) ?? [])[1] ?? "",
    )
      ? antes
      : null;
    achados.push([arquivo, seguinte?.[1] ?? seguinte?.[2] ?? anterior ?? null]);
  }
  for (const [, titulo, arquivo] of comentado.matchAll(CITACAO_ANTES_DO_NOME)) {
    if (!NAO_E_ARQUIVO.has(arquivo)) achados.push([arquivo, titulo]);
  }
  return achados;
}

/** O título existe? Número (`0c`, `3`) casa com "3) Decisões..."; texto
 * casa por conter, porque o título traz a data entre parênteses. */
const achaSecao = (tituloDoArquivo: string[], secao: string) =>
  /^[\dab-]+$/i.test(secao)
    ? tituloDoArquivo.some((t) => t.toLowerCase().startsWith(`${secao.toLowerCase()})`))
    : tituloDoArquivo.some((t) => t.includes(secao));

const TEM_A_API = fs.existsSync(path.join(RAIZ, "api/src"));

/** De qual repositório é o arquivo que cita -- pra `titulos` desempatar. */
const repoDe = (caminho: string): "front" | "api" =>
  caminho.startsWith("api/") ? "api" : "front";

describe("os ponteiros da prosa levam a algum lugar", () => {
  it("varre a árvore de verdade -- senão passaria vazio", () => {
    expect(FONTES.length).toBeGreaterThan(300);
    const todos = FONTES.flatMap(([caminho, t]) => ponteiros(t, caminho));
    expect(todos.length).toBeGreaterThan(40);
    expect(titulos("CLAUDE.md").length).toBeGreaterThan(5);
    // 🔴 Montado: escrito inteiro, o sentinela existiria NESTE arquivo.
    expect(achaSecao(titulos("CONTEXT.md"), "Zz" + "Secao" + "Inexistente")).toBe(false);
  });

  it.skipIf(!TEM_A_API)("todo `.md` citado em comentário existe", () => {
    const orfaos: Record<string, string[]> = {};
    for (const [caminho, texto] of FONTES) {
      const faltando = [
        ...new Set(
          ponteiros(texto, caminho).map(([a]) => a).filter((a) => !titulos(a, repoDe(caminho)).length),
        ),
      ];
      if (faltando.length) orfaos[caminho] = faltando.sort();
    }
    expect(
      orfaos,
      "documento citado em comentário que não existe -- corrija o nome, ou " +
        "acrescente em NAO_E_ARQUIVO com o motivo escrito",
    ).toEqual({});
  });

  it.skipIf(!TEM_A_API)("toda seção citada existe no documento que a prosa aponta", () => {
    const orfaos: Record<string, string[]> = {};
    for (const [caminho, texto] of FONTES) {
      const faltando = [
        ...new Set(
          ponteiros(texto, caminho)
            .filter(([arquivo, secao]) => {
              const t = titulos(arquivo, repoDe(caminho));
              return secao !== null && t.length > 0 && !achaSecao(t, secao);
            })
            .map(([arquivo, secao]) => `${arquivo} -> ${secao}`),
        ),
      ];
      if (faltando.length) orfaos[caminho] = faltando.sort();
    }
    expect(
      orfaos,
      "seção citada que não existe mais no documento -- o texto mudou de " +
        "arquivo, ou o título mudou; aponte para onde ele foi",
    ).toEqual({});
  });
});
