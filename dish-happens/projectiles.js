/* Isolated v9 cash-out review: denser fractures of the same held crockery. */
(function(root){
'use strict';
const G=650,clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),ease=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
const hash=s=>{s=String(s);let n=2166136261;for(let i=0;i<s.length;i++)n=Math.imul(n^s.charCodeAt(i),16777619);return n>>>0;};
const noise=(seed,salt)=>{let x=(seed+Math.imul(salt+1,0x9e3779b9))>>>0;x^=x>>>16;x=Math.imul(x,0x7feb352d);x^=x>>>15;x=Math.imul(x,0x846ca68b);x^=x>>>16;return (x>>>0)/4294967296;};
const support=(vertices,r)=>{const s=Math.sin(r),c=Math.cos(r);let max=-Infinity;for(const p of vertices)max=Math.max(max,p[0]*s+p[1]*c);return max;};
function hullFor(item){
 const scale=item.scale,size=item.size;
 let vertices;
 if(item.kind==='plate'){
  vertices=Array.from({length:32},(_,i)=>{const a=i*Math.PI/16;return[Math.cos(a)*size,Math.sin(a)*size*.235];});
  vertices.push([-size*.88,size*.25],[-size*.55,size*.34],[0,size*.34],[size*.55,size*.34],[size*.88,size*.25]);
 }else if(item.kind==='tray')vertices=Array.from({length:32},(_,i)=>{const a=i*Math.PI/16;return[Math.cos(a)*size,Math.sin(a)*size*.25];});
 else if(item.kind==='cup')vertices=[[-12,3],[12,3],[15,-4],[15,-14],[9,-19],[-9,-19]];
 else if(item.kind==='glass')vertices=[[-8,2],[8,2],[8,-27],[-8,-27]];
 else vertices=[[-8,6],[12,6],[12,-28],[-8,-28]];
 return vertices.map(p=>[p[0]*scale,p[1]*scale]);
}
const ceramic=kind=>kind==='plate'||kind==='cup'||kind==='glass';
function canvasLike(c,width,height){
 try{if(typeof OffscreenCanvas==='function')return new OffscreenCanvas(width,height);}catch(e){}
 const doc=c.canvas&&c.canvas.ownerDocument;
 if(doc&&doc.createElement){const canvas=doc.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;}
 try{const canvas=new c.canvas.constructor(width,height);if(canvas&&canvas.getContext)return canvas;}catch(e){}
 return null;
}
function bounceHeight(after,up,gravity,restitution,count=5){
 if(after>=2*up/gravity*(1-Math.pow(restitution,count))/(1-restitution))return 0;
 let t=after,v=up;
 for(let k=0;k<count;k++){
  const duration=2*v/gravity;
  if(v<1.5||duration<.004)return 0;
  if(t<=duration)return Math.max(0,v*t-.5*gravity*t*t);
  t-=duration;v*=restitution;
 }
 return 0;
}
function create({releaseMs=140,bounds={},items=[]}={}){
 const b={left:-400,right:400,top:-365,floor:135,...bounds};
 const normalized=items.map((item,i)=>({id:item.id??i,side:item.side?1:0,kind:item.kind||'plate',x:Number(item.x)||0,y:Number(item.y)||0,rotation:Number(item.rotation)||0,size:Number(item.size)||(item.kind==='tray'?37:item.kind==='plate'?35:12),scale:Number(item.scale)||1,front:item.front??(i%3===0),seed:hash(item.id??i)}));
 const sideBottom=[0,1].map(side=>Math.max(...normalized.filter(p=>p.side===side).map(p=>p.y),b.top+150));
 const width=b.right-b.left;
 const bodies=normalized.map((item,index)=>{
  const n=salt=>noise(item.seed,salt),sign=item.side?1:-1,hull=hullFor(item),rotation=item.rotation,spin=sign*(1.9+n(4)*4.7)+(n(7)-.5)*2.8;
  // Both actual tray-loads leave as steep, separate fans. Every item uses one
  // unbroken parabola; the same item crosses the top edge twice on its return.
  const rise=Math.max(125,sideBottom[item.side]-(b.top-58)),up=Math.sqrt(2*G*rise)*(.98+n(0)*.105),vy=-up;
  const surface=b.floor+(index%5)*3.2,bottom=t=>item.y+vy*t+.5*G*t*t+support(hull,rotation+spin*t);
  let lo=up/G,hi=(up+Math.sqrt(up*up+2*G*Math.max(0,surface-item.y+item.size*item.scale)))/G+.3;
  for(let k=0;k<35;k++){const mid=(lo+hi)/2;if(bottom(mid)>=surface)hi=mid;else lo=mid;}
  const hit=(lo+hi)/2,margin=Math.min(width*.16,Math.max(18,item.size*item.scale+6)),center=item.side?b.left+width*.76:b.left+width*.24,spread=Math.min(80,width*.175),target=clamp(center+(n(1)-.5)*spread*2,b.left+margin,b.right-margin),vx=(target-item.x)/hit;
  const impactY=item.y+vy*hit+.5*G*hit*hit,impactRotation=rotation+spin*hit;
  const body={...item,hull,spin,vx,vy,gravity:G,hit,impactMs:releaseMs+hit*1000,impactX:target,impactY,impactRotation,surface,apexMs:releaseMs+up/G*1000,apexY:item.y-up*up/(2*G)};
  const largeCount=item.kind==='plate'?12:10,chipCount=3+index%3;
  body.fragments=ceramic(item.kind)?Array.from({length:largeCount+chipCount},(_,j)=>{
   // Body chunks, narrow rim splinters and fine chips all begin inside this
   // particular dish at its first impact. Nothing spawns elsewhere in the room.
   const q=salt=>noise(item.seed,30+j*13+salt),chip=j>=largeCount,shape=chip?3:j%4,size=(chip?.72+q(0)*1.05:3.25+q(0)*4.15)*item.scale;
   const stretchX=chip?.65+q(7)*.7:shape===1?1.55+q(7)*.55:shape===2?.7+q(7)*.3:.9+q(7)*.3,stretchY=chip?.65+q(8)*.7:shape===1?.42+q(8)*.24:shape===2?1.1+q(8)*.4:.85+q(8)*.35;
   const co=Math.cos(impactRotation),si=Math.sin(impactRotation),localX=(q(1)-.5)*item.size*item.scale*1.35,localY=(q(2)-.5)*item.size*item.scale*.26;
   const r=impactRotation+(q(3)-.5)*1.8,radius=size*1.23*Math.max(stretchX,stretchY),ground=surface+(j%3)*1.6,x=target+localX*co-localY*si,y=Math.min(impactY+localX*si+localY*co,ground-radius),up=(chip?40:60)+q(4)*(chip?92:112),vx=body.vx*.18+(q(5)-.5)*(chip?206:228),spin=(q(6)-.5)*(chip?18:15),hit=(up+Math.sqrt(up*up+2*G*Math.max(0,ground-radius-y)))/G;
   const vertices=[[-size,-size*.35],[size*.45,-size*.65],[size,size*.45],[-size*.4,size*.65]].map(p=>[p[0]*stretchX,p[1]*stretchY]);
   return{x,y,rotation:r,size,stretchX,stretchY,vertices,chip,fragmentKind:chip?'chip':shape===1?'rim':shape===2?'chunk':'body',radius,ground,up,vx,spin,hit};
  }):[];
  return body;
 });
 function pose(body,age){
  const t=(age-releaseMs)/1000;
  if(t<0)return{...body,status:'held',x:body.x,y:body.y,rotation:body.rotation,flight:false,after:0};
  const at=Math.min(t,body.hit),after=Math.max(0,t-body.hit),rotation=body.rotation+body.spin*at;
  if(t<body.hit)return{...body,status:'flight',x:body.x+body.vx*t,y:body.y+body.vy*t+.5*G*t*t,rotation,flight:true,after:0,bottom:body.y+body.vy*t+.5*G*t*t+support(body.hull,rotation)};
  if(ceramic(body.kind))return{...body,status:'shattered',x:body.impactX,y:body.impactY,rotation:body.impactRotation,flight:false,after,bottom:body.surface};
  const r=body.impactRotation+body.spin/4*(1-Math.exp(-4*after)),bounce=bounceHeight(after,Math.abs(body.vy+G*body.hit)*.19,G,.26,4),x=body.impactX+body.vx/3.7*(1-Math.exp(-3.7*after)),y=body.surface-support(body.hull,r)-bounce;
  return{...body,status:'metal',x,y,rotation:r,flight:false,after,bottom:y+support(body.hull,r),bounce};
 }
 function fragmentPose(body,fragment,age){
  const after=(age-body.impactMs)/1000;if(after<0)return null;
  const t=Math.min(after,fragment.hit),rest=Math.max(0,after-fragment.hit),spinTime=t+(1-Math.exp(-3*rest))/3,rotation=fragment.rotation+fragment.spin*spinTime;
  const x=fragment.x+fragment.vx*t+fragment.vx/2.8*(1-Math.exp(-2.8*rest));
  const cos=Math.cos(rotation),sin=Math.sin(rotation);let hull=-Infinity;for(const p of fragment.vertices)hull=Math.max(hull,p[0]*sin+p[1]*cos);
  let y,bounce=0;
  if(after<fragment.hit)y=fragment.y-fragment.up*t+.5*G*t*t;
  else{bounce=bounceHeight(rest,Math.abs(-fragment.up+G*fragment.hit)*.34,G,.37);const floorSupport=fragment.radius+(hull-fragment.radius)*ease(rest/.08);y=fragment.ground-floorSupport-bounce;}
  return{x,y,rotation,cos,sin,size:fragment.size,stretchX:fragment.stretchX,stretchY:fragment.stretchY,chip:fragment.chip,fragmentKind:fragment.fragmentKind,ground:fragment.ground,bottom:y+hull,bounce,flight:after<fragment.hit};
 }
 function inspect(age){return bodies.map(body=>{const p=pose(body,age);return{...p,fragments:p.status==='shattered'?body.fragments.map(fragment=>fragmentPose(body,fragment,age)):[]};});}
 const sprites=new Map(),settledLayers=new Map(),renderStats={spriteEntries:0,settledCacheBuilds:0,settledCachedDraws:0};
 let cacheTransformKey='';
 const SETTLED_MS=6800;
 const matrixKey=(m,c)=>[m.a,m.b,m.c,m.d,m.e,m.f,c.canvas.width,c.canvas.height].join(',');
 function setMatrix(c,m){c.setTransform(m.a,m.b,m.c,m.d,m.e,m.f);}
 function shardSprite(c,drawer,body,size,resolution){
  const bucket=Math.max(.5,Math.round(size*4)/4),key=[bucket,resolution,body.kind,body.side].join(':'),old=sprites.get(key);
  if(old&&old.drawer===drawer)return old;
  const pad=3,w=Math.ceil((bucket*2+pad*2)*resolution),h=Math.ceil((bucket*1.3+pad*2)*resolution),canvas=canvasLike(c,w,h);if(!canvas)return null;
  const ctx=canvas.getContext('2d');ctx.setTransform(resolution,0,0,resolution,w/2,h/2);drawer(ctx,0,0,0,bucket,{...body,scale:1,size:bucket});
  const sprite={canvas,drawer,bucket,resolution,w:w/resolution,h:h/resolution};sprites.set(key,sprite);renderStats.spriteEntries=sprites.size;return sprite;
 }
 function drawShard(c,f,body,drawer,m,vector=false){
  const resolution=Math.max(1,Math.min(4,Math.ceil(Math.hypot(m.a,m.b)*2))),sprite=vector?null:shardSprite(c,drawer,body,f.size,resolution);
  if(!sprite){setMatrix(c,m);c.save();c.translate(f.x,f.y);c.rotate(f.rotation);c.scale(f.stretchX,f.stretchY);drawer(c,0,0,0,f.size,{...body,scale:1,size:f.size});c.restore();return;}
  const co=f.cos??Math.cos(f.rotation),si=f.sin??Math.sin(f.rotation),sx=f.size/sprite.bucket*f.stretchX,sy=f.size/sprite.bucket*f.stretchY;
  c.setTransform(m.a*co*sx+m.c*si*sx,m.b*co*sx+m.d*si*sx,-m.a*si*sy+m.c*co*sy,-m.b*si*sy+m.d*co*sy,m.a*f.x+m.c*f.y+m.e,m.b*f.x+m.d*f.y+m.f);
  c.drawImage(sprite.canvas,-sprite.w/2,-sprite.h/2,sprite.w,sprite.h);
 }
 function drawSettledRun(c,run,drawer,m,vector){
  const key=run[0].id+'|'+run[run.length-1].id+'|'+(vector?'v':'s');let entry=settledLayers.get(key);
  if(!entry||entry.drawer!==drawer){
   const pieces=[];let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
   for(const body of run)for(const fragment of body.fragments){const f=fragmentPose(body,fragment,SETTLED_MS),co=f.cos,si=f.sin;pieces.push({f,body});for(const p of fragment.vertices){const x=f.x+p[0]*co-p[1]*si,y=f.y+p[0]*si+p[1]*co,px=m.a*x+m.c*y+m.e,py=m.b*x+m.d*y+m.f;minX=Math.min(minX,px);maxX=Math.max(maxX,px);minY=Math.min(minY,py);maxY=Math.max(maxY,py);}}
   const x=Math.max(0,Math.floor(minX)-4),y=Math.max(0,Math.floor(minY)-4),right=Math.min(c.canvas.width,Math.ceil(maxX)+4),bottom=Math.min(c.canvas.height,Math.ceil(maxY)+4),w=Math.max(1,right-x),h=Math.max(1,bottom-y),canvas=canvasLike(c,w,h);if(!canvas)return false;
   const ctx=canvas.getContext('2d'),local={a:m.a,b:m.b,c:m.c,d:m.d,e:m.e-x,f:m.f-y};for(const p of pieces)drawShard(ctx,p.f,p.body,drawer,local,vector);
   entry={canvas,x,y,drawer};settledLayers.set(key,entry);renderStats.settledCacheBuilds++;
  }
  c.setTransform(1,0,0,1,0,0);c.drawImage(entry.canvas,entry.x,entry.y);renderStats.settledCachedDraws++;return true;
 }
 function draw(c,age,adapters={}){
  let whole=0,shards=0;if(adapters.reduced)return{whole,shards};
  const m=c.getTransform(),transformKey=matrixKey(m,c);if(transformKey!==cacheTransformKey){settledLayers.clear();cacheTransformKey=transformKey;}
  if(adapters.shard&&!adapters.vectorShards&&!sprites.size){const resolution=Math.max(1,Math.min(4,Math.ceil(Math.hypot(m.a,m.b)*2)));for(const body of bodies)for(const f of body.fragments)shardSprite(c,adapters.shard,body,f.size,resolution);}
  if(age<releaseMs)return{whole,shards};
  let run=[];
  const flush=()=>{if(!run.length)return;if(!drawSettledRun(c,run,adapters.shard,m,!!adapters.vectorShards)){for(const body of run)for(const fragment of body.fragments)drawShard(c,fragmentPose(body,fragment,age),body,adapters.shard,m,!!adapters.vectorShards);}run=[];};
  const call=(callback,p,item)=>{if(!callback)return;c.save();c.translate(p.x,p.y);c.rotate(p.rotation);c.scale((item.scale??1)*(p.stretchX??1),(item.scale??1)*(p.stretchY??1));callback(c,0,0,0,p.size??item.size,item);c.restore();};
  for(const body of bodies){
   if(adapters.front!==undefined&&body.front!==adapters.front)continue;
   const p=pose(body,age);if(p.status==='held')continue;
   if(p.status==='shattered'){
    if(adapters.shard&&age>=SETTLED_MS&&adapters.cache!==false){run.push(body);shards+=body.fragments.length;continue;}
    flush();for(const fragment of body.fragments){const f=fragmentPose(body,fragment,age);if(adapters.shard)drawShard(c,f,body,adapters.shard,m,!!adapters.vectorShards);shards++;}
   }else{flush();setMatrix(c,m);call(adapters[body.kind],p,body);whole++;}
  }
  flush();setMatrix(c,m);
  return{whole,shards};
 }
 return{releaseMs,bounds:{...b},count:bodies.length,firstImpactMs:bodies.length?Math.min(...bodies.map(p=>p.impactMs)):Infinity,lastImpactMs:bodies.length?Math.max(...bodies.map(p=>p.impactMs)):Infinity,inspect,draw,renderStats};
}
root.CashoutProjectiles={create};
if(typeof module!=='undefined'&&module.exports)module.exports=root.CashoutProjectiles;
})(typeof window!=='undefined'?window:globalThis);
