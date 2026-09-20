import { apenasDigitos } from "./mask";

/** Pessoa física ou jurídica, pelo tamanho do documento.
 *
 * 🔴 **Em `utils/`, e não dentro do componente que a usa.** É transformação
 * de dado, não desenho -- a mesma régua de `vinculoDoDocumento` e de
 * `colunaComRotulo`. Enquanto morava dentro da linha da listagem, a segunda
 * forma da mesma lista não tinha como chamá-la sem copiá-la.
 *
 * ⚠️ **Sem documento não afirma nada.** Onze dígitos é CPF, catorze é CNPJ,
 * e qualquer outra coisa -- vazio, incompleto, mal digitado -- devolve
 * string vazia. Chutar "Pessoa física" para um cadastro sem documento seria
 * inventar um dado que ninguém preencheu.
 */
export function tipoDeCliente(cpfCnpj?: string | null): string {
  const digitos = apenasDigitos(cpfCnpj || "");
  if (digitos.length === 11) return "Pessoa física";
  if (digitos.length === 14) return "Pessoa jurídica";
  return "";
}
