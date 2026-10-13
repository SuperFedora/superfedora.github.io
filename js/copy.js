/* js/copy.js — Interactive 16-Bit Copy Feedback & Install Mode Switcher */
function copySnippet(elementId, btnElement) {
  var el = document.getElementById(elementId);
  if (!el) return;

  var text = el.innerText || el.textContent;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text.trim()).then(onSuccess).catch(fallback);
  } else {
    fallback();
  }

  function fallback() {
    var ta = document.createElement("textarea");
    ta.value = text.trim();
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
      onSuccess();
    } catch (e) {}
    document.body.removeChild(ta);
  }

  function onSuccess() {
    if (window.SFX) {
      window.SFX.playSuccess();
    }
    if (btnElement) {
      var orig = btnElement.getAttribute("data-orig") || btnElement.innerHTML;
      btnElement.setAttribute("data-orig", orig);
      btnElement.innerHTML = "[ OK: COPIED ]";
      btnElement.classList.add("copied");

      setTimeout(function() {
        btnElement.innerHTML = orig;
        btnElement.classList.remove("copied");
      }, 2000);
    }
  }
}

function setInstallMode(mode, btnElement) {
  var cmdEl = document.getElementById("install-cmd");
  if (!cmdEl) return;
  if (mode === "source") {
    cmdEl.textContent = "curl -fsSL https://superfedora.github.io/install.sh | bash -s -- --build-from-source";
  } else {
    cmdEl.textContent = "curl -fsSL https://superfedora.github.io/install.sh | bash";
  }
  document.querySelectorAll(".install-mode-btn").forEach(function(b) {
    var isTarget = (b === btnElement) || (b.getAttribute("data-install-mode") === mode);
    b.classList.toggle("active", isTarget);
    b.setAttribute("aria-pressed", isTarget ? "true" : "false");
  });
  if (window.SFX && window.SFX.playBlip) {
    window.SFX.playBlip(mode === "source" ? 680 : 560);
  }
}

window.copySnippet = copySnippet;
window.setInstallMode = setInstallMode;
