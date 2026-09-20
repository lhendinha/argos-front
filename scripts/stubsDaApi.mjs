/** Respostas falsas da API pros scripts de screenshot.
 *
 * Antes esses scripts pediam um `TOKEN_DEMO` de verdade, o que significava
 * bater no login de PRODUÇÃO -- e cada tentativa errada consome uma das 5
 * do bloqueio de conta. Interceptando a rede, a tela renderiza com dado
 * conhecido e estável, que é o que uma comparação pixel a pixel precisa:
 * dado de produção muda e a foto de ontem deixa de servir de referência.
 */

const SITUACOES = [
  "Aguardando sentença",
  "Aguardando audiência",
  "Aguardando contestação",
  "Em recurso",
  "Suspenso",
  "Arquivado",
];
const FASES = ["Conhecimento (1º Grau)", "Recursal (2º Grau)", "Execução", "Cumprimento de sentença"];
const CLIENTES = [
  "Ângela Fontes",
  "Construtora Alfa",
  "Marina Duarte",
  "Rogério Lima",
  "Silveira & Associados",
  "Transportes Beta",
  "Zuleica Andrade",
];

/** Filtro por `busca` igual ao do servidor: sem acento, sem caixa.
 *
 * ⚠️ Stub que IGNORA `busca` faz a verificação visual passar com o filtro
 * quebrado -- a lista continuaria completa e parecendo certa. */
function filtrar(itens, url, campo) {
  const termo = (url?.searchParams.get("busca") || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (!termo) return itens;
  return itens.filter((i) =>
    String(i[campo]).toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(termo),
  );
}

function opcoes(rotulos, tipo) {
  return {
    opcoes: rotulos.map((rotulo, i) => ({
      opcao_id: `${tipo}-${i + 1}`,
      tipo,
      rotulo,
      ordem: i + 1,
      ativo: true,
    })),
    total: rotulos.length,
  };
}

const PROCESSOS = {
  processos: [
    {
      subgrupo_id: "sg-civel",
      numero_processo: "08012345620258050001",
      apelido: "Ação de cobrança — Alfa",
      cliente_ids: ["cli-1"],
      cliente_nomes: ["Construtora Alfa"],
      subgrupo_nome: "Cível",
      fase_rotulo: "Conhecimento (1º Grau)",
      situacao_rotulo: "Aguardando sentença",
      prazo_final: "2026-09-01",
      ultima_mov_data: "2026-08-18",
      ultima_mov_tipo: "Conclusos para sentença",
    },
    {
      subgrupo_id: "sg-trab",
      numero_processo: "08076543220258050001",
      apelido: "Reclamação trabalhista — Beta",
      cliente_ids: ["cli-3"],
      cliente_nomes: ["Transportes Beta"],
      subgrupo_nome: "Trabalhista",
      fase_rotulo: "Recursal (2º Grau)",
      situacao_rotulo: "Em recurso",
      prazo_final: "2026-09-14",
      ultima_mov_data: "2026-08-20",
      ultima_mov_tipo: "Recurso ordinário interposto",
    },
    {
      // Sem `prazo_final` de propósito: é a linha que revela desalinhamento
      // na última coluna, e foi assim que ela passou despercebida.
      subgrupo_id: "sg-civel",
      numero_processo: "08098765420258050001",
      apelido: "Execução fiscal — Rio Verde",
      cliente_ids: ["cli-4"],
      cliente_nomes: ["Comércio Rio Verde ME"],
      subgrupo_nome: "Financeiro",
      fase_rotulo: "Execução",
      situacao_rotulo: "Arquivado definitivamente",
      ultima_mov_data: "2026-08-12",
      ultima_mov_tipo: "Arquivamento definitivo dos autos",
    },
  ],
  // Mais páginas do que itens de propósito: é o que faz a paginação
  // aparecer na verificação visual. Sem isso ela nunca é desenhada.
  total: 25,
  total_paginas: 3,
};

const ATENDIMENTOS = {
  atendimentos: [
    {
      subgrupo_id: "sg-civel",
      atendimento_id: "at-1",
      assunto: "Revisão do contrato de locação",
      status: "Em andamento",
      criado_em: "2026-08-10T09:00:00+00:00",
      cliente_ids: ["cli-1"],
      // ⚠️ Acompanha `cliente_ids` na ordem. A API passou a resolver o nome
      // na leitura (25/08/2026); stub sem isto mostraria o id cru e a
      // verificação visual passaria assim mesmo. Mesma razão do `autor_nome`
      // nos registros abaixo e nas notificações: a tela deixou de traduzir
      // e-mail em apelido por conta própria.
      cliente_nomes: ["Construtora Alfa"],
      processo_numero: "00002668720218130559",
      registros: [
        {
          autor_id: "ana@argos.local",
          autor_nome: "Ana Paula",
          registrado_em: "2026-08-10T09:00:00+00:00",
          texto: "Cliente procurou o escritório para revisar a cláusula de reajuste.",
        },
        {
          autor_id: "joao@argos.local",
          autor_nome: "João Ribeiro",
          registrado_em: "2026-08-12T14:30:00+00:00",
          texto: "Enviei a minuta revisada por e-mail. Aguardando retorno.",
        },
      ],
    },
    {
      subgrupo_id: "sg-civel",
      atendimento_id: "at-2",
      assunto: "Dúvida sobre execução de sentença",
      status: "Fechado",
      criado_em: "2026-07-28T11:00:00+00:00",
      cliente_ids: ["cli-2"],
      cliente_nomes: ["Marina Duarte"],
      processo_numero: null,
      registros: [
        {
          autor_id: "ana@argos.local",
          autor_nome: "Ana Paula",
          registrado_em: "2026-07-28T11:00:00+00:00",
          texto: "Explicado o prazo de cumprimento voluntário.",
        },
      ],
    },
  ],
  total: 2,
  total_paginas: 1,
};

const AGORA = new Date();
const hMenos = (h) => new Date(AGORA.getTime() - h * 3600_000).toISOString();

/** O lançamento que a lista mostra primeiro e que o detalhe devolve.
 *
 * ⚠️ Um objeto só para os dois: a rota de detalhe devolve exatamente os
 * campos do item da lista -- conferido contra a API local --, e duas cópias
 * divergiriam no primeiro campo novo. */
const PRIMEIRO_LANCAMENTO = {
  lancamento_id: "lan-1", tipo: "honorario", descricao: "Honorários de êxito",
  valor_centavos: 250000, data_vencimento: "2026-09-25", natureza: "entrada",
  situacao: "aberto", conta_id: "ct-1", categoria_id: "cat-1", centro_id: "",
  cliente_id: "cli-2", cliente_nome: "Construtora Alfa", contraparte: "",
  subgrupo_id: "", numero_processo: "", atendimento_id: "", responsavel: "",
  documento_numero: "", parcela: "", rateio: [],
  criado_por: "ana@argos.local", criado_em: "2026-09-01T10:00:00+00:00",
};

const RESPOSTAS = [
  [
    /\/notificacoes/,
    () => ({
      notificacoes: [
        {
          usuario_id: "ana@argos.local", notificacao_id: "1787000000000003_a",
          tipo: "tarefa_atribuida", criado_em: hMenos(0.2), lida: false,
          autor: "joao@argos.local", autor_nome: "João Ribeiro", titulo: "Protocolar contestação", detalhe: "",
          subgrupo_id: "sg-civel", alvo_tipo: "tarefa", alvo_id: "t1",
        },
        {
          usuario_id: "ana@argos.local", notificacao_id: "1787000000000002_b",
          tipo: "tarefa_movida", criado_em: hMenos(3), lida: false,
          autor: "joao@argos.local", autor_nome: "João Ribeiro", titulo: "Preparar audiência", detalhe: "Fazendo",
          subgrupo_id: "sg-civel", alvo_tipo: "tarefa", alvo_id: "t4",
        },
        {
          usuario_id: "ana@argos.local", notificacao_id: "1787000000000001_c",
          // Lembrete vem do robô: sem autor, e portanto sem `autor_nome`.
          tipo: "lembrete", criado_em: hMenos(20), lida: true, autor: "",
          titulo: "Processo 0000266-87.2021.8.13.0559", detalhe: "Prazo final é amanhã",
          subgrupo_id: "sg-civel", alvo_tipo: "processo", alvo_id: "00002668720218130559",
        },
      ],
      nao_lidas: 2,
      limite: 50,
    }),
  ],
  // Antes de tudo: o caminho contém "/grupos", e um padrão mais largo
  // capturaria isto e devolveria a lista de grupos pra aba de Configurações.
  [
    /\/grupos\/configuracoes/,
    () => ({
      nome: "Silva Advogados",
      nome_tamanho_maximo: 120,
      dias_para_arquivar: 7,
      dias_para_arquivar_minimo: 1,
      dias_para_arquivar_maximo: 365,
      dias_para_arquivar_padrao: 7,
    }),
  ],
  [/\/situacoes/, () => opcoes(SITUACOES, "situacao")],
  [/\/fases/, () => opcoes(FASES, "fase")],
  /* 🔴 Os quatro abaixo têm a forma CAPTURADA da API rodando em
     `yarn offline`, e não deduzida da tela. Medi: a versão que escrevi de
     cabeça errava em quase todo campo -- `inscricoes_oab` no lugar de
     `numero_oab`/`uf_oab`, `documento` no lugar de `cpf_cnpj`, endereço
     aninhado onde a resposta traz campos planos, e três campos (`grupo_id`,
     `grupo_nome`, `telefone`) que o `/me` simplesmente não devolve.
     Stub inventado mede uma tela que não existe. */
  [
    /\/me$/,
    () => ({
      email: "ana@argos.local",
      apelido: "Ana Paula",
      papel: "admin",
      numero_oab: null,
      uf_oab: null,
      importacao_automatica: false,
      subgrupos_destino: [],
      subgrupos: [
        { id: "sg-civel", nome: "Cível" },
        { id: "sg-fam", nome: "Família" },
        { id: "sg-trab", nome: "Trabalhista" },
      ],
    }),
  ],
  /* 🔴 **As duas tabelas mais largas do app, e as duas últimas a ganhar
     régua.** O Fluxo rola 1544px dentro da própria área e o documento da
     fatura estourava 57px em 360 -- nenhum dos dois era medido, porque a
     régua não visitava nem `/financeiro?aba=fluxo` nem
     `/financeiro/faturas/:id`. Estes dois stubs são o que faltava para
     visitar.

     ⚠️ A FORMA foi capturada da API local rodando (`yarn offline`), como a
     dos quatro acima -- e não deduzida dos tipos. O VOLUME é que foi
     cortado: doze meses de verdade, porque a largura da tabela do fluxo vem
     deles, e seis categorias em vez de doze, porque essas só acrescentam
     linhas. */
  [
    /\/financeiro\/fluxo-de-caixa/,
    () => {
      const meses = Array.from({ length: 12 }, (_, i) => `2026-${String(i + 1).padStart(2, "0")}`);
      /* Um valor por mês, variando: zero em todos faria as colunas terem a
         largura do "R$ 0,00" e a tabela mediria menos do que mede. */
      const porMes = (base) =>
        Object.fromEntries(meses.map((m, i) => [m, base * (i + 1) * 137]));
      const categoria = (id, nome, natureza, cor, base) => ({
        categoria_id: id,
        nome,
        natureza,
        cor,
        por_mes: porMes(base),
        total_centavos: Object.values(porMes(base)).reduce((a, b) => a + b, 0),
      });
      return {
        meses,
        saldo_disponivel: true,
        linhas: [
          categoria("cat-1", "Honorários contratuais", "entrada", "#1f9d55", 1900),
          categoria("cat-3", "Adiantamento de despesas", "entrada", "#4d7c0f", 420),
          categoria("cat-5", "Rendimentos financeiros", "entrada", "#0f766e", 90),
          categoria("cat-2", "Custas processuais", "saida", "#d64550", 310),
          categoria("cat-4", "Despesas administrativas", "saida", "#b45309", 760),
          categoria("cat-6", "Impostos sobre honorários", "saida", "#9f1239", 540),
        ],
        entradas_por_mes: porMes(2410),
        saidas_por_mes: porMes(1610),
        entradas_realizadas_por_mes: porMes(1800),
        saidas_realizadas_por_mes: porMes(1200),
        entradas_previstas_por_mes: porMes(610),
        saidas_previstas_por_mes: porMes(410),
        transferencias_por_mes: porMes(0),
        aberturas_de_conta_por_mes: porMes(0),
        saldo_anterior_por_mes: porMes(3300),
        saldo_do_periodo_por_mes: porMes(800),
        saldo_final_por_mes: porMes(4100),
      };
    },
  ],
  /* ⚠️ ANTES de `/clientes/:id` e de qualquer padrão mais largo, e depois
     de `a-faturar`/`nao-cobradas`, que também começam com `/faturas/`. */
  [
    /\/faturas\/(?!a-faturar|nao-cobradas)[^/]+$/,
    () => ({
      grupo_id: "grupo-demo",
      fatura_id: "fat-1",
      numero: "2026-0052",
      cliente_id: "cli-2",
      lancamento_ids: ["lan-1", "lan-2", "lan-3"],
      despesa_ids: ["lan-3"],
      reembolso_id: "lan-3",
      valor_total_centavos: 289700,
      data_vencimento: "2026-12-28",
      situacao: "paga",
      pago_em: "2026-09-05",
      criado_por: "ana@argos.local",
      criado_em: "2026-09-14T20:47:05.230356+00:00",
      sequencia: 389,
      ordem: "2026-12-28\u00002026-0052",
      cliente_ordem: "cli-2#2026-12-28#fat-1",
      lancamentos: [
        {
          grupo_id: "grupo-demo", lancamento_id: "lan-1", tipo: "honorario",
          descricao: "Honorários contratuais da fase de conhecimento",
          valor_centavos: 250000, data_vencimento: "2026-12-28",
          criado_por: "ana@argos.local", criado_em: "2026-09-14T20:47:05+00:00",
          sequencia: 388, data_efetivacao: "2026-09-05", conta_id: "ct-1",
          conta_origem_id: "", conta_destino_id: "", categoria_id: "cat-1",
          centro_id: "", cliente_id: "cli-2", contraparte: "", subgrupo_id: "",
          numero_processo: "", atendimento_id: "", responsavel: "",
          documento_numero: "", parcela: "", rateio: [],
          fatura_id: "fat-1", vencimento_ordem: "2026-12-28#lan-1",
          natureza: "entrada", situacao: "efetivado",
        },
        {
          grupo_id: "grupo-demo", lancamento_id: "lan-2", tipo: "honorario",
          descricao: "Honorários de êxito",
          valor_centavos: 32000, data_vencimento: "2026-12-28",
          criado_por: "ana@argos.local", criado_em: "2026-09-14T20:47:06+00:00",
          sequencia: 389, data_efetivacao: "2026-09-05", conta_id: "ct-1",
          conta_origem_id: "", conta_destino_id: "", categoria_id: "cat-1",
          centro_id: "", cliente_id: "cli-2", contraparte: "", subgrupo_id: "",
          numero_processo: "", atendimento_id: "", responsavel: "",
          documento_numero: "", parcela: "", rateio: [],
          fatura_id: "fat-1", vencimento_ordem: "2026-12-28#lan-2",
          natureza: "entrada", situacao: "efetivado",
        },
        /* A linha de reembolso: `natureza: "saida"` é o que faz a tela
           escrever "Reembolso de despesa" embaixo da descrição. */
        {
          grupo_id: "grupo-demo", lancamento_id: "lan-3", tipo: "saida",
          descricao: "Reembolso de despesas",
          valor_centavos: 7700, data_vencimento: "2026-12-28",
          criado_por: "ana@argos.local", criado_em: "2026-09-14T20:47:07+00:00",
          sequencia: 390, data_efetivacao: "2026-09-05", conta_id: "ct-1",
          conta_origem_id: "", conta_destino_id: "", categoria_id: "cat-2",
          centro_id: "", cliente_id: "cli-2", contraparte: "", subgrupo_id: "",
          numero_processo: "", atendimento_id: "", responsavel: "",
          documento_numero: "", parcela: "", rateio: [],
          fatura_id: "fat-1", vencimento_ordem: "2026-12-28#lan-3",
          natureza: "saida", situacao: "efetivado",
        },
      ],
    }),
  ],
  [
    /\/financeiro\/catalogo/,
    () => ({
      contas: [
        { conta_id: "ct-1", nome: "Banco do Brasil - movimento", tipo: "corrente",
          banco: "001", agencia: "1234-5", numero: "45678-9",
          inicio: "2026-01-01", saldo_inicial_centavos: 0, saldo_centavos: 535500, ativa: true },
      ],
      categorias: [
        { categoria_id: "cat-1", nome: "Honorários contratuais", natureza: "entrada", cor: "#1f9d55", agrupador_id: "", ativa: true },
        { categoria_id: "cat-2", nome: "Custas processuais", natureza: "saida", cor: "#d64550", agrupador_id: "", ativa: true },
      ],
      centros_de_custo: [{ centro_id: "cc-1", nome: "Cível", ativo: true }],
      conta_padrao_id: "ct-1",
      cores_disponiveis: ["#1f9d55", "#4d7c0f", "#d64550"],
    }),
  ],
  /* ⚠️ ANTES da listagem, pelo mesmo motivo do detalhe de cliente logo
     abaixo: `/\/lancamentos/` casa com o detalhe também, e devolver o
     envelope da lista no lugar do item deixa a tela de detalhe sem
     `descricao`.

     🔴 O detalhe devolve os MESMOS campos do item da lista -- conferido
     contra a API local: a diferença entre as duas respostas é vazia. Por
     isso ele reaproveita o primeiro da lista em vez de inventar um segundo
     objeto que divergiria no primeiro ajuste. */
  [/\/lancamentos\/[^/]+\/serie$/, () => ({ abertos_a_frente: 0 })],
  [/\/lancamentos\/[^/]+$/, () => PRIMEIRO_LANCAMENTO],
  [
    /\/lancamentos/,
    () => {
      const lancamentos = [
        PRIMEIRO_LANCAMENTO,
        { lancamento_id: "lan-2", tipo: "saida", descricao: "Custas processuais",
          valor_centavos: 32000, data_vencimento: "2026-09-10", natureza: "saida",
          situacao: "atrasado", conta_id: "ct-1", categoria_id: "cat-2", centro_id: "",
          cliente_id: "", cliente_nome: "", contraparte: "Transportes Beta",
          subgrupo_id: "", numero_processo: "", atendimento_id: "", responsavel: "",
          documento_numero: "", parcela: "", rateio: [],
          criado_por: "ana@argos.local", criado_em: "2026-09-01T10:00:00+00:00" },
      ];
      return {
        lancamentos, pagina: 1, tamanho_pagina: 10, total: 2, total_paginas: 1,
        totais: {
          a_receber_centavos: 250000, a_receber_quantidade: 1,
          a_pagar_centavos: 32000, a_pagar_quantidade: 1,
          atrasado_centavos: 32000, atrasado_quantidade: 1,
        },
      };
    },
  ],
  /* ⚠️ ANTES da listagem: `/\/clientes/` casa com o detalhe também, e
     devolver o envelope da lista no lugar do item quebrava a tela de
     detalhe com "reading 'trim'" -- que não parece erro de stub. */
  [
    /\/clientes\/[^/]+$/,
    (url) => ({
      cliente_id: url.pathname.split("/").pop(),
      nome: "Construtora Alfa",
      cpf_cnpj: "12.345.678/0001-90",
      telefone: "7133334444",
      email: "contato@alfa.com.br",
      cep: "40000-000",
      logradouro: "Av. Tancredo Neves",
      numero: "1000",
      complemento: "Sala 10",
      bairro: "Caminho das Árvores",
      cidade: "Salvador",
      uf: "BA",
      arquivado_em: null,
      arquivado_por: null,
      processos: 2,
      criado_por: "ana@argos.local",
      criado_em: "2026-01-10T10:00:00+00:00",
    }),
  ],
  [
    /\/clientes/,
    (url) => {
      const todos = CLIENTES.map((nome, i) => ({ cliente_id: `cli-${i + 1}`, nome }));
      const achados = filtrar(todos, url, "nome");
      return { clientes: achados, total: achados.length };
    },
  ],
  // Precisa vir ANTES de `/processos`: o detalhe é `/processos/{n}/detalhes`.
  [
    /\/detalhes/,
    () => ({
      numero_processo: PROCESSOS.processos[0].numero_processo,
      processos: [{ ...PROCESSOS.processos[0], subgrupo_id: "sg-civel" }],
      // Sete de propósito: com cinco por página, a paginação aparece na
      // verificação visual.
      /* ⚠️ `tem_envio` e `lido` na proporção do real: as duas primeiras
         avisadas e não lidas, a terceira avisada e lida, e as quatro
         restantes SEM os campos -- movimentação que nunca notificou
         ninguém, que em produção é a maioria (9 de 73, medido em
         26/08/2026). É essa mistura que exercita o destaque e, mais
         importante, a regra de que ausência não é "não lida". */
      comunicacoes: Array.from({ length: 7 }, (_, i) => ({
        comunicacao_id: `c${i + 1}`,
        tipo_comunicacao: ["Intimação", "Despacho", "Sentença"][i % 3],
        data_disponibilizacao: `2026-08-${String(18 - i).padStart(2, "0")}`,
        nome_orgao: "TJMG · 2ª Vara Cível",
        texto: `<p>Movimentação ${i + 1}: fica a parte intimada a se manifestar no prazo legal.</p>`,
        ...(i < 3 ? { tem_envio: true, lido: i === 2 } : {}),
      })),
    }),
  ],
  [/\/processos/, () => PROCESSOS],
  // Antes de /atendimentos: o caminho do detalhe contém os dois, e o padrão
  // da listagem casaria com ele devolvendo um envelope no lugar do item.
  /* 🔴 **A linha do tempo do atendimento.** Faltava, e a régua do mobile
     achou: sem ela o catch-all devolvia `{}`, o `flatMap` da consulta
     infinita virava `[undefined]` e o componente derrubava a PÁGINA inteira
     com "Cannot read properties of undefined (reading 'registro_id')".
     Nenhuma das três abas do atendimento renderizava.

     ⚠️ ANTES do detalhe logo abaixo -- aquele padrão termina em `$`, mas a
     ordem deixa a intenção legível. */
  [
    /\/atendimentos\/[^/]+\/registros/,
    () => ({
      registros: [
        { registro_id: "reg-1", autor_id: "ana@argos.local", autor_nome: "Ana Paula",
          registrado_em: "2026-09-10T14:30:00+00:00",
          texto: "Cliente retornou pedindo revisão da cláusula de reajuste." },
        { registro_id: "reg-2", autor_id: "chefe@argos.local", autor_nome: "Carlos",
          registrado_em: "2026-09-11T09:05:00+00:00",
          texto: "Minuta revisada enviada por e-mail. Aguardando retorno." },
      ],
      quantidade: 2,
      anteriores: null,
    }),
  ],
  [
    /\/subgrupos\/[^/]+\/atendimentos\/[^/]+$/,
    () => ATENDIMENTOS.atendimentos[0],
  ],
  [/\/atendimentos/, () => ATENDIMENTOS],
  [
    /\/tarefas/,
    () => ({
      // Datas relativas a hoje: a etiqueta de prazo mostra "Hoje",
      // "Amanhã" e "Ontem", e com data fixa a verificação visual só
      // mostraria data crua depois que a data passasse.
      tarefas: [
        { tarefa_id: "t1", subgrupo_id: "sg-civel", titulo: "Protocolar réplica", data: emDias(-2), coluna_id: "c1", coluna_nome: "A Fazer", esta_concluida: false, prioridade: "Alta", processo_numero: "00002668720218130559" },
        { tarefa_id: "t2", subgrupo_id: "sg-civel", titulo: "Conferir prazo de contestação", data: emDias(0), coluna_id: "c1", coluna_nome: "A Fazer", esta_concluida: false, prioridade: "Média" },
        { tarefa_id: "t3", subgrupo_id: "sg-civel", titulo: "Juntar procuração", data: emDias(1), coluna_id: "c1", coluna_nome: "A Fazer", esta_concluida: false, prioridade: "Baixa" },
        { tarefa_id: "t4", subgrupo_id: "sg-civel", titulo: "Preparar audiência", data: emDias(6), coluna_id: "c2", coluna_nome: "Concluído", esta_concluida: true, prioridade: "Alta", responsavel_id: "ana@argos.local" },
        { tarefa_id: "t5", subgrupo_id: "sg-civel", titulo: "Arquivar cópia assinada", data: emDias(3), coluna_id: "c3", coluna_nome: "A Fazer", esta_concluida: false, prioridade: "Baixa", responsavel_id: "joao@argos.local" },
      ],
      total: 5,
      total_paginas: 1,
    }),
  ],
  [
    /\/resumo/,
    () => ({
      a_verificar_ate_hoje: 3, prazo_final_em_7_dias: 5, tarefas_atrasadas: 2,
      tarefas_sem_responsavel: 4, envios_com_falha: 1,
      minhas_concluidas: 12, minhas_atrasadas: 2, minhas_a_concluir: 7,
      processos_total: 25, atendimentos_em_andamento: 3, movimentacoes_7_dias: 9,
    }),
  ],
  [
    /\/subgrupos\/[^/]+\/quadro/,
    () => ({
      colunas: [
        { subgrupo_id: "sg-civel", coluna_id: "c1", nome: "A Fazer", ordem: 1, e_conclusao: false },
        { subgrupo_id: "sg-civel", coluna_id: "c2", nome: "Fazendo", ordem: 2, e_conclusao: false },
        { subgrupo_id: "sg-civel", coluna_id: "c3", nome: "Concluído", ordem: 3, e_conclusao: true },
        // O quadro NÃO mostra esta; o modal de editar, sim.
        { subgrupo_id: "sg-civel", coluna_id: "c4", nome: "Arquivado", ordem: 4, e_conclusao: false, e_arquivado: true },
      ],
    }),
  ],
  [
    /\/historico/,
    () => ({
      historico: [
        { numero_processo: "00002668720218130559", enviado_em: "2026-08-22T14:02:13Z", assunto: "Nova movimentação", tipo_comunicacao: "Intimação", nome_orgao: "Vara Única de Carmo do Rio Claro", destinatarios: ["ana@argos.local"], comunicacao_id: "c1", tipo_envio: "movimentacao" },
        { numero_processo: "50004349620248130559", enviado_em: "2026-08-22T09:15:40Z", assunto: "Prazo em 2 dias", tipo_envio: "lembrete", destinatarios: ["joao@argos.local"], falhou: true, erro: "SMTP 550: caixa de entrada cheia" },
      ],
      total: 2,
      total_paginas: 1,
    }),
  ],
  [
    /\/grupos\/membros/,
    (url) => {
      // ⚠️ Com `subgrupo_nomes`: a rota passou a devolvê-lo (25/08/2026), pra
      // MembrosPage não precisar do catálogo de subgrupos só pra rotular.
      const todos = [
        { email: "ana@argos.local", apelido: "Ana Paula", papel: "admin", subgrupos: ["sg-civel"], subgrupo_nomes: ["Cível"] },
        { email: "joao@argos.local", apelido: "João Meireles", papel: "manager", subgrupos: ["sg-civel"], subgrupo_nomes: ["Cível"] },
        { email: "marina@argos.local", apelido: "Marina Duarte", papel: "user", subgrupos: ["sg-civel", "sg-trab"], subgrupo_nomes: ["Cível", "Trabalhista"] },
      ];
      const achados = filtrar(todos, url, "apelido");
      return { membros: achados, total: achados.length, total_paginas: 1 };
    },
  ],
  [
    // ⚠️ Com `apelido`: a rota passou a devolvê-lo (25/08/2026), pra tela não
    // precisar de `GET /grupos/membros` só pra traduzir e-mail em nome. Stub
    // sem apelido faria a verificação visual mostrar e-mail cru e passar.
    /\/subgrupos\/sg-civel\/membros/,
    () => ({
      membros: [
        { email: "ana@argos.local", apelido: "Ana Paula" },
        { email: "joao@argos.local", apelido: "João Meireles" },
        { email: "marina@argos.local", apelido: "Marina Duarte" },
      ],
    }),
  ],
  [
    /\/subgrupos\/[^/]+\/membros/,
    () => ({ membros: [] }),
  ],
  [
    /\/subgrupos\/sg-civel\/conteudo/,
    () => ({ membros: 3, processos: 6, tarefas: 11, atendimentos: 8 }),
  ],
  [
    /\/subgrupos\/[^/]+\/conteudo/,
    () => ({ membros: 0, processos: 0, tarefas: 0, atendimentos: 0 }),
  ],
  [
    /\/subgrupos|\/grupos/,
    (url) => {
      // `membros`/`colunas` vêm da própria listagem (contagens derivadas):
      // a linha da tela de Grupo mostra "N membros · N colunas".
      // Em ordem alfabética, como o servidor passou a devolver.
      const todos = [
        { subgrupo_id: "sg-civel", nome: "Cível", membros: 3, colunas: 3 },
        { subgrupo_id: "sg-fam", nome: "Família", membros: 2, colunas: 3 },
        { subgrupo_id: "sg-trab", nome: "Trabalhista", membros: 1, colunas: 4 },
      ];
      const achados = filtrar(todos, url, "nome");
      return { grupos: [], subgrupos: achados, total: achados.length, total_paginas: 1 };
    },
  ],
];

/** Registra os stubs num contexto do Playwright.
 *
 * ⚠️ Filtra por `resourceType`, e não só pela URL. `/processos` é ao mesmo
 * tempo uma rota da API e uma rota do react-router: casando só pelo
 * caminho, o próprio HTML da página era respondido com JSON e a tela
 * renderizava o payload cru.
 *
 * O que não casar com nada responde `{}` em vez de sair pra internet -- uma
 * chamada esquecida vira tela vazia, não um screenshot travado na rede.
 */
/** Data relativa a hoje, em `aaaa-mm-dd`. Local, nunca UTC. */
function emDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export async function instalarStubs(contexto) {
  await contexto.route("**/*", (rota) => {
    const requisicao = rota.request();
    if (requisicao.resourceType() !== "fetch" && requisicao.resourceType() !== "xhr") {
      return rota.fallback();
    }
    const caminho = new URL(requisicao.url()).pathname;
    const achado = RESPOSTAS.find(([padrao]) => padrao.test(caminho));
    /* A URL INTEIRA, não só o caminho: quem responde precisa da query pra
       honrar `busca` -- um stub que a ignora deixa a verificação visual
       passar com o filtro quebrado. */
    return rota.fulfill({ json: achado ? achado[1](new URL(requisicao.url())) : {} });
  });
}

/** Sessão falsa no localStorage. Como toda a rede é interceptada, o token
 * não precisa ser válido -- só precisa existir, porque `estaAutenticado()`
 * exige access + refresh + expiração. */
export async function fingirSessao(contexto) {
  await contexto.addInitScript(() => {
    localStorage.setItem("pje-monitor-access-token", "demo");
    localStorage.setItem("pje-monitor-refresh-token", "demo");
    localStorage.setItem("pje-monitor-expira-em", String(Date.now() + 3600_000));
    localStorage.setItem("pje-monitor-email", "ana@argos.local");
    localStorage.setItem("pje-monitor-apelido", "Ana Paula");
    localStorage.setItem("pje-monitor-papel", "admin");
    // Sem o grupo, a consulta de subgrupos nem sai -- e o modal de novo
    // processo abre no estado vazio ("crie um subgrupo primeiro").
    localStorage.setItem("pje-monitor-grupo-id", "grupo-demo");
  });
}
