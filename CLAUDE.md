# Argos — Frontend

Regras que valem em toda sessão. História e estado moram nos arquivos do
índice, no fim.

## Toda mudança de código nasce numa branch, a partir da `main`

1. `git checkout main && git pull`, daí `git checkout -b nome-da-mudanca`. O
   nome diz o que a branch faz, nunca quem a fez ou quando.
2. Commits verdes: lint e suíte passando a cada um.
3. Conferência visual **da branch**, em Chrome real, na porta 5174 do `yarn
   dev`. O merge só acontece com a tela conferida.
4. 🔴 **O merge termina com `git push origin main` -- e aqui o push É o
   deploy**: o Vercel constrói tudo o que chega na `main`. Por isso a
   conferência em produção (`scripts/verificar-deploy-em-producao.mjs`) vem
   DEPOIS do push; na API é o inverso.
   ⚠️ **Quem decide se alguém verá diferença é o BUNDLE, não o caminho do
   arquivo**: `scripts/` e `src/test/` ficam fora dele. O `git diff
   --name-only origin/main..HEAD | grep ^src/` é o primeiro filtro; comparar
   o nome do arquivo gerado pelo `yarn build` antes e depois é a resposta.
5. Mudança em fases é **uma branch por fase**, cada uma nascendo da `main`
   com a anterior já mesclada. Nunca uma branch em cima da outra.
6. ⚠️ A `main` recebe direto só documento que não altera código nem teste.

## Toda mudança nasce com o teste que a cobre

Nenhuma mudança -- componente, campo, filtro, correção -- entra sem teste que
a cubra, no mesmo commit. **Cobrir é mais que existir um teste:**

- **O par negativo**: afirme também o que NÃO deve aparecer, e depois de a
  tela ter carregado -- senão o teste passa por chegar cedo demais.
- **A mutação**: reverter a mudança e confirmar que só o teste dela falha.
- **A concordância**, quando duas telas mostram a mesma coisa: cada uma pode
  estar certa sozinha e diferente da outra.

🔴 **Cobrir não é o mesmo que passar, e aqui isso é literal**: `jsdom` e
Chrome headless já deram "passou" em tela quebrada. Interface se confere em
**Chrome com janela**, pelos `scripts/verificar-*.mjs`, medindo o resultado
computado -- cor, tamanho, posição -- e não a existência do elemento.
⚠️ Mudança que não puder ser coberta tem a lacuna escrita, nominalmente e com
o motivo. Lacuna conhecida é dívida; lacuna silenciosa é armadilha.
⚠️ O que um guarda existente já pega não precisa de teste novo.

## Todo plano (`PLANO_*.md`) nasce com quatro coisas

1. A régua de arquivos menores: nada passa de 250 linhas de código, e tipo,
   hook e helper nascem onde a seção *Onde cada arquivo mora* manda.
2. A prosa no padrão abaixo, em todo código que o plano escreve.
3. Uma fase final de documentação, com commit próprio.
4. 🔴 Uma conferência PONTA A PONTA em produção, **num grupo de teste**: cria
   o dado pela tela, percorre o fluxo inteiro, confere onde o resultado
   aparece, e apaga tudo. Não é a conferência de deploy, que só lê rótulos e
   passa verde com a base vazia.
   ⚠️ **Nunca no escritório real** -- a conta de produção é `super_admin` de
   um escritório com dado de verdade. O grupo se funda pela rota
   administrativa e se apaga por `scripts/apagar_grupo_de_conferencia.py`, no
   repositório da API.

## A lista pede só o que mostra; o detalhe do item carrega ao abrir

- A linha usa só os campos que desenha. O que só aparece ao abrir vem da rota
  do item, com o estado de carregando dentro do modal ou da página.
- ⚠️ O item da lista não preenche detalhe nem formulário de edição: quem abre
  o item pede o item.
- ⚠️ O peso se resolve na leitura, não no cache: o React Query fica com
  `staleTime: 0`.
- ⚠️ **Ordem ao tirar um campo da lista**: a API ganha a rota do item, o front
  passa a usá-la, e só então a API tira o campo. Na ordem inversa a tela lê
  `undefined`.

## Tipo de notificação novo: o front sobe ANTES da API

🔴 É a única inversão da ordem normal do projeto. Com a API primeiro, existe
um intervalo em que ela emite um tipo que o front não conhece, e a pessoa vê
uma **linha vazia no sino**. Com o front primeiro, o intervalo é inofensivo.
➡️ Os três arquivos que mudam juntos: `CONTEXT.md`, seção 3.

## O padrão de prosa

Todo bloco tem três partes, nesta ordem, e nada mais: **a primeira linha diz
o que é** (uma frase, sem "Este componente..."), **a regra e o custo**, e **o
ponteiro** ➡️ numa linha.

| marcador | significa | limite |
|---|---|---|
| 🔴 | invariante: quebrar isso é defeito em produção | no máximo UM por bloco |
| ⚠️ | armadilha: o jeito óbvio de fazer que está errado, e por quê | quantas forem |
| ➡️ | ponteiro: o teste ou a seção onde o assunto mora | uma linha |
| ✅ | sai. Status é histórico, e histórico não fica no código | -- |

Sai do código e vem para a documentação: data solta, "antes era assim", nome
de função que não existe mais, e a narrativa de como o defeito foi achado --
no código fica a regra que ele ensinou. 🔴 A única data que fica é a que
acompanha um número medido, porque número envelhece e a data diz quando
remedir. ⚠️ **Nada se perde**: a história entra no `NARRATIVA.md` ANTES de
sair do código. ➡️ `src/prosaSemDiario.test.ts` cobra a parte mecânica.

🔴 **O ponteiro para documento se escreve `ARQUIVO.md`, "Título da seção"**
-- nessa ordem, com vírgula. É a forma que `ponteirosDaProsaExistem.test.ts`
confere; escrita ao contrário ("a seção X do arquivo"), ela passa sem prova.

## Constante nunca vira string solta

🔴 Palavra que o SERVIDOR entende -- status, tipo, natureza, papel -- nasce
uma vez em `src/constants/<assunto>.ts`, e todo o resto importa de lá.
⚠️ **O TypeScript não pega o caso que importa**: chave de `Record<string,
...>`, `state` de navegação, `id` de opção de menu. E union type não aceita
variável, como o `Literal` do Pydantic -- quando as duas listas precisam
existir, andam lado a lado com a isenção escrita.
⚠️ Filtro que só existe numa tela (`STATUS_TODOS`) é opção de MENU, não
status: fica na pasta da página. Rótulo é livre; o `id` é que é contrato.
➡️ `src/constanteNuncaViraStringSolta.test.ts`.

## Onde cada arquivo mora

`src/`: `types/` (um arquivo por domínio, `index.ts` só reexporta),
`constants/`, `utils/`, `services/api/` (só as chamadas de API), `theme/`,
`hooks/`, `contexts/`, `components/`, `pages/`.

1. **Componente e página viram PASTA com `index.tsx`.** Tudo o mais --
   constante, tipo, helper, hook -- é arquivo solto. ⚠️ A exceção é
   `src/types/`, que é um pacote.
2. **Alcance decide o destino.** Serviu a mais de uma página, sobe para a
   pasta compartilhada; é de uma página só, fica na pasta dela. Componente de
   uma página só mora em `pages/Aquela/components/Nome/index.tsx`.
3. **O nome tem que fazer sentido onde o arquivo mora** -- o que subiu quase
   sempre precisa de nome novo.
4. 🔴 **Nenhum `interface` ou `type` dentro de arquivo de componente, página,
   contexto ou hook**, nem as props: vão para o `types.ts` da pasta, ou para
   `src/types/<domínio>.ts` quando outra pasta importa. ⚠️ "É privado"
   justifica ficar na PASTA, não no ARQUIVO.
5. 🔴 **Um hook por arquivo**, e só ele: função auxiliar que não é hook vai
   para arquivo próprio.
6. 🔴 **Tudo que cria contexto mora em `contexts/`**, sem exceção.

## Os guardas, e o que cada um cobra

| guarda | cobra |
|---|---|
| `src/constanteNuncaViraStringSolta.test.ts` | palavra do servidor escrita à mão duas vezes |
| `src/comentariosCitamCodigoReal.test.ts` | comentário que cita símbolo inexistente |
| `src/prosaSemDiario.test.ts` | data em comentário fora de número medido |
| `src/ponteirosDaProsaExistem.test.ts` | ➡️ que aponta para documento ou seção que não existe |
| `src/tiposDoPacote.test.ts` | `types/`: índice só reexporta, sem ciclo, e a contagem |
| `src/tiposForaDoIndex.test.ts` | tipo dentro de componente, página ou contexto |
| `src/hooksUmPorArquivo.test.ts` | um hook por arquivo, sem tipo nem auxiliar junto |
| `src/nadaDeSymlinkNoRepo.test.ts` | symlink no repositório -- um parou a publicação |
| `src/nomeDoProduto.test.ts` | o nome antigo voltando pelo `<title>` |
| `src/contagensDoReadme.test.ts` | os números do README contra a árvore |
| `src/padraoDosCamposOpcionais.test.ts` | "(opcional)" no rótulo; o asterisco já diz |
| `scripts/medirArquivos.mjs` | arquivo acima de 250 linhas de código |

## Onde está o resto

- `CONTEXT.md` -- objetivo, estado atual e as decisões já tomadas.
- `NARRATIVA.md` -- a história datada: como cada decisão foi descoberta.
- `README.md` -- como rodar, as telas, os roteiros de conferência.
- `PLANO_*.md` -- o trabalho em curso e o já entregue.
- `../api/CLAUDE.md` -- o mesmo, do outro lado.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
