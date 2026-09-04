importScripts("/controller/controller.sw.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(clients.claim()));

async function handleRequest(event) {
  try {
    if (self.$scramjetController?.shouldRoute(event)) {
      return await self.$scramjetController.route(event);
    }
  } catch (error) {
    console.error("Scramjet service worker route error", error);
  }

  return fetch(event.request);
}

self.addEventListener("fetch", event => {
  event.respondWith(handleRequest(event));
});
