/* Card grades v2: legacy SSS identities retained; unopened new packs roll on reveal. */
'use strict';
window.MAGE_CARDS=(()=>{
 const key='mage-rising-shared',POINT_COST=10,DROP_RATE=.002;
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
 ['casualWarrior','수련 후 검사','조각 경험치 증가',.005,'forge',null,1,2],
 ['casualRogue','밤거리의 도적','추가 조각 드롭 확률',.05,'drop',null,2,2],
 ['casualSummoner','늑대와 쉬는 소환술사','무료 조각 뽑기 대기 감소',.02,'gacha',null,3,2]
 ];
 const legacy=specs.map((a,i)=>Object.freeze({id:a[0],name:a[1],label:a[2],base:a[3],effect:a[4],job:a[5],column:a[6],row:a[7],index:i,grade:'SSS',line:'sss'+Math.floor(i/4)}));

 const grades=Object.freeze([{id:'D',chance:.395},{id:'C',chance:.28},{id:'B',chance:.17},{id:'A',chance:.09},{id:'S',chance:.04},{id:'SS',chance:.015},{id:'SSR',chance:.005},{id:'SSS',chance:.005}]);
 const rows=[
 ['D',['초보 마법사','수련 검사','초보 도적','꼬마 소환술사'],['power','armor','gold','hp'],[.005,.005,.005,.005]],
 ['C',['송곳니 슬라임','밤의 박쥐','해골 병사','돌 골렘'],['hp','speed','crit','armor'],[.005,.003,.001,.005]],
 ['B',['여마법사','여검객','여도적','여소환술사'],['weapon','hp','critDamage','summonHP'],[.005,.005,.01,.01]],
 ['A',['해골 전쟁군주','오크 족장','얼음 수호자','악마 야수'],['damage','armor','boss','critDamage'],[.003,.005,.005,.01]],
 ['S',['대마법사','백발 검성','그림자 암살자','야수 군주'],['power','damage','crit','weapon'],[.0075,.005,.0015,.0075]],
 ['SS',['마녀의 밤','신사의 무녀','가면 괴도','야수 조련사'],['gold','forge','drop','gacha'],[.01,.01,.002,.005]]
 ];
 const flatEffects=new Set(['power','weapon','damage','boss','normal']);
 const labels={power:'성장력',armor:'방어력',gold:'골드 획득량',hp:'최대 HP · 소환수 HP',speed:'직업별 공격속도',crit:'치명타 확률',weapon:'무기 공격력',critDamage:'치명타 피해',summonHP:'소환수 HP (타 직업 최대 HP)',damage:'카드 공격력',boss:'보스 전용 공격력',forge:'조각 경험치',drop:'추가 조각 확률',gacha:'무료 뽑기 대기 감소'};
 const extra=rows.flatMap((r,y)=>r[1].map((name,x)=>Object.freeze({id:r[0].toLowerCase()+x,name,label:labels[r[2][x]],effect:r[2][x],base:r[3][x],job:null,index:12+y*4+x,grade:r[0],line:r[0],art:'assets/cards/grades/'+r[0].toLowerCase()+'-'+x+'.webp'})));
 const newNames=['엠버','프로스트','움브라','루미나','실바','스톰'];
 const newCards=Array.from({length:12},(_,j)=>{const x=j%6,summer=j>=6,effects=summer?['gold','hp','gacha','forge','drop','critDamage']:['damage','hp','critDamage','armor','power','speed'];return Object.freeze({id:'ssr'+j,name:(summer?'휴양의 ':'원소의 ')+newNames[x],label:labels[effects[x]],effect:effects[x],base:(summer?[.005,.005,.002,.005,.002,.005]:[.01,.01,.005,.01,.01,.002])[x],job:null,index:36+j,grade:'SSR',line:summer?'ssrSummer':'ssrElement',sheet:summer?1:0,column:x%3,row:Math.floor(x/3)});});
 const list=Object.freeze([...legacy,...extra,...newCards]);
 const promotionNames=['일반','실버','골드','다이아','플래티넘'],promotionThresholds=[32,64,128,256,512];
 const lines=Object.freeze([
 {id:'D',name:'D · 여정의 시작',indices:[12,13,14,15],effects:{power:.01}},
 {id:'C',name:'C · 흉폭한 무리',indices:[16,17,18,19],effects:{normal:.01}},
 {id:'B',name:'B · 모험의 동료',indices:[20,21,22,23],effects:{hp:.01}},
 {id:'A',name:'A · 보스 사냥',indices:[24,25,26,27],effects:{boss:.015}},
 {id:'S',name:'S · 영웅의 전성기',indices:[28,29,30,31],effects:{damage:.01}},
 {id:'SS',name:'SS · 축제의 의상',indices:[32,33,34,35],effects:{forge:.02}},
 {id:'sss0',name:'SSS · 직업 대표',indices:[0,1,2,3],effects:{damage:.02}},
 {id:'sss1',name:'SSS · 대보스',indices:[4,5,6,7],effects:{boss:.03}},
 {id:'ssrElement',name:'SSR · 원소의 여섯 영웅',indices:[36,37,38,39,40,41],effects:{damage:.01}},
 {id:'ssrSummer',name:'SSR · 해변의 휴식',indices:[42,43,44,45,46,47],effects:{gold:.01,forge:.01}},
 {id:'sss2',name:'SSS · 일상복',indices:[8,9,10,11],effects:{gold:.02,forge:.02}}
 ]);
 const blank=()=>({version:3,copies:Array(48).fill(0),pending:[],points:0,draws:0,claims:[]});
 const integer=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 function validate(v){if(v==null)return blank();const old=v.version===1;if(![1,2,3].includes(v.version)||!Array.isArray(v.copies)||v.copies.length!==(old?12:v.version===2?36:48)||v.copies.some(n=>!integer(n,0,v.version===3?512:32))||!Array.isArray(v.pending)||v.pending.length>1e6||v.pending.some(n=>!integer(n,old?0:-1,old?11:v.version===2?35:47))||!integer(v.points,0,1e12)||!integer(v.draws,0,1e12))throw Error('카드 저장 데이터가 올바르지 않습니다.');const claims=v.claims??[];if(!Array.isArray(claims)||claims.length>4000||new Set(claims).size!==claims.length||claims.some(k=>typeof k!=='string'||!/^(mage|warrior|rogue|summoner):([1-9][0-9]{0,2}|1000)$/.test(k)))throw Error('카드 보스 기록이 올바르지 않습니다.');return{version:3,copies:[...v.copies,...Array(48-v.copies.length).fill(0)],pending:[...v.pending],points:v.points,draws:v.draws,claims:[...claims]};}
 let data=blank(),error='';try{const raw=localStorage.getItem(key)||'{}',s=JSON.parse(raw);data=validate(s.cardsV1);if(s.cardsV1&&s.cardsV1.version<3&&!localStorage.getItem(key+'-pre-v0918-backup'))localStorage.setItem(key+'-pre-v0918-backup',raw);if(s.cardsV1?.version===1){if(!localStorage.getItem(key+'-pre-v092-backup'))localStorage.setItem(key+'-pre-v092-backup',raw);s.cardsV1=data;localStorage.setItem(key,JSON.stringify(s));}}catch(e){error=e.message;}
 const bonusCache=new Map();
 const snapshot=()=>validate(data);
 function commit(next){if(error)throw Error('카드 원본 보호 중 · 백업을 확인해 주세요.');const s=JSON.parse(localStorage.getItem(key)||'{}');s.cardsV1=validate(next);localStorage.setItem(key,JSON.stringify(s));data=s.cardsV1;bonusCache.clear();return true;}
 function progress(i){const amount=data.copies[i]||0,star=amount?Math.min(5,Math.floor(Math.log2(amount))):-1;let rank=0;for(let r=1;r<promotionThresholds.length;r++)if(amount>=promotionThresholds[r])rank=r;
 const floor=star<0?0:star<5?2**star:promotionThresholds[rank],next=star<0?1:star<5?2**(star+1):promotionThresholds[rank+1]||512;
 return{amount,star,rank,promotion:promotionNames[rank],owned:amount>0,max:amount>=512,done:amount-floor,need:next-floor,mult:(star+1)*(1+.1*rank)};}

 function lineProgress(id){const l=lines.find(n=>n.id===id);if(!l)return null;const stars=l.indices.map(i=>progress(i).star),star=Math.min(...stars);return{...l,star,owned:stars.filter(s=>s>=0).length,active:star>=0,mult:star+1};}
 function apply(next,i,units=1){const old=next.copies[i],accepted=Math.min(units,512-old);next.copies[i]+=accepted;const overflow=units-accepted;next.points+=overflow;return{index:i,old,amount:next.copies[i],overflow};}
 const allComplete=(v=data)=>v.copies.every(n=>n>=512);
 function roll(rng=Math.random,v=data,preferredGrade=null){const ceiling=v.copies.some(n=>n<32)?32:512,available=list.filter(n=>v.copies[n.index]<ceiling);if(!available.length)return -1;const preferred=preferredGrade?available.filter(n=>n.grade===preferredGrade):[];let pool=preferred;if(!pool.length){const remaining=grades.filter(g=>available.some(n=>n.grade===g.id)),total=remaining.reduce((sum,g)=>sum+g.chance,0),r=rng()*total;let sum=0,grade=remaining.at(-1).id;for(const g of remaining){sum+=g.chance;if(r<sum){grade=g.id;break;}}pool=available.filter(n=>n.grade===grade);}return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))].index;}
 function grant(count=1,guaranteed=null,claim=null){if(!integer(count,1,100)||guaranteed!=null&&!integer(guaranteed,0,47))throw Error('잘못된 카드 보상');const next=snapshot();if(claim!==null){if(next.claims.includes(claim))return 0;next.claims.push(claim);}if(next.pending.length+count>1e6)throw Error('미개봉 카드가 너무 많습니다. 먼저 뒤집어 주세요.');for(let i=0;i<count;i++)next.pending.push(i===0&&guaranteed!=null?guaranteed:-1);commit(next);return count;}
 function reveal(all=false){if(!data.pending.length)return[];const next=snapshot(),ids=all?next.pending.splice(0):[next.pending.shift()],grouped=new Map();let points=0;for(const pending of ids){const index=pending>=0&&next.copies[pending]<(next.copies.some(n=>n<32)?32:512)?pending:roll(Math.random,next,pending>=0?list[pending].grade:null);if(index<0){next.points++;points++;continue;}const result=apply(next,index),row=grouped.get(index);if(row){row.received++;row.amount=result.amount;}else grouped.set(index,{...result,received:1});}const results=[...grouped.values()];if(points)results.push({index:null,received:points,overflow:points,pointsOnly:true});commit(next);return results;}
 function pointDraw(){if(allComplete()||data.points<POINT_COST)return false;const next=snapshot();if(next.pending.length>=1e6)throw Error('먼저 미개봉 카드를 뒤집어 주세요.');next.points-=POINT_COST;next.draws++;next.pending.push(-1);commit(next);return true;}
 function bonuses(job){if(bonusCache.has(job))return {...bonusCache.get(job)};const out={damage:0,boss:0,hp:0,reduction:0,crit:0,gold:0,forge:0,drop:0,gacha:0,power:0,weapon:0,armor:0,speed:0,critDamage:0,summonHP:0,normal:0};for(const n of list)if(!n.job||n.job===job){if(n.effect==='summonHP'&&job!=='summoner')out.hp+=.005*progress(n.index).mult;else out[n.effect]+=n.base*progress(n.index).mult;}for(const l of lines){const p=lineProgress(l.id);if(p.active)for(const [k,v] of Object.entries(l.effects))out[k]+=v*p.mult;}out.reduction=Math.min(.5,out.reduction);out.crit=Math.min(.6,out.crit);out.gacha=Math.min(.5,out.gacha);out.drop=Math.min(1,out.drop);for(const key of flatEffects)out[key]*=100;bonusCache.set(job,out);return {...out};}
 function effectText(i,star=progress(i).star,job=null){const n=list[i],fallback=n.effect==='summonHP'&&job&&job!=='summoner',value=(fallback?.005:n.base)*Math.max(0,star+1)*(1+.1*progress(i).rank)*100;return(fallback?'최대 HP':flatEffects.has(n.effect)?labels[n.effect]:n.label)+' '+(n.effect==='gacha'?'−':'+')+Number(value.toFixed(2))+(flatEffects.has(n.effect)?'':['crit','critDamage','drop'].includes(n.effect)?'%p':'%');}
 function lineText(id){const p=lineProgress(id);return Object.entries(p.effects).map(([k,v])=>(labels[k]||'일반 적 전용 공격력')+' +'+Number((v*Math.max(0,p.mult)*100).toFixed(2))+(flatEffects.has(k)?'':'%')).join(' · ');}
 function replace(v){const next=validate(v),s=JSON.parse(localStorage.getItem(key)||'{}');s.cardsV1=next;localStorage.setItem(key,JSON.stringify(s));data=next;bonusCache.clear();error='';}
 return{promotionNames,promotionThresholds,allComplete,list,lines,grades,DROP_RATE,blank,validate,snapshot,progress,lineProgress,lineText,roll,bonuses,effectText,grant,reveal,pointDraw,replace,POINT_COST,get error(){return error;}};
})();



