/* js/rotate.js — Hero facts headline rotation with zero-cycles offscreen sleep */
(function() {
  'use strict';

  var FACTS = [
    "Keyboard-Driven Wayland Workstation",
    "Hyprland 0.47+ Dynamic Tiling",
    "Pop!_OS COSMIC Muscle Memory",
    "Quickshell QML Status Bar",
    "IdleScreen 48 In-Tree ASCII Scenes",
    "Btrfs Snapper Snapshot Rollbacks",
    "10 Idempotent Shell Modules",
    "Tokyo Night 16-Bit Palette",
    "Zero Active CPU Cycles",
    "Dual CLI: sf & superfedora"
  ];

  var currentIdx = 0;
  var rotateTimer = null;
  var animInterval = null;
  var isSectionVisible = true;

  function clearRotation() {
    if (rotateTimer) { clearTimeout(rotateTimer); rotateTimer = null; }
    if (animInterval) { clearInterval(animInterval); animInterval = null; }
  }

  function scheduleNext(delay) {
    clearRotation();
    if (!isSectionVisible || document.hidden) return;
    rotateTimer = setTimeout(rotateFact, delay || 4500);
  }

  function rotateFact() {
    var el = document.getElementById("hero-facts");
    if (!el || !isSectionVisible || document.hidden) return;

    var nextIdx;
    do {
      nextIdx = Math.floor(Math.random() * FACTS.length);
    } while (nextIdx === currentIdx && FACTS.length > 1);
    currentIdx = nextIdx;
    var target = FACTS[nextIdx];

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.textContent = target;
      scheduleNext(4500);
      return;
    }

    var text = el.textContent || "";
    animInterval = setInterval(function() {
      if (!isSectionVisible || document.hidden) { clearRotation(); return; }
      if (text.length > 0) {
        text = text.slice(0, -1);
        el.textContent = text;
      } else {
        clearInterval(animInterval);
        animInterval = null;
        var i = 0;
        animInterval = setInterval(function() {
          if (!isSectionVisible || document.hidden) { clearRotation(); return; }
          if (i < target.length) {
            text += target[i];
            el.textContent = text;
            i++;
          } else {
            clearInterval(animInterval);
            animInterval = null;
            scheduleNext(4500);
          }
        }, 28);
      }
    }, 15);
  }

  function init() {
    var el = document.getElementById("hero-facts");
    if (!el) return;

    var section = el.closest("section") || document.getElementById("mainscreen");
    if (section && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          isSectionVisible = e.isIntersecting;
          if (isSectionVisible && !document.hidden) {
            if (!rotateTimer && !animInterval) scheduleNext(2500);
          } else {
            clearRotation();
          }
        });
      }, { threshold: 0.1 });
      io.observe(section);
    }

    document.addEventListener("visibilitychange", function() {
      if (document.hidden) clearRotation();
      else if (isSectionVisible && !rotateTimer && !animInterval) scheduleNext(1500);
    });

    scheduleNext(4500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
