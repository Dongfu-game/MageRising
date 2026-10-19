'use strict';
(()=>{
const api=window.MAGE_MAP_API;if(!api)return;
// Follow the painted road from the lower-left entrance to the upper-right gate.
const points=[[11,76],[24,74],[38,63],[28,45],[43,36],[51,41],[65,49],[82,38],[73,23],[85,26]];
let page=0,selected=1;
const root=document.createElement('section');root.id='worldMap';root.setAttribute('aria-label','직업별 여정 지도');
root.innerHTML='<header><div><small>MAGE RISING</small><h1>달빛 숲의 여정</h1></div><div id="mapJobs"></div><button id="mapResume">전투로 돌아가기</button></header><div class="map-viewport"><div class="map-land"><div id="mapNodes"></div><div id="mapPawns"></div><div id="mapGuardian"></div></div></div><footer><button id="mapPrev">◀ 이전</button><span id="mapRange"></span><button id="mapNext">다음 ▶</button><button id="mapLocate">내 위치</button><span id="mapInfo"></span><button id="mapEnter">도전</button></footer>';
document.body.append(root);
const $=id=>document.getElementById(id);
function record(id){if(id===api.current())return api.snapshot();try{const s=JSON.parse(localStorage.getItem(MAGE_CLASSES.key(id))||'{}');return {stage:s.stage||1,runBest:s.runBest||s.best||1,cleared:s.cycleCleared||s.bossCleared||[]};}catch(e){return {stage:1,runBest:1,cleared:[]};}}
function paint(){const s=api.snapshot(),first=page*10+1,end=first+9;
// Never retain a challenge target from a different page.
if(selected<first||selected>end)selected=null;
$('mapJobs').innerHTML=Object.entries(MAGE_CLASSES.jobs).map(([id,j])=>'<button data-map-job="'+id+'" aria-pressed="'+(id===api.current())+'">'+j.name+'</button>').join('');
$('mapNodes').innerHTML=points.map(([x,y],i)=>{const n=first+i,status=s.cleared.includes(n)?'clear':n<=s.runBest?'open':'locked';return '<button class="map-node '+status+(n===selected?' selected':'')+'" style="left:'+x+'%;top:'+y+'%" data-stage="'+n+'" '+(status==='locked'?'disabled':'')+' aria-label="'+n+'단계 '+({clear:'클리어',open:'도전 가능',locked:'잠김'}[status])+'"><b>'+n+'</b></button>';}).join('');
const ids=Object.keys(MAGE_CLASSES.jobs),records=Object.fromEntries(ids.map(id=>[id,record(id)]));
$('mapPawns').innerHTML=ids.map(id=>{const r=records[id];if(Math.floor((r.stage-1)/10)!==page)return '<button class="map-distant '+(r.stage<first?'before':'after')+'" data-map-job="'+id+'">'+(r.stage<first?'◀ ':'▶ ')+MAGE_CLASSES.jobs[id].name+' · '+r.stage+'</button>';
const [x,y]=points[(r.stage-1)%10],group=ids.filter(k=>records[k].stage===r.stage),offset=(group.indexOf(id)-(group.length-1)/2)*2.3;
return '<button class="map-pawn '+(id===api.current()?'chosen':'')+'" data-map-job="'+id+'" style="left:'+(x+offset)+'%;top:'+(y-1)+'%" title="'+MAGE_CLASSES.jobs[id].name+' '+r.stage+'단계"><img src="assets/map/'+id+'-default.png" alt="'+MAGE_CLASSES.jobs[id].name+' 기본 캐릭터"/></button>';}).join('');
const guard=end%50===0&&!s.cleared.includes(end),king=end%100===0;
$('mapGuardian').innerHTML=guard?'<div class="guardian '+(king?'king':'soldier')+'"><img src="assets/map/skeleton-'+(king?'king':'warrior')+'-v2.png" alt="'+(king?'해골왕':'해골전사')+' 관문 수호자"/><b>'+end+' · '+(king?'해골왕':'해골전사')+'</b></div>':'';
$('mapRange').textContent=first+'–'+end+' 단계';$('mapPrev').disabled=page===0;
$('mapInfo').textContent=MAGE_CLASSES.jobs[api.current()].name+' · '+(selected===null?'발판을 선택하세요':selected+'단계');$('mapEnter').disabled=selected===null||selected>s.runBest;
}
function locate(){selected=api.snapshot().stage;page=Math.floor((selected-1)/10);paint();root.querySelector('.map-node.selected')?.scrollIntoView?.({block:'nearest',inline:'center'});}
function open(){api.save();window.MAGE_MAP_OPEN=true;root.hidden=false;locate();}
function close(){root.hidden=true;window.MAGE_MAP_OPEN=false;}
function turn(delta){page=Math.max(0,page+delta);const s=api.snapshot(),first=page*10+1;selected=first<=s.runBest?Math.min(first+9,s.runBest):null;paint();}
root.addEventListener('click',e=>{const job=e.target.closest('[data-map-job]');if(job){if(job.dataset.mapJob===api.current()||api.select(job.dataset.mapJob))locate();return;}const n=e.target.closest('[data-stage]');if(n&&!n.disabled){selected=Number(n.dataset.stage);paint();}});
$('mapPrev').onclick=()=>turn(-1);$('mapNext').onclick=()=>turn(1);$('mapLocate').onclick=locate;$('mapEnter').onclick=()=>{if(selected!==null&&api.enter(selected))close();};$('mapResume').onclick=()=>{if(api.enter(api.snapshot().stage))close();};
const button=document.createElement('button');button.textContent='🗺 여정 지도';button.className='subtle';button.onclick=open;document.querySelector('.header-actions').prepend(button);
const box=$('classSwitch');if(box)box.hidden=true;
window.MAGE_WORLD_MAP={open,close,record};open();
})();
