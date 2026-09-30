/* v0.5.4 닉네임 + 랭킹. 게임 상태는 읽기만 하고(저장 데이터에서), 절대 수정하지 않습니다.
   랭킹 기준: 최고 스테이지 → 같으면 마력 레벨. */
(function(root){
'use strict';
const NICK_RE=/^[가-힣A-Za-z0-9_ ]{2,12}$/;
const SAVE_KEY='mage-rising-v01',NICK_KEY='mage-rising-nick';
const SDK='https://www.gstatic.com/firebasejs/10.14.1/';
const MAX_STAGE=1000,MAX_POWER=99999,TOP_N=50;

const pure={
  cleanNick(s){return String(s==null?'':s).normalize('NFC').replace(/\s+/g,' ').trim();},
  validNick(s){return NICK_RE.test(s);},
  clamp(v,lo,hi){v=Math.floor(Number(v));if(!Number.isFinite(v))v=lo;return Math.max(lo,Math.min(hi,v));},
  score(best,power){return best*100000+Math.min(power,MAX_POWER);},
  merge(remote,local){
    if(!remote||!Number.isFinite(remote.best))return {best:local.best,power:local.power};
    if(local.best>remote.best)return {best:local.best,power:local.power};
    if(local.best===remote.best)return {best:remote.best,power:Math.max(remote.power|0,local.power)};
    return {best:remote.best,power:remote.power|0};
  }
};
if(typeof module!=='undefined'&&module.exports)module.exports=pure;
if(typeof document==='undefined')return;

const $=id=>document.getElementById(id);
const cfg=root.MAGE_FIREBASE||{};
const configured=!!(cfg.apiKey&&cfg.projectId);
let loading=null,lastSent=null,view=0;

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function getNick(){try{return localStorage.getItem(NICK_KEY)||'';}catch(e){return '';}}
function setNick(n){try{localStorage.setItem(NICK_KEY,n);}catch(e){}}
function readLocal(){
  let s={};try{s=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')||{};}catch(e){}
  return {best:pure.clamp(s.best||1,1,MAX_STAGE),power:pure.clamp(s.powerLevel||0,0,MAX_POWER)};
}
function toastMsg(t){const el=$('toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(toastMsg.t);toastMsg.t=setTimeout(()=>el.classList.remove('show'),3000);}
function blocked(){const b=$('battleState');return !!b&&b.textContent.trim()==='부활 대기';}
function sheet(html){$('modalContent').innerHTML=html;$('modal').hidden=false;$('modalClose').hidden=false;}
function refreshDot(){const b=$('rankBtn');if(b)b.classList.toggle('dot',!getNick());}

/* ---------- Firebase (SDK는 랭킹을 처음 쓸 때만 내려받음) ---------- */
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('load '+src));document.head.appendChild(s);});}
function init(){
  if(!configured)return Promise.reject(new Error('not-configured'));
  if(loading)return loading;
  loading=(async()=>{
    if(!root.firebase){
      await loadScript(SDK+'firebase-app-compat.js');
      await Promise.all([loadScript(SDK+'firebase-auth-compat.js'),loadScript(SDK+'firebase-firestore-compat.js')]);
    }
    const fb=root.firebase;
    if(!fb.apps.length)fb.initializeApp(cfg);
    const auth=fb.auth();
    let user=await new Promise(r=>{const off=auth.onAuthStateChanged(u=>{off();r(u);});});
    if(!user)user=(await auth.signInAnonymously()).user;
    return {fb,db:fb.firestore(),uid:user.uid};
  })();
  loading.catch(()=>{loading=null;});
  return loading;
}

/* mode: 'force' 즉시 | 'flush' 변경분이 있으면 즉시 | 없음: 쓰기 횟수 절약용 대기 적용 */
async function sync(mode){
  const nick=getNick();if(!configured||!nick)return false;
  const local=readLocal(),now=Date.now();
  if(mode!=='force'){
    if(lastSent&&lastSent.best===local.best&&lastSent.power===local.power&&lastSent.nick===nick)return false;
    if(mode!=='flush'&&lastSent){const wait=local.best>lastSent.best?20000:300000;if(now-lastSent.t<wait)return false;}
  }
  const {fb,db,uid}=await init();
  const ref=db.collection('ranks').doc(uid),snap=await ref.get();
  const m=pure.merge(snap.exists?snap.data():null,local);
  await ref.set({nick,best:m.best,power:m.power,score:pure.score(m.best,m.power),updatedAt:fb.firestore.FieldValue.serverTimestamp()});
  lastSent={best:local.best,power:local.power,nick,t:now};
  return true;
}
async function fetchTop(){
  const {db,uid}=await init();
  const s=await db.collection('ranks').orderBy('score','desc').limit(TOP_N).get();
  return {uid,rows:s.docs.map(d=>Object.assign({id:d.id},d.data()))};
}

/* ---------- 화면 ---------- */
function showNick(){
  const cur=getNick();
  sheet('<div class="eyebrow">PROFILE</div><h2 id="modalTitle">닉네임 설정</h2><p class="lead">랭킹에 표시될 이름이에요.<br>한글·영문·숫자·밑줄(_) 2~12자</p><input id="rkInput" class="rk-input" maxlength="12" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="닉네임" value="'+esc(cur)+'"><p class="rk-err" id="rkErr"></p><button class="primary" id="rkSave">저장</button>'+(cur?'<button class="subtle" id="rkBack">취소</button>':''));
  const input=$('rkInput');
  const save=async()=>{
    const n=pure.cleanNick(input.value);
    if(!pure.validNick(n)){$('rkErr').textContent='한글·영문·숫자·_ 만 쓸 수 있고 2~12자여야 해요.';return;}
    setNick(n);refreshDot();
    $('rkSave').disabled=true;
    showRank(true);
  };
  $('rkSave').onclick=save;
  input.onkeydown=e=>{if(e.key==='Enter')save();};
  if($('rkBack'))$('rkBack').onclick=()=>showRank();
  setTimeout(()=>input.focus(),60);
}

function head(nick){return '<div class="eyebrow">HALL OF FAME</div><h2 id="modalTitle">🏆 랭킹</h2><div class="rk-me"><div><span>내 닉네임</span><b>'+esc(nick)+'</b></div><button class="subtle" id="rkNick">변경</button></div>';}
function bind(){if($('rkNick'))$('rkNick').onclick=showNick;if($('rkRetry'))$('rkRetry').onclick=()=>showRank();}

async function showRank(force){
  if(blocked()){toastMsg('부활한 뒤에 열 수 있어요.');return;}
  const nick=getNick();
  if(!nick){showNick();return;}
  const my=++view;
  if(!configured){
    sheet(head(nick)+'<p class="rk-state">랭킹 서버를 준비 중이에요.<br>닉네임은 이 기기에 저장됐어요.</p>');bind();
    try{console.warn('[랭킹] js/firebase-config.js 에 Firebase 설정값을 입력하세요.');}catch(e){}
    return;
  }
  sheet(head(nick)+'<p class="rk-state">랭킹 불러오는 중…</p>');bind();
  try{
    await sync(force?'force':'flush');
    const {uid,rows}=await fetchTop();
    if(my!==view||$('modal').hidden)return;
    const local=readLocal();
    const list=rows.length?rows.map((r,i)=>{
      const medal=['🥇','🥈','🥉'][i]||(i+1);
      return '<div class="rk-row'+(r.id===uid?' me':'')+'"><div class="rk-pos">'+medal+'</div><div class="rk-nick">'+esc(r.nick||'???')+'</div><div class="rk-score"><b>STAGE '+esc(r.best)+'</b><br>Lv.'+esc(r.power)+'</div></div>';
    }).join(''):'<p class="rk-state">아직 등록된 기록이 없어요.<br>첫 번째 랭커가 되어 보세요!</p>';
    const mine=rows.findIndex(r=>r.id===uid);
    const foot=mine>=0?'<p class="hint left">내 순위 <b>'+(mine+1)+'위</b> · 상위 '+TOP_N+'명까지 표시돼요.</p>':'<p class="hint left">내 기록 STAGE '+local.best+' · Lv.'+local.power+' (상위 '+TOP_N+'명 밖)</p>';
    sheet(head(nick)+'<div class="rk-list">'+list+'</div>'+foot+'<button class="subtle" id="rkRetry">새로고침</button>');bind();
  }catch(e){
    if(my!==view||$('modal').hidden)return;
    try{console.warn('[랭킹]',e);}catch(_){}
    sheet(head(nick)+'<p class="rk-state">랭킹을 불러오지 못했어요.<br>인터넷 연결을 확인해 주세요.</p><button class="subtle" id="rkRetry">다시 시도</button>');bind();
  }
}

/* ---------- 연결 ---------- */
refreshDot();
if($('rankBtn'))$('rankBtn').onclick=()=>showRank();
if($('modalClose'))$('modalClose').addEventListener('click',()=>{view++;});

/* 기록 자동 전송: 30초마다 확인 (변경 없으면 아무것도 안 함), 앱을 닫을 때 한 번 더 */
if(configured){
  setInterval(()=>{sync().catch(()=>{});},30000);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)sync('flush').catch(()=>{});});
}

/* 닉네임이 없으면 3스테이지 도달 시 한 번만 안내 */
let nudged=false;try{nudged=!!localStorage.getItem('mage-rising-nudge');}catch(e){}
const st=$('stageNum');
if(st&&!nudged)new MutationObserver(()=>{
  if(nudged||getNick()||(parseInt(st.textContent,10)||0)<3)return;
  nudged=true;try{localStorage.setItem('mage-rising-nudge','1');}catch(e){}
  toastMsg('🏆 랭킹에 도전해 보세요! 우측 상단에서 닉네임을 정할 수 있어요.');
}).observe(st,{childList:true,characterData:true,subtree:true});

root.MageRank={sync,showRank,configured};
})(typeof window!=='undefined'?window:globalThis);
