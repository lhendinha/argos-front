/** O endereço da API de produção, num lugar só, para os roteiros.
 *
 * 🔴 **Tem o estágio no caminho** (`/prod`), coisa que a Function URL não
 * tinha. Cortar a URL no terceiro `/` -- o jeito que os roteiros achavam a
 * base -- joga o estágio fora, e toda chamada vira 403 do Gateway. Por isso a
 * base é esta constante, e a rota é o que vem DEPOIS dela.
 *
 * ⚠️ O `<id>` é da AWS: muda se o REST API for recriado. O `connect-src` do
 * `vercel.json` tem de liberá-lo -- `src/test/cspLiberaAApi.test.ts` cobra.
 *
 * ➡️ `api/PLANO_API_GATEWAY.md`, "Fase 3 — front: trocar de endereço".
 */
export const API_DE_PRODUCAO = "https://88ihwvc8u2.execute-api.sa-east-1.amazonaws.com/prod";

/** Esta URL é uma chamada à API? */
export function ehDaApi(url) {
  return url.startsWith(`${API_DE_PRODUCAO}/`);
}

/** A rota da chamada, sem o endereço nem o estágio -- `/clientes?pagina=1`. */
export function rotaDaApi(url) {
  return url.slice(API_DE_PRODUCAO.length);
}
