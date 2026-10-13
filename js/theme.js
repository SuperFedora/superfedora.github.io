/* js/theme.js — SNES Jewel Palette Switcher */
(function() {
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
    }
  };

  function applyTheme(key, playSound) {
    var p = palettes[key] || palettes.blue;
    var root = document.documentElement;

    root.style.setProperty("--jewel-primary", p.primary);
    root.style.setProperty("--jewel-border", p.border);
    root.style.setProperty("--jewel-hot", p.hot);
    root.style.setProperty("--jewel-rgb", p.rgb);
    root.style.setProperty("--jewel-glow", p.glow);
    root.style.setProperty("--jewel-dim", p.dim);

    document.querySelectorAll(".jewel-btn").forEach(function(btn) {
      btn.classList.toggle("active", btn.getAttribute("data-palette") === key);
    });

    localStorage.setItem("superfedora_theme", key);

    if (window.updateStarfieldTheme) {
      window.updateStarfieldTheme();
    }
    if (window.updateMainscreenSun) {
      window.updateMainscreenSun();
    }

    if (playSound && window.SFX) {
      window.SFX.playBlip(720);
    }
  }

  window.SuperTheme = {
    set: applyTheme,
    init: function() {
      var saved = localStorage.getItem("superfedora_theme") || "blue";
      applyTheme(saved, false);

      document.querySelectorAll(".jewel-btn").forEach(function(btn) {
        btn.addEventListener("click", function() {
          var pal = btn.getAttribute("data-palette");
          applyTheme(pal, true);
        });
      });
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    window.SuperTheme.init();
  });
})();
