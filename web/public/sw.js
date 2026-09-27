const CACHE_NAME = "mercadito-offline-v1";
const OFFLINE_URL = "/offline.html";

async function offlineResponse() {
  const offlinePage = await caches.match(OFFLINE_URL);
  return (
    offlinePage ??
    new Response("Mercadito necesita conexión a internet.", {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  );
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) =>
        cache.add(
          new Request(OFFLINE_URL, { cache: "reload", credentials: "omit" }),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith("mercadito-offline-") && name !== CACHE_NAME,
          )
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || request.mode !== "navigate") return;

  const requestUrl = new URL(request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        return response.status >= 500 ? offlineResponse() : response;
      } catch {
        return offlineResponse();
      }
    })(),
  );
});
