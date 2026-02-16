const CACHE_NAME = "memorybox-v6.0.1";

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

  // 🟣 Handle share POST to root
  if (request.method === "POST" && request.mode === "navigate") {
    event.respondWith(handleShareTarget(request));
    return;
  }

  // 🟢 Handle navigations
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match("/")));
    return;
  }

  // 🔵 Static assets
  event.respondWith(
    caches.match(request).then((response) => response || fetch(request)),
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
