/* v0.9.1 cache hotfix: unique precache entries, fresh code first. */
const CACHE='mage-rising-v0.9.2-card-grades-1';
const PREFIX='mage-rising-';
const CORE=["assets/cards/grades/d-0.webp","assets/cards/grades/d-1.webp","assets/cards/grades/d-2.webp","assets/cards/grades/d-3.webp","assets/cards/grades/c-0.webp","assets/cards/grades/c-1.webp","assets/cards/grades/c-2.webp","assets/cards/grades/c-3.webp","assets/cards/grades/b-0.webp","assets/cards/grades/b-1.webp","assets/cards/grades/b-2.webp","assets/cards/grades/b-3.webp","assets/cards/grades/a-0.webp","assets/cards/grades/a-1.webp","assets/cards/grades/a-2.webp","assets/cards/grades/a-3.webp","assets/cards/grades/s-0.webp","assets/cards/grades/s-1.webp","assets/cards/grades/s-2.webp","assets/cards/grades/s-3.webp","assets/cards/grades/ss-0.webp","assets/cards/grades/ss-1.webp","assets/cards/grades/ss-2.webp","assets/cards/grades/ss-3.webp","auto-gear.css", "js/auto-gear.js", "cards.css", "js/cards.js", "assets/cards/battle-series.png", "assets/cards/casual-series.png", "js/warrior-fx.js", "js/summoner-art.js", "assets/summoner/animated-allies.png", "js/combat-art.js", "assets/combat-art/warrior-basic.png", "assets/combat-art/warrior-female.png", "assets/combat-art/warrior-elder.png", "assets/combat-art/warrior-elf.png", "assets/combat-art/warrior-demon.png", "assets/combat-art/rogue-slash.png", "js/orientation.js", "./", "index.html", "style.css", "landscape.css", "assets/projectiles/arrow.png", "js/class-data.js", "js/class-art.js", "js/remaster.js", "assets/remaster/warrior.png", "assets/remaster/rogue-dagger.png", "assets/remaster/rogue-bow.png", "assets/remaster/summoner-idle.png", "assets/remaster/summoner-cast.png", "assets/remaster/mage.png", "assets/remaster/enemies.png", "assets/remaster/enemies-extra.png", "assets/remaster/allies.png", "assets/class-skins/warrior-basic.svg", "assets/class-skins/warrior-female.svg", "assets/class-skins/warrior-elder.svg", "assets/class-skins/warrior-elf.svg", "assets/class-skins/warrior-demon.svg", "assets/class-skins/rogue-basic.svg", "assets/class-skins/rogue-female.svg", "assets/class-skins/rogue-shadow.svg", "assets/class-skins/rogue-desert.svg", "assets/class-skins/rogue-mask.svg", "assets/class-skins/summoner-beast.svg", "assets/class-skins/summoner-fairy.svg", "assets/class-skins/summoner-golem.svg", "assets/class-skins/summoner-skeleton.svg", "assets/class-skins/summoner-dragon.svg", "js/config.js", "js/items.js", "js/skills.js", "js/game.js", "js/polish.js", "js/firebase-config.js", "js/rank.js", "manifest.webmanifest", "assets/icons/icon-192.png"];
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await cache.addAll(CORE.map(path=>new Request(new URL(path,self.location.href),{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=await caches.keys();
 await Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const code=request.mode==='navigate'||/\.(?:html|js|css|webmanifest)$/.test(url.pathname);
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  const key=new Request(url.origin+url.pathname);
  if(code){
   try{const response=await fetch(request,{cache:'no-cache'});if(response.ok){await cache.put(key,response.clone());return response;}}catch(error){}
   const offline=await cache.match(key);if(offline)return offline;
   return fetch(request);
  }
  const cached=await cache.match(key);if(cached)return cached;
  const response=await fetch(request);if(response.ok)await cache.put(key,response.clone());return response;
 })());
});

