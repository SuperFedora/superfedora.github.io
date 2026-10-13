/* js/sun.js — 16-Bit Rotating Pixel Sun & Solar Corona Engine */
(function() {
  'use strict';

  var canvas = document.getElementById('mainscreen-canvas');
  if (!canvas) return;
  var stage = document.getElementById('mainscreen');
  if (!stage) return;
  var ctx = canvas.getContext('2d');
  if (!ctx) return;

  var BAYER = [
     0, 32,  8, 40,  2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26,
    12, 44,  4, 36, 14, 46,  6, 38, 60, 28, 52, 20, 62, 30, 54, 22,
     3, 35, 11, 43,  1, 33,  9, 41, 51, 19, 59, 27, 49, 17, 57, 25,
    15, 47,  7, 39, 13, 45,  5, 37, 63, 31, 55, 23, 61, 29, 53, 21
  ];

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = 1, width = 0, height = 0, cellPx = 6, cols = 0, rows = 0;
  var centerX = 0, centerY = 0;
  var mouseX = -9999, mouseY = -9999, smoothMouseX = -9999, smoothMouseY = -9999;
  var mouseActive = false, mouseStrength = 0;
  var isVisible = true, isIntersecting = true, rafId = null;
  var shockwaves = [];

  // 16-Bit Palette State
  var colCore = '#ffffff', colHot = '#ff9e64', colMid = '#7aa2f7', colDim = 'rgba(41, 65, 114, 0.45)';

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var num = parseInt(hex, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
  }

  function updatePalette() {
    try {
      var cs = getComputedStyle(document.documentElement);
      var hot = cs.getPropertyValue('--jewel-hot').trim() || '#ff9e64';
      var prim = cs.getPropertyValue('--jewel-primary').trim() || '#7aa2f7';
      colHot = hot;
      colMid = prim;
      var rgb = hexToRgb(prim.charAt(0) === '#' ? prim : '#7aa2f7');
      colDim = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ', 0.35)';
    } catch (e) {}
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = stage.getBoundingClientRect();
    width = Math.round(rect.width * dpr);
    height = Math.round(rect.height * dpr);

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    cellPx = Math.max(4, Math.floor(Math.min(width, height) / 130));
    cols = Math.ceil(width / cellPx) + 1;
    rows = Math.ceil(height / cellPx) + 1;

    // Center sun behind the logo/center
    centerX = width * 0.5;
    centerY = height * 0.46;

    if (prefersReduced) renderFrame(performance.now());
  }

  function triggerShockwave(x, y) {
    shockwaves.push({
      x: x,
      y: y,
      born: performance.now(),
      maxR: Math.min(width, height) * 0.7,
      dur: 900
    });
    if (shockwaves.length > 4) shockwaves.shift();
  }

  function renderFrame(now) {
    ctx.clearRect(0, 0, width, height);

    var sec = now * 0.001;
    var rotSpeed = prefersReduced ? 0 : sec * 0.16;

    // Smooth mouse interpolation
    smoothMouseX += (mouseX - smoothMouseX) * 0.15;
    smoothMouseY += (mouseY - smoothMouseY) * 0.15;
    var targetStr = mouseActive ? 1.0 : 0.0;
    mouseStrength += (targetStr - mouseStrength) * 0.12;

    var sunMaxR = Math.min(width, height) * 0.52;
    var coreR = sunMaxR * 0.22;
    var raySpokes = 18;

    // Filter active shockwaves
    shockwaves = shockwaves.filter(function(sw) {
      return (now - sw.born) < sw.dur;
    });

    for (var r = 0; r < rows; r++) {
      var py = r * cellPx;
      for (var c = 0; c < cols; c++) {
        var px = c * cellPx;
        var cx = px + cellPx * 0.5;
        var cy = py + cellPx * 0.5;

        var dx = cx - centerX;
        var dy = cy - centerY;
        var dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > sunMaxR) continue;

        var angle = Math.atan2(dy, dx);
        var rotAngle = angle + rotSpeed;

        // 16-Bit stepped rotating ray harmonics
        var rayPrimary = Math.sin(rotAngle * raySpokes);
        var raySecondary = Math.sin(rotAngle * (raySpokes * 2) - sec * 0.4) * 0.35;
        var rayPulse = Math.sin(dist * 0.035 - sec * 1.8) * 0.2;
        var rayVal = (rayPrimary + 1) * 0.5 + raySecondary + rayPulse;

        // Radial falloff
        var normDist = dist / sunMaxR;
        var falloff = Math.pow(Math.max(0, 1 - normDist), 1.6);
        var intensity = rayVal * falloff;

        // Solid solar core
        if (dist < coreR) {
          intensity = 1.3 + (1 - dist / coreR) * 0.6;
        }

        // Mouse spotlight influence
        if (mouseStrength > 0.01) {
          var mdx = cx - smoothMouseX;
          var mdy = cy - smoothMouseY;
          var mDist = Math.sqrt(mdx * mdx + mdy * mdy);
          var mReach = 280 * dpr;
          if (mDist < mReach) {
            intensity += Math.pow(1 - mDist / mReach, 2) * 0.7 * mouseStrength;
          }
        }

        // Shockwave ripples
        for (var i = 0; i < shockwaves.length; i++) {
          var sw = shockwaves[i];
          var progress = (now - sw.born) / sw.dur;
          var curR = sw.maxR * (1 - Math.pow(1 - progress, 2.5));
          var rDist = Math.abs(dist - curR);
          var ringWidth = 32 * dpr;
          if (rDist < ringWidth) {
            intensity += (1 - rDist / ringWidth) * (1 - progress) * 0.9;
          }
        }

        // Bayer 8x8 matrix dithering threshold
        var dither = BAYER[(r & 7) * 8 + (c & 7)] / 64;

        if (intensity > dither * 0.78) {
          if (intensity > 1.25) {
            ctx.fillStyle = colCore;
          } else if (intensity > 0.78) {
            ctx.fillStyle = colHot;
          } else if (intensity > 0.42) {
            ctx.fillStyle = colMid;
          } else {
            ctx.fillStyle = colDim;
          }
          ctx.fillRect(px, py, cellPx - 1, cellPx - 1);
        }
      }
    }
  }

  function loop(now) {
    if (!isVisible || !isIntersecting || prefersReduced) {
      rafId = null;
      return;
    }
    renderFrame(now);
    rafId = requestAnimationFrame(loop);
  }

  function wake() {
    if (!rafId && isVisible && isIntersecting && !prefersReduced) {
      rafId = requestAnimationFrame(loop);
    }
  }

  // Event Listeners
  window.addEventListener('resize', function() {
    resize();
    wake();
  }, { passive: true });

  stage.addEventListener('mousemove', function(e) {
    var rect = stage.getBoundingClientRect();
    mouseX = (e.clientX - rect.left) * dpr;
    mouseY = (e.clientY - rect.top) * dpr;
    mouseActive = true;
    wake();
  }, { passive: true });

  stage.addEventListener('mouseleave', function() {
    mouseActive = false;
  }, { passive: true });

  stage.addEventListener('click', function(e) {
    var rect = stage.getBoundingClientRect();
    var px = (e.clientX - rect.left) * dpr;
    var py = (e.clientY - rect.top) * dpr;
    triggerShockwave(px, py);
    if (window.SFX && window.SFX.playBlip) {
      window.SFX.playBlip(540);
    }
    wake();
  });

  // Zero-Cycles Idle Invariant via IntersectionObserver
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          wake();
        } else if (rafId) {
          cancelAnimationFrame(rafId);
          rafId = null;
        }
      });
    }, { threshold: 0.05 });
    observer.observe(stage);
  }

  document.addEventListener('visibilitychange', function() {
    isVisible = !document.hidden;
    if (isVisible) wake();
    else if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  });

  // Export theme hook to window so theme.js can update sun colors
  window.updateMainscreenSun = function() {
    updatePalette();
    wake();
  };

  // Init
  updatePalette();
  resize();
  wake();
})();
