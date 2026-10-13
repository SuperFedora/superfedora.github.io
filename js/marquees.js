/* js/marquees.js — Zero-Cycles Marquee Controller via IntersectionObserver */
(function() {
  'use strict';

  var SELECTORS = ['.stream-left', '.stream-right', '.marquee-track'];
  var observedElements = new Set();
  var visibilityMap = new Map();

  function isPausedGlobally() {
    return Boolean(document.hidden);
  }

  function updateElementState(el) {
    if (!el || !el.style) return;
    var isVisible = visibilityMap.get(el);
    if (isPausedGlobally() || !isVisible) {
      el.style.animationPlayState = 'paused';
    } else {
      el.style.animationPlayState = '';
    }
  }

  function syncAll() {
    observedElements.forEach(function(el) {
      updateElementState(el);
    });
  }

  window.idleSyncMarqueeState = syncAll;

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        visibilityMap.set(entry.target, entry.isIntersecting);
        updateElementState(entry.target);
      });
    }, { root: null, rootMargin: '80px 0px', threshold: 0 });

    function scanAndObserve() {
      observedElements.forEach(function(el) {
        if (!el.isConnected) {
          observer.unobserve(el);
          observedElements.delete(el);
          visibilityMap.delete(el);
        }
      });

      SELECTORS.forEach(function(sel) {
        var els = document.querySelectorAll(sel);
        els.forEach(function(el) {
          if (!observedElements.has(el)) {
            observedElements.add(el);
            visibilityMap.set(el, false);
            observer.observe(el);
          }
        });
      });
      syncAll();
    }

    function init() {
      scanAndObserve();
      document.addEventListener('visibilitychange', syncAll, { passive: true });
      window.addEventListener('blur', syncAll, { passive: true });
      window.addEventListener('focus', syncAll, { passive: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }
})();
