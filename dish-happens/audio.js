/* Gesture-started gameplay music, original result effects, and result music. */
(() => {
  'use strict';

  const PREF_KEY = 'waiter-stairs-sound-enabled';
  const THEME_VOLUME = .8, CRASH_VOLUME = .8, WIN_VOLUME = .8, LOSE_TAG_VOLUME = .8;
  const DISCO_VOLUME = .42, SAD_VOLUME = .21, SAD_DUCKED_VOLUME = .11;
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
  const theme = new Audio(file('builder-session-v4.wav?v=1'));
  const crash = new Audio(file('crash-plates-only-v1.wav?v=1'));
  const win = new Audio(file('cash-register-v8.wav?v=1'));
  const loseTag = new Audio(file('lose-tag-tight-v1.wav?v=1'));
  const disco = new Audio(file('disco-win-loop-v1.wav?v=1'));
  const sad = new Audio(file('sad-result-v1.wav?v=1'));
  const tracks = [theme, crash, win, loseTag, disco, sad];
  const ids = ['game-theme','game-crash','game-win','game-lose-tag','game-disco','game-sad'];
  const volumes = [THEME_VOLUME,CRASH_VOLUME,WIN_VOLUME,LOSE_TAG_VOLUME,DISCO_VOLUME,SAD_VOLUME];
  tracks.forEach((track,index) => {
    const rate = track === crash || track === loseTag ? BASE_RATE : 1;
    track.playbackRate = track.defaultPlaybackRate = rate;
    track.preservesPitch = true;
    track.preload = 'auto';track.volume = volumes[index];
    track.loop = track === disco || track === sad;
    track.id = ids[index];track.hidden = true;track.setAttribute('aria-hidden','true');
  });
  document.body.append(...tracks);

  const nowMilliseconds = () => performance.now();
  let wanted = false, clockAnchor = 0, clockAt = 0, clockUsesMedia = false;
  let themeStarting = false, themeEpoch = 0, roundEpoch = 0;
  let outcome = null, sadWanted = false;
  let discoStarting = false, discoEpoch = 0, sadStarting = false, sadEpoch = 0;
  let victoryAnchor = 0, victoryAt = 0, victoryUsesMedia = false;
  let victoryOffset = 0, victoryLastNative = 0;
  let pendingLossTail = null, pendingWinRain = null;
  const effects = {
    break: { audio: crash, volume: CRASH_VOLUME, epoch: 0, active: false },
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
  function pauseResultMusic() {
    useVictoryFallbackClock();discoEpoch++;discoStarting = false;disco.pause();
    sadEpoch++;sadStarting = false;sad.pause();
  }
  function resetResultMusic() {
    pauseResultMusic();
    try { disco.currentTime = 0;sad.currentTime = 0; } catch {}
    outcome = null;sadWanted = false;
    victoryAnchor = 0;victoryAt = nowMilliseconds();victoryUsesMedia = false;victoryOffset = 0;victoryLastNative = 0;
  }
  function clearWinImpact() {
    if (pendingWinRain?.timer != null) clearTimeout(pendingWinRain.timer);
    pendingWinRain = null;
  }
  function stopEffects() {
    pendingLossTail = null;clearWinImpact();
    Object.values(effects).forEach(effect => {
      effect.epoch++;effect.active = false;effect.audio.pause();
      try { effect.audio.currentTime = 0; } catch {}
    });
    sad.volume = SAD_VOLUME;
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
  function startSad() {
    if (!enabled || document.hidden || outcome !== 'loss' || !sadWanted || !sad.paused || sadStarting) return;
    const epoch = ++sadEpoch;sadStarting = true;
    sad.volume = effects.loseTag.active && !loseTag.paused && !loseTag.ended && !loseTag.error ? SAD_DUCKED_VOLUME : SAD_VOLUME;
    try {
      Promise.resolve(sad.play()).then(() => {
        if (epoch === sadEpoch && (!enabled || document.hidden || outcome !== 'loss' || !sadWanted)) sad.pause();
      }).catch(() => {}).finally(() => { if (epoch === sadEpoch) sadStarting = false; });
    } catch { if (epoch === sadEpoch) sadStarting = false; }
  }
  function resumeMusic() {
    if (wanted) startTheme();
    else if (outcome === 'win') startDisco();
    else if (outcome === 'loss') startSad();
  }
  function playEffect(effect) {
    if (!enabled || document.hidden) return;
    const epoch = ++effect.epoch;
    effect.audio.pause();try { effect.audio.currentTime = 0; } catch {}
    effect.audio.volume = effect.volume;effect.active = true;
    const failed = () => {
      if (epoch === effect.epoch) { effect.active = false;if (effect === effects.break) pendingLossTail = null;if (effect === effects.loseTag) sad.volume = SAD_VOLUME; }
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
      if (effect === effects.loseTag) sad.volume = SAD_VOLUME;
      if (effect === effects.break) {
        const tail = pendingLossTail;pendingLossTail = null;
        if (wasActive && tail && tail.round === roundEpoch && tail.crash === effect.epoch && enabled && !document.hidden) {
          playEffect(effects.loseTag);
          sadWanted = true;startSad();
        }
      }
    });
    effect.audio.addEventListener('error',() => {
      effect.active = false;if (effect === effects.break) pendingLossTail = null;
      if (effect === effects.loseTag) sad.volume = SAD_VOLUME;
    });
  });
  function setEnabled(value) {
    enabled = Boolean(value);
    try { localStorage.setItem(PREF_KEY,String(enabled)); } catch {}
    if (!enabled) {
      pauseTheme();pauseResultMusic();stopEffects();
      // Once a loss is interrupted, only its quiet background can resume.
      if (outcome === 'loss') sadWanted = true;
    } else resumeMusic();
    return enabled;
  }
  function setPace(value) {
    pace = Math.max(1,Math.min(2.34,Number(value) || 1));return pace;
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
      outcome = 'loss';sadWanted = !enabled || document.hidden;
      if (enabled && !document.hidden) pendingLossTail = { round: roundEpoch,crash: effects.break.epoch+1 };
      playEffect(effects.break);
    }
  }
  document.addEventListener('visibilitychange',() => {
    if (document.hidden) {
      pauseTheme();pauseResultMusic();stopEffects();
      if (outcome === 'loss') sadWanted = true;
    } else resumeMusic();
  });
  window.WaiterAudio = Object.freeze({
    get enabled() { return enabled; },
    get pace() { return pace; },
    get voicePose() { return voicePose(); },
    get victoryBpm() { return DISCO_BPM; },
    roundTime,victoryTime,setWinImpactTime,setEnabled,setPace,trigger,
  });
})();
