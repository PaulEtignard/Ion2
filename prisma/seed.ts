/**
 * Envoie les builds de départ au site via le serveur MCP (outil create_build).
 *
 *   npm run db:seed                         -> site local (http://localhost:3000)
 *   npm run db:seed -- https://ma-team.vercel.app
 *
 * Nécessite MCP_API_KEY (lu depuis .env). Les builds déjà présents (même titre) sont mis à jour.
 */
import "dotenv/config";
import { BUILDS } from "./builds.mjs";

const base = (process.argv[2] ?? process.env.SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const key = process.env.MCP_API_KEY;
if (!key) throw new Error("MCP_API_KEY manquant");

let id = 0;
async function call(method: string, params: unknown) {
  const res = await fetch(`${base}/api/mcp`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      authorization: `Bearer ${key}`,
      "mcp-protocol-version": "2025-06-18",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 500)}`);
  // Réponse JSON directe ou flux SSE ("data: {...}")
  const payload = text.trim().startsWith("{")
    ? JSON.parse(text)
    : JSON.parse(text.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5)).join(""));
  if (payload.error) throw new Error(JSON.stringify(payload.error));
  return payload.result;
}

const tool = async (name: string, args: unknown) => {
  const r = await call("tools/call", { name, arguments: args });
  const text = r.content?.map((c: { text?: string }) => c.text).join("\n") ?? "";
  if (r.isError) throw new Error(text);
  return JSON.parse(text);
};

await call("initialize", { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "aion2-seed", version: "1.0.0" } });
const existing: { slug: string; title: string }[] = await tool("list_builds", {});

for (const b of BUILDS) {
  const found = existing.find((e) => e.title === b.title);
  try {
    const r = found ? await tool("update_build", { build: found.slug, patch: b }) : await tool("create_build", b);
    console.log(`${found ? "↻" : "✓"} ${b.title}${r.warnings?.length ? `\n   ⚠ ${r.warnings.join("\n   ⚠ ")}` : ""}`);
  } catch (e) {
    console.error(`✗ ${b.title}\n${(e as Error).message}`);
    process.exitCode = 1;
  }
}
