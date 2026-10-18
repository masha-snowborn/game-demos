/* Plump comic Manny: a braced table transfer, a dish-laden landing, and expressive endings. */
(()=>{
const atlas=new Image();atlas.src='assets/manny-comic-atlas-v3.png';
const lossReaction=new Image();lossReaction.src='assets/manny-loss-shrug-v1.png';
let lossTalkState={lost:false,age:0,heard:false,start:null};
// The atlas uses generous pose silhouettes; clipped gutters isolate each drawing.
const frames=[
 {foot:[273,815],clip:[[0,0],[451,0],[451,405],[443,405],[443,887],[0,887]],plates:[[-84.92,-205.92],[44,-206.36]]},
 {foot:[655,812],clip:[[455,0],[891,0],[891,650],[805,650],[805,887],[445,887],[445,405],[455,405]],plates:[[-58.96,-160.6],[66,-165]]},
 {foot:[1110,833],clip:[[900,320],[1285,320],[1285,635],[1410,635],[1410,887],[805,887],[805,650],[900,650]]},
 {foot:[1530,814],clip:[[1288,0],[1774,0],[1774,887],[1415,887],[1415,635],[1288,635]],plates:[[-69.52,-192.28],[73.92,-188.32]]}
];
// Remove only the original ceramic silhouettes; retain hands, hair and black trays.
const plateMasks={"0":[[[87,263],[47,265],[29,270],[23,274],[24,281],[38,288],[20,296],[22,302],[36,309],[24,312],[19,316],[21,322],[34,328],[18,333],[18,338],[26,343],[132,343],[142,337],[142,332],[128,327],[145,322],[145,311],[127,308],[141,299],[141,294],[127,288],[142,278],[142,273],[123,266],[100,263]],[[397,264],[350,266],[318,274],[312,278],[314,286],[328,293],[311,299],[312,306],[327,312],[311,317],[310,323],[324,330],[312,334],[311,340],[313,342],[338,344],[406,344],[423,343],[433,338],[433,332],[419,328],[433,319],[433,314],[416,309],[431,300],[432,294],[425,290],[413,288],[430,277],[430,270],[424,267],[403,264]]],"1":[[[508,366],[486,369],[467,376],[467,384],[481,392],[464,399],[466,406],[479,413],[462,419],[462,425],[477,432],[462,435],[461,440],[468,445],[497,446],[562,446],[576,445],[581,441],[580,436],[571,432],[582,425],[582,420],[569,414],[580,408],[583,405],[583,401],[568,393],[580,387],[585,381],[585,377],[574,371],[547,366]],[[808,349],[761,355],[751,358],[742,364],[744,371],[760,378],[742,386],[742,392],[759,400],[745,404],[742,407],[743,413],[757,419],[742,424],[742,430],[748,434],[762,435],[851,435],[863,428],[864,423],[847,416],[861,408],[863,401],[844,395],[859,386],[861,379],[844,373],[856,366],[860,362],[860,358],[858,355],[844,351],[816,349]]],"3":[[[1362,294],[1334,298],[1313,306],[1315,314],[1329,320],[1311,327],[1311,331],[1315,335],[1325,340],[1309,346],[1311,353],[1323,359],[1310,363],[1309,369],[1315,372],[1328,373],[1389,373],[1421,371],[1429,366],[1428,359],[1416,356],[1429,347],[1429,341],[1413,337],[1429,327],[1429,321],[1412,316],[1428,305],[1428,299],[1405,294]],[[1681,310],[1653,314],[1638,320],[1639,327],[1652,333],[1636,339],[1636,344],[1649,352],[1635,357],[1635,363],[1646,368],[1634,374],[1634,378],[1639,381],[1677,382],[1715,382],[1750,381],[1756,377],[1755,371],[1744,368],[1754,362],[1756,355],[1743,350],[1755,342],[1755,336],[1740,332],[1755,322],[1755,317],[1741,312],[1724,310]]]};
function clipBakedPlates(c,index){
 const holes=plateMasks[index];if(!holes)return;
 c.beginPath();c.rect(0,0,1774,887);
 for(const source of holes){
  // Include the old 2–3 px antialiased rim without lowering the cut into its tray.
  const area=source.reduce((a,p,i)=>{const q=source[(i+1)%source.length];return a+p[0]*q[1]-q[0]*p[1];},0),direction=area>0?1:-1,bottom=Math.max(...source.map(p=>p[1]));
  const normal=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.max(.001,Math.hypot(dx,dy));return[direction*dy/d,-direction*dx/d];};
  const polygon=source.map((p,i)=>{const a=normal(source[(i+source.length-1)%source.length],p),b=normal(p,source[(i+1)%source.length]),nx=a[0]+b[0],ny=a[1]+b[1],d=Math.max(.001,Math.hypot(nx,ny)),factor=Math.min(7,3.5/Math.max(.5,(nx/d)*b[0]+(ny/d)*b[1]));return[p[0]+nx/d*factor,Math.min(bottom,p[1]+ny/d*factor)];});
  polygon.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();
 }
 c.clip('evenodd');
}
function restoreStandingHead(c,index){
 if(index!==0)return;
 // The left ear/hair sits immediately behind the old stack. Restore only the
 // visible head side of that boundary; the ceramic silhouettes remain excluded.
 c.save();c.beginPath();c.moveTo(144,263);c.lineTo(144,344);c.lineTo(140,344);c.lineTo(140,355);c.lineTo(177,365);c.lineTo(285,365);c.lineTo(285,250);c.lineTo(165,250);c.closePath();c.clip();c.drawImage(atlas,0,0,1774,887);c.restore();
}
const LOAD_BASE_PLATES=24;
const SPRITE_SCALE=.44,loadAnchors={base:frames[0].plates,win:frames[3].plates};
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),ease=n=>{n=clamp(n);return n*n*(3-2*n);};
function plate(c,x,y,r,size=31.5){
 c.save();c.translate(x,y);c.rotate(r);
 // One ceramic shape and one rim treatment for every dish, from tray to top.
 c.beginPath();c.moveTo(-size,0);c.bezierCurveTo(-size*.88,size*.25,-size*.55,size*.34,0,size*.34);c.bezierCurveTo(size*.55,size*.34,size*.88,size*.25,size,0);c.closePath();c.fillStyle='#e4d2a9';c.fill();c.strokeStyle='#654b2d';c.lineWidth=1.3;c.stroke();
 const ceramic=c.createLinearGradient(0,-size*.26,0,size*.19);ceramic.addColorStop(0,'#fffdf0');ceramic.addColorStop(.6,'#fff7df');ceramic.addColorStop(1,'#f0e0bd');
 c.beginPath();c.ellipse(0,0,size,size*.235,0,0,Math.PI*2);c.fillStyle=ceramic;c.fill();c.strokeStyle='#654b2d';c.lineWidth=1.25;c.stroke();
 c.beginPath();c.ellipse(0,-.2,size*.89,size*.175,0,0,Math.PI*2);c.strokeStyle='#c19442';c.lineWidth=1.35;c.stroke();
 c.beginPath();c.ellipse(0,-.5,size*.69,size*.11,0,Math.PI,Math.PI*2);c.strokeStyle='#e1c68b';c.lineWidth=.8;c.stroke();c.restore();
}
function cup(c,x,y,r){c.save();c.translate(x,y);c.rotate(r);c.fillStyle='#fff7df';c.strokeStyle='#b89551';c.lineWidth=1.2;c.beginPath();c.roundRect(-7,-8,14,13,3);c.fill();c.stroke();c.beginPath();c.arc(9,-3,4,-1.8,1.8);c.stroke();c.restore();}
function serviceCup(c,x,y,rotation=0){
 c.save();c.translate(x,y);c.rotate(rotation);c.strokeStyle='#886239';c.lineWidth=1.25;
 c.beginPath();c.ellipse(0,0,11.5,2.5,0,0,Math.PI*2);c.fillStyle='#f6e8c9';c.fill();c.stroke();
 c.beginPath();c.ellipse(10,-9,5,5.5,0,0,Math.PI*2);c.stroke();
 c.beginPath();c.moveTo(-9,-16);c.bezierCurveTo(-9,-7,-8,-2,0,-2);c.bezierCurveTo(8,-2,9,-7,9,-16);c.closePath();c.fillStyle='#fff9e7';c.fill();c.stroke();
 c.beginPath();c.ellipse(0,-16,9,3,0,0,Math.PI*2);c.fillStyle='#e5c98e';c.fill();c.strokeStyle='#bd9146';c.stroke();
 c.beginPath();c.ellipse(0,-16,6.5,1.8,0,0,Math.PI*2);c.fillStyle='#a56737';c.fill();
 c.beginPath();c.moveTo(-5,-12);c.quadraticCurveTo(-5,-7,-3,-5);c.strokeStyle='#fffef3';c.stroke();c.restore();
}
function serviceGlass(c,x,y,rotation=0){
 c.save();c.translate(x,y);c.rotate(rotation);c.strokeStyle='#ae884d';c.lineWidth=1.1;
 c.beginPath();c.ellipse(0,0,7.5,2,0,0,Math.PI*2);c.fillStyle='#fff7e377';c.fill();c.stroke();
 c.beginPath();c.moveTo(0,-1);c.lineTo(0,-11);c.stroke();
 c.beginPath();c.moveTo(-6.5,-25);c.bezierCurveTo(-8,-16,-5,-11,0,-11);c.bezierCurveTo(5,-11,8,-16,6.5,-25);c.closePath();c.fillStyle='#fff8e34d';c.fill();c.stroke();
 c.beginPath();c.ellipse(0,-25,6.5,2,0,0,Math.PI*2);c.stroke();
 c.beginPath();c.moveTo(-4.5,-22);c.quadraticCurveTo(-5,-17,-2.5,-15);c.strokeStyle='#fffdf0';c.lineWidth=1.5;c.stroke();c.restore();
}
function serviceCutlery(c,x,y,rotation=0){
 c.save();c.translate(x,y);c.rotate(rotation);c.strokeStyle='#9a7842';c.lineWidth=1.8;c.lineCap='round';
 c.beginPath();c.moveTo(-3,5);c.lineTo(-3,-20);c.moveTo(-7,-26);c.lineTo(-7,-21);c.quadraticCurveTo(-3,-17,1,-21);c.lineTo(1,-26);c.moveTo(-3,-26);c.lineTo(-3,-20);c.stroke();
 c.beginPath();c.moveTo(5,5);c.lineTo(5,-27);c.quadraticCurveTo(12,-22,9,-13);c.lineTo(5,-13);c.fillStyle='#e4d6b2';c.fill();c.stroke();
 c.strokeStyle='#fff3d1';c.lineWidth=.6;c.beginPath();c.moveTo(-3.7,3);c.lineTo(-3.7,-17);c.moveTo(5.7,3);c.lineTo(5.7,-12);c.stroke();c.restore();
}
function towerHeight(step){const raw=(LOAD_BASE_PLATES+step*2-1)*6.3;return raw<=107?raw:107+8*(1-Math.exp(-(raw-107)/65));}
function drawLoad(c,step,anchors,settle=0,arrive=1,motion=0,wobble=1,onlySide=null){
 const count=LOAD_BASE_PLATES+step*2,height=towerHeight(step)-23,spacing=height/(count-1),offsets=[-5,9,-10,6,-8,12,-3,7],angles=[-.09,.07,-.04,.115,-.07,.035];
 for(let side=0;side<2;side++){
  if(onlySide!==null&&side!==onlySide)continue;
  const sign=side?1:-1,anchor=anchors[side],phase=motion/710+side*.85,amplitude=motion?2.5*Math.min(1.45,wobble)*ease(motion/480):0;
  // A small travelling bend passes up the pile; the bottom stays on its tray.
  const placement=i=>{const u=i/(count-1),envelope=Math.pow(u,1.45),bend=phase-u*3.35;return{x:sign*(offsets[i%offsets.length]*.75+5*Math.sin(u*Math.PI)+3*u)+amplitude*envelope*Math.sin(bend),y:-10.7-i*spacing*(1-.04*settle),tilt:sign*(angles[i%angles.length]+.025*u)+amplitude*.009*envelope*Math.cos(bend),size:i===count-1?32:34+3.8*Math.sin((i%6)*1.15)};};
  const top=placement(count-1),topArrival=step>0?arrive:1;
  c.save();c.translate(anchor[0],anchor[1]);c.rotate(sign*.02);
  c.save();c.globalAlpha*=topArrival;c.translate(top.x,top.y);c.rotate(top.tilt);serviceCutlery(c,-sign*12,8,-sign*.24);c.restore();
  for(let i=0;i<count;i++){
   const newest=step>0&&i>=count-2,weight=newest?arrive:1,p=placement(i);
   c.save();c.globalAlpha*=weight;
   plate(c,p.x,p.y+(newest?(1-arrive)*6:0),p.tilt,p.size);
   c.restore();
  }
  c.save();c.globalAlpha*=topArrival;c.translate(top.x,top.y);c.rotate(top.tilt);
  if(side===0)serviceCup(c,-2,-3,-.08);
  else serviceGlass(c,2,-3,.09);
  c.restore();
  if(step>=3){const nest=placement(Math.max(0,count-6));c.save();c.translate(nest.x,nest.y);c.rotate(nest.tilt);c.scale(.82,.82);serviceCup(c,sign*22/.82,-2/.82,sign*.18);c.restore();}
  c.restore();
 }
}
function star(c,x,y,radius,rotation=0,color='#e3ad37'){c.save();c.translate(x,y);c.rotate(rotation);c.fillStyle=color;c.strokeStyle='#a87a2b';c.lineWidth=.7;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?radius*.44:radius;if(i)c.lineTo(Math.cos(a)*r,Math.sin(a)*r);else c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();c.fill();c.stroke();c.restore();}
function sticker(c,x,y,text,color,fontSize=13){c.save();c.translate(x,y);c.rotate(-.055);c.font='800 '+fontSize+'px Arial,sans-serif';const large=fontSize>13,w=c.measureText(text).width+(large?34:22),h=large?46:27;c.fillStyle='#fff8e8';c.strokeStyle='#af8951';c.lineWidth=large?1.7:1.15;c.beginPath();c.roundRect(-w/2,-h/2,w,h,large?10:7);c.fill();c.stroke();c.fillStyle=color;c.textAlign='center';c.fillText(text,0,fontSize*.33);c.restore();}
function lossPose(age,reduced){const t=reduced?1.2:Math.max(0,age/1000);if(t<.16)return{a:-.16*Math.sin(Math.PI*t/.16),x:-5*Math.sin(Math.PI*t/.16),y:0};const u=ease((t-.16)/.46),bounce=t>.62&&t<1.08?Math.sin(Math.PI*(t-.62)/.46):0;return{a:1.36*u-.065*bounce,x:14*u+2*bounce,y:-7*bounce};}
function shard(c,x,y,rotation,size){
 c.save();c.translate(x,y);c.rotate(rotation);c.fillStyle='#fff5dc';c.strokeStyle='#9e7845';c.lineWidth=.9;c.beginPath();c.moveTo(-size,-size*.35);c.lineTo(size*.45,-size*.65);c.lineTo(size,size*.45);c.lineTo(-size*.4,size*.65);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(-size,-size*.35);c.lineTo(size*.45,-size*.65);c.strokeStyle='#d1aa60';c.lineWidth=1.25;c.stroke();c.restore();
}
function lossCeramicBatch(c,pieces,opacity=1,layerSize=24){
 if(!pieces.length||opacity<=0)return;
 c.save();c.globalAlpha*=opacity;c.fillStyle='#fff5dc';c.strokeStyle='#9e7845';c.lineWidth=.85;c.lineJoin='round';
 // Small painter layers hide the outlines of buried pieces. One giant fill and
 // stroke would show every hidden edge through the pile like a wire basket.
 for(let start=0;start<pieces.length;start+=layerSize){
  const end=Math.min(pieces.length,start+layerSize);c.beginPath();
  for(let i=start;i<end;i++){const [x,y,angle,size]=pieces[i],u=Math.cos(angle)*size,v=Math.sin(angle)*size,type=i%4;
   if(type===0){c.moveTo(x-u+.48*v,y-v-.48*u);c.lineTo(x+.8*u+.05*v,y+.8*v-.05*u);c.lineTo(x+.1*u-.68*v,y+.1*v+.68*u);}
   else if(type===2){c.moveTo(x-u-.12*v,y-v+.12*u);c.quadraticCurveTo(x-.7*u+.8*v,y-.7*v-.8*u,x+.8*u+.52*v,y+.8*v-.52*u);c.lineTo(x+.3*u-.6*v,y+.3*v+.6*u);c.lineTo(x-.6*u-.5*v,y-.6*v+.5*u);}
   else if(type===3){c.moveTo(x-.9*u+.5*v,y-.9*v-.5*u);c.lineTo(x+.7*u+.42*v,y+.7*v-.42*u);c.lineTo(x+u-.2*v,y+v+.2*u);c.lineTo(x+.1*u-.1*v,y+.1*v+.1*u);c.lineTo(x-.3*u-.7*v,y-.3*v+.7*u);}
   else{c.moveTo(x-u+.35*v,y-v-.35*u);c.lineTo(x+.45*u+.65*v,y+.45*v-.65*u);c.lineTo(x+u-.45*v,y+v+.45*u);c.lineTo(x-.4*u-.65*v,y-.4*v+.65*u);}c.closePath();}
  c.fill();c.strokeStyle='#9e7845';c.lineWidth=.85;c.stroke();c.beginPath();
  for(let i=start;i<end;i++){if(i%3===1)continue;const [x,y,angle,size]=pieces[i],u=Math.cos(angle)*size,v=Math.sin(angle)*size,type=i%4;
   if(type===0){c.moveTo(x-u+.48*v,y-v-.48*u);c.lineTo(x+.8*u+.05*v,y+.8*v-.05*u);}
   else if(type===2){c.moveTo(x-u-.12*v,y-v+.12*u);c.quadraticCurveTo(x-.7*u+.8*v,y-.7*v-.8*u,x+.8*u+.52*v,y+.8*v-.52*u);}
   else if(type===3){c.moveTo(x-.9*u+.5*v,y-.9*v-.5*u);c.lineTo(x+.7*u+.42*v,y+.7*v-.42*u);}
   else{c.moveTo(x-u+.35*v,y-v-.35*u);c.lineTo(x+.45*u+.65*v,y+.45*v-.65*u);}}
  c.strokeStyle='#d1aa60';c.lineWidth=1.2;c.stroke();
 }
 c.restore();
}
function lossFloorFragment(seconds,x,y,vx,vy,floor,angle,spin,size){
 const gravity=430,air=(-vy+Math.sqrt(Math.max(0,vy*vy+4*gravity*(floor-y))))/(2*gravity),flight=Math.min(Math.max(0,seconds),air),after=Math.max(0,seconds-air),slideTime=.58,u=Math.min(1,after/slideTime),slide=slideTime*(u-.5*u*u),bounce=after<.34?Math.sin(Math.PI*after/.34)*4.8*(1-after/.34):0;
 return[x+vx*flight+vx*slide,after>0?floor-bounce:y+vy*flight+gravity*flight*flight,angle+spin*(flight+slide),size];
}
function drawSpill(c,age,reduced,outcomeWeight=0,loadStep=0,bounds={left:-450,right:450,bottom:260}){
 const elapsed=reduced?3.5:Math.max(0,Number(age)||0)/1000,t=clamp(elapsed,0,3.5);
 const originY=Number.isFinite(bounds.originY)?bounds.originY:0,groundY=Number.isFinite(bounds.groundY)?bounds.groundY:0;
 const left=bounds.left-30,right=bounds.right+30,large=[],fine=[];
 // Seven fragments per dish and a second fine-chip burst scatter over the floor.
 // Each fragment lands, bounces briefly, slides with friction and then stays put.
 const count=Math.min(128+loadStep*6,208);
 for(let i=0;i<count;i++){
  const extra=i>=34,j=i-34,side=extra?(Math.floor(j/2)%2?1:-1):(i%2?1:-1),row=Math.floor(j/4)*2+j%2,spacing=towerHeight(loadStep)/(LOAD_BASE_PLATES+loadStep*2-1),delay=(i%6)*.012,s=Math.max(0,t-delay),anchor=loadAnchors.base[side<0?0:1],sx=extra?anchor[0]:side*58,sy=(extra?anchor[1]-4.2-row*spacing:(side<0?-213:-214))+originY,vx=side*(42+(i%9)*9),vy=-85-(i%4)*24,g=650,ground=groundY+3+(i%5)*4;
  const hit=(-vy+Math.sqrt(vy*vy+4*g*(ground-sy)))/(2*g),after=s-hit;
  if(after<0){
   if(reduced)continue;const px=sx+vx*s,py=sy+vy*s+g*s*s,r=side*s*(2.2+(i%5)*.6);
   if(px<left-25||px>right+25)continue;
   if(i%13===0){c.save();c.translate(px,py);c.rotate(r);c.scale(.7,.7);serviceGlass(c,0,0);c.restore();}
   else if(i%11===0){c.save();c.translate(px,py);c.rotate(r);c.scale(.7,.7);serviceCutlery(c,0,0);c.restore();}
   else if(i%7===0)cup(c,px,py,r);else plate(c,px,py,r,10+(i%4)*3);
   continue;
  }
  const hitX=sx+vx*hit;
  for(let piece=0;piece<7;piece++){
   const fan=piece<3?side:((i+piece)%2?1:-1),speed=28+(i*17+piece*31)%165,floor=ground+(i*13+piece*7)%4;
   const p=lossFloorFragment(after,hitX,ground,fan*speed,-65-(i+piece*3)%125,floor,side*hit*4+piece*2.1,fan*(5+piece*2),piece<3?5+(i+piece)%5:2.7+(i+piece)%4);
   if(p[0]<left||p[0]>right)continue;(piece<3?large:fine).push(p);
  }
 }
 // Low ivory chips fill the gaps between the larger broken rims. Their final
 // positions occupy the restaurant floor (470–492), never the button area below.
 if(elapsed>.44||reduced){
  const chips=Math.min(570+loadStep*16,850);
  for(let i=0;i<chips;i++){
   const delay=.44+(i%17)*.014,seconds=t-delay;if(seconds<0)continue;
   const side=i%2?1:-1,x=side*(12+(i*37)%98),y=groundY-(i%7)*4,floor=groundY+2+(i*11)%21,vy=-80-(i%9)*17,air=(-vy+Math.sqrt(vy*vy+4*430*(floor-y)))/(2*430),u=(i*.61803398875)%1,target=bounds.left+12+u*Math.max(1,bounds.right-bounds.left-24),vx=Math.max(-500,Math.min(500,(target-x)/(air+.29)));
   const p=lossFloorFragment(seconds,x,y,vx,vy,floor,i*.73,side*(6+i%5),1.6+(i%5)*.62);if(p[0]<left||p[0]>right)continue;fine.push(p);
  }
 }
 lossCeramicBatch(c,large);lossCeramicBatch(c,fine);
 const pile=ease((t-.48)/.72);
 if(pile>0){
  c.save();c.globalAlpha*=pile;
  const pieces=Math.min(250+loadStep*6,360),heap=[];
  c.fillStyle='#654b2d25';c.beginPath();c.ellipse(6,groundY+15,157,18,0,0,Math.PI*2);c.fill();
  for(let i=0;i<pieces;i++){
   const u=(i*.61803398875)%1,x=(u-.5)*306+6,mound=Math.max(0,1-Math.abs(x-6)/157),front=i%3===0;
   const bounce=t<1.5?Math.sin(Math.PI*clamp((t-.52-i%6*.025)/.75))*(i%3+1):0;
   const y=groundY+22-(front?24:51)*mound-(i%7)*2.3-bounce;
   heap.push([x,y,(i*2.39996)%(Math.PI*2),5.5+i%12]);
  }
  lossCeramicBatch(c,heap,1,9);
  // Large broken rims and half-plates sit among the smaller shards, rather than
  // leaving a uniform gravel strip. The pile stays below Manny's waist and face.
  for(let i=0;i<23;i++){
   const x=i<15?-140+i*20:-108+(i-15)*31,y=i<15?groundY+12-(i%4)*7-12*(1-Math.abs(x)/145):groundY-41*(1-Math.abs(x)/151)-(i%3)*4;
   c.save();c.translate(x,y);c.rotate((i%2?1:-1)*(.1+i%5*.13));
   c.beginPath();c.ellipse(0,0,14+i%4*4,5+i%3*2,0,.18,Math.PI*1.54);c.lineTo(-5,-2);c.lineTo(4,1);c.closePath();c.fillStyle='#fff5dc';c.fill();c.strokeStyle='#9d783c';c.lineWidth=1.7;c.stroke();
   c.beginPath();c.ellipse(0,-1,11+i%4*4,3+i%3*1.5,0,.2,Math.PI*1.42);c.strokeStyle='#c9a05a';c.lineWidth=1.25;c.stroke();c.restore();
  }
  for(const [x,r]of [[101,.8],[-121,-.6]]){c.save();c.translate(x,groundY+3);c.rotate(r);c.scale(.78,.78);serviceCup(c,0,0);c.restore();}
  c.restore();
 }
 const haze=ease((t-.4)/.35)*(1-ease((t-1.5)/1.5));
 if(haze>0){c.save();c.globalAlpha*=haze*.24;for(let i=0;i<14;i++){
  const side=i%2?1:-1,x=side*(14+(i%7)*15)*(1+.22*t),y=groundY-6-(i%4)*9-t*9,r=14+i%5*3;
  c.fillStyle=i%3?'#e8d1ac':'#fff2d6';c.beginPath();c.ellipse(x,y,r,r*.65,0,0,Math.PI*2);c.fill();
 }c.restore();}
 const impact=clamp((t-.6)/.55),dust=Math.sin(impact*Math.PI);
 if(dust>0){c.save();c.globalAlpha*=dust*.55;for(let i=0;i<12;i++){const side=i%2?1:-1;c.fillStyle=i%3?'#ead4ae':'#fff5de';c.beginPath();c.arc(40+side*(8+i*4)*impact,6-i%4*4*impact,2+i%3,0,Math.PI*2);c.fill();}c.restore();}
 if(t>.58){
  const headX=90-103*outcomeWeight,headY=-180+8*outcomeWeight,bob=reduced?0:1.15*Math.sin(elapsed*1.7),spin=reduced?0:elapsed*3.9;
  c.save();c.strokeStyle='#bb944e';c.lineWidth=1.1;c.beginPath();c.ellipse(headX,headY-35+bob,29,10,0,0,Math.PI*2);c.stroke();
  for(let i=0;i<3;i++){const a=spin+i*Math.PI*2/3,twinkle=reduced?1:.92+.12*Math.sin(elapsed*4.6+i*2.1);c.save();c.globalAlpha*=reduced?1:.82+.18*Math.sin(elapsed*3.2+i*2.1);star(c,headX+Math.cos(a)*29,headY-35+bob+Math.sin(a)*10,5.5*twinkle,a*.25,'#f0bf46');c.restore();}c.restore();
 }
}
function drawCelebration(c,age,reduced){
 const t=reduced?2.7:clamp(age/1000,0,2.7),fade=1-ease((t-1.9)/.65);
 if(fade>0){c.save();c.globalAlpha*=fade;for(let i=0;i<38;i++){const a=i*2.39996,speed=45+i%7*10,vx=Math.cos(a)*speed,vy=-82-(i%5)*15,px=vx*t,py=-226+vy*t+71*t*t;c.save();c.translate(px,py);c.rotate(a+t*(i%2?2:-2));c.fillStyle=['#dda541','#f7d785','#ae4d3b','#fff2cc'][i%4];c.fillRect(-2.5,-1.5,5+(i%3),3);c.restore();}for(let i=0;i<7;i++){const a=i*Math.PI*2/7;star(c,Math.cos(a)*(93+t*9),-177+Math.sin(a)*68,4+(i%2),a+t*.25,'#edc565');}c.restore();}
 c.save();c.globalAlpha*=.8;for(let side=-1;side<=1;side+=2){for(let i=0;i<5;i++){c.save();c.translate(side*(81+i*3),-108-i*15);c.rotate(side*(-.8+i*.05));c.fillStyle=i%2?'#c8a15a':'#e0bb72';c.beginPath();c.ellipse(0,0,4,9,0,0,Math.PI*2);c.fill();c.restore();}}c.restore();
 sticker(c,11,-300,'TA-DA!','#68733e');
}
function drawSprite(c,index,weight){
 if(weight<=0)return;
 const frame=frames[index];c.save();c.globalAlpha*=weight;c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frame.foot[0],-frame.foot[1]);c.beginPath();frame.clip.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.save();clipBakedPlates(c,index);c.drawImage(atlas,0,0,1774,887);c.restore();restoreStandingHead(c,index);c.restore();
}
const skateParts=[{crop:[130,691,141,125],anchor:[200,815],ankle:[-5.28,-49]},{crop:[280,690,129,126],anchor:[342,815],ankle:[-10.56,-49]}];
function drawUpper(c,index,weight=1){
 if(weight<=0)return;const frame=frames[index],regions=index===3?[
  [[1288,0],[1774,0],[1774,570],[1288,570]],[[1584,530],[1618,526],[1655,608],[1636,643],[1595,635]]
 ]:[[[0,0],[451,0],[451,521],[372,521],[372,541],[347,544],[299,548],[279,555],[254,548],[211,533],[178,516],[156,521],[0,521]],[[131,590],[146,515],[176,515],[184,531],[170,575],[177,628],[156,638]],[[345,533],[372,523],[405,609],[395,640],[354,629],[344,591]]];
 for(const region of regions){c.save();c.globalAlpha*=weight;c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frame.foot[0],-frame.foot[1]);c.beginPath();frame.clip.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.beginPath();region.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();c.save();clipBakedPlates(c,index);c.drawImage(atlas,0,0,1774,887);c.restore();restoreStandingHead(c,index);c.restore();}
}
function legJoint(hip,ankle){
 // Standing legs relax almost straight; the knee bends only as the skate rises.
 const dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy)),total=Math.max(72,d+.25),thigh=total*.51,shin=total*.49,a=(thigh*thigh-shin*shin+d*d)/(2*d),h=Math.sqrt(Math.max(0,thigh*thigh-a*a));
 return{x:hip.x+dx/d*a+dy/d*h,y:hip.y+dy/d*a-dx/d*h};
}
function trouserSegment(hip,knee,ankle){
 // Shared edge geometry lets both legs and the seat become one cloth outline.
 const unit=(a,b)=>{const x=b.x-a.x,y=b.y-a.y,d=Math.max(.001,Math.hypot(x,y));return{x:x/d,y:y/d,d};},a=unit(hip,knee),b=unit(knee,ankle),m=unit(hip,ankle),edge=(p,v,r,side)=>({x:p.x-v.y*r*side,y:p.y+v.x*r*side});
 return{hip,knee,ankle,a,b,m,h1:edge(hip,a,18.5,1),k1:edge(knee,m,13.2,1),f1:edge(ankle,b,10,1),h2:edge(hip,a,18.5,-1),k2:edge(knee,m,13.2,-1),f2:edge(ankle,b,10,-1)};
}
function articulatedPose(transfer,x,y,scale){
 const unit=Math.max(.01,Math.abs(Number(scale)||1)),foot=(v,fallback)=>v&&Number.isFinite(v.x)&&Number.isFinite(v.y)?{x:(v.x-x)/unit,y:(v.y-y)/unit}:fallback;
 return{left:foot(transfer?.left,{x:-32.12,y:0}),right:foot(transfer?.right,{x:30.36,y:0}),drop:Number.isFinite(transfer?.bodyDrop)?transfer.bodyDrop/unit:0,phase:transfer?.phase||'approach'};
}
function drawArticulated(c,pose,load,{winWeight=0,bow=0,lean=0,suppressUpper=false}={}){
 const hipShift=Number(pose.hipShift)||0,pelvisAngle=Number(pose.pelvisAngle)||0,winIK=Number(pose.winIK)||0,pivot={x:0,y:-112+pose.drop},co=Math.cos(-pelvisAngle),si=Math.sin(-pelvisAngle),inverseFoot=p=>{if(!pelvisAngle)return{x:p.x-hipShift,y:p.y};const x=p.x-hipShift-pivot.x,y=p.y-pivot.y;return{x:pivot.x+x*co-y*si,y:pivot.y+x*si+y*co};};c.save();c.translate(hipShift,0);if(pelvisAngle){c.translate(pivot.x,pivot.y);c.rotate(pelvisAngle);c.translate(-pivot.x,-pivot.y);}
 const hips=[{x:-29,y:-119+pose.drop},{x:14,y:-115+pose.drop}],feet=[inverseFoot(pose.left),inverseFoot(pose.right)],legs=hips.map((hip,i)=>{const foot=feet[i],part=skateParts[i],ankle={x:foot.x+part.ankle[0]*co-part.ankle[1]*si,y:foot.y+part.ankle[0]*si+part.ankle[1]*co};const old=legJoint(hip,ankle),dx=ankle.x-hip.x,dy=ankle.y-hip.y,d=Math.max(.001,Math.hypot(dx,dy)),thigh=38,shin=36,along=(thigh*thigh-shin*shin+d*d)/(2*d),side=i?1:-1,h=Math.sqrt(Math.max(0,thigh*thigh-along*along)),fixed={x:hip.x+dx/d*along+side*dy/d*h,y:hip.y+dy/d*along-side*dx/d*h},knee={x:old.x+(fixed.x-old.x)*winIK,y:old.y+(fixed.y-old.y)*winIK};return trouserSegment(hip,knee,ankle);}),[l,r]=legs;
 // The seat, thighs and calves share one outline; no closed hip caps can protrude
 // into the crotch while the feet span the two tables.
 const crotchY=-102+pose.drop;
 c.beginPath();c.moveTo(-47,-135+pose.drop);c.quadraticCurveTo(-49,-128+pose.drop,l.h1.x,l.h1.y);
 c.bezierCurveTo(l.h1.x+l.a.x*l.a.d*.4,l.h1.y+l.a.y*l.a.d*.4,l.k1.x-l.m.x*l.a.d*.28,l.k1.y-l.m.y*l.a.d*.28,l.k1.x,l.k1.y);
 c.bezierCurveTo(l.k1.x+l.m.x*l.b.d*.28,l.k1.y+l.m.y*l.b.d*.28,l.f1.x-l.b.x*l.b.d*.35,l.f1.y-l.b.y*l.b.d*.35,l.f1.x,l.f1.y);
 c.quadraticCurveTo(l.ankle.x+l.b.x*4,l.ankle.y+l.b.y*4,l.f2.x,l.f2.y);
 c.bezierCurveTo(l.f2.x-l.b.x*l.b.d*.35,l.f2.y-l.b.y*l.b.d*.35,l.k2.x+l.m.x*l.b.d*.28,l.k2.y+l.m.y*l.b.d*.28,l.k2.x,l.k2.y);
 c.bezierCurveTo(l.k2.x-l.m.x*l.a.d*.25,l.k2.y-l.m.y*l.a.d*.25,-21,crotchY+4,-9,crotchY);
 c.bezierCurveTo(-8,crotchY-2,-4,crotchY-2,-3,crotchY);
 c.bezierCurveTo(9,crotchY+4,r.k1.x-r.m.x*r.a.d*.25,r.k1.y-r.m.y*r.a.d*.25,r.k1.x,r.k1.y);
 c.bezierCurveTo(r.k1.x+r.m.x*r.b.d*.28,r.k1.y+r.m.y*r.b.d*.28,r.f1.x-r.b.x*r.b.d*.35,r.f1.y-r.b.y*r.b.d*.35,r.f1.x,r.f1.y);
 c.quadraticCurveTo(r.ankle.x+r.b.x*4,r.ankle.y+r.b.y*4,r.f2.x,r.f2.y);
 c.bezierCurveTo(r.f2.x-r.b.x*r.b.d*.35,r.f2.y-r.b.y*r.b.d*.35,r.k2.x+r.m.x*r.b.d*.28,r.k2.y+r.m.y*r.b.d*.28,r.k2.x,r.k2.y);
 c.bezierCurveTo(r.k2.x-r.m.x*r.a.d*.28,r.k2.y-r.m.y*r.a.d*.28,r.h2.x+r.a.x*r.a.d*.4,r.h2.y+r.a.y*r.a.d*.4,r.h2.x,r.h2.y);
 c.quadraticCurveTo(36,-128+pose.drop,35,-135+pose.drop);c.bezierCurveTo(12,-143+pose.drop,-28,-145+pose.drop,-47,-135+pose.drop);c.closePath();
 const cloth=c.createLinearGradient(-55,0,45,0);cloth.addColorStop(0,'#0a6479');cloth.addColorStop(.48,'#0f7186');cloth.addColorStop(1,'#0a6076');c.fillStyle=cloth;c.fill();c.strokeStyle='#184d5b';c.lineWidth=1.65;c.stroke();
 if(winIK){c.save();c.clip();for(const leg of legs){const center={x:(leg.hip.x+leg.knee.x)*.5-4,y:(leg.hip.y+leg.knee.y)*.5},glow=c.createRadialGradient(center.x,center.y,3,center.x,center.y,35);glow.addColorStop(0,'#479daf45');glow.addColorStop(.55,'#358a9c25');glow.addColorStop(1,'#358a9c00');c.fillStyle=glow;c.fillRect(-140,-170,280,180);}c.restore();}
 c.strokeStyle='#073f5360';c.lineWidth=.9;for(const{hip,knee,ankle}of legs){c.beginPath();c.moveTo(knee.x-5,knee.y+2);c.quadraticCurveTo(knee.x+1,knee.y+5,knee.x+6,knee.y+1);c.stroke();c.beginPath();c.moveTo(ankle.x-5,ankle.y-7);c.quadraticCurveTo(ankle.x,ankle.y-4,ankle.x+5,ankle.y-6);c.stroke();}
 c.beginPath();c.moveTo(-6,-121+pose.drop);c.quadraticCurveTo(-9,-115+pose.drop,-6,-108+pose.drop);c.stroke();
 for(let i=0;i<2;i++){const p=skateParts[i],f=feet[i],[sx,sy,sw,sh]=p.crop;if(pelvisAngle){c.save();c.translate(f.x,f.y);c.rotate(-pelvisAngle);c.drawImage(atlas,sx,sy,sw,sh,-(p.anchor[0]-sx)*SPRITE_SCALE,-(p.anchor[1]-sy)*SPRITE_SCALE,sw*SPRITE_SCALE,sh*SPRITE_SCALE);c.restore();}else c.drawImage(atlas,sx,sy,sw,sh,f.x-(p.anchor[0]-sx)*SPRITE_SCALE,f.y-(p.anchor[1]-sy)*SPRITE_SCALE,sw*SPRITE_SCALE,sh*SPRITE_SCALE);}
 if(suppressUpper){c.restore();return;}
 for(const[index,weight,rotation]of[[0,1-winWeight,lean],[3,winWeight,bow*.6]]){if(weight<=0)continue;c.save();c.translate(0,pose.drop);c.translate(0,-112);c.rotate(rotation);c.translate(0,112);drawUpper(c,index,weight);if(load){c.save();c.globalAlpha*=weight;drawLoad(c,load.step,frames[index].plates,load.settle,load.arrive,load.motion,load.wobble);c.restore();}c.restore();}
 c.restore();
}
function drawPose(c,index,weight,load){if(weight<=0)return;const frame=index===2?1:0;drawSprite(c,frame,weight);if(load){c.save();c.globalAlpha*=weight;drawLoad(c,load.step,frames[frame].plates,load.settle,load.arrive,load.motion,load.wobble);c.restore();}}
function lossTalkWeight(lost,age,voiceActive,reduced){
 if(!lost){lossTalkState={lost:false,age:0,heard:false,start:null};return 0;}
 if(!lossTalkState.lost||age<lossTalkState.age-50)lossTalkState={lost:true,age,heard:false,start:null};
 lossTalkState.lost=true;lossTalkState.age=age;if(voiceActive)lossTalkState.heard=true;
 // Use the same seated drawing from impact through speech. The arms and head
 // prepare the shrug before the recording starts, rather than changing sprites
 // abruptly at the first phoneme.
 const ready=lossReaction.complete&&lossReaction.naturalWidth>0;
 return ready?(reduced?1:ease((age-350)/300)):0;
}
function drawLossMouth(c,level){
 const opening=clamp((level-.055)/.78);if(opening<=0)return;
 const wide=23+opening*2,high=1.8+opening*14;
 c.save();c.translate(791,322);c.rotate(-.23);
 // Keep the opening underneath the existing moustache, whose outline stays intact.
 c.beginPath();c.moveTo(-34,0);c.lineTo(-15,-13);c.lineTo(7,-14);c.lineTo(32,-7);c.lineTo(34,30);c.lineTo(-34,30);c.closePath();c.clip();
 c.beginPath();c.ellipse(0,0,wide,high,0,0,Math.PI*2);c.fillStyle='#53251c';c.fill();c.strokeStyle='#5e2b20';c.lineWidth=1.4;c.stroke();
 c.save();c.beginPath();c.ellipse(0,0,wide-1,Math.max(.6,high-1),0,0,Math.PI*2);c.clip();
 if(opening>.18){c.beginPath();c.moveTo(-wide,-high);c.lineTo(wide,-high);c.lineTo(wide,-high+4.2);c.quadraticCurveTo(0,-high+8,-wide,-high+4.2);c.closePath();c.fillStyle='#fff0cf';c.fill();}
 if(opening>.38){c.beginPath();c.ellipse(3,high-2,wide*.58,high*.31,0,0,Math.PI*2);c.fillStyle='#ce7563';c.fill();}
 c.restore();c.restore();
}
const lossParts={
 left:[[145,312],[567,312],[618,346],[650,397],[655,451],[634,505],[590,570],[539,622],[446,637],[341,593],[287,488],[145,488]],
 right:[[858,322],[1445,322],[1445,496],[1160,496],[1137,561],[1101,626],[1036,641],[983,603],[966,537],[930,491],[917,451],[906,398],[858,375]],
 head:[[510,0],[930,0],[930,330],[893,346],[870,359],[855,385],[835,399],[793,410],[740,400],[700,375],[663,356],[627,353],[583,339],[535,317]]
};
function lossRegion(c,region){c.beginPath();region.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip();}
function hideCrouchHead(c){
 const polygon=[[558,248],[750,248],[750,436],[718,458],[667,462],[609,438],[563,431],[547,395],[547,336]];
 c.beginPath();c.rect(-1000,-1000,2000,2000);polygon.forEach((p,i)=>{const x=(p[0]-655)*SPRITE_SCALE,y=(p[1]-812)*SPRITE_SCALE;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip('evenodd');
}
function lossPiece(c,region,pivot,rotation,scaleX=1){
 c.save();c.translate(...pivot);c.rotate(rotation);c.scale(scaleX,1);c.translate(-pivot[0],-pivot[1]);lossRegion(c,region);c.drawImage(lossReaction,0,0);c.restore();
}
const lossBracePalm=[[953,704],[980,709],[981,720],[972,730],[959,734],[951,744],[944,748],[936,748],[930,744],[932,738],[915,740],[905,742],[892,743],[882,741],[875,738],[871,734],[872,730],[887,721],[912,714],[940,712]];
const lossOpenPalms={left:[[172,393],[185,382],[210,382],[241,390],[274,388],[277,365],[280,343],[293,338],[308,342],[321,353],[335,361],[350,370],[363,384],[374,405],[375,424],[364,444],[341,451],[310,457],[277,456],[245,451],[215,440],[192,426],[179,413]],right:[[1141,403],[1152,386],[1169,376],[1190,369],[1217,360],[1231,362],[1237,372],[1235,383],[1222,395],[1223,402],[1252,402],[1284,391],[1311,382],[1335,385],[1348,394],[1352,405],[1344,420],[1331,433],[1311,449],[1284,460],[1259,467],[1231,466],[1207,459],[1182,447],[1160,438],[1143,423]]};
function drawLossBracePalm(c,w,side,raise,opacity){
 if(opacity<=0)return;c.save();c.globalAlpha*=opacity;c.translate(w.x,w.y);c.rotate((side==='left'?1:-1)*.5*raise);const size=2-.2*raise;c.scale(side==='left'?size:-size,size);c.translate(-965,-716);lossRegion(c,lossBracePalm);c.drawImage(atlas,0,0,1774,887);c.restore();
}
function lossArmBonePoint(p,a,b,A,B){
 const x=b.x-a.x,y=b.y-a.y,d=Math.hypot(x,y),u={x:x/d,y:y/d},vx=B.x-A.x,vy=B.y-A.y,D=Math.hypot(vx,vy),v={x:vx/D,y:vy/D},px=p.x-a.x,py=p.y-a.y,t=(px*u.x+py*u.y)/d,n=-px*u.y+py*u.x;
 return{x:A.x+vx*t-v.y*n,y:A.y+vy*t+v.x*n};
}
function lossArmDistance(p,a,b){const x=b.x-a.x,y=b.y-a.y,t=clamp(((p.x-a.x)*x+(p.y-a.y)*y)/(x*x+y*y));return Math.hypot(p.x-a.x-x*t,p.y-a.y-y*t);}
function lossArmVertex(p,s,e,w,S,E,W){
 const a=lossArmBonePoint(p,s,e,S,E),b=lossArmBonePoint(p,e,w,E,W),dU=lossArmDistance(p,s,e),dF=lossArmDistance(p,e,w),upper=ease(.5+(dF-dU)/70);
 return{x:b.x+(a.x-b.x)*upper,y:b.y+(a.y-b.y)*upper};
}
function lossArmTriangle(c,source,target,side){
 const[p,q,r]=source,[P,Q,R]=target,den=(q.x-p.x)*(r.y-p.y)-(r.x-p.x)*(q.y-p.y);if(Math.abs(den)<.001)return;
 const a=((Q.x-P.x)*(r.y-p.y)-(R.x-P.x)*(q.y-p.y))/den,b=((Q.y-P.y)*(r.y-p.y)-(R.y-P.y)*(q.y-p.y))/den,cc=((R.x-P.x)*(q.x-p.x)-(Q.x-P.x)*(r.x-p.x))/den,d=((R.y-P.y)*(q.x-p.x)-(Q.y-P.y)*(r.x-p.x))/den;
 c.save();c.transform(a,b,cc,d,P.x-a*p.x-cc*p.y,P.y-b*p.x-d*p.y);
 const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};c.beginPath();source.forEach((v,i)=>{const dx=v.x-center.x,dy=v.y-center.y,length=Math.hypot(dx,dy),x=v.x+dx/length*.9,y=v.y+dy/length*.9;i?c.lineTo(x,y):c.moveTo(x,y);});c.closePath();c.clip();lossRegion(c,lossParts[side]);c.beginPath();c.rect(0,0,1536,1024);lossOpenPalms[side].forEach((v,i)=>i?c.lineTo(...v):c.moveTo(...v));c.closePath();c.clip('evenodd');c.drawImage(lossReaction,0,0);c.restore();
}
function drawJointedLossArm(c,side,raise){
 if(raise>=.99999){lossPiece(c,lossParts[side],side==='left'?[597,403]:[936,409],0);return;}
 const left=side==='left',mix=(a,b)=>a+(b-a)*raise,s=left?{x:597,y:403}:{x:936,y:409},e=left?{x:452,y:548}:{x:1071,y:555},w=left?{x:345,y:428}:{x:1174,y:433},E=left?{x:mix(553,452),y:mix(614,548)}:{x:mix(995,1071),y:mix(616,555)},W=left?{x:mix(447,345),y:mix(779,428)}:{x:mix(1108,1174),y:mix(779,433)},turn=ease((raise-.45)/.38);
 drawLossBracePalm(c,W,side,raise,1-turn);
 const x0=left?144:852,x1=left?660:1452,y0=312,y1=648,size=48;
 for(let y=y0;y<y1;y+=size)for(let x=x0;x<x1;x+=size){const p={x,y},q={x:Math.min(x+size,x1),y},r={x:Math.min(x+size,x1),y:Math.min(y+size,y1)},t={x,y:Math.min(y+size,y1)},v=[p,q,r,t],dest=v.map(p=>lossArmVertex(p,s,e,w,s,E,W));lossArmTriangle(c,[p,q,r],[dest[0],dest[1],dest[2]],side);lossArmTriangle(c,[p,r,t],[dest[0],dest[2],dest[3]],side);}
 if(turn>0){c.save();c.globalAlpha*=turn;c.translate(W.x-w.x,W.y-w.y);lossRegion(c,lossOpenPalms[side]);c.drawImage(lossReaction,0,0);c.restore();}
}
function drawLossReaction(c,weight,voiceActive,voiceLevel,voiceTime,reduced,floorY=0,age=2600,impactShift={x:0,y:0}){
 if((weight<=0&&age<350)||!lossReaction.complete||!lossReaction.naturalWidth)return;
 const opacity=c.globalAlpha,level=voiceActive?clamp(Number(voiceLevel)||0):0,t=Number(voiceTime)||0;
 const leftRaise=reduced?1:ease((age-930)/920),rightRaise=reduced?1:ease((age-1060)/840);
 const bob=reduced?0:level*2.6*Math.sin(t*21),sway=reduced?0:level*.002*Math.sin(t*8),headTurn=reduced?1:ease((age-860)/900);
 c.save();c.globalAlpha*=weight;c.translate(impactShift.x,floorY+impactShift.y);c.scale(.22,.22);c.translate(-800,-983);
 // One continuous seated silhouette: feet and pelvis never switch drawings.
 // Flat palms brace behind the shins. Textured upper arms and forearms then
 // bend at separate joints; only the wrist turns over into the final shrug.
 drawJointedLossArm(c,'left',leftRaise);
 drawJointedLossArm(c,'right',rightRaise);
 c.save();for(const region of Object.values(lossParts)){c.beginPath();c.rect(0,0,1536,1024);region.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.clip('evenodd');}c.drawImage(lossReaction,0,0);c.restore();
 c.save();c.translate(800,714);c.rotate(sway);c.translate(-800,-714-bob);
 // The head slowly rights itself before he addresses the player. No duplicate
 // head is cross-faded at voice start, and the mouth stays on this same head.
 c.save();c.globalAlpha=opacity;c.translate(774,375);c.rotate(.14*(1-headTurn));c.scale(reduced?1:.86+.07*ease((age-350)/300)+.07*headTurn,1);c.translate(-774,-375);lossRegion(c,lossParts.head);c.drawImage(lossReaction,0,0);drawLossMouth(c,level);c.restore();
 c.restore();c.restore();
}
function drawOutcome(c,lost,weight,collapse,bow,loadStep){
 if(weight<=0)return;
 c.save();if(lost)c.translate(0,collapse.y);else c.rotate(bow*.5);drawSprite(c,lost?2:3,weight);c.restore();
 if(!lost){c.save();c.globalAlpha*=weight;c.rotate(bow*.5);drawLoad(c,loadStep,loadAnchors.win);c.restore();}
}
const WIN_HEAD_REGION=[[90,180],[292,180],[292,323],[287,347],[273,359],[264,363],[267,377],[253,377],[218,369],[195,364],[177,358],[158,361],[137,352],[128,338],[126,316],[114,308],[105,285],[98,267]];
const WIN_TORSO_REGIONS=[[[177,356],[195,362],[218,367],[254,374],[253,366],[252,359],[259,356],[269,361],[280,368],[292,375],[300,380],[309,385],[316,390],[323,395],[329,400],[334,405],[338,410],[343,415],[350,420],[356,425],[361,430],[366,435],[369,440],[373,445],[376,450],[378,455],[380,460],[383,465],[384,470],[385,475],[386,480],[387,490],[387,500],[386,510],[384,520],[381,530],[375,540],[367,533],[347,540],[323,544],[299,548],[279,555],[254,548],[230,540],[211,533],[193,522],[177,509],[159,513],[153,507],[150,498],[150,487],[158,479],[164,474],[175,474],[187,478],[194,480],[185,472],[177,463],[171,455],[183,455],[191,456],[200,452],[206,443],[210,430],[210,415],[207,400],[203,389],[196,379],[187,373],[179,371]],[[180,508],[192,518],[184,540],[179,559],[177,576],[183,594],[187,610],[184,622],[170,622],[159,615],[149,609],[148,601],[138,595],[130,587],[127,583],[132,574],[149,545],[168,518]],[[340,540],[362,533],[369,543],[382,567],[395,589],[405,613],[407,620],[394,625],[396,633],[387,637],[376,636],[358,644],[352,644],[348,624],[347,600],[344,573]]];
function drawWinTorso(c){for(const region of WIN_TORSO_REGIONS)winSource(c,region);}
let winEntry=null;
const winArmParts={
 left:{shoulder:[181,411],wrist:[106,384],proximal:[[116,379],[125,399],[139,389],[152,380],[170,373],[188,378],[201,392],[209,414],[207,436],[198,455],[181,466],[171,482],[149,493],[126,495],[108,491],[97,482],[90,468],[86,442],[82,407],[80,387],[95,389],[107,383]],hand:[[14,354],[116,354],[119,375],[115,392],[95,395],[81,386],[49,380],[26,370],[14,361]],tray:[75,348,76,16],hole:[[0,330],[139,330],[145,337],[145,356],[121,365],[119,375],[115,392],[125,399],[139,389],[152,380],[170,373],[188,378],[201,392],[209,414],[207,436],[198,455],[181,466],[171,482],[149,493],[126,495],[108,491],[97,482],[90,468],[86,442],[82,407],[80,387],[49,380],[26,370],[14,361],[0,361]]},
 right:{shoulder:[350,414],wrist:[377,381],proximal:[[344,401],[359,399],[360,377],[394,377],[398,425],[401,445],[399,456],[391,468],[380,475],[378,465],[370,451],[359,438],[347,427],[341,420],[339,410]],hand:[[322,354],[442,354],[431,365],[411,373],[395,377],[394,394],[364,394],[358,377],[342,372],[325,363]],tray:[372,348,77,16],hole:[[295,332],[451,332],[451,361],[431,365],[411,373],[395,377],[398,425],[401,445],[399,456],[391,468],[380,475],[378,465],[370,451],[359,438],[347,427],[341,420],[339,410],[344,401],[359,399],[360,377],[358,377],[342,372],[325,363],[300,358]]}
};
const winLocal=p=>[(p[0]-frames[0].foot[0])*SPRITE_SCALE,(p[1]-frames[0].foot[1])*SPRITE_SCALE];
const WIN_RAIN_PLATES=112;
const throwArmParts=[
 {shoulder:[181,411],elbow:[120,458],wrist:[106,384],hipElbow:[132,463],hipWrist:[177,510],upper:[[120,405],[139,389],[152,380],[170,373],[188,378],[201,392],[209,414],[207,436],[198,455],[181,466],[171,482],[149,493],[126,495],[108,491],[97,482],[90,468],[88,449],[97,454],[109,466],[121,475],[134,470],[145,455],[146,438],[139,424]],forearm:[[82,381],[112,380],[116,395],[123,407],[137,422],[146,440],[146,453],[138,468],[125,476],[111,473],[99,464],[92,451],[88,433]],hand:[[26,366],[75,369],[112,365],[119,375],[115,392],[95,395],[81,386],[49,380],[26,370]]},
 {shoulder:[350,414],elbow:[383,444],wrist:[377,381],hipElbow:[405,475],hipWrist:[380,520],upper:[[344,401],[360,399],[362,412],[377,430],[389,442],[399,434],[401,445],[399,456],[391,468],[380,475],[378,465],[370,451],[359,438],[347,427],[341,420],[339,410]],forearm:[[360,379],[394,379],[398,425],[396,439],[389,449],[380,443],[367,429],[359,414]],hand:[[329,366],[376,369],[436,365],[429,371],[411,377],[395,381],[394,394],[364,394],[358,380],[342,374]]}
];
function winPath(c,polygon,local=false){polygon.forEach((p,i)=>{const q=local?winLocal(p):p;i?c.lineTo(...q):c.moveTo(...q);});c.closePath();}
function winSource(c,polygon,exclude){
 c.save();c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frames[0].foot[0],-frames[0].foot[1]);
 c.beginPath();winPath(c,polygon);c.clip();
 if(exclude){c.beginPath();c.rect(-300,-300,1100,1500);winPath(c,exclude);c.clip('evenodd');}
 c.save();clipBakedPlates(c,0);c.drawImage(atlas,0,0,1774,887);c.restore();c.restore();
}
function winTray(c,part){
 // A tray has no character pixels. The old atlas crop also contained the ear
 // behind its right rim, which must never leave with the thrown crockery.
 const [x,y,rx,ry]=part.tray;
 c.save();c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frames[0].foot[0],-frames[0].foot[1]);
 const metal=c.createLinearGradient(x,y-ry,x,y+ry);metal.addColorStop(0,'#494f4c');metal.addColorStop(.48,'#222827');metal.addColorStop(1,'#111716');
 c.beginPath();c.ellipse(x,y+2,rx,ry*.85,0,0,Math.PI*2);c.fillStyle=metal;c.fill();c.strokeStyle='#101615';c.lineWidth=3.2;c.stroke();
 c.beginPath();c.ellipse(x,y-3,rx-2,ry*.58,0,0,Math.PI*2);c.fillStyle='#303735';c.fill();c.strokeStyle='#555e58';c.lineWidth=2.2;c.stroke();
 c.beginPath();c.ellipse(x,y-3,rx-11,ry*.37,0,0,Math.PI*2);c.strokeStyle='#151d1a';c.lineWidth=2;c.stroke();c.restore();
}
function drawWinHead(c){
 c.save();c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frames[0].foot[0],-frames[0].foot[1]);
 c.beginPath();winPath(c,WIN_HEAD_REGION);c.clip();
 // Complete the tiny area that the original tray covered, underneath the
 // original textured head. Every visible hair, face and ear pixel stays fixed.
 const hair=c.createLinearGradient(112,260,154,310);hair.addColorStop(0,'#623018');hair.addColorStop(1,'#472515');c.fillStyle=hair;c.strokeStyle='#351e14';c.lineWidth=2.1;
 c.beginPath();c.moveTo(129,244);c.bezierCurveTo(120,255,113,257,109,247);c.bezierCurveTo(106,262,112,268,119,273);c.bezierCurveTo(113,276,118,287,123,291);c.bezierCurveTo(120,305,130,316,143,322);c.lineTo(157,314);c.lineTo(155,259);c.closePath();c.fill();c.stroke();
 const ear=c.createLinearGradient(133,317,166,356);ear.addColorStop(0,'#ffbe7b');ear.addColorStop(1,'#ec965b');c.fillStyle=ear;c.strokeStyle='#67341f';c.lineWidth=2.3;
 c.beginPath();c.moveTo(151,315);c.bezierCurveTo(138,313,129,321,129,333);c.bezierCurveTo(129,346,143,356,155,355);c.bezierCurveTo(169,354,176,344,173,333);c.bezierCurveTo(171,321,161,315,151,315);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#bd6538';c.lineWidth=1.7;c.beginPath();c.moveTo(138,334);c.bezierCurveTo(137,324,149,322,155,330);c.bezierCurveTo(148,329,147,339,156,340);c.stroke();
 c.save();clipBakedPlates(c,0);c.beginPath();c.rect(0,0,1774,887);c.moveTo(153,348);c.ellipse(75,348,78,18,0,0,Math.PI*2);c.closePath();c.rect(294,304,160,66);c.clip('evenodd');c.drawImage(atlas,0,0,1774,887);c.restore();c.restore();
}
function drawWinForearm(c,part,j){
 // A continuous skin underlay closes the elbow/wrist seams; the original
 // forearm texture then follows the same two endpoints above the torso.
 const [ax,ay]=j.elbow,[bx,by]=j.wrist,dx=bx-ax,dy=by-ay,d=Math.max(.001,Math.hypot(dx,dy)),nx=-dy/d,ny=dx/d,r=8.2,w=6.4;
 const skin=c.createLinearGradient(ax+nx*r,ay+ny*r,ax-nx*r,ay-ny*r);skin.addColorStop(0,'#ffb66b');skin.addColorStop(1,'#eb9553');
 c.beginPath();c.moveTo(ax+nx*r,ay+ny*r);c.lineTo(bx+nx*w,by+ny*w);c.quadraticCurveTo(bx+dx/d*w,by+dy/d*w,bx-nx*w,by-ny*w);c.lineTo(ax-nx*r,ay-ny*r);c.quadraticCurveTo(ax-dx/d*r,ay-dy/d*r,ax+nx*r,ay+ny*r);c.closePath();c.fillStyle=skin;c.fill();c.strokeStyle='#693820';c.lineWidth=1.1;c.stroke();
 // Raised forearms use this clean continuous skin shape; the old bent-arm
 // texture included a white cuff triangle that cannot rotate into bare skin.
 c.strokeStyle='#bd7542';c.lineWidth=.6;c.beginPath();c.moveTo(ax+nx*r*.35,ay+ny*r*.35);c.quadraticCurveTo(ax+dx*.12,ay+dy*.12,ax-nx*r*.3,ay-ny*r*.3);c.stroke();
}
function drawWinSleeve(c,side,j){
 // One filled cloth shape reaches the elbow. Rotated cutout cuffs had exposed
 // empty crescent shapes instead of a connected sleeve.
 const dx=j.elbow[0]-j.shoulder[0],dy=j.elbow[1]-j.shoulder[1],length=Math.hypot(dx,dy),r=side?10.8:14.3,end=side?10:11.6;
 c.save();c.translate(...j.shoulder);c.rotate(Math.atan2(dy,dx));
 const fabric=c.createLinearGradient(0,-r,0,r);fabric.addColorStop(0,'#fffced');fabric.addColorStop(.55,'#fff5dd');fabric.addColorStop(1,'#dfd1b4');c.fillStyle=fabric;c.strokeStyle='#5c4933';c.lineWidth=1.3;
 c.beginPath();c.moveTo(0,-r);c.bezierCurveTo(length*.35,-r,length*.72,-end,length,-end);c.quadraticCurveTo(length+end*.7,0,length,end);c.bezierCurveTo(length*.72,end,length*.35,r,0,r);c.quadraticCurveTo(-r*.8,0,0,-r);c.closePath();c.fill();c.stroke();
 c.strokeStyle='#b9ac90';c.lineWidth=.75;c.beginPath();c.moveTo(length*.38,-r*.64);c.quadraticCurveTo(length*.58,-r*.18,length*.68,-end*.14);c.moveTo(length*.54,r*.64);c.quadraticCurveTo(length*.67,r*.34,length*.78,end*.44);c.stroke();
 c.beginPath();c.ellipse(length-1,0,4.2,end,0,0,Math.PI*2);c.fillStyle='#fff8e5';c.fill();c.strokeStyle='#756148';c.lineWidth=1.05;c.stroke();c.restore();
}
function drawStrongWinGlow(c,age,reduced){
 const fade=ease((age-80)/350);if(fade<=0)return;const phase=Math.PI*2*(age-80)/2800,breath=reduced?0:Math.sin(phase),radius=220*(1+.085*breath),strength=fade*(.94+.06*breath),center=throwChoreography(age,reduced).danceX||0;
 c.save();c.globalAlpha*=strength;
 const halo=c.createRadialGradient(center,-155,12,center,-155,radius);halo.addColorStop(0,'#ffe9a899');halo.addColorStop(.35,'#ffdb7352');halo.addColorStop(.72,'#eabe541a');halo.addColorStop(1,'#eabe5400');
 c.beginPath();c.arc(center,-155,radius,0,Math.PI*2);c.fillStyle=halo;c.fill();c.restore();
}
function drawWinShoulderBridge(c){
 // A complete opaque shirt yoke, including the armpit, joins the moving
 // left sleeve to the original torso. The vest is painted over its inner edge.
 // Its lower edge spans the full old-arm erasure, rather than stopping at y443.
 c.save();c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frames[0].foot[0],-frames[0].foot[1]);
 const fabric=c.createLinearGradient(155,388,213,472);fabric.addColorStop(0,'#fffced');fabric.addColorStop(.58,'#fff5dd');fabric.addColorStop(1,'#e6d9bc');
 c.beginPath();c.moveTo(177,373);c.bezierCurveTo(199,374,217,398,218,425);c.lineTo(215,466);c.bezierCurveTo(203,479,189,490,177,483);c.bezierCurveTo(165,475,153,452,151,433);c.bezierCurveTo(147,412,148,391,160,380);c.quadraticCurveTo(169,372,177,373);c.closePath();c.fillStyle=fabric;c.fill();c.strokeStyle='#68533a';c.lineWidth=2.5;c.stroke();
 c.strokeStyle='#c3b697';c.lineWidth=1.3;c.beginPath();c.moveTo(177,449);c.quadraticCurveTo(180,460,190,466);c.stroke();c.restore();
}

function winRainBounds(view){const visible=(view.width||900)*600/(view.height||600),left=(900-visible)/2,unit=Math.max(.01,Math.abs(view.scale||1));return{left:(left-view.x)/unit,right:(left+visible-view.x)/unit,top:-view.y/unit,floor:(470-view.y)/unit,bottom:(625-view.y)/unit};}
function winShardPose(age,i,j,view){
 const platePose=winRainPose(age,i,view);if(!platePose||platePose.flight)return null;
 const b=winRainBounds(view),t=platePose.after,size=2.7+((i*3+j*7)%9)*.45,sign=(i+j)%2?1:-1,ground=b.floor+Math.max(0,Math.min(24,i%5*6+(j%3-1)*2)),vx=sign*(30+(i*17+j*29)%70),up=36+(i*13+j*19)%66,g=420;
 let remaining=t,v=up,bounceHeight=0;for(let bounce=0;bounce<5;bounce++){const duration=2*v/g;if(remaining<duration){bounceHeight=Math.max(0,v*remaining-.5*g*remaining*remaining);break;}remaining-=duration;v*=.38;if(v<1.5)break;}
 const rotation=i*.73+j*1.71+sign*(5+(i+j)%5)/3*(1-Math.exp(-3*t)),co=Math.cos(rotation),si=Math.sin(rotation),vertices=[[-size,-size*.35],[size*.45,-size*.65],[size,size*.45],[-size*.4,size*.65]],hull=Math.max(...vertices.map(p=>p[0]*si+p[1]*co));
 const impactX=platePose.impactX+(j-3)*platePose.size*.12,x=Math.max(b.left+size+2,Math.min(b.right-size-2,impactX+vx/2.8*(1-Math.exp(-2.8*t)))),y=ground-hull-bounceHeight;
 return{x,y,rotation,size,ground,bottom:y+hull,bounceHeight,alive:true};
}
function winRainPose(age,i,view){
 const b=winRainBounds(view),start=800+i*9+(i%4)*16,t=(age-start)/1000;if(t<0)return null;
 const q=((i*73)%WIN_RAIN_PLATES+.5)/WIN_RAIN_PLATES,front=i%3===0;
 let x=b.left+14+(b.right-b.left-28)*q,drift=Math.sin(i*2.39996)*22;if(front&&x>-62&&x<65)x=x<0?-74:78;
 const y0=b.top-30-(i%3)*12,vy=130+i%5*10,g=400,size=11.5+(i%6)*1.5,surface=b.floor+(i%5)*6,spin=i%2?2.7:-3.1,initialRotation=i*.73,hull=r=>size*(Math.abs(Math.sin(r))+.34*Math.abs(Math.cos(r))),freeY=s=>y0+vy*s+.5*g*s*s;
 let lo=0,hi=3.5;for(let k=0;k<15;k++){const m=(lo+hi)/2;if(freeY(m)+hull(initialRotation+m*spin)>=surface)hi=m;else lo=m;}const hit=(lo+hi)/2,flight=t<hit,impactX=x+drift*hit;
 return{front,x:x+drift*Math.min(t,hit),y:freeY(Math.min(t,hit)),rotation:initialRotation+Math.min(t,hit)*spin,size,alive:true,start,hit,surface,bottom:flight?freeY(t)+hull(initialRotation+t*spin):surface,flight,after:Math.max(0,t-hit),impactX};
}
function drawWinRain(c,age,reduced,view,front){
 if(reduced)return;for(let i=0;i<WIN_RAIN_PLATES;i++){
  const p=winRainPose(age,i,view);if(!p||p.front!==front)continue;
  if(p.flight){c.save();if(!front)c.globalAlpha*=.86;plate(c,p.x,p.y,p.rotation,p.size);c.restore();continue;}
  // At the FIRST floor contact the whole plate is gone; seven jagged pieces
  // rebound independently, slide with friction, and stay on the actual floor.
  for(let j=0;j<7;j++){const s=winShardPose(age,i,j,view);shard(c,s.x,s.y,s.rotation,s.size);}
  if(p.after<.12){const u=p.after/.12;c.save();c.globalAlpha*=1-u;for(let j=0;j<4;j++){c.fillStyle=j%2?'#f6e4b6':'#d9b462';c.beginPath();c.arc(p.impactX+(j-1.5)*8*u,p.surface-2-(7+j*2)*Math.sin(Math.PI*u),1.1,0,Math.PI*2);c.fill();}c.restore();}
 }
}
function throwPlacement(step,side,i,motion,wobble){
 const count=LOAD_BASE_PLATES+step*2,height=towerHeight(step)-23,spacing=height/(count-1),offsets=[-5,9,-10,6,-8,12,-3,7],angles=[-.09,.07,-.04,.115,-.07,.035],sign=side?1:-1,u=i/(count-1),phase=motion/710+side*.85,amp=motion?2.5*Math.min(1.45,wobble)*ease(motion/480):0,envelope=Math.pow(u,1.45),bend=phase-u*3.35;
 return{x:sign*(offsets[i%8]*.75+5*Math.sin(u*Math.PI)+3*u)+amp*envelope*Math.sin(bend),y:-10.7-i*spacing,tilt:sign*(angles[i%6]+.025*u)+amp*.009*envelope*Math.cos(bend),size:i===count-1?32:34+3.8*Math.sin((i%6)*1.15)};
}
function throwCargoOrigin(local,side,pose,release){
 const part=throwArmParts[side],j=throwJoints(part,side,release),wr=winLocal(part.wrist),p=[local[0]+j.wrist[0]-wr[0],local[1]+j.wrist[1]-wr[1]],world=throwRotate(p,[0,-112],release.lean);world[1]+=pose.drop+release.drop;return world;
}
function throwDishOrigin(step,side,p,pose,release){const sign=side?1:-1,anchor=frames[0].plates[side],local=throwRotate([p.x,p.y],[0,0],sign*.02);return throwCargoOrigin([local[0]+anchor[0],local[1]+anchor[1]],side,pose,release);}
function drawSeparateThrow(c,pose,load,age,reduced){
 const u=(age-140)/1000;if(reduced||u<0||u>1.7)return;
 const release=throwChoreography(140,false),count=LOAD_BASE_PLATES+load.step*2;
 for(let side=0;side<2;side++){
  const sign=side?1:-1,vx=side?365:-310,vy=side?-335:-355,gravity=90,part=throwArmParts[side],wr=winLocal(part.wrist),origin=throwCargoOrigin(wr,side,pose,release);
  // Each black tray takes a different diagonal and tumbles independently.
  c.save();c.translate(origin[0]+(side?335:-285)*u,origin[1]+(side?-305:-325)*u+gravity*u*u);c.rotate(release.lean+sign*2.1*u);c.translate(-wr[0],-wr[1]);winTray(c,side?winArmParts.right:winArmParts.left);c.restore();
  for(let i=0;i<count;i++){
   const p=throwPlacement(load.step,side,i,load.motion,load.wobble),origin=throwDishOrigin(load.step,side,p,pose,release),detach=Math.max(0,u-.045-i*.007),spread=Math.sin(i*2.39996+side)*42,extraUp=13+(i%5)*11;
   plate(c,origin[0]+vx*u+spread*detach,origin[1]+vy*u+gravity*u*u-extraUp*detach,release.lean+sign*.02+p.tilt+sign*.2*u+Math.sin(i*1.7)*detach*3,p.size);
  }
  // Cups, glasses and cutlery leave with the first fling and never rain back.
  const top=throwPlacement(load.step,side,count-1,load.motion,load.wobble),decorate=(relative,rotation,draw,scale=1,index=0)=>{
   const rel=throwRotate(relative,[0,0],top.tilt),p={x:top.x+rel[0],y:top.y+rel[1]},origin=throwDishOrigin(load.step,side,p,pose,release),t=Math.max(0,u-.045);
   c.save();c.translate(origin[0]+(vx+sign*(28+index*12))*u,origin[1]+(vy-38-index*18)*u+gravity*u*u);c.rotate(release.lean+sign*.02+top.tilt+rotation+sign*t*(2.4+index));c.scale(scale,scale);draw(c,0,0,0);c.restore();
  };
  decorate([-sign*12,8],-sign*.24,serviceCutlery,1,1);if(!side)decorate([-2,-3],-.08,serviceCup);else decorate([2,-3],.09,serviceGlass);
  if(load.step>=3){const nest=throwPlacement(load.step,side,count-6,load.motion,load.wobble),rel=throwRotate([sign*22,-2],[0,0],nest.tilt),origin=throwDishOrigin(load.step,side,{x:nest.x+rel[0],y:nest.y+rel[1]},pose,release);c.save();c.translate(origin[0]+(vx+sign*55)*u,origin[1]+(vy-60)*u+gravity*u*u);c.rotate(release.lean+sign*.02+nest.tilt+sign*.18+sign*u*3.1);c.scale(.82,.82);serviceCup(c,0,0);c.restore();}
 }
}
let winProjectiles=null,winProjectileStep=null,winProjectileAge=-1;
function coherentWinItems(pose,load){
 const release=throwChoreography(140,false),releaseRemain=1-ease(140/220),sampleRemain=1-ease(winProjectileAge/220);
 // Freeze the exact release body bob, lean, and travelling ceramic wave.
 // Resetting an offline review frame cannot move the launch anchors.
 pose={...pose,drop:pose.drop+(winEntry?.bob||0)*(releaseRemain-sampleRemain)};release.lean+=(winEntry?.lean||0)*releaseRemain;
 const releaseMotion=load.motion-550*(1-Math.exp(-Math.max(0,winProjectileAge)/600))+550*(1-Math.exp(-140/600)),frozen={...load,motion:releaseMotion},items=[],count=LOAD_BASE_PLATES+load.step*2;
 for(let side=0;side<2;side++){
  const sign=side?1:-1,part=side?winArmParts.right:winArmParts.left,center=winLocal(part.tray.slice(0,2)),tray=throwCargoOrigin(center,side,pose,release);
  items.push({id:'tray-'+side,kind:'tray',side,x:tray[0],y:tray[1],rotation:release.lean,size:part.tray[2]*SPRITE_SCALE,front:true});
  for(let i=0;i<count;i++){
   const p=throwPlacement(load.step,side,i,frozen.motion,frozen.wobble),origin=throwDishOrigin(load.step,side,p,pose,release);
   items.push({id:'plate-'+side+'-'+i,kind:'plate',side,x:origin[0],y:origin[1],rotation:release.lean+sign*.02+p.tilt,size:p.size,front:i%3===0});
  }
  const top=throwPlacement(load.step,side,count-1,frozen.motion,frozen.wobble),decorate=(kind,relative,rotation,scale=1,index=0)=>{
   const rel=throwRotate(relative,[0,0],top.tilt),origin=throwDishOrigin(load.step,side,{x:top.x+rel[0],y:top.y+rel[1]},pose,release);
   items.push({id:kind+'-'+side+'-'+index,kind,side,x:origin[0],y:origin[1],rotation:release.lean+sign*.02+top.tilt+rotation,scale,size:kind==='cutlery'?14:12,front:true});
  };
  decorate('cutlery',[-sign*12,8],-sign*.24);if(!side)decorate('cup',[-2,-3],-.08);else decorate('glass',[2,-3],.09);
  const nest=throwPlacement(load.step,side,count-6,frozen.motion,frozen.wobble),rel=throwRotate([sign*22,-2],[0,0],nest.tilt),origin=throwDishOrigin(load.step,side,{x:nest.x+rel[0],y:nest.y+rel[1]},pose,release);
  items.push({id:'cup-'+side+'-nest',kind:'cup',side,x:origin[0],y:origin[1],rotation:release.lean+sign*.02+nest.tilt+sign*.18,scale:.82,size:12,front:false});
 }
 return items;
}
function prepareCoherentWin(pose,load,age,view){
 if(!winProjectiles||winProjectileStep!==load.step||age<winProjectileAge){
  winProjectileAge=age;const bounds=winRainBounds(view),items=coherentWinItems(pose,load);winProjectiles=window.CashoutProjectiles.create({releaseMs:140,bounds,items});winProjectileStep=load.step;
  window.WinReview7={items,bounds,releaseMs:140,firstImpactMs:winProjectiles.firstImpactMs,lastImpactMs:winProjectiles.lastImpactMs,projectiles:winProjectiles};
 }
 winProjectileAge=age;return winProjectiles;
}
function drawCoherentWin(c,model,age,reduced,front){
 model.draw(c,age,{reduced,front,plate,shard,cup:serviceCup,glass:serviceGlass,cutlery:serviceCutlery,tray:(ctx,x,y,r,size,item)=>{const part=item.side?winArmParts.right:winArmParts.left,center=winLocal(part.tray.slice(0,2));ctx.translate(-center[0],-center[1]);winTray(ctx,part);}});
}
function throwChoreography(age,reduced,winMusicTime=null){
 const t=Math.max(0,age),dip=ease(t/60),snap=ease((t-60)/80),finish=ease((t-140)/120),settle=ease((t-220)/150),up=.72*snap+.28*finish,dancing=reduced?0:ease((t-521.739130435)/330),phase=Math.PI*2*(Number.isFinite(winMusicTime)?winMusicTime:t-521.739130435)/2086.956521739,beat=.5-.5*Math.cos(phase*4),danceX=15*Math.sin(phase)*dancing,danceDrop=(1+3.5*beat)*dancing;
 return{drop:reduced?0:3*dip-6*snap+3*settle+danceDrop,lean:reduced?0:-.012*dip+.024*snap-.012*settle+(-.065*Math.sin(phase)+.012*Math.sin(phase*2))*dancing,danceX,dancePhase:phase,danceWeight:dancing,headAngle:(.065*Math.sin(phase)-.035*Math.sin(phase*4))*dancing,headNod:(.5-.5*Math.cos(phase*4))*dancing,up:reduced?1:up,open:reduced?1:ease((t-95)/125),left:0,right:0,released:t>=140||reduced,releaseAge:140};
}
function throwRotate(p,o,angle){const x=p[0]-o[0],y=p[1]-o[1],co=Math.cos(angle),si=Math.sin(angle);return[o[0]+x*co-y*si,o[1]+x*si+y*co];}
function throwMix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];}
function throwJoints(part,side,a){
 const shoulder=winLocal(side?[307,393]:[196,412]),elbow=winLocal(part.elbow),wrist=winLocal(part.wrist),raised=side?{elbow:[420,327],wrist:[460,244]}:{elbow:[112,334],wrist:[77,251]};
 let E=throwMix(elbow,winLocal(raised.elbow),a.up),W=throwMix(wrist,winLocal(raised.wrist),a.up);const weight=a.danceWeight||0,phase=a.dancePhase||0;
 if(weight){
  // A four-beat disco phrase alternates an open arm with a folded-in arm.
  // The settled limb uses the same two bone lengths throughout the cycle.
  const fold=.5+.5*Math.sin(phase+(side?Math.PI:0)),target=winLocal(side?[446-52*fold,278-30*fold]:[96+20*fold,282-31*fold]),L1=side?47:45,L2=side?42:41,dx=target[0]-shoulder[0],dy=target[1]-shoulder[1],d=Math.max(.001,Math.hypot(dx,dy)),along=(L1*L1-L2*L2+d*d)/(2*d),bend=Math.sqrt(Math.max(0,L1*L1-along*along)),sign=side?1:-1,el=[shoulder[0]+dx/d*along-sign*dy/d*bend,shoulder[1]+dy/d*along+sign*dx/d*bend];
  E=throwMix(E,el,weight);W=throwMix(W,target,weight);
 }
 return{shoulder,elbow:E,wrist:W};
}
function throwSegment(c,polygon,sourceA,sourceB,targetA,targetB){
 const sa=winLocal(sourceA),sb=winLocal(sourceB),sd=Math.hypot(sb[0]-sa[0],sb[1]-sa[1]),td=Math.hypot(targetB[0]-targetA[0],targetB[1]-targetA[1]),sang=Math.atan2(sb[1]-sa[1],sb[0]-sa[0]),tang=Math.atan2(targetB[1]-targetA[1],targetB[0]-targetA[0]);
 c.save();c.translate(...targetA);c.rotate(tang);c.scale(td/sd,1);c.rotate(-sang);c.translate(-sa[0],-sa[1]);winSource(c,polygon);c.restore();
}
function throwBodyTransform(c,pose,a){c.translate(a.danceX||0,pose.drop+a.drop);c.translate(0,-112);c.rotate(a.lean);c.translate(0,112);}
function throwHand(c,part,side,j,a,load,held){
 const sourceWrist=winLocal(part.wrist),opening=a.open,angle=(side?1:-1)*(.9*(1-opening)+.12*opening);
 c.save();c.translate(...j.wrist);c.rotate(angle);c.scale(side?1:-1,.76);
 const skin=c.createLinearGradient(-13,-30,9,2);skin.addColorStop(0,'#ffc987');skin.addColorStop(.58,'#ffb46a');skin.addColorStop(1,'#ed9852');
 // Four separately rounded fingers and a thumb belong to this one filled palm.
 // They open continuously during the flick; no atlas finger or tray crop rotates.
 const fingers=[[-5,-15,-4-7*opening,-27-3*opening],[-2,-17,-2-2*opening,-28-9*opening],[2,-17,2+2*opening,-28-12*opening],[5,-14,4+9*opening,-26-6*opening]];
 c.lineCap='round';c.lineJoin='round';
 const fingerPaths=()=>{c.beginPath();for(const f of fingers){c.moveTo(f[0],f[1]);c.quadraticCurveTo((f[0]+f[2])*.5,f[3]+3,f[2],f[3]);}c.moveTo(-6,-8);c.quadraticCurveTo(-11-4*opening,-10-4*opening,-11-7*opening,-17-3*opening);};
 fingerPaths();c.strokeStyle='#713b24';c.lineWidth=6.1;c.stroke();fingerPaths();c.strokeStyle=skin;c.lineWidth=3.7;c.stroke();
 c.beginPath();c.moveTo(-5.5,4);c.lineTo(5.5,4);c.quadraticCurveTo(8,-3,7,-12);c.quadraticCurveTo(5,-20,0,-19);c.quadraticCurveTo(-6,-19,-7,-12);c.quadraticCurveTo(-8,-5,-5.5,4);c.closePath();c.fillStyle=skin;c.fill();c.strokeStyle='#713b24';c.lineWidth=1.25;c.stroke();
 c.strokeStyle='#b96d3e';c.lineWidth=.65;c.beginPath();c.moveTo(-4,-10);c.quadraticCurveTo(0,-13,5,-10);c.moveTo(-3,-4);c.quadraticCurveTo(0,-6,4,-5);c.moveTo(-5,-7);c.quadraticCurveTo(-1,-5,-2,-1);c.stroke();c.restore();
 if(held){c.save();c.translate(...j.wrist);c.translate(-sourceWrist[0],-sourceWrist[1]);winTray(c,side?winArmParts.right:winArmParts.left);drawLoad(c,load.step,frames[0].plates,load.settle,load.arrive,load.motion,load.wobble,side);c.restore();}
}
function organicHand(side,j,a){
 const wave=(a.danceWeight||0)*.14*(.5+.5*Math.sin((a.dancePhase||0)*2+side*Math.PI)),angle=(side?1:-1)*(.9*(1-a.open)+.12*a.open)+(side?-1:1)*wave,co=Math.cos(angle),si=Math.sin(angle),mirror=side?1:-1;
 const point=(x,y)=>{if(y< -12){x*=.28+.72*a.open;y=-8+(y+8)*(.72+.28*a.open);}x*=mirror;y*=.76;return[j.wrist[0]+x*co-y*si,j.wrist[1]+x*si+y*co];};
 const commands=[['M',-5.5,3],['C',-7,-4,-7,-10,-6.8,-14],['C',-9,-12,-15,-15,-18,-20],['Q',-21,-24,-18,-26],['Q',-15,-27,-12,-21],['L',-6,-15],['L',-13,-27],['Q',-15,-31,-12,-32],['Q',-9,-33,-8,-29],['L',-5.5,-21],['L',-6,-35],['Q',-6.3,-40,-3.2,-40],['Q',0,-40,0,-35],['L',.1,-23],['L',2,-39],['Q',2.4,-44,5.4,-43.5],['Q',8.4,-43,7.6,-38.5],['L',6.5,-22],['L',11,-33],['Q',12.5,-38,15.5,-36.5],['Q',18.5,-35,16.5,-30.5],['L',11.5,-13],['C',11,-6,7,-2,5.5,3]];
 return{point,commands:commands.map(([kind,...xy])=>[kind,...Array.from({length:xy.length/2},(_,i)=>point(xy[i*2],xy[i*2+1])).flat()]),a:point(-5.5,3),b:point(5.5,3)};
}
function organicSmooth(c,points,move=false){
 if(move)c.moveTo(...points[0]);for(let i=0;i<points.length-1;i++){const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];c.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6,p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6,...p2);}
}
function drawOrganicWinArm(c,side,j,a,noOutline=false){
 const unit=(p,q)=>{const dx=q[0]-p[0],dy=q[1]-p[1],d=Math.max(.001,Math.hypot(dx,dy));return[dx/d,dy/d,d];},u=unit(j.shoulder,j.elbow),v=unit(j.elbow,j.wrist),n=[-u[1],u[0]],f=[-v[1],v[0]],sum=[u[0]+v[0],u[1]+v[1]],sumLength=Math.max(.01,Math.hypot(...sum)),m=[-sum[1]/sumLength,sum[0]/sumLength],hand=organicHand(side,j,a),sign=(hand.a[0]-j.wrist[0])*f[0]+(hand.a[1]-j.wrist[1])*f[1]>0?1:-1;
 const add=(p,d,k)=>[p[0]+d[0]*k,p[1]+d[1]*k],mix=(p,q,k)=>[p[0]+(q[0]-p[0])*k,p[1]+(q[1]-p[1])*k],rootWidth=side?11.3:13.5,mid=mix(j.shoulder,j.elbow,.46),fore=mix(j.elbow,j.wrist,.55);
 const roots=(side?[[296,377],[345,433]]:[[188,367],[212,456]]).map(winLocal),score=p=>(p[0]-j.shoulder[0])*n[0]+(p[1]-j.shoulder[1])*n[1],positive=score(roots[0])>score(roots[1])?roots[0]:roots[1],negative=positive===roots[0]?roots[1]:roots[0];
 const edge=k=>[k>0?positive:negative,add(mid,n,(side?12.5:14)*k),add(j.elbow,m,10*k),add(fore,f,7.7*k)];
 const forward=[...edge(sign),hand.a],backward=[hand.b,...edge(-sign).reverse()];
 const trace=()=>{c.beginPath();organicSmooth(c,forward,true);for(const[kind,...p]of hand.commands.slice(1)){if(kind==='L')c.lineTo(...p);else if(kind==='Q')c.quadraticCurveTo(...p);else c.bezierCurveTo(...p);}organicSmooth(c,backward);};
 trace();const skin=c.createLinearGradient(j.wrist[0]-12,j.wrist[1],j.wrist[0]+14,j.wrist[1]+10);skin.addColorStop(0,'#ffc17d');skin.addColorStop(.6,'#ffb46b');skin.addColorStop(1,'#e99856');c.fillStyle=skin;c.fill();
 // Sleeve color lives inside this one continuous arm silhouette. No ring,
 // closed cap, palm rectangle, or separate outlined forearm is composited.
 c.save();trace();c.closePath();c.clip();
 const cuff=add(j.elbow,v,2.5),cuffA=add(cuff,f,12*sign),cuffB=add(cuff,f,-12*sign),clothForward=[...edge(sign).slice(0,3),cuffA],clothBack=[cuffB,...edge(-sign).slice(0,3).reverse()];
 c.beginPath();organicSmooth(c,clothForward,true);c.quadraticCurveTo(...add(cuff,v,3),...cuffB);organicSmooth(c,clothBack);c.closePath();const cloth=c.createLinearGradient(j.shoulder[0],j.shoulder[1]-20,j.elbow[0],j.elbow[1]+13);cloth.addColorStop(0,'#fffced');cloth.addColorStop(.6,'#fff4dc');cloth.addColorStop(1,'#ded0b2');c.fillStyle=cloth;c.fill();
 // The bare forearm passes naturally in front of the folded sleeve at a
 // bent elbow. Recolor it inside the SAME arm contour; no new outline or joint.
 c.beginPath();organicSmooth(c,[cuffA,add(fore,f,7.7*sign),hand.a],true);for(const[kind,...p]of hand.commands.slice(1)){if(kind==='L')c.lineTo(...p);else if(kind==='Q')c.quadraticCurveTo(...p);else c.bezierCurveTo(...p);}organicSmooth(c,[hand.b,add(fore,f,-7.7*sign),cuffB]);c.quadraticCurveTo(...add(cuff,v,3),...cuffA);c.closePath();c.fillStyle=skin;c.fill();
 c.beginPath();c.moveTo(...cuffA);c.quadraticCurveTo(...add(cuff,v,3),...cuffB);c.strokeStyle='#8a765a';c.lineWidth=.8;c.stroke();
 const fold=add(mid,n,rootWidth*.45);c.beginPath();c.moveTo(...add(fold,u,-4));c.quadraticCurveTo(...add(fold,n,-3),...add(fold,u,7));c.strokeStyle='#b6a98c88';c.lineWidth=.65;c.stroke();c.restore();
 if(!noOutline){trace();c.strokeStyle='#66472f';c.lineWidth=1.15;c.lineJoin='round';c.lineCap='round';c.stroke();}
 // Fine palm creases follow the same hand transform and have no wrist border.
 c.beginPath();c.moveTo(...hand.point(-4,-9));c.quadraticCurveTo(...hand.point(0,-12),...hand.point(5,-10));c.moveTo(...hand.point(-4,-5));c.quadraticCurveTo(...hand.point(0,-3),...hand.point(2,-6));c.strokeStyle='#b8734388';c.lineWidth=.55;c.stroke();
}
const naturalArmSurfaces=[];
function drawNaturalWinArm(c,side,j,a){
 const left=-140,top=-330,width=280,height=250,density=2,make=()=>{if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width*density,height*density);if(typeof document!=='undefined'){const v=document.createElement('canvas');v.width=width*density;v.height=height*density;return v;}return new c.canvas.constructor(width*density,height*density);};
 const pair=naturalArmSurfaces[side]||(naturalArmSurfaces[side]=[make(),make()]),surface=pair[0],mask=pair[1],g=surface.getContext('2d'),m=mask.getContext('2d');
 g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,surface.width,surface.height);g.setTransform(density,0,0,density,-left*density,-top*density);drawOrganicWinArm(g,side,j,a,true);
 m.setTransform(1,0,0,1,0,0);m.clearRect(0,0,mask.width,mask.height);m.drawImage(surface,0,0);m.globalCompositeOperation='source-in';m.fillStyle='#66472f';m.fillRect(0,0,mask.width,mask.height);m.globalCompositeOperation='source-over';
 // One outline of the entire opaque limb union, so a bent forearm cannot
 // leave an internal crossing line. The shoulder closure tucks into the shirt.
 const dx=j.elbow[0]-j.shoulder[0],dy=j.elbow[1]-j.shoulder[1],len=Math.hypot(dx,dy),u=[dx/len,dy/len],n=[-u[1],u[0]],p=(along,across)=>[j.shoulder[0]+u[0]*along+n[0]*across,j.shoulder[1]+u[1]*along+n[1]*across];
 c.save();for(let i=0;i<8;i++){const angle=i*Math.PI/4;c.drawImage(mask,left+Math.cos(angle)*1.05,top+Math.sin(angle)*1.05,width,height);}c.restore();c.drawImage(surface,left,top,width,height);
}
function drawWinDiscoGlasses(c,age,reduced){
 if(age<350&&!reduced)return;const fall=reduced?1:ease((age-350)/500),offset=-650*(1-fall),axis=-.5229,cx=208.895,cy=277.785;
 c.save();c.scale(SPRITE_SCALE,SPRITE_SCALE);c.translate(-frames[0].foot[0],-frames[0].foot[1]);c.translate(cx,cy+offset);c.rotate(axis);
 // Temple follows the real ear root, and bridge rests above the red nose.
 const ear=[148-cx,316-cy],co=Math.cos(-axis),si=Math.sin(-axis),ex=ear[0]*co-ear[1]*si,ey=ear[0]*si+ear[1]*co;
 c.beginPath();c.moveTo(-31,0);c.quadraticCurveTo(-43,4,ex,ey);c.strokeStyle='#8c601f';c.lineWidth=3.2;c.stroke();
 c.strokeStyle='#b4822d';c.lineWidth=3.2;c.fillStyle='#17282b';
 for(const[x,y,w,h]of[[-17.68,0,32,34],[17.68,0,27,30]]){c.beginPath();c.roundRect(x-w/2,y-h/2,w,h,7);c.fill();c.stroke();c.save();c.clip();c.strokeStyle='#768d8166';c.lineWidth=1.6;for(let k=-5;k<=5;k+=5){c.beginPath();c.moveTo(x-w/2+2,k);c.lineTo(x+w/2-2,k);c.stroke();}c.restore();}
 c.beginPath();c.moveTo(-2.8,-1);c.quadraticCurveTo(0,-6,4.5,-1);c.moveTo(29,-2);c.lineTo(34,-2);c.strokeStyle='#d5a948';c.lineWidth=2.8;c.stroke();c.restore();
}
function drawOrganicHeldLoad(c,side,j,load){const sourceWrist=winLocal(throwArmParts[side].wrist);c.save();c.translate(...j.wrist);c.translate(-sourceWrist[0],-sourceWrist[1]);winTray(c,side?winArmParts.right:winArmParts.left);drawLoad(c,load.step,frames[0].plates,load.settle,load.arrive,load.motion,load.wobble,side);c.restore();}
function drawThrowWin(c,pose,load,age,reduced,view={width:900,height:600,x:370,y:343,scale:.94},entryLean=0,winMusicTime=null){
 const projectiles=prepareCoherentWin(pose,load,age,view);drawCoherentWin(c,projectiles,age,reduced,false);

 const a=throwChoreography(age,reduced,winMusicTime);a.lean+=entryLean;
 const p={...pose,drop:pose.drop+a.drop,hipShift:a.danceX,pelvisAngle:a.danceWeight?a.lean:0,winIK:a.danceWeight};drawArticulated(c,p,null,{suppressUpper:true});
 c.save();throwBodyTransform(c,pose,a);
 const joints=throwArmParts.map((part,side)=>throwJoints(part,side,a));
 for(let side=0;side<2;side++)drawNaturalWinArm(c,side,joints[side],a);
 // Head is behind the fixed collar. Its mask contains skin, hair and ears only.
 c.save();c.beginPath();winPath(c,[[201,348],[247,350],[266,379],[247,389],[213,379]],true);c.fillStyle='#f3a366';c.fill();c.restore();
 const neck=winLocal([220,365]);c.save();c.translate(...neck);c.rotate(a.headAngle||0);c.scale(1,1-.018*(a.headNod||0));c.translate(-neck[0],-neck[1]);drawWinHead(c);c.restore();
 drawWinTorso(c);
 c.save();c.translate(...neck);c.rotate(a.headAngle||0);c.scale(1,1-.018*(a.headNod||0));c.translate(-neck[0],-neck[1]);drawWinDiscoGlasses(c,age,reduced);c.restore();
 if(!a.released)for(let side=0;side<2;side++)drawOrganicHeldLoad(c,side,joints[side],load);
 c.restore();
 drawCoherentWin(c,projectiles,age,reduced,true);

}
window.WaiterRig={winEffectInfo:()=>winProjectiles?{releaseMs:winProjectiles.releaseMs,firstImpactMs:winProjectiles.firstImpactMs,lastImpactMs:winProjectiles.lastImpactMs}:null,ready:()=>atlas.complete&&atlas.naturalWidth>0,draw(c,x,y,time,{flight=0,lost=false,age=0,caught=false,reduced=false,active=false,scale=1,progress=0,step=0,tickMilliseconds=1500,dropMilliseconds=260,preparing=false,introProgress=0,motionPhase=null,motionProgress=0,motionClock=null,table=null,transfer=null,width=900,height=600,voiceActive=false,voiceLevel=0,voiceTime=0,winMusicTime=null}={}){
 if(!atlas.complete||!atlas.naturalWidth)return;
 if(!caught){winProjectiles=null;winProjectileStep=null;winProjectileAge=-1;}
 const reactionWeight=lossTalkWeight(lost,age,voiceActive,reduced);
 const collapse=lossPose(age,reduced),bow=caught&&!reduced?Math.sin(Math.PI*clamp(age/1250))*.105:0,hasOutcomes=atlas.complete&&atlas.naturalWidth>0;
 const outcomeWeight=(lost||caught)&&hasOutcomes?(reduced?1:ease((age-(lost?350:160))/(lost?300:480))):0;
 const cycleTime=clamp(progress)*tickMilliseconds,dropAt=tickMilliseconds-dropMilliseconds;
 const phase=motionPhase||(flight>0?'drop':cycleTime<420?'hold':cycleTime<820?'step':'teeter');
 const phaseProgress=motionPhase?clamp(motionProgress):phase==='hold'?clamp(cycleTime/420):phase==='step'?clamp((cycleTime-420)/400):phase==='teeter'?clamp((cycleTime-820)/Math.max(1,dropAt-820)):clamp(flight);
 const intro=clamp(introProgress),loadStep=clamp(Math.floor(Number(step)||0)-(lost?1:0),0,73),landing=active&&loadStep>0&&!flight&&!preparing&&!reduced?clamp(cycleTime/200):1;
 const visualTime=typeof motionClock==='number'&&Number.isFinite(motionClock)?motionClock:time;
 const loadMotion=visualTime+(caught?550*(1-Math.exp(-Math.max(0,age)/600)):0);
 const load={step:loadStep,settle:Math.sin(Math.PI*landing)*(1-landing),arrive:ease(landing),motion:!reduced&&(active||preparing||caught)?loadMotion:0,wobble:preparing?1.8:phase==='teeter'?1+1.5*phaseProgress:phase==='drop'?1.9:phase==='step'?1.25:.7};
 c.save();c.translate(x,y);c.scale(scale,scale);if(caught)drawStrongWinGlow(c,age,reduced);
 if(lost){
  const floorY=Number.isFinite(table?.floor)?(table.floor-y)/Math.max(.01,Math.abs(scale)):18,ready=lossReaction.complete&&lossReaction.naturalWidth>0;
  // Both drawings track one facial pivot during the impact blend. This keeps
  // the head from doubling or sliding sideways when the body lands in the heap.
  const angle=collapse.a*(hasOutcomes?.35:1),oldFace={x:collapse.x+2.2*Math.cos(angle)+190.08*Math.sin(angle),y:collapse.y+2.2*Math.sin(angle)-190.08*Math.cos(angle)},newFace={x:-6.6,y:floorY-157.96},align={x:(newFace.x-oldFace.x)*reactionWeight,y:(newFace.y-oldFace.y)*reactionWeight},impactShift={x:(oldFace.x-newFace.x)*(1-reactionWeight),y:(oldFace.y-newFace.y)*(1-reactionWeight)};
  c.save();c.globalAlpha*=1-reactionWeight;c.translate(align.x,align.y);c.save();c.translate(collapse.x,collapse.y);c.rotate(angle);if(ready&&age>=350)hideCrouchHead(c);drawPose(c,2,ready?1:1-outcomeWeight,load);c.restore();if(!ready)drawOutcome(c,true,outcomeWeight,collapse,bow,loadStep);c.restore();
  drawLossReaction(c,reactionWeight,voiceActive,voiceLevel,voiceTime,reduced,floorY,age,impactShift);
 }
 else{const pose=articulatedPose(transfer,x,y,scale),holding=active&&!preparing&&cycleTime<1400;if(preparing&&!reduced)pose.drop+=2*Math.sin(Math.PI*intro);if(holding&&!reduced)pose.drop+=1.2*Math.sin(Math.PI*2*cycleTime/1400);const lean=reduced?0:preparing?.012*Math.sin(Math.PI*4*intro)*Math.sin(Math.PI*intro):holding?.009*Math.sin(Math.PI*2*cycleTime/1400):pose.phase==='weight'?.016:0;if(caught){
   const entry=winEntry?.step===loadStep?winEntry:null,remain=reduced?0:1-ease(age/220);
   if(entry){pose.drop+=entry.bob*remain;load.arrive=1-(1-entry.arrive)*remain;load.settle=entry.settle*remain;}
   drawThrowWin(c,pose,load,age,reduced,{width,height,x,y,scale},entry?entry.lean*remain:0,winMusicTime);
  }else{
   if(active)winEntry={step:loadStep,bob:pose.drop-(Number(transfer?.bodyDrop)||0)/Math.max(.01,Math.abs(scale)),lean,arrive:load.arrive,settle:load.settle};else winEntry=null;
   drawArticulated(c,pose,load,{winWeight:0,bow:0,lean});
  }}
 if(preparing){
  const visible=(Number(width)||900)*600/(Number(height)||600),viewLeft=(900-visible)/2,unit=Math.max(.01,Math.abs(Number(scale)||1));
  c.save();c.font='800 23px Arial,sans-serif';const callHalf=(c.measureText('Service!').width+34)/2;c.restore();
  const callX=(viewLeft+visible-18-x)/unit-callHalf,callY=(108-y)/unit,replyX=visible*.03/unit,replyY=(51-y)/unit;
  const call=reduced?0:ease((intro-.035)/.05)*(1-ease((intro-.31)/.06));
  const reply=reduced?1:ease((intro-.42)/.06)*(1-ease((intro-.79)/.07));
  if(call>0){c.save();c.globalAlpha*=call;sticker(c,callX,callY,'Service!','#285848',23);c.restore();}
  if(reply>0){c.save();c.globalAlpha*=reply;sticker(c,replyX,replyY,'Client!','#a3492f',23);c.restore();}
 }
 if(lost){const visible=(Number(width)||900)*600/(Number(height)||600),left=(900-visible)/2,unit=Math.max(.01,Math.abs(Number(scale)||1)),originY=Number.isFinite(table?.top)?(table.top-y)/unit:0,groundY=Number.isFinite(table?.floor)?(table.floor-y)/unit:0;drawSpill(c,age,reduced,outcomeWeight,loadStep,{left:(left-x)/unit,right:(left+visible-x)/unit,bottom:(600-y)/unit,originY,groundY});}
 c.restore();
}};
})();
