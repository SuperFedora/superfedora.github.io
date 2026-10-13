/* js/audio.js — Pure 16-Bit Web Audio API Sound Synthesizer */
(function() {
  var audioCtx = null;
  var sfxEnabled = localStorage.getItem("superfedora_sfx") !== "false";

  function getAudioContext() {
    if (!audioCtx && (window.AudioContext || window.webkitAudioContext)) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.SFX = {
    isEnabled: function() {
      return sfxEnabled;
    },
    toggle: function() {
      sfxEnabled = !sfxEnabled;
      localStorage.setItem("superfedora_sfx", sfxEnabled ? "true" : "false");
      this.updateBtn();
      if (sfxEnabled) {
        this.playBlip(660);
      }
      return sfxEnabled;
    },
    updateBtn: function() {
      var btn = document.getElementById("toggle-sfx");
      if (btn) {
        btn.textContent = sfxEnabled ? "SFX: ON" : "SFX: OFF";
        btn.classList.toggle("active", sfxEnabled);
      }
    },
    playBlip: function(freq) {
      if (!sfxEnabled) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(freq || 540, now);
        osc.frequency.exponentialRampToValueAtTime((freq || 540) * 1.5, now + 0.06);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.08);
      } catch (e) {}
    },
    playSuccess: function() {
      if (!sfxEnabled) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach(function(freq, index) {
          var now = ctx.currentTime + (index * 0.065);
          var osc = ctx.createOscillator();
          var gain = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.06, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now);
          osc.stop(now + 0.12);
        });
      } catch (e) {}
    },
    playCrt: function(active) {
      if (!sfxEnabled) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(active ? 120 : 360, now);
        osc.frequency.exponentialRampToValueAtTime(active ? 360 : 60, now + 0.15);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      } catch (e) {}
    },
    playTick: function() {
      if (!sfxEnabled) return;
      try {
        var ctx = getAudioContext();
        if (!ctx) return;
        var now = ctx.currentTime;
        var osc = ctx.createOscillator();
        var gain = ctx.createGain();

        osc.type = "square";
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(1180, now + 0.02);

        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.025);
      } catch (e) {}
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    window.SFX.updateBtn();
    var btn = document.getElementById("toggle-sfx");
    if (btn) {
      btn.addEventListener("click", function() {
        window.SFX.toggle();
      });
    }

    // Unlock Web Audio on first user interaction
    function unlockAudio() {
      getAudioContext();
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    }
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });

    // Subtle 16-bit hover ticks on interactive controls
    var lastTick = 0;
    document.addEventListener("mouseover", function(e) {
      var target = e.target.closest("button, a, .jewel-btn, .cli-tab-btn, .module-btn, .key-filter-btn, .wallpaper-card");
      if (target) {
        var now = Date.now();
        if (now - lastTick > 60) {
          lastTick = now;
          window.SFX.playTick();
        }
      }
    }, { passive: true });
  });
})();
