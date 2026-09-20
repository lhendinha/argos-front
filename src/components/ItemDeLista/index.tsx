import { Box, Flex, Text } from "@chakra-ui/react";

import { BotaoNu } from "../BotaoNu";
import type { ItemDeListaProps } from "./types";

/** Um item clicável de várias linhas dentro de um cartão de lista -- a forma
 * que a linha de tabela assume onde não há largura para colunas.
 *
 * 🔴 **Compartimentos, e não `children`.** A primeira versão aceitava
 * conteúdo livre, e o resultado foi medido: três recuos horizontais (10, 14
 * e 18), dois tamanhos de identificador (14 e 13.5), dois pesos (700 e 800)
 * e uma lista que começava pela data em vez do nome. Nada disso era proibido
 * -- por isso aconteceu. Aqui cada pedaço tem tipo, lugar e medida, e quem
 * chama escolhe o QUE, nunca o COMO.
 *
 * 🔴 **O rodapé não tem divisória.** Ela existia só em Processos, e pô-la em
 * todas foi a primeira ideia -- desenhada e descartada olhando: com quatro
 * clientes na tela eram oito riscos, a do rodapé competindo com a que separa
 * os itens, e a lista virava grade. O rodapé já se separa por tamanho e cor,
 * 12px em `fg.subtle` contra 14px/700 em `fg`, que é o recurso que o resto do
 * sistema usa.
 *
 * 🔴 **Divisória, e não cartão próprio.** Estes itens vivem DENTRO do
 * `CartaoDeTabela`, que já é um cartão branco com borda: dar borda a cada um
 * empilharia cartão dentro de cartão. É a mesma forma que `LinhaDeAtendimento`
 * e o Histórico já usam, e é o que mantém as listas do sistema parecidas
 * entre si.
 *
 * ⚠️ `<button>` de verdade, e não uma `div` com `onClick`: a linha de tabela
 * que ele substitui é alcançável por Tab e responde a Enter, e perder isso
 * no celular deixaria a lista inteira fora do alcance de quem navega por
 * teclado -- que existe no celular, em teclado acoplado e em leitor de tela.
 *
 * 🔴 **O item NÃO é um botão que envolve tudo -- é uma linha com uma camada
 * que abre.** O botão de abrir cobre a linha por um `::after` esticado, e
 * quem precisa ser tocável por conta própria sobe acima dela com
 * `position: relative`. Foi a etiqueta de subgrupo que exigiu isto: ela
 * passou a ABRIR a lista quando resume, e `<button>` dentro de `<button>` é
 * inválido -- o navegador fecha o de fora sozinho, e o toque na pílula
 * abriria o registro. É a mesma parede que criou `acoes` e `selecao`, agora
 * resolvida por dentro em vez de por exceção.
 *
 * ⚠️ O anel de foco é desenhado NO `::after`, não no texto: ele marca a linha
 * inteira, que é o que o botão de fato aciona.
 *
 * ⚠️ `selecao` e `acoes` ficam FORA do botão -- ver os dois no `types`.
 *
 * ⚠️ Difere de `LinhaDeLista`: aquele é uma fileira horizontal de UMA linha,
 * com ícone e ações, e não é clicável.
 */
export default function ItemDeLista({
  onAbrir,
  rotulo,
  selecao,
  destacado,
  identificador,
  identificadorMono,
  idDoIdentificador,
  apoio,
  apoioMono,
  valor,
  etiquetas,
  rodape,
  acoes,
}: ItemDeListaProps) {
  return (
    <Flex
      position="relative"
      align={selecao ? "flex-start" : "center"}
      gap="10px"
      bg={destacado ? "brand.faint" : undefined}
      _hover={{ bg: destacado ? "bg.brand.subtle" : "bg.canvas" }}
      borderBottomWidth="1px"
      borderBottomStyle="solid"
      borderBottomColor="border.subtle"
      _last={{ borderBottomWidth: 0 }}
    >
      {selecao && (
        /* 🔴 O alvo de 44px envolve a caixa em vez de inchá-la: o quadrado
           desenhado continua com 20px, e é a área em volta que cresce. Mesmo
           recurso dos botões de concluir e de assumir. */
        <Flex
          position="relative"
          zIndex="1"
          flex="0 0 auto"
          minW="44px"
          minH="44px"
          align="center"
          justify="center"
          pl="8px"
        >
          {selecao}
        </Flex>
      )}

      <Box flex="1 1 auto" minW="0" p={selecao ? "14px 14px 14px 0" : "14px"}>
        <Flex align="flex-start" justify="space-between" gap="12px" minW="0">
          <BotaoNu
            type="button"
            id={idDoIdentificador}
            onClick={onAbrir}
            aria-label={rotulo}
            display="block"
            textAlign="left"
            fontSize="14px"
            fontWeight="700"
            lineHeight="1.35"
            color="fg"
            fontFamily={identificadorMono ? "mono" : undefined}
            minW="0"
            _after={{ content: '""', position: "absolute", inset: 0 }}
            _focusVisible={{
              outline: "none",
              "&::after": {
                outline: "2px solid",
                outlineColor: "fg.brand",
                outlineOffset: "-2px",
              },
            }}
          >
            {identificador}
          </BotaoNu>
          {valor && (
            <Flex direction="column" align="flex-end" gap="1px" flex="0 0 auto">
              <Text
                as="span"
                fontSize="14px"
                fontWeight="700"
                fontFamily="mono"
                whiteSpace="nowrap"
                color={valor.cor ?? "fg"}
              >
                {valor.texto}
              </Text>
              {valor.sub && (
                <Text as="span" fontSize="11px" color="fg.muted" whiteSpace="nowrap">
                  {valor.sub}
                </Text>
              )}
            </Flex>
          )}
        </Flex>

        {apoio && (
          <Text
            as="span"
            display="block"
            fontSize="12.5px"
            color="fg.muted"
            mt="3px"
            fontFamily={apoioMono ? "mono" : undefined}
            truncate
          >
            {apoio}
          </Text>
        )}

        {etiquetas && (
          <Flex wrap="wrap" gap="6px" mt="9px" minW="0">
            {etiquetas}
          </Flex>
        )}

        {/* O rodapé só existe quando há o que pôr nele: um traço e um vazio
            gastariam uma linha para dizer nada. */}
        {rodape && (rodape.texto || rodape.destaque) && (
          <Flex align="center" justify="space-between" gap="10px" mt="8px" minW="0">
            <Text
              as="span"
              fontSize="12px"
              color="fg.subtle"
              fontFamily={rodape.mono ? "mono" : undefined}
              truncate
              minW="0"
            >
              {rodape.texto}
            </Text>
            {rodape.destaque && (
              <Box as="span" flex="0 0 auto" fontSize="12px" color="fg.subtle">
                {rodape.destaque}
              </Box>
            )}
          </Flex>
        )}
      </Box>

      {acoes && (
        <Box position="relative" zIndex="1" flex="0 0 auto" pr="10px">
          {acoes}
        </Box>
      )}
    </Flex>
  );
}
