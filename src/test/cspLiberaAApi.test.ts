/** O `connect-src` do `vercel.json` libera o endereço da API de produção.
 *
 * 🔴 Esquecido, o navegador bloqueia TODAS as chamadas e o erro não fala em
 * CSP: fala em falha de rede. O `curl` funciona e o Chrome não, e nenhum outro
 * teste roda o navegador com o cabeçalho da Vercel -- por isso este guarda.
 *
 * ➡️ `api/PLANO_API_GATEWAY.md`, "Fase 3 — front: trocar de endereço".
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const RAIZ = resolve(__dirname, "../..");

function connectSrc(): string[] {
  const vercel = JSON.parse(readFileSync(resolve(RAIZ, "vercel.json"), "utf8"));
  const csp: string = vercel.headers
    .flatMap((h: { headers: { key: string; value: string }[] }) => h.headers)
    .find((c: { key: string }) => c.key === "Content-Security-Policy").value;
  const diretiva = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("connect-src "));
  return (diretiva ?? "").split(/\s+/).slice(1);
}

/** A origem casa com a fonte do CSP? `https://*.x.com` cobre `https://a.x.com`. */
function libera(fonte: string, origem: string): boolean {
  if (!fonte.includes("*.")) return fonte === origem;
  const [esquema, resto] = fonte.split("://*.");
  return origem.startsWith(`${esquema}://`) && origem.endsWith(`.${resto}`);
}

const API = /API_DE_PRODUCAO = "([^"]+)"/.exec(
  readFileSync(resolve(RAIZ, "scripts/apiDeProducao.mjs"), "utf8"),
)?.[1];

describe("o CSP libera a API", () => {
  it("o endereço de produção dos roteiros está no connect-src", () => {
    expect(API, "o guarda não achou o endereço em scripts/apiDeProducao.mjs").toBeTruthy();
    const origem = new URL(API as string).origin;
    expect(connectSrc().some((f) => libera(f, origem)), `${origem} fora de: ${connectSrc().join(" ")}`).toBe(true);
  });

  it("o socket continua liberado -- o wss:// do mesmo host NÃO cobre o https://, e vice-versa", () => {
    const fontes = connectSrc();
    expect(fontes.some((f) => libera(f, "wss://abc.execute-api.sa-east-1.amazonaws.com"))).toBe(true);
    expect(libera("wss://*.execute-api.sa-east-1.amazonaws.com", "https://abc.execute-api.sa-east-1.amazonaws.com")).toBe(false);
  });
});
