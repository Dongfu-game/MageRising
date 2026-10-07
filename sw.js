/* Mage Rising offline cache. Stale-while-revalidate: opens instantly, updates itself for next launch. */
const CACHE='mage-rising-v0.7.2-hp130-boss45';
const CORE=['js/combat-art.js','assets/combat-art/warrior-basic.png','assets/combat-art/warrior-female.png','assets/combat-art/warrior-elder.png','assets/combat-art/warrior-elf.png','assets/combat-art/warrior-demon.png','assets/combat-art/rogue-slash.png','js/orientation.js','./','index.html','style.css','landscape.css','assets/projectiles/arrow.png','js/class-data.js','js/class-art.js','js/remaster.js','assets/remaster/warrior.png','assets/remaster/rogue-dagger.png','assets/remaster/rogue-bow.png','assets/remaster/summoner-idle.png','assets/remaster/summoner-cast.png','assets/remaster/mage.png','assets/remaster/enemies.png','assets/remaster/enemies-extra.png','assets/remaster/allies.png','assets/class-skins/warrior-basic.svg','assets/class-skins/warrior-female.svg','assets/class-skins/warrior-elder.svg','assets/class-skins/warrior-elf.svg','assets/class-skins/warrior-demon.svg','assets/class-skins/rogue-basic.svg','assets/class-skins/rogue-female.svg','assets/class-skins/rogue-shadow.svg','assets/class-skins/rogue-desert.svg','assets/class-skins/rogue-mask.svg','assets/class-skins/summoner-beast.svg','assets/class-skins/summoner-fairy.svg','assets/class-skins/summoner-golem.svg','assets/class-skins/summoner-skeleton.svg','assets/class-skins/summoner-dragon.svg','js/config.js','js/items.js','js/skills.js','js/game.js','js/polish.js','js/firebase-config.js','js/rank.js','manifest.webmanifest','assets/icons/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==CACHE).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(async c=>{
    const hit=await c.match(r,{ignoreSearch:true});
    if(hit)return hit;
    return fetch(r).then(res=>{if(res&&res.ok)c.put(r,res.clone());return res;});
  }));
});
