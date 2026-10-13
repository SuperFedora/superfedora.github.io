/* js/theme.js — 16-Bit SNES Jewel Rainbow Palette Switcher & Random Rotator */
(function() {
  'use strict';

  var palettes = {
    blue: {
      name: "Super Blue",
      primary: "#7aa2f7",
      border: "#3c6eb4",
      hot: "#89b4fa",
      rgb: "122, 162, 247",
      glow: "rgba(122, 162, 247, 0.45)",
      dim: "rgba(122, 162, 247, 0.12)"
    },
    purple: {
      name: "Metroid Violet",
      primary: "#bb9af7",
      border: "#7c3aed",
      hot: "#d946ef",
      rgb: "187, 154, 247",
      glow: "rgba(187, 154, 247, 0.45)",
      dim: "rgba(187, 154, 247, 0.12)"
    },
    red: {
      name: "Super Ruby",
      primary: "#f7768e",
      border: "#e11d48",
      hot: "#ff5555",
      rgb: "247, 118, 142",
      glow: "rgba(247, 118, 142, 0.45)",
      dim: "rgba(247, 118, 142, 0.12)"
    },
    green: {
      name: "Emerald Green",
      primary: "#9ece6a",
      border: "#16a34a",
      hot: "#50fa7b",
      rgb: "158, 206, 106",
      glow: "rgba(158, 206, 106, 0.45)",
      dim: "rgba(158, 206, 106, 0.12)"
    },
    gold: {
      name: "Star Gold",
      primary: "#e0af68",
      border: "#ca8a04",
      hot: "#ffd447",
      rgb: "224, 175, 104",
      glow: "rgba(224, 175, 104, 0.45)",
      dim: "rgba(224, 175, 104, 0.12)"
    },
    cyan: {
      name: "Electric Cyan",
      primary: "#7dcfff",
      border: "#0284c7",
      hot: "#00e5ff",
      rgb: "125, 207, 255",
      glow: "rgba(125, 207, 255, 0.45)",
      dim: "rgba(125, 207, 255, 0.12)"
    },
    orange: {
      name: "Flame Orange",
      primary: "#ff9e64",
      border: "#ea580c",
      hot: "#ff7700",
      rgb: "255, 158, 100",
      glow: "rgba(255, 158, 100, 0.45)",
      dim: "rgba(255, 158, 100, 0.12)"
    },
    coral: {
      name: "Neon Coral",
      primary: "#f43f5e",
      border: "#be123c",
      hot: "#ff4365",
      rgb: "244, 63, 94",
      glow: "rgba(244, 63, 94, 0.45)",
      dim: "rgba(244, 63, 94, 0.12)"
    }
  };

  var paletteKeys = ["blue", "purple", "red", "green", "gold", "cyan", "orange", "coral"];
  var currentThemeKey = "blue";

  function applyTheme(key, playSound) {
    if (!palettes[key]) key = "blue";
    currentThemeKey = key;
    var p = palettes[key];
    var root = document.documentElement;

    root.style.setProperty("--jewel-name", p.name);
    root.style.setProperty("--jewel-primary", p.primary);
    root.style.setProperty("--jewel-border", p.border);
    root.style.setProperty("--jewel-hot", p.hot);
    root.style.setProperty("--jewel-rgb", p.rgb);
    root.style.setProperty("--jewel-glow", p.glow);
    root.style.setProperty("--jewel-dim", p.dim);

    // Sync all swatch buttons across footer dock and legacy controls
    document.querySelectorAll(".dock-jewel-dot, .jewel-btn").forEach(function(btn) {
      var matches = btn.getAttribute("data-palette") === key;
      btn.classList.toggle("active", matches);
      if (btn.hasAttribute("role") && btn.getAttribute("role") === "radio") {
        btn.setAttribute("aria-checked", matches ? "true" : "false");
        btn.setAttribute("tabindex", matches ? "0" : "-1");
      }
    });

    try {
      localStorage.setItem("superfedora_theme", key);
    } catch (e) {}

    if (window.updateStarfieldTheme) window.updateStarfieldTheme();
    if (window.updateMainscreenSun) window.updateMainscreenSun();

    if (playSound && window.SFX && window.SFX.playBlip) {
      window.SFX.playBlip(720);
    }
    return key;
  }

  function cycleRandom(playSound) {
    var pool = paletteKeys.filter(function(k) { return k !== currentThemeKey; });
    var nextKey = pool[Math.floor(Math.random() * pool.length)];
    applyTheme(nextKey, playSound !== false);
    return nextKey;
  }

  window.SuperTheme = {
    set: applyTheme,
    cycleRandom: cycleRandom,
    getCurrent: function() { return currentThemeKey; },
    palettes: palettes,
    keys: paletteKeys,
    init: function() {
      var saved = "blue";
      try {
        saved = localStorage.getItem("superfedora_theme") || "blue";
      } catch (e) {}
      applyTheme(saved, false);

      document.addEventListener("click", function(e) {
        var btn = e.target.closest(".dock-jewel-dot, .jewel-btn");
        if (btn) {
          var pal = btn.getAttribute("data-palette");
          if (pal) applyTheme(pal, true);
        }
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    window.SuperTheme.init();
  });
})();
