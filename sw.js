const CACHE="done-preventivi-v2-0";
const FILES=[
  "./","./index.html","./manifest.webmanifest",
  "./assets/css/app.css","./assets/js/data.js","./assets/js/app.js",
  "./assets/images/logo-done.png",
  "./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png"
];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r})
  .catch(()=>caches.match(e.request).then(r=>r||caches.match("./index.html"))));
});