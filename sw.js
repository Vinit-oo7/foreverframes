/* ==========================================================
   MEMORYBOX SERVICE WORKER (HARDENED)
   Share Target + Cache (Network First)
========================================================== */

const CACHE_NAME = "memorybox-v6.0.3";

const STATIC_ASSETS = [
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
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
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
          keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : null)),
        ),
      ),
  );
  self.clients.claim();
});

/* ============================
   FETCH
   - Share Target POST handler
   - Network-first cache for GET
============================ */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // ✅ SHARE TARGET (Other Apps → MemoryBox)
  if (req.method === "POST" && url.pathname === "/share-target") {
    event.respondWith(handleShareTarget(req));
    return;
  }

  // Only cache GET
  if (req.method !== "GET") return;

  // Never touch unsupported schemes
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // Only cache same-origin
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  // Network-first
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200 || res.type !== "basic") return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        return res;
      })
      .catch(() => caches.match(req)),
  );
});

async function handleShareTarget(request) {
  const formData = await request.formData();

  // Manifest uses params.files[].name = "media"
  const files = formData.getAll("media");

  const clientsList = await self.clients.matchAll({
    type: "window",
    includeUncontrolled: true,
  });

  // Prefer visible window
  let client = clientsList.find((c) => c.visibilityState === "visible");

  // If none, open the app
  if (!client) {
    client = await self.clients.openWindow("/?source=pwa");
  }

  // Send files to app
  client?.postMessage({ type: "SHARED_FILES", files });

  // Redirect to app (important for Android UX)
  return Response.redirect("/?source=pwa", 303);
}

/* ============================
   NOTIFICATIONS + PING
============================ */
self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification("MemoryBox", {
      body: event.data.message,
      icon: "/logo.svg",
      badge: "/logo.svg",
    });
  }

  if (event.data?.type === "PING") {
    if (event.ports && event.ports[0]) event.ports[0].postMessage("READY");
  }
});
