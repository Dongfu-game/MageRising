'use strict';
window.MAGE_CYCLE=(()=>{
 const groups=[['energyBolt','magicArrow','arcaneBurst'],['seaWave','seaTornado','seaTsunami'],['blizzard','meteor','thunderstorm']];
 const initial=()=>({next:0,star:0,black:0});
 function normalize(x){if(!x||!Number.isInteger(x.next)||x.next<0||x.next>8||!Number.isInteger(x.star)||x.star<0||x.star>10||!Number.isInteger(x.black)||x.black<0||x.black>5)return initial();return {next:x.next,star:x.star,black:x.black};}
 function choose(state){const c=state.mageCycle,l=state.skillLevels;if(c.black>=5&&l.blackHole>0)return {id:'blackHole',slot:-1,index:-1};if(c.star>=10&&l.starfall>0)return {id:'starfall',slot:-1,index:-1};for(let i=0;i<9;i++){const idx=(c.next+i)%9,id=groups[Math.floor(idx/3)][idx%3];if(l[id]>0)return {id,slot:Math.floor(idx/3),index:idx};}return null;}
 function finish(state,sel){const c=state.mageCycle,l=state.skillLevels;if(sel.id==='blackHole'){c.black=0;return;}if(sel.id==='starfall'){c.star=0;if(l.blackHole>0)c.black=Math.min(5,c.black+1);return;}c.next=(sel.index+1)%9;if(l.starfall>0)c.star=Math.min(10,c.star+1);}
 return {groups,initial,normalize,choose,finish};
})();
