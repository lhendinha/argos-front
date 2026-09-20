import { describe, expect, it } from "vitest";

/** 🔴 Quem usa o item de lista escolhe o QUE, nunca o COMO.
 *
 * O `ItemDeLista` aceitava `children` livres, e o resultado foi medido em
 * 360px: três recuos horizontais (10, 14 e 18), dois tamanhos de
 * identificador (14 e 13.5), dois pesos (700 e 800) e uma lista que começava
 * pela data em vez do nome. Nada disso era proibido -- por isso aconteceu.
 *
 * ⚠️ **Guarda de FORMA**, no molde de `celulaDeTabela.test.ts`: o que ele
 * checa é o texto do código, porque o efeito é de CSS e o jsdom não calcula
 * estilo. A tipagem já barra o grosso (`identificador` é `string`, não
 * `ReactNode`); o que sobra são os compartimentos que aceitam nós --
 * `etiquetas`, `selecao`, `acoes`, o destaque do rodapé --, e é por dentro
 * deles que a medida voltaria a entrar.
 *
 * ⚠️ **A tabela tem guarda desde que o defeito reapareceu; o item não tinha
 * nenhum.** É a diferença que explica por que sete tabelas seguem a mesma
 * medida há meses e quatro itens divergiram em uma fase.
 *
 * ⚠️ Lê os arquivos por `import.meta.glob` do Vite, e não por `node:fs`: o
 * `tsconfig` do front não carrega os tipos do Node, e um teste que não passa
 * no `tsc` quebra a checagem de tipos do projeto inteiro.
 */

/** Os fontes de componente, crus. `eager` porque o teste é síncrono. */
const FONTES = import.meta.glob("/src/**/*.tsx", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/** As medidas que pertencem ao `ItemDeLista` e a mais ninguém.
 *
 * ⚠️ `mt=`/`mb=` entram porque o espaçamento ENTRE compartimentos é o que
 * dava a cada lista um ritmo próprio -- 3px numa, 8 noutra, 9 na terceira.
 *
 * 🔴 **Casam com FRONTEIRA, e não como pedaço de palavra.** A primeira versão
 * procurava `"p="` cru e acusava `gap="10px"` -- e acusaria `top=` e
 * `flexGrow=` também. Guarda que grita no lugar errado ensina a ignorá-lo,
 * que é pior do que não existir. */
const PROIBIDOS = [
  "fontSize=",
  "fontWeight=",
  "lineHeight=",
  "fontFamily=",
  "borderTop",
  "borderBottom",
  "mt=",
  "mb=",
  "p=",
  "px=",
  "py=",
];

/** O próprio componente é onde a medida MORA -- ele não pode se cobrar.
 * Os `.test.tsx` ficam de fora: teste que monta um item à mão para verificar
 * outra coisa não precisa carregar a regra junto. */
const usamOItem = Object.entries(FONTES).filter(
  ([caminho, codigo]) =>
    caminho !== "/src/components/ItemDeLista/index.tsx" &&
    !caminho.endsWith(".test.tsx") &&
    /from ["'][^"']*ItemDeLista["']|[{,]\s*ItemDeLista\s*[,}]/.test(codigo),
);

describe("as medidas do item de lista", () => {
  it("varre a árvore de verdade -- senão o guarda passaria vazio", () => {
    /* 🔴 O par que impede o falso "passou": um padrão de glob errado
       devolveria zero arquivo e a asserção abaixo não rodaria. */
    expect(Object.keys(FONTES).length).toBeGreaterThan(50);
    expect(usamOItem.length).toBeGreaterThan(2);
  });

  it("não deixa quem usa o item escrever tipografia nem recuo", () => {
    const faltas: string[] = [];
    for (const [caminho, codigo] of usamOItem) {
      for (const proibido of PROIBIDOS) {
        /* A propriedade começa depois de espaço, chave ou início de linha --
           nunca no meio de outro nome. */
        if (new RegExp(`(^|[^A-Za-z])${proibido}`).test(codigo)) {
          faltas.push(`${caminho}: ${proibido}`);
        }
      }
    }
    expect(faltas).toEqual([]);
  });
});
