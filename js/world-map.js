'use strict';
(()=>{
const api=window.MAGE_MAP_API;if(!api)return;
const points=[[11,76],[22,73],[34,65],[36,54],[29,44],[41,38],[53,44],[65,49],[78,39],[48,32]];
let page=0,selected=1;
const root=document.createElement('section');root.id='worldMap';root.setAttribute('aria-label','직업별 여정 지도');
root.innerHTML='<header><div><small>MAGE RISING</small><h1>달빛 숲의 여정</h1></div><div id="mapJobs"></div><button id="mapResume">전투로 돌아가기</button></header><div class="map-viewport"><div class="map-land"><div id="mapNodes"></div><div id="mapPawns"></div><div id="mapGuardian"></div></div></div><footer><button id="mapPrev">◀ 이전</button><span id="mapRange"></span><button id="mapNext">다음 ▶</button><button id="mapLocate">내 위치</button><span id="mapInfo"></span><button id="mapEnter">도전</button></footer>';
document.body.append(root);
const $=id=>document.getElementById(id);
function record(id){if(id===api.current())return api.snapshot();try{const s=JSON.parse(localStorage.getItem(MAGE_CLASSES.key(id))||'{}');return {stage:s.stage||1,runBest:s.runBest||s.best||1,cleared:s.cycleCleared||s.bossCleared||[]};}catch(e){return {stage:1,runBest:1,cleared:[]};}}
function paint(){const s=api.snapshot();$('mapJobs').innerHTML=Object.entries(MAGE_CLASSES.jobs).map(([id,j])=>'<button data-map-job="'+id+'" aria-pressed="'+(id===api.current())+'">'+j.name+'</button>').join('');
 $('mapNodes').innerHTML=points.map(([x,y],i)=>{const n=page*10+i+1,status=s.cleared.includes(n)?'clear':n<=s.runBest?'open':'locked';return '<button class="map-node '+status+(n===selected?' selected':'')+'" style="left:'+x+'%;top:'+y+'%" data-stage="'+n+'" '+(status==='locked'?'disabled':'')+' aria-label="'+n+'단계 '+({clear:'클리어',open:'도전 가능',locked:'잠김'}[status])+'"><b>'+n+'</b></button>';}).join('');
 const ids=Object.keys(MAGE_CLASSES.jobs);$('mapPawns').innerHTML=ids.map((id,k)=>{const r=record(id);if(Math.floor((r.stage-1)/10)!==page)return '<button class="map-distant" data-map-job="'+id+'">'+(r.stage<=page*10?'◀ ':'▶ ')+MAGE_CLASSES.jobs[id].name+' · '+r.stage+'</button>';const [x,y]=points[(r.stage-1)%10];const src=id==='mage'?'assets/skins/default-mage.png':'assets/class-skins/'+({warrior:'warrior-basic',rogue:'rogue-basic',summoner:'summoner-beast'}[id])+'.svg';return '<button class="map-pawn '+(id===api.current()?'chosen':'')+'" data-map-job="'+id+'" style="left:calc('+x+'% + '+((k-1.5)*22)+'px);top:'+y+'%" title="'+MAGE_CLASSES.jobs[id].name+' '+r.stage+'단계"><img src="'+src+'" alt="'+MAGE_CLASSES.jobs[id].name+'"/></button>';}).join('');
 const end=(page+1)*10,guard=end%50===0&&!s.cleared.includes(end);$('mapGuardian').innerHTML=guard?'<div class="guardian '+(end%100===0?'king':'soldier')+'"><span class="guardian-art"></span><b>'+end+' · '+(end%100===0?'해골왕':'해골전사')+'</b></div>':'';
 $('mapRange').textContent=(page*10+1)+'–'+end+' 단계';$('mapPrev').disabled=page===0;$('mapResume').disabled=!record(api.current()).stage;$('mapInfo').textContent=MAGE_CLASSES.jobs[api.current()].name+' · '+selected+'단계';$('mapEnter').disabled=selected>s.runBest;
}
function open(){api.save();window.MAGE_MAP_OPEN=true;root.hidden=false;selected=api.snapshot().stage;page=Math.floor((selected-1)/10);paint();root.querySelector('.map-node.selected')?.scrollIntoView?.({block:'nearest',inline:'center'});}
function close(){root.hidden=true;window.MAGE_MAP_OPEN=false;}
root.addEventListener('click',e=>{const job=e.target.closest('[data-map-job]');if(job){if(job.dataset.mapJob===api.current()||api.select(job.dataset.mapJob)){selected=api.snapshot().stage;page=Math.floor((selected-1)/10);paint();}return;}const n=e.target.closest('[data-stage]');if(n){selected=Number(n.dataset.stage);paint();}});
 $('mapPrev').onclick=()=>{page=Math.max(0,page-1);paint();};$('mapNext').onclick=()=>{page++;paint();};$('mapLocate').onclick=()=>{selected=api.snapshot().stage;page=Math.floor((selected-1)/10);paint();};$('mapEnter').onclick=()=>{if(api.enter(selected))close();};$('mapResume').onclick=()=>{if(api.enter(api.snapshot().stage))close();};
 const button=document.createElement('button');button.textContent='🗺 여정 지도';button.className='subtle';button.onclick=open;document.querySelector('.header-actions').prepend(button);
 const box=$('classSwitch');if(box)box.hidden=true;
 window.MAGE_WORLD_MAP={open,close,record};open();
})();
