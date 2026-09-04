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
const app = Fastify({
  logger: true,
  bodyLimit: 64 * 1024 * 1024,
  trustProxy: true,
});

// A public proxy must not become an SSRF service for private infrastructure.
wisp.options.allow_private_ips = false;
wisp.options.allow_loopback_ips = false;

// Scramjet itself is an interception proxy: the browser's service worker does
// the rewriting while Wisp + libcurl provide real network access. These headers
// also allow proxied sites that require SharedArrayBuffer/cross-origin isolation.
app.addHook("onSend", async (_request, reply) => {
  reply.header("Cross-Origin-Opener-Policy", "same-origin");
  reply.header("Cross-Origin-Embedder-Policy", "credentialless");
  reply.header("Cross-Origin-Resource-Policy", "cross-origin");
  reply.header("X-Content-Type-Options", "nosniff");
  reply.header("Referrer-Policy", "no-referrer");
});

await app.register(fastifyStatic, {
  root,
  prefix: "/",
  decorateReply: false,
  cacheControl: false,
});
await app.register(fastifyStatic, {
  root: scramjetPath,
  prefix: "/scramjet/",
  decorateReply: false,
  cacheControl: true,
  maxAge: "1h",
});
await app.register(fastifyStatic, {
  root: controllerPath,
  prefix: "/controller/",
  decorateReply: false,
  cacheControl: true,
  maxAge: "1h",
});
await app.register(fastifyStatic, {
  root: libcurlPath,
  prefix: "/libcurl/",
  decorateReply: false,
  cacheControl: true,
  maxAge: "1h",
});

app.get("/health", async () => ({
  ok: true,
  name: "Phantom Core Scramjet",
  engine: "Scramjet 2.x",
  transport: "libcurl + Wisp",
  timestamp: new Date().toISOString(),
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
    wasmPath: "/scramjet/scramjet.wasm",
  };
});

app.get("/ready", async () => ({ ready: true }));

// Wisp is a long-lived WebSocket transport, so it must be attached to the
// actual Fastify HTTP server. This is intentionally not a second server.
app.server.on("upgrade", (req, socket, head) => {
  if (req.url?.startsWith("/wisp/")) {
    try {
      wisp.routeRequest(req, socket, head);
    } catch (error) {
      app.log.error(error, "Wisp upgrade failed");
      socket.destroy();
    }
    return;
  }

  socket.destroy();
});

await app.listen({ port, host });
console.log(`Phantom Core Scramjet listening on ${host}:${port}`);
