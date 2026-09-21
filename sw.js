const CACHE='anuncia-lucas-v10-shell';
const ASSETS=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png','./privacy.html','./terms.html','./support.html','./delete-account.html','./legal.css','./lucas-city-hero.webp'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>(key.startsWith('anuncia-lucas-')||key.startsWith('lucas-agora-'))&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
const url=new URL(event.request.url);
if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
if(!ASSETS.some(path=>new URL(path,self.registration.scope).pathname===url.pathname))return;
event.respondWith(fetch(event.request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(event.request,copy)))}return response}).catch(async()=>await caches.match(event.request,{ignoreSearch:true})||new Response('Sem conexão. Conecte-se à internet para continuar.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}})));
});