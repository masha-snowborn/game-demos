/* Port of Games.BottleStairs.Math.BottleModel and ReleaseBottle.
   Source: BottleStairs-osx-arm64.app / embedded BottleStairs.dll. */
(function(root){
  'use strict';
  const DEFAULTS=Object.freeze({targetReturn:98,growthPercent:10,maximumMultiplier:1000});
  function createModel(config=DEFAULTS){
    const {targetReturn,growthPercent,maximumMultiplier}=config;
    if(![targetReturn,growthPercent,maximumMultiplier].every(Number.isInteger)||targetReturn<1||targetReturn>100||growthPercent<1||growthPercent>100||maximumMultiplier<2||maximumMultiplier>10000)throw new RangeError('Invalid BottleStairs settings');
    const cap=maximumMultiplier*100,quotes=[100];
    while(quotes.at(-1)<cap)quotes.push(Math.min(cap,Math.floor((quotes.at(-1)*(100+growthPercent)+99)/100)));
    const horizon=quotes.length-1;
    const survival=step=>{if(!Number.isInteger(step)||step<0||step>=horizon)throw new RangeError('Invalid step');return {numerator:step===0?targetReturn:quotes[step],denominator:quotes[step+1]};};
    return Object.freeze({config:Object.freeze({...config}),quotes:Object.freeze(quotes),horizon,survival});
  }
  function randomBelow(limit){
    if(!Number.isInteger(limit)||limit<1||limit>0x100000000)throw new RangeError('Invalid limit');
    const ceiling=Math.floor(0x100000000/limit)*limit,words=new Uint32Array(1);
    do{root.crypto.getRandomValues(words);}while(words[0]>=ceiling);
    return words[0]%limit;
  }
  function chooseBreakStep(model,draw=randomBelow){
    for(let i=0;i<model.horizon;i++){const p=model.survival(i);if(draw(p.denominator)>=p.numerator)return i+1;}
    return model.horizon+1;
  }
  function payoutCents(stake,quote){
    if(!Number.isInteger(stake)||stake<1||stake>1000000||!Number.isInteger(quote)||quote<0||quote>1000000)throw new RangeError('Invalid payout');
    return stake*quote;
  }
  const api={DEFAULTS,createModel,randomBelow,chooseBreakStep,payoutCents};
  root.BottleMath=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);
