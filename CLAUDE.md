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

1. A régua de arquivos menores aplicada fase a fase -- ela vale sempre, e o
   plano só a reafirma: ver *Onde cada arquivo mora*.
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

## Tipo de notificação novo: os DOIS lados, e o compilador cobra

Três arquivos mudam juntos: `api/src/domain/entities/notificacao.py` (a
constante `NOTIFICACAO_*`/`ALVO_*`), `front/src/constants/notificacoes.ts`
(a constante e a entrada em `TIPOS_DE_NOTIFICACAO`/`ALVOS_DE_NOTIFICACAO`) e
`front/src/utils/notificacao.ts` (o `case` no `switch`).

🔴 **O front sobe ANTES da API aqui** -- é a única inversão da ordem normal
do projeto. Com a API primeiro, existe um intervalo em que ela emite um tipo
que o front não conhece, e a pessoa vê uma **linha vazia no sino**. Com o
front primeiro, o intervalo é inofensivo.

🔴 **`Notificacao.tipo` e `alvo_tipo` são uniões FECHADAS, não `string`**: o
`default` dos dois `switch` atribui a `const naoTratado: never`, então um
tipo novo não tratado **não compila**. Com `string`, o caso novo cairia no
`default` e viraria a mesma linha vazia, sem o compilador dizer palavra.

🔴 **Do lado da API há um guarda que lê ESTE repositório**:
`tests/test_tipos_de_notificacao_batem_com_o_front.py` compara as duas
listas e falha dizendo o que falta onde. ⚠️ Ele pula quando o front não está
ao lado.

## O padrão de prosa

| forma | onde | é o quê |
|---|---|---|
| `/** ... */` no `export default function` ou no primeiro export | todo arquivo | docstring de módulo -- a primeira linha diz o que o arquivo é |
| `/** ... */` numa função, hook, tipo ou constante exportada | quando ela pede | docstring da definição |
| `/* ... */` antes de uma instrução, ou `//` na linha | dentro do corpo | comentário de decisão local |
| `{/* ... */}` no JSX | entre elementos | idem, na árvore |

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

⚠️ **Tamanho é sinal, não lei.** Docstring de módulo acima de vinte linhas, ou
de definição acima de dez, quase sempre carrega diário ou repetição. Não vira
guarda mecânico -- vira pergunta na revisão: *"o que aqui é regra, e o que é
história?"*.

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
🔴 **Só palavra DISTINTIVA entra no guarda.** "todos", "eu", "nome" são
comuns demais para varrer por valor -- o guarda viraria ruído, e ruído vira
teste silenciado. Uma constante assim se cobre pelo tipo (union), não pela
varredura.

## 🔴 A paleta é contrato com o e-mail da API

Trocar uma cor em `theme/tokens.ts` obriga a alinhar o e-mail de notificação.
O e-mail vive na API (`api/src/shared/email_template.py`) e **copia** esta
paleta -- cliente de e-mail não entende variável CSS, então o que sobrevive é
o VALOR, escrito inline. ⚠️ **Duas fontes derivam, e esta derivaria CALADA**:
ninguém abre o e-mail de teste ao mexer numa cor da tela.
➡️ `api/tests/test_cores_do_email_batem_com_o_front.py` lê `tokens.ts` deste
repositório e deixa a suíte da API vermelha quando os dois divergem.
⚠️ Ele PULA quando os dois repositórios não estão lado a lado.

## Duas armadilhas gerais, fora de qualquer tela específica

⚠️ **Prefixo de `queryKey` é contrato**: `setQueriesData`/`getQueriesData`
por prefixo alcançam TODA consulta que começa com ele, mesmo as que guardam
formato diferente (array vs. objeto). Um `.map` dentro do `onMutate` lançando
faz o React Query nunca chamar o `mutationFn` -- o PATCH não sai e nada
avisa. Restrinja com `predicate` ao formato esperado.

⚠️ **Leitura de `localStorage` no render é memoizada pelo React Compiler**
(ligado em `vite.config.ts`) por todo o *mount* de um componente que não
desmonta ao navegar -- valor lido uma vez fica "congelado" na tela. Estado
que muda em runtime vive em contexto (`useSessaoContexto()`, alimentado por
`useSessao.ts`, é o molde); `localStorage` continua sendo só a persistência.

## A API mora no API Gateway, com o estágio no caminho

🔴 **O endereço da API termina em `/prod`** (`VITE_API_URL`, e
`scripts/apiDeProducao.mjs` para os roteiros). Nunca achar a base cortando a
URL no terceiro `/` -- o estágio vai junto e toda chamada vira 403 do Gateway.
⚠️ **Endereço novo exige o `connect-src` do `vercel.json`**: esquecido, o
Chrome bloqueia tudo com "falha de rede" e o `curl` funciona.
⚠️ **Na Vercel, `VITE_*` é Config, nunca Secret**: o valor vai para o
navegador de qualquer jeito, a Vercel recusa a combinação ao editar, e Secret
não converte -- apaga e recria. Mudar a variável só vale no próximo build: não
disparar redeploy antes de o código que a acompanha estar na `main`.

## Onde cada arquivo mora

`src/`: `types/` (um arquivo por domínio, `index.ts` só reexporta),
`constants/`, `utils/`, `services/api/` (só as chamadas de API), `theme/`,
`hooks/`, `contexts/`, `components/`, `pages/`.

🔴 **Arquivo novo ou TOCADO não passa de 250 linhas de código** -- sem prosa e
sem linhas vazias, e vale com plano ou sem plano. O que transborda se divide
pelas regras abaixo.
⚠️ **Sem guarda que reprove**, ao contrário dos itens 4 e 5 abaixo.
`scripts/medirArquivos.mjs` RELATA a contagem; nenhum teste fica vermelho por
um arquivo grande, e há arquivos acima da régua hoje. Rodá-lo depois de mexer
é o que faz a régua existir.

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
| `src/test/cspLiberaAApi.test.ts` | o `connect-src` sem o endereço da API de produção, ou com a Function URL de volta |

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
