/* Fixed eight-slot equipment. Fragments are consumed immediately; no inventory. */
'use strict';
window.MAGE_AUTO_GEAR=(()=>{
 const grades=['기본','고급','희귀','유니크'],xpValues=[1,3,10,30];
 const baseKinds=job=>['magicAtk','hp','magicPower','hpPct',job==='mage'?'cast':job==='summoner'?'summonSpeed':'attackSpeed','move','armor','armor'];
 const pools=job=>{const speed=baseKinds(job)[4],utility=job==='mage'?'cooldown':job==='summoner'?'cooldown':'leech';return [['magicPower','crit','critDamage','radius'],['hpPct','armor','regen'],[speed,'critDamage','gold'],[utility,...(job==='summoner'?['summonHP']:[]),'magicPower','gold'],['crit','critDamage','magicPower'],['hp','armor','radius'],['hpPct','regen','crit'],['magicAtk','radius',utility,...(job==='summoner'?['summonHP']:[])]];};
 const increments={magicAtk:1,magicPower:2,hp:30,hpPct:2,armor:3,regen:.3,crit:1,critDamage:5,cast:1,cooldown:1,radius:3,move:2,attackSpeed:2,summonSpeed:2,leech:.05,summonHP:5,gold:2};
 const emptyMods=()=>({});
 const blank=()=>({version:1,slots:Array.from({length:8},()=>({xp:0,seed:0,options:{},legacyBase:{},legacyOptions:{},legacyUnique:false,legacySet:null})),milestones:[],fragments:[0,0,0,0],lastReward:null,migrated:false,converted:0});
 const integer=(x,a,b)=>Number.isSafeInteger(x)&&x>=a&&x<=b;
 const finite=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0&&x<=1e270;
 function mods(v){if(!v||typeof v!=='object'||Array.isArray(v)||Object.keys(v).some(k=>!Object.hasOwn(MAGE_ITEMS.defs,k)||!finite(v[k])))throw Error('자동 장비 옵션이 올바르지 않습니다.');return {...v};}
 function validate(v,job){if(!v||v.version!==1||!Array.isArray(v.slots)||v.slots.length!==8||!Array.isArray(v.milestones)||v.milestones.length>100||new Set(v.milestones).size!==v.milestones.length||v.milestones.some(n=>!integer(n,10,1000)||n%10)||!Array.isArray(v.fragments)||v.fragments.length!==4||v.fragments.some(n=>!integer(n,0,1e12))||!integer(v.converted??0,0,1e12))throw Error('자동 장비 성장 기록이 올바르지 않습니다.');const allowed=pools(job);const slots=v.slots.map((s,i)=>{if(!s||!finite(s.xp)||s.xp>1e12||!finite(s.seed)||typeof s.legacyUnique!=='boolean'||s.legacySet!=null&&!Object.hasOwn(MAGE_ITEMS.sets,s.legacySet))throw Error('자동 장비 수치가 올바르지 않습니다.');const options=mods(s.options);if(Object.keys(options).some(k=>!allowed[i].includes(k)))throw Error('부위별 옵션이 올바르지 않습니다.');return {xp:s.xp,seed:s.seed,options,legacyBase:mods(s.legacyBase),legacyOptions:mods(s.legacyOptions),legacyUnique:s.legacyUnique,legacySet:s.legacySet??null};});return {...blank(),slots,milestones:[...v.milestones].sort((a,b)=>a-b),fragments:[...v.fragments],migrated:!!v.migrated,converted:v.converted??0};}
 function level(s){return Math.floor((Math.sqrt(1+8*s.xp/50)-1)/2);}
 const threshold=l=>25*l*(l+1);
 function progress(s){const l=level(s),start=threshold(l),end=threshold(l+1);return {level:l,done:s.xp-start,need:end-start,fraction:(s.xp-start)/(end-start)};}
 const initial=[2,48,1,2,1,3,5,2];
 function factor(slot,l){return slot===0?Math.pow(1.18,Math.min(l,3600)):slot===1?Math.pow(1.16,Math.min(l,4000)):slot===2?Math.pow(1.10,Math.min(l,6500)):1;}
 function base(slot,s){const l=level(s),seed=Math.max(initial[slot],s.seed);return Math.min(1e270,slot<=2?seed*factor(slot,l):seed+[.25,.2,.12,.4,.3][slot-3]*l);}
 function slotMods(g,job,slot){const s=g.slots[slot],o={...s.legacyBase};const k=baseKinds(job)[slot];o[k]=(o[k]||0)+base(slot,s);for(const table of [s.options,s.legacyOptions])for(const [key,value] of Object.entries(table))o[key]=(o[key]||0)+value;return o;}
 function allMods(g,job){const out={};for(let i=0;i<8;i++)for(const [k,v] of Object.entries(slotMods(g,job,i)))out[k]=(out[k]||0)+v;return out;}
 function setCounts(g){const out=Object.fromEntries(Object.keys(MAGE_ITEMS.sets).map(k=>[k,0]));for(const s of g.slots.slice(0,7))if(s.legacySet)out[s.legacySet]++;return out;}
 const trait=g=>g.milestones.filter(n=>n%100===0).length;
 function milestone(g,job,stage){if(stage%10||g.milestones.includes(stage))return false;const p=pools(job),turn=g.milestones.length;for(let i=0;i<8;i++){const k=p[i][turn%p[i].length];g.slots[i].options[k]=(g.slots[i].options[k]||0)+increments[k];}if(stage%100===0)for(const s of g.slots)for(const o of [s.options,s.legacyOptions])for(const k of Object.keys(o))o[k]=Math.min(1e270,o[k]*2);g.milestones.push(stage);g.milestones.sort((a,b)=>a-b);return true;}
 function sampleGrade(boss,rng=Math.random){const r=rng();return boss?(r<.7?1:r<.95?2:3):(r<.75?0:r<.95?1:2);}
 function grant(g,count,boss=false,bonus={},rng=Math.random,forced=null){if(!integer(count,1,100000))throw Error('조각 수량이 올바르지 않습니다.');const received=[0,0,0,0],bySlot=Array(8).fill(0),before=g.slots.map(level);let extra=0;const add=()=>{const grade=forced===null?sampleGrade(boss,rng):forced,slot=Math.min(7,Math.floor(rng()*8)),xp=xpValues[grade]*(1+(bonus.forge||0));g.slots[slot].xp=Math.min(1e12,g.slots[slot].xp+xp);g.fragments[grade]=Math.min(1e12,g.fragments[grade]+1);received[grade]++;bySlot[slot]+=xp;};for(let i=0;i<count;i++){add();if((bonus.drop||0)>0&&rng()<bonus.drop){add();extra++;}}const result={received,bySlot,extra,levels:g.slots.map((s,i)=>level(s)-before[i])};g.lastReward=result;return result;}
 function migrate(v,job,oldKinds){const g=blank();g.migrated=true;const equipped=new Set(Object.values(v.equipped||{})),worn=Array(8).fill(null);for(const item of v.inventory||[]){if(equipped.has(item.id))worn[item.slot]=item;else {const grade=item.unique?3:Math.min(2,item.rarity),xp=xpValues[grade]*(1+(item.enhanceXP||0));g.slots[item.slot].xp=Math.min(1e12,g.slots[item.slot].xp+xp);g.fragments[grade]++;g.converted++;}}
 const addUnits=(slot,grade,count)=>{g.slots[slot].xp=Math.min(1e12,g.slots[slot].xp+xpValues[grade]*count);g.fragments[grade]+=count;g.converted+=count;};
 for(let r=0;r<3;r++){const n=v.fragments?.[r]||0;for(let i=0;i<8;i++)addUnits(i,r,Math.floor(n/8)+(i<n%8?1:0));}
 for(const box of v.dropChests||[])addUnits((box.serial-1)%8,3,1);
 for(const stage of v.uniqueChests||[])addUnits(Math.floor(stage/10-1)%8,3,1);
 for(const stage of v.fullSetPending||[])for(let i=0;i<7;i++)addUnits(i,3,1);
 for(let i=0;i<8;i++){const item=worn[i];if(!item)continue;const s=g.slots[i],xp=item.enhanceXP||0,l=xp<1?0:Math.floor((1+Math.sqrt(4*xp-3))/2),mult=1+(item.unique?l*.1:0),kind=oldKinds[i],value=item.value*mult;if(kind===baseKinds(job)[i])s.seed=Math.max(initial[i],value/factor(i,level(s)));else s.legacyBase[kind]=value;for(const a of item.affixes||[])s.legacyOptions[a.kind]=(s.legacyOptions[a.kind]||0)+a.value*mult;s.legacyUnique=!!item.unique;s.legacySet=item.setId??null;}
 for(const stage of [...(v.bossCleared||[])].sort((a,b)=>a-b))milestone(g,job,stage);return g;}
 return {grades,xpValues,baseKinds,pools,increments,blank,validate,level,progress,base,allMods,slotMods,setCounts,trait,milestone,sampleGrade,grant,migrate};
})();
