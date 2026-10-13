/* js/crt.js — Toggleable CRT Scanlines Shader */
(function() {
  var crtActive = localStorage.getItem("superfedora_crt") === "true";

  function updateCrt(playSound) {
    if (crtActive) {
      document.body.classList.add("crt-active");
    } else {
      document.body.classList.remove("crt-active");
    }

    var btn = document.getElementById("toggle-crt");
    if (btn) {
      btn.textContent = crtActive ? "CRT: ON" : "CRT: OFF";
      btn.classList.toggle("active", crtActive);
    }

    localStorage.setItem("superfedora_crt", crtActive ? "true" : "false");

    if (playSound && window.SFX) {
      window.SFX.playCrt(crtActive);
    }
  }

  window.CRT = {
    toggle: function() {
      crtActive = !crtActive;
      updateCrt(true);
    },
    init: function() {
      updateCrt(false);
      var btn = document.getElementById("toggle-crt");
      if (btn) {
        btn.addEventListener("click", function() {
          window.CRT.toggle();
        });
      }
    }
  };

  document.addEventListener("DOMContentLoaded", function() {
    window.CRT.init();
  });
})();
