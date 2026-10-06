'use strict';
window.MAGE_ITEMS=(()=>{
 const C=MAGE_CONFIG;
 const defs={attackSpeed:{name:'공격속도',unit:'%'},summonSpeed:{name:'소환수 공격속도',unit:'%'},leech:{name:'적중 HP 흡수',unit:'%'},summonHP:{name:'소환수 HP',unit:'%'},magicAtk:{name:'마법공격력',unit:''},magicPower:{name:'마력',unit:''},hp:{name:'최대 HP',unit:''},armor:{name:'방어력',unit:''},crit:{name:'치명타 확률',unit:'%'},critDamage:{name:'치명타 피해',unit:'%'},cast:{name:'시전시간 감소',unit:'%'},cooldown:{name:'쿨타임 감소',unit:'%'},radius:{name:'마법 반경',unit:'%'},move:{name:'이동속도',unit:'%'},regen:{name:'초당 HP 재생',unit:''},hpPct:{name:'최대 HP',unit:'%'},gold:{name:'처치 골드',unit:'%'}};
 const pools=[['crit','critDamage','radius'],['armor','regen','hpPct'],['magicPower','crit','radius'],['hp','armor','gold'],['magicPower','critDamage','cast'],['hp','armor','regen'],['hp','magicPower','regen'],['hp','armor','radius']];for(const pool of pools)pool.push('attackSpeed','summonSpeed','leech','summonHP');
 const round=v=>Math.round(v*100)/100;
 function randomFrom(seed){let h=2166136261;for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
 function mainValue(slot,stage,mult,rarity,unique){switch(slot){case 7:return round((window.MAGE_CLASS_ID==='summoner'?5+stage*.15:window.MAGE_CLASS_ID==='warrior'?8+stage*.2:2+stage*.1)*mult);case 0:{let log=0;for(let n=1;n<stage;n++)log+=Math.log(1.1+.004*(n-1));return round(2*Math.exp(Math.min(600,log*.35))*mult);}case 1:return round(48*1.1**(stage-1)*mult);case 2:case 3:return round(Math.min(35,(1+stage*.17)*mult));case 4:return round(Math.min(20,(3+.08*(stage-1))*mult));case 5:return round(Math.min(40,(3+.12*(stage-1))*mult));case 6:return round(5+.1*(stage-1)+(unique?5:rarity));}}
 function affixValue(kind,stage,mult){const h=1.1**(stage-1),m=1.055**(stage-1);return round(({attackSpeed:2+.03*stage,summonSpeed:2+.03*stage,leech:.05,summonHP:2+.02*stage,hp:8*h,magicPower:.7*m,armor:2+.04*stage,regen:.08*h,hpPct:2+.025*stage,crit:1+.015*stage,critDamage:5+.05*stage,cast:.5+.01*stage,radius:1+.02*stage,gold:1+.02*stage})[kind]*mult);}
 function affixes(slot,stage,rarity,unique,seed){const rng=randomFrom(seed),pool=pools[slot].filter(k=>window.MAGE_CLASS_ID==='mage'?!['attackSpeed','summonSpeed','leech','summonHP'].includes(k):window.MAGE_CLASS_ID==='summoner'?!['cast','attackSpeed','leech'].includes(k):!['cast','cooldown','summonSpeed','summonHP'].includes(k)),out=[];const count=unique?2:rarity;while(out.length<count){const idx=Math.floor(rng()*pool.length),kind=pool.splice(idx,1)[0];out.push({kind,value:affixValue(kind,stage,unique?1.8:C.rarities[rarity].mult)});}return out;}
 function create(stage,slot,rarity,unique,id){const mult=unique?3.2:C.rarities[rarity].mult;return{id,slot,rarity:unique?3:rarity,stage,value:mainValue(slot,stage,mult,rarity,unique),sell:Math.round(10*1.2**(stage-1))*8,unique:!!unique,affixes:affixes(slot,stage,rarity,unique,id)};}
 function migrate(i){const unique=i.unique===true,oldR=i.rarity,r=unique?3:Math.min(2,oldR),legacyMult=unique?3.2:[1,1.3,1.7,2.2,3][oldR];const out=create(i.stage,i.slot,unique?2:r,unique,i.id);out.sell=i.sell;
 // Keep existing mana/time stats; transfer former HP budget to the cloak.
 if([0,2,3].includes(i.slot))out.value=i.value;
 else if(i.slot===1)out.value=round(i.value*4);
 else out.value=mainValue(i.slot,i.stage,legacyMult,r,unique);
 return out;}
 const sets={
 energy:{name:'아폴론의 광휘',en:'Radiance of Apollon',effects:['에너지 피해 +10%','마법 범위 +10%','에너지 액티브 +1레벨','과충전 필요 충전 횟수 −1 (4 → 3, 과충전 필요)','에너지 액티브 추가 +1레벨 (총 +2)','에너지 액티브 추가 +3레벨 (총 +5)']},
 fire:{name:'하데스의 업화',en:'Hellfire of Hades',effects:['화염 피해 +10%','화상 지속 +1초 (맹화 필요)','화염 액티브 +1레벨','화상 피해 +25% (맹화 필요)','화염 액티브 추가 +1레벨 (총 +2)','화염 액티브 추가 +3레벨 (총 +5)']},
 ice:{name:'포세이돈의 동토',en:'Tundra of Poseidon',effects:['냉기 피해 +10%','둔화·빙결 지속 +15% (혹한 필요)','냉기 액티브 +1레벨','빙결 파쇄 피해 +25% (파쇄 필요)','냉기 액티브 추가 +1레벨 (총 +2)','냉기 액티브 추가 +3레벨 (총 +5)']},
 lightning:{name:'제우스의 격노',en:'Wrath of Zeus',effects:['번개 피해 +10%','시전시간 감소 +5%p','번개 액티브 +1레벨','전류 도약 추가 대상 +1 (도약 패시브 필요)','번개 액티브 추가 +1레벨 (총 +2)','번개 액티브 추가 +3레벨 (총 +5)']},
 cosmic:{name:'크로노스의 종말',en:'Doom of Chronos',effects:['초월 피해 +10%','쿨타임 감소 +5%p (상한 50%)','초월 액티브 +1레벨','초월 마법 범위 +20%','초월 액티브 추가 +1레벨 (총 +2)','초월 액티브 추가 +3레벨 (총 +5)']}
 };

 const classSetNames={
 warrior:{energy:['스사노오의 참격','Slash of Susanoo'],fire:['타케미카즈치의 뇌검','Thunderblade of Takemikazuchi'],ice:['오오쿠니누시의 진각','Earthshaking Step of Okuninushi'],lightning:['하치만의 수호','Protection of Hachiman'],cosmic:['아마테라스의 광명','Radiance of Amaterasu']},
 rogue:{energy:['검은 송곳니','Black Fang'],fire:['월영의 추적자','Moonshadow Stalker'],ice:['맹독의 입맞춤','Venomous Kiss'],lightning:['그림자의 장막','Veil of Shadows'],cosmic:['황혼의 처형자','Twilight Executioner']},
 summoner:{energy:['야수왕의 포효','Roar of the Beast King'],fire:['정령왕의 공명','Resonance of the Spirit King'],ice:['망자의 군주','Lord of the Dead'],lightning:['태고의 거신','Primordial Colossus'],cosmic:['용황의 강림','Advent of the Dragon Emperor']}
 };
 function setDefinition(id,job='mage'){const base=sets[id];if(!base)return null;const names=classSetNames[job]?.[id];return names?{...base,name:names[0],en:names[1]}:base;}

 function rollSet(item,rng=Math.random){if(item.slot!==7&&item.unique&&rng()<.3)item.setId=Object.keys(sets)[Math.min(4,Math.floor(rng()*5))];return item;}
 function setCounts(v,eq=v.equipped){const counts=Object.fromEntries(Object.keys(sets).map(k=>[k,0]));for(const slot of C.slots.slice(0,7)){const i=v.inventory.find(i=>i.id===eq[slot.id]&&C.slots[i.slot].id===slot.id);if(i?.unique&&sets[i.setId])counts[i.setId]++;}return counts;}
 const setLevels=count=>count>=7?5:count>=6?2:count>=4?1:0;
 return{defs,pools,mainValue,affixes,create,migrate,sets,classSetNames,setDefinition,rollSet,setCounts,setLevels};
})();
