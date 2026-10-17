'use strict';
window.MAGE_WARRIOR_FX={draw(ctx,f,low){if(f.job!=='warrior'||!['energy','ice','lightning'].includes(f.family))return false;const p=Math.min(1,f.age/f.duration),start=250,end=f.originX+f.reach,y=f.y,travel=start+(end-start)*Math.min(1,p*3);ctx.save();ctx.globalAlpha=Math.max(0,1-p);ctx.shadowColor=f.color;ctx.shadowBlur=low?0:14;
const stroke=(pts,color,width)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.beginPath();pts.forEach((v,i)=>i?ctx.lineTo(...v):ctx.moveTo(...v));ctx.stroke();};
const crescent=(angle)=>{ctx.save();ctx.translate(travel,y);ctx.rotate(angle);ctx.fillStyle=f.color;ctx.beginPath();ctx.moveTo(-24,-65);ctx.bezierCurveTo(55,-35,55,35,-24,65);ctx.bezierCurveTo(14,25,14,-25,-24,-65);ctx.fill();ctx.strokeStyle='#fff7e5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-24,-65);ctx.bezierCurveTo(55,-35,55,35,-24,65);ctx.stroke();ctx.restore();};
if(f.family==='energy'){if(f.skill==='spin'){for(let i=0;i<(low?4:8);i++){const x=start+(travel-start)*i/7;ctx.strokeStyle=i%2?'#fff4d1':f.color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(x,y,18+4*i,20+6*i,p*12+i*.6,0,Math.PI*2);ctx.stroke();}}else{crescent(f.skill==='cross'?-.65:0);if(f.skill==='cross')crescent(.65);}}
else if(f.family==='ice'){
 const ground=y+35,range=Math.max(1,end-start),wave=Math.min(1,p*1.55),heavy=f.skill==='crush';
 ctx.shadowBlur=0;
 if(p<.42){ctx.save();ctx.globalAlpha*=1-p/.42;ctx.translate(start,ground);ctx.strokeStyle='#dca66a';ctx.lineWidth=heavy?24:17;ctx.beginPath();ctx.moveTo(-45,-145);ctx.bezierCurveTo(55,-150,65,-45,0,0);ctx.stroke();ctx.strokeStyle='#fff2cc';ctx.lineWidth=heavy?9:6;ctx.stroke();ctx.restore();}
 const count=Math.ceil(range/(low?64:38));
 for(let i=0;i<count;i++){const q=i/Math.max(1,count-1),age=p-q*.46;if(age<0||age>.45)continue;const x=start+q*range,a=Math.sin(Math.min(1,age/.45)*Math.PI),w=range/count+5;ctx.save();ctx.globalAlpha*=Math.max(0,1-age/.45);
 if(heavy){
  // A dark pit opens, and detached plates sink downward into it.
  ctx.fillStyle='#10141d';ctx.beginPath();ctx.ellipse(x,ground,w*.75,8+a*8,0,0,Math.PI*2);ctx.fill();
  const sink=age*46;ctx.fillStyle=i%2?'#62584c':'#786951';ctx.strokeStyle='#c3a77c';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x-w*.5,ground-3+sink);ctx.lineTo(x-w*.2,ground-8+sink);ctx.lineTo(x+w*.5,ground-1+sink);ctx.lineTo(x+w*.3,ground+6+sink);ctx.lineTo(x-w*.3,ground+5+sink);ctx.closePath();ctx.fill();ctx.stroke();
  stroke([[x-w*.65,ground-3],[x-w*.2,ground-9],[x+w*.15,ground-4],[x+w*.6,ground-5]],'#d9b47d',2);
 }else{
  ctx.fillStyle='#a78c67';ctx.beginPath();ctx.moveTo(x-w*.45,ground);ctx.lineTo(x-w*.2,ground-a*27);ctx.lineTo(x+w*.1,ground-a*36);ctx.lineTo(x+w*.4,ground);ctx.closePath();ctx.fill();stroke([[x-w*.45,ground],[x-w*.2,ground-a*27],[x+w*.1,ground-a*36]],'#ffe4ab',2);
 }
 if(!low)for(let k=0;k<3;k++){ctx.fillStyle=heavy?'#c1ab8560':'#f4cc8b66';ctx.beginPath();ctx.ellipse(x+(k-1)*10+age*(k-1)*18,ground-8-age*(heavy?65:90),5+a*8,3+a*5,0,0,Math.PI*2);ctx.fill();}
 ctx.restore();
 }
 if(wave<1)stroke([[start+range*wave-15,ground],[start+range*wave,ground-9],[start+range*wave+7,ground]],'#ffe8bb',heavy?4:3);
}
else{crescent(0);}ctx.restore();return true;}};

