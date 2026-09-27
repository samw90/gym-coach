/* Offline support. The app's own files are fetched fresh when there's signal (so published
   updates show up on the next open) and served from cache when there isn't. Workout data is
   never touched here: it lives in localStorage. */
const CACHE = "gym-coach-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

function fromNetwork(req, ms){
  return new Promise((resolve, reject)=>{
    const timer = setTimeout(()=>reject(new Error("timeout")), ms);
    fetch(req).then(res=>{ clearTimeout(timer); resolve(res); }, err=>{ clearTimeout(timer); reject(err); });
  });
}

self.addEventListener("fetch", e=>{
  const req = e.request;
  if(req.method!=="GET") return;
  const url = new URL(req.url);

  // Google Fonts: cache first, since they never change
  if(url.hostname==="fonts.googleapis.com" || url.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.open(CACHE).then(async c=>{
      const hit = await c.match(req); if(hit) return hit;
      const res = await fetch(req); if(res.ok || res.type==="opaque") c.put(req, res.clone()); return res;
    }));
    return;
  }
  if(url.origin!==location.origin) return;

  // App files: network first (3 s, for weak gym signal), then cache
  e.respondWith((async()=>{
    const c = await caches.open(CACHE);
    try{
      const res = await fromNetwork(req, 3000);
      if(res.ok) c.put(req.mode==="navigate" ? "./" : req, res.clone());
      return res;
    }catch(err){
      return (await c.match(req.mode==="navigate" ? "./" : req)) || (await c.match("index.html")) || Response.error();
    }
  })());
});
