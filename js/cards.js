/* Shared card collection v1. Art is static; names, stars and growth are live UI. */
'use strict';
window.MAGE_CARDS=(()=>{
 const key='mage-rising-shared',POINT_COST=10;
 const specs=[
 ['mage','마법사','마법사 전체 스킬 피해',.03,'damage','mage',0,0],
 ['warrior','검사','검사 전체 스킬 피해',.03,'damage','warrior',1,0],
 ['rogue','도적','도적 전체 스킬 피해',.03,'damage','rogue',2,0],
 ['summoner','소환술사','모든 소환수 피해',.03,'damage','summoner',3,0],
 ['dragon','업화룡','모든 직업 보스 피해',.03,'boss',null,0,1],
 ['frost','빙결 폭군','최대 HP · 소환수 HP',.05,'hp',null,1,1],
 ['death','죽음의 군주','받는 최종 피해 감소',.01,'reduction',null,2,1],
 ['storm','폭풍 야수','치명타 확률',.005,'crit',null,3,1],
 ['casualMage','카페의 마법사','골드 획득량',.05,'gold',null,0,2],
 ['casualWarrior','수련 후 검사','장비 합성 성공률',.005,'forge',null,1,2],
 ['casualRogue','밤거리의 도적','추가 장비 드롭 확률',.05,'drop',null,2,2],
 ['casualSummoner','늑대와 쉬는 소환술사','무료 장비 뽑기 대기 감소',.02,'gacha',null,3,2]
 ];
 const list=specs.map((a,i)=>Object.freeze({id:a[0],name:a[1],label:a[2],base:a[3],effect:a[4],job:a[5],column:a[6],row:a[7],index:i}));
 const blank=()=>({version:1,copies:Array(12).fill(0),pending:[],points:0,draws:0,claims:[]});
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 function validate(v){if(v==null)return blank();if(v.version!==1||!Array.isArray(v.copies)||v.copies.length!==12||v.copies.some(n=>!integer(n,0,32))||!Array.isArray(v.pending)||v.pending.length>1e6||v.pending.some(n=>!integer(n,0,11))||!integer(v.points,0,1e12)||!integer(v.draws,0,1e12))throw Error('카드 저장 데이터가 올바르지 않습니다.');const claims=v.claims??[];if(!Array.isArray(claims)||claims.length>4000||new Set(claims).size!==claims.length||claims.some(k=>typeof k!=='string'||!/^(mage|warrior|rogue|summoner):([1-9][0-9]{0,2}|1000)$/.test(k)))throw Error('카드 보스 기록이 올바르지 않습니다.');return{version:1,copies:[...v.copies],pending:[...v.pending],points:v.points,draws:v.draws,claims:[...claims]};}
 let data=blank(),error='';try{const s=JSON.parse(localStorage.getItem(key)||'{}');data=validate(s.cardsV1);}catch(e){error=e.message;}
 const snapshot=()=>validate(data);
 function commit(next){if(error)throw Error('카드 원본 보호 중 · 백업을 확인해 주세요.');const s=JSON.parse(localStorage.getItem(key)||'{}');s.cardsV1=validate(next);localStorage.setItem(key,JSON.stringify(s));data=s.cardsV1;return true;}
 function progress(i){const amount=data.copies[i]||0,star=amount?Math.min(5,Math.floor(Math.log2(amount))):-1,floor=star<0?0:2**star,next=star<0?1:2**(star+1);return{amount,star,owned:amount>0,max:star===5,done:amount-floor,need:next-floor,mult:star+1};}
 function apply(next,i,units=1){const old=next.copies[i],accepted=Math.min(units,32-old);next.copies[i]+=accepted;const overflow=units-accepted;next.points+=overflow;return{index:i,old,amount:next.copies[i],overflow};}
 function grant(count=1,guaranteed=null,claim=null){if(!integer(count,1,100)||guaranteed!=null&&!integer(guaranteed,0,11))throw Error('잘못된 카드 보상');const next=snapshot();if(claim!==null){if(next.claims.includes(claim))return 0;next.claims.push(claim);}if(next.pending.length+count>1e6)throw Error('미개봉 카드가 너무 많습니다. 먼저 뒤집어 주세요.');for(let i=0;i<count;i++)next.pending.push(i===0&&guaranteed!=null?guaranteed:Math.min(11,Math.floor(Math.random()*12)));commit(next);return count;}
 function reveal(all=false){if(!data.pending.length)return[];const next=snapshot(),ids=all?next.pending.splice(0):[next.pending.shift()],counts=Array(12).fill(0),results=[];for(const i of ids)counts[i]++;for(let i=0;i<12;i++)if(counts[i])results.push({...apply(next,i,counts[i]),received:counts[i]});commit(next);return results;}
 function pointDraw(){if(data.points<POINT_COST)return false;const next=snapshot();next.points-=POINT_COST;next.draws++;next.pending.push(Math.min(11,Math.floor(Math.random()*12)));commit(next);return true;}
 function bonuses(job){const out={damage:0,boss:0,hp:0,reduction:0,crit:0,gold:0,forge:0,drop:0,gacha:0};for(const n of list)if(!n.job||n.job===job)out[n.effect]+=n.base*progress(n.index).mult;return out;}
 function effectText(i,star=progress(i).star){const n=list[i],value=n.base*Math.max(0,star+1)*100;return n.label+' '+(n.effect==='gacha'?'−':'+')+Number(value.toFixed(2))+(n.effect==='crit'||n.effect==='forge'?'%p':'%');}
 function replace(v){const next=validate(v);const s=JSON.parse(localStorage.getItem(key)||'{}');s.cardsV1=next;localStorage.setItem(key,JSON.stringify(s));data=next;error='';}
 return{list,blank,validate,snapshot,progress,bonuses,effectText,grant,reveal,pointDraw,replace,POINT_COST,get error(){return error;}};
})();
