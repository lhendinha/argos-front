import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, Text } from "@chakra-ui/react";

import { Botao, Campo, Cartao, Select } from "../../../../components";
import { useImportacaoPorOab } from "../../../../hooks/useImportacaoPorOab";
import { listarMembrosDoSubgrupo } from "../../../../services/api";
import { getEmail } from "../../../../services/auth";
import { qk } from "../../../../services/queryKeys";
import { resumoDaImportacao } from "../../../../utils/importacao";
import { MENSAGEM_SUBSTITUIDA } from "../../../../constants";
import AvisoDaImportacao from "../AvisoDaImportacao";
import ProgressoDaGravacao from "../ProgressoDaGravacao";
import BuscaEmAndamento from "../BuscaEmAndamento";
import FormularioDeOab from "../FormularioDeOab";
import PreviaDaImportacao from "../PreviaDaImportacao";
import type { ImportarPorOabProps } from "./types";

/** As duas etapas da importação, com a decisão humana no meio.
 *
 * 🔴 **Duas requisições, não uma.** A busca varre o PJe e guarda o resultado;
 * a pessoa confere; a confirmação grava. Juntar as duas cadastraria sem
 * ninguém ter olhado -- e 201 processos cadastrados por engano são 201 que
 * alguém apaga um a um.
 */
export default function ImportarPorOab({
  subgrupos,
  onFechar,
  onImportou,
}: ImportarPorOabProps) {
  const [escolhido, setSubgrupoId] = useState("");
  /* 🔴 Sem escolha, vale o PRIMEIRO da lista -- inclusive quando ela chega
     DEPOIS de o modal abrir. Guardar `subgrupos[0]` no `useState` congelava o
     vazio: com a lista ainda carregando, a busca ia para `/subgrupos//...` e a
     tela mostrava "Not Found" (visto no Chrome, com o offline recém-subido). */
  const subgrupoEscolhido = escolhido || (subgrupos[0]?.subgrupo_id ?? "");
  const meuEmail = getEmail() ?? "";
  const {
    etapa, previa, parcial, resultado, erro, progresso, semContato, subgrupoId, subgrupoTravado,
    buscar, importar, recomecar, descartar,
  } = useImportacaoPorOab(subgrupoEscolhido, meuEmail);

  /* ⚠️ A importação guardada num subgrupo que foi apagado não tem para onde ir.
     Decidido só DEPOIS de a lista chegar: vazia, ela ainda está carregando. */
  const subgrupoSumiu = subgrupos.length > 0 && !subgrupos.some((s) => s.subgrupo_id === subgrupoId);
  useEffect(() => {
    if (subgrupoTravado && subgrupoSumiu) {
      descartar("O subgrupo desta importação não existe mais. Escolha outro e busque de novo.");
    }
  }, [subgrupoTravado, subgrupoSumiu, descartar]);

  /* ⚠️ Sem contato não é erro: o trabalho segue no servidor, e a tela tenta de novo sozinha. */
  const avisoDeContato = semContato && (
    <AvisoDaImportacao titulo="Sem contato com o servidor">
      O trabalho continua lá; esta tela tenta de novo sozinha.
    </AvisoDaImportacao>
  );

  /* 🔴 Preciso saber se quem importa é MEMBRO do subgrupo escolhido.
   *
   * `manager`+ age em qualquer subgrupo do grupo sem participar dele, mas o
   * servidor só aceita como responsável quem é membro. Sem esta consulta a
   * tela pré-selecionaria alguém que a API vai recusar -- e a importação
   * inteira falharia depois de a pessoa esperar a busca. */
  const membrosQuery = useQuery({
    queryKey: qk.membrosDoSubgrupo(subgrupoId),
    queryFn: () => listarMembrosDoSubgrupo(subgrupoId),
    enabled: Boolean(subgrupoId),
  });
  const souMembro = useMemo(
    () =>
      Boolean(
        (membrosQuery.data as { membros?: { email: string }[] } | undefined)?.membros?.some(
          (m) => m.email === meuEmail,
        ),
      ),
    [membrosQuery.data, meuEmail],
  );

  /* A tela recarregada no meio da gravação: a prévia não voltou, mas a gravação sim. */
  if (etapa === "importando" && !previa) {
    return (
      <Cartao>
        {avisoDeContato}
        <Text fontSize="16px" fontWeight="800">
          Gravando os processos escolhidos
        </Text>
        <ProgressoDaGravacao progresso={progresso} />
      </Cartao>
    );
  }

  if (etapa === "previa" || etapa === "importando") {
    return (
      <Cartao>
        {avisoDeContato}
        <PreviaDaImportacao
          previa={previa!}
          subgrupoId={subgrupoId}
          meuEmail={meuEmail}
          souMembro={souMembro}
          importando={etapa === "importando"}
          progresso={progresso}
          onImportar={importar}
          onVoltar={recomecar}
        />
      </Cartao>
    );
  }

  if (etapa === "concluido" && resultado) {
    return (
      <Cartao>
        <Text fontSize="16px" fontWeight="800" mb="4px">
          {resumoDaImportacao(resultado)}
        </Text>
        {resultado.falharam.length > 0 && (
          /* ⚠️ Os NÚMEROS, não só a contagem: sem eles não há o que tentar de
             novo, e repetir a importação inteira é o que a pessoa faria. */
          <Text fontSize="13px" color="fg.muted" mb="10px">
            Não entraram: {resultado.falharam.join(", ")}. Buscar de novo tenta
            só esses.
          </Text>
        )}
        <Box display="flex" gap="9px" mt="12px" flexWrap="wrap">
          <Botao
            onClick={() => {
              /* Encerra a importação da aba: senão a página recarregada a reabriria. */
              recomecar();
              onImportou();
              onFechar();
            }}
          >
            Ver os processos
          </Botao>
          <Botao variante="ghost" onClick={recomecar}>
            Importar outra OAB
          </Botao>
        </Box>
      </Cartao>
    );
  }

  return (
    <Cartao>
      {avisoDeContato}
      {etapa === "vazio" && (
        <AvisoDaImportacao titulo={`Nenhum processo encontrado.`}>
          Isso acontece quando o número ou a UF estão trocados, ou quando a OAB
          não tem comunicações publicadas.
        </AvisoDaImportacao>
      )}

      {etapa === "erro" && (
        /* 🔴 Erro é diferente de "nada encontrado": aqui a mensagem vem do
           servidor, que distingue PJe fora do ar de recusa por excesso -- e
           as duas pedem espera diferente. */
        erro === MENSAGEM_SUBSTITUIDA ? (
          <AvisoDaImportacao titulo="Busca substituída">
            Você começou outra busca desta OAB, em outra aba ou aparelho. Acompanhe por lá.
          </AvisoDaImportacao>
        ) : (
          <AvisoDaImportacao titulo="Não deu para concluir">{erro}</AvisoDaImportacao>
        )
      )}

      <Campo
        rotulo="Subgrupo"
        para="subgrupo-importacao"
        obrigatorio
        dica="Onde os processos vão ficar."
      >
        <Select
          id="subgrupo-importacao"
          opcoes={subgrupos.map((s) => ({ value: s.subgrupo_id, label: s.nome }))}
          valor={subgrupoId}
          /* 🔴 Travado enquanto há importação: a prévia é do subgrupo da busca. */
          desabilitado={subgrupoTravado}
          /* ⚠️ Trocar de subgrupo REVALIDA quem pode ser responsável: um
             `manager` pode ser membro de Cível e não de Trabalhista, e a
             pré-seleção precisa acompanhar. A consulta de membros tem o
             subgrupo na chave, então isso sai de graça. */
          onMudar={setSubgrupoId}
        />
      </Campo>

      <FormularioDeOab
        buscando={etapa === "buscando"}
        onBuscar={(numeroOab, ufOab, periodo) => buscar(numeroOab, ufOab, periodo)}
        onCancelar={onFechar}
        /* Depois de um resultado vazio, o período é a primeira coisa que a
           pessoa vai querer mexer -- ou porque errou o intervalo, ou porque
           quer alargar. */
        periodoAberto={etapa === "vazio"}
      />

      {etapa === "buscando" && <BuscaEmAndamento processos={parcial} />}
    </Cartao>
  );
}
