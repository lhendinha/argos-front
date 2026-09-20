import { Box } from "@chakra-ui/react";

import { BotaoQuadrado, IconeOlho, IconeOlhoCortado, ItemDeLista } from "../../../../components";
import type { ItemDoCatalogoProps } from "./types";

/** A linha do catálogo do Financeiro onde não cabem as colunas -- conta,
 * categoria ou centro de custo.
 *
 * ⚠️ **Semântica, e não células.** `LinhaDoCatalogo` recebe `children` porque
 * cada lista monta as SUAS células; aqui quem chama diz o que é nome, o que é
 * apoio e o que é valor, e o `ItemDeLista` decide o desenho. As duas formas
 * escolhem o mesmo dado por caminhos diferentes -- é o preço de ter duas
 * árvores, e é o que a fase inteira já paga em Processos e Documentos.
 *
 * ⚠️ **O quadradinho de cor da categoria NÃO vem para cá.** Ele é
 * `aria-hidden` na tabela -- decoração --, e o compartimento da frente custa
 * 44px em toda linha. Aquela coluna é para o que se toca ou se varre, e cor
 * decorativa não é nenhum dos dois.
 */
export default function ItemDoCatalogo({
  nome,
  ativo,
  onAbrir,
  onAlternarAtivo,
  ocupada = false,
  apoio,
  etiquetas,
  valor,
}: ItemDoCatalogoProps) {
  return (
    /* O arquivado desbota, como na tabela: a linha continua legível e diz
       que saiu de uso sem precisar de uma etiqueta a mais. */
    <Box opacity={ativo ? 1 : 0.55}>
      <ItemDeLista
        onAbrir={() => onAbrir?.()}
        rotulo={nome}
        identificador={nome}
        apoio={apoio}
        valor={valor}
        etiquetas={etiquetas}
        acoes={
          onAlternarAtivo ? (
            <BotaoQuadrado
              type="button"
              tom={ativo ? "perigo" : "neutro"}
              title={ativo ? "Arquivar" : "Reativar"}
              aria-label={`${ativo ? "Arquivar" : "Reativar"} ${nome}`}
              disabled={ocupada}
              /* O item inteiro já abre a edição -- sem isto, o toque no botão
                 dispararia as duas coisas. */
              onClick={(e) => {
                e.stopPropagation();
                onAlternarAtivo();
              }}
              /* 🔴 16px no SVG: `IconeOlho` e `IconeOlhoCortado` NÃO trazem
                 tamanho próprio. Sem a regra eles viram 32px e a linha incha
                 -- o mesmo que `LinhaDoCatalogo` já precisou declarar. */
              css={{ "& svg": { width: "16px", height: "16px", flex: "0 0 auto" } }}
            >
              {ativo ? <IconeOlho /> : <IconeOlhoCortado />}
            </BotaoQuadrado>
          ) : undefined
        }
      />
    </Box>
  );
}
