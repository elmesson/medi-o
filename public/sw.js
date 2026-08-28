const CACHE='elmesson-v1';
const ASSETS=['/','/portal','/login','/manifest.json'];
self.addEventListener('install', e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e=>{
  const req=e.request;
  if(req.method!=='GET'){ return; }
  e.respondWith(
    fetch(req).then(res=>{ const clone=res.clone(); caches.open(CACHE).then(c=>c.put(req, clone)); return res; })
    .catch(()=> caches.match(req).then(m=> m || caches.match('/portal')))
  );
});
self.addEventListener('sync', e=>{
  if(e.tag==='elmesson-sync'){ e.waitUntil(self.clients.matchAll().then(cs=> cs.forEach(c=>c.postMessage({ type:'SYNC' })))); }
});
