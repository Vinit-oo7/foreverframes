const CACHE_NAME = "memorybox-v4.1.2";

const STATIC_CACHE = [
  "/",
  "/index.html",
  "/script.js",
  "/manifest.json",
  "/logo.svg",
];

/* ============================
   INSTALL
============================ */
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE)),
  );
});

/* ============================
   ACTIVATE
============================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => key !== CACHE_NAME && caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

/* ============================
   FETCH
============================ */
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🟣 Handle Share Target POST
  if (request.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // ❌ Ignore non-GET (prevents POST cache crash)
  if (request.method !== "GET") return;

  // ❌ Ignore cross-origin (prevents Supabase / CDN crash)
  if (url.origin !== self.location.origin) return;

  // 🟢 Network First for HTML
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match(request)),
    );
    return;
  }

  // 🔵 Cache First for static assets
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((res) => {
          if (res.ok && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return res;
        })
      );
    }),
  );
});

/* ============================
   SHARE TARGET HANDLER
============================ */
async function handleShareTarget(request) {
  const formData = await request.formData();
  const files = formData.getAll("media");

  const allClients = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  let client = allClients.find((c) => c.visibilityState === "visible");

  if (!client) {
    client = await self.clients.openWindow("/");
  }

  client.postMessage({
    type: "SHARED_FILES",
    files,
  });

  return Response.redirect("/", 303);
}

/* ============================
   NOTIFICATIONS
============================ */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification("📦 Memory Saved", {
      body: event.data.message,
      icon: "/logo.svg",
      badge: "/logo.svg",
      vibrate: [300, 200, 300, 200, 500],
      requireInteraction: true,
      renotify: true,
      tag: "memorybox-upload",
      actions: [
        {
          action: "open",
          title: "View Memory",
        },
      ],
    });
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("/"));
});
