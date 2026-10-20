'use strict';
// Four shared 4x2 sheets. Movement and combinations are independent of hit width.
window.MAGE_WARRIOR_SKILLS=(()=>{
 const sheets={};
 for(const key of ['slash','cyclone','thrust','ground']){const image=new Image();image.src='assets/warrior-skills/'+key+'.png';sheets[key]=image;}
 function sprite(ctx,key,frame,x,y,w,h,angle=0){const image=sheets[key];if(!image?.complete||!image.naturalWidth)return false;frame=Math.max(0,Math.min(7,frame));ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(image,(frame%4)*256,Math.floor(frame/4)*256,256,256,-w/2,-h/2,w,h);ctx.restore();return true;}
 function timing(id){const travel={slash:.42,cross:.48,spin:.7,thrust:.4,triple:.44,pierce:.34,slam:.52,crush:.6,quake:.68}[id]||.5;const offsets=id==='spin'?[0,.07,.14,.21]:id==='quake'?[0,.14,.28]:id==='cross'?[0,0]:id==='triple'?[0,0,0]:[0];return {travel,offsets,windup:.025,duration:.025+travel+offsets[offsets.length-1]+.18};}
 function position(f,age=f.age){const q=Math.max(0,Math.min(1,(age-f.windup)/f.travel));return f.start+(f.end-f.start)*q;}
 function draw(ctx,f,low=false){if(!f.warriorAttack)return false;const age=f.age,p=Math.max(0,Math.min(1,(age-f.windup)/f.travel)),x=position(f),y=f.y-22,frame=Math.min(7,Math.floor(p*8)),tail=f.duration-age,alpha=Math.min(1,Math.max(0,age/.045),Math.max(0,tail/.18));ctx.save();ctx.globalAlpha=alpha;
  // Sprites are preloaded and drawImage only; no per-frame filters or blur.
  if(f.skill==='slash'||f.skill==='cross'){
   const h=Math.min(190,Math.max(110,f.half*1.25));sprite(ctx,'slash',frame,x-14,y,110,h);
   if(f.skill==='cross')sprite(ctx,'slash',frame,x-14,y,110,h,Math.PI/2);
  }else if(f.skill==='spin'){
   const cycle=low?3:Math.floor(age*22)%8;const wobble=low?0:Math.sin(age*29)*4;
   sprite(ctx,'cyclone',cycle,x-92,y+wobble,270,155,low?0:Math.sin(age*19)*.025);
  }else if(f.skill==='thrust'||f.skill==='triple'){
   const offsets=f.skill==='triple'?[-15,0,15]:[0];for(const offset of offsets)sprite(ctx,'thrust',frame,x-90,y+offset,265,112);
  }else if(f.skill==='pierce'){
   const width=Math.max(1,x-f.start);sprite(ctx,'thrust',Math.max(1,Math.min(6,frame)),f.start+width/2,y,width,95);
  }else{
   const waves=f.skill==='quake'?[0,.14,.28]:[0];
   for(let i=0;i<waves.length;i++){const local=age-waves[i];if(local<f.windup||local>f.windup+f.travel+.18)continue;const q=Math.max(0,Math.min(1,(local-f.windup)/f.travel)),head=position(f,local),w=f.skill==='slam'?290:f.skill==='crush'?360:330,h=Math.min(220,Math.max(140,f.half*1.3));ctx.save();ctx.globalAlpha*=Math.min(1,(f.windup+f.travel+.18-local)/.18);sprite(ctx,'ground',Math.min(7,Math.floor(q*8)),head-w*.33,f.y-15,w,h);ctx.restore();}
  }
  ctx.restore();return true;
 }
 return {draw,timing,position,sheets};
})();
