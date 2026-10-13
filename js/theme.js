/* js/theme.js — 16-Bit SNES Jewel Rainbow Palette & Dark/Light Mode Switcher */
(function() {
  'use strict';

  var palettes = {
    blue: {
      name: "Super Blue",
      primary: "#7aa2f7", border: "#3c6eb4", hot: "#bcd3ff", rgb: "122, 162, 247",
      lPrimary: "#2554a3", lBorder: "#1e4282", lHot: "#3c6eb4", lRgb: "37, 84, 163"
    },
    purple: {
      name: "Metroid Violet",
      primary: "#bb9af7", border: "#7c3aed", hot: "#decbff", rgb: "187, 154, 247",
      lPrimary: "#6b38b8", lBorder: "#532894", lHot: "#8b5cf6", lRgb: "107, 56, 184"
    },
    red: {
      name: "Super Ruby",
      primary: "#f7768e", border: "#e11d48", hot: "#ffbac7", rgb: "247, 118, 142",
      lPrimary: "#b91c3c", lBorder: "#96142e", lHot: "#e11d48", lRgb: "185, 28, 60"
    },
    green: {
      name: "Emerald Green",
      primary: "#9ece6a", border: "#16a34a", hot: "#cbf0a3", rgb: "158, 206, 106",
      lPrimary: "#2d7a31", lBorder: "#215c24", lHot: "#16a34a", lRgb: "45, 122, 49"
    },
    gold: {
      name: "Star Gold",
      primary: "#e0af68", border: "#ca8a04", hot: "#ffdf9e", rgb: "224, 175, 104",
      lPrimary: "#946210", lBorder: "#734b0b", lHot: "#ca8a04", lRgb: "148, 98, 16"
    },
    cyan: {
      name: "Electric Cyan",
      primary: "#7dcfff", border: "#0284c7", hot: "#bfeaff", rgb: "125, 207, 255",
      lPrimary: "#0369a1", lBorder: "#075985", lHot: "#0284c7", lRgb: "3, 105, 161"
    },
    orange: {
      name: "Flame Orange",
      primary: "#ff9e64", border: "#ea580c", hot: "#ffc9a6", rgb: "255, 158, 100",
      lPrimary: "#b84309", lBorder: "#943506", lHot: "#ea580c", lRgb: "184, 67, 9"
    },
    coral: {
      name: "Neon Coral",
      primary: "#f43f5e", border: "#be123c", hot: "#ff99ac", rgb: "244, 63, 94",
      lPrimary: "#9f1239", lBorder: "#881337", lHot: "#be123c", lRgb: "159, 18, 57"
    }
  };

  var paletteKeys = ["blue", "purple", "red", "green", "gold", "cyan", "orange", "coral"];
  var currentThemeKey = "blue";
  var currentMode = "dark";

  function applyTheme(key, playSound, modeOverride) {
    if (!palettes[key]) key = "blue";
    currentThemeKey = key;
    if (modeOverride === "light" || modeOverride === "dark") {
      currentMode = modeOverride;
    }
    var p = palettes[key];
    var isLight = currentMode === "light";
    var pri = isLight ? p.lPrimary : p.primary;
    var brd = isLight ? p.lBorder : p.border;
    var hot = isLight ? p.lHot : p.hot;
    var rgb = isLight ? p.lRgb : p.rgb;
    var root = document.documentElement;

    root.style.setProperty("--jewel-name", p.name);
    root.style.setProperty("--jewel-primary", pri);
    root.style.setProperty("--jewel-border", brd);
    root.style.setProperty("--jewel-hot", hot);
    root.style.setProperty("--jewel-rgb", rgb);
    root.style.setProperty("--jewel-glow", "rgba(" + rgb + ", " + (isLight ? "0.28" : "0.45") + ")");
    root.style.setProperty("--jewel-dim", "rgba(" + rgb + ", 0.12)");
    root.dataset.theme = key;
    root.dataset.mode = currentMode;

    var navNameEl = document.getElementById("nav-theme-name");
    if (navNameEl) navNameEl.textContent = "[THEME: " + p.name.toUpperCase() + " // " + currentMode.toUpperCase() + "]";
    var navPipEl = document.getElementById("nav-theme-pip");
    if (navPipEl) navPipEl.style.background = p.primary;

    var tickerThemeEl = document.getElementById("ticker-theme-item");
    if (tickerThemeEl) tickerThemeEl.textContent = "[PALETTE: " + p.name.toUpperCase() + " (" + currentMode.toUpperCase() + ")]";

    var modeBtn = document.getElementById("toggle-mode");
    if (modeBtn) {
      modeBtn.textContent = "MODE: " + currentMode.toUpperCase();
      modeBtn.classList.toggle("active", isLight);
    }

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
      localStorage.setItem("superfedora_mode", currentMode);
    } catch (e) {}

    if (window.updateStarfieldTheme) window.updateStarfieldTheme();
    if (window.updateMainscreenSun) window.updateMainscreenSun();

    if (playSound && window.SFX && window.SFX.playBlip) {
      window.SFX.playBlip(720);
    }
    return key;
  }

  function setMode(mode, playSound) {
    var nextMode = mode === "light" ? "light" : "dark";
    applyTheme(currentThemeKey, playSound !== false, nextMode);
    return currentMode;
  }

  function toggleMode(playSound) {
    return setMode(currentMode === "dark" ? "light" : "dark", playSound !== false);
  }

  function cycleRandom(playSound) {
    var pool = paletteKeys.filter(function(k) { return k !== currentThemeKey; });
    var nextKey = pool[Math.floor(Math.random() * pool.length)];
    applyTheme(nextKey, playSound !== false);
    return nextKey;
  }

  window.SuperTheme = {
    set: applyTheme,
    setMode: setMode,
    toggleMode: toggleMode,
    getMode: function() { return currentMode; },
    cycleRandom: cycleRandom,
    getCurrent: function() { return currentThemeKey; },
    palettes: palettes,
    keys: paletteKeys,
    init: function() {
      var saved = "blue";
      var savedMode = "dark";
      try {
        saved = localStorage.getItem("superfedora_theme") || "blue";
        savedMode = localStorage.getItem("superfedora_mode") || "dark";
      } catch (e) {}
      applyTheme(saved, false, savedMode);

      var navToggle = document.getElementById("header-theme-toggle");
      if (navToggle) {
        navToggle.addEventListener("click", function() { cycleRandom(true); });
      }
      var modeBtn = document.getElementById("toggle-mode");
      if (modeBtn) {
        modeBtn.addEventListener("click", function() { toggleMode(true); });
      }

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
