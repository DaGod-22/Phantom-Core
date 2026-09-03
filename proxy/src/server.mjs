import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { server as wisp } from "@mercuryworkshop/wisp-js/server";
import { scramjetPath } from "@mercuryworkshop/scramjet/path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "public");
const controllerPath = dirname(require.resolve("@mercuryworkshop/scramjet-controller/dist/controller.api.js"));
const libcurlPath = dirname(require.resolve("@mercuryworkshop/libcurl-transport"));

const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || "0.0.0.0";
const app = Fastify({ logger: true, bodyLimit: 64 * 1024 * 1024 });

// Do not turn a public proxy into an SSRF primitive.
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;

await app.register(fastifyStatic, { root, prefix: "/", decorateReply: false });
await app.register(fastifyStatic, { root: scramjetPath, prefix: "/scramjet/", decorateReply: false });
await app.register(fastifyStatic, { root: controllerPath, prefix: "/controller/", decorateReply: false });
await app.register(fastifyStatic, { root: libcurlPath, prefix: "/libcurl/", decorateReply: false });

app.get("/health", async () => ({
  ok: true,
  name: "Phantom Core Scramjet",
  engine: "Scramjet 2.x",
  transport: "libcurl + Wisp",
  timestamp: new Date().toISOString()
}));

app.get("/config", async (request) => {
  const forwarded = request.headers["x-forwarded-proto"];
  const protocol = Array.isArray(forwarded) ? forwarded[0] : (forwarded || "http");
  const wsProtocol = protocol === "https" ? "wss" : "ws";
  const hostHeader = request.headers.host || `localhost:${port}`;
  return {
    wisp: `${wsProtocol}://${hostHeader}/wisp/`,
    prefix: "/~/sj/",
    scramjetPath: "/scramjet/scramjet.js",
    injectPath: "/controller/controller.inject.js",
    wasmPath: "/scramjet/scramjet.wasm"
  };
});

// Fastify owns the HTTP server. Attach Wisp directly to it so WebSocket
// upgrades reach the transport server rather than a second unused server.
app.server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.destroy();
  }
});

await app.listen({ port, host });
console.log(`Phantom Core Scramjet listening on ${host}:${port}`);
