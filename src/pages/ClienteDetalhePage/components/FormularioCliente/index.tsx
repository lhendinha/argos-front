import { Box, Flex, Heading, Input, Text } from "@chakra-ui/react";
import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";

import { Botao, Campo, CamposDeEndereco, Cartao, Etiqueta, Faixa } from "../../../../components";
import { useToast } from "../../../../contexts/ToastContext";
import { atualizarCliente } from "../../../../services";
import { toastErroMutation } from "../../../../services/queryClient";
import { apenasDigitos, emailValido, formatarDataDeInstante, mascararCep, mascararCpfCnpj, mascararTelefone } from "../../../../utils";
import type { EnderecoDoCliente } from "../../../../types";
import { CONTAINER_DE_CELULAR, TAMANHO_MAXIMO_DO_NOME_DE_CLIENTE } from "../../../../constants";
import { CORES_DO_CLIENTE_ARQUIVADO } from "../../../../theme/cliente";
import type { FormularioClienteProps } from "./types";

/** Cabeçalho + formulário de edição do cliente, como no artifact: o nome
 * como título, as ações à direita da mesma linha, e os campos num cartão.
 *
 * Arquivar e reativar só aparecem pra `manager`+ -- é a mesma régua do
 * backend, que recusa abaixo disso. Mostrar um botão que a API vai negar é
 * pior que não mostrar.
 *
 * E EDITAR só pra `manager`+, pela mesma razão: `PATCH /clientes` é
 * `manager`, e campos habilitados pra qualquer um dariam o 403 só depois de a
 * pessoa digitar tudo.
 *
 * ⚠️ O cliente ARQUIVADO continua editável -- decisão do usuário, e a API
 * aceita o PATCH nele. O que muda na tela é o que ele é, não o que dá pra
 * fazer: a etiqueta, a faixa e o botão que agora diz "Reativar".
 *
 * ⚠️ Campos em `readOnly`, não escondidos nem desabilitados: `GET /clientes`
 * é `user`, então quem não pode gravar ainda tem direito a VER o que está
 * cadastrado -- e a copiar dali o telefone ou o e-mail, que é metade do
 * motivo de abrir a ficha. O que some é o botão, que é o que promete uma
 * ação impossível.
 *
 * 🔴 `readOnly` e não `disabled` porque `disabled` apaga o texto: medido em
 * Chrome, o `opacity: 0.5` que o Chakra aplica deixa o valor em 3,26:1 de
 * contraste sobre o branco -- abaixo dos 4,5:1 de texto normal. Travar a
 * edição não pode custar a leitura, que é a única coisa que sobrou pra
 * quem está vendo.
 *
 * ⚠️ E por isso `handleSubmit` também confere: campo `readOnly` continua
 * participando do formulário (o `disabled` não participava), então esconder
 * o botão não basta como guarda -- só como aviso.
 */
export default function FormularioCliente({
  cliente,
  podeEditar,
  podeArquivar,
  arquivando,
  reativando,
  onSalvo,
  onArquivar,
  onReativar,
}: FormularioClienteProps) {
  const [nome, setNome] = useState(cliente.nome);
  const [cpfCnpj, setCpfCnpj] = useState(mascararCpfCnpj(cliente.cpf_cnpj || ""));
  const [telefone, setTelefone] = useState(mascararTelefone(cliente.telefone || ""));
  const [email, setEmail] = useState(cliente.email || "");
  /* `?? ""` em cada um: a API manda `null` pro que não foi preenchido, e um
     `<input>` controlado com `null` vira não-controlado. */
  const [endereco, setEndereco] = useState<EnderecoDoCliente>({
    cep: mascararCep(cliente.cep ?? ""),
    logradouro: cliente.logradouro ?? "",
    numero: cliente.numero ?? "",
    complemento: cliente.complemento ?? "",
    bairro: cliente.bairro ?? "",
    cidade: cliente.cidade ?? "",
    uf: cliente.uf ?? "",
  });
  const toast = useToast();

  const emailInvalido = email.trim() !== "" && !emailValido(email);
  const arquivado = Boolean(cliente.arquivado_em);

  const salvarMutation = useMutation({
    mutationFn: () =>
      atualizarCliente(cliente.cliente_id, {
        nome: nome.trim(),
        cpfCnpj: apenasDigitos(cpfCnpj),
        telefone: apenasDigitos(telefone),
        email: email.trim(),
        endereco,
      }),
    onSuccess: onSalvo,
    onError: (err) => toastErroMutation(toast, err, "Não foi possível atualizar o cliente."),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!podeEditar) return;
    salvarMutation.mutate();
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 🔴 **Quebra SÓ no container de celular.** Medido em 360px com o
          nome mais longo do banco: o título não encolhe abaixo da palavra
          mais comprida (160px), as ações não encolhiam nada, e "Salvar"
          terminava 16px FORA do cartão. A página não crescia junto, então
          nenhuma régua acusava -- foi este defeito que fez a régua ganhar o
          olho de vazamento.

          ⚠️ `wrap` solto muda o DESKTOP, e eu medi isso errado antes: com a
          quebra sempre ligada, um nome longo enche a primeira linha e as
          ações caem para baixo, encostadas à esquerda. Diferença de 42.406
          pixels em 1440. Preso ao container, o desktop não sente. */}
      <Flex
        align="flex-start"
        justify="space-between"
        gap="16px"
        mb="18px"
        css={{ [`@container ${CONTAINER_DE_CELULAR}`]: { flexWrap: "wrap" } }}
      >
        <Box>
          <Heading as="h1" fontSize="23px" fontWeight="800" letterSpacing="-0.01em">
            {cliente.nome}
          </Heading>
          {/* Quem arquivou e quando ficam ao lado da etiqueta, como no
              artefato: a etiqueta diz O QUE é, a linha diz de onde veio. */}
          {arquivado && (
            <Flex align="center" gap="8px" mt="6px">
              <Etiqueta cores={CORES_DO_CLIENTE_ARQUIVADO}>Arquivado</Etiqueta>
              <Text fontSize="12.5px" color="fg.subtle">
                {`Por ${cliente.arquivado_por ?? "—"} em ${formatarDataDeInstante(cliente.arquivado_em ?? "")}`}
              </Text>
            </Flex>
          )}
        </Box>
        {/* No celular as ações ocupam a linha e dividem entre si, como em
            toda tela -- ver `ACOES_DO_CABECALHO`.

            ⚠️ **A constante inteira NÃO serve aqui, e eu tentei.** Ela não
            carrega `flexShrink: 0`, e sem isso o grupo encolhe num título
            longo: em 1440 "Arquivar" e "Salvar" empilhavam um sobre o
            outro, 40.855 pixels de diferença. Lá o título tem outro
            tamanho; aqui ele é um `h1` de 23px que toma a linha. Então só a
            metade de celular dela vem, e o desktop fica idêntico. */}
        <Flex
          gap="8px"
          flexShrink={0}
          css={{
            [`@container ${CONTAINER_DE_CELULAR}`]: {
              width: "100%",
              "& > *": { flex: "1 1 auto" },
            },
          }}
        >
          {podeArquivar &&
            (arquivado ? (
              <Botao variante="ghost" disabled={reativando} onClick={onReativar}>
                {reativando ? "Reativando…" : "Reativar"}
              </Botao>
            ) : (
              <Botao variante="ghost" disabled={arquivando} onClick={onArquivar}>
                {arquivando ? "Arquivando…" : "Arquivar"}
              </Botao>
            ))}
          {podeEditar && (
            <Botao
              type="submit"
              disabled={salvarMutation.isPending || !nome.trim() || emailInvalido}
            >
              {salvarMutation.isPending ? "Salvando…" : "Salvar"}
            </Botao>
          )}
        </Flex>
      </Flex>

      {/* A faixa explica o que "arquivado" significa AQUI: some da lista e
          dos seletores, e o histórico continua com o nome dele. Sem ela, a
          etiqueta sozinha deixa a pessoa adivinhando o que perdeu. */}
      {arquivado && (
        <Box mb="14px">
          <Faixa tom="aviso" aEsquerda>
            Cliente arquivado: fica fora da lista e dos seletores, e o histórico (faturas, lançamentos, atendimentos)
            continua com o nome dele. Os dados continuam editáveis.
          </Faixa>
        </Box>
      )}

      <Cartao>
        <Campo rotulo="Nome" para="nome-cliente-edicao" obrigatorio>
          <Input
            id="nome-cliente-edicao"
            readOnly={!podeEditar}
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={TAMANHO_MAXIMO_DO_NOME_DE_CLIENTE}
          />
        </Campo>

        <Campo rotulo="CPF/CNPJ" para="cpf-cnpj-cliente-edicao">
          <Input
            id="cpf-cnpj-cliente-edicao"
            readOnly={!podeEditar}
            value={cpfCnpj}
            onChange={(e) => setCpfCnpj(mascararCpfCnpj(e.target.value))}
            inputMode="numeric"
          />
        </Campo>

        <Campo rotulo="Telefone" para="telefone-cliente-edicao">
          <Input
            id="telefone-cliente-edicao"
            readOnly={!podeEditar}
            value={telefone}
            onChange={(e) => setTelefone(mascararTelefone(e.target.value))}
            inputMode="numeric"
          />
        </Campo>

        <Campo
          rotulo="E-mail"
          para="email-cliente-edicao"
          erro={emailInvalido ? "E-mail inválido." : undefined}
        >
          <Input
            id="email-cliente-edicao"
            readOnly={!podeEditar}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>

        <CamposDeEndereco
          valores={endereco}
          onMudar={setEndereco}
          sufixoDoId="-edicao"
          somenteLeitura={!podeEditar}
        />
      </Cartao>
    </form>
  );
}
