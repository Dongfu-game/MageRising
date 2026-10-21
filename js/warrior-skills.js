'use strict';
// Four shared 4x2 sheets. Movement and combinations are independent of hit width.
window.MAGE_WARRIOR_SKILLS=(()=>{
 const sheets={};
 for(const key of ['slash','cyclone','thrust','ground','katana','cyclone-grow']){const image=new Image();image.src='assets/warrior-skills/'+key+'.png';sheets[key]=image;}
 function sprite(ctx,key,frame,x,y,w,h,angle=0){const image=sheets[key];if(!image?.complete||!image.naturalWidth)return false;frame=Math.max(0,Math.min(7,frame));ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.drawImage(image,(frame%4)*256,Math.floor(frame/4)*256,256,256,-w/2,-h/2,w,h);ctx.restore();return true;}
 function timing(id){if(id==='spin')return {travel:.6,grow:.6,activeDuration:2,period:.2,windup:.025,offsets:[],duration:2.025};const travel={slash:.42,cross:.48,spin:.7,thrust:.4,triple:.44,pierce:.34,slam:.52,crush:.6,quake:.68}[id]||.5;const offsets=id==='spin'?[0,.07,.14,.21]:id==='quake'?[0,.14,.28]:id==='cross'?[0,0]:id==='triple'?[0,0,0]:[0];return {travel,offsets,windup:.025,duration:.025+travel+offsets[offsets.length-1]+.18};}
 function position(f,age=f.age){const q=Math.max(0,Math.min(1,(age-f.windup)/f.travel));return f.start+(f.end-f.start)*q;}
 const swirlFrames=[{sx:0,sy:0,sh:341,left:50,right:266,cy:216.5,ch:117},{sx:768,sy:0,sh:341,left:50,right:372,cy:216,ch:118},{sx:0,sy:341,sh:342,left:50,right:436,cy:205.5,ch:125},{sx:768,sy:341,sh:342,left:50,right:531,cy:205.5,ch:131},{sx:0,sy:683,sh:341,left:50,right:679,cy:182.5,ch:131},{sx:768,sy:683,sh:341,left:49,right:742,cy:184.5,ch:143}];
 function spinGeometry(f,age=f.age){const t=Math.max(0,age-(f.windup||0)),growth=Math.min(1,t/(f.grow||.6)),length=180+570*growth;return {left:f.start,right:Math.min(f.end,f.start+length),length,frame:Math.min(5,Math.floor(growth*6)),y:f.originY??258};}
 function drawSpin(ctx,f,low){const image=sheets['cyclone-grow'];if(!image.complete||!image.naturalWidth)return;const g=spinGeometry(f),fr=swirlFrames[g.frame],scaleX=g.length/(fr.right-fr.left),scaleY=58/fr.ch;
  ctx.save();ctx.translate(g.left,g.y+(low?0:Math.sin(f.age*22)*1.2));ctx.scale(-scaleX,scaleY*(low?1:1+Math.sin(f.age*26)*.025));ctx.drawImage(image,fr.sx,fr.sy,768,fr.sh,-fr.right,-fr.cy,768,fr.sh);ctx.restore();
 }
 function behind(f){return !!f.warriorAttack&&f.skill==='pierce';}
 function katanaGeometry(f){const p=Math.max(0,Math.min(1,(f.age-f.windup)/f.travel));return {x:-150+650*p,y:(f.originY??258)-35.5,width:850,height:71};}
 function draw(ctx,f,low=false){if(!f.warriorAttack)return false;const age=f.age,p=Math.max(0,Math.min(1,(age-f.windup)/f.travel)),x=position(f),y=f.y-22,frame=Math.min(7,Math.floor(p*8)),tail=f.duration-age,alpha=Math.min(1,Math.max(0,age/.045),Math.max(0,tail/.18));ctx.save();ctx.globalAlpha=alpha;
  // Sprites are preloaded and drawImage only; no per-frame filters or blur.
  if(f.skill==='slash'||f.skill==='cross'){
   const h=Math.min(190,Math.max(110,f.half*1.25));sprite(ctx,'slash',frame,x-14,y,110,h);
   if(f.skill==='cross')sprite(ctx,'slash',frame,x-14,y,110,h,Math.PI/2);
  }else if(f.skill==='spin'){
   drawSpin(ctx,f,low);
  }else if(f.skill==='thrust'||f.skill==='triple'){
   const offsets=f.skill==='triple'?[-15,0,15]:[0];for(const offset of offsets)sprite(ctx,'thrust',frame,x-90,y+offset,265,112);
  }else if(f.skill==='pierce'){
   const image=sheets.katana,g=katanaGeometry(f);if(image.complete&&image.naturalWidth)ctx.drawImage(image,40,280,2096,175,g.x,g.y,g.width,g.height);
  }else{
   const waves=f.skill==='quake'?[0,.14,.28]:[0];
   for(let i=0;i<waves.length;i++){const local=age-waves[i];if(local<f.windup||local>f.windup+f.travel+.18)continue;const q=Math.max(0,Math.min(1,(local-f.windup)/f.travel)),head=position(f,local),w=f.skill==='slam'?290:f.skill==='crush'?360:330,h=Math.min(220,Math.max(140,f.half*1.3));ctx.save();ctx.globalAlpha*=Math.min(1,(f.windup+f.travel+.18-local)/.18);sprite(ctx,'ground',Math.min(7,Math.floor(q*8)),head-w*.33,f.y-15,w,h);ctx.restore();}
  }
  ctx.restore();return true;
 }
 return {draw,timing,position,sheets,behind,katanaGeometry,spinGeometry,swirlFrames};
})();
