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
    stopLandingBuffer();
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

  // Prepare the short landing cue from a real interaction. WebKit grants media
  // element playback individually; the final impact happens well after a click.
  // An unlocked AudioContext keeps this timed effect independent of that grant.
  const LANDING_CLIP = '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';
  let landingContext = null, landingBuffer = null, landingDecode = null;
  let landingSource = null, landingGain = null;
  function unlockLanding() {
    if (!enabled || document.hidden) return;
    try {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return;
      if (!landingContext) landingContext = new Context();
      if (landingContext.state !== 'running') Promise.resolve(landingContext.resume()).catch(() => {});
      if (!landingBuffer && !landingDecode) {
        const bytes = Uint8Array.from(atob(LANDING_CLIP), value => value.charCodeAt(0));
        landingDecode = Promise.resolve(landingContext.decodeAudioData(bytes.buffer)).then(buffer => {
          landingBuffer = buffer;
        }).catch(() => {}).finally(() => { landingDecode = null; });
      }
    } catch {}
  }
  function stopLandingBuffer() {
    const source = landingSource, gain = landingGain;
    landingSource = landingGain = null;
    if (source) { source.onended = null;try { source.stop(); } catch {}try { source.disconnect(); } catch {} }
    if (gain) try { gain.disconnect(); } catch {}
  }
  function playLandingBuffer(epoch) {
    if (!landingBuffer || landingContext?.state !== 'running') return false;
    stopLandingBuffer();
    let source, gain;
    try {
      source = landingContext.createBufferSource();gain = landingContext.createGain();
      source.buffer = landingBuffer;gain.gain.value = effects.landing.volume;
      source.connect(gain);gain.connect(landingContext.destination);
      landingSource = source;landingGain = gain;
      source.onended = () => {
        if (landingSource === source) {
          landingSource = landingGain = null;source.disconnect();gain.disconnect();
          if (epoch === effects.landing.epoch) effects.landing.active = false;
        }
      };
      source.start();return true;
    } catch {
      if (landingSource === source) stopLandingBuffer();
      else { try { source?.disconnect(); } catch {}try { gain?.disconnect(); } catch {} }
      return false;
    }
  }

  function playEffect(effect) {
    if (!enabled || document.hidden) return;
    const epoch = ++effect.epoch;
    effect.audio.pause();try { effect.audio.currentTime = 0; } catch {}
    effect.audio.volume = effect.volume;effect.active = true;
    if (effect === effects.landing && playLandingBuffer(epoch)) return;
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
    } else { unlockLanding();resumeMusic(); }
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
  const unlockWaiting=()=>{unlockLanding();if(outcome==='waiting')startWaiting();};
  document.addEventListener('pointerdown',unlockWaiting,{passive:true});
  document.addEventListener('click',unlockWaiting,{passive:true});
  document.addEventListener('keydown',unlockWaiting);
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {
      pauseTheme();pauseResultMusic();stopEffects();
      if (outcome === 'loss') grumpyWanted = true;
    } else { unlockLanding();resumeMusic(); }
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
