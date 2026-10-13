/* js/dock.js — Persistent 16-Bit Bottom Dock, Arrow Key Navigation & Modal Controller */
(function() {
  'use strict';

  var sectionIds = [
    "mainscreen",
    "hero",
    "install",
    "pre-installed",
    "philosophy",
    "modules",
    "keybindings",
    "cli",
    "wallpapers",
    "repos"
  ];

  var activeSectionIndex = 0;
  var isProgrammaticScroll = false;
  var scrollEndTimer = null;

  function getSections() {
    return sectionIds.map(function(id) {
      return { id: id, el: document.getElementById(id) };
    }).filter(function(s) { return s.el !== null; });
  }

  function updateArrowButtons(idx, total) {
    var upBtn = document.getElementById("nav-arrow-up");
    var downBtn = document.getElementById("nav-arrow-down");
    var scrollY = window.scrollY || window.pageYOffset;

    if (upBtn) {
      var isTop = idx <= 0 && scrollY <= 20;
      upBtn.classList.toggle("disabled", isTop);
      upBtn.disabled = isTop;
      upBtn.setAttribute("aria-disabled", isTop ? "true" : "false");
    }
    if (downBtn) {
      var isBottom = idx >= total - 1;
      downBtn.classList.toggle("disabled", isBottom);
      downBtn.disabled = isBottom;
      downBtn.setAttribute("aria-disabled", isBottom ? "true" : "false");
    }
  }

  function navigateTo(index) {
    var sections = getSections();
    if (!sections.length) return;
    if (index < 0) index = 0;
    if (index >= sections.length) index = sections.length - 1;

    activeSectionIndex = index;
    isProgrammaticScroll = true;
    if (scrollEndTimer) clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(function() { isProgrammaticScroll = false; }, 800);

    var target = sections[index];
    if (window.SuperTheme && window.SuperTheme.cycleRandom) {
      window.SuperTheme.cycleRandom(true);
    }

    if (index === 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      var headerH = 60;
      var y = target.el.getBoundingClientRect().top + (window.pageYOffset || window.scrollY) - headerH;
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" });
    }
    updateArrowButtons(index, sections.length);
  }

  function moveNext() {
    var sections = getSections();
    if (activeSectionIndex < sections.length - 1) {
      navigateTo(activeSectionIndex + 1);
    } else if (window.SuperTheme && window.SuperTheme.cycleRandom) {
      window.SuperTheme.cycleRandom(true);
    }
  }

  function movePrev() {
    if (activeSectionIndex > 0) {
      navigateTo(activeSectionIndex - 1);
    } else if (window.SuperTheme && window.SuperTheme.cycleRandom) {
      window.SuperTheme.cycleRandom(true);
    }
  }

  function toggleHelpModal(open) {
    var modal = document.getElementById("shortcuts-modal");
    if (!modal) return;
    var isOpen = modal.classList.contains("open");
    var nextState = (typeof open === "boolean") ? open : !isOpen;
    modal.classList.toggle("open", nextState);
    modal.setAttribute("aria-hidden", nextState ? "false" : "true");
    if (nextState && window.SFX && window.SFX.playBlip) {
      window.SFX.playBlip(740);
    }
  }

  function updateActiveNavOnScroll() {
    if (isProgrammaticScroll) return;
    var sections = getSections();
    if (!sections.length) return;

    var scrollY = window.scrollY || window.pageYOffset;
    var winH = window.innerHeight;
    var docH = document.documentElement.scrollHeight;
    var readingLine = 200;
    var currentIdx = 0;

    if (scrollY + winH >= docH - 60) {
      currentIdx = sections.length - 1;
    } else if (scrollY <= 60) {
      currentIdx = 0;
    } else {
      for (var i = 0; i < sections.length; i++) {
        var rect = sections[i].el.getBoundingClientRect();
        if (rect.top <= readingLine) currentIdx = i;
      }
    }

    if (currentIdx !== activeSectionIndex) {
      activeSectionIndex = currentIdx;
    }
    updateArrowButtons(activeSectionIndex, sections.length);
  }

  function init() {
    var upBtn = document.getElementById("nav-arrow-up");
    var downBtn = document.getElementById("nav-arrow-down");
    var helpBtn = document.getElementById("toggle-help");
    var modalClose = document.getElementById("modal-close-btn");
    var modal = document.getElementById("shortcuts-modal");

    if (upBtn) upBtn.addEventListener("click", function(e) { e.preventDefault(); movePrev(); });
    if (downBtn) downBtn.addEventListener("click", function(e) { e.preventDefault(); moveNext(); });
    if (helpBtn) helpBtn.addEventListener("click", function(e) { e.preventDefault(); toggleHelpModal(); });
    if (modalClose) modalClose.addEventListener("click", function() { toggleHelpModal(false); });

    if (modal) {
      modal.addEventListener("click", function(e) {
        if (e.target === modal) toggleHelpModal(false);
      });
    }

    var ticking = false;
    window.addEventListener("scroll", function() {
      if (!ticking) {
        window.requestAnimationFrame(function() {
          updateActiveNavOnScroll();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    document.addEventListener("keydown", function(e) {
      var tag = (document.activeElement ? document.activeElement.tagName : "").toUpperCase();
      if (["INPUT", "TEXTAREA", "SELECT"].indexOf(tag) !== -1 || (document.activeElement && document.activeElement.isContentEditable)) {
        return;
      }

      if (e.key === "Escape") {
        toggleHelpModal(false);
        var drawer = document.getElementById("mobile-drawer");
        if (drawer) drawer.classList.remove("open");
        return;
      }

      if (e.key === "?" || e.key === "h" || e.key === "H") {
        e.preventDefault();
        toggleHelpModal();
        return;
      }

      if (e.key === "c" || e.key === "C") {
        if (window.CRT && window.CRT.toggle) window.CRT.toggle();
        return;
      }

      if (e.key === "s" || e.key === "S") {
        if (window.SFX && window.SFX.toggle) window.SFX.toggle();
        return;
      }

      if (e.key === "m" || e.key === "M") {
        if (window.SuperTheme && window.SuperTheme.toggleMode) window.SuperTheme.toggleMode(true);
        return;
      }

      if (e.key >= "1" && e.key <= "8") {
        var pKeys = (window.SuperTheme && window.SuperTheme.keys) || [];
        var numIdx = parseInt(e.key, 10) - 1;
        if (pKeys[numIdx]) {
          window.SuperTheme.set(pKeys[numIdx], true);
        }
        return;
      }

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        moveNext();
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        movePrev();
      }
    });

    updateActiveNavOnScroll();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
