# Contexto do projeto — Argos (Frontend)

> Objetivo, estado atual e decisões tomadas. As regras que valem em toda
> sessão estão no `CLAUDE.md` -- é ele que chega sozinho a cada sessão. A
> história datada, em `NARRATIVA.md`. O equivalente do backend está em
> `../api/CONTEXT.md`.

## 1) Objetivo do projeto

Front-end React + TypeScript pra um sistema que monitora processos
judiciais brasileiros via API do PJe, organizados em **Grupos → Subgrupos →
Processos**, com controle de acesso por papéis, convites por e-mail, e
notificação automática de movimentação processual. Consome uma API AWS já
em produção (Lambda + DynamoDB + SES).

## 2) Estado atual

Front reescrito em TypeScript, estrutura em camadas (`pages/`, `services/`,
`utils/`, `components/`, `constants/`), usando **Yarn** (não npm), deployado
no **Vercel** em `argos-monitor.vercel.app`.

⚠️ O domínio MUDOU. Os dois `CONTEXT.md` diziam `pie-monitor-front.vercel.app`,
que hoje devolve `DEPLOYMENT_NOT_FOUND` -- descoberto ao tentar conferir uma
publicação. O repositório no GitHub continua sendo `pie-monitor-front`; o
alias do Vercel é que passou a ser `argos-monitor`, junto com a renomeação do
produto pra Argos. Conferir publicação por um endereço morto dá "não subiu"
pra um deploy que subiu. React Compiler configurado
e testado. Build (`yarn build`) passa limpo com type-check completo. Suite
de testes com `vitest` + `@testing-library/react` (`yarn test`): 59 arquivos,
605 testes, cobrindo `pages/` (27 arquivos), `components/` (11), `utils/`
(9), `services/` (7) e `hooks/` (3). O `yarn lint` roda ESLint com
`react-hooks` e passa sem erros.

⚠️ Este parágrafo dizia que a suíte cobria "`services/` e `utils/`" -- ficou
para trás de duas auditorias que encheram `pages/` e `components/` de
testes. `vercel.json` também define security headers (CSP,
HSTS, etc.) pra todo o app. Fluxo de recuperação de senha
(`EsqueciSenhaPage`/`RedefinirSenhaPage`), edição de apelido de processo, e
o link do e-mail de notificação abrindo direto na aba Histórico (deep link
via `?processo=&comunicacao=`) já implementados -- ver seção 3.

## 3) Decisões importantes já tomadas

### Tipo de notificação novo: os DOIS lados, e o compilador cobra (27/08/2026)

Ao acrescentar um tipo de notificação ou um alvo, **três arquivos mudam
juntos** -- e o build quebra se algum ficar para trás:

1. `api/src/domain/entities/notificacao.py` -- a constante `NOTIFICACAO_*` / `ALVO_*`;
2. `front/src/constants/notificacoes.ts` -- a constante `TIPO_*` / `ALVO_*`
   **e** a entrada em `TIPOS_DE_NOTIFICACAO` / `ALVOS_DE_NOTIFICACAO`;
3. `front/src/utils/notificacao.ts` -- o `case` no `switch`.

🔴 **E é por isso que o FRONT sobe antes da API neste caso** — invertendo a
régua normal do projeto. Com a API primeiro, existe um intervalo em que ela
emite um tipo que o front não conhece, e a pessoa vê uma linha sem frase no
sino. Com o front primeiro, o intervalo é inofensivo: o tipo simplesmente não
chega ainda. Foi o que se fez com `processos_importados` em 30/08/2026.

🔴 **`Notificacao.tipo` e `alvo_tipo` são uniões FECHADAS, não `string`.** O
`default` dos dois `switch` atribui a `const naoTratado: never`, então um
tipo declarado e não tratado **não compila**. Antes disso, `tipo` era
`string`: o caso novo caía no `default` e virava uma **linha vazia no sino**,
sem o compilador dizer palavra.

⚠️ **E não é `enum` do TypeScript, de propósito.** `enum` gera código em
runtime (entra no bundle), `const enum` não funciona com `isolatedModules`
-- que o Vite exige -- e o valor chega da API como string de JSON: com união
de literais a string JÁ é o tipo; com `enum` seria preciso converter e
validar na fronteira para o mesmo resultado. O padrão aqui é
`[...] as const` + `(typeof X)[number]`, o mesmo de `PRIORIDADES` e
`STATUS_DE_ATENDIMENTO`.

⚠️ **`alvo_tipo` é `AlvoDeNotificacao | ""`**, e o `""` não é sobra: a API
tem `alvo_tipo: str = ""` como default, então aviso sem destino chega com
string vazia. Fechar só nos quatro faria o tipo mentir -- e
`destinoDaNotificacao` precisa distinguir "não tem alvo" de "alvo que não
conheço".

⚠️ **O cast no teste de degradação é deliberado.** `notificacao.test.ts` usa
`as Notificacao["tipo"]` para simular um valor que o front ainda não conhece
-- e isso não é hipótese: a ordem de deploy é **API primeiro**, então
acontece a cada entrega. Sem o cast o teste não compilaria, e a tentação
seria apagá-lo, jogando fora a prova de que a degradação é graciosa.

🔴 **Do lado da API há um guarda que lê ESTE repositório**:
`tests/test_tipos_de_notificacao_batem_com_o_front.py` compara as duas listas
e falha dizendo o que falta onde. Ele pula quando o front não está ao lado --
e um quarto teste falha alto nesse caso, para o `skip` não sumir do relatório
e deixar a suíte verde sem ter conferido nada.

### A API agora roda local, fora da AWS (25/08/2026)

Na pasta `api`, `yarn offline` sobe o sistema inteiro na máquina: DynamoDB
Local em docker, as seis lambdas com os handlers Python de verdade, o cron e
o canal WebSocket. Para apontar o front pra lá:

```bash
VITE_API_URL=http://localhost:8099 VITE_WS_URL=ws://localhost:8098 \
  yarn dev --port 5174
```

⚠️ `VITE_WS_URL` junto, e não só a API: sem ele o front abre o canal no
endereço de PRODUÇÃO a partir de uma tela local — o sino "funciona" ali
mostrando notificação de verdade, e o que se estava testando não foi
testado.

Contas semeadas, senha `Senha!Local1`: `movida@local.test` (admin no
escritório Alfa) e `chefe@local.test` (super_admin, quem move). Cada
escritório tem um cliente com nome próprio, pra dar pra VER de qual grupo é a
tela.

**A regra combinada:** todo teste passa por ali antes de qualquer deploy --
inclusive os do front, que até aqui usavam `scripts/stubsDaApi.mjs`. O stub
continua útil para telas de UI pura; ele não vale como validação pré-deploy,
porque responde o que eu escrevi que ele responde.

### O produto é Argos; `pje-monitor` fica só onde renomear quebra algo (25/08/2026)

Documentação, títulos e `package.json` (`argos-monitor-front`) usam o nome
novo. **Não foram renomeadas as chaves de `localStorage`**
(`pje-monitor-access-token` e as outras seis em `services/auth.ts`,
`pje-monitor-ultimo-subgrupo-` em `hooks/useUltimoSubgrupo.ts`): elas são o
endereço sob o qual a sessão de cada pessoa já está gravada no navegador
dela, e trocar sem migrar desloga todo mundo no primeiro carregamento depois
do deploy.

Do lado da API, pela mesma lógica, `service: pje-monitor` continua no
`serverless.yml` -- é dele que saem os nomes das tabelas, da pilha e das
funções na AWS.

O repositório no GitHub ainda se chama `pie-monitor-front` (com "pie", erro
de digitação antigo); o domínio é `argos-monitor.vercel.app`.

### Por que Vercel, não AWS

A conta AWS do projeto foi criada após a mudança de política de julho/2025:
sem free tier permanente pra S3/CloudFront (só $200 de créditos por 6
meses, diferente de Lambda/DynamoDB que são "Always Free" de verdade). Pra
garantir $0 garantido, o front roda no Vercel (free tier permanente, deploy
automático a cada push).

### Modelo de domínio (espelha o backend)

- Grupo (1) → Subgrupo (N) → Processo (N, único por subgrupo).
- Usuário pertence a 1 grupo, sem exceção -- inclusive `super_admin` -- e
  a N subgrupos.
- Papéis: `user < manager < admin < super_admin`.
- `super_admin` age no próprio grupo como um `admin` -- não tem campo
  "Grupo alvo" na UI (removido de `App.tsx`). As diferenças ficam só nas
  4 rotas/grupos de rota cross-tenant do backend (ver `CONTEXT.md` do
  backend, seção "Modelo de domínio").
- `Cliente` é por grupo, associado a `Processo` via lista de ids embutida
  no próprio processo (`cliente_ids`), sem entidade de associação própria
  no front -- o `MultiSelect` de Cliente no form de processo resolve
  `id -> nome` a partir de `GET /clientes` cacheado.
- `Fase`/`Situação` de processo são uma lista GLOBAL da plataforma (não
  por grupo) -- toda pessoa vê as mesmas opções no dropdown do processo
  (piso `user`), só o CRUD da lista (aba "Fase/Situação") é exclusivo de
  `super_admin`.

### Estrutura de pastas (decisão explícita do usuário)

```
src/
  main.tsx              -- ponto de entrada
  App.tsx               -- SÓ os provedores (Toast, Sessão, Router)
  routes/index.tsx      -- o mapa de rotas
  routes/Rota*.tsx      -- rotas que precisam de casca própria (Login, Tarefa, Raiz…)

  types/                -- TODO tipo de alcance global (index.ts + respostas.ts)
  constants/            -- arquivos soltos + index.ts que reexporta (ambiente.ts,
                           roles.ts, paginacao.ts, periodos.ts, select.ts…)
  utils/                -- arquivos soltos + index.ts (mask, date, deepLink, calendario…)
  services/             -- auth.ts + api/ (client.ts e um arquivo por área) + index.ts
  theme/                -- tokens e paletas de design
  hooks/                -- hooks compartilhados por mais de uma página
  contexts/             -- SessaoContext, DescarteContext, ToastContext
  components/           -- 53 componentes gerais, cada um em pasta com index.tsx
  pages/                -- 19 páginas, cada uma em pasta com index.tsx
  test/setup.ts
```

**As quatro regras que decidem onde um arquivo mora:**

1. **Componente e página viram PASTA com `index.tsx`.** Tudo o mais --
   constante, tipo, helper, hook -- é arquivo solto, nunca pasta com índice.
   ⚠️ A única exceção é `src/types/` (05/09/2026): é um PACOTE, um arquivo
   por domínio (`processo.ts`, `grupo.ts`, `sessao.ts`...) e um `index.ts`
   que só reexporta (`export type * from`). Quem importa continua
   escrevendo `from "../types"`; quem declara escolhe o arquivo pelo
   domínio. É o mesmo desenho e a mesma razão de `domain/entities/` na
   API. Guardado por `tiposDoPacote.test.ts`: só reexport no índice, sem
   ciclo entre os arquivos, e o total de tipos afirmado por contagem.
2. **Alcance decide o destino.** Serviu a mais de uma página? Sobe pra
   `types/`, `constants/`, `utils/` ou `hooks/`. É de uma página só? Fica na
   pasta dela, como `constants.ts`, `types.ts` e helpers soltos ao lado do
   `index.tsx`.
3. **Componente usado por uma página só** mora em `pages/AquelaPagina/
   components/NomeDele/index.tsx`, e não entra no índice público.
4. **O nome tem que fazer sentido onde o arquivo mora.** Tipo que sobe pra
   `types/` costuma precisar de nome novo -- ver a seção abaixo.
5. 🔴 **Nenhum `interface` ou `type` dentro de arquivo de componente, página
   ou contexto** (05/09/2026; até então as props podiam ficar). Tudo vai para
   o `types.ts` da própria pasta -- `components/Abas/types.ts`,
   `pages/AceitarConvitePage/types.ts`, e `contexts/types.ts` para os
   provedores, que são arquivos soltos -- ou para `src/types/<domínio>.ts`
   quando outra pasta importa. A interface de props continua se chamando
   NomeDoComponenteProps: é o nome que ainda faz sentido fora do arquivo.
   ⚠️ O custo, assumido: ler a assinatura de um componente abre dois
   arquivos. O ganho é uma regra só, sem exceção, para hook, componente,
   página e contexto -- e um guarda que não precisa de lista de permitidos.
   ⚠️ **"É privado" justifica ficar na PASTA, não no ARQUIVO.** Foi o erro que
   uma varredura minha cometeu em 03/09/2026: achei cinco tipos dentro de
   `index.tsx`, conferi que nenhum era exportado e concluí que estavam
   certos. Não estavam.
   ⚠️ Guardado por `tiposForaDoIndex.test.ts`.
6. 🔴 **Tudo que cria contexto mora em `contexts/`** (03/09/2026), sem
   exceção -- ver *"Por que o Toast virou contexto"*.
7. 🔴 **Arquivo de hook não declara `interface` nem `type`** (05/09/2026).
   O tipo vai para o `types.ts` da pasta -- da página ou do componente -- ou
   para `src/types/<domínio>.ts` quando o uso é geral. E ao mover, **o nome
   tem que fazer sentido fora do arquivo**: Janela virou
   `JanelaDeDatasDoQuadro`, BuscaDoPainel virou `EstadoDaBuscaDoPainel`,
   UseCepOpcoes virou `OpcoesDaConsultaDeCep`. As opções de um hook de
   formulário (`OpcoesDoFormularioDeTarefa`) nascem no `types.ts` ao lado.
8. 🔴 **Um hook por arquivo** (05/09/2026), e só ele: função auxiliar que não
   é hook vai para arquivo próprio (`impedimentosDoSubgrupo.ts` ao lado de
   `podeExcluirSubgrupo.ts`; `comOpcaoEscolhida` em `utils/opcoesEscolhidas.ts`).
   O antigo useCatalogos virou três arquivos, e o antigo useOpcoesBuscaveis
   virou quatro hooks e dois utils. ⚠️ Guardado por `hooksUmPorArquivo.test.ts`, que
   cobre as duas regras.

### Toda lista que pode crescer sem limite carrega a primeira página (25/08/2026)

A regra que passou a valer no sistema inteiro, em duas frases:

> **Toda lista que pode crescer sem limite carrega a primeira página e se
> completa por busca. E todo dado que precisa de rótulo traz o rótulo
> consigo.**

Com um corolário que vale pra qualquer painel:

> **Nenhum painel mostra lista vazia sem dizer por quê.**

Lista vazia significa três coisas -- "ainda não chegou", "não deu pra saber"
e "não existe nenhuma" -- e quem lê precisa distinguir. Os seis filtros em
pílula têm os três estados: `Carregando…` na primeira abertura, a lista
anterior esmaecida com a faixa `Buscando…` durante uma busca, e a falha com
"Tentar de novo" DENTRO do painel.

**O que mudou de lugar**

| tela | antes | agora |
| --- | --- | --- |
| Processos, chip de cliente | catálogo inteiro na montagem | 1ª página ao ABRIR a pílula |
| Processos, campo de cliente do formulário | catálogo inteiro | `CampoDeClientes`, 1ª página ao focar |
| Processos, coluna "Cliente" | catálogo inteiro | `cliente_nomes`, na resposta |
| Kanban, pílula de subgrupo | catálogo inteiro | 1ª página na montagem (é ela que escolhe o quadro padrão) |
| Kanban, pílula de pessoas | todos os membros do grupo | 1ª página ao ABRIR |
| Kanban, responsável no cartão | todos os membros do grupo | `responsavel_nome`, na tarefa |
| Agenda, pílula de subgrupos | catálogo inteiro | 1ª página na montagem |
| Agenda, pílula de pessoas | todos os membros do grupo | 1ª página ao ABRIR |
| Membros, coluna "Subgrupos" | catálogo inteiro | `subgrupo_nomes`, na pessoa |
| Convidar / Novo atendimento / Modal de tarefa | catálogo inteiro | 1ª página + digitação |

`PRIMEIRA_PAGINA_DE_OPCOES = 50`, igual ao teto do servidor
(`MAXIMO_DE_RESULTADOS_DE_BUSCA`). Pedir mais daria lista cortada sem aviso;
pedir menos deixaria de fora resultado que o servidor já mandou.

**Onde a caixa de digitar fica, e por quê**

Na PÍLULA ela vai no topo do painel (`CampoDeBuscaDoPainel`). O controle da
pílula É o rótulo ("3 selecionados"), com largura de rótulo e caixa alta:
digitar ali apagaria o texto e a faria pular de tamanho a cada letra. Só é
possível porque o painel do chip é controlado (`menuIsOpen`) -- com o menu da
lib, tirar o foco do controle o fecharia.

No campo de FORMULÁRIO é o `isSearchable` da própria lib, que é onde se
espera digitar. Nos dois casos o filtro é nosso (`contemTermo`), e não o da
lib: o dela compara texto cru, então "angela" não acharia "Ângela" -- e quem
digita sem acento concluiria que o cliente não está cadastrado.

**🔴 O delay ao digitar voltou, e só a medição pegou**

Já tinha acontecido no protótipo. Voltou no componente de verdade, pela mesma
causa: o react-select desenha uma linha de DOM por opção, sem virtualização.
Medido em Chrome, com 5.000 itens por trás de cada lista:

```
pílula de cliente (o servidor corta em 50)    22ms por tecla
pílula de situação, filtro local SEM teto    170ms por tecla
pílula de situação, COM teto de 50            22ms por tecla
```

E 22ms continua com 20.000 -- o custo era o DOM, não o filtro. O teto local é
o mesmo 50, e **o corte é DITO**: o painel mostra "+N não exibidos — digite
mais pra refinar". Lista truncada em silêncio se lê como lista inteira, e
quem procura o que ficou de fora conclui que não existe.

`scripts/medir-digitacao.mjs` guarda a medição. Ele existe porque o defeito
voltou duas vezes e nas duas só apareceu medindo -- lendo o código, não.

**O X, e o fim das setas**

Toda pílula tem um × (`IconeX`) que limpa sem precisar abrir o painel,
inclusive as de escolha única: cheguei a defender que ali seria redundante
por causa da linha "Todas as X", mas é o mesmo argumento que eu tinha usado
A FAVOR dele no múltiplo -- ele derruba os dois casos ou nenhum.

E nenhuma pílula tem seta. Ela existia só nas desenhadas à mão
(`PilulaDeFiltro`) e não nas do react-select, que são a maioria: metade do
conjunto anunciava "abre um painel" e a outra metade abria o mesmo painel
calada. Havia um `semSeta` pra desligá-la caso a caso; um enfeite que precisa
de exceção em cada uso é enfeite errado. A prop foi removida.

⚠️ O `IconeX` é SVG, não o caractere `✕`. Caractere não é ícone: a espessura
do traço vem do peso da fonte, então dentro da pílula (700, caixa alta) ele
saía visivelmente mais gordo que o resto do conjunto -- e o desenho muda
entre plataformas.

**O quadro padrão do Kanban era uma afirmação falsa em três partes**

Era `subgrupos[subgrupos.length - 1]`, com o comentário *"o último da lista,
que é o mais recente, que é o que costuma estar em uso"*. Nenhuma das três
valia: a listagem passou a vir em ordem ALFABÉTICA (então o último é o último
do alfabeto); mesmo na ordem antiga, "mais recente" não é "mais usado"; e
quem trabalha sempre no mesmo subgrupo trocava a pílula toda vez que entrava
na tela.

Agora a ordem é: o que a pessoa escolheu nesta sessão → o do link do lembrete
→ **o último que ela usou** (`useUltimoSubgrupo`, em `localStorage`, com o
NOME junto do id) → o primeiro da primeira página. O link do lembrete VENCE a
memória: a memória é um palpite, o link é uma instrução.

**Três armadilhas que a verificação em Chrome pegou**

1. *A falha não aparecia.* Com `keepPreviousData` a lista anterior continua
   na tela, o painel nunca fica vazio, e a mensagem de erro -- que entrava
   pelo `noOptionsMessage` -- não tinha lugar. Pior: aquela lista velha era
   apresentada como resposta à busca nova.
2. *Consertar isso quebrou outra coisa.* Esvaziar TODAS as opções na falha
   levava junto as que não vieram do servidor: no filtro de pessoas, "Sem
   responsável" sumia porque a lista de gente falhou. Hoje o aviso CONVIVE
   com o que sobrou; só o resultado remoto é descartado.
3. *O erro demora ~7s.* O `QueryClient` repete erro transitório 3x com espera
   crescente. Uma verificação que esperava 2,5s dava "não mostrou" pra um
   painel que mostra.

**⚠️ O rótulo do escolhido não pode depender da lista carregada**

`comOpcaoEscolhida` / `comOpcoesEscolhidas` reinjetam a opção escolhida
quando ela não está na página atual. No múltiplo o estrago é maior que um
rótulo feio: o `MultiSelect` monta o `value` filtrando as opções pelos ids, e
um id ausente SOME do valor -- a pílula cai de "3 selecionados" pra "1" sem
ninguém ter desmarcado nada. É por isso que o NOME é guardado junto do id no
estado (`FiltrosProcessos.clienteNome`, `FiltrosDaAgenda.subgrupoNomes`).

⚠️ E o nome fica **fora** do objeto que vira `queryKey` e query string: é
rótulo de tela, não critério de busca. Dentro, a mesma consulta viraria duas
entradas de cache e `temFiltroAtivo` contaria um filtro que não filtra nada.

### Trocar de grupo derruba o cache -- e `clear()` era a escolha errada (25/08/2026)

O servidor passou a recusar token que discorda do banco (ver o `CONTEXT.md` da
API). O front já sabia lidar com 401: renova sozinho e repete. Faltava uma
coisa: **o React Query continua com os dados do grupo ANTIGO em cache**, e uma
tela já montada seguiria mostrando o outro escritório até algo forçar refetch.

O detector mora em `salvarTokens`, que compara o `grupo_id` do token novo com o
guardado -- assim vale pros DOIS caminhos: o aviso que chega pelo canal e o
401 -> refresh, que acontece mesmo com o WebSocket fechado.

🔴 **A reação certa foi MEDIDA, e a "óbvia" era a pior.** Amostrando a tela a
cada 200ms depois de uma troca de grupo, em Chrome (A = dado do escritório
antigo, N = do novo):

```
clear()               AAAAAAAAAAAAAAAAAAAAAAAAA
invalidateQueries()   AAAAAAAAAAAANNNNNNNNNNNNN
resetQueries()        .............NNNNNNNNNNNN
```

`clear()` REMOVE a consulta que está em voo: a resposta que chega é
descartada e a tela nunca se corrige -- fica com o dado do outro inquilino, ou
vazia. Eu tinha escolhido essa, com uma justificativa que soava boa ("invalidar
deixa o dado antigo na tela, e ele não pode ficar nem um instante").
`invalidateQueries()` refetcha mas mostra o dado alheio até a resposta chegar,
ou seja, o mesmo que não fazer nada. Só `resetQueries()` descarta E refaz.

⚠️ **Dois testes meus não provavam nada antes de eu rodar o controle:** o
primeiro navegava com `page.goto`, que recarrega a página e destrói o cache de
qualquer jeito; o segundo devolvia o MESMO cliente para os dois grupos, então
"o dado reapareceu" não distinguia cache mantido de cache refeito. Sem o
controle, eu teria subido o `clear()` achando que estava verificado.

⚠️ O `authBridge` ganhou uma vaga SEPARADA (`setGrupoTrocadoListener`). Ele tem
um slot só, e reusá-lo atropelaria a transição de sessão expirada. Quem
registra é `queryClient.ts`, dono do cache: `auth.ts` não pode importar o
queryClient, que já importa `auth` pra `estaAutenticado`.

**Verificação de ponta a ponta, local:** `scripts/verificar-sessao.mjs` contra
a API real (`api/scripts/api_local.py`). Login real, a pessoa é movida por
fora da tela, e ela só NAVEGA:

| | grupo no navegador | escritório antigo | escritório novo |
|---|---|---|---|
| sem a verificação | `g-alfa` | **aparece** | não |
| com a verificação | `g-beta` | não | aparece |

### A importação por OAB em segundo plano: o canal traz, o `GET` confirma (23/09/2026)

Desde as Fases 3b e 4 do `PLANO_BALDE_DO_PJE.md` da API, a busca e a gravação
respondem **202 com um id**, e o resto vem pelo canal WebSocket:

| etapa | pelo canal | relido por |
|---|---|---|
| busca | `importacao_busca` (as linhas atualizadas) e `importacao_busca_fim` | `lerBusca` |
| gravação | `importacao_progresso` (a barra) e `importacao_fim` | `lerGravacao` |

- 🔴 **O `GET` é a fonte, e o canal é aviso.** O fim só dispara a releitura, e enquanto
  o trabalho anda a tela relê a cada `INTERVALO_DE_RELEITURA_DO_TRABALHO_MS` -- o canal pode
  ter caído (aba sem conexão), e o fim chegaria só por ele.
- 🔴 **A tela SUBSTITUI a linha pelo número** (`fundirPagina`), nunca acrescenta: a
  paginação do PJe é por comunicação, e o mesmo processo volta em várias páginas.
- ⚠️ **Mensagem de outro trabalho é descartada** (o id que a tela espera mora num `ref`):
  sem isso, a busca abandonada misturaria a lista da OAB errada.
- ⚠️ **A busca em andamento é guardada na sessão** (`utils/buscaGuardada`): a tela
  reaberta ou recarregada volta ao resultado. Conveniência -- sem armazenamento, só não
  volta sozinha.
- ⚠️ **O front subiu ANTES da API nas duas fases** e aceita as duas respostas (a antiga,
  com a lista ou os números; a nova, com o id). Na ordem inversa a tela leria campos que
  não vêm.
- Conferência: `scripts/verificar-busca-pelo-canal.mjs` e
  `scripts/verificar-gravacao-pelo-canal.mjs` contra o offline;
  `scripts/verificar-importacao-ponta-a-ponta.mjs` em produção, num grupo de teste.

### Yarn, não npm

`package-lock.json` removido, `yarn.lock` gerado. Existe um `.yarnrc` no
projeto fixando `registry "https://registry.npmjs.org"` — o registro padrão
do Yarn deu instabilidade momentânea, isso resolve.

### React Compiler com React 18

O projeto usa React 18, não 19 — mas o React Compiler funciona mesmo assim
(saiu de beta em out/2025, suporte oficial a partir do React 17). Configurado
em `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler", { target: "18" }]],
      },
    }),
  ],
});
```

**Versões corretas no `package.json`** (⚠️ cuidado, é fácil errar):
`babel-plugin-react-compiler@^1.0.0` e `react-compiler-runtime@^1.0.0` —
**NÃO** `^19.1.0` (essa era só a versão RC/beta antiga; a numeração mudou
pra `1.0.0` quando o pacote saiu do beta).

### Design visual

Paleta "papel/tinta/vinho/latão": ink navy `#1b2a4a`, paper ivory `#f7f4ec`,
oxblood `#7a2e2e`. Fontes: Source Serif 4 (display) + IBM Plex Mono (números
de processo, labels) + Inter (corpo). Estética de "diário/docket" jurídico.

### Decisões de UX específicas

- Cadastro de processo é um **modal** (botão "+ Novo Processo" abre), não
  formulário inline. **Edição não é mais modal**: clicar na linha inteira
  NAVEGA para `/processos/{subgrupo}/{numero}` (`ProcessoDetalhePage`), e a
  edição acontece lá, em `FormularioProcesso`. Não há ícone ✎ dedicado --
  esse botão foi descontinuado, e apelido virou só mais um campo junto com
  Cliente/Objeto-Assunto/datas/Observações/Fase/Situação, todos editados
  juntos. Os ícones que sobram na linha chamam `event.stopPropagation()` no
  próprio `onClick`, senão o clique neles abriria o detalhe junto.
  ⚠️ Até 28/08/2026 este bullet dizia "outro modal
  (`DetalheEditarProcesso.tsx`)". O componente não existe desde que o
  detalhe virou página, e o mesmo vale para Cliente e Atendimento: os três seguem
  uma página de detalhe com um formulário dentro -- `ProcessoDetalhePage` +
  `FormularioProcesso`, `ClienteDetalhePage` + `FormularioCliente`,
  `AtendimentoDetalhePage`.
  `EditarMembroForm` (`MembrosPage`) segue o padrão de modal por ícone
  ✎ ainda, mas visível só pra `super_admin` na lista "Pessoas do grupo".
- Campos opcionais compartilhados entre cadastro e edição de processo
  (Cliente, Objeto/Assunto, Próxima providência, datas, Observações, Fase,
  Situação) ficam num componente único, `CamposProcesso`, controlado
  por props e reaproveitado nos dois formulários -- inclusive é quem chama
  `GET /clientes`/`/fases`/`/situacoes` (cache do React Query evita
  refetch duplicado mesmo montando 2x). Dropdown de Fase/Situação mostra só
  opções `ativo === true` como escolha nova, mas preserva o valor já
  selecionado mesmo que ele aponte pra uma opção desativada depois.
- `type="date"` nativo do browser pros campos "Data para verificar"/"Prazo
  final" -- não existia campo de data no app antes disso, sem lib nova.
- Máscara de CPF/CNPJ (`mascararCpfCnpj`, alterna formato pela contagem de
  dígitos) e telefone (`mascararTelefone`) em `utils/mask.ts`, mesmo padrão
  de `mascararNumeroProcesso` já existente -- usadas no form de Cliente.
- Todo select do sistema (valor único ou múltiplo) passa por um wrapper
  único em `components/Select`, em cima do `react-select` (`unstyled` +
  `classNames`) pra manter a mesma aparência do `<input>` de texto --
  `<select>` nativo e o `MultiSelect` custom antigo tinham divergido
  visualmente um do outro. Aba Convidar/EditarMembroForm usam `MultiSelect`
  (dropdown fechado com checkboxes) pra escolher subgrupos -- **não** mais
  o `<select multiple>` nativo, cujo listbox sempre aberto destoava do
  resto do form.
- Feedback de ação pontual (erro, sucesso) usa **toast** (`components/Toast`,
  `useToast()`), não mais `<div className="banner">` -- banner ficou restrito
  a estados persistentes de tela inteira (sessão expirada, senha redefinida).
- Listas paginadas (`Processos`, `Histórico`) usam `components/Pagination`:
  números de página clicáveis direto (não só anterior/próximo), porque o
  backend pagina por intervalo de sequência real, não cursor -- dá pra pular
  pra qualquer página sem visitar as anteriores.
- Texto de comunicação processual vem em HTML da API do PJe e é renderizado
  via `dangerouslySetInnerHTML` depois de passar por `DOMPurify.sanitize()`
  -- fonte externa, nunca confiar sem sanitizar.
  ⚠️ A sanitização mora em **um** componente, `components/TextoDaComunicacao`,
  usado por `ModalDeMovimentacao` e `DetalheHistorico`. Antes de `974a98d`
  ela estava em dois (`ComunicacaoCard` e `ItemDeMovimentacao`) -- e
  duplicar sanitização é como duplicar qualquer regra: um dos lados diverge,
  e aqui o lado que diverge injeta HTML de fonte externa. Este bullet citava
  dois arquivos que não existem mais, até 28/08/2026.
- Barra de abas do topo reduzida de até 7 pra 4 (`Processos`, `Clientes`,
  `Histórico`, `Grupo`) -- `Grupo` (`GrupoPage`) agrupa Subgrupos, Membros,
  Convidar, Fases e Situações como **sub-navegação própria**
  (componente `Abas`), cada sub-aba com seu próprio piso de papel (`SubAbaConfig[]`
  filtrado por `papelAtende`, mesmo mecanismo de `ABAS_DO_GRUPO`). Fases e
  Situações são **2 sub-abas separadas** (não uma tela com as 2 listas lado
  a lado), cada uma renderizando `OpcoesLista` com um `tipo` diferente.
- `ClientesPage` cria cliente por **modal** ("+ Novo Cliente" abre
  `NovoClienteForm`), não mais formulário inline -- mesmo padrão de
  `NovoProcessoForm`. Lista usa paginação real (`components/Pagination`),
  igual Processos/Histórico.
- Paginação real foi estendida também pra **Subgrupos** e **Clientes** --
  essas 2 listas de `GrupoPage`/`ClientesPage` usam `components/Pagination`,
  mesmo mecanismo de GSI + contador de sequência de Processos/Histórico.
  Removido de um `subgrupo`/`cliente` via `removerMutation` usa
  `invalidateQueries` em vez de splice otimista no cache (`setQueryData`)
  -- splice local não é seguro com paginação real, pois um item removido
  pode deslocar itens de uma página pra outra. Membros **ainda não** tem
  paginação real (fica pra depois). Fases/Situações **não** usam
  `Pagination` (ver bullet abaixo).
- **Ordem de Fase/Situação por drag and drop**, não mais um campo numérico
  "Ordem" editável no formulário -- o rótulo é editado na própria linha
  (`LinhaDeOpcao`, prop `onRenomear`). `OpcoesLista` busca a lista inteira
  (`TETO_POR_PAGINA`, teto de 100, mesmo usado pelo dropdown de
  Fase/Situação em `CamposProcesso`) em vez de paginar -- não dá pra
  arrastar um item de uma página pra outra sem carregar tudo. Implementado
  com `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities`
  (`LinhaDeOpcao`, handle `IconeArrastar` de `components/Icons`).
  **Resolvido (achado 14, revisão pós-deploy): `ordem` virou fracionário**
  no backend (`float`, era `int`) -- ao soltar um item, o front calcula a
  nova `ordem` como o **ponto médio entre os vizinhos na posição de
  destino** (`calcularOrdemAposMover`, nas pontas usa o vizinho existente
  ± 1) e dispara **1 único** `PATCH /fases|situacoes/{id}` pro item movido,
  em vez de reindexar 1..N e mandar até N-1 PATCHs a cada drop (desenho
  antigo, substituído). `criarMutation` calcula a `ordem` da opção nova a
  partir do maior valor **em memória** (`Math.max(...opcoes.map(o =>
  o.ordem)) + 1`), não mais da contagem (`total + 1`) -- depois de
  reordenações, `ordem` deixou de ter relação direta com a posição/
  contagem. `ordemLocal` (carimbo otimista) só é limpo quando `query.data`
  muda **e** o PATCH do reorder não está mais em voo (`reordenarMutation.
  isPending`) -- sem esse guard, um refetch em segundo plano concorrente
  apagaria o carimbo antes da confirmação, e a lista "voltava" à ordem
  antiga por um instante. **Bug corrigido na revisão de consistência
  pós-implementação:** como `reordenarMutation` é 1 única instância
  compartilhada, um 2º drag iniciado antes do PATCH do 1º confirmar
  reusava essa mesma instância -- se o 2º PATCH assentasse antes do 1º,
  `isPending` virava `false` com o 1º ainda em voo, furando o guard do
  efeito acima bem nesse instante. `handleDragEnd` agora ignora um novo
  drag enquanto `reordenarMutation.isPending` for `true` (só 1 reorder em
  voo por vez). **Sem teste dedicado** pra esse guard nem pro anterior --
  simular um drag de verdade via `@dnd-kit` em jsdom (posições/
  `getBoundingClientRect` reais) não é viável com a infra de teste atual;
  nenhum teste desse arquivo simula um drag de ponta a ponta, só a função
  pura `calcularOrdemAposMover` e os efeitos colaterais de `criarMutation`.
  Também nessa revisão: `reordenarMutation` deixou de reenviar
  `opcao.rotulo` junto da `ordem` nova (`atualizarOpcaoProcesso` aceita
  `rotulo: string | undefined` agora) -- reenviar o rótulo atual podia
  sobrescrever uma edição de rótulo concorrente com um valor já
  desatualizado. **Limitação aceita:** sem checagem de unicidade
  de `ordem` (nunca existiu), bisecções repetidas entre os 2 mesmos vizinhos
  podem eventualmente empatar por precisão de ponto flutuante -- irrelevante
  na prática (dezenas de opções, não centenas de drags no mesmo par).
  `KeyboardSensor` (`@dnd-kit/core`, com `sortableKeyboardCoordinates` de
  `@dnd-kit/sortable`) foi adicionado ao lado do `PointerSensor` já
  existente, pra reordenar via teclado (acessibilidade).
  **Limitação conhecida e aceita, não corrigida (achado na revisão
  pré-deploy):** o teto de 100 é um corte silencioso -- se a lista GLOBAL
  de Fase/Situação (soma de todos os grupos da plataforma, inclusive
  opções desativadas, que nunca são removidas) um dia passar de 100 itens,
  os itens além do 100º somem da tela sem aviso nenhum (diferente do
  picker de Cliente/Subgrupo, que é por grupo e dificilmente chega perto
  de 100). Avaliado e decidido não corrigir agora: paginação real
  (Prev/Next, como Subgrupos/Clientes) quebraria o drag-and-drop entre
  páginas (só reordenaria dentro da página carregada, não a lista
  inteira); buscar todas as páginas em loop resolveria sem esse problema
  (para Fase/Situação o backend lê a partição inteira por chamada de qualquer forma; processos, documentos e clientes passaram a ler do índice estreito em 05/09/2026, e membros, histórico, atendimentos e subgrupos em 06/09/2026 --
  `opcoes_processo_repository.listar_pagina_por_tipo`, sem ganho real em
  paginar por request), mas foi adiado por ora -- 100 fases/situações é
  uma lista grande pra uma taxonomia curada por poucos `super_admin`.
- **Editar nome de Subgrupo** (em `SubgruposPage`, via `atualizarSubgrupo`):
  ícone ✎ por
  linha, visível só pra `admin`/`super_admin` (`papelAtende("admin")`,
  mesmo piso do ✕ Remover que já existia). `atualizarSubgrupo`
  (`services/api/subgrupos.ts`) chama `PATCH /subgrupos/{id}` -- endpoint
  implementado no backend na mesma sessão (ver `CONTEXT.md` da API,
  mesmo padrão de `PATCH /clientes/{id}`: `ConditionExpression=
  attribute_exists(...)` pra 404 em id inexistente/de outro grupo,
  checagem de nome duplicado excluindo o próprio subgrupo).
- Rótulo "(inativa)" de fase/situação desativada é exibido com a primeira
  letra maiúscula: "(Inativa)".
- Excluir um Cliente associado a algum processo (`cliente_ids`) dá `409` --
  sem tratamento especial no front, cai no mesmo toast de erro genérico
  (`toastErroMutation`) que qualquer outra `ApiError`, mostrando a
  mensagem que o backend manda.
- Link do e-mail de notificação (`?processo=&comunicacao=`) não abre mais
  um modal na aba Processos -- abre direto na aba **Histórico**, no item
  exato que gerou o e-mail (`utils/deepLink.ts` + `HistoricoPage`). Decisão
  trocada durante o desenvolvimento: fazia mais sentido levar pro registro
  da notificação em si do que pro processo genérico.
- **Busca + filtros de Processos** (`ProcessosPage`): o campo "Buscar" fica
  sempre visível e virou texto livre (número, apelido, objeto/assunto,
  próxima providência, observações), não mais só número. Ao lado, um botão
  "Filtros" abre/fecha um painel colapsável (`.filtros-painel`, toggle via
  classe `aberto` -- mesmo padrão de progressive disclosure já usado no
  modal de processo e nas sub-abas de Grupo) com Cliente/Fase/Situação
  (`Select`) e Data para verificar/Prazo final ("até", não data exata --
  `<input type="date">`). Os campos do painel ficam num **rascunho**
  separado do que está de fato aplicado -- só viram filtro real ao clicar
  "Aplicar filtros" (fecha o painel e dispara 1 fetch só, em vez de
  refazer a busca a cada campo trocado). Filtros aplicados viram **chips**
  removíveis individualmente abaixo do painel, e o botão "Filtros" ganha
  uma contagem (`Filtros (2)`). Mesmo padrão de busca (texto livre, nome/
  CPF-CNPJ/telefone/e-mail) na aba Clientes, sem o painel de filtros
  estruturados (não faz sentido lá, só tem os 4 campos de identificação).
- **`useDeferredValue` (React 18) em vez de debounce manual** nos 2 campos
  de busca -- existia um `useEffect`+`setTimeout` próprio antes; trocado a
  pedido do usuário por ser a forma nativa do React de adiar uma
  atualização de baixa prioridade, sem precisar gerenciar timer/cleanup
  na mão. Não faz o painel de Filtros (que não é digitação contínua, só
  troca de campo) -- só a busca por texto livre.
- **Tooltip de ajuda (`InfoTip`, ícone "i")** ao lado do label "Buscar" em
  Processos/Clientes, explicando em 1 frase simples o que o campo busca --
  troca um texto sempre visível (`.callout`, versão inicial, descartada)
  por uma explicação sob demanda. O ícone fica **fora** do `<label
  htmlFor>` de propósito: colocar o tooltip dentro do label faria o texto
  inteiro virar parte do nome acessível do campo pra leitor de tela (lido
  toda vez que o campo ganha foco) -- por isso `<label>` e `<InfoTip>`
  ficam como irmãos dentro de um `.field-label-row`, não aninhados.
- **Tags no card do processo** (`.docket-tags`, dentro de `ProcessosPage`):
  Fase atual, Situação atual e (se preenchidos) "Verificar dd/mm/aaaa"/
  "Prazo dd/mm/aaaa" aparecem como selos pequenos em maiúsculas, mesma
  paleta de cores dos badges já usados em Membros/Histórico. Só renderiza
  o bloco se pelo menos 1 desses 4 campos estiver preenchido.
- **Resolvido (achado 9): renovação de token concorrente vira mutex
  compartilhado** -- `services/api/client.ts` guarda uma única promise em
  módulo (`renovacaoEmAndamento`); vários 401 ao mesmo tempo esperam o
  mesmo `renovarToken()` em vez de disparar 1 chamada a `/refresh` por
  request que falhou (o backend rotaciona o refresh token a cada uso --
  chamadas paralelas descartariam umas às outras).
- **Resolvido (achado 16): logout/expiração se propaga entre abas** --
  `services/auth.ts` escuta o evento `storage` (dispara só nas OUTRAS
  abas) e chama `dispararAutenticacaoInvalida()` quando a chave do access
  token some do `localStorage`, reaproveitando a mesma ponte que
  `queryClient.ts` já usa pro 401. Também dispara quando `e.key === null`
  (revisão de consistência pós-implementação) -- é o sinal de
  `localStorage.clear()`, que `limparTokens()` não usa hoje (remove chave
  por chave), mas cobrir esse caso evita que um futuro refactor pra
  `.clear()` quebre essa propagação entre abas silenciosamente.
- **Resolvido (achado 15): retry do React Query só em erro que pode se
  resolver sozinho** -- `services/queryClient.ts`, `podeSerTransitorio(erro)`
  substitui a regra antiga: `ApiError` com status < 500 (400/401/403/404/
  409...) nunca é retentado (determinístico); erro de rede (não `ApiError`)
  ou 5xx continua até 3x.
- **Resolvido (achado 18): destaque de campo com erro (`field-error`/
  `campoInvalido`) removido** dos formulários de Cliente e de Processo -- o toast com a mensagem
  específica do backend já é o único sinal de erro; não valia o custo do
  backend passar a apontar qual campo falhou só pra isso. A classe CSS
  `.field-error` continua existindo (usada por outros pontos), só a
  aplicação dela nesses 4 formulários foi removida.
- **Resolvido (achado 19): link de convite/redefinição expirado (410) não
  mais parece "senha errada"** -- `AceitarConvitePage`/`RedefinirSenhaPage`
  checam `err instanceof ApiError && err.status === 410` no catch do
  submit e trocam o formulário por um `.banner` dedicado ("link inválido
  ou já foi usado"), em vez de destacar os campos de senha. Exigiu
  `aceitarConvite`/`redefinirSenha` (`services/auth.ts`) passarem a
  lançar `ApiError` (com `.status`) em vez de `Error` puro.
- **Resolvido (achado 20): `EditarMembroForm` explica o Salvar
  desabilitado** -- texto de apoio ("Selecione ao menos 1 subgrupo para
  salvar", o texto de apoio de `Campo`) aparece quando
  `subgruposSelecionados.length === 0` -- baseado na mensagem de
  `SubgruposObrigatorios` no backend ("Selecione ao menos 1 subgrupo"), com
  "para salvar" adicionado pelo contexto do botão.
- **Resolvido (achado 17): máscara de telefone fixo (10 dígitos)** --
  `mascararTelefone` (`utils/mask.ts`) assumia sempre o corte de celular
  (prefixo de 5 dígitos: `XXXXX-XXXX`), errado pra fixo (`XXXX-XXXX`).
  Agora decide o corte pelo tamanho já digitado depois do DDD: até 8
  dígitos → prefixo de 4 (fixo); a partir do 9º → prefixo de 5 (celular) --
  mesmo "reflow ao digitar o 9º dígito" usado pela maioria das máscaras de
  telefone BR. Não havia teste cobrindo 10 dígitos, foi por isso que
  passou despercebido.

### Paginação: o contrato é do servidor, e ele MUDA

Duas telas ficaram defasadas quando o backend passou a paginar rotas que
antes devolviam tudo -- e nos dois casos o comentário do front afirmava o
contrário do que a API fazia:

- `GET /grupos/membros` virou paginada e o front chamava sem query nenhuma.
  A partir da 11ª pessoa o grupo ficava invisível, e como o total local era
  `pessoas.length`, a `Pagination` se escondia sozinha -- não havia página 2
  pra clicar.
- `GET /processos` passou a paginar a busca FILTRADA, e o front continuava
  descartando `pagina`/`tamanhoPagina` quando havia filtro.

Duas regras que saíram disso:

1. **Quem precisa do conjunto inteiro percorre as páginas.** Use
   `todasAsPaginas` (`services/api/paginacao.ts`) ou o laço de
   `useTarefasDoQuadro`. Pedir `tamanhoPagina: TETO_POR_PAGINA` **não** é
   "traz tudo" -- 100 é o máximo que a API aceita, e acima disso a lista vem
   cortada em silêncio.
2. **Chave de cache por FORMATO.** `qk.membros(params)` guarda uma página;
   `qk.todosOsMembros()` guarda o conjunto. Compartilhar chave entre dois
   formatos foi o que quebrou o arraste do Kanban -- ver abaixo.

### Rótulo de atendimento na Agenda: lote por id, não catálogo inteiro

A Agenda mostra o assunto do atendimento vinculado a uma tarefa. Antes ela
buscava **todos** os atendimentos para montar um mapa `id → assunto`. Isso
custava caro por um motivo que só aparece olhando o backend:
`atendimentos_repository.listar_pagina` relê **todos** os atendimentos de
**todos** os subgrupos visíveis a cada página pedida, e fatia em memória.
Percorrer o catálogo com `todasAsPaginas` lia a coleção uma vez por página.

Medido, com 8 subgrupos:

| atendimentos | requisições HTTP | Queries | itens lidos |
|---|---|---|---|
| 100 | 1 | 8 | 100 |
| 1.000 | 10 | 80 | **10.000** |
| 5.000 | 50 | 400 | **250.000** |

…para exibir cerca de dez assuntos.

Agora `useAssuntosDasTarefas` pede só os pares `(subgrupo, atendimento)` que
as tarefas **da tela** referenciam, via `GET /atendimentos/resumos`. O custo
passa a depender de quantos aparecem na tela, não de quantos o escritório
tem — a variável errada trocada pela certa.

**Por que lote e não `useQueries` com uma query por id.** As duas
alternativas desacoplam do tamanho do catálogo, mas com `useQueries` o
número de requisições cresce com o **período** que a pessoa escolhe na
Agenda: um trimestre viraria dezenas de chamadas paralelas, e o navegador
serializa em ~6 por host. Com lote, um dia e um trimestre custam uma
requisição.

O argumento a favor do `useQueries` — reaproveitar o cache da tela de
detalhe — não se sustenta: o detalhe devolve o atendimento inteiro, o
resumo devolve só o assunto. São formas diferentes, e compartilhar chave
entre duas formas é o defeito recorrente deste projeto.

**Escopo.** O backend filtra por subgrupo visível **antes** de ir ao banco, e
par fora do escopo ou inexistente simplesmente não volta — responder erro
permitiria descobrir quais atendimentos existem comparando as respostas.

**Dois tetos, naturezas diferentes.** `MAXIMO_DE_RESUMOS = 500` é guarda de
entrada: acima disso é bug no front ou abuso. `CHAVES_POR_BATCH_GET = 100` é
limite físico do DynamoDB, e o repositório fatia internamente. Um é
contrato, o outro é plataforma.

### Catálogo completo NÃO leva `staleTime` — e a razão é medida, não estética

Uma auditoria apontou que `todasAsPaginas` sobre uma coleção que cresce sem
limite refaria a caminhada de páginas a cada montagem e a cada foco de
janela, e eu adicionei cinco minutos de validade **sem medir**. Depois medi,
em produção:

⚠️ **Clientes saiu desta lista em 25/08/2026** -- não há mais catálogo
completo de clientes. `useTodosOsClientes` foi removido; quem precisa de
cliente busca a primeira página (ver *Toda lista que pode crescer sem
limite*). Os que sobraram continuam caminhando as páginas de propósito:
subgrupo e opção de processo são cadastro de escritório, e a caminhada é uma
requisição.

| catálogo | itens | páginas |
|---|---|---|
| clientes (removido) | 2 | 1 |
| subgrupos | 8 | 1 |
| atendimentos | 1 | 1 |
| membros | 15 | 1 |
| opções (fases/situações) | 88 | 1 |

Tudo cabe em **uma** página. A "caminhada" que eu dizia estar economizando é
uma requisição — e o React Query já deduplica chamadas simultâneas da mesma
chave, então nem o caso de vários componentes montando juntos o `staleTime`
resolvia.

O custo, por outro lado, era real. O canal WebSocket só invalida
notificação; nada mais. A **única** coisa que trazia dado de outra pessoa
era o `refetchOnWindowFocus`, e o `staleTime` é exatamente o que o desliga.
O cenário concreto: a sócia cadastra um cliente, você volta para a aba, e o
select de "Novo processo" não o mostra por até cinco minutos — num sistema
de escritório compartilhado, isso faz a pessoa cadastrar de novo.

**Se um dia o volume justificar**, o ajuste certo não é `staleTime`: é parar
de caminhar todas as páginas só para rotular tarefa na Agenda, e buscar os
assuntos apenas dos ids que estão na tela. `staleTime` troca correção por
desempenho; a mudança de estratégia não troca nada.

`catalogos.test.ts` fixa a ausência, para que reintroduzir exija passar
pelo teste — e por esta seção.

### O modal de tarefa busca os próprios dados (25/08/2026)

`ModalDeTarefa` recebia `colunas` e `membros` **por prop**, vindos da página
-- que só conhece o subgrupo que está exibindo. Trocar o subgrupo dentro do
formulário não recarregava nenhum dos dois.

Resultado: o seletor continuava oferecendo as colunas do quadro anterior, e
salvar batia em `_validar_coluna` no servidor -- *"A coluna não pertence ao
quadro deste subgrupo"*. **Quem participa de mais de um subgrupo só conseguia
criar tarefa no que estivesse aberto na tela.** O seletor de subgrupo existia
e não servia pra nada; pior que não existir, porque prometia.

O modal passou a buscar quadro e membros **do subgrupo escolhido nele**,
pelas mesmas `queryKey` que as páginas já usam (`qk.quadro`,
`qk.membrosDoSubgrupo`) -- então o caso comum, criar no subgrupo aberto, sai
do cache sem requisição nova. `KanbanPage` e `AgendaPage` deixaram de passar
as props; a Agenda perdeu junto o `quadroDoModalQuery`, que existia só pra
isso.

**A coluna virou valor DERIVADO, não estado.** Guardada, ela ficava errada em
dois momentos: enquanto o quadro ainda vinha (o estado nascia vazio e nada o
preenchia depois, então o Salvar ficava travado sem dizer por quê) e depois
de trocar de subgrupo. Uma linha resolve os dois: se a coluna não está NESTE
quadro, vale a primeira dele.

**O mesmo defeito existia no Responsável**, por `_validar_responsavel`: a
lista vinha do GRUPO inteiro, e escolher alguém de fora do subgrupo dava
*"Responsável não é membro do subgrupo"* -- e esse aparecia mesmo sem trocar
de subgrupo. Agora vem de `GET /subgrupos/{id}/membros`, o mesmo recorte que
o servidor aplica.

⚠️ **Risco criado pela própria correção, fechado com teste:** recortar por
subgrupo faz sumir quem SAIU dele depois de já ter tarefas. Sem guarda,
abrir a tarefa mostraria "Sem responsável" e salvar gravaria `null` -- a
atribuição some sem ninguém mandar. O modal mantém a pessoa na lista mesmo
não sendo mais membro.

⚠️ **Regressão pega antes de subir:** a rota do subgrupo devolvia só
`{email, adicionado_em}`, então o seletor passou a mostrar `joao@x.com` no
lugar de "João Meireles". Resolvido **na API**, que passou a devolver
`apelido` -- em vez de o front pedir `GET /grupos/membros` só pra traduzir
e-mail em nome, volta que a aba de Membros do Subgrupo já fazia pelo mesmo
motivo.

**E `GET /subgrupos/{id}/membros` caiu de `manager` pra `user`** (recortado
por participação). Sem isso, quem tem papel `user` não conseguia atribuir
tarefa a ninguém, **nem a si mesmo** -- ficava fora de "minhas tarefas", dos
cartões da Área de trabalho e do lembrete de prazo. Detalhes no `CONTEXT.md`
da API.

**Verificado em Chrome com janela**, não só em jsdom: abrindo o quadro no
Trabalhista e trocando pro Cível, a coluna passa de "Triagem" pra "A Fazer"
e o `POST` sai com o par certo.

### Escape fecha a camada de cima, não o que está atrás (25/08/2026)

`Modal` fecha por um listener de `keydown` no `document`. O menu do
`react-select` e o calendário do `DatePicker` respondem à mesma tecla. Sem
coordenação, **um Escape com qualquer um deles aberto fechava os dois**: quem
só queria dispensar a lista perdia o formulário e o texto já digitado.

A interceptação fica em quem abre a camada, e não no `Modal`: cada um sabe se
está aberto, e o `Modal` não teria como reconhecer toda camada flutuante
(o menu do `Select` no modo `padrao` não carrega marca nenhuma).

- **`Select`/`MultiSelect`:** pelo `onKeyDown` do react-select, que roda
  ANTES do handler dele. `stopPropagation`, nunca `preventDefault` -- a lib
  desiste do próprio tratamento se o evento vier com `defaultPrevented`, e
  aí o modal fecharia e o menu ficaria aberto, o inverso exato do desejado.
  No modo `chip` o menu é controlado por nós, então além de barrar o evento
  é preciso fechá-lo à mão: quem o fechava era justamente o listener de
  `document` que acabou de ser barrado.
- **`SeletorData`:** a pergunta "está aberto?" vem do DOM
  (`SELETOR_CALENDARIO`, a marca que a própria lib escreve), não de estado.
  Tentei primeiro com estado alimentado por `onOpenChange` e no Escape ele
  ainda vinha `false` -- sondado em Chrome.

Verificado em Chrome nos três casos: a camada fecha, o modal fica, o texto
digitado permanece, e um **segundo** Escape fecha o modal -- o comportamento
normal continua de pé.

⚠️ **Eu tinha escrito nos comentários que "jsdom não pega".** Errado: pega os
dois casos, e a mutação prova. O defeito passou despercebido porque ninguém
tinha escrito o teste, não porque o ambiente não alcançava.

#### A regra valia para TRÊS camadas a mais, e ninguém tinha aplicado (01/09/2026)

`CampoDeClientes`, `VinculoDeRegistro` e `CampoDeProcesso` são comboboxes
caseiros — abrem uma lista sobre o formulário exatamente como o `Select`, e
**nenhum dos três tinha `onKeyDown`**. Escape com a lista aberta fechava o modal
inteiro, o defeito que esta ADR descreve, nos três formulários mais longos do
sistema (processo, tarefa e atendimento).

Passaram despercebidos porque a correção de 25/08 foi feita camada a camada,
pelos nomes que estavam à mão — e estes três não têm "Select" no nome.

- A interceptação vai no `Box` de FORA, não no `Input`: com o foco numa opção
  da lista, um handler preso ao campo não veria a tecla.
- A condição espelha a de renderização da lista (`aberto && busca` em dois
  deles), e não só `aberto`. Sem termo de busca não há nada na tela, e engolir
  o Escape ali prenderia a pessoa no modal — é o par negativo dos testes.

🔴 **Isto é pré-requisito da guarda de descarte**: com a guarda ligada, o
Escape que hoje fecha o modal em silêncio passaria a perguntar "sair sem
salvar?" para quem só quis dispensar a lista — o falso positivo que ensina a
clicar sem ler.

## 4) Blocos de código essenciais

**Variáveis de ambiente:**

```
VITE_API_URL=<Function URL da AWS, sem barra no final>
VITE_WS_URL=<endpoint wss do API Gateway WebSocket, com o stage no fim>
```

Configurar tanto no `.env` local quanto no Vercel (Settings → Environment
Variables) — são independentes, precisam ser atualizadas nos dois lugares
se as URLs mudarem.

⚠️ **Variável do Vite entra no BUILD, não em runtime.** Adicionar no painel
do Vercel não muda o bundle que já está no ar: é preciso um build NOVO. E
"Redeploy" com *Use existing Build Cache* marcado (o padrão) reaproveita o
bundle e a variável continua de fora — desmarque, ou faça um push. O sinal
de que funcionou é o **hash do arquivo em `/assets/` mudar**; enquanto for o
mesmo nome, é o mesmo build. Perdido tempo com isso em 23/08/2026.

⚠️ **A CSP em `vercel.json` precisa liberar o `wss://` também.** O
`connect-src` cobre WebSocket, e ele NÃO herda a permissão do `https://` do
mesmo host — são esquemas diferentes. Sem a entrada
`wss://*.execute-api.sa-east-1.amazonaws.com`, o navegador bloqueia o canal
e a única pista é uma linha no console dizendo "The action has been
blocked". Achado testando em produção, depois de a variável já estar certa.

`VITE_WS_URL` é OPCIONAL: sem ela o sino continua correto, porque a
consulta é a fonte da verdade — o que se perde é só o tempo real (o aviso
passa a aparecer quando a aba ganha foco). Por isso o hook simplesmente não
abre a conexão quando ela falta, em vez de quebrar.

**Comandos:**

```bash
yarn install
yarn dev          # servidor local
yarn build        # roda tsc -b (type-check) + vite build
yarn typecheck    # só tsc -b, sem build
yarn test         # vitest, roda uma vez (CI)
yarn test:watch   # vitest, modo watch
```

**Decodificação de JWT no client** (só pra UI, autorização real sempre no
backend): o `papel` e `grupo_id` do usuário vêm decodificados do próprio
access token JWT salvo no `localStorage`, em `services/auth.ts`.

## 5) Tarefas pendentes

1. Confirmar que o front em produção (Vercel) está apontando pra URL certa
   da API — a Function URL da AWS mudou várias vezes durante o
   desenvolvimento/depuração do backend; se o backend for redeployado de um
   jeito que force recriação da Function URL, o `VITE_API_URL` do Vercel
   precisa ser atualizado manualmente de novo.
2. ~~Nenhum teste de componente/página~~ -- **resolvido**: 57 arquivos, 551
   testes, cobrindo páginas e componentes. `yarn test`.
3. Considerar travar `Access-Control-Allow-Origin` no backend pro domínio
   específico do Vercel, em vez de `"*"` (pendência do lado do backend, mas
   afeta o front se for feito).
4. ~~**Três telas baixam o escritório inteiro pra escrever um nome**~~ --
   **feito** em 25/08/2026. `autor_nome` vem na notificação e no registro de
   atendimento, resolvido pelo servidor; saíram as consultas de
   `SinoDeNotificacoes`, `AtendimentosPage` e `AtendimentoDetalhePage`.
   `/grupos/membros` ficou só onde a lista é o ASSUNTO da tela.

   **Conferido em Chrome** por `scripts/verificar-nome-do-autor.mjs`, cuja
   asserção principal é uma AUSÊNCIA: ele falha se `/grupos/membros` for
   pedido. Controle com o front anterior: 2 pedidos. Agora: zero.

   ⚠️ No controle a frase mostrava o apelido do mesmo jeito, porque o front
   antigo ignorava o campo novo e resolvia pela lista. **Um teste que olhasse
   só o nome na tela teria passado nos dois casos.** Texto original abaixo.

   ⚠️ Este item dizia "o sino baixa todos os membros **em toda tela**".
   Verificado, e é impreciso: `qk.todosOsMembros()` é chave COMPARTILHADA
   por seis consumidores, e `listarTodosOsMembrosDoGrupo` percorre as
   páginas com `TETO_POR_PAGINA = 100` -- num escritório de até 100 pessoas
   é UMA requisição, deduplicada entre as telas.

   O que é verdade, e justifica o item:

   - nenhuma dessas consultas define `staleTime`, então refaz a cada
     montagem de `AtendimentosPage`, `AtendimentoDetalhePage`,
     `SubgruposPage` e `MembrosPage`, e a cada foco de janela;
   - baixa o escritório INTEIRO pra nomear no máximo 50 autores, e cresce
     com o escritório;
   - 🔴 **todas têm `enabled: papelAtende("manager")`** -- quem é `user` vê
     e-mail cru, sempre. É o mesmo defeito que `responsavel_nome` tirou do
     cartão do Kanban.

   E não é só o sino: `nomeDoAutor` alimenta também `LinhaDeAtendimento` e
   `LinhaDoTempo`, sobre o `autor_id` dos registros de atendimento.

   **A saída:** `autor_nome` vindo do servidor, nas três. Some `membrosQuery`
   de `SinoDeNotificacoes`, `AtendimentosPage` e `AtendimentoDetalhePage`;
   `/grupos/membros` fica só onde é o assunto da tela (Membros e Subgrupos).

   ⚠️ **`autor_nome` é OPCIONAL no tipo.** `MensagemDoCanal.notificacao` é
   tipada como `Notificacao`, e o objeto que chega pelo canal WebSocket
   **não** tem o campo -- ele nasce do stream do DynamoDB, não da rota.
   Obrigatório faria o TypeScript afirmar o que é falso. Na prática não
   aparece: `aoChegar` é `invalidateQueries`, então o push é gatilho e a
   lista sempre vem da API.
5. ~~**A Agenda pede um quadro POR SUBGRUPO exibido, e trunca em 50**~~ —
   **feito** em 25/08/2026. `coluna_nome` e `esta_concluida` vêm na tarefa.
   `useQuadrosDosSubgrupos` (96 linhas) foi apagado, com a fiação das props
   por quatro níveis, o teto de 50 e o aviso "não foi possível carregar os
   quadros".

   **Reproduzido em Chrome, com 55 subgrupos semeados no ambiente local**
   (`scripts/verificar-agenda-sem-quadros.mjs`) — produção tem 7, então isto
   nunca apareceria lá:

   | | tarefas riscadas | pedidos de `/quadro` |
   |---|---|---|
   | front anterior | **50 de 55** — as de além do 50º apareciam pendentes | **50** |
   | front atual | 55 de 55 | **0** |

   ⚠️ **Dois testes saíram, e não em silêncio.** "O mesmo `coluna_id` em
   quadros diferentes não se confunde" MUDOU DE LADO — virou teste de API. E
   "NÃO mostra a lista antes dos quadros" perdeu o objeto: não há mais
   quadros a esperar, os campos chegam na mesma resposta. Os dois viraram um
   só, cuja asserção é uma AUSÊNCIA: a tela não voltou a pedir `/quadro`.

   ⚠️ `esta_concluida`, e **não** `concluida`: a tarefa também carrega
   `concluido_em`, um carimbo gravado que é ausente em toda tarefa concluída
   antes do arquivamento existir. O nome longo evita que alguém pegue o
   errado — e o errado falharia exatamente como a Agenda falhava.

   Texto original abaixo.

   ⚠️ Este item dizia que um grupo com mais de 50 subgrupos "veria só os 50
   primeiros". Verificado, e o efeito é pior: `useTarefasDaAgenda` traz as
   tarefas de **todos** os subgrupos visíveis, mas `useQuadrosDosSubgrupos`
   recebe `subgrupos.primeiraPagina` -- os 50 primeiros. A tarefa do 51º
   subgrupo aparece **sem nome de coluna e sem tachado: concluída exibida
   como pendente**. Não é "ver menos", é afirmar errado.

   Latente hoje (7 subgrupos em produção, conferidos em 25/08/2026), e o
   tipo de defeito que só aparece quando já incomoda.

   **A saída:** `GET /tarefas` traz `coluna_nome` e `concluida`. Somem as 96
   linhas do hook, a fiação das props por quatro níveis de componente, o teto
   de 50 e o aviso persistente de "não consegui carregar os quadros" -- e
   esse último é ganho estrutural, não corte: hoje existe um estado em que a
   lista chegou e os quadros não, e a tela **afirma o contrário do que é**.

   Some também uma decisão duplicada: `colunas_que_concluem`, na API, diz de
   si mesma ser o "ponto único" de "o que é concluída" -- mas
   `useQuadrosDosSubgrupos` decide de novo, por conta (`e_conclusao ||
   e_arquivado`). São dois hoje.

   **O que NÃO some:** `useConcluirTarefa` (do Workspace, não da Agenda)
   continua buscando o quadro pra achar a coluna de DESTINO, e o Kanban
   continua carregando o quadro pra desenhar coluna vazia. `qk.quadro()`
   mantém quatro consumidores.

   🔴 **ORDEM DE DEPLOY: API primeiro, sempre.** Com o front na frente, a
   Agenda leria `concluida` de uma API que ainda não manda -- `undefined`,
   falso, e toda tarefa concluída voltaria a aparecer como pendente. É o
   defeito alvo, recriado durante a janela e sem nada na tela indicando.
   Vale igual pro rollback.

   ⚠️ **Os stubs entram junto.** `scripts/stubsDaApi.mjs` devolve `autor`,
   `autor_id` e `coluna_id`; sem acrescentar os campos novos ali, a
   verificação visual em Chrome mostra nome vazio e parece defeito do
   código, não do stub.

---

## A busca pelo começo da palavra (decidida em 14/09/2026, a executar)

Decisão do usuário, com o motivo e as medições no `CONTEXT.md` e no
`PLANO_LER_SO_O_NECESSARIO.md` da API: toda busca por texto do sistema passa a
achar pela palavra completa ou pelo começo dela, por um índice de palavras, e um
serviço de busca separado fica para quando ela ficar lenta. Ainda não
implementado: as buscas descritas no resto deste documento são as de hoje.

- 🔴 **Muda o que se acha:** hoje "anco" acha "Banco"; depois, só "banc" ou
  "banco". Acento e maiúscula continuam sem contar.
- 🔴 **Texto a partir de 2 letras; número com qualquer tamanho** (decidido pelo
  usuário em 14/09/2026). Uma letra só leria tudo o que começa com ela.
- 🔴 **O que busca no navegador segue a mesma regra**, senão a mesma palavra acha
  numa tela e não em outra: o filtro do quadro (`pages/KanbanPage/index.tsx`, por
  título e número do processo) e o dos seletores sobre as opções já carregadas
  (`contemTermo`, em `utils/texto.ts`). Os dois procuram hoje em qualquer parte.
- 🔴 **Números com todos os finais** (decidido pelo usuário em 14/09/2026): na
  API, os dígitos do processo, do CPF/CNPJ, do telefone e do número do documento
  entram com todos os finais como palavras, e um pedaço do meio continua achando,
  como hoje. No navegador, a parte dos dígitos fica como está: o quadro já procura
  os dígitos do processo em qualquer posição. Só o texto passa ao começo da palavra.
