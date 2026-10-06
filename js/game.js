'use strict';
(() => {
const C=MAGE_CONFIG,I=MAGE_ITEMS,S=MAGE_SKILLS,$=id=>document.getElementById(id), canvas=$('world'),ctx=canvas.getContext('2d');
const TAU=Math.PI*2, testMode=new URLSearchParams(location.search).has('test');
const blankLevels=()=>({damage:0,cast:0,cooldown:0,range:0});
let classId=window.MAGE_CLASS_ID||'mage';const classKey=()=>MAGE_CLASSES.key(classId);
const firstSkill=()=>MAGE_CLASSES.jobs[classId].first;
const fresh=()=>({version:5,contentVersion:68,classId,inventorySort:'newest',dropChests:[],fragments:[0,0,0],forgeCount:0,gachaSeconds:0,gachaDraws:0,skinId:classId==='mage'?'default':window.MAGE_CLASS_SKINS[classId][0].id,powerLevel:0,skillLevels:S.blank(),activeSlots:[firstSkill(),null,null],cooldowns:{},bossCleared:[],fullSetPending:[],fullSetClaimed:[],energyCasts:0,migration:null,recommendMode:'balanced',uniqueClaimed:[],uniqueChests:[],shield:0,tier:0,levels:Array.from({length:10},blankLevels),gold:C.startGold,stage:1,best:1,kills:0,bossActive:false,hp:100,inventory:[],equipped:{},drops:0,totalKills:0,deaths:0,dead:false,started:false,sound:false,lowFX:matchMedia('(prefers-reduced-motion: reduce)').matches});
let state=fresh(),storageOK=true;
function validate(v){
 if(!v||![1,2,3,4,5].includes(v.version))throw Error('지원하지 않는 저장 파일입니다.');
 const num=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
 const int=(x,min,max)=>num(x,min,max)&&Number.isInteger(x);
 if(!int(v.tier,0,9)||!num(v.gold,0,1e280)||!int(v.stage,1,C.maxStage)||!int(v.best,v.stage,C.maxStage)||!int(v.kills,0,C.killsPerStage*v.stage)||!num(v.hp,0,1e280)||!int(v.drops,0,1e9)||!int(v.totalKills,0,1e12)||!int(v.deaths,0,1e9))throw Error('진행 데이터가 올바르지 않습니다.');
 if(!Array.isArray(v.levels)||v.levels.length!==10||v.levels.some(l=>!l||['damage','cast','cooldown','range'].some(k=>!int(l[k],0,100))))throw Error('강화 데이터가 올바르지 않습니다.');
 if(!Array.isArray(v.inventory)||v.inventory.length>C.inventoryLimit||!v.equipped||typeof v.equipped!=='object')throw Error('장비 데이터가 올바르지 않습니다.');
 const ids=new Set();for(const i of v.inventory){if(!i||typeof i.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(i.id)||ids.has(i.id)||!int(i.slot,0,7)||!int(i.rarity,0,4)||!int(i.stage,1,C.maxStage)||!num(i.value,.001,1e280)||!num(i.sell,0,1e280))throw Error('장비 수치가 올바르지 않습니다.');if((i.slot===2||i.slot===3)&&i.value>35)throw Error('장비 감소율이 올바르지 않습니다.');ids.add(i.id);}
 for(const s of C.slots){const id=v.equipped[s.id];if(id&&!v.inventory.some(i=>i.id===id&&C.slots[i.slot].id===s.id))throw Error('착용 데이터가 올바르지 않습니다.');}
 if(v.classId&&v.classId!==classId)throw Error('다른 직업의 저장 파일입니다.');const clean=fresh();for(const k of ['tier','gold','stage','best','kills','hp','drops','totalKills','deaths'])clean[k]=v[k];clean.levels=v.levels.map(l=>({...l}));clean.inventory=v.inventory.map(i=>({id:i.id,slot:i.slot,rarity:i.rarity,stage:i.stage,value:i.value,sell:i.sell,unique:i.unique===true,enhanceXP:i.enhanceXP??0,setId:i.setId??null}));clean.equipped={...v.equipped};for(const k of ['bossActive','dead','started','sound','lowFX'])clean[k]=!!v[k];if(v.version===1&&clean.bossActive)clean.kills=C.killsPerStage*clean.stage;if(v.version>=3){
 const validStages=a=>Array.isArray(a)&&a.length<=100&&new Set(a).size===a.length&&a.every(n=>int(n,10,C.maxStage)&&n%10===0);
 if(!validStages(v.uniqueClaimed)||!validStages(v.uniqueChests)||v.uniqueChests.some(n=>!v.uniqueClaimed.includes(n))||!num(v.shield,0,1e280))throw Error('유니크 보상 데이터가 올바르지 않습니다.');
 const used=new Set();for(const i of clean.inventory.filter(i=>i.unique)){const key=i.id;if(/^drop-[1-9][0-9]*$/.test(i.id)&&Number(i.id.slice(5))<=v.drops)continue;if(/^forge-[1-9][0-9]*$/.test(i.id)&&Number(i.id.slice(6))<=(v.forgeCount||0))continue;if(/^gacha-[1-9][0-9]*$/.test(i.id)&&Number(i.id.slice(6))<=(v.gachaDraws||0))continue;if(!v.uniqueClaimed.includes(i.stage)||(v.uniqueChests.includes(i.stage)&&!(v.version===5&&i.id.startsWith('set-')))||used.has(v.version<5?i.stage:key))throw Error('유니크 보상이 중복되었습니다.');used.add(v.version<5?i.stage:key);}
 clean.uniqueClaimed=[...v.uniqueClaimed];clean.uniqueChests=[...v.uniqueChests];clean.shield=v.shield;
 }else{for(const i of clean.inventory)i.unique=false;for(let n=10;n<clean.best;n+=10){clean.uniqueClaimed.push(n);clean.uniqueChests.push(n);}}
 if(v.version<4)clean.inventory=clean.inventory.map(I.migrate);
 else clean.inventory=clean.inventory.map((i,index)=>{const a=v.inventory[index].affixes;const expected=i.unique?2:i.rarity;if(i.rarity>3||(i.unique?i.rarity!==3:i.rarity===3)||!Array.isArray(a)||a.length!==expected||new Set(a.map(x=>x.kind)).size!==a.length||a.some(x=>!I.pools[i.slot].includes(x.kind==='mana'?'magicPower':x.kind)||!num(x.value,.001,1e280)))throw Error('장비 추가 옵션이 올바르지 않습니다.');return{...i,affixes:a.map(x=>({kind:x.kind==='mana'?'magicPower':x.kind,value:x.value}))};});
 clean.inventorySort=['newest','rarity','slot','set'].includes(v.inventorySort)?v.inventorySort:'newest';
 clean.recommendMode=['balanced','attack','survival'].includes(v.recommendMode)?v.recommendMode:'balanced';
 if(v.version===5){
 const stages=a=>Array.isArray(a)&&a.length<=C.maxStage&&new Set(a).size===a.length&&a.every(x=>int(x,1,C.maxStage));
 if(!stages(v.bossCleared)||v.bossCleared.some(x=>x>v.best)||!stages(v.fullSetClaimed)||!stages(v.fullSetPending)||v.fullSetClaimed.some(x=>x%100!==0||!v.bossCleared.includes(x))||v.fullSetPending.some(x=>!v.fullSetClaimed.includes(x))||!int(v.powerLevel,0,Number.MAX_SAFE_INTEGER))throw Error('성장 기록이 올바르지 않습니다.');
 if(!v.skillLevels||S.nodes.some(n=>!int(v.skillLevels[n.id],0,n.max))||v.skillLevels[firstSkill()]<1)throw Error('스킬 레벨이 올바르지 않습니다.');
 if(S.nodes.some(n=>v.skillLevels[n.id]>0&&!S.available(v.skillLevels,n.id)))throw Error('스킬 선행 조건이 올바르지 않습니다.');
 if(S.spent(v.skillLevels)>1+v.bossCleared.reduce((sum,n)=>sum+S.reward(n),0))throw Error('사용 SP가 보유 기록을 초과합니다.');
 if(!Array.isArray(v.activeSlots)||v.activeSlots.length!==3||!v.activeSlots.some(Boolean)||new Set(v.activeSlots.filter(Boolean)).size!==v.activeSlots.filter(Boolean).length||v.activeSlots.some(id=>id!==null&&(!S.byId[id]||S.byId[id].type!=='active'||!v.skillLevels[id])))throw Error('스킬 슬롯이 올바르지 않습니다.');
 clean.powerLevel=v.powerLevel;clean.skillLevels={...v.skillLevels};clean.activeSlots=[...v.activeSlots];clean.bossCleared=[...v.bossCleared];clean.fullSetClaimed=[...v.fullSetClaimed];clean.fullSetPending=[...v.fullSetPending];clean.cooldowns={};
 for(const n of S.nodes.filter(n=>n.type==='active')){const x=v.cooldowns?.[n.id]??0;if(!num(x,0,60))throw Error('쿨타임이 올바르지 않습니다.');clean.cooldowns[n.id]=x;}
 if(!int(v.energyCasts??0,0,4))throw Error('과충전 기록이 올바르지 않습니다.');clean.energyCasts=v.energyCasts||0;
 clean.migration=v.migration&&num(v.migration.oldDps,0,1e280)?{oldDps:v.migration.oldDps,newDps:Number(v.migration.newDps)||0,from:Math.min(4,Number(v.migration.from)||4)}:null;
 }else migrateSkills(clean,v);
 if(!num(v.gachaSeconds??0,0,60)||!int(v.gachaDraws??0,0,1e9))throw Error('뽑기 기록이 올바르지 않습니다.');clean.gachaSeconds=v.gachaSeconds??0;clean.gachaDraws=v.gachaDraws??0;
 const fragments=v.fragments??[0,0,0];if(!Array.isArray(fragments)||fragments.length!==3||fragments.some(n=>!int(n,0,1e12))||!int(v.forgeCount??0,0,1e12)||clean.inventory.some(i=>!int(i.enhanceXP??0,0,1e12)||(!i.unique&&(i.enhanceXP??0)!==0)))throw Error('합성·강화 기록이 올바르지 않습니다.');clean.fragments=[...fragments];clean.forgeCount=v.forgeCount??0;
 if(clean.inventory.some(i=>i.setId!=null&&(!i.unique||!Object.hasOwn(I.sets,i.setId))))throw Error('세트 소속이 올바르지 않습니다.');
 const dc=v.dropChests??[];if(!Array.isArray(dc)||dc.length>1e6||new Set(dc.map(x=>x.serial)).size!==dc.length||dc.some(x=>!int(x.stage,1,C.maxStage)||!int(x.serial,1,v.drops)||ids.has('drop-'+x.serial)))throw Error('드롭 보상이 올바르지 않습니다.');clean.dropChests=dc.map(x=>({stage:x.stage,serial:x.serial}));
 clean.skinId=skinList().some(s=>s.id===v.skinId)?v.skinId:skinList()[0].id;
 return clean;
}
let loadError='',protectSave=false;try{const raw=localStorage.getItem(classKey());if(raw){const parsed=JSON.parse(raw);if(parsed.version===5&&(parsed.contentVersion||0)<60&&!localStorage.getItem(classKey()+'-pre-v060-backup'))localStorage.setItem(classKey()+'-pre-v060-backup',raw);if(parsed.version===5&&(parsed.contentVersion||0)<52)localStorage.setItem(classKey()+'-pre-v052-backup',raw);if(parsed.version===5&&(parsed.contentVersion||0)<51)localStorage.setItem(classKey()+'-pre-v051-backup',raw);if(parsed.version===5&&(parsed.contentVersion||0)<50)localStorage.setItem(classKey()+'-pre-v050-backup',raw);if(parsed.version===5&&!parsed.contentVersion)localStorage.setItem(classKey()+'-pre-v040-backup',raw);if(parsed.version<5)localStorage.setItem(classKey()+'-pre-v030-backup',raw);state=validate(parsed);}}catch(e){loadError='저장 데이터를 읽지 못했습니다. 원본은 보호됩니다. 설정에서 백업을 가져와 주세요.';storageOK=false;protectSave=true;}
try{const shared=JSON.parse(localStorage.getItem('mage-rising-shared')||'{}');if(typeof shared.sound==='boolean')state.sound=shared.sound;if(typeof shared.lowFX==='boolean')state.lowFX=shared.lowFX;}catch(e){}
let orientationBlocked=false;const menuPositions={};
let slotSignature=null,castingId=null,roundRobin=0,scheduled=[],enemies=[],effects=[],particles=[],texts=[],time=0,spawnClock=.1,pendingSpawn=0,phase='cast',phaseLeft=.2,phaseTotal=.2,manualPause=false,tab='magic',bulk='1',enemyID=0,newItems=0,lastSave=0,lastUI=0,lastTS=0,toastTimer,bannerTimer,shake=0,audioCtx;
const hero={x:185,y:280};
const summonEpoch={flameExplosion:0,iceSpear:0};
let runeActive=false,runeClock=0,lastRunePulse=-100,lastOvercharge=-100,waveCount=0;
// Runtime-only measurements. Quarter-second buckets bound memory even during long sessions.
let meterClock=0,meterEpoch=0,meterBuckets=new Map(),meterTotals={};
const damageKinds={direct:'직접',dot:'지속/장판',summon:'소환체',burn:'화상',shatter:'파쇄',overcharge:'과충전',resonance:'공명'};
function resetCombatStats(){meterClock=0;meterEpoch++;meterBuckets.clear();meterTotals={};}
function recordDamage(id,amount,kind='direct',epoch=meterEpoch){
 if(epoch!==meterEpoch||!state.activeSlots.includes(id)||!id||!Number.isFinite(amount)||amount<=0)return;
 const key=Math.floor(meterClock*4);let bucket=meterBuckets.get(key);if(!bucket){bucket={};meterBuckets.set(key,bucket);}
 for(const table of [bucket,meterTotals]){const row=table[id]||={total:0,parts:{}};row.total+=amount;row.parts[kind]=(row.parts[kind]||0)+amount;}
}
function combatSnapshot(){
 const recent={},cutoff=meterClock-30;for(const [key,bucket]of meterBuckets){if((key+1)/4<=cutoff){meterBuckets.delete(key);continue;}
  const weight=Math.min(1,Math.max(0,((key+1)/4-cutoff)*4));
  for(const [id,row]of Object.entries(bucket)){const out=recent[id]||={total:0,parts:{}};out.total+=row.total*weight;for(const [kind,amount]of Object.entries(row.parts))out.parts[kind]=(out.parts[kind]||0)+amount*weight;}
 }
 const seconds=Math.min(30,meterClock),rows=state.activeSlots.filter(Boolean).map(id=>({id,name:S.byId[id].name,recent:recent[id]?.total||0,dps:seconds>0?(recent[id]?.total||0)/seconds:0,total:meterTotals[id]?.total||0,parts:recent[id]?.parts||{}}));
 const total=rows.reduce((sum,r)=>sum+r.recent,0);return{seconds,elapsed:meterClock,total,rows,dps:seconds>0?total/seconds:0};
}
function openCombatStats(){const s=combatSnapshot();modal('<h2 id="modalTitle">실제 전투 통계</h2><p class="lead">최근 '+s.seconds.toFixed(1)+'초 · 실제 DPS <b>'+number(s.dps)+'</b></p>'+s.rows.map(r=>'<section class="damage-row" style="--spell:'+S.byId[r.id].color+'"><div><strong>'+r.name+'</strong><b>'+number(r.dps)+' DPS</b></div><div class="damage-track"><i style="width:'+(s.total?r.recent/s.total*100:0)+'%"></i></div><p>최근 피해 '+number(r.recent)+' · 비중 '+(s.total?r.recent/s.total*100:0).toFixed(1)+'%<br>측정 누적 '+number(r.total)+'</p><small>'+Object.entries(r.parts).map(([kind,value])=>(damageKinds[kind]||kind)+' '+number(value)).join(' · ')+'</small></section>').join('')+'<p class="hint left">측정 시간 '+s.elapsed.toFixed(1)+'초 · 최대 최근 30초, 0.25초 단위 집계<br>모든 적의 HP에서 실제로 차감한 피해를 합산합니다. 다중 대상 합산이므로 기준 DPS와 다를 수 있습니다. 내성·화상·파쇄 포함, 과잉 피해 제외. 메뉴·일시정지·사망 중 시간은 제외하며 전투 중 적을 기다리는 시간은 포함합니다.<br>화상은 가장 강한 기본 화상을 제공한 스킬에 귀속됩니다. 과충전은 룬에 포함됩니다.<br>스킬 교체·전체 초기화·부활·재접속 시 새 측정. 이전 공격의 잔여 피해는 새 측정에서 제외합니다.</p><button class="subtle" id="resetCombatStatsBtn">측정 초기화</button>');$('resetCombatStatsBtn').onclick=()=>{resetCombatStats();openCombatStats();};}

const energyEpoch={magicArrow:0,arcaneBurst:0};
const skinImages=new Map();let skinCardsSignature='';
function skinList(){return classId==='mage'?C.skins:window.MAGE_CLASS_SKINS[classId];}
function skinConfig(id=state.skinId){return skinList().find(s=>s.id===id)||skinList()[0];}
function skinSource(skin){return window.MAGE_REMASTER?.preview(classId,skin.id)|| window.MAGE_CLASS_SKIN_EMBEDDED?.[skin.id]||window.MAGE_SKIN_EMBEDDED?.[skin.id]||skin.path;}
function ensureSkin(id){const cfg=skinConfig(id);if(cfg.builtin)return null;if(skinImages.has(cfg.id))return skinImages.get(cfg.id);const record={status:'loading',image:null};skinImages.set(cfg.id,record);if(typeof Image==='undefined'){record.status='error';return record;}const img=new Image();record.image=img;img.onload=()=>{record.status=img.naturalWidth>0?'ready':'error';skinCardsSignature='';if(tab==='character')renderSkins();};img.onerror=()=>{record.status='error';skinCardsSignature='';if(tab==='character')renderSkins();};img.src=skinSource(cfg);return record;}
function selectSkin(id){if(!skinList().some(s=>s.id===id))return false;state.skinId=id;ensureSkin(id);skinCardsSignature='';save();refresh();return true;}
function renderSkins(){const signature=classId+'|'+state.skinId+'|'+skinList().map(s=>s.id+':'+(skinImages.get(s.id)?.status||'idle')).join('|');if(skinCardsSignature===signature)return;skinCardsSignature=signature;const html=skinList().map(s=>{const selected=s.id===state.skinId,error=skinImages.get(s.id)?.status==='error';return '<button class="skin-card '+(selected?'selected':'')+'" data-skin="'+s.id+'" aria-pressed="'+selected+'" style="--skin:'+s.color+'"><div class="skin-preview"><img src="'+skinSource(s)+'" alt="'+s.name+'" loading="lazy"><span class="skin-fallback" hidden>✧</span></div><strong>'+s.name+'</strong><small>'+s.description+'</small><span class="skin-selected">'+(selected?(error?'기본 외형으로 대체 중':'선택 중'):'외형 선택')+'</span></button>';}).join('');$('skinGallery').innerHTML=html;document.querySelectorAll('.skin-preview img').forEach(img=>{img.onerror=()=>{img.hidden=true;img.nextElementSibling.hidden=false;};});}
function spriteGeometry(){const cfg=skinConfig(),record=ensureSkin(cfg.id);if(!record||record.status!=='ready')return null;const h=170,w=h*record.image.naturalWidth/record.image.naturalHeight;return{cfg,image:record.image,x:hero.x-w/2,y:hero.y+Math.sin(time*2.4)*5+15-h,w,h};}
function castOrigin(){const sprite=spriteGeometry();return sprite?{x:sprite.x+sprite.w*sprite.cfg.tipX,y:sprite.y+sprite.h*sprite.cfg.tipY}:{x:hero.x+45,y:hero.y-95};}

function number(v){return S.format(v);}
function precise(v){return v.toLocaleString('ko-KR',{maximumFractionDigits:4});}
function equipment(id){return state.inventory.find(i=>i.id===state.equipped[id]);}
function hasUnique(slot){return equipment(slot)?.unique===true;}
function itemName(i){if(i.setId)return I.setDefinition(i.setId,classId).name+' — '+C.slots[i.slot].name+' +'+enhanceLevel(i);return i.unique?C.uniques[i.slot].name+' +'+enhanceLevel(i):C.rarities[i.rarity].name+' '+C.slots[i.slot].name;}
function itemColor(i){return i.setId?'#8fe0ab':i.unique?'#e0a9ff':C.rarities[i.rarity].color;}
function character(v,eq=v.equipped){
 const mods=Object.fromEntries(Object.keys(I.defs).map(k=>[k,0])),worn=C.slots.map(slot=>v.inventory.find(i=>i.id===eq[slot.id])),unique=slot=>worn[C.slots.findIndex(s=>s.id===slot)]?.unique===true;
 for(const item of worn){if(!item)continue;mods[C.slots[item.slot].kind]+=item.value*enhanceMult(item);for(const a of item.affixes||[])mods[a.kind]+=a.value*enhanceMult(item);}
 const setCounts=I.setCounts(v,eq);if(setCounts.energy>=3)mods.radius+=10;if(classId!=='mage'){if(setCounts.fire>=3)mods.hpPct+=5;if(setCounts.ice>=3)mods.armor*=1.05;}if(setCounts.lightning>=3)mods[classId==='mage'?'cast':classId==='summoner'?'summonSpeed':'attackSpeed']+=5;if(setCounts.cosmic>=3)mods[classId==='mage'||classId==='summoner'?'cooldown':'attackSpeed']+=5;
 if(classId==='warrior'){mods.hpPct+=25+4*(v.skillLevels.strongBody||0);mods.armor*=1.25*(1+.05*(v.skillLevels.ironWall||0));}if(classId==='rogue')mods.hpPct-=10;
 const magicPower=S.power(v.powerLevel)+mods.magicPower,magicAtk=1+mods.magicAtk,hp=(C.basePlayerHP+mods.hp)*(1+mods.hpPct/100)*(unique('helmet')?1.1:1),armor=mods.armor;
 const crit=Math.min(.6,mods.crit/100),critMult=1.5+mods.critDamage/100+(unique('gloves')?.2:0);
 return{attackSpeed:Math.min(1.5,mods.attackSpeed/100),summonSpeed:Math.min(1,mods.summonSpeed/100),summonHP:mods.summonHP,leech:mods.leech,setCounts,magicPower,magicAtk,hp,armor,crit,critMult,castReduction:Math.min(.65,mods.cast/100),cdr:Math.min(.5,mods.cooldown/100),bossBonus:unique('staff')?.1:0,ehp:hp*(1+armor/100),reduction:armor/(100+armor),rangeBonus:mods.radius/100+(unique('ring')?.05:0),move:Math.min(100,mods.move),regen:mods.regen,goldBonus:mods.gold/100+(unique('necklace')?.05:0)};
}
function spellStats(id,v=state,eq=v.equipped){if(classId!=='mage')return classStats(id,v,eq);const n=S.byId[id]||S.byId.energyBolt,c=character(v,eq),invested=v.skillLevels[n.id]||0,bonusLevel=invested?I.setLevels(c.setCounts[n.family]):0,level=Math.max(1,invested)+bonusLevel,synergy=S.synergy(v.skillLevels,n.id),setDamage=c.setCounts[n.family]>=2?.1:0,cosmic=n.family==='cosmic'?(v.skillLevels.singularity||0):0;
 const amplification=n.family==='energy'?.05*(v.skillLevels.piercing||0):0;
 const unit=c.magicPower*c.magicAtk*(1+.15*(level-1))*(1+.1*cosmic)*(1+synergy+setDamage+amplification);
 const tornadoDuration=.8*(2+.1*(level-1));
 const duration=id==='flameExplosion'?1.6+tornadoDuration:id==='iceSpear'?2.4:id==='blizzard'?3+.2*(level-1):id==='meteor'||id==='chainLightning'?3:id==='thunderstorm'?4:0;
 const directCoef=['flameExplosion','blizzard','chainLightning'].includes(id)?0:n.coef,dotCoef=id==='chainLightning'?0:id==='thunderstorm'?2.5875:id==='blizzard'?3:['meteor','flameExplosion'].includes(id)?2:0;
 const hitCount=id==='chainLightning'?level+3:0,hitDamage=id==='chainLightning'?c.magicPower*c.magicAtk*(1+synergy+setDamage)*n.coef:0;
 const runeInterval=id==='magicArrow'?Math.max(.5,1.2-.05*(level-1)):0;
 const damage=unit*directCoef,dotDps=unit*dotCoef,totalDamage=hitCount?hitDamage*hitCount:damage+dotDps*duration,cast=n.cast*(1-c.castReduction),cooldown=n.cd*(1-c.cdr);
 return{...c,damage,dotDps,duration,totalDamage,hitCount,hitDamage,runeInterval,tornadoDuration,amplification,invested,bonusLevel,synergy,setDamage,level,cast,cooldown,interval:cast+cooldown,radius:n.radius*(1+c.rangeBonus+.08*cosmic+(n.family==='cosmic'&&c.setCounts.cosmic>=5?.2:0)),dps:totalDamage*(1+c.crit*(c.critMult-1))/(runeInterval||cast+cooldown)};}

function combinedStats(v,eq=v.equipped){if(classId!=='mage'){const c=character(v,eq),ids=v.activeSlots.filter(Boolean),ss=ids.map(id=>classStats(id,v,eq)),load=ss.reduce((a,st)=>a+st.cast/(st.interval||1),0),dps=ss.reduce((a,st)=>a+st.dps,0)/Math.max(1,load);return{...ss[0],...c,dps,bossDps:dps*(1+c.bossBonus)};}const ids=v.activeSlots.filter(Boolean),c=character(v,eq),first=spellStats(ids[0]||'energyBolt',v,eq);let direct=0,load=0;
 for(const id of ids){const st=spellStats(id,v,eq);if(id!=='magicArrow'){direct+=st.dps;load+=st.cast/st.interval;}}
 const contention=Math.max(1,load);let dps=direct/contention;const oc=v.skillLevels.overcharge||0,need=c.setCounts.energy>=5?3:4;
 if(ids.includes('magicArrow')){const rs=spellStats('magicArrow',v,eq);dps+=rs.dps;if(oc){const boltRate=ids.includes('energyBolt')?1/spellStats('energyBolt',v,eq).interval/contention:0,burstRate=ids.includes('arcaneBurst')?1/spellStats('arcaneBurst',v,eq).interval/contention:0;dps+=rs.damage*(1+.4*oc)*(1+c.crit*(c.critMult-1))*((1/rs.runeInterval+boltRate)/need+burstRate);}}
 else if(oc){for(const id of ids.filter(id=>S.byId[id].family==='energy'))dps+=spellStats(id,v,eq).dps/contention*(.25*oc)/(need+1);}
 return{...first,...c,dps,bossDps:dps*(1+c.bossBonus)};}
function stats(tier=state.tier,lv=null,eq=state.equipped){return combinedStats(state,eq);}
function migrateSkills(clean,old){
 clean.bossCleared=Array.from({length:Math.max(0,clean.best-1)},(_,i)=>i+1);
 for(const n of clean.bossCleared)if(n%100===0){clean.fullSetClaimed.push(n);clean.fullSetPending.push(n);}
 const family=['energy','energy','ice','ice','lightning','lightning','fire','fire','cosmic','cosmic'][old.tier];
 let remaining=1+clean.bossCleared.reduce((x,n)=>x+S.reward(n),0)-1;
 const trees=family==='cosmic'?S.trees:[...S.trees.filter(t=>t.id===family),...S.trees.filter(t=>t.id!==family)];
 for(const tree of trees)for(const node of tree.nodes){while(clean.skillLevels[node.id]<node.max&&remaining>=node.cost&&S.available(clean.skillLevels,node.id)){clean.skillLevels[node.id]++;remaining-=node.cost;}}
 const unlocked=S.nodes.filter(n=>n.type==='active'&&clean.skillLevels[n.id]>0),preferred=unlocked.filter(n=>n.family===family).reverse();
 clean.activeSlots=[...preferred,...unlocked.filter(n=>n.family!==family)].slice(0,3).map(n=>n.id);while(clean.activeSlots.length<3)clean.activeSlots.push(null);
 let mana=10,cast=0,cd=0,crit=0,critD=0;for(const slot of C.slots){const i=old.inventory.find(i=>i.id===old.equipped[slot.id]);if(!i)continue;if(i.slot===0)mana+=i.value;if(i.slot===2)cast+=i.value;if(i.slot===3)cd+=i.value;if(old.version>=4){if(i.slot===4)crit+=i.value;for(const a of i.affixes||[]){if(a.kind==='mana')mana+=a.value;if(a.kind==='cast')cast+=a.value;if(a.kind==='cooldown')cd+=a.value;if(a.kind==='crit')crit+=a.value;if(a.kind==='critDamage')critD+=a.value;}}if(i.slot===4&&i.unique)critD+=20;}
 const l=old.levels[old.tier],t=old.tier,oldDps=mana*4.2**t*(1+.01*l.damage)*(1+Math.min(.6,crit/100)*(.5+critD/100))/(.2*1.05**t*(1-.005*l.cast)*(1-Math.min(.65,cast/100))+.8*1.05**t*(1-.005*l.cooldown)*(1-Math.min(.65,cd/100)));
 const baseline=combinedStats(clean).dps,required=Math.max(10,oldDps/baseline*character(clean).magicPower-character(clean).magicPower+10);let lo=0,hi=1;while(S.power(hi)<required&&hi<1e9)hi*=2;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(S.power(mid)>=required)hi=mid;else lo=mid+1;}clean.powerLevel=lo;
 clean.migration={from:old.version,oldDps,newDps:combinedStats(clean).dps};
 for(const id of clean.activeSlots.filter(Boolean))clean.cooldowns[id]=spellStats(id,clean).cooldown;
}
function availableSP(){return 1+state.bossCleared.reduce((s,n)=>s+S.reward(n),0)-S.spent(state.skillLevels);}
function resetSkills(){if(state.dead||S.spent(state.skillLevels)<=1)return false;const refunded=S.spent(state.skillLevels)-1;
 classClear();resetCombatStats();
 state.skillLevels=S.blank();state.activeSlots=[firstSkill(),null,null];state.cooldowns={[firstSkill()]:spellStats(firstSkill()).cooldown};state.energyCasts=0;runeActive=false;runeClock=0;lastOvercharge=-100;
 scheduled=[];castingId=null;roundRobin=0;phase='ready';phaseLeft=0;phaseTotal=1;effects=[];particles=[];texts=[];
 for(const e of enemies){e.burns=[];e.burnLeft=0;e.burnDPS=0;e.slow=0;e.novaUntil=0;e.novaSlow=0;e.iceStacks=0;e.ccUntil=0;e.ccLabel='';e.shockUntil=0;e.starStacks=0;e.markUntil=0;}
 // Enemy HP/position/attack timers and CC immunity remain; respec cannot heal, restart or farm the encounter.
 save();hideModal();showTab('grimoire');toast('스킬 초기화 · '+refunded+' SP 반환');return true;
}
function confirmSkillReset(){const refund=S.spent(state.skillLevels)-1;if(state.dead||refund<=0)return;modal('<div class="eyebrow">FREE SKILL RESET</div><h2 id="modalTitle">스킬을 초기화할까요?</h2><p class="lead"><b>'+refund+' SP 반환</b> · 초기화 후 사용 가능 '+(availableSP()+refund)+' SP<br>Energy Bolt Lv.1만 남고 다른 스킬과 초월 계열이 잠깁니다.<br>마력·골드·장비·외형·진행은 유지됩니다.</p><p class="hint left">3슬롯은 Energy Bolt 하나로 초기화되고 전체 쿨타임이 적용됩니다. 진행 중 시전·예약 공격·화상·빙결·감전·과충전 효과는 사라집니다. 적 HP와 공격 대기시간은 그대로입니다.</p><div class="setting-row"><button id="confirmSkillResetBtn" class="primary">무료 초기화 · '+refund+' SP 반환</button><button id="cancelSkillResetBtn" class="subtle">취소</button></div>');$('confirmSkillResetBtn').onclick=resetSkills;$('cancelSkillResetBtn').onclick=hideModal;}
function learn(id){const n=S.byId[id];if(!n||state.dead||!S.available(state.skillLevels,id,state.powerLevel)||state.skillLevels[id]>=n.max||availableSP()<n.cost)return false;state.skillLevels[id]++;save();refresh();return true;}
function slotSkill(slot,id){if(state.dead||!Number.isInteger(slot)||slot<0||slot>2||id!==null&&(!S.byId[id]||S.byId[id].type!=='active'||!state.skillLevels[id]))return false;
 if(state.activeSlots[slot]===id)return false;if(id&&state.activeSlots.includes(id)){toast('같은 스킬은 한 슬롯에만 장착할 수 있어요.');return false;}if(!id&&state.activeSlots.filter(Boolean).length===1)return false;
 const removed=state.activeSlots[slot];allies=allies.filter(a=>a.skill!==removed);if(removed==='poisonWeapon')classBuffs.poison=false;if(removed==='clone')classBuffs.clone=0;if(removed in summonEpoch){summonEpoch[removed]++;effects=effects.filter(f=>f.spell!==removed);}
 if(removed in energyEpoch)energyEpoch[removed]++;resetCombatStats();
 state.activeSlots[slot]=id;if(!state.activeSlots.includes('magicArrow')){runeActive=false;runeClock=0;}if(id)state.cooldowns[id]=spellStats(id).cooldown;castingId=null;phase='ready';phaseLeft=0;save();refresh();return true;}
function awardBoss(stage){if(state.bossCleared.includes(stage))return false;state.bossCleared.push(stage);if(stage%100===0&&!state.fullSetClaimed.includes(stage)){state.fullSetClaimed.push(stage);state.fullSetPending.push(stage);}toast('최초 처치 · SP +'+S.reward(stage)+(stage%100===0?' · 유니크 풀세트 보관':''));return true;}
function claimFullSet(stage){if(state.dead||!state.fullSetPending.includes(stage))return false;if(state.inventory.length+7>C.inventoryLimit){toast('보관함 7칸을 비워 주세요. 풀세트 보상은 보관됩니다.');return false;}for(let slot=0;slot<7;slot++)state.inventory.push(I.rollSet(I.create(stage,slot,2,true,'set-'+stage+'-'+slot)));if(!state.uniqueClaimed.includes(stage))state.uniqueClaimed.push(stage);state.fullSetPending=state.fullSetPending.filter(n=>n!==stage);save();refresh();return true;}
function stageGoal(s=state.stage){return C.killsPerStage*s;}
function packSize(s=state.stage){return s;}
function packInterval(s=state.stage){return Math.max(C.minPackInterval,(C.basePackInterval-C.packIntervalStep*(s-1))/(1+stats().move/100));}
const bossBaseHPTable=[0,C.bossBaseHP];
function baseBossHPAt(s){for(let n=bossBaseHPTable.length;n<=s;n++)bossBaseHPTable[n]=Math.min(1e270,bossBaseHPTable[n-1]*(C.hpGrowth+C.bossHPGrowthStep*(n-2)));return bossBaseHPTable[s]*(C.bossHP+C.bossHPStep*(s-1));}
function baseHPAt(s){return C.baseEnemyHP*Math.pow(C.normalHPGrowth,Math.max(1,s)-1);}function attackAt(s){return C.baseEnemyAttack*C.hpGrowth**(s-1);}function goldAt(s){return Math.round(C.baseGold*C.goldGrowth**(s-1));}
// Geometric interpolation keeps stage transitions smooth while avoiding an ever-growing extra exponent.
function hpCorrection(s,anchors){for(let i=1;i<anchors.length;i++){const [a,x]=anchors[i-1],[b,y]=anchors[i];if(s<=b)return x*(y/x)**((s-a)/(b-a));}return anchors[anchors.length-1][1];}
function hpAt(s){return baseHPAt(s);}
function bossHPAt(s){return baseBossHPAt(s)*hpCorrection(s,C.bossHPAnchors);}
function enemyHPLabel(){const boss=enemies.find(e=>e.boss&&e.hp>0&&!e.rewarded);return boss?'BOSS HP '+number(Math.max(0,boss.hp))+' / '+number(boss.maxHP):state.bossActive?'BOSS HP '+number(bossHPAt(state.stage)):'적 HP '+number(hpAt(state.stage));}
function slotGaugeState(i,cdr=character(state).cdr){const id=state.activeSlots[i];if(!id)return{phase:'empty',fill:0,cast:0,label:'＋'};if(id==='magicArrow'&&runeActive){const interval=spellStats(id).runeInterval;return{phase:'ready',fill:Math.max(0,Math.min(1,1-runeClock/interval)),cast:0,label:'ACTIVE · '+Math.max(0,runeClock).toFixed(1)+'s'};}if(castingId===id)return{phase:'casting',fill:1,cast:Math.max(0,Math.min(1,1-phaseLeft/phaseTotal)),label:'CASTING'};const left=state.cooldowns[id]||0,total=spellStats(id).cooldown;if(classId!=='mage'&&!classReady(id)&&((S.byId[id].summon&&allies.some(a=>a.skill===id))||S.byId[id].persistent&&classBuffs.poison))return{phase:'ready',fill:1,cast:0,label:'ACTIVE'};return{phase:left>0?'cooldown':'ready',fill:Math.max(0,Math.min(1,1-left/total)),cast:0,label:left>0?left.toFixed(1)+'s':'READY'};}
function refreshSlotGauges(){refreshEnergyGauge();const cdr=character(state).cdr,meter=combatSnapshot();state.activeSlots.forEach((id,i)=>{const info=slotGaugeState(i,cdr),slot=$('activeSlot'+i);if(!slot)return;slot.dataset.phase=info.phase;$('slotFill'+i).style.transform='scaleX('+info.fill+')';$('slotCast'+i).style.transform='scaleX('+info.cast+')';$('slotStatus'+i).textContent=info.label;const reading=$('slotDps'+i);if(reading)reading.textContent=id?'실제 DPS '+(meter.seconds?number(meter.rows.find(r=>r.id===id)?.dps||0):'—'):'—';slot.setAttribute('aria-label','슬롯 '+(i+1)+' · '+(S.byId[id]?.name||'비어 있음')+' · '+info.label+' · 눌러서 교체');});}
function quote(){return S.powerQuote(state.powerLevel,state.gold,bulk);}
function save(){if(protectSave){$('saveStatus').textContent='원본 보호 중 · 백업 가져오기';return;}try{localStorage.setItem(classKey(),JSON.stringify(state));const shared=JSON.parse(localStorage.getItem('mage-rising-shared')||'{}');Object.assign(shared,{selectedClass:classId,sound:state.sound,lowFX:state.lowFX});localStorage.setItem('mage-rising-shared',JSON.stringify(shared));storageOK=true;$('saveStatus').textContent='저장됨';$('saveStatus').classList.remove('save-warning');}catch(e){storageOK=false;$('saveStatus').textContent='저장 불가 · 백업 권장';$('saveStatus').classList.add('save-warning');}}
function toast(s){$('toast').textContent=s;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),3300);}
function banner(s){$('banner').textContent=s;$('banner').classList.add('show');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>$('banner').classList.remove('show'),2000);}
function sound(freq=440,dur=.1,type='sine',volume=.035){if(!state.sound)return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(freq*.6,audioCtx.currentTime+dur);g.gain.setValueAtTime(volume,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+dur);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);}catch(e){}}
function setPhase(){castingId=null;phase='ready';phaseLeft=0;phaseTotal=1;}
function buy(){if(state.dead)return;const q=quote();if(!q.n||q.cost>state.gold)return;state.gold-=q.cost;state.powerLevel+=q.n;save();refresh();sound(650,.08);}
function spawn(boss=false){if(enemies.length>=C.maxEnemies&&!boss)return;const s=state.stage,hp=boss?bossHPAt(s):hpAt(s);enemies.push({id:++enemyID,x:boss?1040:1010+Math.random()*70,y:245+Math.random()*80,size:boss?37:16+Math.random()*8,type:boss?(s+2)%6:Math.floor(Math.random()*10),hp,maxHP:hp,attack:attackAt(s)*(boss?C.bossAttack:1),gold:goldAt(s)*(boss?20:1),speed:(boss?66:75+Math.random()*28)*C.enemySpeedMultiplier,attackCD:.5+Math.random()*1.2,stopX:245+Math.random()*35,boss,stage:s,flash:0,slow:0,ccUntil:0,ccImmuneUntil:0,iceStacks:0,markUntil:0,burnLeft:0,burnDPS:0,starStacks:0,knockReady:0,seed:Math.random()*TAU});}
function gachaTick(dt){
 if(!state.started||document.hidden||!Number.isFinite(dt)||dt<=0)return;
 state.gachaSeconds=Math.min(60,state.gachaSeconds+Math.min(dt,1));
}
function refreshGacha(){
 const ready=state.gachaSeconds>=60,n=state.gachaDraws%10;
 $('gachaBtn').textContent=ready?'🎁 무료 뽑기 · 준비 완료':'🎁 무료 뽑기 · '+Math.ceil(60-state.gachaSeconds)+'초';
 $('gachaProgress').textContent='유니크 확정까지 '+(10-n)+'회 · 누적 '+state.gachaDraws+'회';
}
function openGacha(){
 const ready=state.gachaSeconds>=60,next=state.gachaDraws+1;
 modal('<small>MAGE SHOP · 모의 결제</small><h2 id="modalTitle">마법사의 보물 상자</h2><div class="gacha-chest">🎁</div><p>장비 1개 · 최고 도달 스테이지 '+state.best+' 기준</p><p><s>₩1,100</s> → <b>₩0 무료</b></p><p>실제 청구 없음 · 결제 정보 입력 없음</p><p>'+(next%10===0?'✦ 이번 뽑기는 유니크 확정!':'유니크 확정까지 '+(10-state.gachaDraws%10)+'회')+'</p><p class="hint">일반 회차: 일반 55% · 고급 30% · 희귀 14% · 유니크급 1%<br>10·20·30…회: 유니크급 100% · 부위와 옵션은 무작위<br>유니크급: 일반 유니크 70% / 세트 30%, 세트 5종 균등<br>화면이 열린 동안만 60초 누적 · 준비된 기회는 1회 보관</p><button id="gachaBuy" class="primary" '+(!ready?'disabled':'')+'>'+(ready?'무료 모의 결제 · 상자 열기':'아직 준비 중 · 닫고 기다려 주세요')+'</button>');
 $('gachaBuy').onclick=claimGacha;
}
function claimGacha(){
 if(!state.started||document.hidden||state.gachaSeconds<60)return false;
 if(state.inventory.length>=C.inventoryLimit){toast('보관함 1칸을 비워 주세요. 뽑기 기회는 유지됩니다.');return false;}
 const n=state.gachaDraws+1,r=Math.random(),unique=n%10===0||r>=.99,grade=r<.55?0:r<.85?1:2;
 const item=I.rollSet(I.create(state.best,Math.floor(Math.random()*8),grade,unique,'gacha-'+n));
 state.inventory.push(item);state.gachaDraws=n;state.gachaSeconds=0;newItems++;save();
 modal('<small>모의 결제 완료 · 실제 청구 ₩0</small><h2 id="modalTitle">'+(item.setId?'✦ SET!':unique?'✦ UNIQUE!':'보물 상자 개봉!')+'</h2><div class="gacha-reveal" style="color:'+itemColor(item)+'">'+icon(item.slot)+'<h3>'+itemName(item)+'</h3><p>'+itemValue(item)+'</p></div><p>장비 보관함에 지급 완료 · 누적 '+n+'회</p><button id="gachaDone" class="primary">확인</button>');
 $('gachaDone').onclick=hideModal;sound(unique?950:650,.3);return item;
}
const forgeNames=['일반','고급','희귀'];
function enhanceLevel(i){const xp=i.enhanceXP||0;return xp<1?0:Math.floor((1+Math.sqrt(4*xp-3))/2);}
function enhanceMult(i){return 1+(i.unique?enhanceLevel(i)*.1:0);}
function forgePlan(){
 const worn=new Set(Object.values(state.equipped));
 for(let r=0;r<3;r++)for(let slot=0;slot<8;slot++){
 const items=state.inventory.filter(i=>!i.unique&&i.rarity===r&&i.slot===slot&&!worn.has(i.id)).sort((a,b)=>a.stage-b.stage||a.id.localeCompare(b.id));
 const shard=state.fragments[r]>0,need=shard?2:3;
 if(items.length>=need)return{r,slot,shard,ids:items.slice(0,need).map(i=>i.id),stage:Math.floor(items.slice(0,need).reduce((n,i)=>n+i.stage,0)/need),chance:[.9,.7,.5][r]};
 }return null;
}
function openForge(){
 if(state.dead)return;const p=forgePlan();
 modal('<h2 id="modalTitle">자동 합성</h2><p>일반 → 고급 90% · 고급 → 희귀 70% · 희귀 → 유니크급 50%</p><p>'+forgeNames.map((n,i)=>n+' 조각 '+state.fragments[i]).join(' · ')+'</p><p>착용·유니크 제외 · 일반부터, 부위 순서대로<br>같은 부위·등급 중 낮은 스테이지부터 선택 · 조각 우선</p>'+(p?'<p>'+forgeNames[p.r]+' '+C.slots[p.slot].name+' '+p.ids.length+'개'+(p.shard?' + 동급 조각 1개':'')+' → S'+p.stage+'</p><p>성공률 '+p.chance*100+'% · 성공: 상위 등급 장비 1개<br>실패: 동급 조각 1개 · 투입 재료는 소모됩니다.</p><button class="primary" id="forgeOnce">합성 1회</button>':'<p>합성 가능한 재료가 없습니다.</p>'));
 if(p)$('forgeOnce').onclick=()=>forgeOnce(p);
}
function forgeOnce(expected){
 if(state.dead)return false;const p=forgePlan();if(!p||JSON.stringify(p)!==JSON.stringify(expected))return false;
 const success=Math.random()<p.chance,n=state.forgeCount+1;
 const item=success?I.rollSet(I.create(p.stage,p.slot,Math.min(2,p.r+1),p.r===2,'forge-'+n)):null;
 state.inventory=state.inventory.filter(i=>!p.ids.includes(i.id));if(p.shard)state.fragments[p.r]--;state.forgeCount=n;
 if(item){state.inventory.push(item);newItems++;}else state.fragments[p.r]++;
 save();modal('<h2 id="modalTitle">'+(success?'합성 성공!':'합성 실패')+'</h2><p>'+(item?itemName(item)+'<br>'+itemLines(item):forgeNames[p.r]+' 조각 1개 획득')+'</p><button id="forgeAgain" class="primary">다음 재료 확인</button>');$('forgeAgain').onclick=openForge;return{success,item};
}
function absorbPreview(base,material){return{...base,enhanceXP:(base.enhanceXP||0)+(material.enhanceXP||0)+1};}
function absorb(baseId,materialId){
 if(state.dead||baseId===materialId)return false;const base=state.inventory.find(i=>i.id===baseId),mat=state.inventory.find(i=>i.id===materialId);
 if(!base?.unique||!mat?.unique||base.slot!==mat.slot||Object.values(state.equipped).includes(mat.id))return false;
 const next=absorbPreview(base,mat);if(next.enhanceXP>1e12)return false;
 base.enhanceXP=next.enhanceXP;state.inventory=state.inventory.filter(i=>i.id!==materialId);save();refresh();return true;
}
function openAbsorb(id){
 if(state.dead)return;const base=state.inventory.find(i=>i.id===id);if(!base?.unique)return;
 const mats=state.inventory.filter(i=>i.unique&&i.slot===base.slot&&i.id!==id&&!Object.values(state.equipped).includes(i.id));
 const lv=enhanceLevel(base),floor=lv===0?0:1+lv*(lv-1),need=lv===0?1:2*lv;
 modal('<h2 id="modalTitle">유니크 흡수 강화</h2><p>유지할 장비: <b>'+itemName(base)+'</b><br>'+itemLines(base)+'</p><p>강화 경험치 '+((base.enhanceXP||0)-floor)+' / '+need+' · 같은 부위의 미착용 유니크만 재료로 사용 가능<br>기본 성능·옵션·고유능력은 선택한 장비를 유지합니다.</p><div id="absorbList">'+(mats.map(i=>'<button class="subtle" id="mat-'+i.id+'">'+itemName(i)+' · S'+i.stage+' 흡수</button>').join('')||'같은 부위의 미착용 유니크 재료가 없습니다.')+'</div>');
 for(const mat of mats)$('mat-'+mat.id).onclick=()=>{const next=absorbPreview(base,mat);modal('<h2 id="modalTitle">흡수 결과 확인</h2><p>유지: '+itemName(base)+' · S'+base.stage+'<br>소모: '+itemName(mat)+' · S'+mat.stage+'</p><p>결과: '+itemName(next)+'<br>'+itemLines(next)+'</p><p>재료는 사라지고, 누적 강화 경험치는 전부 이전됩니다. 재료의 세트 소속과 옵션은 사라지며 남길 장비의 세트는 유지됩니다.</p><button id="absorbConfirm" class="primary">흡수 확정</button>');$('absorbConfirm').onclick=()=>{if(absorb(id,mat.id)){openAbsorb(id);toast('흡수 강화 완료');}};};
}
function rarity(){const r=Math.random();return r<.55?0:r<.85?1:r<.99?2:3;}
function itemMods(item){const out={[C.slots[item.slot].kind]:item.value*enhanceMult(item)};for(const a of item.affixes||[])out[a.kind]=(out[a.kind]||0)+a.value*enhanceMult(item);return out;}
function dominates(a,b){if(a.slot!==b.slot)return false;const am=itemMods(a),bm=itemMods(b),keys=new Set([...Object.keys(am),...Object.keys(bm)]);let stronger=false;for(const k of keys){if((am[k]||0)<(bm[k]||0))return false;if((am[k]||0)>(bm[k]||0))stronger=true;}return stronger||state.inventory.indexOf(a)<state.inventory.indexOf(b);}
function dispensable(item){return !item.unique&&!Object.values(state.equipped).includes(item.id)&&state.inventory.some(other=>other.id!==item.id&&dominates(other,item));}
function dropItem(stage){const slot=state.drops%8,r=rarity();state.drops++;if(state.inventory.length>=C.inventoryLimit){if(r===3){state.dropChests.push({stage,serial:state.drops});toast('유니크급 드롭 보관 · 장비 탭에서 수령');save();return null;}state.fragments[r]++;toast('보관함 가득 참 · '+forgeNames[r]+' 조각 +1');save();return null;}const item=I.rollSet(I.create(stage,slot,Math.min(2,r),r===3,'drop-'+state.drops));state.inventory.push(item);newItems++;toast(itemName(item)+' 획득 · 장비 탭에서 확인');save();return item;}
function claimDrop(){if(state.dead||!state.dropChests.length||state.inventory.length>=C.inventoryLimit)return false;const reward=state.dropChests.shift();state.inventory.push(I.rollSet(I.create(reward.stage,(reward.serial-1)%8,2,true,'drop-'+reward.serial)));save();refresh();return true;}
function kill(e){if(e.hp>0||e.rewarded)return;e.rewarded=true;spreadBurn(e);const reward=Math.round(e.gold*(1+stats().goldBonus));state.gold+=reward;state.totalKills++;burst(e.x,e.y-15,(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color,e.boss?28:7);float(e.x,e.y-25,'+'+number(reward),'#edc884',false);if(e.boss){dropItem(e.stage);awardBoss(e.stage);if(e.stage%100!==0)awardUnique(e.stage);state.stage=Math.min(C.maxStage,state.stage+1);state.best=Math.max(state.best,state.stage);state.kills=0;state.bossActive=false;state.hp=Math.min(stats().hp,state.hp+stats().hp*(hasUnique('boots')?.4:.3));banner(state.stage===C.maxStage?'최종 구간 · STAGE '+C.maxStage:'STAGE '+state.stage+' · 새로운 구간');spawnClock=.5;pendingSpawn=0;save();}else if(!state.bossActive&&e.stage===state.stage){state.kills=Math.min(stageGoal(),state.kills+1);if(state.kills>=stageGoal()){state.bossActive=true;pendingSpawn=0;spawn(true);banner(state.stage%100===0?'대보스 · ARCANE OVERLORD':state.stage%10===0?'강화보스 · RIFT WARDEN':'보스 출현');sound(150,.35,'triangle');save();}}}
function applyDamage(e,amount,color,tag='',source=null,kind='direct',epoch=meterEpoch){if(e.hp<=0||e.rewarded)return;recordDamage(source,Math.min(e.hp,Math.max(0,amount)),kind,epoch);e.hp-=amount;e.flash=.14;float(e.x,e.y-e.size-10,tag+number(amount),color,true);kill(e);}
function freezeOrStun(e,duration,label){if(label==='빙결')duration*=coldDuration();if(time<e.ccImmuneUntil)return false;e.ccUntil=time+duration;e.ccImmuneUntil=e.ccUntil+(e.boss?2.5:1);e.ccLabel=label;return true;}
function setCount(id){return I.setCounts(state)[id]||0;}
function coldDuration(){return passive('cold')&&setCount('ice')>=3?1.15:1;}
function jumpCount(){return passive('jump')+(passive('jump')&&setCount('lightning')>=5?1:0);}
function pierceLoss(){return .18;}
function passive(id){return state.skillLevels[id]||0;}
function resistDamage(e,amount,family){const r=S.resistance(e.stage);return amount*(family===r.family?1-r.value:1);}
// One shared burn per enemy: the strongest active base DPS, one refreshed timer, three intensity stages.
function addBurn(e,dps,duration,spread=false,increment=true,stage=1,source=null,epoch=meterEpoch){
 if(e.hp<=0||e.rewarded)return;
 if(!spread&&passive('blaze')){if(setCount('fire')>=3)duration+=1;if(setCount('fire')>=5)dps*=1.25;}
 const old=e.burns?.[0],live=old&&old.left>0;
 const stacks=live?Math.min(3,Math.max(old.stacks||1,spread?stage:1)+(increment&&!spread?1:0)):Math.min(3,spread?stage:1);
 const owner=live&&old.dps>dps?old:{source,epoch};
 e.burns=[{source:owner.source,epoch:owner.epoch,dps:live?Math.max(old.dps,dps):dps,left:duration,stacks,spread:live?old.spread&&spread:spread}];
 e.burnLeft=duration;e.burnDPS=e.burns[0].dps*[0,1,1.2,2][stacks];
}
function spreadBurn(e){if(!passive('spread')||!e.burns?.length||e.burns.every(b=>b.spread))return;const b=e.burns[0];for(const other of enemies)if(other!==e&&other.hp>0&&other.stage===e.stage&&Math.hypot(other.x-e.x,other.y-e.y)<=55+15*passive('spread'))addBurn(other,b.dps,b.left,true,false,b.stacks,b.source,b.epoch);}
function hitSpell(e,raw,n,st,critical){if(e.hp<=0||e.rewarded)return;
 const amount=raw*(e.boss?1+st.bossBonus:1),shatter=n.family==='ice'&&n.id!=='blizzard'&&e.ccLabel==='빙결'&&e.ccUntil>time&&passive('shatter')>0;
 applyDamage(e,resistDamage(e,amount,n.family),critical?'#ffe4a8':n.color,critical?'✦ ':'',n.id,st.damageKind||'direct',st.meterEpoch);if(e.hp<=0)return;
 if(n.family==='fire'&&!st.noBurn)addBurn(e,amount*.12,3+.4*passive('blaze'),false,true,1,n.id,st.meterEpoch);
 if(n.family==='ice'&&n.id!=='blizzard'){
 if(shatter){e.ccUntil=time;e.iceStacks=0;e.ccLabel='';applyDamage(e,resistDamage(e,amount*.25*passive('shatter')*(setCount('ice')>=5?1.25:1),'ice'),'#edfbff','❄ ',n.id,'shatter',st.meterEpoch);burst(e.x,e.y-20,'#c9faff',20);}
 else{e.slow=2*coldDuration();if(passive('cold')){e.iceStacks++;if(e.iceStacks>=3){e.iceStacks=0;freezeOrStun(e,(.5+.15*passive('cold'))*(e.boss?.25:1),'빙결');}}}}
 if(n.family==='lightning'&&passive('shock')){e.shockUntil=time+3;if(Math.random()<.08*passive('shock'))freezeOrStun(e,(.18+.025*passive('shock'))*(e.boss?.3:1),'마비');}
 if(n.id==='starfall'){e.starStacks++;if(e.starStacks>=3){e.starStacks=0;burst(e.x,e.y-20,'#effbff',26);for(const other of enemies)if(other.hp>0&&other.stage===e.stage&&Math.hypot(other.x-e.x,other.y-e.y)<=st.radius*.45)applyDamage(other,raw*.6*(other.boss?1+st.bossBonus:1),'#def8ff','✧ ',n.id,'resonance',st.meterEpoch);}}
 if(n.id==='blackHole'&&!e.boss){const pull=.2+.035*passive('singularity');e.x=Math.max(e.stopX,e.x+(st.center.x-e.x)*pull);e.y+=(st.center.y-e.y)*pull;}
}
function schedule(delay,run){scheduled.push({at:time+delay,run});}
function chargeNeed(){return setCount('energy')>=5?3:4;}
function refreshEnergyGauge(){const box=$('energyGauge');if(!box)return;box.hidden=!passive('overcharge')||!state.activeSlots.some(id=>id&&S.byId[id].family==='energy');const need=chargeNeed(),charge=Math.min(need,state.energyCasts);box.innerHTML='<span>OVERCHARGE '+charge+'/'+need+'</span><span class="charge-pips">'+Array.from({length:need},(_,i)=>'<i class="'+(i<charge?'filled':'')+'"></i>').join('')+'</span>';}
function runePosition(){return{x:hero.x+82+Math.sin(time*1.4)*14,y:hero.y-58+Math.cos(time*1.8)*9};}
function runeWave(epoch=meterEpoch){
 if(!runeActive||!state.activeSlots.includes('magicArrow')||!passive('overcharge')||state.dead)return false;
 if(time-lastOvercharge<.026)return false;lastOvercharge=time;waveCount++;
 const st=spellStats('magicArrow'),origin=runePosition(),radius=st.radius*1.3,crit=Math.random()<st.crit,amount=st.damage*(1+.4*passive('overcharge'))*(crit?st.critMult:1);
 st.meterEpoch=epoch;st.damageKind='overcharge';
 effects.push({spell:'runeWave',x:origin.x,y:origin.y,r:radius,age:0,duration:.65,color:'#e2caff'});
 for(const e of [...enemies])if(e.hp>0&&Math.hypot(e.x-origin.x,e.y-origin.y)<=radius)hitSpell(e,amount,S.byId.magicArrow,st,crit);
 return true;
}
function energyCharge(epoch=meterEpoch){if(!passive('overcharge'))return;state.energyCasts=Math.min(chargeNeed(),state.energyCasts+1);if(runeActive&&state.energyCasts>=chargeNeed()){state.energyCasts=0;runeWave(epoch);}}
function updateRune(dt){
 if(!runeActive)return;if(!state.activeSlots.includes('magicArrow')||!state.skillLevels.magicArrow||state.dead){runeActive=false;return;}
 const st=spellStats('magicArrow');runeClock=Math.min(runeClock,st.runeInterval);runeClock-=dt;if(runeClock>1e-8)return;runeClock+=st.runeInterval;
 // Preserve the previous wide target selection, now with visible shots from the summon.
 const targets=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-hero.x,e.y-hero.y)<=st.radius);if(!targets.length)return;
 lastRunePulse=time;const crit=Math.random()<st.crit,origin=runePosition(),stage=state.stage,epoch=energyEpoch.magicArrow;
 st.meterEpoch=meterEpoch;st.damageKind='summon';
 effects.push({spell:'runeShot',origin,targets:targets.map(e=>({x:e.x,y:e.y-15})),age:0,duration:.38,impactAt:.16,r:32,color:'#d5bdff'});
 schedule(.16,()=>{
  if(!runeActive||state.dead||state.stage!==stage||epoch!==energyEpoch.magicArrow)return;
  let hits=0;for(const e of targets)if(e.hp>0&&!e.rewarded){hitSpell(e,st.damage*(crit?st.critMult:1),S.byId.magicArrow,st,crit);hits++;}
  if(hits)energyCharge(st.meterEpoch);
 });
}
function cast(id=state.activeSlots.find(Boolean)){if(classId!=='mage')return classCast(id);
 const n=S.byId[id];if(!n||!state.skillLevels[id])return false;
 if(id==='magicArrow'){
  if(!state.activeSlots.includes(id)||runeActive)return false;
  runeActive=true;runeClock=spellStats(id).runeInterval;lastRunePulse=time;
  if(state.energyCasts>=chargeNeed()&&passive('overcharge')){state.energyCasts=0;runeWave();}return true;
 }
 const alive=enemies.filter(e=>e.hp>0&&e.x<=940).sort((a,b)=>a.x-b.x);if(!alive.length)return false;
 const st=spellStats(id),target=alive[0],critical=Math.random()<st.crit;let boost=1,consumeCharge=false;
 if(n.family==='energy'&&!runeActive&&passive('overcharge')&&state.energyCasts>=chargeNeed()){boost+=.25*passive('overcharge');consumeCharge=true;state.energyCasts=0;}
 const raw=st.damage*(critical?st.critMult:1)*boost,center={x:target.x,y:target.y};if(id==='thunderstorm'){center.x=alive.reduce((v,e)=>v+e.x,0)/alive.length;center.y=alive.reduce((v,e)=>v+e.y,0)/alive.length;}st.center=center;st.meterEpoch=meterEpoch;
 let hit=alive.filter(e=>Math.hypot(e.x-center.x,e.y-center.y)<=st.radius);
 if(n.family==='energy')hit=alive.filter(e=>Math.abs(e.y-center.y)<=st.radius*.65);
 if(n.id==='lightning'){hit=[target];let current=target;while(hit.length<st.level+3){const next=alive.filter(e=>!hit.includes(e)&&Math.hypot(e.x-current.x,e.y-current.y)<=st.radius).sort((a,b)=>Math.hypot(a.x-current.x,a.y-current.y)-Math.hypot(b.x-current.x,b.y-current.y))[0];if(!next)break;hit.push(next);current=next;}}
 const fx={spell:n.id,tier:n.fx,x:center.x,y:center.y-15,targets:hit.map(e=>({x:e.x,y:e.y-12})),age:0,duration:n.id==='meteor'?3.32:st.duration?st.duration+.2:n.id==='arcaneBurst'?1.1:n.rank>=3?1:.7,r:st.radius,color:n.color,seed:Math.random()*10,overcharged:boost>1,pierced:0,origin:{x:hero.x,y:hero.y-15}};effects.push(fx);if(effects.length>24)effects.shift();
 if(['chainLightning','thunderstorm'].includes(id)){castElectricArea(n,st,center,target.stage,critical,fx);return true;}
 if(['flameExplosion','iceSpear'].includes(id)){castElementSummon(n,st,center,target.stage,critical,fx);return true;}
 if(['meteor','blizzard'].includes(id)){
 castArea(n,st,center,target.stage,critical,fx);return true;
 }
 if(n.id==='iceSpear')for(const e of hit){e.novaUntil=time+(2+.1*(st.level-1))*coldDuration();e.novaSlow=.3+.02*(st.level-1);}
 if(n.id==='arcaneBurst'){
 fx.impactAt=.2;fx.duration=.8;fx.origin={x:hero.x+32,y:hero.y-15};fx.beamEnd={x:980,y:center.y-15};fx.beamWidth=st.radius*.35;
 const epoch=energyEpoch.arcaneBurst;
 schedule(.2,()=>{
  if(state.dead||state.stage!==target.stage||epoch!==energyEpoch.arcaneBurst)return;
  const a=fx.origin,b=fx.beamEnd,dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
  const victims=enemies.filter(e=>{if(e.hp<=0||e.stage!==target.stage)return false;const x=e.x,y=e.y-15,q=((x-a.x)*dx+(y-a.y)*dy)/length;return q>=0&&q<=1&&Math.hypot(x-a.x-q*dx,y-a.y-q*dy)<=fx.beamWidth;});
  for(const e of victims)hitSpell(e,raw,n,st,critical);
  if(runeActive)fx.overcharged=runeWave(st.meterEpoch)||fx.overcharged;else if(victims.length&&!consumeCharge)energyCharge(st.meterEpoch);
  if(!state.lowFX)shake=fx.overcharged?5:3;
 });
 }else{
 const ticks=n.id==='magicArrow'?3:n.id==='blizzard'||n.id==='thunderstorm'?4:n.id==='starfall'?3:n.id==='blackHole'?5:1;
 for(let tick=0;tick<ticks;tick++){
 const run=()=>{let targets=ticks>1&&n.family!=='energy'?enemies.filter(e=>e.hp>0&&e.stage===target.stage&&Math.hypot(e.x-center.x,e.y-center.y)<=st.radius):hit;
 const energyHit=n.id==='energyBolt'&&targets.some(e=>e.hp>0&&!e.rewarded);
 for(const [i,e]of targets.entries()){const fall=n.family==='energy'?Math.pow(1-pierceLoss(),i):n.id==='lightning'?Math.max(.5,.9**i):1;hitSpell(e,raw/ticks*fall,n,st,critical);}
 if(energyHit&&!consumeCharge)energyCharge(st.meterEpoch);
 if(n.family==='lightning'&&passive('jump')){const extra=enemies.filter(e=>e.hp>0&&e.stage===target.stage&&!targets.includes(e)&&targets.some(t=>Math.hypot(e.x-t.x,e.y-t.y)<=st.radius)).slice(0,jumpCount());for(const e of extra){hitSpell(e,raw/ticks*.45,n,st,critical);effects.push({tier:4,x:e.x,y:e.y,targets:[{x:center.x,y:center.y},{x:e.x,y:e.y}],age:0,duration:.35,r:30,color:n.color,seed:1});}}
 };if(n.id==='meteor')schedule(.32,()=>{run();burst(center.x,center.y-20,n.color,20);if(!state.lowFX)shake=4;});else if(tick===0)run();else schedule(tick*(n.family==='energy'?.1:.35),run);
 }}
 if(!['meteor','arcaneBurst'].includes(n.id))burst(center.x,center.y-20,n.color,n.rank>=3?20:7);if(n.rank>=3&&!['meteor','arcaneBurst'].includes(n.id))shake=state.lowFX?0:4;sound(n.family==='energy'?520:n.family==='fire'?110:260,.12,'triangle',.018);return true;
}
function castElectricArea(n,st,center,stage,critical,fx){
 const lancer=n.id==='chainLightning',mult=critical?st.critMult:1;
 fx.duration=st.duration+.25;fx.bolts=[];fx.flashAt=-10;
 const apply=(targets,amount,kind=lancer?'summon':'direct')=>{
  fx.bolts=targets.map(e=>({x:e.x,y:e.y-15}));
  for(const e of targets)hitSpell(e,amount,n,{...st,damageKind:kind},critical);
  if(passive('jump')){const extra=enemies.filter(e=>e.hp>0&&e.stage===stage&&!targets.includes(e)&&targets.some(a=>Math.hypot(e.x-a.x,e.y-a.y)<=st.radius)).slice(0,jumpCount());for(const e of extra){hitSpell(e,amount*.45,n,{...st,damageKind:kind},critical);fx.bolts.push({x:e.x,y:e.y-15});}}
 };
 if(lancer){
  fx.lancer=true;fx.x=center.x-65;fx.y=center.y-15;fx.reach=st.radius*2+65;fx.hitCount=st.hitCount;
  for(let j=1;j<=st.hitCount;j++)schedule(st.duration*j/st.hitCount,()=>{
   if(state.stage!==stage)return;
   const alive=enemies.filter(e=>e.hp>0&&e.stage===stage&&e.x<=940).sort((a,b)=>a.x-b.x),target=alive[0];if(!target)return;
   fx.x=target.x-65;fx.y=target.y-15;fx.flashAt=time-(fx.bornAt||0);
   const targets=alive.filter(e=>Math.abs(e.y-target.y)<=35&&e.x-target.x<=st.radius*2);
   apply(targets,st.hitDamage*mult);
  });
 }else{
  const targets=()=>enemies.filter(e=>e.hp>0&&e.stage===stage&&Math.hypot(e.x-center.x,e.y-center.y)<=st.radius);
  const first=targets();for(const e of first)freezeOrStun(e,e.boss?.12:.4,'마비');
  apply(first,st.damage*mult);fx.flashAt=0;
  for(let j=1;j<=8;j++)schedule(j*.5,()=>{if(state.stage!==stage)return;fx.flashAt=j*.5;apply(targets(),st.dotDps*.5*mult,'dot');});
 }
 fx.bornAt=time;sound(180,.16,'triangle',.018);
}
function drawLancerEffect(f){
 const age=f.age,dt=age-f.flashAt,thrust=Math.max(0,1-dt/.14),x=f.x,y=f.y,bob=Math.sin(age*5)*2;
 ctx.save();ctx.globalAlpha=Math.min(1,age/.12,Math.max(0,(f.duration-age)/.25));
 ellipse(x,y+25,29,7,'#96e8ff22');
 const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach(([px,py],i)=>i?ctx.lineTo(x+px,y+py+bob):ctx.moveTo(x+px,y+py+bob));ctx.closePath();ctx.fill();};
 // Angular lightning wizard: pointed hat, hidden face, torn electric robe.
 poly([[-17,-30],[12,-32],[23,9],[12,5],[16,24],[3,16],[-5,27],[-8,12],[-24,21],[-19,2],[-30,7]],'#7773c9');
 poly([[-8,-27],[7,-29],[13,4],[5,1],[8,17],[-3,10],[-7,19],[-10,3],[-17,9]],'#b3e8ff');
 poly([[-12,-50],[11,-50],[13,-35],[1,-29],[-12,-36]],'#484471');
 poly([[-20,-52],[-8,-76],[2,-88],[0,-72],[14,-75],[8,-63],[22,-53]],'#aaa3fa');
 poly([[-7,-73],[2,-88],[0,-72],[14,-75],[4,-60]],'#edfbff');
 poly([[-29,-53],[19,-57],[29,-50],[8,-46],[-23,-47]],'#8d80d1');
 line([[x-20,y-51+bob],[x+20,y-52+bob]],'#ddfaff',2);
 line([[x+1,y-42+bob],[x+7,y-43+bob]],'#fffbd8',3);
 poly([[-17,-28],[-33,-18],[-24,-14],[-36,-6],[-18,-10],[-7,-23]],'#a6d8ff');
 line([[x-1,y-27+bob],[x-7,y-12+bob],[x+3,y-15+bob],[x-5,y+6+bob]],'#fff6ae',3);
 const hand=x+12+thrust*20,tip=hand+48+thrust*(f.reach-80);
 line([[x+7,y-26+bob],[hand-8,y-12],[hand+10,y-18]],'#8b82ce',10);
 line([[x+7,y-26+bob],[hand-8,y-12],[hand+10,y-18]],'#d0f3ff',4);
 line([[hand-24,y-18],[tip,y-18]],'#9588dc',8);line([[hand-24,y-18],[tip,y-18]],'#eefaff',3);
 ctx.fillStyle='#fff3a6';ctx.beginPath();ctx.moveTo(tip+18,y-18);ctx.lineTo(tip-6,y-29);ctx.lineTo(tip-2,y-20);ctx.lineTo(tip-12,y-17);ctx.lineTo(tip-4,y-7);ctx.closePath();ctx.fill();
 if(thrust>0){line([[hand,y-15],[tip*.4+hand*.6,y-24],[tip*.7+hand*.3,y-11],[tip,y-18]],'#fff1ad',2);for(const b of f.bolts||[])line([[b.x-7,b.y-8],[b.x+4,b.y],[b.x-4,b.y+9]],'#fff0bd',2);}
 if(!state.lowFX){const sway=Math.sin(age*7)*3;line([[x-28,y-40+bob],[x-35,y-27],[x-27+sway,y-30],[x-32,y-14]],'#b5edff',1.5);line([[x+20,y-65+bob],[x+27,y-55],[x+22,y-57],[x+30,y-40]],'#dcd4ff',1.5);}
 ctx.restore();return true;
}
function drawElectricEffect(f){
 if(!['chainLightning','thunderstorm'].includes(f.spell))return false;
 if(f.spell==='chainLightning')return drawLancerEffect(f);
 const t=f.age,orb=f.spell==='chainLightning',x=orb?Math.min(930,f.startX+f.speed*Math.min(t,3)):f.x,y=f.y,r=f.r;
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,(f.duration-t)*5));
 const bolt=(a,b,width=3)=>line([[a.x,a.y],[a.x+(b.x-a.x)*.35+8,a.y+(b.y-a.y)*.3],[a.x+(b.x-a.x)*.55-9,a.y+(b.y-a.y)*.65],[b.x,b.y]],'#f4e8ae',width);
 if(orb){for(let i=3;i>0;i--)ellipse(x-i*13,y,23-i*4,23-i*4,'#bca4ff33');ellipse(x,y,24,24,'#8e78bf');ellipse(x,y,17,17,'#e2cd88');ellipse(x,y,8,8,'#fff7d7');for(let i=0;i<4;i++){const a=t*5+i*TAU/4;bolt({x:x+Math.cos(a)*21,y:y+Math.sin(a)*21},{x:x+Math.cos(a+.3)*39,y:y+Math.sin(a+.3)*39},2);}}
 else{
 const spread=Math.min(1,.15+t/.35),fade=Math.min(1,Math.max(.05,(f.duration-t)/.35)),rr=r*spread*fade,pulse=Math.max(0,1-(t-(f.flashAt??-10))/.22);
 ellipse(x,y,rr,rr*.35,pulse>0?'#c5a7ff55':'#a98adc33');
 ctx.strokeStyle=pulse>0?'#ffe9a3':'#b99de3';ctx.lineWidth=2+pulse*2;ctx.beginPath();ctx.ellipse(x,y,rr,rr*.35,0,0,TAU);ctx.stroke();
 for(let i=0;i<(state.lowFX?5:10);i++){const a=i*TAU/(state.lowFX?5:10)+Math.sin(t*3+i)*.13;const end={x:x+Math.cos(a)*rr*.9,y:y+Math.sin(a)*rr*.32};bolt({x:x+Math.cos(a)*rr*.25,y:y+Math.sin(a)*rr*.09},end,1+pulse*2);}
 if(t<.28){const path=[[x+12,0],[x-25,y*.38],[x+9,y*.38-8],[x-16,y*.72],[x+8,y*.69],[x,y]];line(path,'#b996ff',13);line(path,'#fff4ba',7);line(path,'#fffdf2',2);ellipse(x,y,24,9,'#fff6cd');}
 }
 if(t-(f.flashAt??-10)>=0&&t-(f.flashAt??-10)<.22)for(const b of f.bolts||[]){bolt({x:orb?x:b.x-12,y:orb?y:b.y+8},b,orb?3:2);ellipse(b.x,b.y,12,4,'#fff0be');}
 ctx.restore();return true;
}
function castElementSummon(n,st,center,stage,critical,fx){
 const fire=n.id==='flameExplosion',mult=critical?st.critMult:1,epoch=summonEpoch[n.id];
 fx.summonKind=fire?'ifrit':'guardian';fx.duration=st.duration+.3;fx.summonX=Math.max(hero.x+55,center.x-(fire?105:160));fx.summonY=center.y+(fire?-30:15);fx.volleys=[];fx.flashAt=-10;
 const alive=()=>enemies.filter(e=>e.hp>0&&e.stage===stage&&e.x<=980).sort((a,b)=>a.x-b.x);
 const valid=()=>epoch===summonEpoch[n.id]&&!state.dead&&state.stage===stage&&state.activeSlots.includes(n.id)&&state.skillLevels[n.id]>0;
 if(!fire){
  for(let j=0;j<3;j++)schedule(.8*(j+1),()=>{
   if(!valid())return;const target=alive()[0];if(!target)return;
   const radius=st.radius*[.8,1,1.2][j],amount=st.damage*[1,1,1.5][j]/3.5*mult;
   fx.flashAt=.8*(j+1);fx.volleys.push({at:fx.flashAt,x:target.x,y:target.y-15,r:radius,phase:j+1});
   for(const e of alive().filter(e=>Math.hypot(e.x-target.x,e.y-target.y)<=radius)){
    e.novaUntil=time+(2+.1*(st.level-1))*coldDuration();e.novaSlow=.3+.02*(st.level-1);
    hitSpell(e,amount,n,{...st,damageKind:'summon'},critical);
   }
   sound(360+j*70,.1,'triangle',.015);
  });return;
 }
 // All tornadoes owned by one Ifrit share a direct-damage tick; burn sources remain independent.
 const tornadoes=[];
 for(let j=0;j<3;j++)schedule(.8*j,()=>{
  if(!valid())return;const target=alive()[0];if(!target)return;
  fx.flashAt=.8*j;
  for(let k=0;k<=j;k++){
   const x=Math.max(230,Math.min(970,target.x+(k-j/2)*st.radius*.8)),y=target.y;
   const tor={at:.8*j,end:.8*j+st.tornadoDuration,x,y,r:st.radius,seen:new Set()};
   tornadoes.push(tor);fx.volleys.push(tor);
  }
  sound(110,.12,'triangle',.018);
 });
 // Split the timeline at every birth/expiry as well as 0.5s ticks so fractional duration is exact.
 const boundaries=new Set([0,st.duration]);for(let t=.5;t<st.duration;t+=.5)boundaries.add(t);
 for(let j=0;j<3;j++){boundaries.add(.8*j);boundaries.add(.8*j+st.tornadoDuration);}
 const times=[...boundaries].sort((a,b)=>a-b);
 for(let i=1;i<times.length;i++){const start=times[i-1],end=times[i],mid=(start+end)/2;schedule(end,()=>{
  if(!valid())return;const active=tornadoes.filter(t=>t.at<=mid&&t.end>mid);
  for(const e of alive()){
   const overlapping=active.filter(t=>Math.hypot(e.x-t.x,e.y-t.y)<=t.r);if(!overlapping.length)continue;
   hitSpell(e,st.dotDps*(end-start)*mult,n,{...st,noBurn:true,damageKind:n.id==='flameExplosion'?'summon':'dot'},critical);
   if(e.hp<=0)continue;
   for(const tor of overlapping){addBurn(e,st.dotDps*mult*(e.boss?1+st.bossBonus:1)*.12,3+.4*passive('blaze'),false,!tor.seen.has(e.id),1,n.id,st.meterEpoch);tor.seen.add(e.id);}
  }
 });}
}
function drawElementSummon(f){
 const fire=f.summonKind==='ifrit',x=f.summonX,y=f.summonY,t=f.age,pulse=Math.max(0,1-(t-f.flashAt)/.3);
 ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,t/.12,(f.duration-t)/.25));
 const poly=(pts,c)=>{ctx.fillStyle=c;ctx.beginPath();pts.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();};
 ellipse(x,y+24,34,8,fire?'#ed934533':'#a7e6f433');
 if(fire){
  // A deliberately simple flame spirit: two horns, two eyes, a whirlwind instead of legs.
  poly([[x-23,y-34],[x-29,y-65],[x-12,y-52],[x,y-73],[x+12,y-51],[x+27,y-66],[x+22,y-33],[x+32,y-6],[x-30,y-6]],'#d96b42');
  poly([[x-15,y-37],[x-10,y-53],[x+3,y-46],[x+16,y-39],[x+17,y-8],[x-16,y-8]],'#ffb96d');
  line([[x-14,y-38],[x-6,y-36]],'#fff1bf',3);line([[x+5,y-36],[x+13,y-38]],'#fff1bf',3);
  line([[x-21,y-24],[x-40,y-15-pulse*14],[x-49,y-26-pulse*16]],'#e9864e',9);
  line([[x+21,y-24],[x+40,y-15-pulse*14],[x+49,y-26-pulse*16]],'#e9864e',9);
  for(let i=0;i<4;i++){ctx.strokeStyle=i%2?'#ffc579':'#d67a4d';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(x+Math.sin(t*7+i)*4,y+2+i*7,23-i*5,6,0,0,TAU);ctx.stroke();}
  for(const v of f.volleys){if(t<v.at||t>=v.end)continue;const age=t-v.at,fade=Math.min(1,(v.end-t)/.2);ctx.save();ctx.globalAlpha*=fade;
   for(let i=0;i<5;i++){ctx.strokeStyle=i%2?'#ffd48a':'#e8864f';ctx.lineWidth=state.lowFX?3:5;ctx.beginPath();ctx.ellipse(v.x+Math.sin(age*8+i)*7,v.y-15-i*12,v.r*(.2+i*.13),7+i*2,0,age*5+i,age*5+i+TAU*.83);ctx.stroke();}
   ctx.restore();
  }
 }else{
  const bob=Math.sin(t*4)*2;
  ellipse(x,y+3+bob,26,24,'#aed5e1');ellipse(x,y-19+bob,20,19,'#d3edf0');ellipse(x,y-44+bob,16,15,'#eaf6f4');
  ellipse(x-5,y-47+bob,2,2,'#394b68');ellipse(x+5,y-47+bob,2,2,'#394b68');
  poly([[x,y-43+bob],[x+13,y-40+bob],[x,y-38+bob]],'#e3ab70');
  line([[x-19,y-20],[x-37,y-29-pulse*18],[x-44,y-41-pulse*15]],'#8bc8e3',4);line([[x+19,y-20],[x+37,y-29-pulse*18],[x+44,y-41-pulse*15]],'#8bc8e3',4);
  poly([[x,y-79],[x+8,y-68],[x,y-58],[x-8,y-68]],'#85cee8');
  line([[x-18,y-31],[x+17,y-31],[x+20,y-12]],'#7698bf',5);
  ellipse(x,y-17,2,2,'#607993');ellipse(x,y-6,2,2,'#607993');
  for(const v of f.volleys){const age=t-v.at;if(age<0||age>.65)continue;ctx.save();ctx.globalAlpha*=1-age/.65;const r=v.r*Math.min(1,.35+age/.2);
   ellipse(v.x,v.y,r,r*.42,'#94d8eb22');
   for(let k=0;k<6;k++){const a=k*TAU/6,c=Math.cos(a),sn=Math.sin(a)*.5;line([[v.x,v.y],[v.x+c*r,v.y+sn*r]],'#c3f0fa',3+v.phase);
    for(const q of [.5,.75]){const xx=v.x+c*r*q,yy=v.y+sn*r*q;for(const side of [-1,1]){const b=a+side*.65;line([[xx,yy],[xx-Math.cos(b)*r*.18,yy-Math.sin(b)*r*.09]],'#91cfe8',2+v.phase);}}
   }ctx.restore();
  }
 }
 ctx.restore();return true;
}

function castArea(n,st,center,stage,critical,fx){
 const delay=n.id==='meteor'?.32:0,mult=critical?st.critMult:1,burned=new Set(),iceHits=new Map(),frozen=new Set();
 const groundRadius=n.id==='meteor'?st.radius*130/165:st.radius;
 fx.groundRadius=groundRadius;
 const targets=r=>enemies.filter(e=>e.hp>0&&e.stage===stage&&Math.hypot(e.x-center.x,e.y-center.y)<=r);
 if(n.id==='meteor')schedule(delay,()=>{for(const e of targets(st.radius)){hitSpell(e,st.damage*mult,n,st,critical);burned.add(e.id);}burst(center.x,center.y-15,n.color,18);if(!state.lowFX)shake=4;});
 for(let t=0;t<st.duration-1e-8;t+=.5){const slice=Math.min(.5,st.duration-t);schedule(delay+t+slice,()=>{
 for(const e of targets(groundRadius)){
 hitSpell(e,st.dotDps*slice*mult,n,{...st,noBurn:true,damageKind:n.id==='flameExplosion'?'summon':'dot'},critical);
 if(e.hp<=0)continue;
 if(n.family==='fire'){addBurn(e,st.dotDps*mult*(e.boss?1+st.bossBonus:1)*.12,3+.4*passive('blaze'),false,!burned.has(e.id),1,n.id,st.meterEpoch);burned.add(e.id);}
 if(n.id==='blizzard'){e.slow=2*coldDuration();const hits=(iceHits.get(e.id)||0)+1;iceHits.set(e.id,hits);if(hits>=3&&!frozen.has(e.id)){frozen.add(e.id);freezeOrStun(e,(.6+.05*(st.level-1))*(e.boss?.25:1),'빙결');}}
 }
 });}
 sound(n.family==='fire'?110:260,.12,'triangle',.018);
}
function advanceCasting(dt){
 for(const id of Object.keys(state.cooldowns))state.cooldowns[id]=Math.max(0,state.cooldowns[id]-dt);
 if(castingId){phaseLeft-=dt;if(phaseLeft<=0){const id=castingId;castingId=null;phase='ready';if(cast(id)){artReleaseAt=time;artLastSkill=id;state.cooldowns[id]=spellStats(id).cooldown;}else state.cooldowns[id]=0;}return;}
 if(!enemies.some(e=>e.hp>0&&e.x<=940))return;
 for(let offset=0;offset<3;offset++){const slot=(roundRobin+offset)%3,id=state.activeSlots[slot];if(id&&(classId==='mage'||classReady(id))&&!(id==='magicArrow'&&runeActive)&&(state.cooldowns[id]||0)<=0){castingId=id;roundRobin=(slot+1)%3;phase='cast';phaseTotal=spellStats(id).cast;phaseLeft=phaseTotal;state.cooldowns[id]=phaseTotal+spellStats(id).cooldown;break;}}
}
function damagePlayer(amount){if(classId!=='mage')return classDamagePlayer(amount);const st=stats(),damage=amount*100/(100+st.armor),absorbed=Math.min(state.shield,damage);state.shield-=absorbed;state.hp-=damage-absorbed;return damage;}
function die(){classClear();if(state.dead)return;runeActive=false;runeClock=0;state.energyCasts=0;state.dead=true;state.hp=0;state.shield=0;state.deaths++;save();refresh();showDeath();}
function revive(){resetCombatStats();energyEpoch.magicArrow++;energyEpoch.arcaneBurst++;runeActive=false;runeClock=0;lastOvercharge=-100;state.stage=Math.max(1,state.stage-1);state.kills=0;state.bossActive=false;state.dead=false;state.hp=stats().hp;state.shield=hasUnique('cloak')?stats().hp*.1:0;enemies=[];effects=[];particles=[];texts=[];scheduled=[];castingId=null;roundRobin=0;spawnClock=.15;pendingSpawn=0;setPhase('cast');hideModal();manualPause=false;save();refresh();banner('STAGE '+state.stage+' · 다시 시작');}
function update(dt){time+=dt;meterClock+=dt;const due=scheduled.filter(x=>x.at<=time);scheduled=scheduled.filter(x=>x.at>time);for(const event of due)event.run();const st=stats();state.hp=Math.min(st.hp,state.hp+(st.hp*C.regenPerSecond+st.regen)*dt);if(!state.bossActive){spawnClock-=dt;if(spawnClock<=0&&pendingSpawn===0){pendingSpawn=packSize();spawnClock=packInterval();}while(pendingSpawn>0&&enemies.length<C.maxEnemies){spawn();pendingSpawn--;}}
 for(const e of [...enemies]){if(e.hp<=0)continue;e.flash=Math.max(0,e.flash-dt);e.slow=Math.max(0,e.slow-dt);
 if(e.burns?.length){for(const b of e.burns){const slice=Math.min(dt,b.left);b.left-=slice;const amount=resistDamage(e,b.dps*[0,1,1.2,2][b.stacks||1]*slice,'fire');recordDamage(b.source,Math.min(e.hp,amount),'burn',b.epoch);e.hp-=amount;}if(e.hp<=0){kill(e);continue;}e.burns=e.burns.filter(b=>b.left>0);e.burnLeft=e.burns.length?Math.max(...e.burns.map(b=>b.left)):0;if(!e.burns.length)e.burnDPS=0;}
 if(time<e.ccUntil)continue;
 if(classId!=='mage'&&classEnemyAttack(e,dt))continue;
 if(e.x>e.stopX)e.x=Math.max(e.stopX,e.x-e.speed*(1-Math.max(time<(e.boarSlowUntil||0)?.2:0,e.slow>0?Math.min(.65,.15+.08*passive('cold')*Math.max(1,e.iceStacks)):0,time<(e.novaUntil||0)?e.novaSlow:0))*dt);
 else{e.attackCD-=dt;if(e.attackCD<=0){e.attackCD+=C.enemyAttackInterval;const taken=damagePlayer(e.attack);float(hero.x,hero.y-85,'−'+number(taken),'#ff9f9b',false);effects.push({tier:-1,x:hero.x,y:hero.y-35,age:0,duration:.2,color:'#ff9797',targets:[]});if(state.hp<=0){die();break;}}}}
 enemies=enemies.filter(e=>e.hp>0);
 if(!state.dead){if(classId!=='mage')classTick(dt);else updateRune(dt);advanceCasting(dt);}
 for(const f of [...effects])if(f.rogueProjectile)tickRogueArrow(f,dt);
 for(const a of [effects,particles,texts])for(const p of a){p.age+=dt;if(p.vx!==undefined){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=40*dt;}}
 effects=effects.filter(p=>p.age<p.duration);particles=particles.filter(p=>p.age<p.duration);texts=texts.filter(p=>p.age<p.duration);shake=Math.max(0,shake-dt*20);
}
function burst(x,y,color,count){count=state.lowFX?Math.min(5,count):count;for(let i=0;i<count&&particles.length<220;i++){const a=Math.random()*TAU,v=25+Math.random()*100;particles.push({x,y,color,age:0,duration:.3+Math.random()*.5,vx:Math.cos(a)*v,vy:Math.sin(a)*v-25,size:1+Math.random()*2});}}
function float(x,y,label,color,damage){if(texts.length>30)texts.shift();texts.push({x,y,label,color,damage,age:0,duration:damage?.75:1,vx:0,vy:-24});}
function equip(id){const i=state.inventory.find(i=>i.id===id);if(!i)return;const oldHP=stats().hp;state.equipped[C.slots[i.slot].id]=id;state.hp=state.dead?0:Math.min(stats().hp,state.hp+Math.max(0,stats().hp-oldHP));save();refresh();sound(730,.12);}
function recommendationScore(st,mode=state.recommendMode){return mode==='attack'?Math.log1p(st.dps):mode==='survival'?Math.log1p(st.ehp):(Math.log1p(st.dps)+Math.log1p(st.ehp))/2;}
function recommendedSet(){let eq={...state.equipped};for(let pass=0;pass<4;pass++){let changed=false;for(let slot=0;slot<8;slot++){const id=C.slots[slot].id;let best=eq[id],score=recommendationScore(stats(state.tier,state.levels[state.tier],eq));for(const item of state.inventory.filter(i=>i.slot===slot)){const test={...eq,[id]:item.id},next=recommendationScore(stats(state.tier,state.levels[state.tier],test));if(next>score*(1+1e-12)){score=next;best=item.id;}}if(best!==eq[id]){eq[id]=best;changed=true;}}if(!changed)break;}return eq;}
function equipBest(){if(state.dead)return;const old=stats().hp;state.equipped=recommendedSet();state.hp=Math.min(stats().hp,state.hp+Math.max(0,stats().hp-old));state.shield=Math.min(state.shield,stats().hp*.1);save();refresh();toast('선택한 기준의 추천 조합 착용 · 범위/재생/골드 효과는 직접 비교하세요.');}
function compareItem(id){
 const item=state.inventory.find(i=>i.id===id);if(!item)return;
 const slot=C.slots[item.slot],old=equipment(slot.id),eq={...state.equipped,[slot.id]:id},now=stats(),after=combinedStats(state,eq);
 const row=(label,a,b,unit='')=>{const d=b-a,sign=Math.abs(d)<1e-8?0:Math.sign(d);return '<tr><th>'+label+'</th><td>'+number(a)+unit+'</td><td>'+number(b)+unit+'</td><td class="'+(sign>0?'gain':sign<0?'loss':'')+'">'+(sign>0?'▲ +':sign<0?'▼ −':'—')+(sign?number(Math.abs(d))+unit:'')+'</td></tr>';};
 const table=(rows)=>'<div class="compare-table"><table><thead><tr><th>능력치</th><th>현재</th><th>교체 후</th><th>차이</th></tr></thead><tbody>'+rows+'</tbody></table></div>';
 const card=(i,label)=>'<section><small>'+label+'</small><strong style="color:'+(i?itemColor(i):'#aaa')+'">'+(i?itemName(i):'미착용')+'</strong>'+(i?'<p>'+itemLines(i)+'</p><small>S'+i.stage+'</small>':'')+'</section>';
 const am=old?itemMods(old):{},bm=itemMods(item),keys=[...new Set([...Object.keys(am),...Object.keys(bm)])];
 const before=I.setCounts(state),next=I.setCounts(state,eq);
 const changes=Object.keys(I.sets).filter(k=>before[k]!==next[k]).map(k=>{const def=I.setDefinition(k,classId),a=before[k],b=next[k];return '<p><b>'+def.name+' '+a+' → '+b+'개</b><br>액티브 보너스 +'+I.setLevels(a)+' → +'+I.setLevels(b)+'레벨</p>'+(classId==='mage'?def.effects:classSetEffects(k)).map((effect,index)=>{const n=index+2;return (a>=n)===(b>=n)?'':'<p class="'+(b>=n?'gain':'loss')+'">'+(b>=n?'▲ 획득':'▼ 해제')+' · '+n+'세트: '+effect+'</p>';}).join('');}).join('')||'<p>세트 구성 변화 없음</p>';
 modal('<h2 id="modalTitle">'+slot.name+' 비교</h2><div class="compare-cards">'+card(old,'현재 장비')+card(item,'선택 장비')+'</div><h3>장비 옵션 · 강화 포함</h3>'+table(keys.map(k=>row(I.defs[k].name,am[k]||0,bm[k]||0,I.defs[k].unit)).join(''))+'<h3>고유 능력</h3><p>현재: '+(old?.unique?C.uniques[item.slot].effect:'없음')+'<br>교체 후: '+(item.unique?C.uniques[item.slot].effect:'없음')+'</p><h3>캐릭터 최종 능력치</h3>'+table([['마력','magicPower',1,''],['마법공격력','magicAtk',1,''],['최대 HP','hp',1,''],['기준 DPS','dps',1,''],['보스 기준 DPS','bossDps',1,''],['시전시간 감소','castReduction',100,'%'],['쿨타임 감소','cdr',100,'%'],['마법 반경 증가','rangeBonus',100,'%'],['피해 감소','reduction',100,'%'],['치명타 확률','crit',100,'%'],['치명타 피해','critMult',100,'%'],['이동속도 증가','move',1,'%'],['초당 HP 재생','regen',1,''],['처치 골드 증가','goldBonus',100,'%']].map(([label,key,m,u])=>row(label,now[key]*m,after[key]*m,u)).join(''))+'<h3>세트 효과 변화</h3>'+changes+'<p class="hint left">장비 표시는 기본 수치 (+강화 증가분)입니다. % 옵션 차이는 퍼센트포인트입니다. 최종 능력치는 상한을 적용합니다.<br>DPS는 직접·장판 피해와 평균 치명타의 추정치입니다. 내성·화상·파쇄·다중 대상·순환 지연은 제외합니다.</p><button class="primary" id="compareEquipBtn" '+(old?.id===id?'disabled':'')+'>'+(old?.id===id?'착용 중':'이 장비 착용')+'</button>');
 $('compareEquipBtn').onclick=()=>{equip(id);hideModal();};
}
function salePrice(item){return item.unique?goldAt(item.stage)*20:item.sell;}
function sellItem(){return false;}function confirmSell(){return false;}function sellWeak(){return false;}
function awardUnique(stage){if(stage%10!==0||state.uniqueClaimed.includes(stage))return false;state.uniqueClaimed.push(stage);state.uniqueChests.push(stage);save();toast('✦ S'+stage+' 유니크 상자 획득! 장비 탭에서 부위를 선택하세요.');return true;}
function uniqueItem(stage,slot){return I.create(stage,slot,2,true,'unique-'+stage);}
function claimUnique(stage,slot){if(state.dead||!Number.isInteger(slot)||slot<0||slot>6||!state.uniqueChests.includes(stage))return false;if(state.inventory.length>=C.inventoryLimit){toast('보관함을 정리한 뒤 다시 열어 주세요. 상자는 유지됩니다.');return false;}const item=I.rollSet(uniqueItem(stage,slot));state.inventory.push(item);state.uniqueChests=state.uniqueChests.filter(n=>n!==stage);newItems++;save();hideModal();refresh();toast('✦ '+itemName(item)+' 획득 · 장비 탭에서 착용');sound(950,.5);return true;}
function openUnique(){if(!state.uniqueChests.length||state.dead)return;const stage=Math.min(...state.uniqueChests);modal('<div class="eyebrow">UNIQUE RELIC · STAGE '+stage+'</div><h2 id="modalTitle">여정의 유산</h2><p class="lead">원하는 장비 하나를 선택하세요.<br>능력치는 상자를 얻은 '+stage+'스테이지 기준입니다.<br>선택 전까지 상자는 보관됩니다. 유니크급 보상: 일반 유니크 70% / 세트 30%.</p><div class="unique-choices">'+C.slots.map((s,k)=>{const i=uniqueItem(stage,k);return '<button class="unique-choice" data-unique-slot="'+k+'" data-unique-stage="'+stage+'">'+icon(k)+'<span><strong>'+C.uniques[k].name+'</strong><small>'+itemValue(i)+'</small><small>추가 옵션 2개 · 세트 여부는 획득 시 확정</small><small>'+C.uniques[k].effect+'</small></span></button>';}).join('')+'</div>');}

function optionText(kind,value){const d=I.defs[kind];return d.name+' +'+number(value)+d.unit;}
function boostedText(kind,value,i){return optionText(kind,value)+' (+'+number(value*(enhanceMult(i)-1))+(I.defs[kind].unit==='%'?'%p':'')+')';}
function itemValue(i){return boostedText(C.slots[i.slot].kind,i.value,i);}
function itemLines(i){return itemValue(i)+(i.affixes||[]).map(a=>'<br>＋ '+boostedText(a.kind,a.value,i)).join('')+(i.unique?'<br>✦ '+C.uniques[i.slot].effect:'')+(i.setId?'<br>'+setDetails(i.setId):'');}
function classSetEffects(id){const name=S.trees.find(t=>t.id===id)?.name||id;return [name+' 피해 +10%',id==='energy'?'공격 범위 +10%':id==='lightning'?'공격속도 +5%p':id==='cosmic'?(classId==='summoner'?'소환 쿨타임 감소 +5%p':'공격속도 +5%p'):id==='fire'?'최대 HP +5%':'장비 방어력 +5%',name+' 액티브 +1레벨',name+' 피해 추가 +10%',name+' 액티브 추가 +1레벨 (총 +2)',name+' 액티브 추가 +3레벨 (총 +5)'];}
function setDetails(id){const n=setCount(id),set=I.setDefinition(id,classId);return '<span style="color:#8fe0ab">'+set.name+' · '+n+'/7</span><br>'+set.en+'<br>'+(classId==='mage'?set.effects:classSetEffects(id)).map((e,k)=>(n>=k+2?'✓ ':'○ ')+(k+2)+'부위: '+e).join('<br>');}
function icon(slot){const shapes=[`<path d="M10 29 24 9M20 4l7 1 3 7-7 2-5-5z"/><circle cx="25" cy="8" r="2"/>`,`<path d="M11 7 16 3 21 7 29 29H3z"/><path d="M11 7q5 8 10 0M16 13v15"/>`,`<circle cx="16" cy="20" r="9"/><path d="m9 8 7-6 7 6-7 6z"/>`,`<path d="M5 4q-1 15 11 19Q28 19 27 4M12 24l4 6 4-6-4-5z"/>`,`<path d="M8 27V12q0-4 3-1V6q0-4 3 0V4q0-3 3 0v3q3-4 3 0v5q4-4 4 0v9l-4 8z"/>`,`<path d="M9 3h13v19l7 3v5H5v-7l4-3zM10 9h10M10 14h10"/>`,`<path d="M4 22V14a12 12 0 0 1 24 0v8l-8 6v-9h-8v9zM16 2v11M5 15h22"/>`];return `<svg viewBox="0 0 32 34" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round">${shapes[slot]||'<circle cx="16" cy="16" r="11"/><path d="M16 5v22M5 16h22"/>'}</svg>`;}
function refresh(){refreshClassUI();refreshGacha();const st=stats(),r=S.resistance(state.stage),q=quote();
 $('stageNum').textContent=String(state.stage).padStart(2,'0');$('goldNum').textContent=number(state.gold);$('goldNum').title=precise(state.gold)+' 골드';$('hpText').textContent=number(Math.max(0,state.hp))+' / '+number(st.hp)+(state.shield>0?' · 보호막 '+number(state.shield):'');$('hpBar').style.width=Math.max(0,Math.min(100,state.hp/st.hp*100))+'%';$('attackText').textContent='적 공격력 '+number(attackAt(state.stage));$('stageGoal').textContent=state.bossActive?(state.stage%100===0?'ARCANE OVERLORD':state.stage%10===0?'RIFT WARDEN':'BOSS'):`보스까지 · ${packSize()}마리씩 / ${packInterval().toFixed(1)}초`;$('killsText').textContent=state.bossActive?'BOSS':number(state.kills)+' / '+number(stageGoal());$('killBar').style.width=state.kills/stageGoal()*100+'%';$('damageStat').textContent=number(st.magicPower);$('intervalStat').textContent=number(st.magicAtk);$('dpsStat').textContent=number(st.dps);$('bestStat').textContent=String(state.best).padStart(2,'0');$('zoneLabel').textContent=r.family.toUpperCase()+' RESISTANCE '+Math.round(r.value*100)+'%';$('biomeName').textContent=C.biomes[Math.floor((state.stage-1)/5)%5].name;$('battleState').textContent=state.dead?'부활 대기':isPaused()?'일시정지':'자동 전투';$('pauseBtn').textContent=manualPause?'▶':'Ⅱ';$('soundBtn').classList.toggle('on',state.sound);$('soundBtn').setAttribute('aria-label',state.sound?'소리 끄기':'소리 켜기');
 $('powerLevel').textContent='Lv.'+number(state.powerLevel);$('powerValue').textContent=number(st.magicPower);$('powerDetail').textContent='강화 누적 +'+number(S.powerGain(state.powerLevel))+' · 다음 레벨 +'+number(Math.round(S.powerStep(state.powerLevel+1)))+' · 무기 공격력과 곱연산';$('buyPower').disabled=!q.n||state.dead;$('buyPower').innerHTML='+'+number(q.n||1)+' 강화 <b>◈ '+number(q.cost||S.powerCost(state.powerLevel))+'</b>';$('spCount').textContent=availableSP()+' SP';$('treeSP').textContent=availableSP()+' SP 사용 가능';$('resetSkillsBtn').disabled=state.dead||S.spent(state.skillLevels)<=1;$('spSpent').textContent=S.spent(state.skillLevels)+' / 380 SP 투자';
 const signature=state.activeSlots.join('|');if(slotSignature!==signature){$('activeSlots').innerHTML=state.activeSlots.map((id,i)=>{const n=S.byId[id];return `<button id="activeSlot${i}" class="active-slot" data-slot-menu="${i}" style="--spell:${n?.color||'#888'}"><i id="slotFill${i}" class="slot-fill" aria-hidden="true"></i><small>SLOT ${i+1}</small><strong>${n?.name||'스킬 장착'}</strong><span id="slotStatus${i}"></span><span class="slot-dps" id="slotDps${i}"></span><i class="slot-cast-track" aria-hidden="true"><i id="slotCast${i}" class="slot-cast-fill"></i></i></button>`;}).join('');slotSignature=signature;}refreshSlotGauges();$('enemyHpLabel').textContent=enemyHPLabel();$('enemyHpLabel').classList.toggle('boss',state.bossActive);
 $('newItems').hidden=!(newItems+state.uniqueChests.length+state.fullSetPending.length+state.dropChests.length);$('newItems').textContent=newItems+state.uniqueChests.length+state.fullSetPending.length+state.dropChests.length;
 if(tab==='equipment')renderEquipment();if(tab==='grimoire')renderGrimoire();if(tab==='character')renderCharacter();
}
function renderCharacter(){renderSkins();const c=stats();const rows=[['최대 HP',number(c.hp)],[classId==='mage'?'Magic Power':'성장력',number(c.magicPower)],[classId==='mage'?'Magic ATK':'무기 공격력',number(c.magicAtk)],[classId==='mage'?'시전속도':classId==='summoner'?'소환수 공격속도':'공격속도',classId==='mage'?number(1/(1-c.castReduction))+'×':number(1+(classId==='summoner'?c.summonSpeed:c.attackSpeed))+'×'],[classId==='summoner'?'소환 쿨타임 감소':classId==='mage'?'쿨타임 감소':'적중 HP 흡수',classId==='mage'||classId==='summoner'?number(c.cdr*100)+'% / MAX 50%':number(c.leech)+'%'],['공격 범위','+'+number(c.rangeBonus*100)+'%'],['보스 피해','+'+number(c.bossBonus*100)+'%'],['방어력',number(c.armor)],['피해 감소',number(c.reduction*100)+'%'],['이동속도','+'+number(c.move)+'%'],['치명타 확률',number(c.crit*100)+'%'],['치명타 피해',number(c.critMult*100)+'%'],['체력 재생 / 초',number(c.hp*(C.regenPerSecond+(classId==='warrior'?.001*classP('breath'):0))+c.regen)],['단일 대상 기준 DPS',number(c.dps)],['보스 기준 DPS',number(c.bossDps)]];
 $('characterStats').innerHTML=rows.map(([k,v])=>'<div><span>'+k+'</span><strong>'+v+'</strong></div>').join('');$('migrationInfo').textContent=state.migration?'이전 완료 · v'+state.migration.from+' 기본 DPS '+number(state.migration.oldDps)+' → 환산 시 '+number(state.migration.newDps)+' · 마력 레벨 환산 및 최초 클리어 SP 소급':'마력 = 기본 10 + 강화 누적 + 장비 추가 옵션. 지팡이 미착용 기본 Magic ATK = 1.';
}
function slotMenu(slot){const options=S.nodes.filter(n=>n.type==='active'&&state.skillLevels[n.id]>0);modal('<div class="eyebrow">ACTIVE SLOT '+(slot+1)+'</div><h2 id="modalTitle">사용할 스킬 선택</h2><p class="lead">교체 즉시 전체 쿨타임이 적용됩니다.<br>동일 스킬은 중복 장착할 수 없습니다.</p><div class="slot-options">'+options.map(n=>'<button data-choose-skill="'+n.id+'" data-target-slot="'+slot+'" '+(state.activeSlots.includes(n.id)?'disabled':'')+'>'+n.name+' · Lv.'+state.skillLevels[n.id]+'<small>'+spellStats(n.id).cooldown.toFixed(2)+'s CD</small></button>').join('')+'</div><button class="subtle" data-clear-slot="'+slot+'" '+(state.activeSlots.filter(Boolean).length<=1?'disabled':'')+'>슬롯 비우기</button>');}
let inventoryFilter=-1;
function sortedInventory(){const order=Object.keys(I.sets),mode=state.inventorySort;return state.inventory.map((item,index)=>({item,index})).sort((a,b)=>{const x=a.item,y=b.item,latest=b.index-a.index;if(mode==='rarity')return y.rarity-x.rarity||y.stage-x.stage||enhanceLevel(y)-enhanceLevel(x)||latest;if(mode==='slot')return x.slot-y.slot||y.rarity-x.rarity||latest;if(mode==='set'){const group=i=>i.setId?order.indexOf(i.setId):5;return group(x)-group(y)||x.slot-y.slot||y.rarity-x.rarity||latest;}return latest;}).map(x=>x.item);}
function renderEquipment(){const setSignature=classId+JSON.stringify(I.setCounts(state));if($('setOverview').dataset.signature!==setSignature){$('setOverview').innerHTML=Object.keys(I.sets).map(id=>'<details><summary>'+I.setDefinition(id,classId).name+' · '+setCount(id)+'/7</summary>'+setDetails(id)+'</details>').join('');$('setOverview').dataset.signature=setSignature;}$('claimDropBtn').textContent='보관된 유니크급 드롭 '+state.dropChests.length+'개 수령';$('claimDropBtn').disabled=!state.dropChests.length||state.inventory.length>=C.inventoryLimit||state.dead;$('fragmentSummary').textContent=forgeNames.map((n,i)=>n+' 조각 '+state.fragments[i]).join(' · ');$('recommendMode').value=state.recommendMode;const gs=stats();$('gearSummary').textContent='방어력 '+number(gs.armor)+' · 피해 감소 '+number(gs.reduction*100)+'% · 치명타 '+number(gs.crit*100)+'% · 치명타 피해 '+number(gs.critMult*100)+'% · 이동 +'+number(gs.move)+'%';$('uniqueCount').textContent=state.uniqueChests.length+'개';$('openUniqueBtn').disabled=!state.uniqueChests.length||state.dead;$('uniqueNext').textContent='10단계 유니크급 선택 상자 · 100단계 7부위 개별 추첨';$('fullSetRewards').innerHTML=state.fullSetPending.map(n=>'<button class="subtle" data-full-set="'+n+'">S'+n+' 유니크급 7부위 수령 (7칸)</button>').join('');const slotsHTML='<svg class="gear-silhouette" viewBox="0 0 300 340" aria-hidden="true"><path d="M119 78 L150 18 L181 78Z M110 83 Q150 68 190 83 L180 92 L120 92Z M131 95 L170 95 L166 124 L135 124Z M128 133 L171 133 L188 237 L165 242 L162 306 L143 306 L140 245 L115 237Z M124 141 L94 203 L83 194 L111 133Z M178 141 L206 191 L195 200 L167 151Z"/></svg>'+C.slots.map((slot,k)=>{const i=equipment(slot.id),c=i?itemColor(i):'#8990a8';return '<button class="gear-slot gear-'+slot.id+(inventoryFilter===k?' selected':'')+'" data-gear-slot="'+k+'" style="--gear-color:'+c+'" aria-label="'+slot.name+' 장비 보기">'+icon(k)+'<strong>'+slot.name+'</strong><span>'+(i?(i.setId?'✦ 세트':i.unique?'유니크':C.rarities[i.rarity].name)+(i.unique?' +'+enhanceLevel(i):''):'미착용')+'</span></button>';}).join('');if($('equipmentSlots').innerHTML!==slotsHTML)$('equipmentSlots').innerHTML=slotsHTML;$('inventoryCount').textContent=state.inventory.length+' / '+C.inventoryLimit;
 $('inventorySort').value=state.inventorySort;$('inventoryFilter').value=inventoryFilter;const html=sortedInventory().filter(i=>inventoryFilter<0||i.slot===inventoryFilter).map(i=>{const worn=state.equipped[C.slots[i.slot].id]===i.id,old=equipment(C.slots[i.slot].id);return `<div class="item" style="--rarity:${itemColor(i)}">${icon(i.slot)}<div class="item-info"><strong>${i.setId?"✦ 세트 · ":i.unique?"✦ 유니크 · ":""}${itemName(i)}</strong><span>${itemLines(i)} · S${i.stage}${old&&!worn?' · 현재 '+number(old.value*enhanceMult(old)):''}</span></div><div class="item-actions"><button data-compare="${i.id}">비교</button><button data-equip="${i.id}" ${worn?'disabled':''}>${worn?'착용 중':'착용'}</button>${i.unique?`<button data-absorb="${i.id}">흡수 강화</button>`:""}</div></div>`;}).join('')||'<div class="empty">해당 부위에 보관된 장비가 없습니다.</div>';if($('inventory').innerHTML!==html)$('inventory').innerHTML=html;}
function unlockDetail(n){const r=S.requirement(n.id);return '<p class="hint left">'+(r.cosmic?'기본 4계열 전체 마스터':('마력 강화 '+state.powerLevel+' / '+r.power))+(r.previous?' · '+r.previous.name+' Lv.'+(r.cosmic?r.previous.max:1)+' 필요':'')+'</p>';}
function synergyDetail(n){if(n.type!=='active'||n.family==='cosmic')return '';const peers=S.nodes.filter(x=>x.type==='active'&&x.family===n.family&&x.id!==n.id);const rate=(from,to)=>from.rank===2?3:from.rank===3?2:to.rank===2?3:2;return '<p class="hint left">투자 1레벨당 제공: '+peers.map(x=>x.name+' 피해 +'+rate(n,x)+'%').join(' · ')+'<br>받는 시너지: '+peers.map(x=>x.name+' 투자 Lv.'+state.skillLevels[x.id]+' × '+rate(x,n)+'%').join(' + ')+'<br>장착 여부 무관 · 세트 레벨은 시너지에서 제외</p>';}
function skillLevelDetail(n,lv){
 if(n.id==='magicArrow'){const st=spellStats(n.id);return '<p class="hint left">공격 주기 '+st.runeInterval.toFixed(2)+'초'+(lv<n.max?' → 다음 '+Math.max(.5,st.runeInterval-.05).toFixed(2)+'초':'')+' · 세트 Lv.15: 0.50초<br>룬 1개 · 공격주기에 쿨감 미적용 · 최초 소환/재장착 대기만 쿨감 적용</p>';}
 if(n.id==='overcharge')return '<p class="hint left">필요 '+chargeNeed()+'칸 · 파동 피해 룬의 '+(1+.4*lv).toFixed(1)+'배 · 반경 1.3배<br>볼트/룬 적중당 1칸 · 파동은 충전 제외 · 버스트 강제 발동은 기존 게이지 유지</p>';

 if(n.id==='flameExplosion'){const st=spellStats(n.id);return '<p class="hint left">회오리 개당 '+st.tornadoDuration.toFixed(2)+'초 · 공격 간격 0.8초 · 전체 '+st.duration.toFixed(2)+'초<br>한 소환체의 회오리 직접 피해는 중복되지 않음 · 각 회오리 최초 적중에 화상 +1, 이후 시간 갱신</p>';}
 if(n.id==='iceSpear')return '<p class="hint left">0.8초마다 3회 · 매회 재조준 · 기존 노바 총 피해 유지<br>1·2차 각 28.57%, 3차 42.86% · 냉기 중첩과 빙결 파쇄 적용</p>';
 if(n.id==='chainLightning'){const st=spellStats(n.id);return '<p class="hint left">'+(lv?'현재 '+st.hitCount+'회'+(lv<n.max?' → 다음 레벨 '+(st.hitCount+1)+'회':' · MAX'):'해금 시 4회')+' · 3초간 관통 찌르기<br>세트 레벨 포함 · 레벨당 횟수 +1 · 각 소환체 독립 공격 · 길막 없음</p>';}

 if(n.id==='lightning')return '<p class="hint left">'+(lv?'현재 연쇄 대상 '+(spellStats(n.id).level+3)+'명'+(lv<n.max?' → 다음 레벨 '+(spellStats(n.id).level+4)+'명':' · MAX'):'해금 시 연쇄 대상 4명')+'<br>전류 도약: 별도 추가 대상 최대 '+jumpCount()+'명 · 피해 45%</p>';
 if(n.id==='jump')return '<p class="hint left">현재 추가 대상 최대 '+lv+'명'+(lv<n.max?' → 다음 레벨 '+(lv+1)+'명':' · MAX')+' · 기본 연쇄 대상과 별도</p>';
 return '';
}
function renderGrimoire(){const html=S.trees.map(t=>'<section class="skill-tree" style="--spell:'+t.color+'"><header><h3>'+t.name+'</h3><span>'+t.nodes.reduce((sum,n)=>sum+state.skillLevels[n.id]*n.cost,0)+' / '+(t.id==='cosmic'?100:70)+' SP</span></header>'+(t.id==='cosmic'&&!S.mastered(state.skillLevels)?'<p class="hint left">기본 4계열 280 SP ALL MASTER 필요</p>':'')+t.nodes.map(n=>{const lv=state.skillLevels[n.id],ready=S.available(state.skillLevels,n.id,state.powerLevel),st=n.type==='active'?spellStats(n.id):null;return '<div class="skill-node '+(!ready?'locked':'')+'"><div><small>'+n.type.toUpperCase()+' · '+n.cost+' SP / Lv</small><h4>'+n.name+' <span>'+lv+'/'+n.max+(st?.bonusLevel?' (+'+st.bonusLevel+')':'')+'</span></h4><p>'+n.description+'</p>'+unlockDetail(n)+synergyDetail(n)+skillLevelDetail(n,lv)+(st?'<p>적용 Lv.'+st.level+' · 계열 시너지 +'+Math.round(st.synergy*100)+'% · 세트 피해 +'+Math.round(st.setDamage*100)+'%</p>':'')+(st?'<small>'+(n.id==='iceSpear'?'눈송이 3회 합계 '+number(st.damage):st.runeInterval?'주기 피해 '+number(st.damage)+' / '+st.runeInterval.toFixed(2)+'초':st.hitCount?(classId==='mage'?'찌르기 ':'타격 ')+number(st.hitDamage)+' × '+st.hitCount+'회'+(classId==='mage'?' / 3초':''):'직접 '+number(st.damage))+(classId==='mage'&&st.duration&&!st.hitCount&&n.id!=='iceSpear'?' · 초당 '+number(st.dotDps)+' × '+st.duration.toFixed(1)+'s':'')+' · 총 '+number(st.totalDamage)+' · CD '+st.cooldown.toFixed(2)+'s · 시전 '+st.cast.toFixed(2)+'s</small>':'')+'</div><button data-learn="'+n.id+'" '+(!ready||lv>=n.max||availableSP()<n.cost||state.dead?'disabled':'')+'>'+(lv===n.max?'MAX':!ready?'조건 미충족':lv?'강화':'배우기')+'</button></div>';}).join('')+'</section>').join('');if($('spellList').innerHTML!==html)$('spellList').innerHTML=html;}
function showTab(t){if(!['magic','equipment','grimoire','character'].includes(t))return;menuPositions[tab]=$('menuScroll').scrollTop||0;tab=t;lastTS=0;document.querySelectorAll('[data-tab]').forEach(b=>{b.classList.toggle('active',b.dataset.tab===t);b.setAttribute('aria-current',b.dataset.tab===t?'page':'false');});for(const k of ['magic','equipment','grimoire','character'])$(k+'Panel').hidden=k!==t;$('menuScreen').hidden=t==='magic';document.querySelector('main').hidden=t!=='magic';$('menuTitle').textContent=({equipment:'인벤토리',grimoire:'스킬',character:'캐릭터'})[t]||'전투';if(t==='equipment')newItems=0;refresh();$('menuScroll').scrollTop=menuPositions[t]||0;}
function checkOrientation(){const coarse=matchMedia('(pointer: coarse)').matches,type=window.screen?.orientation?.type,angle=typeof window.orientation==='number'?window.orientation:null;orientationBlocked=coarse&&(type?type.startsWith('landscape'):angle!==null&&Math.abs(angle)%180===90);$('rotateNotice').hidden=!orientationBlocked;lastTS=0;}
function modal(html,close=true){$('modalContent').innerHTML=html;$('modal').hidden=false;$('modalClose').hidden=!close;refresh();}
function hideModal(){if(state.dead)return;$('modal').hidden=true;refresh();}
function isPaused(){return orientationBlocked||tab!=='magic'||manualPause||!$('modal').hidden||document.hidden||!state.started||state.dead;}
function showDeath(){modal(`<div class="eyebrow">THE JOURNEY CONTINUES</div><h2 id="modalTitle">잠시, 숨을 고르세요.</h2><div class="death-number">STAGE ${state.stage}</div><p class="lead">적들이 마법사를 압도했습니다.<br><b>${Math.max(1,state.stage-1)}스테이지</b>에서 체력을 회복하고 다시 시작합니다.<br>마법 · 강화 · 장비 · 골드는 모두 유지됩니다.</p><button class="primary" id="reviveBtn">한 걸음 뒤에서 다시 시작</button>`,false);$('reviveBtn').onclick=revive;}
function help(){if(classId!=='mage'){modal('<h2 id="modalTitle">'+MAGE_CLASSES.jobs[classId].name+' 플레이 안내</h2><p>직업별 성장·장비·스킬·스테이지·뽑기는 독립 저장됩니다. 상단 픽토그램으로 전환하면 자동 저장됩니다.</p><p>장비 8부위 · 보조장비는 7부위 세트에서 제외 · 같은 부위 유니크급 흡수 강화.</p><p>'+(classId==='summoner'?'소환 쿨다운 감소 최대50%, 소환수 공속 최대100%. 소환수는 HP와 수명을 갖고 사망하면 재소환 대기. 골렘이 적 전체의 진격을 막고 모든 적이 골렘을 공격합니다. 해골류 종류별2웨이브, 총64체.':'장비 공속 최대150%가 공격 동작을 단축합니다. 장비 시전속도/쿨감은 없고, 유쿨 스킬은 레벨당2%씩 최대40% 쿨다운 감소. HP 흡수는 적중 동작당 최대0.5%, 1초간1.5%까지.')+'</p><p>앞 노드1레벨 + 성장력 강화10/30/50/100 · 초월은 기본4계열 마스터 후 해금. 실전 피해는 슬롯 아래와 DPS 통계에서 확인하세요.</p>');return;}modal(`<div class="eyebrow">SKILL SYSTEM 2.0</div><h2 id="modalTitle">마력을 키우고, 마법을 조합하세요.</h2><ul><li>골드는 Magic Power 공통 강화에 사용합니다. 10레벨 구간 N마다 강화량 N × 1.05^(N−1)을 적용합니다. 소수점은 내부 누적됩니다.</li><li>피해 = Magic Power × Magic ATK × 스킬 계수. 이후 치명타·보스·내성을 적용합니다.</li><li>최초 보스 SP: 일반 1 / 10단위 5 / 100단위 10. 중복 지급 없음.</li><li>Energy Bolt Lv.1 기본 지급도 총 380 SP에 포함됩니다.</li><li>기본 계열: 앞 노드 Lv.1 + 마력 강화 10/30/50/100. 초월: 기존 전체 마스터 조건. 기본 액티브 상호 시너지 최대 +50%.</li><li>3슬롯 자유 조합 · READY 순환 자동시전 · 교체 시 전체 쿨타임.</li><li>스테이지 내성 10~40%. 초월은 4속성 내성 대상이 아닙니다.</li><li>10단위 유니크 선택 상자, 100단위는 대신 7부위 유니크급 보상. 유니크급 중 세트 30%, 5종 균등 추첨.</li><li>사망 n−1 부활. 보유 성장과 최초 보상 기록은 유지됩니다.</li><li>슬롯 선택·설정 팝업과 다른 앱 사용 중에는 전투가 일시정지합니다.</li></ul><p class="hint left">DPS는 장착 스킬 직접·장판 총 피해와 평균 치명타를 반영한 참고값입니다. 내성·다중 대상·상태효과·순환 지연에 따라 실전 피해는 달라집니다.</p><button class="primary" id="helpClose">계속하기</button>`);$('helpClose').onclick=hideModal;}
function settings(){modal(`<div class="eyebrow">SETTINGS</div><h2 id="modalTitle">여정 관리</h2><p class="lead">현재 브라우저에 자동 저장됩니다.<br>파일 위치나 브라우저를 바꾸기 전에 백업을 보관하세요.</p><div class="setting-row"><button class="subtle" id="exportBtn">저장 파일 내보내기</button><button class="subtle" id="importBtn">저장 파일 가져오기</button></div><div class="setting-row"><button class="subtle" id="fxBtn">연출 ${state.lowFX?'가볍게':'풍부하게'} · 전환</button><button class="subtle danger" id="resetBtn">처음부터 시작</button></div><p class="hint left">기본 피해 ${precise(stats().damage)} · 시전 ${stats().cast.toFixed(3)}초 · 대기 ${stats().cooldown.toFixed(3)}초<br>스테이지 상한 1,000 · 시전시간 감소 65% / 쿨타임 감소 50% · 치명타 상한 60%</p>`);$('exportBtn').onclick=()=>{save();const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='MageRising_save_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('저장 파일을 내보냈어요.');};$('importBtn').onclick=()=>$('importFile').click();$('fxBtn').onclick=()=>{state.lowFX=!state.lowFX;save();settings();};$('resetBtn').onclick=()=>{modal('<div class="eyebrow">NEW JOURNEY</div><h2 id="modalTitle">처음부터 시작할까요?</h2><p class="lead">현재 마법·장비·골드가 삭제됩니다. 필요하다면 먼저 백업을 내보내 주세요.</p><button class="primary" id="confirmReset">진행 삭제 후 새로 시작</button><button class="subtle" id="cancelReset">취소</button>');$('confirmReset').onclick=()=>{protectSave=false;state=fresh();state.started=true;resetWorld();save();hideModal();showTab('magic');};$('cancelReset').onclick=settings;};}
function resetWorld(){artReleaseAt=-10;artLastSkill=null;classClear();nextNoMind=30;time=0;resetCombatStats();energyEpoch.magicArrow++;energyEpoch.arcaneBurst++;runeActive=false;runeClock=0;lastOvercharge=-100;waveCount=0;state.hp=Math.min(state.hp,stats().hp);state.shield=Math.min(state.shield,stats().hp*.1);enemies=[];effects=[];particles=[];texts=[];scheduled=[];castingId=null;roundRobin=0;spawnClock=.1;pendingSpawn=0;manualPause=false;newItems=0;setPhase('cast');if(state.bossActive&&!state.dead)spawn(true);}
$('importFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>1000000)throw Error('파일이 너무 큽니다.');const imported=validate(JSON.parse(await f.text()));modal('<h2 id="modalTitle">백업으로 복원할까요?</h2><p class="lead">현재 진행을 선택한 저장 파일의 진행으로 교체합니다.</p><button class="primary" id="confirmImport">복원하기</button><button class="subtle" id="cancelImport">취소</button>');$('confirmImport').onclick=()=>{state=imported;protectSave=false;resetWorld();save();$('modal').hidden=true;if(state.dead)showDeath();else if(!state.started)welcome();refresh();toast('저장 파일을 복원했어요.');};$('cancelImport').onclick=settings;}catch(err){toast(err.message||'저장 파일을 읽을 수 없습니다.');}e.target.value='';};
function welcome(){modal(`<div class="eyebrow">MAGE RISING · FIRST LIGHT</div><div class="modal-rune">✧</div><h2 id="modalTitle">마법사의 여정</h2><p class="lead">작은 에너지볼트에서 시작해<br>전장을 삼키는 블랙홀까지.<br><br>마력을 키우고 스킬트리를 완성하며<br>나만의 3슬롯 마법 조합을 만드세요.</p><button class="primary" id="startBtn">첫 번째 마법을 깨우기</button><p class="hint">자동 전투 · 14종 액티브 · 9종 패시브 · 8부위 장비 · 세트는 기존 7부위</p>`,false);$('startBtn').onclick=()=>{state.started=true;save();hideModal();sound(660,.3);};}
$('inventoryFilter').onchange=e=>{inventoryFilter=Number(e.target.value);renderEquipment();};$('menuClose').onclick=()=>showTab('magic');$('inventorySort').onchange=e=>{state.inventorySort=e.target.value;save();renderEquipment();};$('modalClose').onclick=hideModal;$('helpBtn').onclick=help;$('settingsBtn').onclick=()=>{if(!state.dead)settings();};$('pauseBtn').onclick=()=>{manualPause=!manualPause;refresh();};$('soundBtn').onclick=()=>{state.sound=!state.sound;sound(600,.15);save();refresh();};$('buyPower').onclick=buy;$('resetSkillsBtn').onclick=confirmSkillReset;$('openUniqueBtn').onclick=openUnique;$('recommendMode').onchange=e=>{state.recommendMode=e.target.value;save();refresh();};$('equipBestBtn').onclick=equipBest;$('claimDropBtn').onclick=claimDrop;$('forgeBtn').onclick=openForge;
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='combatStatsBtn')openCombatStats();if(b.dataset.gearSlot!==undefined){inventoryFilter=Number(b.dataset.gearSlot);renderEquipment();$('inventoryFilter').scrollIntoView({block:'start',behavior:'smooth'});}if(b.dataset.skin)selectSkin(b.dataset.skin);if(b.dataset.learn)learn(b.dataset.learn);if(b.dataset.slotMenu!==undefined)slotMenu(Number(b.dataset.slotMenu));if(b.dataset.chooseSkill){slotSkill(Number(b.dataset.targetSlot),b.dataset.chooseSkill);hideModal();}if(b.dataset.clearSlot!==undefined){slotSkill(Number(b.dataset.clearSlot),null);hideModal();}if(b.dataset.fullSet)claimFullSet(Number(b.dataset.fullSet));if(b.dataset.tab)showTab(b.dataset.tab);if(b.dataset.bulk){bulk=b.dataset.bulk;document.querySelectorAll('[data-bulk]').forEach(x=>x.classList.toggle('active',x.dataset.bulk===bulk));refresh();}if(b.dataset.equip)equip(b.dataset.equip);if(b.dataset.compare)compareItem(b.dataset.compare);if(b.dataset.absorb)openAbsorb(b.dataset.absorb);if(b.dataset.uniqueSlot!==undefined)claimUnique(Number(b.dataset.uniqueStage),Number(b.dataset.uniqueSlot));});
$('gachaBtn').onclick=openGacha;
window.addEventListener('orientationchange',checkOrientation);window.screen?.orientation?.addEventListener('change',checkOrientation);checkOrientation();
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('modal').hidden&&tab!=='magic')showTab('magic');});
document.addEventListener('visibilitychange',()=>{lastTS=0;save();});window.addEventListener('pagehide',save);
// Rendering uses a fixed combat space; scenery movement never changes combat positions.
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,TAU);ctx.fill();}
function line(points,color,width=2){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();}
function glow(x,y,r,color){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,color.slice(0,7)+'00');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
function rune(x,y,r,color,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.stroke();ctx.beginPath();ctx.arc(0,0,r*.83,0,TAU);ctx.stroke();for(let i=0;i<6;i++){const a=i*TAU/6;line([[Math.cos(a)*r*.83,Math.sin(a)*r*.83],[Math.cos(a+TAU/3)*r*.83,Math.sin(a+TAU/3)*r*.83]],color,.7);}ctx.restore();}
function drawBackground(){const b=C.biomes[Math.floor((state.stage-1)/5)%5],grad=ctx.createLinearGradient(0,0,0,400);grad.addColorStop(0,b.top);grad.addColorStop(1,b.bottom);ctx.fillStyle=grad;ctx.fillRect(0,0,1000,400);glow(775,70,160,b.moon+'22');ellipse(775,70,29,29,b.moon+'b0');ellipse(785,62,27,27,b.top);for(let i=0;i<45;i++){const x=(i*137.7+34)%1000,y=(i*57.3)%190;ctx.globalAlpha=.25+Math.sin(time*.6+i)*.2;ellipse(x,y,1,1,'#d1c5ef');}ctx.globalAlpha=1;
 for(let layer=0;layer<3;layer++){const speed=[5,12,23][layer]*(1+stats().move/100),base=[240,287,340][layer],col=[b.top+'bb',b.ground+'b0',b.ground][layer];ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,400);for(let x=-100;x<=1100;x+=25){const world=x+time*speed;const y=base-Math.sin(world*.008+layer)*25-Math.sin(world*.019+layer*4)*10;ctx.lineTo(x,y);}ctx.lineTo(1100,400);ctx.closePath();ctx.fill();
 for(let j=0;j<9;j++){let x=((j*151-time*speed*1.5)%1350+1350)%1350-120,y=base+5;ctx.fillStyle=col;if(Math.floor((state.stage-1)/5)%5===2){ctx.fillRect(x,y-65,12,80);ctx.fillRect(x-6,y-70,24,9);}else{ctx.beginPath();ctx.moveTo(x,y-95-layer*10);ctx.lineTo(x-28,y);ctx.lineTo(x+28,y);ctx.closePath();ctx.fill();ctx.fillRect(x-3,y-5,6,35);}}}
 const fog=ctx.createLinearGradient(0,280,0,400);fog.addColorStop(0,'#53667a00');fog.addColorStop(1,'#66799018');ctx.fillStyle=fog;ctx.fillRect(0,280,1000,120);for(let i=0;i<18;i++){const x=((i*79-time*30)%1100+1100)%1100,y=355+(i*17%40);line([[x,y],[x+9,y]],'#70878025',1);}if(!state.lowFX)for(let i=0;i<14;i++){const x=(i*81+Math.sin(time*.2+i)*40)%1000,y=130+(i*37%170)+Math.sin(time+i)*8;ellipse(x,y,1.5,1.5,b.moon+'80');}}
let artReleaseAt=-10,artLastSkill=null;
function drawRemasteredHero(){if(!window.MAGE_REMASTER)return false;const recovering=time-artReleaseAt<.22,id=castingId||(recovering?artLastSkill:null),family=S.byId[id]?.family||'energy';ellipse(hero.x,hero.y+32,30,6,'#08101c88');return MAGE_REMASTER.hero(ctx,{job:classId,id:state.skinId,family,progress:castingId?Math.max(0,Math.min(1,1-phaseLeft/phaseTotal)):0,casting:!!castingId,recovering,time,x:hero.x,y:hero.y+30,lowFX:state.lowFX,clone:classId==='rogue'&&time<(classBuffs.clone||0)});}
window.addEventListener('mage-art-ready',()=>{skinCardsSignature='';if(tab==='character')renderSkins();});
function drawHero(){if(drawRemasteredHero())return;if(classId!=='mage'){drawClassHero();return;}if(skinConfig().simple){drawSimpleHero(state.skinId);return;}const sp=spriteGeometry();if(!sp){drawDefaultHero();return;}ellipse(hero.x,hero.y+32,35,8,'#060e2070');const color=(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color;glow(hero.x,hero.y-45,75,color+'15');ctx.drawImage(sp.image,sp.x,sp.y,sp.w,sp.h);const tip=castOrigin(),charging=phase==='cast'&&!isPaused()?1-Math.max(0,phaseLeft/phaseTotal):0;glow(tip.x,tip.y,10+charging*15,color+'60');if(charging>.05)rune(tip.x,tip.y,8+charging*10,color+'90',time*2);}
// Same deliberately simple geometric vocabulary as the original young mage.
function drawSimpleHero(id){
 const bob=Math.sin(time*2.4)*5,x=hero.x,y=hero.y+bob;
 const c={blonde:['#665084','#e8c970','#e3bdad','#b497c8'],elder:['#747781','#eeeced','#d3b4a3','#b4b5c4'],elf:['#386353','#dcded1','#dec5b4','#8faf83'],demon:['#713d50','#362d40','#c18d91','#aa6577']}[id];
 if(!c){drawDefaultHero();return;}
 const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();};
 ellipse(x,hero.y+32,35,8,'#060e2070');ctx.save();ctx.translate(x,y);
 if(id==='demon'){line([[-14,-5],[-40,5],[-48,-8],[-43,-23]],c[0],5);poly([[-49,-21],[-39,-22],[-44,-33]],c[3]);}
 poly([[-15,-61],[-32,10],[-10,4],[2,13],[26,6],[15,-60]],c[0]);
 if(id==='blonde')poly([[-18,-82],[-24,-34],[-35,-15],[-18,-26],[-11,-61],[17,-56],[23,-18],[29,-33],[18,-84]],c[1]);
 ellipse(-10,12,7,5,'#261e36');ellipse(13,11,7,5,'#261e36');
 ctx.fillStyle=c[0];ctx.fillRect(-12,-57,26,46);
 if(id==='blonde'){
 ctx.fillStyle=c[2];ctx.fillRect(-11,-23,24,9);ctx.fillRect(-10,-1,7,12);ctx.fillRect(7,-1,7,12);
 poly([[-12,-16],[14,-16],[22,0],[-20,0]],'#493754');
 poly([[-12,-57],[12,-57],[17,-38],[-15,-38]],'#79538c');
 line([[-9,-59],[-8,-48]],'#79538c',4);line([[10,-59],[11,-48]],'#79538c',4);
 }else line([[-12,-23],[14,-23]],id==='demon'?'#bd7880':'#bca982',4);
 ellipse(0,-73,17,20,c[2]);
 if(id==='elf'){poly([[-13,-77],[-32,-86],[-18,-65]],c[2]);poly([[12,-77],[29,-85],[17,-67]],c[2]);}
 poly([[-18,-84],[-8,-95],[13,-92],[19,-81],[10,-68],[5,-80],[-10,-64]],c[1]);
 line([[7,-73],[11,-73]],'#392c48',2);
 if(id==='elder'){poly([[-16,-67],[-10,-43],[2,-30],[13,-51],[15,-69],[3,-62]],c[1]);ellipse(0,-94,33,7,c[0]);poly([[-21,-95],[0,-134],[13,-124],[24,-118],[13,-115],[20,-95]],'#626571');line([[-16,-98],[17,-98]],'#b4b5c4',4);}
 if(id==='blonde'){ellipse(0,-97,29,6,'#665084');poly([[-18,-98],[0,-126],[12,-119],[22,-111],[12,-112],[17,-98]],'#57406f');line([[-14,-101],[14,-101]],'#c5a96c',3);}
 if(id==='demon'){poly([[-15,-85],[-26,-112],[-8,-96]],'#b68b87');poly([[9,-92],[22,-111],[20,-85]],'#b68b87');}
 if(id==='elf'){line([[-13,-84],[13,-84]],'#b1ae71',3);poly([[0,-89],[5,-85],[0,-80],[-4,-85]],'#a4cc99');}
 if(id!=='blonde'&&id!=='elder'){ctx.fillStyle=c[3];ctx.fillRect(-18,-60,31,8);poly([[-15,-59],[-43,-49],[-33,-57],[-43,-63]],c[3]);}
 line([[13,-51],[30,-39],[37,-60]],c[2],8);
 line([[33,8],[45,-100]],id==='elf'?'#89996e':'#a78b73',4);
 const gem=id==='demon'?'#ed888a':id==='elf'?'#a6d9a4':id==='elder'?'#d9e5ec':'#d2b2e7';
 poly([[45,-114],[55,-103],[45,-91],[35,-103]],gem);poly([[45,-109],[50,-103],[45,-96],[40,-103]],c[0]);
 const charging=phase==='cast'&&!isPaused()?1-Math.max(0,phaseLeft/phaseTotal):0;
 glow(45,-103,10+charging*13,gem+'60');ctx.restore();
}
function drawDefaultHero(){const bob=Math.sin(time*2.4)*5,x=hero.x,y=hero.y+bob;ellipse(x,hero.y+32,35,8,'#060e2070');ctx.save();ctx.translate(x,y);glow(2,-28,70,(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color+'15');
 // Cloak, floating boots, tunic, scarf, face, hair and hat.
 const cloak=ctx.createLinearGradient(-30,-65,20,10);cloak.addColorStop(0,'#52467f');cloak.addColorStop(1,'#292541');ctx.fillStyle=cloak;ctx.beginPath();ctx.moveTo(-14,-62);ctx.quadraticCurveTo(-40,-20,-35+Math.sin(time*3)*4,14);ctx.lineTo(-8,5);ctx.lineTo(0,14);ctx.lineTo(25,7);ctx.quadraticCurveTo(20,-34,12,-61);ctx.closePath();ctx.fill();line([[-11,-43],[-14,0]],'#8775b2',2);line([[12,-43],[17,0]],'#9e83bd',1.5);ellipse(-10,12,7,5,'#261e36');ellipse(13,11,7,5,'#261e36');ctx.fillStyle='#41416a';ctx.fillRect(-12,-57,26,46);line([[-12,-23],[14,-23]],'#c2a67f',4);ellipse(0,-73,17,20,'#d9b6a8');ctx.fillStyle='#e1d5e0';ctx.beginPath();ctx.moveTo(-17,-82);ctx.quadraticCurveTo(5,-100,18,-81);ctx.lineTo(10,-68);ctx.lineTo(5,-80);ctx.lineTo(-10,-65);ctx.closePath();ctx.fill();line([[7,-73],[11,-73]],'#392c48',2);ellipse(0,-91,33,7,'#625184');ctx.fillStyle='#44365e';ctx.beginPath();ctx.moveTo(-20,-92);ctx.lineTo(2,-134);ctx.quadraticCurveTo(8,-140,15,-126);ctx.lineTo(25,-118);ctx.lineTo(15,-117);ctx.lineTo(20,-92);ctx.closePath();ctx.fill();line([[-16,-96],[17,-96]],'#b89878',4);ctx.fillStyle='#9180aa';ctx.fillRect(-18,-60,31,9);ctx.beginPath();ctx.moveTo(-15,-59);ctx.lineTo(-45-Math.sin(time*3)*4,-49);ctx.lineTo(-33,-57);ctx.lineTo(-43,-63);ctx.closePath();ctx.fill();line([[13,-51],[30,-39],[37,-60]],'#c2adbd',8);line([[33,8],[45,-100]],'#a78b73',4);line([[41,-89],[34,-102],[46,-113],[55,-104],[45,-92]],'#d2b2d3',3);const charging=phase==='cast'&&!isPaused()?1-Math.max(0,phaseLeft/phaseTotal):0;glow(45,-103,15+charging*13,(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color+'70');ellipse(45,-103,4+charging*3,6+charging*2,(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color);if(charging>.05)rune(57,-71,12+charging*11,(S.byId[castingId||state.activeSlots.find(Boolean)]||S.byId.energyBolt).color+'90',time*2);ctx.restore();}
function drawEnemy(e){ctx.save();ctx.translate(e.x,e.y);const t=e.type%6,s=e.size,bob=Math.sin(time*4+e.seed)*3;ellipse(0,10,s*1.1,5,'#07101e70');ctx.translate(0,bob);const colors=['#83b3a4','#9b8fbd','#d8c9b3','#90a6c9','#94c8d1','#b885b7'];let color=e.flash>0?'#fff1fc':colors[e.type%6];if(e.boss){glow(0,-s,75,'#e398bc22');rune(0,5,s*1.4,'#d597b370',time*.3);}const remastered=window.MAGE_REMASTER?.enemy(ctx,e.type,s);if(!remastered){ctx.fillStyle=color;
 if(t===0){ctx.beginPath();ctx.moveTo(-s,0);ctx.bezierCurveTo(-s,-s*2.1,s,-s*2.1,s,0);ctx.quadraticCurveTo(0,s*.4,-s,0);ctx.fill();ellipse(-s*.25,-s*.9,s*.45,s*.18,'#ffffff20');}
 if(t===1){const wing=Math.sin(time*9+e.seed)*8;ctx.beginPath();ctx.moveTo(0,-s);ctx.lineTo(-s*1.9,-s*1.4-wing);ctx.lineTo(-s*1.3,-s*.15);ctx.lineTo(-s*.6,-s*.4);ctx.lineTo(0,s*.2);ctx.lineTo(s*.6,-s*.4);ctx.lineTo(s*1.3,-s*.15);ctx.lineTo(s*1.9,-s*1.4-wing);ctx.closePath();ctx.fill();ellipse(0,-s*.6,s*.6,s*.8,color);}
 if(t===2){ellipse(0,-s*1.6,s*.7,s*.65,color);line([[0,-s],[0,0]],color,5);line([[-s*.7,-s*.6],[s*.7,-s*.6]],color,4);line([[-s*.55,8],[0,-4],[s*.55,8]],color,4);line([[-s*.4,-s*.85],[s*.4,-s*.85]],color,3);ellipse(-s*.22,-s*1.6,3,4,'#263040');ellipse(s*.22,-s*1.6,3,4,'#263040');}
 if(t===3){ctx.beginPath();ctx.moveTo(-s,0);ctx.lineTo(-s*.85,-s*1.6);ctx.lineTo(-s*.3,-s*2);ctx.lineTo(s*.7,-s*1.7);ctx.lineTo(s,-s*.3);ctx.lineTo(s*.6,0);ctx.closePath();ctx.fill();line([[-s*.3,-s*1.8],[s*.2,-s],[0,0]],'#d3d5ef',2);}
 if(t===4){ctx.globalAlpha=.8;ctx.beginPath();ctx.moveTo(-s,0);ctx.quadraticCurveTo(-s*1.1,-s*2.5,0,-s*2.2);ctx.quadraticCurveTo(s,-s*2.3,s,0);ctx.lineTo(s*.3,-s*.3);ctx.lineTo(0,6);ctx.lineTo(-s*.4,0);ctx.closePath();ctx.fill();ctx.globalAlpha=1;}
 if(t===5){ellipse(0,-s,s*.85,s,color);for(let j=0;j<5;j++){const a=j*Math.PI/4;line([[Math.cos(a)*s*.5,-s+Math.sin(a)*s*.4],[Math.cos(a)*s*1.3,-s+Math.sin(a)*s+Math.sin(time*4+j)*6]],color,5);}line([[-s*.3,-s*1.7],[0,-s],[s*.4,-s*.3]],'#edb4df',2);}
 if(e.type!==2){ellipse(-s*.25,-s,2.5,3,'#1b2032');ellipse(s*.2,-s,2.5,3,'#1b2032');}}if(e.hp<e.maxHP||e.boss){const w=e.boss?85:38;ctx.fillStyle='#090c1bcc';ctx.fillRect(-w/2,-s*2.5,w,4);ctx.fillStyle=e.boss?'#df98bc':'#9fc9ba';ctx.fillRect(-w/2,-s*2.5,w*Math.max(0,e.hp/e.maxHP),4);}if(e.boss){ctx.fillStyle='#efb9cd';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText(e.stage%100===0?'OVERLORD':e.stage%10===0?'WARDEN':'BOSS',0,-s*2.5-7);}ctx.restore();}
// Immutable 4x4 source sheets; cached once and shared by all casts.
const spellImages=new Map();
function ensureSpellImage(id){
 if(!['meteor','blizzard'].includes(id)||typeof Image==='undefined')return null;
 if(spellImages.has(id))return spellImages.get(id);
 const record={status:'loading',image:new Image()};spellImages.set(id,record);
 record.image.onload=()=>{record.status=record.image.naturalWidth>0?'ready':'error';};
 record.image.onerror=()=>{record.status='error';};
 record.image.src=window.MAGE_EFFECT_EMBEDDED?.[id]||'assets/effects/'+id+'.png';return record;
}
function spellFrame(f){
 if(f.spell==='meteor')return Math.min(15,Math.floor(f.age/.08));
 // First damage is immediate: begin with the first ice barrage, then dissipate.
 return Math.min(15,3+Math.floor(f.age/.11));
}
function drawSpellSheet(f){
 const record=ensureSpellImage(f.spell);if(!record||record.status!=='ready')return false;
 const img=record.image,frame=spellFrame(f),cw=img.naturalWidth/4,ch=img.naturalHeight/4;
 const size=Math.min(350,Math.max(180,f.r*1.8));
 ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=f.age>f.duration-.16?Math.max(0,(f.duration-f.age)/.16):1;
 ctx.drawImage(img,(frame%4)*cw,Math.floor(frame/4)*ch,cw,ch,f.x-size/2,f.y-size*.84,size,size);
 ctx.restore();return true;
}
// Spell art now uses lightweight geometric Canvas effects.
function drawReworkedEffect(f){
 if(f.summonKind)return drawElementSummon(f);
 if(f.spell==='arcaneBurst')return drawBurstBeam(f);
 if(!['magicArrow','arcaneBurst','flameExplosion','meteor','iceSpear','blizzard'].includes(f.spell))return false;
 const t=f.age,p=t/f.duration,x=f.x,y=f.y,r=f.r;ctx.save();ctx.shadowBlur=0;ctx.globalAlpha=Math.min(1,(f.duration-t)*5);
 const poly=(pts,c)=>{ctx.fillStyle=c;ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.closePath();ctx.fill();};
 const ring=(xx,yy,rr,c,w=3)=>{ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(xx,yy,Math.max(1,rr),Math.max(1,rr*.4),0,0,TAU);ctx.stroke();};
 if(f.spell==='magicArrow'){
 const from=castOrigin();for(let i=0;i<3;i++){const q=Math.max(0,Math.min(1,(t-i*.1)/.28));if(t<i*.1||t>i*.1+.43)continue;
 ctx.save();ctx.translate(from.x+(x-from.x)*q,from.y+(y-from.y)*q+(i-1)*9);ctx.rotate(Math.atan2(y-from.y,x-from.x));
 line([[-70,0],[-15,0]],'#ba9cff66',5);line([[-30,0],[13,0]],'#e2d5ff',4);poly([[27,0],[8,-10],[12,0],[8,10]],'#f7f1ff');poly([[-21,0],[-35,-9],[-28,0],[-35,9]],'#ab8fe3');ctx.restore();}
 }else if(f.spell==='iceSpear'){
 ring(x,y,r*Math.min(1,p*2),'#bfefff',6*(1-p)+1);for(let i=0;i<12;i++){const a=i*TAU/12,dx=x+Math.cos(a)*r*p,dy=y+Math.sin(a)*r*p*.4;poly([[dx,dy-12],[dx+6,dy+2],[dx-6,dy+2]],'#84cae0');}
 }else if(f.spell==='meteor'&&t<.32){
 const q=t/.32,xx=x-180*(1-q),yy=y-240*(1-q);poly([[xx-80,yy-120],[xx+20,yy],[xx-24,yy+10]],'#ee964d');poly([[xx-35,yy-80],[xx+13,yy],[xx-15,yy]],'#ffd37b');poly([[xx-20,yy-17],[xx+5,yy-25],[xx+25,yy-3],[xx+12,yy+20],[xx-17,yy+16]],'#86594d');line([[xx-13,yy-10],[xx+2,yy+4],[xx+14,yy-5]],'#ffc581',3);
 }else if(f.spell==='meteor'){
 const age=t-.32,rr=f.groundRadius||r*.79;ellipse(x,y,rr,rr*.35,'#a849353f');ring(x,y,rr,'#d97c46',2);if(age<.4)ring(x,y,r*age/.4,'#ffd08a',5);
 for(let i=0;i<(state.lowFX?5:11);i++){const xx=x+Math.sin(i*9)*rr*.8,yy=y+Math.cos(i*5)*rr*.23,h=13+Math.sin(t*9+i)*6;poly([[xx-7,yy],[xx+2,yy-h],[xx+8,yy]],i%2?'#e68145':'#ffc56e');}
 }else if(f.spell==='flameExplosion'){
 for(let i=0;i<5;i++){const yy=y-i*18,rr=(r*.25+i*10);ring(x+Math.sin(t*9+i)*10,yy,rr,i%2?'#ffcf7a':'#ec854c',7);}
 for(let i=0;i<6;i++){const a=t*5+i,xx=x+Math.cos(a)*r*.6,yy=y-30+i*5;poly([[xx,yy-13],[xx+6,yy],[xx-5,yy]],'#ffb764');}
 }else if(f.spell==='blizzard'){
 ellipse(x,y,r,r*.35,'#78b9d322');ring(x,y,r,'#83c7db',2);
 for(let i=0;i<(state.lowFX?7:20);i++){const q=(t*1.8+i*.137)%1,xx=x+Math.sin(i*17)*r*.85+20*(1-q),yy=y-150*(1-q)+Math.cos(i*11)*r*.18;poly([[xx,yy-13],[xx+5,yy],[xx,yy+13],[xx-5,yy]],i%2?'#bdeeff':'#75b9d4');}
 for(let i=0;i<(state.lowFX?8:28);i++){const a=t*3+i*1.7,rr=r*(.25+(i%5)*.14);ellipse(x+Math.cos(a)*rr,y-35+Math.sin(a)*rr*.4-(i%3)*22,2,2,'#ecfaff');}
 }
 ctx.restore();return true;
}

function drawRune(){
 if(!runeActive||state.dead)return;const {x,y}=runePosition(),charged=Math.max(0,1-(time-lastOvercharge)/.6),pulse=Math.max(0,1-(time-lastRunePulse)/.3);
 ctx.save();ctx.translate(x,y);ctx.rotate(Math.sin(time*1.4)*.08);ctx.scale(1+charged*.22,1+charged*.22);
 ellipse(0,55,31,7,'#aa87e322');
 const plate=[[-35,-32],[22,-39],[40,-13],[33,34],[-26,39],[-40,14]];
 ctx.fillStyle='#665180';ctx.strokeStyle=charged?'#fff1ff':'#ba9ce3';ctx.lineWidth=3;ctx.beginPath();plate.forEach(([a,b],i)=>i?ctx.lineTo(a,b):ctx.moveTo(a,b));ctx.closePath();ctx.fill();ctx.stroke();
 ctx.strokeStyle='#a487c8';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-29,-26);ctx.lineTo(19,-31);ctx.lineTo(31,-10);ctx.lineTo(25,27);ctx.lineTo(-23,30);ctx.closePath();ctx.stroke();
 // Intentionally rough, readable rune marks like the user's sketch.
 const color=charged||pulse?'#fff2ff':'#dfc8ff';line([[-21,-7],[-10,-20],[-4,-4],[-12,14],[14,8],[23,22]],color,3+pulse*2);
 line([[1,-13],[25,-23],[19,5],[1,-13]],color,3);line([[-22,21],[-8,16],[-13,27]],'#b798e5',2);
 if(charged||pulse){ctx.globalAlpha=Math.min(1,charged+pulse)*.7;ctx.strokeStyle='#eedaff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,47+(1-Math.max(charged,pulse))*12,0,TAU);ctx.stroke();}
 ctx.restore();
}
function drawRuneShot(f){
 if(f.spell!=='runeShot')return false;const q=Math.min(1,f.age/f.impactAt),after=Math.max(0,(f.age-f.impactAt)/(f.duration-f.impactAt));
 ctx.save();ctx.globalAlpha=1-after;
 for(const [i,to]of f.targets.entries()){
  if(state.lowFX&&i%3)continue;const x=f.origin.x+(to.x-f.origin.x)*q,y=f.origin.y+(to.y-f.origin.y)*q;
  if(q<1){const back=Math.max(0,q-.1);line([[f.origin.x+(to.x-f.origin.x)*back,f.origin.y+(to.y-f.origin.y)*back],[x,y]],'#a383d8',5);ellipse(x,y,7,5,'#f4dfff');}
  else{ctx.strokeStyle='#cbb0f4';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(to.x,to.y,8+after*27,5+after*15,0,0,TAU);ctx.stroke();}
 }
 ctx.restore();return true;
}
function drawBurstBeam(f){
 const t=f.age,o=f.origin,end=f.beamEnd,impact=f.impactAt;
 if(!end)return false;ctx.save();
 if(t<impact){const q=t/impact;ellipse(o.x,o.y,9+q*19,9+q*19,'#b194e4');ellipse(o.x,o.y,5+q*10,5+q*10,'#fff0ff');for(let i=0;i<6;i++){const a=i*TAU/6+t*7;line([[o.x+Math.cos(a)*(55-q*24),o.y+Math.sin(a)*(55-q*24)],[o.x+Math.cos(a)*20,o.y+Math.sin(a)*20]],'#cdb6f3',2);}}
 else{
  const p=(t-impact)/(f.duration-impact),fade=Math.max(0,1-p),width=f.beamWidth*2*(f.overcharged?1.15:1);
  ctx.globalAlpha=fade;ctx.lineCap='round';
  line([[o.x,o.y],[end.x,end.y]],'#7d58b8',width);line([[o.x,o.y],[end.x,end.y]],'#c2a0fa',width*.64);line([[o.x,o.y],[end.x,end.y]],'#fff0ff',width*.24);
  ellipse(o.x,o.y,width*.35,width*.48,'#efdaff');
  if(f.overcharged){for(let i=0;i<(state.lowFX?5:9);i++){const q=(p*2+i/9)%1,x=o.x+(end.x-o.x)*q,y=o.y+(end.y-o.y)*q;line([[x-25,y-width*.65],[x+12,y],[x-25,y+width*.65]],'#fff3ff',5);}}
  const r=20+p*70;ctx.strokeStyle=f.overcharged?'#fff0ff':'#c6a6ed';ctx.lineWidth=5*fade+1;ctx.beginPath();ctx.ellipse(end.x,end.y,r*.5,r,0,0,TAU);ctx.stroke();
 }
 ctx.restore();return true;
}
function drawRuneWave(f){
 if(f.spell!=='runeWave')return false;const p=Math.min(1,f.age/f.duration),r=70+(f.r-70)*p;
 ctx.save();ctx.globalAlpha=1-p;ctx.strokeStyle='#ead9ff';ctx.lineWidth=8*(1-p)+2;ctx.beginPath();ctx.ellipse(f.x,f.y,r,r*.55,0,0,TAU);ctx.stroke();ctx.strokeStyle='#a080dd';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(f.x,f.y,r*.86,r*.47,0,0,TAU);ctx.stroke();
 for(let i=0;i<(state.lowFX?8:16);i++){const a=i*TAU/(state.lowFX?8:16);line([[f.x+Math.cos(a)*r*.9,f.y+Math.sin(a)*r*.5],[f.x+Math.cos(a)*r,f.y+Math.sin(a)*r*.55]],'#fff1ff',3);}
 ctx.restore();return true;
}

function drawEffect(f){if(f.rogueProjectile){drawRogueArrow(f);return;}if(f.classEffect){drawClassEffect(f);return;}if(false){ctx.save();ctx.globalAlpha=1-f.age/f.duration;ctx.strokeStyle=f.color;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(f.x,f.y,f.r*(.3+f.age/f.duration),f.r*.4,0,0,TAU);ctx.stroke();ctx.restore();return;}if(drawRuneShot(f)||drawRuneWave(f)||drawElectricEffect(f)||drawReworkedEffect(f))return;const p=f.age/f.duration,a=Math.max(0,1-p),x=f.x,y=f.y;ctx.save();ctx.globalAlpha=a;const col=f.color;if(f.tier===-1){ellipse(x,y,25,35,'#ffb9ac33');ctx.restore();return;}ctx.shadowColor=col;ctx.shadowBlur=state.lowFX?0:13;const from=castOrigin();
 if(f.tier<=2){const q=Math.min(1,p*3),bx=from.x+(x-from.x)*q,by=from.y+(y-from.y)*q;line([[from.x,from.y],[bx,by]],col+'55',f.tier===0?3:5);if(f.tier===0){ellipse(bx,by,9,5,col);ellipse(bx,by,4,3,'#fff');}else{ctx.translate(bx,by);ctx.rotate(Math.atan2(y-from.y,x-from.x));ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(23,0);ctx.lineTo(-15,-6);ctx.lineTo(-8,0);ctx.lineTo(-15,6);ctx.closePath();ctx.fill();ctx.rotate(-Math.atan2(y-from.y,x-from.x));ctx.translate(-bx,-by);}if(q===1)rune(x,y,f.tier===0?f.r*(.4+.6*p):10+p*35,col,a*2);}
 if(f.tier===3){ctx.save();ctx.translate(x,y);ctx.scale(1,.55);rune(0,0,f.r*(.3+p*.7),col,p);for(let i=0;i<12;i++){const t=i*TAU/12;line([[Math.cos(t)*f.r*.3,Math.sin(t)*f.r*.3],[Math.cos(t)*f.r*p,Math.sin(t)*f.r*p]],col,2);}ctx.restore();}
 if(f.tier===4){let prev=from;for(const target of f.targets){const points=[[prev.x,prev.y]];for(let i=1;i<7;i++)points.push([prev.x+(target.x-prev.x)*i/7+Math.sin(i*7+f.seed)*9,prev.y+(target.y-prev.y)*i/7+Math.cos(i*5+f.age*12)*10]);points.push([target.x,target.y]);line(points,col,3);line(points,'#fff',1);prev=target;}}
 if(f.tier===5){ellipse(x,45,Math.min(f.r,150),22,'#aab4e333');for(let i=0;i<4;i++){const xx=x+(i-1.5)*35;const pts=[[xx,45],[xx-12,100],[xx+7,150],[xx-8,200],[xx,y]];line(pts,col,4);line(pts,'#f8f2ff',1);}rune(x,y,f.r*.55,col+'88',p);}
 if(f.tier===6){for(let i=0;i<10;i++){const yy=y-i*12,rr=(15+i*4)*(1-p*.5);ctx.strokeStyle=i%2?'#ffd29b':col;ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x+Math.sin(time*10+i)*8,yy,rr,7,Math.sin(i)*.1,0,TAU);ctx.stroke();}glow(x,y-45,65,col+'44');}
 if(f.tier===7){const q=Math.min(1,p*2.5);const mx=x+160*(1-q),my=y-260*(1-q);line([[mx+120,my-200],[mx,my]],'#ffb78788',30);line([[mx+90,my-160],[mx,my]],'#ffd29c',12);ellipse(mx,my,22,27,'#d77c65');ellipse(mx-4,my-6,14,17,'#ffc083');if(q===1){ctx.save();ctx.translate(x,y);ctx.scale(1,.45);rune(0,0,Math.max(10,f.r*(p-.3)*1.4),col,0);ctx.restore();glow(x,y,90*(1-p),col+'99');}}
 if(f.tier===8){for(let i=0;i<7;i++){const q=Math.min(1,Math.max(0,(p-i*.05)*2.7)),tx=x+Math.sin(i*8)*f.r*.65,ty=y+Math.cos(i*6)*25,mx=tx+90*(1-q),my=ty-220*(1-q);line([[mx+35,my-85],[mx,my]],col,3);ellipse(mx,my,4,7,'#fff');if(q===1)rune(tx,ty,10+p*20,col,0);}}
 if(f.tier===9){const r=(18+Math.sin(p*Math.PI)*35);glow(x,y,r*2,col+'77');ctx.save();ctx.translate(x,y);ctx.rotate(-.3);for(let i=0;i<3;i++){ctx.strokeStyle=i%2?'#efc5ff':col;ctx.lineWidth=2+i;ctx.beginPath();ctx.ellipse(0,0,r*(1+i*.2),r*.5,0,p*5+i,p*5+i+Math.PI*1.7);ctx.stroke();}ellipse(0,0,r*.7,r*.7,'#080811');ctx.restore();rune(x,y,r*1.4,col+'66',-p*3);}
 if(f.tier===10){const q=Math.min(1,p*1.5),bx=from.x+(x-from.x)*q,by=from.y+(y-from.y)*q;line([[from.x,from.y],[bx,by]],col+'99',10);ellipse(bx,by,16,13,col);glow(bx,by,35,col+'88');if(q===1){rune(x,y,f.r*(.4+.6*p),col,p);glow(x,y,f.r,col+'55');}}if(f.tier===11){const q=Math.min(1,p*3),bx=from.x+(x-from.x)*q,by=from.y+(y-from.y)*q;line([[bx-45,by-15],[bx,by]],'#ff8b4677',15);glow(bx,by,35,'#ff9b4477');ellipse(bx,by,11,11,'#ffab60');ellipse(bx-2,by-2,6,6,'#ffeac0');if(q===1)rune(x,y,f.r*p,col,p);}
 if(f.tier===12){glow(x,y,f.r,'#ff8b4455');for(let i=0;i<9;i++){const angle=i*TAU/9,rr=f.r*p;ellipse(x+Math.cos(angle)*rr,y+Math.sin(angle)*rr*.5,8*(1-p)+2,13*(1-p)+2,col);}rune(x,y,f.r*(.2+.8*p),col,-p);}
 ctx.restore();}
function drawEnemyStatus(e){ctx.save();const x=e.x,y=e.y-e.size*2.5-18;let label='',color='#ddd';if(time<e.ccUntil){label=e.ccLabel; color=e.ccLabel==='빙결'?'#9eedff':'#e7c0ff';ellipse(e.x,e.y-e.size,e.size*1.25,e.size*1.6,color+'33');}else if(e.burnLeft>0){label='화상 '+(e.burns?.[0]?.stacks||1);color='#ffb484';}else if(e.shockUntil>time){label='감전';color='#e0b7ff';}else if(e.starStacks>0){label='✧'.repeat(e.starStacks);color='#c9edff';}else if(e.iceStacks>0){label='❄'.repeat(e.iceStacks);color='#a6e5f3';}if(label){ctx.fillStyle=color;ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText(label,x,y);}ctx.restore();}
function render(){if(tab!=='magic')return;const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;const dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);}ctx.setTransform(canvas.width/1000,0,0,canvas.height/400,0,0);ctx.clearRect(0,0,1000,400);ctx.save();if(shake)ctx.translate(Math.sin(time*60)*shake,Math.cos(time*50)*shake*.3);drawBackground();const worldScale=Math.min(canvas.width/1000,canvas.height/400);ctx.setTransform(worldScale,0,0,worldScale,(canvas.width-1000*worldScale)/2,Math.max(0,(canvas.height-400*worldScale)*.6));drawRune();drawHero();if(classId!=='mage')drawClassAllies();for(const e of [...enemies].sort((a,b)=>a.y-b.y)){drawEnemy(e);drawEnemyStatus(e);}for(const f of effects)drawEffect(f);for(const p of particles){ctx.globalAlpha=1-p.age/p.duration;ellipse(p.x,p.y,p.size,p.size,p.color);}ctx.globalAlpha=1;for(const t of texts){const k=t.age/t.duration,pop=t.damage?1+.55*Math.max(0,1-t.age/.14):1;ctx.globalAlpha=k<.7?1:Math.max(0,1-(k-.7)/.3);ctx.font=(t.damage?'bold ':'')+Math.round((t.damage?15:12)*pop)+'px sans-serif';ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=t.damage?3:2.5;ctx.strokeStyle='#0a0714dd';ctx.shadowBlur=0;ctx.strokeText(t.label,t.x,t.y);ctx.fillStyle=t.color;ctx.shadowBlur=3;ctx.shadowColor='#000';ctx.fillText(t.label,t.x,t.y);}ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();if(manualPause){ctx.fillStyle='#0b0d1670';ctx.fillRect(0,0,1000,400);ctx.fillStyle='#ece2ff';ctx.font='20px sans-serif';ctx.textAlign='center';ctx.fillText('일시정지',500,210);}}
function frame(ts){const dt=lastTS?Math.min((ts-lastTS)/1000,.05):0;const onlineDt=lastTS?Math.max(0,(ts-lastTS)/1000):0;lastTS=ts;gachaTick(onlineDt);if(!isPaused())update(dt);render();refreshSlotGauges();if(ts-lastUI>180){refresh();lastUI=ts;}if(ts-lastSave>5000){if(state.started)save();lastSave=ts;}requestAnimationFrame(frame);}
// Included inside game closure by build integration. Native canvas art; no generated asset dependencies.
let allies=[],classBuffs={},classSerial=0,nextNoMind=30,absorbWindow=[];
function classP(id){return state.skillLevels[id]||0;}
function classClear(){allies=[];classBuffs={};absorbWindow=[];}
function classStats(id,v=state,eq=v.equipped){const n=S.byId[id],c=character(v,eq),p=x=>v.skillLevels[x]||0,level=Math.max(1,p(id))+I.setLevels(c.setCounts[n.family]),g=1+.15*(level-1),synergy=S.synergy(v.skillLevels,id),setDamage=(c.setCounts[n.family]>=2?.1:0)+(c.setCounts[n.family]>=5?.1:0);let bonus=0;
if(classId==='warrior')bonus=n.family==='energy'?.05*p('swordPower'):n.family==='ice'?.05*p('crushPower'):id==='pierce'?.03*p('pierceMaster'):0;
if(classId==='rogue')bonus=.05*p('calm')+(n.family==='energy'?.05*p('daggerPower'):n.family==='fire'?.05*p('archeryPower'):0);
if(classId==='summoner')bonus=.04*p('dragonBond')+({energy:.05*p('beastPower'),fire:.05*p('spiritPower'),ice:.05*p('undeadPower')}[n.family]||0);
let radius=(n.radius+(n.rGrow||0)*(level-1))*(1+c.rangeBonus+(classId==='warrior'&&n.family==='energy'?.04*p('swordRange'):classId==='rogue'&&n.family==='fire'?.04*p('archeryRange'):0));
let cooldown=n.fixedCD?n.cd:n.cd*(classId==='summoner'?1-c.cdr:1-Math.min(.4,.02*(level-1)));if(id==='deathKnight')cooldown*=1-.04*p('undeadHP');
const speed=classId==='rogue'&&n.family==='energy'?c.attackSpeed+.03*p('daggerSpeed'):c.attackSpeed;
const cast=n.cast/(classId==='summoner'?1:1+Math.min(1.5,speed));const unit=c.magicPower*c.magicAtk*g*(1+synergy+setDamage+bonus),damage=unit*n.coef,period=n.period? n.period/(1+c.summonSpeed):0;
let totalDamage=damage;if(n.hits)totalDamage=damage;if(n.summon&&period)totalDamage=damage*(n.duration?Math.floor(n.duration/period):1);if(id==='skeleton')totalDamage=damage*6;if(id==='ancientDragon')totalDamage=damage*(1+Math.floor((12-1/(1+c.summonSpeed))/period));if(id==='dragon')totalDamage+=unit*24*(1+c.summonSpeed);if(id==='poisonZone')totalDamage=damage*4;
const dps=(n.summon&&period&&!n.duration?damage/period:totalDamage/(cast+cooldown||1))*(1+c.crit*(c.critMult-1));
return{...c,damage,unit,dotDps:id==='poisonZone'?damage:0,duration:n.duration||0,totalDamage,level,invested:p(id),bonusLevel:level-Math.max(1,p(id)),synergy,setDamage,amplification:0,hitCount:n.hits||0,hitDamage:damage/(n.hits||1),reach:600*(1+c.rangeBonus),radius,cast,cooldown,interval:cast+cooldown,dps,period,meterEpoch};}
function classReady(id){const n=S.byId[id];if((classId==='warrior'&&['energy','fire','ice'].includes(n.family))||(classId==='rogue'&&['energy','fire'].includes(n.family))){const range=classStats(id).reach;if(!enemies.some(e=>e.hp>0&&e.x>=hero.x&&e.x<=hero.x+range))return false;}if(n.persistent&&classBuffs.poison)return false;if(n.summon&&!['boar','skeleton','skeletonMage'].includes(id)&&allies.some(a=>a.skill===id))return false;return true;}
function classHit(e,raw,n,st,kind='direct',clone=false,percent=false){if(e.hp<=0)return;let amount=raw;
if(!percent){amount*=e.boss?1+st.bossBonus+(classId==='warrior'&&n.family==='fire'?.05*classP('bossThrust'):0):1;if(time<(e.deathMarkUntil||0))amount*=1+e.deathMarkBonus;if(classId==='warrior'&&time<(classBuffs.noMind||0))amount*=1+.6*classP('noMind');if(kind!=='dot'&&Math.random()<st.crit)amount*=st.critMult;}
applyDamage(e,amount,n.color,'',n.id,kind,st.meterEpoch);
if(e.hp<=0)return;
if(classId==='rogue'&&!percent&&['energy','fire','lightning'].includes(n.family)&&n.id!=='clone'&&classBuffs.poison){const ps=classStats('poisonWeapon');addPoison(e,ps,n.id,1,clone?(classBuffs.cloneMult||.2):1);}
if(n.knock&&!e.boss)e.x=Math.min(980,e.x+n.knock);
}
function classAbsorb(st){if(classId==='mage'||classId==='summoner'||!st.leech)return;absorbWindow=absorbWindow.filter(a=>a.t>time-1);const used=absorbWindow.reduce((v,a)=>v+a.n,0),n=Math.min(.015-used,Math.min(.005,st.leech/100));if(n>0){state.hp=Math.min(st.hp,state.hp+st.hp*n);absorbWindow.push({t:time,n});}}
function addPoison(e,st,source,count=1,mult=1){e.poison??=[];const damage=st.unit*.035*(1+.08*classP('poisonPower')/(1+st.synergy+st.setDamage+.05*classP('calm')))*mult;for(let i=0;i<count;i++){if(e.poison.length<20)e.poison.push({damage,source,epoch:st.meterEpoch});else{let min=0;e.poison.forEach((a,j)=>{if(a.damage<e.poison[min].damage)min=j;});if(e.poison[min].damage<damage)e.poison[min]={damage,source,epoch:st.meterEpoch};}}e.poisonUntil=time+5+.4*classP('poisonTime');}
function classCast(id){const n=S.byId[id],st=classStats(id);if(!n||!state.skillLevels[id])return false;const alive=()=>enemies.filter(e=>e.hp>0&&e.x<=980);let target=alive().sort((a,b)=>a.x-b.x)[0];if(!target&& !n.summon&&!n.buff&&!n.persistent)return false;
if(classId==='rogue'&&['energy','fire'].includes(n.family)&&!classReady(id))return false;
if(n.summon){classSummon(n,st);return true;}if(id==='poisonWeapon'){classBuffs.poison=true;return true;}
if(id==='guard'){classBuffs.guard=time+1.5;classBuffs.guardReduction=.25+.01*(st.level-1);return true;}
if(id==='counter'){classBuffs.counterUsed=false;classBuffs.counter=time+3;classBuffs.counterShield=st.hp*(.12+.01*(st.level-1));classBuffs.counterStats=st;return true;}
if(id==='absolute'){classBuffs.absolute=time+3;classBuffs.absoluteBonus=Math.max(50,st.armor*(1+.1*(st.level-1)));return true;}
if(id==='clone'){classBuffs.clone=time+6;classBuffs.cloneMult=.2+.01*(st.level-1)+.02*classP('clonePower');return true;}
if(['ambush','shadowRaid'].includes(id)&&classP('evasion')&&time>=(classBuffs.lastEvasion||-10)+3){classBuffs.evade=time+.2+.04*classP('evasion');classBuffs.lastEvasion=time;}
if(id==='assassinate'){target=alive().sort((a,b)=>(+b.boss-+a.boss)||b.hp-a.hp)[0];const success=Math.random()<Math.min(.3,.1+.01*(st.level-1));classHit(target,success?target.hp*.5:st.damage,n,st,'direct',false,success);classFx(target,n,success?'암살 성공':'암살');return true;}
if(id==='deathMark'){classHit(target,st.damage,n,st);target.deathMarkUntil=time+5;target.deathMarkBonus=.15+.01*(st.level-1);classFx(target,n,'표식');return true;}
if(id==='poisonZone'){const x=target.x,y=target.y;for(let j=1;j<=8;j++)schedule(j*.5,()=>{let targets=alive().filter(e=>Math.hypot(e.x-x,e.y-y)<=st.radius);targets.forEach(e=>{classHit(e,st.damage*.5,n,st,'dot');addPoison(e,st,id);});classFx({x,y},n,'맹독');});return true;}
const center={x:target.x,y:target.y},original=alive();let hits=n.hits||1;
const strike=(j,copy=false)=>{if(state.dead||!state.activeSlots.includes(id))return;let targets=alive();if(id==='triple'&&targets.length){const front=targets.sort((a,b)=>a.x-b.x)[0];center.x=front.x;center.y=front.y;}if(classId==='rogue'&&['arrow','explosiveArrow'].includes(id)){launchRogueArrow(n,st,center,copy);return;}if(classId==='rogue'&&n.family==='energy'){targets=targets.filter(e=>e.x>=hero.x&&e.x<=hero.x+st.reach&&Math.abs(e.y-center.y)<=st.radius).sort((a,b)=>a.x-b.x);}else if(classId==='warrior'&&['energy','fire','ice'].includes(n.family)){const half=n.family==='fire'?Math.max(25,(n.line||40)*(1+st.rangeBonus)):st.radius;targets=targets.filter(e=>e.x>=hero.x&&e.x<=hero.x+st.reach&&Math.abs(e.y-center.y)<=half).sort((a,b)=>a.x-b.x);}else if(n.all)targets=targets.filter(e=>original.includes(e));else if(id==='shadowRaid'){const t=targets[j%Math.max(1,targets.length)];targets=t?[t]:[];}else if(n.line)targets=targets.filter(e=>Math.abs(e.y-center.y)<=n.line*(1+(classId==='rogue'?.04*classP('archeryRange'):0))/2&&e.x>=hero.x&&e.x<=hero.x+st.radius).sort((a,b)=>a.x-b.x);else targets=targets.filter(e=>Math.hypot(e.x-center.x,e.y-center.y)<=st.radius);
const share=n.shares?n.shares[j]:1/hits;let hit=false;targets.forEach((e,k)=>{let loss=n.loss?Math.max(0,n.loss-.01*classP('pierceMaster')):id==='arrow'?Math.max(-.04,.1-.01*(st.level-1)):0;classHit(e,st.damage*share*Math.pow(1-loss,k)*(copy?classBuffs.cloneMult:1),n,st,copy?'summon':'direct',copy);if(id==='poisonTrap')addPoison(e,st,id,3);hit=true;});if(hit&&!copy&& !['poisonTrap'].includes(id))classAbsorb(st);classFx(center,n,copy?'분신':'');};
for(let j=0;j<hits;j++){const delay=id==='quake'?j*.25:id==='heavenSlash'?j*.3:j*st.cast/hits;schedule(delay,()=>{strike(j);if(classId==='rogue'&&time<(classBuffs.clone||0)&&['energy','fire'].includes(n.family))strike(j,true);});}return true;}
function classFx(pos,n,label=''){effects.push({classEffect:true,reach:classStats(n.id).reach,originX:hero.x,originY:hero.y-25,family:n.family,x:pos.x,y:pos.y-15,r:Math.max(35,Math.min(230,n.radius)),age:0,duration:.3,color:n.color,skill:n.id,job:classId});if(label)float(pos.x,pos.y-60,label,n.color,false);}

function launchRogueArrow(n,st,aim,copy=false){const x=hero.x+(copy?42:0),y=hero.y-25,angle=Math.atan2(aim.y-15-y,Math.max(1,aim.x-x));effects.push({rogueProjectile:true,x,y,angle,speed:1050,age:0,duration:1.2,n,st,copy,copyMult:copy?(classBuffs.cloneMult||.2):1,stage:state.stage,seen:new Set(),hitCount:0,absorbed:false,color:n.color});}
function tickRogueArrow(f,dt){if(f.stage!==state.stage||state.dead||!state.activeSlots.includes(f.n.id)){f.duration=0;return;}const x0=f.x,y0=f.y;f.x+=Math.cos(f.angle)*f.speed*dt;f.y+=Math.sin(f.angle)*f.speed*dt;const dx=f.x-x0,dy=f.y-y0,len=dx*dx+dy*dy;const hits=enemies.filter(e=>e.hp>0&&!f.seen.has(e.id)).map(e=>{const t=Math.max(0,Math.min(1,((e.x-x0)*dx+(e.y-15-y0)*dy)/(len||1)));return{e,t,d:Math.hypot(e.x-x0-dx*t,e.y-15-y0-dy*t)};}).filter(h=>h.d<=h.e.size+Math.max(5,(f.n.line||10)/2)*(1+.04*classP('archeryRange'))).sort((a,b)=>a.t-b.t||a.e.x-b.e.x);
for(const {e}of hits){if(f.stage!==state.stage)break;f.seen.add(e.id);if(f.n.id==='explosiveArrow'){const pos={x:e.x,y:e.y};for(const victim of enemies.filter(v=>v.hp>0&&Math.hypot(v.x-pos.x,v.y-pos.y)<=f.st.radius))classHit(victim,f.st.damage*f.copyMult,f.n,f.st,f.copy?'summon':'direct',f.copy);classFx(pos,f.n,'');f.duration=0;}else{const loss=Math.max(-.04,.1-.01*(f.st.level-1));classHit(e,f.st.damage*Math.pow(1-loss,f.hitCount++)*f.copyMult,f.n,f.st,f.copy?'summon':'direct',f.copy);}if(!f.copy&&!f.absorbed){classAbsorb(f.st);f.absorbed=true;}if(f.duration===0)break;}if(f.x>1100)f.duration=0;
}
function drawRogueArrow(f){ctx.save();ctx.translate(f.x,f.y);ctx.rotate(f.angle);ctx.globalAlpha=f.copy?.45:1;line([[-65,0],[8,0]],f.color,3);line([[-8,-7],[8,0],[-8,7]],'#fff3cc',3);line([[-52,-6],[-43,0],[-52,6]],f.color,2);ctx.restore();}

function classSummon(n,st){const id=n.id,wave=++classSerial,group=['skeleton','skeletonMage'].includes(id),count=group?st.level:1;
if(group){const waves=[...new Set(allies.filter(a=>a.skill===id).map(a=>a.wave))];if(waves.length>=2)allies=allies.filter(a=>a.wave!==waves[0]);}else allies=allies.filter(a=>a.skill!==id);
while(allies.length+count>64){const old=allies.find(a=>['boar','skeleton','skeletonMage'].includes(a.skill));if(!old)return;allies=allies.filter(a=>a.wave!==old.wave);}
const golem=n.family==='lightning',extraHP=.05*classP('dragonBond')+(n.family==='energy'?.08*classP('beastHP'):n.family==='ice'?.08*classP('undeadHP'):golem?.1*classP('golemHP'):0)+st.summonHP/100;
for(let i=0;i<count;i++){const hp=st.hp*n.hp*(golem?st.level:1+.08*(st.level-1))*(1+extraHP)/(group?count:1),armor=(st.armor*(n.armor||.5)+(n.flatArmor||0))*(golem?1+.1*classP('golemArmor'):1);allies.push({skill:id,n,st,wave,x:golem?hero.x+120+(n.rank-1)*35:hero.x+55+i%5*9,y:hero.y+(i%5-2)*9,hp:n.hp?hp:1,maxHP:n.hp?hp:1,armor,golem,born:time,expires:n.duration?time+n.duration:Infinity,next:time+(id==='ancientDragon'?1/(1+st.summonSpeed):st.period||0),seen:new Set(),first:true,roar:time+8,breath:time+3/(1+st.summonSpeed),breatheUntil:0});}}
function classTick(dt){if(classId==='warrior'&&classP('noMind')&&time>=nextNoMind){classBuffs.noMind=time+3;nextNoMind=time+30;banner('무아의 경지 ×'+(1+.6*classP('noMind')));}if(classId==='warrior')state.hp=Math.min(stats().hp,state.hp+stats().hp*.001*classP('breath')*dt);
for(const e of enemies){if(e.hp<=0)continue;if(e.poison?.length&&time<(e.poisonUntil||0)){for(const p of e.poison){let amount=p.damage*dt;if(time<(e.deathMarkUntil||0))amount*=1+e.deathMarkBonus;applyDamage(e,amount,'#91dd73','',p.source,'dot',p.epoch);if(e.hp<=0)break;}}else e.poison=[];}
for(const a of [...allies]){if(a.hp<=0||time>a.expires+1e-8||!state.activeSlots.includes(a.skill))continue;const targets=enemies.filter(e=>e.hp>0&&e.x<=980),target=targets.sort((x,y)=>x.x-y.x)[0];if(a.skill==='boar'){let from=a.x;a.x+=420*dt;for(const e of targets)if(!a.seen.has(e.id)&&e.x>=from-35&&e.x<=a.x+35){a.seen.add(e.id);classHit(e,a.st.damage,a.n,a.st,'summon');if(e.boss){e.boarSlowUntil=time+1.5;}else if(time>=(e.boarKnock||0)){e.x=Math.min(980,e.x+30+2*(a.st.level-1));e.boarKnock=time+1;}}if(a.x>1100)a.hp=0;continue;}
if(!target){a.next=Math.max(a.next,time);continue;}
const melee=!!a.n.speed;if(melee&&target.x-a.x>a.n.radius){a.x=Math.min(target.x-a.n.radius,a.x+a.n.speed*dt);a.next=Math.max(a.next,time);continue;}
if(a.first&&melee){a.next=time+(a.skill==='skeleton'?0:a.st.period);a.first=false;}
if(a.skill==='wolf'&&time>=a.roar){for(const e of targets.filter(e=>Math.abs(e.x-a.x)<130)){freezeOrStun(e,(.5+.02*(a.st.level-1))*(e.boss?.25:1),'공포');}a.roar=time+8;}
if(a.skill==='griffin'&&time>=a.roar){a.boost=1.3;a.roar=time+10;}
let multiplier=(a.boost||1);if(a.n.family==='ice'&&a.skill!=='deathKnight'){const dk=allies.find(b=>b.skill==='deathKnight'&&b.hp>0);if(dk)multiplier*=1+( .1+.01*(dk.st.level-1))/(1+a.st.synergy+a.st.setDamage+.05*classP('undeadPower')+.04*classP('dragonBond'));}
if(a.n.family==='fire'&&a.skill!=='spiritKing'&&allies.some(b=>b.skill==='spiritKing'&&b.hp>0))multiplier*=1+.1/(1+a.st.synergy+a.st.setDamage+.05*classP('spiritPower')+.04*classP('dragonBond'));
while(time+1e-8>=a.next&&a.next<=a.expires+1e-8){a.next+=a.st.period||1;let hits=a.n.radius?targets.filter(e=>Math.hypot(e.x-target.x,e.y-target.y)<=a.st.radius):[target];if(melee&&a.skill!=='golem'&&a.skill!=='ironGolem'&&a.skill!=='diamondGolem')hits=[target];for(const e of hits)classHit(e,a.st.damage*multiplier/(['skeleton','skeletonMage'].includes(a.skill)?a.st.level:1),a.n,a.st,'summon');a.boost=1;classFx(target,a.n);}
if(a.skill==='dragon'&&time>=a.breath&&a.breath<a.expires){a.breath+=4/(1+a.st.summonSpeed);const end=Math.min(a.expires,time+1/(1+a.st.summonSpeed));for(let j=1;j<=4;j++)schedule((end-time)*j/4,()=>{if(!allies.includes(a)||a.hp<=0)return;for(const e of enemies.filter(e=>e.hp>0&&Math.abs(e.y-target.y)<70&&e.x< a.x+700))classHit(e,a.st.unit*2,a.n,a.st,'summon');classFx(target,a.n,'브레스');});}
}
const expired=allies.filter(a=>a.hp<=0||time>a.expires+1e-8||!state.activeSlots.includes(a.skill));for(const a of expired)if(!a.n.duration&&!['boar','skeleton','skeletonMage'].includes(a.skill)&&state.activeSlots.includes(a.skill))state.cooldowns[a.skill]=Math.max(state.cooldowns[a.skill]||0,a.st.cooldown);allies=allies.filter(a=>!expired.includes(a));}
function classEnemyAttack(e,dt){
 const g=allies.filter(a=>a.golem&&a.hp>0).sort((a,b)=>b.x-a.x)[0];
 const blocked=g&&e.x<=g.x+45;
 const victim=blocked?g:allies.filter(a=>!a.golem&&a.hp>0&&a.n.hp&&Math.abs(a.x-e.x)<45&&Math.abs(a.y-e.y)<55).sort((a,b)=>Math.abs(a.x-e.x)-Math.abs(b.x-e.x))[0];
 if(!victim)return false;if(blocked)e.x=Math.max(e.x,g.x+40);
 e.attackCD-=dt;if(e.attackCD<=0){e.attackCD+=C.enemyAttackInterval;victim.hp-=e.attack*100/(100+victim.armor);victim.flash=time+.15;}
 // Only golems block movement. Other allies can be hit while enemies keep advancing.
 if(!blocked&&e.x<=e.stopX)e.attackCD+=dt;return !!blocked;
}
function classDamagePlayer(amount){if(time<(classBuffs.evade||0))return 0;const st=stats(),armor=st.armor+(time<(classBuffs.absolute||0)?classBuffs.absoluteBonus:0);let damage=amount*100/(100+armor);if(time<(classBuffs.guard||0))damage*=1-classBuffs.guardReduction;if(classId==='summoner'&&allies.some(a=>a.n.family==='fire'))damage*=1-.02*classP('spiritGuard');if(time<(classBuffs.counter||0)){const used=Math.min(classBuffs.counterShield,damage);classBuffs.counterShield-=used;damage-=used;if(!classBuffs.counterUsed){classBuffs.counterUsed=true;const n=S.byId.counter;for(const e of enemies.filter(e=>e.hp>0&&e.x<hero.x+200))classHit(e,classBuffs.counterStats.damage,n,classBuffs.counterStats,'counter');}}
const absorbed=Math.min(state.shield,damage);state.shield-=absorbed;state.hp-=damage-absorbed;return damage;}
function drawClassHero(){const cfg=skinConfig(),record=ensureSkin(cfg.id),h=165,w=h*180/210,x=hero.x-w/2,y=hero.y+30-h;ellipse(hero.x,hero.y+32,30,6,'#08101c88');if(record?.status==='ready'){if(classId==='rogue'&&time<(classBuffs.clone||0)){ctx.save();ctx.globalAlpha=.25;ctx.drawImage(record.image,x+42,y,w,h);ctx.restore();}ctx.drawImage(record.image,x,y,w,h);}else{ctx.fillStyle=cfg.color;ctx.fillRect(hero.x-15,hero.y-65,30,75);ellipse(hero.x,hero.y-82,16,18,'#ebc7a4');line([[hero.x-9,hero.y+10],[hero.x-9,hero.y+28]],'#293040',9);line([[hero.x+9,hero.y+10],[hero.x+9,hero.y+28]],'#293040',9);}}
function drawClassEffect(f){const p=f.age/f.duration,x=f.x,y=f.y;ctx.save();ctx.globalAlpha=1-p;
 if(f.job==='warrior'){const ox=f.originX,oy=f.originY,end=Math.min(ox+f.reach,f.x),travel=ox+(end-ox)*Math.min(1,p*2.5);if(f.family==='fire'){const length=Math.max(45,travel-ox),base=travel-length;ctx.shadowColor=f.color;ctx.shadowBlur=12;ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(base,y-8);ctx.lineTo(travel-23,y-6);ctx.lineTo(travel+18,y);ctx.lineTo(travel-23,y+6);ctx.lineTo(base,y+8);ctx.closePath();ctx.fill();line([[base+8,y-3],[travel-20,y-2],[travel+14,y]],'#f4fbff',3);line([[base,y-17],[base,y+17]],'#ffe5a2',5);line([[base-30,y],[base,y]],'#dbbb7a',7);ctx.shadowBlur=0;}else if(f.family==='ice'){line([[end-70,y-105],[end+12,y+35]],'#f6e4c9',7);line([[ox,oy+45],[travel+20,y+45]],f.color,5);for(let q=ox;q<travel;q+=35)line([[q,y+45],[q+12,y+12],[q+23,y+45]],f.color,4);}else{ctx.strokeStyle=f.color;ctx.lineWidth=7;ctx.beginPath();ctx.ellipse(travel,y,23,75,-.2,-Math.PI*.6,Math.PI*.6);ctx.stroke();if(f.skill==='cross')line([[travel-40,y+55],[travel+35,y-55]],'#f3f7ff',4);if(f.skill==='spin'){ctx.beginPath();ctx.ellipse(travel,y,60,38,p*5,0,TAU);ctx.stroke();}}}
 else if(f.job==='rogue'&&f.family==='energy'){const ox=f.originX,end=Math.min(ox+f.reach,f.x),travel=ox+(end-ox)*Math.min(1,p*3);line([[travel-35,y+18],[travel+20,y-18]],'#efffff',4);line([[travel-43,y+14],[travel+10,y-22]],f.color,7);}
 else if(f.job==='rogue'&&f.skill==='explosiveArrow'){ellipse(x,y,f.r*(.4+p),f.r*(.3+p*.3),f.color+'55');ctx.strokeStyle=f.color;
ctx.lineWidth=4;
ctx.beginPath();
ctx.ellipse(x,y,Math.max(1,f.r*(.4+p)),Math.max(1,f.r*(.4+p)*.4),0,0,TAU);
ctx.stroke();}
 else if(f.job==='rogue'&&['arrow','arrowRain'].includes(f.skill)){for(let i=0;i<(f.skill==='arrowRain'?4:1);i++){const yy=y+i*12;line([[x-85+100*p,yy],[x+25+100*p,yy]],f.color,3);line([[x+10+100*p,yy-8],[x+25+100*p,yy],[x+10+100*p,yy+8]],f.color,3);}}
 else{ctx.strokeStyle=f.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,f.r*(.3+p),f.r*.4,0,0,TAU);ctx.stroke();for(let i=0;i<6;i++){let angle=i*TAU/6;line([[x+Math.cos(angle)*20,y+Math.sin(angle)*15],[x+Math.cos(angle)*f.r*p,y+Math.sin(angle)*f.r*.5*p]],f.color,2);}}ctx.restore();}
function drawClassAllies(){for(const a of allies){const x=a.x,y=a.y-15,c=a.golem?'#879d9b':a.n.family==='ice'?'#d3d5be':a.n.family==='fire'?'#8cdfe0':a.n.family==='cosmic'?'#be8cd7':'#c6aa77';const size=a.golem?32:a.n.family==='cosmic'?35:a.skill.startsWith('skeleton')?9:17;ctx.save();
 if(window.MAGE_REMASTER?.ally(ctx,a,time)){ctx.restore();continue;}
 if(a.golem){ctx.fillStyle=c;ctx.fillRect(x-25,y-34,50,54);ctx.fillRect(x-34,y-22,12,35);ctx.fillRect(x+22,y-22,12,35);ctx.fillRect(x-22,y+18,15,20);ctx.fillRect(x+7,y+18,15,20);ellipse(x,y-41,19,16,c);ellipse(x,y-9,6,8,'#b6f8dd');}
 else if(a.skill==='boar'||a.skill==='wolf'){ellipse(x,y,24,14,c);ellipse(x+22,y-9,13,12,c);line([[x-15,y+8],[x-16,y+22]],c,6);line([[x+14,y+8],[x+15,y+22]],c,6);line([[x-23,y],[x-35,y-10]],c,4);if(a.skill==='boar')line([[x+30,y-6],[x+38,y+3],[x+37,y-9]],'#f1ecda',3);else line([[x+18,y-18],[x+18,y-29],[x+28,y-18]],c,5);}
 else if(a.n.family==='cosmic'||a.skill==='griffin'){ellipse(x,y,size,size*.65,c);ellipse(x+size,y-13,size*.45,size*.4,c);line([[x-15,y],[x-60,y-30],[x-38,y+5]],c,9);line([[x+4,y],[x-10,y-50],[x+20,y-15]],c,9);line([[x-size,y],[x-size-25,y+15]],c,7);line([[x+size,y-18],[x+size+7,y-35]],c,4);}
 else if(a.skill.startsWith('skeleton')||a.skill==='deathKnight'){ellipse(x,y-20,size,size,c);line([[x,y-10],[x,y+16]],c,6);line([[x,y],[x-13,y+10]],c,4);line([[x,y],[x+13,y+5]],c,4);line([[x,y+15],[x-8,y+28]],c,4);line([[x,y+15],[x+8,y+28]],c,4);line([[x+13,y+7],[x+22,y-20]],a.skill==='skeletonMage'?'#c9a6ef':'#eaf0ef',3);}
 else{ellipse(x,y+Math.sin(time*3+a.wave)*4,size,size*1.2,c);rune(x,y,size*1.3,c,time);}
 ctx.fillStyle='#25252d';ctx.fillRect(x+size*.15,y-size*.3,3,4);if(a.n.hp){ctx.fillStyle='#39544e';ctx.fillRect(x-size,y+size+7,size*2,3);ctx.fillStyle='#9fecbd';ctx.fillRect(x-size,y+size+7,size*2*Math.max(0,a.hp/a.maxHP),3);}ctx.restore();}}



function applyClassGear(){I.defs.magicAtk.name=classId==='mage'?'마법공격력':'무기 공격력';I.defs.magicPower.name=classId==='mage'?'마력':'성장력';I.defs.radius.name=classId==='mage'?'마법 반경':'공격 범위';const names=classId==='mage'?['지팡이','오브·마법서']:classId==='warrior'?['검','검집']:classId==='rogue'?['단검','활']:['소환 도구','소환의 인장'];C.slots[0].name=names[0];C.slots[7].name=names[1];C.slots[2].kind=classId==='mage'?'cast':classId==='summoner'?'summonSpeed':'attackSpeed';C.slots[3].kind=classId==='mage'||classId==='summoner'?'cooldown':'attackSpeed';C.slots[7].kind=classId==='summoner'?'summonHP':classId==='warrior'?'armor':'radius';for(const slot of C.slots)slot.stat=I.defs[slot.kind].name;const select=$('inventoryFilter');select.innerHTML='<option value="-1">전체 부위</option>'+C.slots.map((a,i)=>'<option value="'+i+'">'+a.name+'</option>').join('');}
function refreshClassUI(){const box=$('classSwitch');if(!box)return;for(const b of box.children)b.classList.toggle('active',b.dataset.job===classId);document.querySelector('.combat-stats div:first-child span').textContent=classId==='mage'?'Magic Power':'성장력';document.querySelector('.combat-stats div:nth-child(2) span').textContent=classId==='mage'?'Magic ATK':'무기 공격력';document.querySelector('#magicPanel h2').firstChild.textContent=classId==='mage'?'마력 강화 ':'성장력 강화 ';}
function changeClass(id){if(id===classId||!MAGE_CLASSES.jobs[id])return false;if(protectSave||!storageOK){toast('현재 저장 상태를 확인한 뒤 전환해 주세요.');return false;}save();if(!storageOK)return false;const previous=classId,previousState=state;try{classId=id;S.selectClass(id);applyClassGear();const raw=localStorage.getItem(classKey());state=raw?validate(JSON.parse(raw)):fresh();const prefs=JSON.parse(localStorage.getItem('mage-rising-shared')||'{}');if(typeof prefs.sound==='boolean')state.sound=prefs.sound;if(typeof prefs.lowFX==='boolean')state.lowFX=prefs.lowFX;state.started=true;classClear();resetWorld();if(!raw)state.hp=stats().hp;slotSignature=null;inventoryFilter=-1;$('setOverview').dataset.signature='';showTab('magic');hideModal();save();if(!storageOK)throw Error('저장 실패');const shared=JSON.parse(localStorage.getItem('mage-rising-shared')||'{}');shared.selectedClass=id;shared.sound=state.sound;shared.lowFX=state.lowFX;localStorage.setItem('mage-rising-shared',JSON.stringify(shared));window.dispatchEvent(new CustomEvent('mage-class-change',{detail:{classId:id}}));refresh();return true;}catch(e){classId=previous;S.selectClass(previous);state=previousState;applyClassGear();resetWorld();refresh();toast('직업 전환 실패 · 원본 기록 유지');return false;}}
window.MAGE_CURRENT_CLASS=()=>classId;
const classIcons={mage:'<path d="M7 25L23 7M20 4l8 8M6 5v6M3 8h6"/>',warrior:'<path d="M6 4l22 22M26 4L4 26M4 20l8 8M20 20l8 8"/>',rogue:'<path d="M22 3L8 22l5 5L27 8ZM6 20l9 9M8 26l-4 4"/>',summoner:'<circle cx="16" cy="16" r="10"/><path d="M16 2v8M16 22v8M2 16h8M22 16h8"/>'};
const classBox=$('classSwitch');if(classBox){classBox.innerHTML=Object.entries(MAGE_CLASSES.jobs).map(([id,j])=>'<button type="button" data-job="'+id+'" aria-label="'+j.name+' 전환" title="'+j.name+'">'+'<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'+classIcons[id]+'</svg></button>').join('');classBox.onclick=e=>{const b=e.target.closest('[data-job]');if(b)changeClass(b.dataset.job);};}
applyClassGear();

resetWorld();if(state.dead)showDeath();else if(!state.started)welcome();refresh();if(loadError)setTimeout(()=>toast(loadError),800);requestAnimationFrame(frame);
// Test-only integration harness, absent unless explicitly opened with ?test=1.
if(testMode)window.__mage={drawRemasteredHero,itemName,setDetails,renderEquipment,classReady,tickRogueArrow,launchRogueArrow,skinList,changeClass,classStats,classCast,classTick,get allies(){return allies;},get classId(){return classId;},combatSnapshot,resetCombatStats,recordDamage,openCombatStats,hitSpell,runePosition,get state(){return state;},get enemies(){return enemies;},stats,recommendationScore,recommendedSet,compareItem,itemMods,dominates,equipBest,stageGoal,packSize,packInterval,hpAt,bossHPAt,baseHPAt,baseBossHPAt,hpCorrection,enemyHPLabel,slotGaugeState,refreshSlotGauges,attackAt,goldAt,validate,quote,number,character,spellStats,combinedStats,availableSP,learn,slotSkill,awardBoss,claimFullSet,cast,spawn,kill,damagePlayer,applyDamage,dropItem,awardUnique,claimUnique,uniqueItem,openUnique,salePrice,sellItem,confirmSell,sellWeak,buy,equip,revive,die,save,refresh,render,showTab,settings,resetWorld,get effects(){return effects;},get castingId(){return castingId;},get time(){return time;},get runeActive(){return runeActive;},get runeClock(){return runeClock;},get waveCount(){return waveCount;},runeWave,energyCharge,chargeNeed,updateRune,slotMenu,help,renderCharacter,renderGrimoire,resetSkills,confirmSkillReset,selectSkin,skinConfig,ensureSkin,castOrigin,drawHero,get scheduledCount(){return scheduled.length;},frame,isPaused,checkOrientation,sortedInventory,claimDrop,setCount,jumpCount,pierceLoss,coldDuration,castArea,addBurn,spreadBurn,drawReworkedEffect,openAbsorb,forgePlan,forgeOnce,enhanceLevel,enhanceMult,absorb,absorbPreview,itemLines,itemMods,gachaTick,openGacha,claimGacha,spellFrame,drawSpellSheet,ensureSpellImage,get spellImages(){return spellImages;},get skinImages(){return skinImages;},step(seconds){let n=Math.ceil(seconds/.025);for(let i=0;i<n&&!state.dead;i++)update(.025);refresh();},setState(v){state=validate(v);resetWorld();$('modal').hidden=true;refresh();},fresh};
})();
