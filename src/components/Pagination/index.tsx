import { Flex, Text } from "@chakra-ui/react";
import { useEffect } from "react";

import { Select } from "../Select";
import NumeroPagina from "./NumeroPagina";
import SetaPagina from "./SetaPagina";
import { useLarguraEstreita } from "../../hooks/useLarguraEstreita";
import { LIMIAR_DA_PAGINACAO } from "../../constants";
import { numerosVisiveis } from "./numerosVisiveis";
import { TAMANHOS_PAGINA } from "../../constants";
import type { PaginationProps } from "./types";

/** Paginação real -- cada número é endereçável direto, então dá pra pular pra
 * qualquer página sem ter visitado as anteriores.
 *
 * ⚠️ O servidor lê a partição inteira e fatia em memória -- exato, e O(n)
 * por página pedida; NÃO é Query por intervalo de sequência. Aquele esquema
 * dependia do contador monotônico nunca decrementar, e com buracos por
 * exclusão itens antigos ficavam fora de NENHUMA página, embora contados no
 * total. Ver `api/PLANO_PAGINACAO.md`.
 *
 * 🔴 O que este componente promete continua valendo, e é o que restringe o
 * remédio lá: números clicáveis e "X de Y" exigem posição e total EXATOS, o
 * que descarta cursor sequencial.
 *
 * Medidas do artifact (`.pagination`). Com uma página só, a navegação some
 * mas o espaço dela fica: é o `justify="space-between"` que mantém o
 * seletor de tamanho encostado à direita, como lá.
 *
 * ⚠️ **Por que esta peça NÃO usa a paginação do Chakra**, conferido no
 * pacote instalado e não na documentação: o tema padrão não traz receita de
 * paginação -- a raiz renderiza botões sem uma linha de estilo, então o
 * visual continuaria sendo este CSS de qualquer jeito. Em troca vinham três
 * custos: rótulos em inglês, o texto de página em inglês, e uma régua de
 * números diferente da nossa em 104 das 210 combinações de 1 a 20 páginas
 * (a de lá mantém sete casas fixas; a nossa encolhe perto das pontas). E não
 * havia ganho de teclado: os itens são botões comuns, sem foco itinerante.
 * O que valia a pena de lá já está aqui -- o marco de navegação e o nome
 * falado de cada número.
 */
export default function Pagination({
  pagina,
  totalPaginas,
  total,
  tamanhoPagina,
  onMudarPagina,
  onMudarTamanho,
  tamanhos = TAMANHOS_PAGINA,
}: PaginationProps) {
  /** A barra some quando a lista não tem como ser paginada em tamanho
   * nenhum -- aí o "Por página" seria um controle sem efeito.
   *
   * ⚠️ O critério é o TOTAL, não o número de páginas. Com 30 itens em
   * "100 por página" cabe tudo numa página, mas o seletor precisa
   * continuar visível: é por ele que se volta pra 10. Escondendo por
   * `totalPaginas <= 1`, a pessoa ficava presa no tamanho que escolheu. */
  /** 🔴 Página que não existe volta para a primeira.
   *
   * Não é só URL digitada à mão (`?pagina=99` numa lista de 3 páginas): o
   * mesmo estado acontece por caminho legítimo -- filtrar estando na página 3
   * encolhe o conjunto, e a pessoa fica vendo uma tabela vazia enquanto a
   * contagem diz que há 45 itens.
   *
   * ⚠️ Mora AQUI, e não num hook por tela: este componente já recebe página,
   * total de páginas e o setter -- e é a única peça que todas as sete
   * listagens compartilham.
   *
   * ⚠️ Antes do `return null` de propósito: efeito depois de um retorno
   * antecipado não roda, e o caso a corrigir é justamente o de lista vazia.
   *
   * ⚠️ Só corrige com resposta na mão (`totalPaginas >= 1`): em voo o valor é
   * o da consulta anterior, e corrigir por ele devolveria a pessoa para a
   * página 1 no meio de uma navegação legítima. */
  useEffect(() => {
    if (totalPaginas >= 1 && pagina > totalPaginas) onMudarPagina(1);
  }, [pagina, totalPaginas, onMudarPagina]);

  /* 🔴 Do CONTAINER, e não da janela: a fileira mora dentro do cartão da
     lista, que encolhe quando o menu fixo aparece. E o limiar é o que a
     própria fileira pede: 328px de conteúdo não comportam sete alvos de
     44px mais duas setas. */
  const [medir, estreita] = useLarguraEstreita(LIMIAR_DA_PAGINACAO);

  const menorTamanho = Math.min(...tamanhos);
  if (total <= menorTamanho) return null;

  return (
    <Flex
      ref={medir}
      align="center"
      justify="space-between"
      gap="16px"
      p="14px 16px 10px"
      wrap="wrap"
    >
      {totalPaginas > 1 ? (
        /* ⚠️ `nav`, e não `div`: é marco de navegação, então o leitor de tela
           pula direto para cá sem varrer a lista inteira acima. O rótulo
           desempata das outras navegações da página -- o menu lateral também
           é `nav`. Só a TAG muda; a caixa continua o mesmo `Flex`. */
        <Flex as="nav" aria-label="Paginação" align="center" gap="4px">
          <SetaPagina
            direcao="anterior"
            desabilitado={pagina <= 1}
            onClick={() => onMudarPagina(pagina - 1)}
          />
          {/* 🔴 **No estreito, os números viram TEXTO.** Medido em Chrome
              real, num Android de 360px: com sete páginas a fileira pedia
              424px para 328 disponíveis, e a página inteira passava a rolar
              de lado -- `/financeiro` foi a 461. A conta é dos alvos de
              toque: sete números e duas setas, todos com 44px no apontador
              grosso, somam mais que a tela.

              ⚠️ **É o padrão que o próprio Chakra documenta** para telas
              pequenas (`Pagination.PageText`, "a compact pagination... useful
              for mobile views"): trocar a fileira de botões por uma frase.

              ⚠️ Duas tentativas piores, medidas antes desta. Deixar quebrar
              em duas linhas cabia mas lia mal -- "1 2 3 4" em cima, "5 6 7"
              embaixo, setas boiando entre as duas. Encolher para três
              números com reticências cabia e ainda carregava alvos de 44px
              que o polegar erra por estarem colados.

              ⚠️ O texto NÃO cresce com o total, que era a raiz: setenta
              páginas ocupam o mesmo que sete. */}
          {estreita ? (
            <Text px="10px" fontSize="13px" fontWeight="700" color="fg" whiteSpace="nowrap">
              Página {pagina} de {totalPaginas}
            </Text>
          ) : (
            <Flex align="center" gap="2px" mx="4px">
              {numerosVisiveis(pagina, totalPaginas).map((n, i) =>
                n === "..." ? (
                  <Text key={`reticencias-${i}`} px="4px" fontSize="13px" color="fg.subtle">
                    …
                  </Text>
                ) : (
                  <NumeroPagina
                    key={n}
                    numero={n}
                    atual={n === pagina}
                    ultima={n === totalPaginas}
                    onClick={() => onMudarPagina(n)}
                  />
                ),
              )}
            </Flex>
          )}
          <SetaPagina
            direcao="proxima"
            desabilitado={pagina >= totalPaginas}
            onClick={() => onMudarPagina(pagina + 1)}
          />
        </Flex>
      ) : (
        <div />
      )}

      <Flex align="center" gap="8px" fontSize="12.5px" color="fg.muted" fontWeight="600">
        <label htmlFor="tamanho-pagina">Por página</label>
        <Select
          id="tamanho-pagina"
          compacto
          largura="72px"
          opcoes={tamanhos.map((t) => ({ value: String(t), label: String(t) }))}
          valor={String(tamanhoPagina)}
          onMudar={(v) => onMudarTamanho(Number(v))}
        />
      </Flex>
    </Flex>
  );
}
