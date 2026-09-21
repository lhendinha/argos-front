# O teclado na tela de entrada — o que já foi medido

Documento de passagem. Quem chegar aqui vai encontrar o assunto **em aberto**,
com mudanças **não commitadas** no disco. Leia antes de mexer: quase toda
hipótese óbvia já foi testada e derrubada por medição.

## O sintoma

No Safari de um **iPhone 17 Pro Max real**, na tela de entrada
(`/login`), com o teclado aberto: tocar alternadamente em **E-mail** e
**Senha** desloca a tela a cada toque. O usuário descreveu como "a tela pula".

Também havia um estrago maior no primeiro toque, com o campo saindo da área
visível — esse já foi corrigido.

## Onde mexer

| arquivo | papel |
|---|---|
| `src/components/CartaoDeAutenticacao/index.tsx` | a moldura e o cartão das 4 telas de portão |
| `src/hooks/useAreaVisivel.ts` | detecta o teclado e devolve a faixa visível |
| `src/hooks/useCampoFocadoAVista.ts` | traz o campo em foco para dentro da faixa |
| `src/constants/telas.ts` | os limiares, cada um com a medida que o originou |
| `scripts/verificar-tela-de-entrada.mjs` | guarda mecânica, 4 cenários + estabilidade |
| `scripts/medir-teclado-ios.mjs` | bateria com toque real, os dois campos, os dois lados |
| `index.html` | `interactive-widget=resizes-content` na meta viewport |

## A maior causa era ZOOM, não rolagem

Os campos tinham `font-size: 14px`. **Abaixo de 16px o Safari do iOS amplia a
página ao focar um campo**, para o texto ficar legível -- e ao trocar de campo
ele recentraliza a vista ampliada. Isso se lê como "a tela pula".

Medido no aparelho do usuário: `visualViewport.scale` ia a **1,1431818**, que
é exatamente **16 ÷ 14**. Não é aproximação.

Horas foram gastas antes disso tratando o caso como problema de layout --
moldura fixa, recuo, ancoragem, compressão -- e nenhuma dessas correções podia
funcionar, porque o movimento não vinha de rolagem.

A correção está na receita do `input`, em `src/theme/index.ts`: 14px na tela,
`16px` sob `@media (pointer: coarse)`. Não é `user-scalable=no`, que também
resolveria mas tiraria de quem precisa ampliar a única forma de fazer isso.

➡️ **Achado a partir de uma referência do usuário**, o app Astrea, que não
tinha o problema. A comparação revelou a diferença; a medição provou a causa.

## O que ficou, e não é alcançável pela página

Na REABERTURA do teclado (focar, fechar, focar de novo):

```
layout 642 · faixa 447 · y 154 · doc 796
html   alt 642 · topo -154 · scrollH 796   <- aqui
body   alt 642 · topo -154 · scrollH 642
#root  alt 642 · topo -154 · scrollH 642
coluna alt 642 · minH 642px · padB 195px   <- nosso, correto
```

`body`, `#root` e a nossa coluna estão **todos em 642**. Quem fica em 796 é o
`scrollHeight` do `html` -- a área rolável que o Safari mantém no tamanho "sem
barra de endereço". Ele rola os 154px de diferença (796 − 642) para recolher a
própria barra ao focar o campo.

**Tentado e sem efeito:** fixar `document.documentElement.style.height` no
valor vivo. Medido: `scrollHeight` continuou 796.

**Tentado e sem efeito:** o truque da opacidade (zerar `opacity` no `focus` e
restaurar no tique seguinte, que faz o Safari pular a rolagem em alguns
casos). Medido: `y` continuou 154.

## O que está estabelecido por medição

### 1. O Safari centraliza o campo em foco, e isso não é nosso

Gravado no aparelho do usuário, com toque real, lendo ao vivo:

```
foco email · y  0 · cartão  29 · e-mail em 148..188 · faixa 391
foco senha · y 41 · cartão -12 · senha  em 187..227 · faixa 391
```

O campo focado vai **sempre para a mesma região** (~150 a 230). Os dois
campos estão 80px afastados, então cada troca custa ~40px de deslocamento.

Ao mesmo tempo: `paddingBottom 405`, `scrollHeight - clientHeight = 0`. O
documento **não tem para onde rolar**. O Safari está deslocando o *viewport
visual*, que nenhuma propriedade de CSS nossa alcança.

E os dois campos já estão inteiramente dentro da faixa nos dois estados —
não há nada para o nosso código corrigir.

### 2. O layout viewport do iOS é inconsistente

No **mesmo** aparelho, mesma versão, mesma página:

- uma rodada: layout foi de 796 para 696 quando o teclado abriu
- a rodada seguinte: ficou em 796

Qualquer regra apoiada em "o layout encolheu?" varia sozinha. Uma versão
chegou a escolher o caminho de renderização por isso e o resultado alternava
entre bom e quebrado sem ninguém mexer no código.

### 3. Os dois teclados do iOS têm alturas diferentes

E-mail e senha abrem teclados distintos (um com tecla de emoji e `@`, o outro
com a barra de senhas). Medido: faixa **393** com um, **416** com o outro.

Consequência: **tudo que reagir à faixa muda quando se troca de campo.** Duas
versões morreram por isso — uma com `position: fixed` perseguindo
`visualViewport.offsetTop`, outra com `paddingBottom` igual à faixa.

### 4. `interactive-widget=resizes-content` funciona, com um efeito colateral

Medido num Android real (Chrome 134): sem a palavra-chave, layout 536 e
visual 172; com ela, **213 nos dois**.

O efeito colateral: ela iguala `visualViewport.height` e `innerHeight`, e era
a diferença entre os dois que `useAreaVisivel` usava para detectar o teclado.
Por isso a detecção hoje soma **dois sinais** — o clássico (`visual <
innerHeight`) e o novo (`innerHeight` menor que o maior já visto nesta
largura, com piso de `ENCOLHIMENTO_QUE_E_TECLADO` para não confundir com a
barra do navegador recolhendo).

## O que já foi tentado e derrubado

| tentativa | por que caiu |
|---|---|
| moldura `position: fixed` com `translateY(offsetTop)` | o Safari desloca na hora, o `translateY` entra um render depois; no quadro do meio a tela inteira sai do lugar |
| ancorar o cartão no topo (com a moldura fixa) | somou-se à rolagem interna; o cartão saiu pela borda de cima |
| tirar a moldura fixa para todos | no Android sem a meta, `scrollIntoView` alinha pelo layout, que lá não encolhe: campo terminava em 345 atrás do teclado |
| escolher o caminho por "o layout encolheu?" | a régua varia sozinha — ver item 2 |
| `paddingBottom` igual à faixa | a faixa muda entre os campos; cada troca mexia na altura do documento e a rolagem pulava 35px |
| `paddingBottom: 50vh` fixo | criou folga rolável que o Safari usou para deslocar |
| recuo só quando o cartão não cabe | correto, mas a altura do cartão era lida uma vez (452, antes de comprimir) e a condição usava o número velho |
| ancorar no topo (sem moldura fixa) | trocava a regra de ancoragem ao abrir o teclado: salto de 148px |
| centralizar na faixa com `100dvh` | o `dvh` fica travado em 796 enquanto o layout real é 642; o recuo saía 154px maior |
| recuo e `min-height` pela altura VIVA (`window.innerHeight`) | **funcionou** -- é o que está no disco |
| campos com 16px no apontador grosso | **funcionou** -- era a maior causa |
| fixar a altura do `html` por JavaScript | `scrollHeight` não obedece: continuou 796 |
| truque da opacidade no `focus` | sem efeito: `y` continuou 154 |

## O que está no disco, não commitado

Último commit: `7cc3825`. O que está por cima dele:

- caminho único, sem `position: fixed` em lugar nenhum
- cartão centralizado na **faixa visível** (`paddingBottom: calc(100dvh - faixa)`)
- compressão: abaixo de `FAIXA_QUE_COMPORTA_O_CARTAO_INTEIRO` (460) a marca
  passa da forma empilhada (~80px) para a deitada (~26px), e o cartão cai de
  452 para 357
- `useCampoFocadoAVista` espera 250ms, mede a diferença e rola só o que falta,
  em vez de chamar `scrollIntoView`
- `layoutEncolheu` foi **removido** do tipo `AreaVisivel` e do hook
- a guarda ganhou 4 cenários com a **geometria de cada aparelho** e um teste de
  estabilidade ao trocar de teclado
- a bateria do iOS passou a cobrar os **dois campos** e os **dois lados** da faixa

## Como medir no aparelho real — vale mais que tudo aqui

Foi isto que destravou o diagnóstico. Sem isso a investigação anda às cegas:
**três instrumentos meus aprovaram telas quebradas** que o usuário via em
segundos.

```bash
brew install ios-webkit-debug-proxy
# no iPhone: Ajustes → Safari → Avançado → Inspetor da Web
# conectar o cabo, confiar no computador

npx vite preview --port 4173 --host        # serve o build na rede
ipconfig getifaddr en0                     # o IP para abrir no iPhone

ios_webkit_debug_proxy -c null:9300,:9222-9299 -d &
curl -s http://localhost:9222/json         # acha o alvo da aba
```

O protocolo é o do **WebKit**, não o do Chrome — `connectOverCDP` devolve 404.
E no iOS moderno os comandos vão embrulhados em `Target.sendMessageToTarget`,
com a resposta voltando como `Target.dispatchMessageFromTarget`; mandar
`Runtime.evaluate` direto responde `'Runtime' domain was not found`.

O usuário toca, e se lê ao vivo: `visualViewport.height`, `innerHeight`,
`window.scrollY`, a caixa de cada campo, o recuo computado e
`scrollHeight - clientHeight`.

⚠️ **Confira o bundle a cada rodada.** Duas medições foram perdidas porque o
Safari serviu o build antigo do cache. Ler
`document.querySelector('script[src*="index-"]').src` e comparar com o que
`dist/index.html` aponta.

## O que o simulador não serve para medir

- o teclado dele tem alturas diferentes do real, e as leituras variaram entre
  rodadas da mesma versão
- toque nativo em alvo atrás do teclado **cai na tecla**, e para o WebDriver
  isso "deu certo" — 14 medições viraram verde sem ter acontecido
- foco por JavaScript não aciona a rolagem que o Safari faz ao **tocar**, que é
  metade do fenômeno

Serve para layout e para a régua de estouro. Não serve para julgar movimento.

## Regra que vale registrar

**Com o teclado aberto, nenhuma medida nossa pode sair de `dvh`.** O Safari
mantém esse número na altura maior enquanto usa outro no layout. Duas
correções seguidas caíram por isso -- primeiro o recuo, depois a altura
mínima. O valor confiável é `window.innerHeight` no momento da medida, que o
`useAreaVisivel` devolve como `alturaDeLayout`.

## A hipótese que sobrou, não testada

**Um campo por vez na tela.** Se não houver um segundo campo, não há para onde
o Safari recentralizar. Custa repensar a tela de entrada e provavelmente não
compensa — mas é a única ideia que ataca a causa medida no item 1, em vez de
contornar sintoma.

Antes de tentar qualquer outra coisa: reproduza o item 1 no aparelho real e
confirme que os números batem. Se não baterem, o terreno mudou e este
documento envelheceu.
