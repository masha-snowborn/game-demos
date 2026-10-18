(()=>{
'use strict';
const $=id=>document.getElementById(id),M=BottleMath,model=M.createModel();
const TICK=2680,DROP=520,KEY='stair-crazy-v1';
const clamp01=n=>Math.max(0,Math.min(1,n));
// Exact bars in the soundtrack and the stride share the same media clock.
// The first and every subsequent landing is a downbeat; takeoff is one beat earlier.
const BEATS_PER_STEP=4,SOURCE_BPM=123,MUSIC_RATE=1.15,CONTACT=2300;
const BASE_PACE=TICK/(BEATS_PER_STEP*60000/SOURCE_BPM/MUSIC_RATE);
const INTRO=(TICK-CONTACT)/BASE_PACE;
const paceForStep=step=>BASE_PACE*(1+.48*(1-Math.exp(-Math.max(0,step-3)/18)));
function rhythmClock(elapsed){
  if(elapsed<INTRO)return{clock:Math.max(0,elapsed),pace:BASE_PACE};
  let remaining=elapsed-INTRO,pace=paceForStep(0);
  const first=CONTACT/pace;
  if(remaining<first)return{clock:INTRO+remaining*pace,pace};
  remaining-=first;let landing=1;
  // Tempo changes at the actual leading-foot contact, rather than at the
  // later counter update. Four musical beats then always equal one stride.
  while(landing<73&&remaining>=TICK/paceForStep(landing)){
    remaining-=TICK/paceForStep(landing);landing++;
  }
  pace=paceForStep(landing);
  return{clock:INTRO+CONTACT+(landing-1)*TICK+remaining*pace,pace};
}
function roundClock(r,now){
  const media=typeof WaiterAudio!=='undefined'&&typeof WaiterAudio.roundTime==='function'?WaiterAudio.roundTime(now):NaN;
  return rhythmClock(Number.isFinite(media)?media:Math.max(0,now-r.startedAt));
}
function motionClock(r,now){return roundClock(r,now).clock;}
// A planted pause, a weight shift and a supported step onto the next table.
function movement(elapsed,preparing){
  if(preparing||elapsed<1400)return{motionPhase:'hold',motionProgress:preparing?0:elapsed/1400,motionTravel:0};
  if(elapsed<2100){const p=(elapsed-1400)/700;return{motionPhase:'step',motionProgress:p,motionTravel:p*p*(3-2*p)};}
  if(elapsed<TICK-DROP)return{motionPhase:'teeter',motionProgress:(elapsed-2100)/(TICK-DROP-2100),motionTravel:1};
  return{motionPhase:'drop',motionProgress:clamp01((elapsed-(TICK-DROP))/DROP),motionTravel:1};
}
let balance=100000,history=[],round=null,last=null,toastTimer,splashOpen=true;
try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&Number.isSafeInteger(s.balance)&&s.balance>=0&&s.balance<=1e14&&Array.isArray(s.history)){balance=s.balance;history=s.history.filter(h=>h&&['lost','caught'].includes(h.kind)&&Number.isInteger(h.step)&&h.step>=0&&h.step<=model.horizon&&Number.isSafeInteger(h.quote)&&h.quote>=0&&h.quote<=100000&&Number.isSafeInteger(h.payout)&&h.payout>=0).slice(0,12);}}catch{}
const number=(n,d=2)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const quote=q=>(q/100).toFixed(2)+'×';
function persist(){try{localStorage.setItem(KEY,JSON.stringify({balance,history}));}catch{}}
function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2600);}
function tone(type){if(typeof WaiterAudio!=='undefined')WaiterAudio.trigger(type);}
function syncSoundButton(){const enabled=typeof WaiterAudio!=='undefined'&&WaiterAudio.enabled;$('sound').setAttribute('aria-pressed',String(enabled));$('sound').setAttribute('aria-label',enabled?'Turn sound off':'Turn sound on');$('sound-wave').setAttribute('d',enabled?'M15 8q5 4 0 8M18 5q8 7 0 14':'m16 9 6 6m0-6-6 6');}

function stake(){const s=Number($('stake').value);if(!Number.isInteger(s)||s<1||s>1000000)return{error:'Use a whole-credit bet from 1 to 1,000,000 CR.'};if(s*100>balance)return{error:'Not enough virtual credits.'};return{value:s};}
function updateStake(){const value=Number($('stake').value);document.querySelectorAll('[data-stake]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.stake)===value));$('bet-error').textContent=stake().error||'';}
function historyRender(){const el=$('history');el.replaceChildren();if(!history.length){const empty=document.createElement('div');empty.className='history-empty';const arrow=document.createElement('span');arrow.textContent='↘';empty.append(arrow,document.createTextNode('Your runs will appear here.'));el.append(empty);return;}history.forEach(h=>{const item=document.createElement('div');item.className='history-chip '+h.kind;const big=document.createElement('b');big.textContent=h.kind==='lost'?'0.00×':quote(h.quote);const detail=document.createElement('span');detail.textContent=h.kind==='lost'?`Fell · step ${h.step}`:`+${number(h.payout/100)} CR · ${h.step}`;item.append(big,detail);el.append(item);});}
// One physical serving tray owns all round actions. The action changes
// immediately; only the printed label swaps while the platter is edge-on.
let actionMode=null,actionFlipEpoch=0,actionFlipTimers=[];
function updateAction(){
  const dead=last?.kind==='lost'&&!last.resurrected;
  const falling=dead&&last.reviveAt==null&&!reduced&&performance.now()-last.at<GrannyScene.fallingPose(0,false,last.step,model.horizon).landAt*1000;
  const button=$('release'),mode=round?'cashout':dead?(falling?'falling':last.reviveAt!=null?'reviving':'resurrect'):last?'another':'start';
  const label=mode==='cashout'?'Cash out':mode==='falling'?'AAAAAA!!!':mode==='resurrect'?'One More Life':mode==='reviving'?'Reviving…':mode==='another'?'Another run':"Let's go";
  const soulReady=reduced||!dead||performance.now()-last.at>=GrannyScene.fallingPose(0,false,last.step,model.horizon).landAt*1000+2250;
  button.disabled=(!!round&&round.step===0)||mode==='falling'||mode==='reviving'||(mode==='resurrect'&&!soulReady);
  button.dataset.mode=mode;
  button.setAttribute('aria-label',label);
  button.setAttribute('aria-disabled',String(button.disabled));
  if(mode===actionMode)return;
  const initial=actionMode===null;actionMode=mode;
  const epoch=++actionFlipEpoch;
  actionFlipTimers.forEach(clearTimeout);actionFlipTimers=[];
  button.classList.remove('is-flipping');
  if(initial||reduced){button.firstElementChild.textContent=label;return;}
  // Restart a cancelled turn cleanly if another round begins before it ends.
  void button.offsetWidth;
  button.classList.add('is-flipping');
  actionFlipTimers.push(setTimeout(()=>{
    if(epoch===actionFlipEpoch)button.firstElementChild.textContent=label;
  },180));
  actionFlipTimers.push(setTimeout(()=>{
    if(epoch!==actionFlipEpoch)return;
    button.firstElementChild.textContent=label;button.classList.remove('is-flipping');actionFlipTimers=[];
  },360));
}
function update(){const active=!!round,step=round?.step??last?.step??0,q=round?model.quotes[step]:(last?.quote??100);$('balance').textContent=number(balance/100);$('win-label').textContent='WIN';$('mult-label').textContent=last&&!active?'ROUND MULTIPLIER':'CURRENT MULTIPLIER';$('multiplier').dataset.digits=String(Math.floor(q/100)).length;$('multiplier').innerHTML=(q/100).toFixed(2)+'<span>×</span>';$('step-counter').textContent='STEP '+String(step).padStart(2,'0');updateAction();
  if(typeof WaiterAudio!=='undefined'&&WaiterAudio.setPace)WaiterAudio.setPace(round?.pace??last?.pace??1);
  [$('stake'),$('minus'),$('plus'),...document.querySelectorAll('[data-stake]')].forEach(el=>el.disabled=active);
  $('win').textContent=number(active?(step>0?M.payoutCents(round.stake,q)/100:0):(last?.payout??0)/100);
  $('scene-status').textContent=active?(round.phase==='intro'?'EASY DOES IT!':round.phase==='flight'?'WATCH YOUR STEP':'STEADY ON, DEAR'):last?(last.kind==='lost'?'OH, BISCUITS!':'GRANNY’S GOT MOVES'):'READY WHEN YOU ARE';
  $('live-dot').classList.toggle('active',active);
  $('scene-hint').textContent=active?(step===0?'First step ahead.':'Cash out anytime at your current multiplier.'):last?(last.kind==='lost'?'The stairs won this one.':'A good time to stop.'): 'Every step is another chance.';
  $('control-hint').innerHTML=active?(step===0?'First step ahead.<br> Cash out unlocks after the step.':'Cash out anytime,<br> at your current multiplier.'):last?'Ready for another run?<br> A new run is a new bet.':'Cash out after the first<br> safe step.';
  const next=active?step:0,p=model.survival(Math.min(next,model.horizon-1));$('next-mult').textContent=quote(model.quotes[Math.min(next+1,model.horizon)]);$('next-chance').textContent=(100*p.numerator/p.denominator).toFixed(2)+'%';$('risk-bar').style.width=(100*p.numerator/p.denominator)+'%';
  $('scene-message').className='scene-message'+(last&&!active?' visible '+last.kind:'');
  if(last&&!active){$('message-tag').textContent=last.kind==='lost'?'A LITTLE DETOUR':'TIME TO BOOGIE';$('message-title').textContent=last.kind==='lost'?'Absolutely outrageous!':`+${number(last.payout/100)} CR`;$('message-detail').textContent=last.kind==='lost'?`Step ${last.step} · payout 0.00 CR`:`${quote(last.quote)} · ${last.auto?'End of the ride!':'Granny’s got moves!'}`;}
  document.body.className=(active?'is-active':last&&!last.resurrected?'is-'+last.kind:'')+(splashOpen?' splash-open':'');
  if(last?.kind==='lost'){
    const revived=last.resurrected,reviving=last.reviveAt!=null&&!revived;
    $('scene-status').textContent=revived?'READY WHEN YOU ARE':reviving?'BACK FROM THE BEYOND':'A SPIRITED EXIT';
    $('control-hint').innerHTML=revived?'Ready for another run?<br> A new run is a new bet.':reviving?'Soul returning…<br> No new bet.':'Bring Granny back<br> to reach the next staircase.';
    if(revived||reviving)$('scene-message').className='scene-message';
    if(revived)$('step-counter').textContent='STEP 00';
    if(!revived&&!reviving){$('message-tag').textContent='A SPIRITED EXIT';$('message-title').textContent='Not the end of me!';}
  }
  $('scene').setAttribute('aria-label',active?`Granny ${round.phase==='intro'?'waiting with her walker at the first step':'descending the hospital staircase'}, step ${step}, multiplier ${quote(q)}`:last?.kind==='lost'?(last.resurrected?'Granny standing with her walker at the next staircase':last.reviveAt!=null?'Light spreads across the screen and reveals Granny at the next staircase':'Granny tumbles onto her back and her soul floats above her'):last?'Granny celebrates with a disco dance':'Granny waiting with her walker at the first step');
}
function finish(kind,now,auto=false,atMotion){const r=round;if(!r)return;const payout=kind==='caught'?M.payoutCents(r.stake,model.quotes[r.step]):0;last={kind,step:r.step,quote:kind==='caught'?model.quotes[r.step]:0,payout,stake:r.stake,auto,at:now,motionClock:atMotion??motionClock(r,now),pace:r.pace};balance+=payout;history.unshift({...last});history=history.slice(0,12);round=null;persist();historyRender();update();if(kind==='lost'&&typeof WaiterAudio.setLossDuration==='function')WaiterAudio.setLossDuration(GrannyScene.fallingPose(0,false,r.step,model.horizon).landAt*1000,GrannyScene.fallingPose(0,false,r.step,model.horizon).totalDistance);tone(kind==='caught'?'catch':'break');}
function sync(now){if(!round)return;const rhythm=roundClock(round,now);let changed=false;if(round.pace!==rhythm.pace){round.pace=rhythm.pace;changed=true;}while(round&&rhythm.clock+1e-7>=INTRO+(round.step+1)*TICK){round.step++;if(round.step===round.breakStep){finish('lost',now,false,INTRO+round.step*TICK);return;}if(round.step===model.horizon){finish('caught',now,true,INTRO+round.step*TICK);return;}round.phase='rolling';changed=true;}if(round){const phase=rhythm.clock<INTRO?'intro':rhythm.clock-INTRO-round.step*TICK>=TICK-DROP?'flight':'rolling';if(round.phase!==phase){round.phase=phase;changed=true;}}if(changed)update();}
function release(){if(splashOpen||round)return;
  // During the first half of an outcome flip, the tray still visibly says
  // Cash out. That click must never be interpreted as a fresh paid run.
  const visibleLabel=$('release').firstElementChild.textContent;
  if(last?.kind==='lost'&&!last.resurrected){
    const soulReady=reduced||performance.now()-last.at>=GrannyScene.fallingPose(0,false,last.step,model.horizon).landAt*1000+2250;
    if(last.reviveAt!=null||!soulReady||visibleLabel!=='One More Life')return;
    last.reviveAt=performance.now();WaiterAudio.resurrect();update();return;
  }
  if(visibleLabel!==(last?'Another run':"Let's go"))return;
  const s=stake();if(s.error){$('bet-error').textContent=s.error;toast(s.error);return;}const now=performance.now();let breakStep;try{breakStep=M.chooseBreakStep(model);}catch{toast('Random number generator unavailable.');return;}balance-=s.value*100;round={stake:s.value,step:0,phase:'intro',startedAt:now,pace:BASE_PACE,breakStep};last=null;camera=0;persist();update();tone('release');}
function collect(){const now=performance.now();sync(now);if(!round||round.step===0)return;finish('caught',now);}
$('release').addEventListener('click',()=>{if(round)collect();else release();});$('stake').addEventListener('input',updateStake);
$('minus').onclick=()=>{if(!round){$('stake').value=Math.max(1,(Number($('stake').value)||1)-5);updateStake();}};$('plus').onclick=()=>{if(!round){$('stake').value=Math.min(1000000,(Number($('stake').value)||0)+5);updateStake();}};
document.querySelectorAll('[data-stake]').forEach(b=>b.onclick=()=>{if(!round){$('stake').value=b.dataset.stake;updateStake();}});
$('sound').onclick=()=>{if(typeof WaiterAudio!=='undefined')WaiterAudio.setEnabled(!WaiterAudio.enabled);syncSoundButton();};
syncSoundButton();
function openRules(){if(!$('rules').open)$('rules').showModal();}$('rules-open').onclick=openRules;$('math-open').onclick=openRules;$('rules-close').onclick=()=>$('rules').close();$('rules').addEventListener('click',e=>{if(e.target===$('rules')){const r=$('rules').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('rules').close();}});
$('reset').onclick=()=>{if(round){toast('Finish this run before resetting the balance.');return;}balance=100000;history=[];last=null;camera=0;persist();historyRender();update();updateStake();$('rules').close();toast('Fresh start: 1,000 virtual CR.');};
function enterGame(){
 if(!splashOpen||!GrannyScene.ready)return;
 WaiterAudio.wait();
 splashOpen=false;$('splash-play').disabled=true;$('splash').classList.add('is-leaving');update();draw(performance.now(),0);
 setTimeout(()=>{$('splash').hidden=true;document.querySelector('.stage').inert=false;document.querySelector('.controls').inert=false;$('release').focus({preventScroll:true});},reduced?0:270);
}
$('splash-play').addEventListener('click',enterGame);
document.addEventListener('keydown',e=>{if(splashOpen){if(!e.repeat&&!$('rules').open&&['Space','Enter'].includes(e.code)&&(!['BUTTON','A'].includes(document.activeElement.tagName)||document.activeElement===$('splash-play'))){e.preventDefault();enterGame();}return;}if(e.code!=='Space'||e.repeat||$('rules').open||['INPUT','BUTTON','TEXTAREA','A'].includes(document.activeElement.tagName))return;e.preventDefault();if(round)collect();else release();});
// Canvas scene using original artwork; no executable code is imported from the source app.
const canvas=$('scene'),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;let camera=0,prev=performance.now(),width=900,height=548,dpr=1;
function resize(){const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);if(width>0&&height>0)draw(performance.now(),0);}
new ResizeObserver(resize).observe(canvas);resize();
function path(points,fill,stroke){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke();}}
function rr(x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
function draw(now,dt){
 if(splashOpen){
  const cv=$('splash-scene'),rect=cv.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
  if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;}
  const c=cv.getContext('2d'),z=rect.height/600,ox=(rect.width-900*z)/2;c.setTransform(ratio*z,0,0,ratio*z,ratio*ox,0);
  GrannyScene.drawSplash(c,{width:rect.width,height:rect.height,time:now,reduced});
  if(GrannyScene.ready&&$('splash-play').disabled){$('splash-play').disabled=false;$('splash-play').firstElementChild.textContent='Play';}
  return;
 }
  const zoom=height/600,offset=(width-900*zoom)/2;
  ctx.setTransform(dpr*zoom,0,0,dpr*zoom,dpr*offset,0);
  ctx.clearRect(-offset/zoom,0,width/zoom,600);
  const r=round,step=r?.step??(last?.resurrected?0:last?.step??0);
  const rhythm=r?roundClock(r,now):null;
  const elapsed=r?Math.max(0,Math.min(TICK,rhythm.clock-INTRO-r.step*TICK)):0,progress=elapsed/TICK;
  const flight=r&&r.phase==='flight'?clamp01((elapsed-(TICK-DROP))/DROP):0;
  const preparing=!!r&&rhythm.clock<INTRO,introProgress=r?clamp01(rhythm.clock/INTRO):0;
  const voice=last?.kind==='lost'&&typeof WaiterAudio!=='undefined'?WaiterAudio.voicePose:null;
  const scene={voiceLevel:voice?.level??0,voiceActive:voice?.active??false,voiceTime:voice?.time??0,time:now,motionClock:r?motionClock(r,now):(last?.motionClock??0),pace:r?.pace??last?.pace??1,width,height,tickMilliseconds:TICK,dropMilliseconds:DROP,step,progress,flight,preparing,introProgress,...movement(elapsed,preparing),lost:last?.kind==='lost'&&!last.resurrected,reviving:last?.reviveAt!=null&&!last.resurrected,reviveAge:last?.reviveAt!=null?now-last.reviveAt:0,age:last?now-last.at:0,caught:last?.kind==='caught',reduced,active:!!r,horizon:model.horizon,quotes:model.quotes};
  if(scene.caught){
    const victoryTime=typeof WaiterAudio!=='undefined'&&typeof WaiterAudio.victoryTime==='function'?WaiterAudio.victoryTime(now):NaN;
    scene.winMusicTime=Number.isFinite(victoryTime)?victoryTime:scene.age;
  }
  const hit=GrannyScene.impactShake(scene.lost&&!scene.reviving?scene.age:-1,reduced);document.querySelector('.game-layout').style.transform=hit.x||hit.y?`translate(${hit.x}px,${hit.y}px) rotate(${hit.angle}deg)`:'';
  $('revival-light').style.opacity=scene.lost&&scene.reviving?GrannyScene.revivePose(scene.reviveAge,reduced).cover:0;
  if(typeof GrannyScene!=='undefined')GrannyScene.draw(ctx,scene);
  if(scene.lost&&scene.reviving&&GrannyScene.revivePose(scene.reviveAge,reduced).complete){last.resurrected=true;update();}
}

let raf;function frame(now){sync(now);if(last?.kind==='lost'&&!last.resurrected)updateAction();draw(now,Math.min(100,now-prev));prev=now;raf=requestAnimationFrame(frame);}historyRender();update();updateStake();raf=requestAnimationFrame(frame);
// Safari can defer animation frames in a newly opened background window.
// Paint the loaded artwork once even before that window receives its first frame.
window.addEventListener('load',()=>draw(performance.now(),0),{once:true});
// A fixed clock re-check on visibility keeps cash-out eligibility in sync with impacts.
document.addEventListener('visibilitychange',()=>{sync(performance.now());});
})();
