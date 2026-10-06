'use strict';
window.MAGE_SKILLS=(()=>{
 const families=['energy','fire','ice','lightning','cosmic'],labels=['ENERGY','FIRE','ICE','LIGHTNING','TRANSCENDENCE'];
 const colors=['#bca9ff','#ffac80','#97eaff','#dfc0ff','#b9cfff'];
 const nodes=[];
 function active(id,name,family,rank,cd,coef,radius,fx,description){nodes.push({id,name,en:name.toUpperCase(),family,rank,max:10,cost:rank,cd,coef,radius,fx,cast:.16+rank*.08,type:'active',color:colors[families.indexOf(family)],symbol:['✧','♨','❄','ϟ','✴'][families.indexOf(family)],description});}
 function passive(id,name,family,description,cost=1){nodes.push({id,name,family,max:5,cost,type:'passive',description,color:colors[families.indexOf(family)]});}
 active('energyBolt','Energy Bolt','energy',1,1,1.3,42,0,'빠른 관통탄 · 적중 시 공유 과충전 1칸 · 관통당 피해 18% 감소');
 passive('piercing','마력 증폭','energy','레벨당 에너지 피해 +5% · 시너지/세트 피해와 합연산 · 과충전에도 1회 적용');
 active('magicArrow','Arcane Rune','energy',2,2.5,1,760,1,'떠다니는 룬 1개 · 넓은 범위에 마력탄 지속 발사 · 적중 시 과충전 1칸 · 충전 완료 시 원형 파동');
 passive('overcharge','과충전','energy','공유 4칸 충전 시 룬 파동 · 피해 룬 1회의 1+0.4×Lv배, 반경 1.3배 · 버스트는 게이지를 보존하고 강제 발동 · 룬 없으면 다음 에너지 공격 +25%×Lv');
 active('arcaneBurst','Arcane Burst','energy',3,5,12,190,10,'압축 후 굵은 관통 광선 · 적마다 단발 피해 · 활성 룬 과충전 연계 시 꺾쇠 충격파 · 장판/상태이상 없음');
 active('fireball','Fireball','fire',1,1.2,1.25,60,11,'착탄 폭발과 3초 화상');
 passive('blaze','맹화','fire','레벨당 화상 지속 +0.4초 · 화상 최대 3단계: ×1 / ×1.2 / ×2 · 재부여 시 시간 갱신');
 active('flameExplosion','Ifrit','fire',2,3,2,105,12,'이프리트 3차 공격: 회오리 1→2→3개 · 직접 피해 중복 없음 · 회오리별 화상 중첩 · 길막 없음');
 passive('spread','연소 확산','fire','화상 적 사망 시 주변에 가장 강한 화상 전염 · 레벨당 반경 +15');
 active('meteor','Meteor','fire',3,7,8.5,165,7,'운석 충돌 + 3초 불바닥');
 active('iceBolt','Ice Bolt','ice',1,1.3,1.1,40,2,'냉기탄 · 적을 잠시 둔화');
 passive('cold','혹한','ice','3회 적중 시 빙결 · 레벨당 둔화/빙결 강화');
 active('iceSpear','Frost Guardian','ice',2,3.5,4,130,2,'눈사람 정령 · 3회 눈송이 공격 · 범위 80→100→120% · 피해 비중 1:1:1.5 · 냉기 중첩/파쇄 · 길막 없음');
 passive('shatter','빙결 파쇄','ice','빙결 적에게 레벨당 25% 추가 냉기 피해 후 빙결 해제');
 active('blizzard','Blizzard','ice',3,8,3,155,3,'지속 눈보라 · 3틱 적중 시 빙결 · 파쇄 미발동');
 active('lightning','Chain Lightning','lightning',1,1.1,1.2,125,4,'최초 대상 포함 4명 · 레벨마다 연쇄 대상 +1명, 투자 Lv.10 13명 · 세트 Lv.15 18명 · 전이당 피해 10% 감소, 최초 피해의 최소 50%');
 passive('shock','감전','lightning','3초 감전 · 적중 시 레벨당 8% 확률로 짧은 마비');
 active('chainLightning','Thunder Lancer','lightning',2,2,1.2,140,4,'전기 창병 · 3초간 레벨+3회 관통 찌르기 · 매회 재조준 · 길막 없음 · 중복 소환 가능');
 passive('jump','전류 도약','lightning','레벨당 추가 전이 대상 +1 · 전이 피해 45%, 감전 적용');
 active('thunderstorm','Thunderstorm','lightning',3,5,3.45,210,5,'넓은 낙뢰 + 4초 전기장(8회) · 피해 15% 강화 · 첫 낙뢰 마비: 일반 0.4초/보스 0.12초, 제어 면역 적용');
 active('starfall','Starfall','cosmic',4,10,13,210,8,'3회 유성우 · 3회 명중 시 60% 별빛 공명');
 passive('singularity','중력 특이점','cosmic','레벨당 초월 반경 +8%, 피해 +10%, 흡입 강화',2);
 active('blackHole','Black Hole','cosmic',5,15,20,240,9,'5회 중력 피해 · 일반 적 흡입, 보스 이동 면역');
 let byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 const mageNodes=[...nodes]; const trees=families.map((id,i)=>({id,name:labels[i],color:colors[i],nodes:nodes.filter(n=>n.family===id)}));
 const blank=()=>Object.fromEntries(nodes.map(n=>[n.id,n.id===MAGE_CLASSES.jobs[window.MAGE_CLASS_ID||'mage'].first?1:0]));
 const spent=l=>nodes.reduce((s,n)=>s+(l[n.id]||0)*n.cost,0);
 const reward=s=>s%100===0?10:s%10===0?5:1;
 const earned=s=>s+4*Math.floor(s/10)+5*Math.floor(s/100);
 const mastered=l=>nodes.filter(n=>n.family!=='cosmic').every(n=>l[n.id]===n.max);
 function requirement(id){const n=byId[id];if(!n)return null;const list=trees.find(t=>t.id===n.family).nodes,pos=list.indexOf(n);return{previous:pos?list[pos-1]:null,power:n.family==='cosmic'?0:[0,10,30,50,100][pos],cosmic:n.family==='cosmic'};}
 function available(l,id,powerLevel=Infinity){const n=byId[id],r=requirement(id);if(!n)return false;return(!r.cosmic||mastered(l))&&(!r.previous||(l[r.previous.id]||0)>=(r.cosmic?r.previous.max:1))&&(r.cosmic||powerLevel>=r.power||(l[id]||0)>0);}
 function synergy(l,id){const n=byId[id];if(!n||n.family==='cosmic'||n.type!=='active')return 0;return nodes.filter(x=>x.type==='active'&&x.family===n.family&&x.id!==id).reduce((sum,x)=>sum+(l[x.id]||0)*(x.rank===2?.03:x.rank===3?.02:n.rank===2?.03:.02),0);}
 const powerTotals=[0],powerLimit=1e100;
 function powerStep(l){const n=Math.floor((Math.max(1,l)-1)/10)+1;return Math.exp(Math.min(Math.log(powerLimit),Math.log(n)+(n-1)*Math.log(1.05)));}
 function powerGain(l){const q=Math.floor(l/10),r=l%10;if(q>4700)return powerLimit;while(powerTotals.length<=q){const n=powerTotals.length;powerTotals.push(Math.min(powerLimit,powerTotals[n-1]+10*powerStep(n*10)));}return Math.min(powerLimit,powerTotals[q]+r*powerStep(q*10+1));}
 const power=l=>10+powerGain(l);
 const powerCost=l=>Math.min(1e280,Math.ceil(20*1.06**Math.min(l,11000)));
 function powerQuote(l,gold,bulk){let count=bulk==='max'?Infinity:Number(bulk),n=0,cost=0;while(n<count&&n<100000){const c=powerCost(l+n);if(cost+c>gold||!Number.isFinite(cost+c))break;cost+=c;n++;}return{n,cost};}
 const suffix=['','K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
 function format(v){if(!Number.isFinite(v))return '—';const a=Math.abs(v);if(a<1000)return v.toLocaleString('en-US',{maximumFractionDigits:a<10?2:a<100?1:0});let n=Math.floor(Math.log10(a)/3);if(n>=suffix.length)return v.toExponential(2);let x=v/1000**n;if(Math.abs(Number(x.toFixed(2)))>=1000){n++;x/=1000;}return n<suffix.length?x.toFixed(2)+suffix[n]:v.toExponential(2);}
 const resistance=s=>({family:families[Math.floor((s-1)/5)%4],value:Math.min(.4,.1+Math.floor((s-1)/20)*.05)});
 function selectClass(id){nodes.splice(0,nodes.length,...(id==='mage'?mageNodes:MAGE_CLASSES.data[id].flatMap(t=>t.nodes)));for(const k of Object.keys(byId))delete byId[k];Object.assign(byId,Object.fromEntries(nodes.map(n=>[n.id,n])));trees.splice(0,trees.length,...(id==='mage'?families.map((id,i)=>({id,name:labels[i],color:colors[i],nodes:nodes.filter(n=>n.family===id)})):MAGE_CLASSES.data[id]));window.MAGE_CLASS_ID=id;}
 const api={selectClass,nodes,byId,trees,blank,spent,reward,earned,mastered,available,requirement,synergy,powerStep,powerGain,power,powerCost,powerQuote,format,resistance}; selectClass(window.MAGE_CLASS_ID||'mage');return api;
})();
