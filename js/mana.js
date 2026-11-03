'use strict';
window.MAGE_MANA=(()=>{
 const level=(s,k)=>Math.max(0,Number(s.skillLevels?.[k])||0);
 const max=s=>100+20*level(s,'manaCapacity');
 const fresh=s=>({current:max(s),charging:false,burst:0});
 function normalize(s,data){const m=max(s);if(!data||!Number.isFinite(data.current)||data.current<0||typeof data.charging!=='boolean'||!Number.isFinite(data.burst)||data.burst<0)return fresh(s);return {current:Math.min(m,data.current),charging:data.charging,burst:Math.min(5,data.burst)};}
 function tick(s,dt){const m=max(s),a=s.mana;a.current=Math.min(m,Math.max(0,a.current));a.burst=Math.max(0,a.burst-dt);if(!a.charging)return false;a.current=Math.min(m,a.current+m*(.1+.01*level(s,'manaRegen'))*dt);if(a.current>=m-1e-7){a.current=m;a.charging=false;a.burst=5;}return true;}
 const cost=n=>!n||n.family==='cosmic'?0:Math.max(0,Number(n.rank)||0)*10;
 function canCast(s,n){const a=s.mana,c=cost(n);if(a.charging)return false;if(a.current+1e-8<c){a.charging=true;return false;}return true;}
 function consume(s,n,random=Math.random){const a=s.mana,c=cost(n);if(c===0)return;a.current=Math.max(0,a.current-c);const l=level(s,'manaSave');if(l>0&&random()<.1+.05*l)a.current=Math.min(max(s),a.current+c*.5);if(a.current<=1e-8){a.current=0;a.charging=true;}}
 const damageFactor=s=>s.mana?.burst>0?1+.1*level(s,'manaBurst'):1;
 return {max,fresh,normalize,tick,cost,canCast,consume,damageFactor};
})();
