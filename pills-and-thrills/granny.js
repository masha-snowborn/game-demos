/* Pills & Thrills: hospital staircase and whole illustrated sketch-based poses. */
(()=>{'use strict';
const PITCH=220,RISE=64,CYCLE=2680,APPROACH=0;
const splashArt=new Image();splashArt.src='assets/hospital-splash-v4.png';
const splashPortrait=new Image();splashPortrait.src='assets/hospital-splash-portrait-v4.png';
const hospital=new Image();hospital.src='assets/hospital-decor-v6.png';
const atlas=new Image(),tumble=atlas;atlas.src='assets/granny-sketch-v6.png';
const angry=new Image();angry.src='assets/granny-angry-loss-v1.png';let angryPoses=[],angrySupport=[];
const armsAtlas=new Image();armsAtlas.src='assets/granny-lying-arms-v1.png';let armsPose=[],armsSupport=[];
const riseAtlas=new Image();riseAtlas.src='assets/granny-rise-v1.png';let riseSprites=[],riseFeet=[],gaitFoot=0;
const standingAtlas=new Image();standingAtlas.src='assets/granny-standing-v1.png';let standingSprites=[],standingFeet=[],standingScale=1;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=v=>{v=clamp(v);return v*v*(3-2*v);},mix=(a,b,v)=>a+(b-a)*v;
let waitingWalker={dx:52,dy:0,h:109},bodyCut=-.01;
const gaitAtlas=new Image();gaitAtlas.src='assets/granny-shuffle-v8.png';let gaitPoses=[],gaitHead=[],gaitSprites=[],gaitScale=1;
let poses=[],falls=[],lastCamera=0,heldTravel=0,heldStep=0,winFromCamera=0,previousActive=false,previousCaught=false,initialized=false;
let corridorPan=0,transferPan=0,wasLost=false,onFootStart=true,deliveredOnFoot=false;
const lifeAtlas=new Image();lifeAtlas.src='assets/granny-soul-v2.png';let lifeSprites=[];
function cells(img,cols,rows){
 const off=document.createElement('canvas');off.width=img.naturalWidth;off.height=img.naturalHeight;const c=off.getContext('2d',{willReadFrequently:true});c.drawImage(img,0,0);const data=c.getImageData(0,0,off.width,off.height).data,result=[];
 // Measured transparent gutters: the raised walker and seated shoes extend past the nominal grid.
 const boundaries=[[0,362,716,1128,1448],[0,384,700,1056,1448]];
 for(let n=0;n<cols*rows;n++){const row=Math.floor(n/cols),bounds=cols===4&&rows===2?boundaries[row]:img===angry&&cols===3?[0,760,1440,2172]:null,basis=img===angry?2172:1448,x0=Math.round(bounds?bounds[n%cols]*off.width/basis:n%cols*off.width/cols),x1=Math.round(bounds?bounds[n%cols+1]*off.width/basis:(n%cols+1)*off.width/cols),y0=Math.round(row*off.height/rows),y1=Math.round((row+1)*off.height/rows);let minX=x1,minY=y1,maxX=x0,maxY=y0;
 for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(data[(y*off.width+x)*4+3]>45){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);}
 result.push({sx:Math.max(x0,minX-2),sy:Math.max(y0,minY-2),sw:Math.min(x1,maxX+3)-Math.max(x0,minX-2),sh:Math.min(y1,maxY+3)-Math.max(y0,minY-2)});
 }return result;
}
atlas.onload=()=>{
 poses=cells(atlas,4,2);falls=[poses[3],poses[4],poses[5]];
 const cc=document.createElement('canvas');cc.width=atlas.naturalWidth;cc.height=atlas.naturalHeight;const g=cc.getContext('2d',{willReadFrequently:true});g.drawImage(atlas,0,0);const a=g.getImageData(0,0,cc.width,cc.height).data;
 function green(p){let min=Infinity,max=-Infinity,bottom=-Infinity;for(let y=Math.ceil(p.sy+p.sh*.55);y<p.sy+p.sh;y++)for(let x=p.sx;x<p.sx+p.sw;x++){const i=(y*cc.width+x)*4;if(a[i+3]>80&&a[i+1]>a[i]*1.05&&a[i+1]>a[i+2]*1.35&&a[i+1]>75){min=Math.min(min,x);max=Math.max(max,x);bottom=Math.max(bottom,y);}}return{min,max,bottom};}
 const n=green(poses[0]),w=green(falls[2]);
 if(Number.isFinite(n.min)&&w.max>w.min){const ns=230/poses[0].sh,ws=(n.max-n.min)*ns/(w.max-w.min),nativeLeft=(n.min-poses[0].sx-poses[0].sw*.48)*ns;
  waitingWalker={dx:nativeLeft-(w.min-falls[2].sx-falls[2].sw*.5)*ws,dy:(n.bottom-poses[0].sy-poses[0].sh)*ns-(w.bottom-falls[2].sy-falls[2].sh)*ws,h:falls[2].sh*ws};
  bodyCut=(nativeLeft-3)/230;
 }
};
gaitAtlas.onload=()=>{
 // Connected cutouts prevent a reaching hand crossing a grid gutter from entering the next pose.
 gaitSprites=isolatedSprites(gaitAtlas,6,2);gaitPoses=gaitSprites.map(s=>s.pose);gaitScale=230/gaitPoses[0].sh;
 gaitHead=gaitSprites.map(({image,pose:p})=>{
  const g=image.getContext('2d',{willReadFrequently:true}),data=g.getImageData(0,0,p.sw,p.sh).data;let lo=Infinity,hi=-Infinity;
  for(let y=0;y<p.sh*.28;y++)for(let x=0;x<p.sw;x++)if(data[(y*p.sw+x)*4+3]>60){lo=Math.min(lo,x);hi=Math.max(hi,x);}
  return(lo+hi)/2;
 });
 gaitFoot=-20+(footCenter(gaitSprites[0].image,gaitPoses[0])-gaitHead[0])*gaitScale;
};
function drawGaitBody(c,frame,x,y,h=230,shuffle=null){
 if(gaitPoses.length!==6){sprite(c,atlas,poses[0],x,y,h,0,.48);return;}
 if(shuffle){
  const rest=gaitPoses[0],baseScale=gaitScale*h/230,baseX=x-20*h/230-gaitHead[0]*baseScale,baseY=y-rest.sh*baseScale,amount=shuffle.legAlpha??shuffle.lift;
  const leg=(n,alpha)=>{if(alpha<=0)return;const p=gaitPoses[n],xx=x-20*h/230-gaitHead[n]*baseScale,yy=y-p.sh*baseScale;c.save();c.globalAlpha*=alpha;c.beginPath();c.rect(x-h,y-h*.20,h*2,h*.21+2);c.clip();c.drawImage(gaitSprites[n].image,0,0,p.sw,p.sh,xx,yy,p.sw*baseScale,p.sh*baseScale);c.restore();};
  leg(0,1-amount);leg(shuffle.legFrame??1,amount);
  // One unchanged head, cardigan and skirt; only the feet alternate under the hem.
  const crop=rest.sh-h*.135/baseScale;c.drawImage(gaitSprites[0].image,0,0,rest.sw,crop,baseX,baseY,rest.sw*baseScale,crop*baseScale);
  return;
 }
 const p=gaitPoses[frame],scale=gaitScale*h/230,dx=-20*h/230-gaitHead[frame]*scale,dy=frame===5?-h:-p.sh*scale;
 c.drawImage(gaitSprites[frame].image,p.sx,p.sy,p.sw,p.sh,x+dx,y+dy,p.sw*scale,p.sh*scale);
}
function shuffleTravel(progress,count=3){
 const q=clamp(progress)*count,index=Math.min(count-1,Math.floor(q)),u=q>=count?1:q-index;
 return{index,u,legFrame:index%2?2:1,legAlpha:Math.sin(Math.PI*clamp((u-.18)/.64)),distance:(index+ease((u-.18)/.64))/count,frame:u>.18&&u<.82?(index%2?2:1):0,lift:Math.sin(Math.PI*clamp((u-.18)/.64))};
}
function grannyStride(progress,reduced=false){
 const p=clamp(progress),contact=2300/2680,takeoff=contact-.25,edge=PITCH/2+24,shuffle=shuffleTravel(p/.40,4),place=ease((p-.42)/.12),hop=clamp((p-takeoff)/(contact-takeoff)),flight=ease(hop),follow=ease((p-takeoff)/(1-takeoff));
 const distance=p<.40?edge*shuffle.distance:mix(edge,PITCH,flight);
 const drop=RISE*flight-(reduced?0:Math.sin(Math.PI*hop)*34);
 const walkerDistance=p<.40?distance:mix(edge,PITCH,place),walkerDrop=RISE*place-(reduced?0:Math.sin(Math.PI*place)*24)-4*(1-place);
 let frame=p<.40?shuffle.frame:p<.54?3:p<takeoff?4:hop<1?5:p<.91?4:0;
 return{phase:p<.40?'shuffle':p<.54?'walker':p<takeoff?'crouch':hop<1?'hop':'land',distance,drop,walkerDistance,walkerDrop,follow,frame,hop,place,contact,takeoff,shuffle:p<.40?shuffle:null};
}
angry.onload=()=>{angryPoses=cells(angry,3,1);angrySupport=supportOutline(angry,angryPoses[1]);};
armsAtlas.onload=()=>{armsPose=cells(armsAtlas,1,1);armsSupport=supportOutline(armsAtlas,armsPose[0]);};
function isolatedSprites(img,count=3,rows=1){
 // Separate connected cutouts instead of assuming equal atlas gutters.
 const cc=document.createElement('canvas');cc.width=img.naturalWidth;cc.height=img.naturalHeight;
 const g=cc.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0);
 const data=g.getImageData(0,0,cc.width,cc.height),a=data.data,w=cc.width,h=cc.height,labels=new Int32Array(w*h),queue=new Int32Array(w*h),parts=[];
 let label=0;
 for(let n=0;n<labels.length;n++){
  if(labels[n]||a[n*4+3]<32)continue;label++;let head=0,tail=1,minX=w,minY=h,maxX=0,maxY=0;queue[0]=n;labels[n]=label;
  while(head<tail){const q=queue[head++],x=q%w,y=Math.floor(q/w);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(const nn of [x>0?q-1:-1,x<w-1?q+1:-1,y>0?q-w:-1,y<h-1?q+w:-1])if(nn>=0&&!labels[nn]&&a[nn*4+3]>=32){labels[nn]=label;queue[tail++]=nn;}
  }
  parts.push({label,size:tail,minX,minY,maxX,maxY});
 }
 const selected=parts.sort((a,b)=>b.size-a.size).slice(0,count).sort((a,b)=>Math.floor((a.minY+a.maxY)/2/h*rows)-Math.floor((b.minY+b.maxY)/2/h*rows)||a.minX-b.minX);
 return selected.map(p=>{
  const x0=Math.max(0,p.minX-2),y0=Math.max(0,p.minY-2),sw=Math.min(w,p.maxX+3)-x0,sh=Math.min(h,p.maxY+3)-y0;
  const image=document.createElement('canvas');image.width=sw;image.height=sh;const ctx=image.getContext('2d'),pixels=ctx.createImageData(sw,sh);
  for(let y=0;y<sh;y++)for(let x=0;x<sw;x++){
   const xx=x+x0,yy=y+y0,n=yy*w+xx;let keep=labels[n]===p.label;
   for(let dy=-1;dy<=1&&!keep;dy++)for(let dx=-1;dx<=1&&!keep;dx++)if(xx+dx>=0&&xx+dx<w&&yy+dy>=0&&yy+dy<h&&labels[(yy+dy)*w+xx+dx]===p.label)keep=true;
   if(keep)for(let k=0;k<4;k++)pixels.data[(y*sw+x)*4+k]=a[n*4+k];
  }
  const support=[];for(let y=0;y<sh;y++){let left=sw,right=-1;for(let x=0;x<sw;x++)if(pixels.data[(y*sw+x)*4+3]>45){left=Math.min(left,x);right=x;}if(right>=0){support.push([(left-sw/2)/sh,(y-sh)/sh]);support.push([(right-sw/2)/sh,(y-sh)/sh]);}}ctx.putImageData(pixels,0,0);return{image,pose:{sx:0,sy:0,sw,sh},support};
 });
}
lifeAtlas.onload=()=>{lifeSprites=isolatedSprites(lifeAtlas);};
riseAtlas.onload=()=>{riseSprites=isolatedSprites(riseAtlas);riseFeet=riseSprites.map(p=>footCenter(p.image,p.pose));};
standingAtlas.onload=()=>{standingSprites=isolatedSprites(standingAtlas);standingFeet=standingSprites.map(p=>footCenter(p.image,p.pose));standingScale=230/standingSprites[2].pose.sh;};
function footCenter(img,p){
 const cv=document.createElement('canvas');cv.width=p.sw;cv.height=p.sh;const g=cv.getContext('2d',{willReadFrequently:true});g.drawImage(img,p.sx,p.sy,p.sw,p.sh,0,0,p.sw,p.sh);const a=g.getImageData(0,0,p.sw,p.sh).data;let sum=0,count=0;
 for(let y=Math.floor(p.sh*.87);y<p.sh;y++)for(let x=0;x<p.sw;x++)if(a[(y*p.sw+x)*4+3]>60){sum+=x;count++;}
 return count?sum/count:p.sw/2;
}
function lifeSprite(c,index,x,y,h,rot=0){const p=lifeSprites[index];if(p)sprite(c,p.image,p.pose,x,y,h,rot,.5);}
function supportOutline(img,p){
 const cc=document.createElement('canvas');cc.width=p.sw;cc.height=p.sh;const g=cc.getContext('2d',{willReadFrequently:true});g.drawImage(img,p.sx,p.sy,p.sw,p.sh,0,0,p.sw,p.sh);const a=g.getImageData(0,0,p.sw,p.sh).data,points=[];
 for(let y=0;y<p.sh;y+=2){let left=p.sw,right=-1;for(let x=0;x<p.sw;x++)if(a[(y*p.sw+x)*4+3]>45){left=Math.min(left,x);right=x;}if(right>=0)for(const x of [left,right])points.push([(x-p.sw/2)/p.sh,(y-p.sh)/p.sh]);}return points;
}
function sprite(c,img,p,x,y,h,rot=0,anchor=.5,sx=1,sy=1){if(!p||img.complete===false)return;const w=h*p.sw/p.sh;c.save();c.translate(x,y);c.rotate(rot);c.scale(sx,sy);c.drawImage(img,p.sx,p.sy,p.sw,p.sh,-w*anchor,-h,w,h);c.restore();}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=1;c.stroke();}}
function ellipse(c,x,y,rx,ry,fill){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=fill;c.fill();}
function line(c,x,y,x1,y1,color,w=1){c.beginPath();c.moveTo(x,y);c.lineTo(x1,y1);c.strokeStyle=color;c.lineWidth=w;c.stroke();}
function star(c,x,y,r,color,angle=0){c.save();c.translate(x,y);c.rotate(angle);c.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,rr=i%2?r*.4:r;i?c.lineTo(Math.cos(a)*rr,Math.sin(a)*rr):c.moveTo(Math.cos(a)*rr,Math.sin(a)*rr);}c.closePath();c.fillStyle=color;c.fill();c.restore();}
function bubble(c,text,x,y,alpha=1){if(alpha<=0)return;c.save();c.globalAlpha*=alpha;c.font='italic 18px Georgia';const w=c.measureText(text).width+32;round(c,x-w/2,y-34,w,40,14,'#fffaf0','#b899b6');c.beginPath();c.moveTo(x-8,y+5);c.lineTo(x-14,y+14);c.lineTo(x+3,y+5);c.fillStyle='#fffaf0';c.fill();c.fillStyle='#765480';c.textAlign='center';c.fillText(text,x,y-9);c.restore();}
function windowArt(c,x,y,w,h){c.save();c.beginPath();c.roundRect(x,y,w,h,[w/2,w/2,2,2]);c.fillStyle='#a79ca8';c.fill();c.clip();const sky=c.createLinearGradient(x,y,x,y+h);sky.addColorStop(0,'#bfc1cb');sky.addColorStop(1,'#e3cfc0');c.fillStyle=sky;c.fillRect(x,y,w,h);ellipse(c,x+w*.68,y+h*.24,15,15,'#f9e9c8');for(let j=0;j<8;j++){const hh=22+(j*37)%56;round(c,x+j*w/7-5,y+h-hh,w/7+5,hh,1,j%2?'#aca4b3':'#b8adb8');for(let k=0;k<3;k++)round(c,x+j*w/7+1,y+h-hh+9+k*13,3,5,1,'#eee1cb');}line(c,x+w/2,y,x+w/2,y+h,'#ece0cc',7);line(c,x,y+h*.49,x+w,y+h*.49,'#ece0cc',6);c.restore();c.strokeStyle='#c1ab9a';c.lineWidth=5;c.beginPath();c.roundRect(x,y,w,h,[w/2,w/2,2,2]);c.stroke();round(c,x-10,y+h-1,w+20,8,3,'#cfb79c');}
function fallBackgroundCamera(step,camera,f){
 // Use the staircase camera directly: wall and granny travel share one clock and speed.
 return camera;
}
function roomLayout(span,aspect){
 const panel=Math.max(600*aspect,span),gap=Math.max(420,panel*.48);
 return{panel,gap,cycle:panel+gap};
}
let wallPaper=null;
function room(c,left,right,camera,pan=0,surface=null){
 c.fillStyle='#faeac7';c.fillRect(left-10,0,right-left+20,624);
 if(!hospital.complete||!hospital.naturalWidth)return;
 const layout=roomLayout(right-left,hospital.naturalWidth/hospital.naturalHeight),w=layout.panel,cycle=layout.cycle,scaleX=w/1672,scaleY=624/940;
 const offset=left-Math.max(0,w-(right-left))*.46-camera*PITCH-pan;
 if(!wallPaper){
  wallPaper=document.createElement('canvas');wallPaper.width=24;wallPaper.height=390;
  wallPaper.getContext('2d').drawImage(hospital,hospital.naturalWidth*.69,0,hospital.naturalWidth*.012,hospital.naturalHeight*.62,0,0,24,390);
 }
 c.save();const tx=offset%24,ty=(-camera*RISE*.025)%390;c.translate(tx,ty);c.fillStyle=c.createPattern(wallPaper,'repeat');c.fillRect(left-tx-10,-ty-10,right-left+20,644);c.restore();
 const anchor=left+(right-left)*.43,wallFloor=surface||((x)=>420+Math.max(0,x-anchor+PITCH/2)*RISE/PITCH);
 const points=[];for(let x=left-8;x<right+24;x+=16)points.push([x,wallFloor(x)]);
 const band=170;
 c.save();c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y-band):c.moveTo(x,y-band));c.lineTo(right+24,680);c.lineTo(left-8,680);c.closePath();
 const shade=c.createLinearGradient(0,150,0,650);shade.addColorStop(0,'#bda3c9');shade.addColorStop(.55,'#b398c3');shade.addColorStop(1,'#957ba7');c.fillStyle=shade;c.fill();
 const first=Math.floor((left-offset)/142)-1,last=Math.ceil((right-offset)/142)+1;
 for(let i=first;i<=last;i++){
  const x=offset+i*142+71,y=wallFloor(x)-band/2,size=96;
  c.fillStyle='#bca2c8';c.fillRect(x-size/2,y-size/2,size,size);
  c.strokeStyle='#806a92';c.lineWidth=2;c.strokeRect(x-size/2,y-size/2,size,size);
  c.strokeStyle='#e0cde9';c.lineWidth=2;c.strokeRect(x-size/2+4,y-size/2+4,size-8,size-8);
  c.strokeStyle='#a08ab0';c.lineWidth=1;c.strokeRect(x-size/2+8,y-size/2+8,size-16,size-16);
  for(let k=0;k<5;k++)ellipse(c,x-34+(k*29+i*11)%70,y-35+(k*19+i*7)%70,1.8,.7,'#f6e9fb16');
 }
 function trim(d,color,width){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y+d):c.moveTo(x,y+d));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
 trim(-band,'#7c668d',8);trim(-band-3,'#dbc9e1',3);trim(-band+6,'#d4bfde',2);trim(0,'#7c668d',7);trim(-3,'#d6c1e0',2);c.restore();
 // Upright pictures, baskets and windows sit above the sloping panel rail.
 const decorations=[[91,278,191,239],[466,304,225,204],[730,337,136,175],[944,281,179,241],[1193,276,345,302]];
 const start=Math.floor((left-offset)/cycle)-1,end=Math.ceil((right-offset)/cycle)+1;
 for(let i=start;i<=end;i++)for(const [sx,sy,sw,sh]of decorations){
  const x=i*cycle+offset+sx*scaleX,dw=sw*scaleX,dh=sh*scaleY,y=wallFloor(x)-band-24-dh;
  if(x+dw<left-5||x>right+5)continue;
  c.drawImage(hospital,sx*hospital.naturalWidth/1672,sy*hospital.naturalHeight/940,sw*hospital.naturalWidth/1672,sh*hospital.naturalHeight/940,x,y,dw,dh);
 }
}
function yellowSurface(c){
 const fill=c.createLinearGradient(0,300,0,690);fill.addColorStop(0,'#f3d995');fill.addColorStop(.55,'#e7c57d');fill.addColorStop(1,'#d9b56d');return fill;
}
function landingFloor(c,left,right,y,pan=0,fill=yellowSurface(c)){
 if(right<=left)return;
 c.save();c.beginPath();c.rect(left,y,right-left,Math.max(0,690-y));c.clip();
 c.fillStyle=fill;c.fillRect(left,y,right-left,Math.max(0,690-y));
 // Quiet painted linoleum, without a hard grid or a vertical cut through the landing.
 for(let k=0;k<32;k++){
  const span=right-left,xx=left+((k*113.7-pan*.35)%span+span)%span,yy=y+20+(k*47.3)%Math.max(30,650-y);
  ellipse(c,xx,yy,4+k%6,.65,k%2?'#fff9e819':'#9b826f0b');
 }
 c.restore();
}
function strokeStairEdge(c){
 c.lineJoin='round';c.lineCap='butt';c.strokeStyle='#88758e';c.lineWidth=19;c.stroke();c.strokeStyle='#f4ede1';c.lineWidth=16;c.stroke();
 c.strokeStyle='#fffaf1';c.lineWidth=2;c.stroke();
}
function staircase(c,left,right,anchor,camera,o,fill=yellowSurface(c)){
 const P=PITCH,R=RISE,base=420,entryX=anchor-camera*P-P/2,entryY=base-camera*R;
 const bottomX=entryX+o.quotes.length*P,bottomY=entryY+o.quotes.length*R;
 const first=Math.max(0,Math.floor(camera+(left-anchor)/P)-1),last=Math.min(o.quotes.length-1,Math.ceil(camera+(right-anchor)/P)+1);
 c.save();c.lineJoin='round';
 // One yellow foundation extends from every tread down to the controls.
 if(entryX>left-32&&!o.openLanding){
  c.fillStyle=fill;c.fillRect(left-32,entryY,entryX-left+32,Math.max(0,690-entryY));
 }
 for(let i=first;i<=last;i++){
  const x=anchor+(i-camera)*P-P/2,y=base+(i-camera)*R;
  c.fillStyle=fill;c.fillRect(x,y,P+1,Math.max(0,690-y));
  const q=(o.quotes[i]/100).toFixed(2)+'×';c.font=(q.length>7?33:39)+'px "Subtle Curves",Georgia';c.textAlign='center';c.textBaseline='middle';
  c.lineWidth=2;c.strokeStyle='#fff7df';c.strokeText(q,x+P/2,y+R*.53,P-25);c.fillStyle='#623578';c.fillText(q,x+P/2,y+R*.53,P-25);
  // Fine plaster grain connects the faces to their foundation without extra geometry.
  for(let k=0;k<8;k++){const dx=12+(k*43+i*17)%(P-24),dy=y+R+18+(k*31+i*7)%130;if(dy<650)ellipse(c,x+dx,dy,1.5,.6,'#f0e2ef16');}
 }
 if(bottomX<right+32&&bottomY<660)landingFloor(c,Math.max(left-32,bottomX),right+32,bottomY+2,camera*PITCH,fill);
 // One stroked path follows the entire stair silhouette, including every vertical drop.
 c.beginPath();
 if(!o.openLanding&&entryX>left-32){c.moveTo(left-32,entryY-8);c.lineTo(entryX,entryY-8);}else c.moveTo(entryX,entryY-8);
 for(let i=0;i<o.quotes.length;i++){
  const xx=entryX+(i+1)*P,yy=entryY+i*R-8;c.lineTo(xx,yy);c.lineTo(xx,yy+R);
 }
 if(bottomX<right+32)c.lineTo(right+32,bottomY-8);
 strokeStairEdge(c);

 c.restore();
}
function discoBallPosition(left,right,o){
 return{x:left+(right-left)*(o.width<600?.21:.37),y:mix(-110,72,ease(o.age/1000)),r:57.75};
}
function discoBack(c,left,right,o,amount){
 if(amount<=0)return;
 const t=o.reduced?0:(o.winMusicTime||o.age)/1000,source=discoBallPosition(left,right,o);
 c.save();c.globalAlpha*=amount;
 // Small reflected pools drift across the surfaces, with no solid triangular beams.
 c.globalCompositeOperation='screen';
 const colors=['#ffe5b7','#e8bcff','#a8e9e0','#f8bcd7','#c1d7ff'];
 for(let i=0;i<30;i++){
  const orbit=t*.22+i*2.39996,x=left+(right-left)*(.5+Math.sin(orbit)*.47),floor=i%3===0;
  const y=floor?450+Math.sin(orbit*.73+i)*105:160+(i%7)*39+Math.sin(orbit*.8)*24;
  const rx=floor?18+i%4*4:7+i%4*2,ry=floor?4+i%3:8+i%3*3;
  c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha*=.28+.08*Math.sin(orbit+i);
  const g=c.createRadialGradient(0,0,.1,0,0,1);g.addColorStop(0,colors[i%colors.length]);g.addColorStop(.45,colors[i%colors.length]+'99');g.addColorStop(1,colors[i%colors.length]+'00');
  c.fillStyle=g;c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();
 }
 const glow=c.createRadialGradient(source.x,source.y,42,source.x,source.y,150);glow.addColorStop(0,'#e6dbff24');glow.addColorStop(1,'#e6dbff00');c.fillStyle=glow;c.fillRect(source.x-150,source.y-150,300,300);
 c.restore();
}
function ball(c,left,right,o,amount){
 if(!amount)return;
 const t=o.reduced?0:(o.winMusicTime||o.age)/1000,{x,y,r}=discoBallPosition(left,right,o);
 c.save();line(c,x,0,x,y-r,'#c5bdd1',1);c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.clip();
 const g=c.createRadialGradient(x-r*.33,y-r*.36,2,x+r*.15,y+r*.12,r*1.3);g.addColorStop(0,'#f8f6ff');g.addColorStop(.48,'#adb1c8');g.addColorStop(1,'#49465e');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);
 // Latitude and longitude tiles narrow toward the sphere's curved edges.
 for(let row=-5;row<=5;row++){
  const latitude=row*Math.PI/12,ring=Math.cos(latitude),yy=y+Math.sin(latitude)*r;
  for(let col=0;col<18;col++){
   const phi=col*Math.PI/9+t*.48,depth=Math.cos(phi);if(depth<=0)continue;
   const xx=x+Math.sin(phi)*ring*r,w=Math.max(.6,Math.PI*r/9*ring*depth-1),h=Math.max(1.5,Math.PI*r/12*ring-1);
   const shine=Math.pow(Math.max(0,Math.cos(phi+.55)),12)*Math.pow(Math.max(0,Math.cos(latitude+.3)),8);
   const shade=Math.round(118+depth*70+shine*60+(row+col)%3*8);
   c.fillStyle=`rgb(${Math.min(255,shade)},${Math.min(255,shade+3)},${Math.min(255,shade+13)})`;c.fillRect(xx-w/2,yy-h/2,w,h);
  }
 }
 c.restore();c.save();c.strokeStyle='#e8e1f1';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();
 const glint=.75+.25*Math.sin(t*1.8);star(c,x-r*.36,y-r*.42,r*.145*glint,'#fffcec',0);
 for(let i=0;i<18;i++){
  const a=i*2.39996+t*.35,rad=r*(.2+(i%5)*.145),pulse=Math.pow(Math.max(0,Math.sin(t*2.5+i*1.7)),7);
  if(pulse>.03)star(c,x+Math.cos(a)*rad,y+Math.sin(a)*rad*.85,2+8*pulse,'#fffceb',Math.PI/4);
 }c.restore();
}
function winConfetti(c,left,right,o){
 if(o.reduced||o.age<450)return;
 const elapsed=(o.age-450)/1000,count=o.width<600?570:810,palette=['#ffe18a','#f6a9d1','#82dbce','#bba0f2','#ffb78e','#f9f2c7'];
 const random=seed=>{const n=Math.sin(seed*127.1+311.7)*43758.5453;return n-Math.floor(n);};
 for(let i=0;i<count;i++){
  const duration=4.6+random(i*7+1)*6.8,clock=elapsed+random(i*11+2)*duration,cycle=Math.floor(clock/duration),progress=clock/duration-cycle,seed=i*53+cycle*7919;
  const y=-65+(progress*.72+progress*progress*.28)*750;
  const drift=(random(seed+4)-.5)*130,wind=Math.sin(elapsed*.55+random(i+9)*6.28)*15;
  const x=left-20+random(seed+3)*(right-left+40)+progress*drift+wind+Math.sin(elapsed*(1+random(i+5)*2)+i)*11;
  const flutter=Math.sin(elapsed*(2+random(i+7)*3)+random(i+8)*6.28),size=2+random(i+10)*3;
  c.save();c.translate(x,y);c.rotate(random(seed+12)*6.28+elapsed*(random(i+14)-.5)*5);c.scale(.25+Math.abs(flutter)*.8,1);c.fillStyle=palette[Math.floor(random(seed+16)*palette.length)];
  if(random(i+18)<.18){c.beginPath();c.arc(0,0,size*.65,0,Math.PI*2);c.fill();}
  else c.fillRect(-size/2,-size,size,size*(1.4+random(i+20)));
  c.restore();
 }
}
function inverseEase(value){let lo=0,hi=1;for(let i=0;i<30;i++){const mid=(lo+hi)/2;if(ease(mid)<value)lo=mid;else hi=mid;}return(lo+hi)/2;}
const FALL_START=.12,FALL_ROLL=3.73,FALL_UNROLL=3.5,FALL_FLAT=3.98,FALL_LAND=4.25,FALL_K=Math.log(14);
const fallTravel=u=>clamp(Math.expm1(FALL_K*clamp(u))/13);
const inverseFall=v=>Math.log1p(clamp(v)*13)/FALL_K;
const fallAngle=u=>Math.PI*2*3*FALL_ROLL*(u+3*u*u*u);
function fallImpacts(totalDistance=18){return Array.from({length:totalDistance},(_,i)=>FALL_START+FALL_ROLL*inverseFall((i+1)/totalDistance));}
function landingLayout(anchor,visible,mobile){const offset=mobile?-.38:-.2;return{offset,bodyShift:-offset*PITCH+(mobile?visible*.05:35)};}
function impactShake(age,reduced=false){
 const t=age/1000-FALL_LAND;if(reduced||t<0||t>.62)return{x:0,y:0,angle:0};
 const e=Math.exp(-t*7)*(1-t/.62);return{x:Math.cos(t*94)*11*e,y:Math.sin(t*113+1)*8*e,angle:Math.sin(t*81)*.45*e};
}
function fallingPose(age,reduced,step,horizon=73){
 const totalDistance=Math.max(1,Math.min(18,horizon+1-step)),rollEnd=FALL_START+FALL_ROLL,landAt=FALL_LAND;
 const t=reduced?landAt+2.6:Math.max(0,age/1000),u=clamp((t-FALL_START)/FALL_ROLL),distance=totalDistance*fallTravel(u),part=distance-Math.floor(distance);
 const spinRate=1+9*u*u,bounce=RISE*(part-ease(part))+Math.sin(Math.PI*part)*38;
 const impactIndex=Math.min(totalDistance,Math.floor(distance+1e-7)),impactAt=impactIndex>0?FALL_START+FALL_ROLL*inverseFall(impactIndex/totalDistance):FALL_START,hitPulse=t>=impactAt?Math.exp(-(t-impactAt)*28):0;
 return{t,u,totalDistance,distance,rollEnd,landAt,spinRate,unroll:ease((t-FALL_UNROLL)/(FALL_FLAT-FALL_UNROLL)),flatDrop:clamp((t-FALL_FLAT)/(FALL_LAND-FALL_FLAT)),angle:fallAngle(u),angleAtUnroll:fallAngle((FALL_UNROLL-FALL_START)/FALL_ROLL),bounce,impactIndex,hitPulse,seated:t>=landAt};
}
function walkerFlight(f){
 const u=clamp((f.t-.15)/((f.rollEnd-.28)*.42));
 return{u,distance:(f.totalDistance+4)*ease(u),angle:Math.PI*6*ease(u),bounce:Math.sin(Math.PI*u)*95};
}
function revivePose(age,reduced=false){
 const t=reduced?2.25:Math.max(0,age/1000),returning=ease(t/.65),fade=1-ease((t-1.25)/1),flash=ease(t/.75)*fade,cover=ease((t-.48)/.27)*fade,teleported=t>=1.05;
 return{t,returning,flash,cover,teleported,walk:teleported?1:0,frame:0,lift:0,arms:0,stand:teleported?1:0,complete:t>=2.25};
}
function resurrectionLight(c,left,right,x,y,r){
 if(r.flash<=0)return;
 const radius=45+Math.hypot(right-left,600)*ease((r.t-.08)/.77);
 c.save();c.globalCompositeOperation='screen';c.globalAlpha*=r.flash;
 const light=c.createRadialGradient(x,y,0,x,y,radius);light.addColorStop(0,'#fffef5');light.addColorStop(.28,'#fffbe6e8');light.addColorStop(.65,'#edddff80');light.addColorStop(1,'#edddff00');c.fillStyle=light;c.fillRect(left-2,-2,right-left+4,604);
 c.globalAlpha*=.22;
 for(let i=0;i<10;i++){const angle=i*Math.PI/5+r.t*.1;c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(angle-.025)*radius,y+Math.sin(angle-.025)*radius);c.lineTo(x+Math.cos(angle+.025)*radius,y+Math.sin(angle+.025)*radius);c.closePath();c.fillStyle='#fff8d9';c.fill();}
 c.restore();
}
function revivalCutout(kind,index=0){
 if(kind==='arms'){
  const p=armsPose[0];return p?{image:armsAtlas,p,scale:310/p.sw,foot:[p.sw*.92,p.sh],head:[p.sw*.17,p.sh*.68]}:null;
 }
 const item=kind==='gait'?gaitSprites[0]:riseSprites[index];if(!item)return null;
 const p=item.pose,scale=kind==='gait'?gaitScale:230/riseSprites[2].pose.sh;
 const g=item.image.getContext('2d',{willReadFrequently:true}),a=g.getImageData(0,0,p.sw,Math.ceil(p.sh*.28)).data;let lo=p.sw,hi=0;
 for(let i=0;i<a.length;i+=4)if(a[i+3]>60){const xx=(i/4)%p.sw;lo=Math.min(lo,xx);hi=Math.max(hi,xx);}
 return{image:item.image,p,scale,foot:[footCenter(item.image,p),p.sh],head:[(lo+hi)/2,p.sh*(kind==='rise'&&index===0?.25:.20)]};
}
let revivalCutouts=null;
function drawRevivalBody(c,r,x,y,reduced){
 if(r.t<1.4)return;
 if(r.t>=5.1){drawGaitBody(c,r.frame,x,y,230,reduced?null:r.shuffle);return;}
 if(!revivalCutouts){const list=[revivalCutout('arms'),revivalCutout('rise',0),revivalCutout('rise',1),revivalCutout('rise',2),revivalCutout('gait')];if(list.some(p=>!p))return;revivalCutouts=list;}
 // Lift the back from the floor before bending the knees; use the full outline to keep contact.
 if(r.t<2.9){
  const p=armsPose[0],h=310*p.sh/p.sw,u=ease((r.t-2.35)/.5),angle=u*.6;
  const ground=armsSupport.length?h*Math.max(...armsSupport.map(p=>p[0]*Math.sin(angle)+p[1]*Math.cos(angle))):0;
  c.save();c.globalAlpha*=r.arms*(1-ease((r.t-2.8)/.1));sprite(c,armsAtlas,p,x+25*u,y-ground,h,angle,.5);c.restore();
 }
 if(r.t<2.8)return;
 const drawRise=(item,height,alpha)=>{if(alpha<=0)return;const p=item.p,scale=height/p.sh;c.save();c.globalAlpha*=alpha;c.drawImage(item.image,p.sx,p.sy,p.sw,p.sh,x-20-item.head[0]*scale,y-height,p.sw*scale,height);c.restore();};
 const stand=(index,alpha=1,factor=1)=>{if(alpha<=0||standingSprites.length!==3)return;const item=standingSprites[index],p=item.pose,scale=standingScale*factor;c.save();c.globalAlpha*=alpha;c.drawImage(item.image,0,0,p.sw,p.sh,x+gaitFoot-standingFeet[index]*scale,y-p.sh*scale,p.sw*scale,p.sh*scale);c.restore();};
 if(r.t<3.6){
  const a=revivalCutouts[1],b=revivalCutouts[2],blend=ease((r.t-2.9)/.7),height=mix(a.p.sh*a.scale,b.p.sh*b.scale,blend),fade=ease((blend-.35)/.3),appear=ease((r.t-2.8)/.1);drawRise(a,height,(1-fade)*appear);drawRise(b,height,fade*appear);
 }else if(r.t<4.1){
  const a=revivalCutouts[2],u=ease((r.t-3.6)/.5),fade=ease((u-.35)/.3),endHeight=standingSprites[0]?.pose.sh*standingScale||260,height=mix(a.p.sh*a.scale,endHeight,u);drawRise(a,height,1-fade);stand(0,fade,height/endHeight);
 }else if(r.t<4.4){stand(0);
 }else if(r.t<4.95){
  const q=clamp((r.t-4.4)/.55)*2,index=Math.min(1,Math.floor(q)),u=ease(q-index),fade=ease((u-.35)/.3);stand(index,1-fade);stand(index+1,fade);
 }else{
  const fade=ease((r.t-4.95)/.15);stand(2,1-fade);c.save();c.globalAlpha*=fade;drawGaitBody(c,0,x,y,230);c.restore();
 }

}
// The flash reveals the same ready scene used on the following frame.
// One renderer owns the wall, entry platform, floor, walker and body alignment.
function readyStairScene(c,o,rawLeft,rawRight,anchor,base,zoom,pan){
 const rawVisible=rawRight-rawLeft,visible=rawVisible/zoom,left=anchor-visible*(o.width<600?.45:.43),right=left+visible;
 const entry=anchor-PITCH*.5*zoom;
 c.save();room(c,rawLeft,rawRight,0,pan,x=>base+clamp(x-entry,0,o.quotes.length*PITCH*zoom)*RISE/PITCH);
 c.translate(anchor,base);c.scale(zoom,zoom);c.translate(-anchor,-base);
 staircase(c,left,right,anchor,0,o);
 ellipse(c,anchor-45,base+3,48,5,'#644e5c20');
 sprite(c,tumble,falls[2],anchor+waitingWalker.dx,base+waitingWalker.dy,waitingWalker.h,0,.5);
 drawGaitBody(c,0,anchor,base,230);
 c.restore();
}
function afterlifeScene(c,o,f,rawLeft,rawRight,anchor,base,zoom){
 const mobile=o.width<600,rawVisible=rawRight-rawLeft,visible=rawVisible/zoom,left=anchor-visible*(mobile?.45:.43),right=left+visible;
 const layout=landingLayout(anchor,visible,mobile),r=o.reviving?revivePose(o.reviveAge,o.reduced):null,v=r?.walk??0,offset=layout.offset,oldCamera=o.step+f.totalDistance-offset;
 const oldX=anchor+offset*PITCH,oldY=base+offset*RISE,distance=Math.max(480,rawVisible*(mobile?1.05:.60)),shift=(distance+offset*PITCH)*v,vertical=offset*RISE*v;
 const backgroundPan=corridorPan+shift+oldCamera*PITCH*v;
 transferPan=backgroundPan;deliveredOnFoot=!!r?.complete;
 if(r?.teleported){
  readyStairScene(c,{...o,step:0,active:false,lost:false,reviving:false},rawLeft,rawRight,anchor,base,zoom,backgroundPan);
  resurrectionLight(c,rawLeft,rawRight,anchor,base-75*zoom,r);
  return;
 }
 const screenFloor=base+(oldY-vertical-base)*zoom,screenLeft=anchor+(oldX-PITCH/2-shift-anchor)*zoom;
 c.save();const landingPulse=!o.reduced&&!r?Math.exp(-Math.max(0,f.t-f.landAt)*16):0;room(c,rawLeft,rawRight,oldCamera*(1-v),backgroundPan,x=>screenFloor+Math.min(0,x-screenLeft)*RISE/PITCH);
 c.translate(anchor,base);c.scale(zoom,zoom);c.translate(-anchor,-base);
 const fill=yellowSurface(c);
 c.save();c.translate(-shift,-vertical);
 staircase(c,left+shift,right+shift,anchor,oldCamera,{...o,quotes:o.quotes.slice(0,o.step+f.totalDistance)},fill);c.restore();
 landingFloor(c,left-visible,right+visible,oldY-vertical+2,backgroundPan,fill);
 // The landing stays empty to the viewport edge. The next flight and its walker
 // are revealed only by readyStairScene, underneath the resurrection flash.
 c.beginPath();c.moveTo(oldX-PITCH/2-shift,oldY-vertical-8);c.lineTo(right+visible,oldY-vertical-8);strokeStairEdge(c);
 const x=oldX+distance*v-shift+layout.bodyShift*(1-v),y=oldY-vertical,body=lifeSprites[0],backHeight=body?Math.min(310,visible-24)*body.pose.sh/body.pose.sw:140;
 ellipse(c,x,y+3,r?mix(110,48,r.stand):110,6,'#60435124');
 if(!r||!r.teleported){
  c.save();c.translate(x,y);c.scale(-(1+landingPulse*.12),1-landingPulse*.22);lifeSprite(c,0,0,0,backHeight);c.restore();
 }
 if(landingPulse>.025){for(let i=0;i<8;i++)ellipse(c,x+(i-3.5)*(15+(1-landingPulse)*7),y+2-(i%3)*5,12*landingPulse,5*landingPulse,'#fff4ce99');}
 if(r?.teleported)drawGaitBody(c,0,x,y,230);
 const emerge=ease((f.t-f.landAt-.18)/1.9),offTop=base-base/zoom-30;
 const soulVisible=r?r.returning<1:emerge>0&&emerge<1;
 if(soulVisible){
  const progress=r?r.returning:emerge,soulX=x+(o.reduced?0:Math.sin(o.time*.002)*5),soulY=r?mix(offTop,y-30,progress):mix(y-30,offTop,progress),h=r?mix(180,90,progress):mix(90,180,ease(progress/.25));
  c.save();c.globalAlpha*=r ? .85*(1-ease((progress-.75)/.25)):.85*ease(progress/.15);
  const glow=c.createRadialGradient(soulX,soulY-75,5,soulX,soulY-75,100);glow.addColorStop(0,'#c9fff364');glow.addColorStop(1,'#c9fff300');c.fillStyle=glow;c.fillRect(soulX-100,soulY-175,200,200);lifeSprite(c,2,soulX,soulY,h);c.restore();
 }
 c.restore();
 if(r)resurrectionLight(c,rawLeft,rawRight,anchor+(x-anchor)*zoom,base+(y-base)*zoom-75*zoom,r);
}
function draw(c,o){
 if(wasLost&&!o.lost){corridorPan=transferPan;onFootStart=deliveredOnFoot;}
 if(o.lost&&!wasLost){transferPan=corridorPan;deliveredOnFoot=false;}
 wasLost=!!o.lost;
 const rawVisible=o.width*600/o.height,rawLeft=(900-rawVisible)/2,rawRight=rawLeft+rawVisible,mobile=o.width<600,anchor=rawLeft+rawVisible*(mobile?.45:.43),base=420;
 const zoom=mobile?.90:1;
 const visible=rawVisible/zoom,left=anchor-visible*(mobile?.45:.43),right=left+visible;
 if(!o.active&&!o.lost&&!o.caught){
  readyStairScene(c,o,rawLeft,rawRight,anchor,base,zoom,corridorPan);
  lastCamera=0;initialized=true;previousActive=false;previousCaught=false;return;
 }
 const phase=o.active&&!o.preparing?clamp(o.progress):0,motion=grannyStride(phase,o.reduced),follow=mobile?(phase<.62?.65*ease((phase-.30)/.32):.65+.35*ease((phase-.62)/.38)):motion.follow;
 const pan=0,trackAnchor=anchor,actorX=anchor;
 if(o.active){heldTravel=follow;heldStep=o.step;previousActive=true;previousCaught=false;}
 if(o.caught&&!previousCaught){winFromCamera=previousActive?heldStep+heldTravel:o.step;previousCaught=true;}
 let camera=o.active&&!o.preparing?o.step+follow:0,fall;
 if(o.caught)camera=mix(winFromCamera,o.step,ease(o.age/300));
 if(o.lost){fall=fallingPose(o.age,o.reduced,o.step,o.horizon??o.quotes.length-1);fall.screenOffset=mix(Math.min(fall.distance,mobile?.04:.65),landingLayout(anchor,visible,mobile).offset,fall.unroll);camera=o.step+fall.distance-fall.screenOffset;}
 if(fall?.seated){afterlifeScene(c,o,fall,rawLeft,rawRight,anchor,base,zoom);previousActive=false;return;}
 lastCamera=camera;initialized=true;
 const shake=o.lost&&!o.reduced?Math.max(0,1-o.age/600)*Math.sin(o.age*.07)*3:0;
 const wallEntry=anchor+(trackAnchor-camera*PITCH-PITCH/2-anchor)*zoom,wallY=base-camera*RISE*zoom,wallCount=o.lost?o.step+fall.totalDistance:o.quotes.length;
 c.save();c.translate(shake,0);room(c,rawLeft,rawRight,o.lost?fallBackgroundCamera(o.step,camera,fall):camera,pan+corridorPan,x=>wallY+clamp(x-wallEntry,0,wallCount*PITCH*zoom)*RISE/PITCH);
 c.translate(anchor,base);c.scale(zoom,zoom);c.translate(-anchor,-base);
 staircase(c,left,right,trackAnchor,camera,o.lost?{...o,quotes:o.quotes.slice(0,o.step+fall.totalDistance)}:o);

 const amount=o.caught?ease(o.age/1400):0;
 // Dim the whole viewport in room coordinates, including margins outside mobile scene zoom.
 if(amount>0){c.save();c.translate(anchor,base);c.scale(1/zoom,1/zoom);c.translate(-anchor,-base);c.globalAlpha*=amount;c.fillStyle='#2c204c78';c.fillRect(rawLeft-2,-2,rawVisible+4,604);c.restore();}
 discoBack(c,left,right,o,amount);
 if(o.caught){
  const t=(o.winMusicTime||o.age)/1000,beat=t*115/60,phase=beat%1,alt=Math.floor(beat)%2,bob=o.reduced?0:Math.sin(Math.PI*phase)*7,sway=o.reduced?0:Math.sin(beat*Math.PI)*.065;
  const u=o.reduced?1:clamp((o.age-180)/1800),wx=anchor+50+(right-anchor+220)*ease(u),wy=base+Math.max(0,wx-anchor-PITCH/2)*RISE/PITCH-Math.abs(Math.sin(u*Math.PI*5))*28*(1-u),walkerHeight=mobile?82:109;
  ellipse(c,anchor,base+3,69,7,'#1d102d35');
  sprite(c,atlas,poses[o.reduced?6:6+alt],anchor,base-bob,290,sway,.5,1+Math.sin(phase*Math.PI)*.015,1-Math.sin(phase*Math.PI)*.015);
  // The released walker tumbles down the stair slope and leaves the screen.
  if(u<1)sprite(c,tumble,falls[2],wx,wy,walkerHeight,Math.PI*6*ease(u),.5);
  winConfetti(c,left,right,o);
  ball(c,left,right,o,amount);
 }else if(o.lost){
  const f=fall,x=anchor+f.screenOffset*PITCH+landingLayout(anchor,visible,mobile).bodyShift*f.unroll,y=base+f.screenOffset*RISE;
  if(f.t<FALL_START&&!o.reduced){sprite(c,angry,angryPoses[0],anchor,base,239,-.3*ease(f.t/FALL_START),.44);}
  else if(!f.seated){
   const sx=1+.09*Math.sin(f.angle*2)+.12*f.hitPulse,sy=1-.07*Math.sin(f.angle*2)-.08*f.hitPulse,sin=Math.sin(f.angle),cos=Math.cos(f.angle),support=angrySupport.length?Math.max(...angrySupport.map(p=>170*p[0]*sx*sin+(85+170*p[1]*sy)*cos)):88,cy=y-f.bounce-14-support;
   const unroll=f.unroll,body=lifeSprites[0],backHeight=body?Math.min(310,visible-24)*body.pose.sh/body.pose.sw:140;
   const airY=y-90*(1-f.flatDrop*f.flatDrop),centerY=mix(cy,airY-backHeight/2,unroll),flatBlend=ease((unroll-.3)/.5);
   if(flatBlend<1){
    const startAngle=f.angleAtUnroll,endAngle=Math.ceil(startAngle/(Math.PI*2)+2)*Math.PI*2;
    const angle=unroll>0?mix(startAngle,endAngle,ease(unroll/.8)):f.angle;
    c.save();c.globalAlpha*=1-flatBlend;c.translate(x,centerY);c.rotate(angle);sprite(c,angry,angryPoses[1],0,85,170,0,.5,sx*(1+unroll*.35),sy*(1-unroll*.18));c.restore();
   }
   if(flatBlend>0){c.save();c.globalAlpha*=flatBlend;c.translate(x,centerY+backHeight/2);c.scale(-1,1);lifeSprite(c,0,0,0,backHeight);c.restore();}
   if(f.hitPulse>.05&&f.impactIndex>0)for(let i=0;i<5;i++)ellipse(c,x+(i-2)*17,y-15-(1-f.hitPulse)*13,10*f.hitPulse,4*f.hitPulse,'#f9e8c1a0');
   const wf=walkerFlight(f),wx=anchor+45+(wf.distance-f.distance+f.screenOffset)*PITCH,wy=base+(Math.min(wf.distance,f.totalDistance)-f.distance+f.screenOffset)*RISE-wf.bounce;
   sprite(c,tumble,falls[2],wx,wy,mobile?80:105,wf.angle,.5);
   if(unroll<.7)for(let i=0;i<3;i++)star(c,x+Math.cos(f.angle+i*2.1)*101,cy+Math.sin(f.angle+i*2.1)*83,5,'#c19c57',f.angle);
  }
  if(!o.reduced&&f.t>f.landAt-.2&&f.t<f.landAt+.6){const alpha=1-clamp((f.t-f.landAt)/.6);for(let i=0;i<8;i++)ellipse(c,x+(i-4)*13,y+2-(i%3)*4,13*alpha,7*alpha,'#efe2d180');}
 }else{
  const stepping=o.active&&!o.preparing,frame=stepping?motion.frame:0;
  const bodyDistance=stepping?motion.distance:0,bodyDrop=stepping?motion.drop:0,camX=stepping?follow*PITCH:0,camY=stepping?follow*RISE:0;
  const px=actorX+bodyDistance-camX,py=base+bodyDrop-camY,wx=actorX+waitingWalker.dx+(stepping?motion.walkerDistance:0)-camX,wy=base+waitingWalker.dy+(stepping?motion.walkerDrop:0)-camY;
  const ground=stepping&&motion.hop>.35?RISE:0;
  ellipse(c,px-45,base+ground-camY+3,stepping&&motion.phase==='hop'?33:48,5,'#644e5c20');
  sprite(c,tumble,falls[2],wx,wy,waitingWalker.h,0,.5);
  drawGaitBody(c,frame,px,py,230,o.reduced?null:(stepping?motion.shuffle:null));
 }

 c.restore();previousActive=o.active;
}
function drawSplash(c,o){
 const span=o.width*600/o.height,left=(900-span)/2;
 c.save();c.fillStyle='#f8eccb';c.fillRect(left,0,span,600);
 const art=o.height>o.width&&splashPortrait.complete&&splashPortrait.naturalWidth?splashPortrait:splashArt;
 if(art.complete&&art.naturalWidth){
  const z=Math.max(span/art.naturalWidth,600/art.naturalHeight),w=art.naturalWidth*z,h=art.naturalHeight*z;
  c.drawImage(art,left+(span-w)/2,(600-h)/2,w,h);
 }
 c.restore();
}
// The scene owns its full render; the legacy application keeps the verified math and clocks.
window.GrannyScene={draw,drawSplash,grannyStride,shuffleTravel,fallingPose,walkerFlight,revivePose,fallImpacts,fallBackgroundCamera,roomLayout,landingLayout,impactShake,get waitingOnFoot(){return deliveredOnFoot||onFootStart;},get ready(){return poses.length===8&&gaitPoses.length===6&&falls.length===3&&angryPoses.length===3&&lifeSprites.length===3&&armsPose.length===1&&riseSprites.length===3&&standingSprites.length===3&&hospital.complete&&hospital.naturalWidth>0&&splashArt.complete&&splashArt.naturalWidth>0&&splashPortrait.complete&&splashPortrait.naturalWidth>0;}};
})();
