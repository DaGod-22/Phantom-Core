importScripts("/controller/controller.sw.js");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(clients.claim()));

self.addEventListener("fetch", event => {
  try {
    if (self.$scramjetController?.shouldRoute(event)) {
      event.respondWith(self.$scramjetController.route(event));
    }
  } catch (error) {
    console.error("Scramjet service worker route error", error);
  }
});
