/* Gesture-started gameplay music, original result effects, and result music. */
(() => {
  'use strict';

  const PREF_KEY = 'stair-crazy-sound-enabled';
  const THEME_VOLUME = .54, CRASH_VOLUME = .48, WIN_VOLUME = .55, LOSE_TAG_VOLUME = .78;
  const DISCO_VOLUME = .65, GRUMPY_VOLUME = .48, GRUMPY_DUCKED_VOLUME = .25;
  const WAITING_VOLUME = .28;
  const BASE_RATE = 1.15, DISCO_BPM = 115;
  const DISCO_LOOP_MS = 32 * 60000 / DISCO_BPM;
  const WALK_BASE_PACE = 2680 / (4 * 60000 / 123 / BASE_RATE);
  // 25ms RMS windows from the supplied losing voice with leading silence removed. Values are
  // noise-gated, normalized and interpolated in source time; no audio rerouting.
  const VOICE_WINDOW = .025, VOICE_DURATION = 1.5869166666666668;
  const VOICE_LEVELS = [0.0,0.165,0.234,0.238,0.792,1.0,1.0,1.0,0.897,0.751,0.605,0.481,0.242,0.023,0.0,0.0,0.0,0.282,0.497,0.459,0.416,0.138,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.382,0.993,1.0,0.925,0.537,0.089,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0];

  let pace = 1, enabled = true;
  try { enabled = localStorage.getItem(PREF_KEY) !== 'false'; } catch {}
  const scriptURL = document.currentScript?.src || document.baseURI;
  const file = name => new URL('assets/audio/' + name, scriptURL).href;
  // One continuous pre-rendered73-step soundtrack, always at native rate.
  const theme = new Audio(file('orchestra-beat-locked-v2.m4a'));
  const crash = new Audio(file('fast-stair-fall-18.m4a'));
  const fallPiano = new Audio(file('wild-wobble-whistle-v1.m4a'));
  const landing = new Audio(file('landing-splat-v2.m4a'));
  let crashSteps=18;
  const win = new Audio(file('victory.wav'));
  const loseTag = new Audio(file('granny-mutter-v1.m4a'));
  const disco = new Audio(file('funky-win-v2.m4a'));
  const grumpy = new Audio(file('sad-afterlife-v1.m4a'));
  const waiting = new Audio(file('local-forecast-waiting-v1.m4a'));
  const tracks = [theme, crash, win, loseTag, disco, grumpy, fallPiano, landing, waiting];
  const ids = ['game-theme','game-crash','game-win','game-lose-tag','game-disco','game-grumpy','game-fall-piano','game-landing','game-waiting'];
  const volumes = [THEME_VOLUME,CRASH_VOLUME,WIN_VOLUME,LOSE_TAG_VOLUME,DISCO_VOLUME,GRUMPY_VOLUME,.80,.94,WAITING_VOLUME];
  tracks.forEach((track,index) => {
    const rate = 1;
    track.playbackRate = track.defaultPlaybackRate = rate;
    track.preservesPitch = true;
    track.preload = 'auto';track.volume = volumes[index];
    track.loop = track === disco || track === grumpy || track === waiting;
    track.id = ids[index];track.hidden = true;track.setAttribute('aria-hidden','true');
  });
  document.body.append(...tracks);

  const nowMilliseconds = () => performance.now();
  let wanted = false, clockAnchor = 0, clockAt = 0, clockUsesMedia = false;
  let themeStarting = false, themeEpoch = 0, roundEpoch = 0;
  let outcome = null, grumpyWanted = false;
  let waitingStarting = false, waitingEpoch = 0;
  let discoStarting = false, discoEpoch = 0, grumpyStarting = false, grumpyEpoch = 0;
  let victoryAnchor = 0, victoryAt = 0, victoryUsesMedia = false;
  let victoryOffset = 0, victoryLastNative = 0;
  let pendingLossTail = null, pendingWinRain = null, pendingLanding = null;
  let lossLandingMilliseconds = 4250;
  const effects = {
    break: { audio: crash, volume: CRASH_VOLUME, epoch: 0, active: false },
    fallPiano: { audio: fallPiano, volume: .80, epoch: 0, active: false },
    landing: { audio: landing, volume: .94, epoch: 0, active: false },
    catch: { audio: win, volume: WIN_VOLUME, epoch: 0, active: false },
    loseTag: { audio: loseTag, volume: LOSE_TAG_VOLUME, epoch: 0, active: false },
  };

  function roundTime(now = nowMilliseconds()) {
    if (!wanted) return clockAnchor;
    if (clockUsesMedia) {
      // Preserve the decoder's last position if it errors or stalls, rather than
      // jumping from a stale wall-clock anchor.
      clockAnchor = Math.max(0,Number(theme.currentTime) || 0) * 1000;clockAt = now;
      if (!theme.paused && !theme.ended && !theme.error) return clockAnchor;
      clockUsesMedia = false;
    }
    return clockAnchor + Math.max(0,now-clockAt);
  }
  function useFallbackClock() {
    const now = nowMilliseconds();clockAnchor = roundTime(now);clockAt = now;clockUsesMedia = false;
  }
  function discoLoopMilliseconds() {
    return Number.isFinite(disco.duration) && disco.duration > 0 ? disco.duration * 1000 : DISCO_LOOP_MS;
  }
  function victoryTime(now = nowMilliseconds()) {
    if (outcome !== 'win') return 0;
    if (victoryUsesMedia) {
      const native = Math.max(0,Number(disco.currentTime) || 0) * 1000;
      const length = discoLoopMilliseconds();
      if (native + length * .5 < victoryLastNative) victoryOffset += length;
      victoryLastNative = native;victoryAnchor = victoryOffset + native;victoryAt = now;
      if (!disco.paused && !disco.ended && !disco.error) return victoryAnchor;
      victoryUsesMedia = false;
    }
    return victoryAnchor + Math.max(0,now-victoryAt);
  }
  function useVictoryFallbackClock() {
    const now = nowMilliseconds();victoryAnchor = victoryTime(now);victoryAt = now;victoryUsesMedia = false;
  }
  function voicePose() {
    const duration = Number.isFinite(loseTag.duration) && loseTag.duration > 0 ? loseTag.duration : VOICE_DURATION;
    const time = Math.max(0,Number(loseTag.currentTime) || 0);
    const active = Boolean(effects.loseTag.active && enabled && !document.hidden && !loseTag.paused && !loseTag.ended && !loseTag.error && time < duration);
    const position = Math.max(0,time/VOICE_WINDOW-.5),index = Math.floor(position),blend = position-index;
    const level = active ? (VOICE_LEVELS[index] || 0)*(1-blend)+(VOICE_LEVELS[index+1] || 0)*blend : 0;
    return { active,level,time,duration };
  }
  theme.addEventListener('error',() => { if (wanted) useFallbackClock(); });
  disco.addEventListener('error',() => { if (outcome === 'win') useVictoryFallbackClock(); });
  // The media timeupdate event retains loop counts even between scene frames.
  disco.addEventListener('timeupdate',() => { if (outcome === 'win' && victoryUsesMedia) victoryTime(); });

  function pauseTheme() {
    useFallbackClock();themeEpoch++;themeStarting = false;theme.pause();
  }
  function pauseWaiting(){waitingEpoch++;waitingStarting=false;waiting.pause();}
  function pauseResultMusic() {
    pauseWaiting();
    useVictoryFallbackClock();discoEpoch++;discoStarting = false;disco.pause();
    grumpyEpoch++;grumpyStarting = false;grumpy.pause();
  }
  function resetResultMusic() {
    pauseResultMusic();
    try { disco.currentTime = 0;grumpy.currentTime = 0; } catch {}
    outcome = null;grumpyWanted = false;
    victoryAnchor = 0;victoryAt = nowMilliseconds();victoryUsesMedia = false;victoryOffset = 0;victoryLastNative = 0;
  }
  function clearWinImpact() {
    if (pendingWinRain?.timer != null) clearTimeout(pendingWinRain.timer);
    pendingWinRain = null;
  }
  function stopEffects() {
    pendingLossTail = null;clearWinImpact();
    if(pendingLanding!=null)clearTimeout(pendingLanding);pendingLanding=null;
    Object.values(effects).forEach(effect => {
      effect.epoch++;effect.active = false;effect.audio.pause();
      try { effect.audio.currentTime = 0; } catch {}
    });
    grumpy.volume = GRUMPY_VOLUME;
  }
  // The rig supplies its actual first floor contact, relative to the cashout.
  // No guessed delay is scheduled if the model is unavailable.
  function setWinImpactTime(delayMs) {
    const cue = pendingWinRain,delay = Number(delayMs);
    if (!cue || cue.scheduled || outcome !== 'win' || cue.round !== roundEpoch || !enabled || document.hidden || !Number.isFinite(delay) || delay < 100 || delay > 8000) return false;
    cue.scheduled = true;
    cue.timer = setTimeout(() => {
      if (pendingWinRain !== cue) return;
      pendingWinRain = null;
      if (cue.round !== roundEpoch || outcome !== 'win' || !enabled || document.hidden) return;
      // Winning china has no relationship to the losing spoken phrase.
      pendingLossTail = null;playEffect(effects.break);
    },Math.max(0,cue.at+delay-nowMilliseconds()));
    return true;
  }
  function startTheme() {
    if (!enabled || document.hidden || !wanted || !theme.paused || themeStarting) return;
    theme.volume = THEME_VOLUME;
    const epoch = ++themeEpoch;themeStarting = true;
    if (!clockUsesMedia) try { theme.currentTime = roundTime()/1000; } catch {}
    clockUsesMedia = true;
    try {
      Promise.resolve(theme.play()).then(() => {
        if (epoch === themeEpoch && (!enabled || document.hidden || !wanted)) theme.pause();
      }).catch(() => {
        if (epoch === themeEpoch) useFallbackClock();
      }).finally(() => { if (epoch === themeEpoch) themeStarting = false; });
    } catch { if (epoch === themeEpoch) { useFallbackClock();themeStarting = false; } }
  }
  function startDisco() {
    if (!enabled || document.hidden || outcome !== 'win' || !disco.paused || discoStarting) return;
    const epoch = ++discoEpoch;discoStarting = true;disco.volume = DISCO_VOLUME;
    if (!victoryUsesMedia) {
      const elapsed = victoryTime(),length = discoLoopMilliseconds(),native = elapsed % length;
      victoryOffset = elapsed-native;victoryLastNative = native;
      try { disco.currentTime = native/1000; } catch {}
    }
    victoryUsesMedia = true;
    try {
      Promise.resolve(disco.play()).then(() => {
        if (epoch === discoEpoch && (!enabled || document.hidden || outcome !== 'win')) disco.pause();
      }).catch(() => { if (epoch === discoEpoch) useVictoryFallbackClock();
      }).finally(() => { if (epoch === discoEpoch) discoStarting = false; });
    } catch { if (epoch === discoEpoch) { useVictoryFallbackClock();discoStarting = false; } }
  }
  function startGrumpy() {
    if (!enabled || document.hidden || !['loss','revival'].includes(outcome) || !grumpyWanted || !grumpy.paused || grumpyStarting) return;
    const epoch = ++grumpyEpoch;grumpyStarting = true;
    grumpy.volume = effects.loseTag.active && !loseTag.paused && !loseTag.ended && !loseTag.error ? GRUMPY_DUCKED_VOLUME : GRUMPY_VOLUME;
    try {
      Promise.resolve(grumpy.play()).then(() => {
        if (epoch === grumpyEpoch && (!enabled || document.hidden || !['loss','revival'].includes(outcome) || !grumpyWanted)) grumpy.pause();
      }).catch(() => {}).finally(() => { if (epoch === grumpyEpoch) grumpyStarting = false; });
    } catch { if (epoch === grumpyEpoch) grumpyStarting = false; }
  }
  function startWaiting(){
    if(!enabled||document.hidden||outcome!=='waiting'||wanted||!waiting.paused||waitingStarting)return;
    const epoch=++waitingEpoch;waitingStarting=true;waiting.volume=WAITING_VOLUME;
    try{
      Promise.resolve(waiting.play()).then(()=>{
        if(epoch===waitingEpoch&&(!enabled||document.hidden||outcome!=='waiting'||wanted))waiting.pause();
      }).catch(()=>{}).finally(()=>{if(epoch===waitingEpoch)waitingStarting=false;});
    }catch{if(epoch===waitingEpoch)waitingStarting=false;}
  }
  function wait(){
    if(outcome!=='waiting'||wanted){
      roundEpoch++;stopEffects();pauseTheme();wanted=false;resetResultMusic();outcome='waiting';
    }
    startWaiting();
  }
  function resumeMusic() {
    if (wanted) startTheme();
    else if (outcome === 'waiting') startWaiting();
    else if (outcome === 'win') startDisco();
    else if (outcome === 'loss' || outcome === 'revival') startGrumpy();
  }
  function playEffect(effect) {
    if (!enabled || document.hidden) return;
    const epoch = ++effect.epoch;
    effect.audio.pause();try { effect.audio.currentTime = 0; } catch {}
    effect.audio.volume = effect.volume;effect.active = true;
    const failed = () => {
      if (epoch === effect.epoch) { effect.active = false;if (effect === effects.break) pendingLossTail = null;if (effect === effects.loseTag) grumpy.volume = GRUMPY_VOLUME; }
    };
    try {
      Promise.resolve(effect.audio.play()).then(() => {
        if (epoch === effect.epoch && (!enabled || document.hidden || !effect.active)) effect.audio.pause();
      }).catch(failed);
    } catch { failed(); }
  }
  Object.values(effects).forEach(effect => {
    effect.audio.addEventListener('ended',() => {
      if (!effect.audio.ended) return;
      const wasActive = effect.active;effect.active = false;
      if (effect === effects.loseTag) grumpy.volume = GRUMPY_VOLUME;
      if (effect === effects.break) {
        const tail = pendingLossTail;pendingLossTail = null;
        if (wasActive && tail && tail.round === roundEpoch && tail.crash === effect.epoch && enabled && !document.hidden) {
          grumpyWanted = true;startGrumpy();
        }
      }
    });
    effect.audio.addEventListener('error',() => {
      effect.active = false;if (effect === effects.break) pendingLossTail = null;
      if (effect === effects.loseTag) grumpy.volume = GRUMPY_VOLUME;
    });
  });
  function setEnabled(value) {
    enabled = Boolean(value);
    try { localStorage.setItem(PREF_KEY,String(enabled)); } catch {}
    if (!enabled) {
      pauseTheme();pauseResultMusic();stopEffects();
      // Once a loss is interrupted, only its quiet background can resume.
      if (outcome === 'loss') grumpyWanted = true;
    } else resumeMusic();
    return enabled;
  }
  function setPace(value) {
    pace = Math.max(1,Math.min(2.34,Number(value) || 1));return pace;
  }
  function setLossDuration(milliseconds,steps=18) {
    const count=Math.max(1,Math.min(18,Math.round(Number(steps)||18)));
    if(count!==crashSteps){crashSteps=count;crash.src=file(`fast-stair-fall-${count}.m4a`);}
    lossLandingMilliseconds = Math.max(3000,Math.min(12000,Number(milliseconds)||4250));
    crash.playbackRate = fallPiano.playbackRate = 4.45 / ((lossLandingMilliseconds+200)/1000);
    return lossLandingMilliseconds;
  }
  function trigger(type) {
    if (type !== 'release' && type !== 'break' && type !== 'catch') return;
    roundEpoch++;stopEffects();pauseTheme();resetResultMusic();
    try { theme.currentTime = 0; } catch {}
    if (type === 'release') {
      setPace(WALK_BASE_PACE);
      clockAnchor = 0;clockAt = nowMilliseconds();clockUsesMedia = false;wanted = true;
      startTheme();return;
    }
    wanted = false;
    if (type === 'catch') {
      outcome = 'win';victoryAnchor = 0;victoryAt = nowMilliseconds();
      if (enabled && !document.hidden) pendingWinRain = { round: roundEpoch,at: nowMilliseconds(),scheduled: false,timer: null };
      startDisco();playEffect(effects.catch);
    } else {
      outcome = 'loss';grumpyWanted = !enabled || document.hidden;
      // Chosen audition 07: solo wobbling whistle. The final slap remains a separate exact-contact cue.
      playEffect(effects.fallPiano);
      if(enabled&&!document.hidden){
        const epoch=roundEpoch;
        pendingLanding=setTimeout(()=>{
          pendingLanding=null;
          if(epoch===roundEpoch&&outcome==='loss'&&enabled&&!document.hidden){
            playEffect(effects.landing);effects.fallPiano.audio.pause();effects.fallPiano.active=false;effects.loseTag.audio.pause();effects.loseTag.active=false;pendingLossTail=null;grumpyWanted=true;startGrumpy();
          }
        },lossLandingMilliseconds);
      }

    }
  }
  // Revival immediately returns to the quiet lobby track, without restarting the sad music.
  function resurrect(){wait();}
  const unlockWaiting=()=>{if(outcome==='waiting')startWaiting();};
  document.addEventListener('pointerdown',unlockWaiting,{passive:true});
  document.addEventListener('keydown',unlockWaiting);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {
      pauseTheme();pauseResultMusic();stopEffects();
      if (outcome === 'loss') grumpyWanted = true;
    } else resumeMusic();
  });
  wait();
  window.WaiterAudio = Object.freeze({
    get enabled() { return enabled; },
    get pace() { return pace; },
    get voicePose() { return voicePose(); },
    get victoryBpm() { return DISCO_BPM; },
    roundTime,victoryTime,setWinImpactTime,setEnabled,setPace,setLossDuration,trigger,resurrect,wait,
  });
})();
