/* v0.5.3 app-feel layer. Reads the DOM only; never touches game state or saves. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const safe=fn=>{try{fn()}catch(e){}};

/* The ♪ button now also gates vibration (sound + haptics on/off together). */
function hapticsOn(){const b=$('soundBtn');return !b||b.classList.contains('on');}
function buzz(p){if(reduce||!hapticsOn())return;safe(()=>navigator.vibrate&&navigator.vibrate(p));}

function pop(el){if(!el||reduce)return;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function watch(el,fn,opts){if(!el)return;new MutationObserver(fn).observe(el,opts||{childList:true,characterData:true,subtree:true});}

/* Tabs: split "⚔ 전투" into icon + label so the bar reads like an app dock. */
safe(()=>document.querySelectorAll('.tabs button').forEach(b=>{
  const n=[...b.childNodes].find(x=>x.nodeType===3&&x.textContent.trim());if(!n)return;
  const m=n.textContent.trim().match(/^(\S+)\s+(.+)$/);if(!m)return;
  const ico=document.createElement('span');ico.className='tab-ico';ico.textContent=m[1];
  const lab=document.createElement('span');lab.className='tab-label';lab.textContent=m[2];
  b.replaceChild(ico,n);b.insertBefore(lab,ico.nextSibling);
}));

/* Tap ripple + light haptic tick. */
const RIPPLE='.primary,.subtle,.tabs button,.icon-btn,.bulk button,.skill-node button,.slot-options button,.unique-choice,.modal-card button,.active-slot';
function ripple(b,e){
  if(getComputedStyle(b).position==='static')b.style.position='relative';
  b.style.overflow='hidden';
  const r=b.getBoundingClientRect(),s=Math.max(r.width,r.height)*2.2;
  const x=(e.clientX||r.left+r.width/2)-r.left-s/2,y=(e.clientY||r.top+r.height/2)-r.top-s/2;
  const el=document.createElement('span');el.className='ripple';
  el.style.cssText='width:'+s+'px;height:'+s+'px;left:'+x+'px;top:'+y+'px';
  b.appendChild(el);setTimeout(()=>el.remove(),600);
}
document.addEventListener('pointerdown',e=>{
  const b=e.target.closest&&e.target.closest('button');
  if(!b||b.disabled)return;
  buzz(6);
  if(!reduce&&b.matches(RIPPLE))safe(()=>ripple(b,e));
},{passive:true});

/* Keep the game from feeling like a web page. */
document.addEventListener('contextmenu',e=>{if(e.target.closest&&e.target.closest('canvas,.skin-card,.gear-slot,.tabs,.active-slot'))e.preventDefault();});
document.addEventListener('gesturestart',e=>e.preventDefault());

/* Gold / stage / power feedback (throttled; first paint is ignored). */
let goldAt=0;
watch($('goldNum'),()=>{const t=performance.now();if(t-goldAt<300)return;goldAt=t;pop($('goldNum'));});
let stageSeen=$('stageNum')&&$('stageNum').textContent;
watch($('stageNum'),()=>{const v=$('stageNum').textContent;if(v===stageSeen)return;stageSeen=v;pop($('stageNum'));buzz([14,30,14]);});
let powerSeen=$('powerLevel')&&$('powerLevel').textContent;
watch($('powerLevel'),()=>{const v=$('powerLevel').textContent;if(v===powerSeen)return;const first=!powerSeen;powerSeen=v;if(first)return;pop($('powerLevel'));pop($('damageStat'));buzz(12);});

/* HP: low-health warning, hit flash. */
const hp=$('hpBar'),wrap=document.querySelector('.canvas-wrap');
let hpPrev=parseFloat(hp&&hp.style.width)||100,hurtAt=0;
watch(hp,()=>{
  const w=parseFloat(hp.style.width)||0;
  const low=w>0&&w<30;hp.classList.toggle('low',low);document.body.classList.toggle('lowhp',low);
  const t=performance.now();
  if(w<hpPrev-.5&&wrap&&!reduce&&t-hurtAt>260){hurtAt=t;wrap.classList.add('hurt');setTimeout(()=>wrap.classList.remove('hurt'),130);}
  hpPrev=w;
},{attributes:true,attributeFilter:['style']});

/* Free gacha ready state. */
const gb=$('gachaBtn');let gachaWas=false;
function gachaCheck(){
  const ready=/준비 완료/.test(gb.textContent);
  if(gb.parentElement)gb.parentElement.classList.toggle('ready',ready);
  if(ready&&!gachaWas)buzz([10,30,10]);
  gachaWas=ready;
}
if(gb){watch(gb,gachaCheck);gachaCheck();}

/* PWA: offline cache + install button (only on http/https, so START.html/Acode is untouched). */
if(/^https?:$/.test(location.protocol)){
  if('serviceWorker' in navigator)addEventListener('load',()=>safe(()=>navigator.serviceWorker.register('sw.js').catch(()=>{})));
  let deferred=null;
  addEventListener('beforeinstallprompt',e=>{
    e.preventDefault();deferred=e;
    const foot=document.querySelector('footer');if(!foot||$('installBtn'))return;
    const btn=document.createElement('button');btn.id='installBtn';btn.textContent='📲 앱 설치';
    btn.onclick=()=>{if(!deferred)return;deferred.prompt();deferred=null;btn.remove();};
    foot.insertBefore(btn,$('helpBtn'));
  });
}

/* Remove splash from the DOM once its CSS fade has finished. */
setTimeout(()=>{const s=$('splash');if(s)s.remove();},1900);
})();
