(()=>{
'use strict';
const BPM=115,BEAT=60000/BPM,TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
const ease=n=>{n=clamp(n);return n*n*(3-2*n);};
const colors=[[102,173,255],[240,119,208],[255,209,101],[107,224,181]];
function state(scene){
  if(!scene.caught)return null;
  const age=Math.max(0,scene.age||0),fade=ease((age-80)/1600);
  if(!fade)return null;
  const visible=scene.width*600/scene.height,left=(900-visible)/2;
  const ballX=.75+.09*clamp((355-visible)/50);
  const time=scene.reduced?0:(Number.isFinite(scene.winMusicTime)?scene.winMusicTime:age);
  return{age,fade,visible,left,time,phase:time/BEAT,x:left+visible*ballX,y:scene.reduced?94:-56+150*ease((age-300)/660),r:29};
}
function rgba(rgb,a){return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${a})`;}
function glow(ctx,x,y,rx,ry,color,alpha){
  ctx.save();ctx.translate(x,y);ctx.scale(rx,ry);
  const g=ctx.createRadialGradient(0,0,0,0,0,1);
  g.addColorStop(0,rgba(color,alpha));g.addColorStop(.45,rgba(color,alpha*.5));g.addColorStop(1,rgba(color,0));
  ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
}
function drawBack(ctx,scene){
  const s=state(scene);if(!s)return;
  ctx.save();
  ctx.globalCompositeOperation='screen';
  for(let i=0;i<4;i++){
    const a=s.phase*TAU/16+i*1.8;
    const x=s.left+s.visible*(.18+.22*i)+Math.sin(a)*s.visible*.15;
    const pulse=scene.reduced?1:.86+.14*Math.cos(s.phase*Math.PI-i*.8);
    glow(ctx,x,185+Math.cos(a*.8)*105,s.visible*.38,220,colors[i],.2*s.fade*pulse);
    glow(ctx,s.left+s.visible*(.14+.24*i)+Math.sin(a)*38,530+Math.cos(a)*26,100,24,colors[(i+1)%4],.34*s.fade*pulse);
  }
  ctx.restore();
}
function sphere(ctx,s,reduced){
  const{x,y,r}=s,spin=reduced?0:s.phase*TAU/8;
  ctx.save();
  ctx.strokeStyle='#615d49';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,y-r-5);ctx.stroke();
  ctx.fillStyle='#b5a678';ctx.fillRect(x-4,y-r-5,8,7);
  glow(ctx,x,y,r*2.6,r*2.6,[164,208,220],.22*s.fade);
  ctx.save();ctx.translate(x,y);
  const g=ctx.createRadialGradient(-r*.35,-r*.4,1,0,0,r);
  g.addColorStop(0,'#fffdf2');g.addColorStop(.42,'#d4e3db');g.addColorStop(.78,'#72978e');g.addColorStop(1,'#334c48');
  ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,TAU);ctx.fill();ctx.clip();
  // Curved mirror facets follow a sphere instead of a flat checkerboard.
  const rows=9,cols=24;
  for(let row=0;row<rows;row++){
    const lat0=-Math.PI/2+row*Math.PI/rows,lat1=lat0+Math.PI/rows;
    for(let col=0;col<cols;col++){
      const lng0=spin+col*TAU/cols,lng1=lng0+TAU/cols,mid=(lng0+lng1)/2;
      if(Math.cos(mid)<=0)continue;
      const x00=r*Math.cos(lat0)*Math.sin(lng0),x01=r*Math.cos(lat0)*Math.sin(lng1);
      const x10=r*Math.cos(lat1)*Math.sin(lng0),x11=r*Math.cos(lat1)*Math.sin(lng1);
      const light=Math.max(0,.72*Math.cos(mid)-.35*Math.sin(mid)-.25*Math.sin((lat0+lat1)/2));
      const tile=.5+.5*Math.sin(col*2.1+row*1.7),tone=60+Math.round(light*140+tile*50);
      ctx.fillStyle=`rgba(${tone},${Math.min(255,tone+12)},${Math.min(255,tone+18)},.9)`;
      ctx.strokeStyle='rgba(24,44,61,.66)';ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(x00,r*Math.sin(lat0));ctx.lineTo(x01,r*Math.sin(lat0));ctx.lineTo(x11,r*Math.sin(lat1));ctx.lineTo(x10,r*Math.sin(lat1));ctx.closePath();ctx.fill();ctx.stroke();
    }
  }
  ctx.restore();
  ctx.strokeStyle='#38584f';ctx.lineWidth=1.1;ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.stroke();
  for(let i=0;i<5;i++){
    const a=spin+i*2.1,xx=x+Math.sin(a)*r*.66,yy=y+Math.cos(a*1.2)*r*.65;
    const b=reduced?.8:.18+.82*Math.pow(.5+.5*Math.sin(s.phase*Math.PI/2+i*1.7),4),length=2+4*b;
    ctx.globalAlpha=b*s.fade;ctx.strokeStyle='#fffce2';ctx.lineWidth=1.25;
    ctx.beginPath();ctx.moveTo(xx-length,yy);ctx.lineTo(xx+length,yy);ctx.moveTo(xx,yy-length);ctx.lineTo(xx,yy+length);ctx.stroke();
  }
  ctx.restore();
}
function drawFront(ctx,scene){
  const s=state(scene);if(!s)return;
  // One shared lighting pass after the character and debris are painted keeps
  // skin, shirt, dishes and room under the same smoothly changing ambience.
  ctx.save();ctx.globalCompositeOperation='multiply';ctx.globalAlpha=.86*s.fade;
  ctx.fillStyle='#3b5db5';ctx.fillRect(s.left,0,s.visible,600);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=.22*s.fade;
  ctx.fillStyle='#102759';ctx.fillRect(s.left,0,s.visible,600);ctx.restore();
  ctx.save();ctx.globalCompositeOperation='screen';
  const sweep=scene.reduced?.5:.5+.5*Math.sin(s.phase*TAU/24);
  glow(ctx,s.left+s.visible*(.2+.6*sweep),245,s.visible*.36,250,[130,170,255],.2*s.fade);
  glow(ctx,s.left+s.visible*(.8-.6*sweep),295,s.visible*.28,185,[187,121,230],.09*s.fade);
  ctx.restore();
  ctx.save();ctx.globalAlpha=s.fade;
  // Reflections drift on the room, with a gentle pulse rather than hard flashes.
  for(let i=0;i<28;i++){
    const a=(scene.reduced?0:s.phase*TAU/32)+i*2.39996;
    const x=s.left+s.visible*(.05+((i*.381966)% .9))+Math.sin(a)*12;
    const y=70+(i*83%490)+Math.cos(a*.8)*13;
    ctx.fillStyle=rgba(colors[i%4],.12+.10*(.5+.5*Math.sin(a)));
    ctx.beginPath();ctx.ellipse(x,y,2.2,1.4,a,0,TAU);ctx.fill();
  }
  sphere(ctx,s,scene.reduced);ctx.restore();
}
window.DiscoScene=Object.freeze({drawBack,drawFront,bpm:BPM});
})();
