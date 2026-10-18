/* One moving row of banquet tables in a gently scrolling night-time restaurant. */
(()=>{
'use strict';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const TOP=343,FLOOR=470,WIDTH=174,PITCH=192,ANCHOR=-18;
const row=Array.from({length:74},(_,index)=>({index,worldX:index*PITCH}));
const room=new Image();room.src='assets/restaurant-night-loop-v1.png';
const tableArt=new Image();tableArt.src='assets/banquet-table-service-v2.png';
const messyArt=new Image();messyArt.src='assets/banquet-table-mess-v2.png';
const tableBase=new Image();tableBase.src='assets/banquet-table-service-v1.png';
const messyTables=new Set(),messStarted=new Map();
// The approved service stays undistorted above the cloth. Only the cloth/legs
// stretch vertically to match the established tabletop and floor contacts.
const ART={width:1374,height:1145,center:686,support:392,lip:470,foot:1001,bounds:1278};
let camera=0,backgroundX=0,focus=370,viewLeft=0,viewRight=900,previousStep=0,previousActive=false,previousCaught=false,lastActiveStep=0,lastActiveProfile=null,outcomeProfile=null,lastFrame=null;
function transferProfile(progress,scale=1,reduced=false){
 // Review v5 uses an elapsed-ms profile, independent of the production game clock.
 const t=clamp(progress,0,2680),left=ANCHOR-32.12*scale,right=ANCHOR+30.36*scale,mix=(a,b,u)=>a+(b-a)*u;
 let l=left,r=right,root=ANCHOR,liftL=0,liftR=0,drop=0,phase='balance',leftTable=0,rightTable=0;
 if(t<1400){}
 else if(t<2100){const p=(t-1400)/700,u=ease(p);r=mix(right,80,u);root=mix(ANCHOR,16,u);drop=4*u;liftR=reduced?0:20*ease(Math.min(1,p/.7));phase='slow-lead';rightTable=null;}
 else if(t<2160){const p=(t-2100)/60;r=80;root=16;drop=4+.35*Math.sin(Math.PI*p);liftR=reduced?0:20+.35*Math.sin(Math.PI*2*p);phase='hover';rightTable=null;}
 else if(t<2300){const u=ease((t-2160)/140);r=mix(80,PITCH-38,u);root=mix(16,50,u);drop=mix(4,8,u);liftR=reduced?0:20*(1-u);phase='plant';rightTable=null;}
 else if(t<2400){const u=ease((t-2300)/100);l=mix(left,38,u);r=PITCH-38;root=mix(50,105,u);drop=mix(8,10,u);phase='weight';rightTable=1;}
 else if(t<2580){const p=(t-2400)/180,u=ease(p);l=mix(38,PITCH+left,u);r=mix(PITCH-38,PITCH+right,u);root=mix(105,PITCH+ANCHOR,u);drop=mix(10,1,u);liftL=reduced?0:8*Math.sin(Math.PI*p);phase='trail';leftTable=null;rightTable=1;}
 else{l=PITCH+left;r=PITCH+right;root=PITCH+ANCHOR;drop=1-ease((t-2580)/100);phase='settle';leftTable=1;rightTable=1;}
 return{progress:t/2680,left:l,right:r,root,liftL,liftR,bodyDrop:drop,phase,leftTable,rightTable};
}

function cashoutProfile(captured,neutral,age,reduced=false){
 const t=reduced?220:clamp(Number(age)||0,0,220),u=ease(t/220),mix=(a,b,v)=>a+(b-a)*v;
 if(t<=0)return{...captured};if(t>=220)return{...neutral,phase:'win-ready'};
 const first=captured.leftTable!==0&&captured.rightTable!==0,leftU=first?ease(t/110):u,rightU=first?ease((t-110)/110):u;
 const foot=(side,v)=>{
  const lift=side==='left'?'liftL':'liftR',key=side+'Table',from=captured[side],to=neutral[side],moving=captured[key]!==0||captured[lift]>0;
  if(v<=0)return{x:from,lift:captured[lift],table:captured[key]};
  if(v>=1)return{x:to,lift:0,table:0};
  return{x:mix(from,to,v),lift:captured[lift]*(1-v)+(moving?Math.sin(Math.PI*v)*(side==='left'?23:26):0),table:moving?null:0};
 };
 const l=foot('left',leftU),r=foot('right',rightU);let root=mix(captured.root,neutral.root,u);
 if(first){
  // Land the returning foot near the gap first. It can then roll inward while
  // its partner returns, instead of stretching both legs across two full tables.
  const edge=62,bridgeRoot=(edge+captured.right)/2;
  if(t<=110){l.x=mix(captured.left,edge,leftU);l.lift=leftU>=1?0:captured.liftL*(1-leftU)+23*Math.sin(Math.PI*leftU);l.table=leftU>=1?0:null;root=mix(captured.root,bridgeRoot,leftU);}
  else{l.x=mix(edge,neutral.left,rightU);l.lift=0;l.table=0;root=mix(bridgeRoot,neutral.root,rightU);}
 }
 return{progress:captured.progress,left:l.x,right:r.x,root,liftL:l.lift,liftR:r.lift,bodyDrop:mix(captured.bodyDrop,neutral.bodyDrop,u),phase:'win-settle',leftTable:l.table,rightTable:r.table};
}

function polygon(c,p,fill,stroke='#65432a',line=1.3){c.beginPath();p.forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
function geometry(index){return{x:focus+(index-camera)*PITCH-ANCHOR,y:TOP,w:WIDTH,h:FLOOR-TOP,top:TOP,floor:FLOOR,step:index};}
function backdrop(c,o){
 c.save();c.fillStyle='#d6b88d';c.fillRect(viewLeft-10,0,viewRight-viewLeft+20,600);
 // Keep each mirrored room tile's identity while it moves. Wrapping the offset
 // by one tile width flips mirror parity at the first negative movement.
 if(room.complete&&room.naturalWidth){const w=600*room.naturalWidth/room.naturalHeight,offset=backgroundX,start=Math.floor((viewLeft-offset)/w)-1,end=Math.ceil((viewRight-offset)/w)+1;for(let i=start;i<=end;i++){const x=i*w+offset;c.save();if((i%2+2)%2){c.translate(x+w,0);c.scale(-1,1);}else c.translate(x,0);c.drawImage(room,0,0,room.naturalWidth,room.naturalHeight,0,0,w,600);c.restore();}}
 else{c.fillStyle='#e3c9a2';c.fillRect(viewLeft,0,viewRight-viewLeft,425);c.fillStyle='#9c7449';c.fillRect(viewLeft,425,viewRight-viewLeft,175);}
 c.restore();
}
function ellipse(c,x,y,rx,ry,fill,stroke,line=1){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke();}}
function leg(c,x,y,flip=1,alpha=1){c.save();c.globalAlpha*=alpha;c.translate(x,y);c.scale(flip,1);const wood=c.createLinearGradient(-8,0,8,0);wood.addColorStop(0,'#704326');wood.addColorStop(.5,'#ac713a');wood.addColorStop(1,'#5b351f');c.beginPath();c.moveTo(-5,0);c.bezierCurveTo(-13,12,-13,23,-7,31);c.bezierCurveTo(-5,36,4,37,7,33);c.bezierCurveTo(9,29,1,29,3,25);c.bezierCurveTo(11,12,10,8,6,0);c.closePath();c.fillStyle=wood;c.fill();c.strokeStyle='#53321f';c.lineWidth=1.4;c.stroke();c.strokeStyle='#c48f4b';c.lineWidth=.8;c.beginPath();c.moveTo(-4,4);c.bezierCurveTo(-8,13,-7,20,-4,25);c.stroke();c.restore();}
function clothPath(c){c.beginPath();c.moveTo(-87,0);c.bezierCurveTo(-89,23,-93,61,-94,81);c.bezierCurveTo(-89,92,-74,95,-61,91);c.bezierCurveTo(-48,102,-29,98,-17,94);c.bezierCurveTo(0,102,18,99,30,95);c.bezierCurveTo(47,101,62,96,66,92);c.bezierCurveTo(80,97,91,92,94,82);c.bezierCurveTo(92,57,89,23,87,0);c.closePath();}
function cloth(c,entry,u,o){
 clothPath(c);const fabric=c.createLinearGradient(0,0,0,100);fabric.addColorStop(0,'#fff8e3');fabric.addColorStop(.55,'#f5e6c5');fabric.addColorStop(1,'#e4d1a9');c.fillStyle=fabric;c.fill();c.strokeStyle='#b4935a';c.lineWidth=1.5;c.stroke();
 c.save();clothPath(c);c.clip();
 for(const x of[-78,-55,-31,30,55,78]){c.fillStyle='#a8824820';polygon(c,[[x-5,3],[x+2,3],[x+8,88],[x-9,91]],c.fillStyle,null);c.strokeStyle='#fffdf1a0';c.lineWidth=1.1;c.beginPath();c.moveTo(x+2,7);c.quadraticCurveTo(x+5,51,x+6,86);c.stroke();}
 c.restore();c.strokeStyle='#c3a268';c.lineWidth=3;c.beginPath();c.moveTo(-91,79);c.bezierCurveTo(-69,95,-45,89,-20,91);c.bezierCurveTo(4,98,25,91,44,92);c.bezierCurveTo(67,95,82,90,91,80);c.stroke();
 c.strokeStyle='#e0bf7a';c.lineWidth=.8;c.beginPath();c.moveTo(-91,75);c.bezierCurveTo(-61,91,-36,84,-17,87);c.bezierCurveTo(10,94,43,84,66,88);c.lineTo(90,76);c.stroke();
 if(u<.7){c.save();c.globalAlpha*=1-clamp(u/.65);c.textAlign='center';c.textBaseline='middle';c.fillStyle='#073c38';const q=(Number((o.quotes||[])[entry.index])||100)/100,label=q.toFixed(2)+'×';c.font='400 '+(label.length>7?30:40)+'px "Subtle Curves",Arial,sans-serif';c.fillText(label,0,55,145);c.restore();}
}
function glass(c,x,y){c.strokeStyle='#b58d4c';c.lineWidth=.8;c.fillStyle='#fff7d75e';c.beginPath();c.moveTo(x-4,y-12);c.quadraticCurveTo(x-6,y,x,y+1);c.quadraticCurveTo(x+6,y,x+4,y-12);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(x,y+1);c.lineTo(x,y+10);c.moveTo(x-4,y+10);c.lineTo(x+4,y+10);c.stroke();}
function vase(c,x,y){c.fillStyle='#fff4d5';c.strokeStyle='#a68954';c.lineWidth=1;c.beginPath();c.moveTo(x-3,y-14);c.bezierCurveTo(x-3,y-8,x-8,y-6,x-7,y);c.quadraticCurveTo(x,y+5,x+7,y);c.bezierCurveTo(x+8,y-6,x+3,y-8,x+3,y-14);c.closePath();c.fill();c.stroke();for(let i=0;i<4;i++){const a=-1.6+i*.6,fx=x+Math.cos(a)*9,fy=y-22+Math.sin(a)*5;c.strokeStyle='#69743d';c.beginPath();c.moveTo(x,y-14);c.lineTo(fx,fy);c.stroke();ellipse(c,fx,fy,3,2.4,i%2?'#fff5d5':'#e2ba46',null);}}
function props(c,entry,alpha=1){
 if(alpha<=0||entry.index===0)return;c.save();c.globalAlpha*=alpha;
 // The setting occupies the rear edge, leaving the front skating lane clear.
 vase(c,0,-14);glass(c,-55,-18);glass(c,55,-18);c.restore();
}
function brokenLegs(c,x,u){if(u<=0)return;c.save();c.globalAlpha*=u;for(let i=0;i<5;i++){c.save();c.translate(x-72+i*35,FLOOR-3-(i%2)*2);c.rotate((i%2?1:-1)*(.12+i*.11));polygon(c,[[-17,-4],[-4,-7],[17,-2],[11,4],[-16,3]],i%2?'#8b582f':'#ac7540','#5d3a24',1);c.strokeStyle='#d0a260';c.lineWidth=.8;c.beginPath();c.moveTo(-12,-2);c.lineTo(10,0);c.stroke();c.restore();}c.restore();}
function nativeTable(c,entry,g,u,o){
 c.save();c.translate(g.x,0);ellipse(c,0,FLOOR-1,82,5,'#38211024',null);
 leg(c,-47,428,-1,.65*(1-u));leg(c,47,428,1,.65*(1-u));leg(c,-69,434,-1,1-u);leg(c,69,434,1,1-u);brokenLegs(c,0,u);
 const drop=110*u;c.translate(0,TOP+drop);c.save();c.scale(1,1-.84*u);cloth(c,entry,u,o);c.restore();
 if(u>.03){for(const side of[-1,1]){c.save();c.translate(side*34,0);c.rotate(side*.16*u);polygon(c,[[-45,-5],[-1,-8],[42,-4],[side<0?40:35,3],[4,5],[-43,2]],'#976036','#5b3923',1.2);c.restore();}}
 ellipse(c,0,0,87,14*(1-.5*u),'#fff7e1','#b69b63',1.1);
 c.strokeStyle='#fffdf1';c.lineWidth=1;c.beginPath();c.ellipse(0,-1,81,10*(1-.5*u),0,Math.PI,Math.PI*2);c.stroke();props(c,entry,1-clamp(u*1.7));
 if(u>.02){c.strokeStyle='#6d492e';c.lineWidth=2;c.beginPath();c.moveTo(-4,-8);c.lineTo(3,-4);c.lineTo(-3,0);c.lineTo(5,5);c.lineTo(0,11);c.stroke();}
 c.restore();
}
function table(c,entry,g,u,o,messy=false){
 const broken=!!o.lost&&entry.index===Math.floor(Number(o.step)||0);
 if(!tableArt.complete||!tableArt.naturalWidth||broken){nativeTable(c,entry,g,u,o);return;}
 const sx=WIDTH/ART.bounds,lipY=TOP+(ART.lip-ART.support)*sx,sy=(FLOOR-lipY)/(ART.foot-ART.lip),x=g.x-ART.center*sx;
 c.save();ellipse(c,g.x,FLOOR-1,82,5,'#38211024',null);
 if(entry.index===0){
  // Manny starts on an empty cloth: retain the approved legs and drape below,
  // and draw only its clean oval surface instead of the baked-in place settings.
  c.save();c.translate(x,TOP-ART.support*sx);c.scale(sx,sx);
  const top=c.createRadialGradient(685,337,20,685,365,565);top.addColorStop(0,'#fdf4e1');top.addColorStop(.68,'#fdf3e0');top.addColorStop(1,'#fcefd9');
  ellipse(c,686,365,550,105,top,'#90602f',4.6);
  c.strokeStyle='#fffbed';c.lineWidth=5;c.beginPath();c.ellipse(686,363,545,103,0,0,Math.PI);c.stroke();c.restore();
  // The clean lower half of the original tabletop also contains the sloping
  // shoulder of the cloth. Retain it so the top joins the drape continuously.
  // In v1 every place-setting prop ends above source y=360.
  if(tableBase.complete&&tableBase.naturalWidth)c.drawImage(tableBase,0,365,ART.width,ART.lip-365,x,TOP+(365-ART.support)*sx,ART.width*sx,(ART.lip-365)*sx);
 }else{
  const service=messy&&messyArt.complete&&messyArt.naturalWidth?messyArt:tableArt;
  c.drawImage(service,0,0,ART.width,ART.lip,x,TOP-ART.support*sx,ART.width*sx,ART.lip*sx);
 }
 c.drawImage(tableBase.complete&&tableBase.naturalWidth?tableBase:tableArt,0,ART.lip,ART.width,ART.height-ART.lip,x,lipY,ART.width*sx,(ART.height-ART.lip)*sy);
 if(messy&&entry.index!==0)tabletopMess(c,g,(Number(o.time)||0)-(messStarted.get(entry.index)??-Infinity),!!o.reduced);
 const quote=(Number((o.quotes||[])[entry.index])||100)/100,label=quote.toFixed(2)+'×';
 c.textAlign='center';c.textBaseline='middle';c.fillStyle='#073c38';
 c.font='400 '+(label.length>7?32:((Number(o.width)||900)<600?43:36))+'px "Subtle Curves",Arial,sans-serif';
 c.fillText(label,g.x,lipY+(650-ART.lip)*sy,142);c.restore();
}
function markMess(index,now){if(index<0||index>73||messyTables.has(index))return;messyTables.add(index);messStarted.set(index,now);}
function tabletopMess(c,g,age,reduced){
 // Small persistent broken china and glass fragments lie on the table plane.
 c.save();c.translate(g.x,TOP);for(let i=0;i<12;i++){const x=-63+(i*29)%124,y=-7+(i%4)*4;c.save();c.translate(x,y);c.rotate(i*.8);polygon(c,[[-2.8,-1.2],[1.7,-2],[3.2,1],[-1,1.7]],i%4===0?'#e1f0e0':'#fff5da','#bd995a',.45);c.restore();}
 // The short contact spray stays at tabletop height, well below Manny's face.
 if(!reduced&&age>=0&&age<460){const u=age/460;c.globalAlpha*=1-ease((u-.6)/.4);for(let i=0;i<18;i++){const a=i*2.4,x=Math.cos(a)*(8+40*u),y=-2-Math.sin(Math.PI*u)*(9+i%4*4)+(i%3)*2;c.save();c.translate(x,y);c.rotate(a+u*4);if(i%3===0)ellipse(c,0,0,2.8,1.6,i%2?'#e98d52':'#dfbd4f',null);else polygon(c,[[-2,-1],[1,-2],[3,1],[-1,1.7]],i%5?'#fff7e1':'#cfdec0','#b79558',.4);c.restore();}}
 c.restore();
}
function lossAmount(o){return o.lost?(o.reduced?1:ease((Number(o.age)-60)/540)):0;}
function draw(c,o={}){
 const now=Number(o.time)||0,active=!!o.active,step=clamp(Math.floor(Number(o.step)||0),0,73),mobile=(Number(o.width)||900)<600;
 const visible=(Number(o.width)||900)*600/(Number(o.height)||600);viewLeft=(900-visible)/2;viewRight=viewLeft+visible;focus=clamp(viewLeft+visible*(mobile?.45:.405),viewLeft+115,viewRight-108);
 const scale=mobile?.9:.94,reset=(active&&!previousActive&&step===0)||step<previousStep,before=camera;if(reset){camera=0;lastActiveProfile=null;lastActiveStep=0;outcomeProfile=null;messyTables.clear();messStarted.clear();}
 const cycle=clamp(Number(o.progress)||0)*(Number(o.tickMilliseconds)||2680),p=o.preparing?0:cycle,neutral=transferProfile(0,scale,!!o.reduced);
 let profile=active?transferProfile(p,scale,!!o.reduced):neutral;
 if(active){lastActiveStep=step;lastActiveProfile=profile;}if(o.caught&&!previousCaught&&!active)outcomeProfile=lastActiveStep===step&&lastActiveProfile?lastActiveProfile:neutral;if(!o.caught)outcomeProfile=null;if(o.caught&&outcomeProfile)profile=cashoutProfile(outcomeProfile,neutral,o.age,!!o.reduced);
 // Passed tables remain used. Fresh props are hit when the roller first lands,
 // at 2300ms, before the step counter advances at 2680ms.
 for(let i=0;i<step;i++)messyTables.add(i);
 if(active&&!o.preparing){if(cycle>=1540)markMess(step,now);if(cycle>=2300)markMess(step+1,now);}
 const offset=profile.root-ANCHOR,target=step+offset/PITCH;
 // Review variant: a stable screen anchor prevents idle lateral drifting.
 camera=target;
 // The room follows the exact table travel, including its pauses. Intro and
 // idle time alone cannot move the background ahead of the first table.
 if(!o.reduced)backgroundX-=(reset?0:camera-before)*PITCH*.13;
 previousActive=active;previousStep=step;previousCaught=!!o.caught;
 backdrop(c,o);const collapse=lossAmount(o),start=Math.max(0,Math.floor(camera+(viewLeft-focus)/PITCH)-1),end=Math.min(73,Math.ceil(camera+(viewRight-focus)/PITCH)+1);
 for(let i=start;i<=end;i++){const g=geometry(i);if(g.x+97<viewLeft-20||g.x-97>viewRight+20)continue;table(c,row[i],g,o.lost&&i===step?collapse:0,o,messyTables.has(i));}
 const current=geometry(step),x=current.x+profile.root,y=TOP+110*collapse;
 ellipse(c,x+3,TOP+1,38,4,'#2c251b33',null);
 const footprint={...current,collapse,originalTop:TOP,brokenTop:TOP+110*collapse};
 lastFrame={x,y,table:footprint,lost:!!o.lost,age:Number(o.age)||0,reduced:!!o.reduced,viewLeft,viewRight};
 const transfer={progress:profile.progress,phase:profile.phase,fromX:current.x,toX:current.x+PITCH,rootX:x,top:TOP,bodyDrop:profile.bodyDrop,left:{x:current.x+profile.left,y:TOP-profile.liftL,table:profile.leftTable===null?null:step+profile.leftTable},right:{x:current.x+profile.right,y:TOP-profile.liftR,table:profile.rightTable===null?null:step+profile.rightTable}};
 return{x,y:y-18,scale,flip:false,landing:profile.phase==='approach'||profile.phase==='weight'||profile.phase==='settle',table:footprint,transfer};
}
function woodPiece(c,i,len){
 const tone=i%3?'#a46b37':'#d29a55';
 if(i%12===0){
  // A recognizable broken curl from a carved cabriole leg.
  c.beginPath();c.moveTo(-len,-4);c.lineTo(-len+7,-7);c.bezierCurveTo(3,-10,len+3,-2,len-2,5);c.bezierCurveTo(len-7,12,3,11,4,5);c.bezierCurveTo(7,8,len-2,7,len-5,2);c.lineTo(-len+4,2);c.closePath();c.fillStyle=tone;c.fill();c.strokeStyle='#64401f';c.lineWidth=1;c.stroke();
 }else polygon(c,[[-len,-2-i%3],[-4,-4-i%2],[len,0],[len-5,2+i%3],[-len+2,2]],tone,'#64401f',.7);
 c.strokeStyle='#ecc17b';c.lineWidth=.7;c.beginPath();c.moveTo(-len+4,-1);c.lineTo(len-5,0);c.stroke();
}
function foreground(c,o={}){
 if(!lastFrame?.lost)return;const f=lastFrame,t=f.reduced?3.1:Math.max(0,f.age/1000);
 c.save();
 // Warm low dust stays below the face and clears completely after three seconds.
 const dust=f.reduced?0:ease((t-.12)/.24)*(1-ease((t-1.2)/1.8));
 if(dust>0){for(let i=0;i<11;i++){const side=i%2?1:-1,spread=clamp(t/1.6),x=f.table.x+side*(18+i*8)*spread,y=FLOOR-10-(i%3)*8-13*spread,r=36+(i%4)*9+16*spread;c.save();c.globalAlpha*=dust*(.065+(i%3)*.01);const haze=c.createRadialGradient(x,y,0,x,y,r);haze.addColorStop(0,'#f4d9aa');haze.addColorStop(.55,'#ead1a5');haze.addColorStop(1,'#ead1a500');c.fillStyle=haze;c.fillRect(x-r,y-r,r*2,r*2);c.restore();}}
 // A permanent small heap makes the destroyed table read clearly after the burst.
 const heap=ease((t-.3)/.55);if(heap>0){c.save();c.globalAlpha*=heap;for(let i=0;i<17;i++){c.save();const x=f.table.x-94+((i*47)%189),y=FLOOR-2+(i%4)*3;c.translate(x,y);c.rotate(((i%7)-3)*.13);woodPiece(c,i,8+i%5*4);c.restore();}c.restore();}
 // Seventy-two deterministic fragments: tiny chips, boards and carved leg curls.
 // Collision time is solved once per piece; sliding/bounce converge to a fixed heap.
 for(let i=0;i<72;i++){
  const side=i%2?1:-1,delay=(i%7)*.012,s=Math.max(0,t-delay),sx=f.table.x+(i%9-4)*17,sy=TOP+20+(i%6)*9,vx=side*(65+i%11*22)*(i%13===0?2.15:1),vy=-80-i%7*20,g=590,ground=FLOOR-5+(i%5)*3;
  if(t<delay)continue;
  const hit=(-vy+Math.sqrt(vy*vy+4*g*(ground-sy)))/(2*g),air=Math.min(s,hit),after=Math.max(0,s-hit),settle=ease(after/.42),bounce=after<.32?Math.sin(Math.PI*after/.32)*8*(1-after/.32):0;
  const x=sx+vx*air+vx*.12*(1-Math.exp(-after*6))/6,y=after?ground-bounce:sy+vy*air+g*air*air,spin=side*(2+i%5)*air,angle=spin*(1-settle)+((i%7)-3)*.1*settle,len=i%9===0?22+i%4*3:4+i%7*2;
  c.save();c.translate(x,y);c.rotate(angle);woodPiece(c,i,len);c.restore();
 }
 c.restore();
}
window.RestaurantScene={draw,foreground};
})();
