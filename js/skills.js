'use strict';
window.MAGE_SKILLS=(()=>{
 const families=['energy','fire','ice','lightning','cosmic'],labels=['EARTH','FIRE','ICE','LIGHTNING','TRANSCENDENCE'];
 const colors=['#c6a77e','#ffac80','#97eaff','#dfc0ff','#b9cfff'];
 const nodes=[];
 function active(id,name,family,rank,cd,coef,radius,fx,description){nodes.push({id,name,en:name.toUpperCase(),family,rank,max:10,cost:rank,cd,coef,radius,fx,cast:.16+rank*.08,type:'active',color:colors[families.indexOf(family)],symbol:['⛰','♨','❄','ϟ','✴'][families.indexOf(family)],description});}
 function passive(id,name,family,description,cost=1){nodes.push({id,name,family,max:5,cost,type:'passive',description,color:colors[families.indexOf(family)]});}
 active('energyBolt','Rock Shot','energy',1,1,1.6,38,0,'좁은 착탄 범위의 바위 공격 · 지각 충격 확률 기절');
 passive('piercing','대지의 힘','energy','레벨당 대지 피해 +5% · 시너지/세트와 합연산');
 active('magicArrow','Earth Spike','energy',2,2.5,4,120,1,'지면 가시 반복 피해 · 지속 2초+0.15초/Lv · 범위 +3%/Lv · 확률 기절');
 passive('overcharge','지각 충격','energy','록 샷/가시 적중 시 레벨당 8% 기절 확률 · 기절 0.45초+0.1초/Lv · 지진 첫 충격 확정 · 보스 지속 25%');
 active('arcaneBurst','Earthquake','energy',3,5,8,210,10,'첫 충격 확정 기절 + 3초 지진 · 화면 흔들림 · 보스 짧은 기절');
 active('fireball','Fireball','fire',1,1.2,1.25,60,11,'착탄 폭발과 3초 화상');
 passive('blaze','맹화','fire','레벨당 화상 지속 +0.4초 · 화상 최대 3단계: ×1 / ×1.2 / ×2 · 재부여 시 시간 갱신');
 active('flameExplosion','Fire Wall','fire',2,3,4,105,12,'불길을 세워 지속 피해 · 2초+0.1초/Lv · 0.5초마다 화상 중첩');
 passive('spread','연소 확산','fire','화상 적 사망 시 주변에 가장 강한 화상 전염 · 레벨당 반경 +15');
 active('meteor','Meteor','fire',3,7,8.5,165,7,'운석 충돌 + 3초 불바닥');
 active('iceBolt','Ice Bolt','ice',1,1.3,1.1,40,2,'냉기탄 · 적을 잠시 둔화');
 passive('cold','혹한','ice','3회 적중 시 빙결 · 레벨당 둔화/빙결 강화');
 active('iceSpear','Frost Nova','ice',2,3.5,4,150,2,'적 중심 얼음 파동 · 광역 피해와 냉기 중첩 · 둔화');
 passive('shatter','빙결 파쇄','ice','빙결 적에게 레벨당 25% 추가 냉기 피해 후 빙결 해제');
 active('blizzard','Blizzard','ice',3,8,3,155,3,'지속 눈보라 · 3틱 적중 시 빙결 · 파쇄 미발동');
 active('lightning','Chain Lightning','lightning',1,.3,1.2,125,4,'시전0.12초/쿨타임0.3초 · 물량50%+5%p/Lv(최대100%) 타격 · 0.025초마다 전이 · 총 기본 피해 분할 · 일반 적 전이마다 +3% 합연산 · 보스 증폭 없음 · 한 적에도 반복 타격');
 passive('shock','감전','lightning','3초 감전 · 적중 시 레벨당 8% 확률로 짧은 마비');
 active('chainLightning','Plasma Field','lightning',2,2,2,160,4,'3초 플라즈마 장판 · 0.5초마다 지속 피해 · 활성 중 번개 피해 +15%+1%p/Lv · 자신도 강화 · 강화 중첩 없음');
 passive('jump','전류 도약','lightning','레벨당 추가 전이 대상 +1 · 전이 피해 45%, 감전 적용');
 active('thunderstorm','Thunderstorm','lightning',3,5,3.45,210,5,'넓은 낙뢰 + 4초 전기장(8회) · 피해 15% 강화 · 첫 낙뢰 마비: 일반 0.4초/보스 0.12초, 제어 면역 적용');
 active('starfall','Starfall','cosmic',4,10,13,210,8,'3회 유성우 · 3회 명중 시 60% 별빛 공명');
 passive('singularity','중력 특이점','cosmic','레벨당 초월 반경 +8%, 피해 +10%, 흡입 강화',2);
 active('blackHole','Black Hole','cosmic',5,15,20,240,9,'5회 중력 피해 · 일반 적 흡입, 보스 이동 면역');
 let byId=Object.fromEntries(nodes.map(n=>[n.id,n]));
 nodes.find(n=>n.id==='lightning').cast=.12;
 for(const n of nodes)if(['energyBolt','magicArrow','arcaneBurst','flameExplosion','iceSpear','chainLightning'].includes(n.id))n.directRework=true;
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
 const resistanceLabels={mage:['대지','화염','냉기','번개'],warrior:['베기','찌르기','내려찍기','방어 공격'],rogue:['단검술','궁술','독','기습'],summoner:['야수','정령','언데드','골렘']};
 const resistance=(s,job=window.MAGE_CLASS_ID||'mage')=>{const index=Math.floor((s-1)/5)%4;return {family:families[index],value:Math.min(.4,.1+Math.floor((s-1)/20)*.05),label:(resistanceLabels[job]||resistanceLabels.mage)[index]};};
 function selectClass(id){nodes.splice(0,nodes.length,...(id==='mage'?mageNodes:MAGE_CLASSES.data[id].flatMap(t=>t.nodes)));for(const k of Object.keys(byId))delete byId[k];Object.assign(byId,Object.fromEntries(nodes.map(n=>[n.id,n])));trees.splice(0,trees.length,...(id==='mage'?families.map((id,i)=>({id,name:labels[i],color:colors[i],nodes:nodes.filter(n=>n.family===id)})):MAGE_CLASSES.data[id]));window.MAGE_CLASS_ID=id;}
 const api={mageNodes,selectClass,nodes,byId,trees,blank,spent,reward,earned,mastered,available,requirement,synergy,powerStep,powerGain,power,powerCost,powerQuote,format,resistance}; selectClass(window.MAGE_CLASS_ID||'mage');return api;
})();
