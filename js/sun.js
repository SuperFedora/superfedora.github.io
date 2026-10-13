/* js/sun.js — 16-Bit SuperFedora Interactive Spotlight & Pixel Wordmark Engine */
(function() {
  'use strict';

  var canvas = document.getElementById('mainscreen-canvas'), stage = document.getElementById('mainscreen');
  if (!canvas || !stage) return;
  var ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  var N = 128, WM_W = 96, WM_H = 24;
  var noiseTable = (function() {
    var seed = 10407530, buf = new Float32Array(N * N);
    for (var i = 0; i < buf.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; buf[i] = seed / 4294967296; }
    for (var p = 0; p < 2; p++) {
      var next = new Float32Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var sum = 0;
        for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) sum += buf[((y + dy + N) % N) * N + ((x + dx + N) % N)];
        next[y * N + x] = sum / 9;
      }
      buf = next;
    }
    var min = Infinity, max = -Infinity; for (var j = 0; j < buf.length; j++) { if (buf[j] < min) min = buf[j]; if (buf[j] > max) max = buf[j]; }
    var span = max - min || 1; for (var k = 0; k < buf.length; k++) buf[k] = (buf[k] - min) / span;
    return buf;
  })();

  function sampleNoise(x, y) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var x0 = (ix % N + N) % N, y0 = (iy % N + N) % N, x1 = (x0 + 1) % N, y1 = (y0 + 1) % N;
    var sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return (noiseTable[y0 * N + x0] * (1 - sx) + noiseTable[y0 * N + x1] * sx) * (1 - sy) + (noiseTable[y1 * N + x0] * (1 - sx) + noiseTable[y1 * N + x1] * sx) * sy;
  }

  // 96x24 Pixel Art Matrix: SUPER in upper-left shoulder, FEDORA spanning wide & large
  var WM_ROWS = [
    '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', '000000111110110011011111001111110111110000000000000000000000000000000000000000000000000000000000', '000001100000110011011001101100000110011000000000000000000000000000000000000000000000000000000000', '000001111100110011011111101111100111111000000000000000000000000000000000000000000000000000000000',
    '000000000110110011011000001100000110110000000000000000000000000000000000000000000000000000000000', '000000000110110011011000001100000110011000000000000000000000000000000000000000000000000000000000', '000001111100011110011000001111110110011000000000000000000000000000000000000000000000000000000000', '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
    '000111111111111000111111111111000111111111000000000111111110000001111111110000000000011110000000', '000111111111111000111111111111000111111111110000001111111111000001111111111100000001111111100000', '000111111111111000111111111111000111111111111000011111111111100001111111111100000001111111100000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111110011111000',
    '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000', '000111000000000000111000000000000111000000111000011100000011100001111111111100000111000000111000', '000111111111000000111111111000000111000000111000011100000011100001111111110000000111000000111000', '000111111111000000111111111000000111000000111000011100000011100001111111110000000111111111111000',
    '000111111111000000111111111000000111000000111000011100000011100001110001110000000111111111111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111111111111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000',
    '000111000000000000111111111111000111111111111000011111111111100001110000000111000111000000111000', '000111000000000000111111111111000111111111110000001111111111000001110000000111000111000000111000', '000111000000000000111111111111000111111111000000000111111110000001110000000111000111000000111000', '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  ];

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = 1, width = 0, height = 0, cellPx = 10, originX = 0, originY = 0, gridCols = 0, gridRows = 0;
  var mouse = { x: -2000, y: -2000, active: false }, smoothMouse = { x: -2000, y: -2000, strength: 0 };
  var ripples = [], rafId = 0, isVisible = true, isIntersecting = true;
  var currentSubdued = 0, targetSubdued = 0, lastPointerTime = 0, smoothAcc = [122, 162, 247];

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  function getAccentRgb() {
    try {
      var p = getComputedStyle(document.documentElement).getPropertyValue('--jewel-primary').trim() || '#7aa2f7';
      return hexToRgb(p.charAt(0) === '#' ? p : '#7aa2f7');
    } catch (e) { return [122, 162, 247]; }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var rect = stage.getBoundingClientRect();
    width = Math.round(rect.width * dpr); height = Math.round(rect.height * dpr);
    if (width <= 0 || height <= 0) return;
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    var maxCellW = Math.floor((width * 0.95) / WM_W), maxCellH = Math.floor((height * 0.78) / WM_H);
    cellPx = Math.max(3, Math.min(maxCellW, maxCellH));
    originX = Math.round((width - WM_W * cellPx) / 2);
    originY = Math.round((height - WM_H * cellPx) / 2);
    gridCols = Math.ceil(width / cellPx) + 1; gridRows = Math.ceil(height / cellPx) + 1;
    drawScene(performance.now());
  }

  function wakeRender() {
    if (!rafId && !reducedMotion && isVisible && isIntersecting && targetSubdued < 1.0) {
      rafId = requestAnimationFrame(render);
    }
  }

  function updateScroll() {
    var rect = stage.getBoundingClientRect(), stageH = stage.offsetHeight || window.innerHeight;
    targetSubdued = Math.min(1.0, Math.max(0, -rect.top / (stageH * 0.55)));
    if (targetSubdued >= 1.0) { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } } else { wakeRender(); }
  }

  function deactivate() {
    if (!mouse.active && smoothMouse.strength <= 0) return;
    mouse.active = false; wakeRender();
  }

  function onPointerMove(e) {
    var rect = stage.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
      deactivate(); return;
    }
    var px = (e.clientX - rect.left) * dpr, py = (e.clientY - rect.top) * dpr;
    if (!mouse.active || smoothMouse.strength < 0.01 || smoothMouse.x < -1000) {
      smoothMouse.x = px; smoothMouse.y = py; smoothMouse.strength = 0;
    }
    mouse.x = px; mouse.y = py; mouse.active = true; lastPointerTime = performance.now();
    wakeRender();
  }

  function onPointerDown(e) {
    var rect = stage.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
    var px = (e.clientX - rect.left) * dpr, py = (e.clientY - rect.top) * dpr;
    mouse.x = px; mouse.y = py; mouse.active = true; lastPointerTime = performance.now();
    ripples.push({ x: px, y: py, born: performance.now(), maxR: Math.max(380 * dpr, cellPx * 24), dur: 950 });
    if (ripples.length > 4) ripples.shift();
    if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(540);
    wakeRender();
  }

  function updateLights(t) {
    var targetStr = mouse.active ? 1.0 : 0.0;
    smoothMouse.x += (mouse.x - smoothMouse.x) * 0.22;
    smoothMouse.y += (mouse.y - smoothMouse.y) * 0.22;
    smoothMouse.strength += (targetStr - smoothMouse.strength) * 0.24;
    if (smoothMouse.strength < 0.01) smoothMouse.strength = 0;
    else if (smoothMouse.strength > 0.99 && mouse.active) smoothMouse.strength = 1.0;

    currentSubdued += (targetSubdued - currentSubdued) * 0.15;
    if (Math.abs(targetSubdued - currentSubdued) < 0.005) currentSubdued = targetSubdued;

    var acc = getAccentRgb();
    for (var i = 0; i < 3; i++) smoothAcc[i] += (acc[i] - smoothAcc[i]) * 0.12;

    ripples = ripples.filter(function(rp) { return (t - rp.born) < rp.dur; });
  }

  function isSettled(t) {
    if (ripples.length > 0 || Math.abs(targetSubdued - currentSubdued) > 0.005) return false;
    var acc = getAccentRgb();
    for (var i = 0; i < 3; i++) { if (Math.abs(smoothAcc[i] - acc[i]) > 0.5) return false; }
    if (mouse.active) {
      var timeSinceMove = t - lastPointerTime;
      var distSq = (smoothMouse.x - mouse.x) * (smoothMouse.x - mouse.x) + (smoothMouse.y - mouse.y) * (smoothMouse.y - mouse.y);
      return (timeSinceMove > 500 && distSq < 1.0 && Math.abs(1.0 - smoothMouse.strength) < 0.005);
    }
    return smoothMouse.strength <= 0;
  }

  function render(t) {
    if (!isVisible || !isIntersecting || targetSubdued >= 1.0) { rafId = 0; return; }
    updateLights(t); drawScene(t);
    if (isSettled(t)) { rafId = 0; return; }
    rafId = (!reducedMotion && isVisible && isIntersecting) ? requestAnimationFrame(render) : 0;
  }

  function drawScene(t) {
    ctx.fillStyle = '#07080b'; ctx.fillRect(0, 0, width, height);
    var sub = currentSubdued, mouseReach = Math.max(280 * dpr, cellPx * 20), mouseReachSq = mouseReach * mouseReach;
    var ringW = 28 * dpr, sec = t * 0.001;
    var activeRipples = ripples.map(function(rp) {
      var p = (t - rp.born) / rp.dur, curR = rp.maxR * (1 - Math.pow(1 - p, 3));
      var minR = Math.max(0, curR - ringW), maxR = curR + ringW;
      return { x: rp.x, y: rp.y, r: curR, minRSq: minR * minR, maxRSq: maxR * maxR, amp: Math.pow(1 - p, 1.8) };
    });

    var ar = Math.round(smoothAcc[0]), ag = Math.round(smoothAcc[1]), ab = Math.round(smoothAcc[2]);
    var hr = Math.min(255, Math.round(ar + (255 - ar) * 0.55)), hg = Math.min(255, Math.round(ag + (255 - ag) * 0.55)), hb = Math.min(255, Math.round(ab + (255 - ab) * 0.55));
    var hotRgb = hr + ',' + hg + ',' + hb, midRgb = ar + ',' + ag + ',' + ab;
    var colorSpotHigh = 'rgb(' + hotRgb + ')', colorSpotMid = 'rgba(' + midRgb + ', 0.9)';
    var colorFieldHigh = 'rgba(' + ar + ',' + ag + ',' + ab + ', 0.22)', colorFieldLow = 'rgba(' + ar + ',' + ag + ',' + ab + ', 0.06)';

    for (var r = 0; r < gridRows; r++) {
      var py = r * cellPx, wmRow = Math.floor((py - originY) / cellPx);
      var hasWordRow = (sub < 0.98) && wmRow >= 0 && wmRow < WM_H;
      for (var c = 0; c < gridCols; c++) {
        var px = c * cellPx, wmCol = Math.floor((px - originX) / cellPx);
        var inWordBox = hasWordRow && wmCol >= 0 && wmCol < WM_W;
        var isWord = inWordBox && WM_ROWS[wmRow] && WM_ROWS[wmRow][wmCol] === '1';
        var cx = px + cellPx * 0.5, cy = py + cellPx * 0.5;
        var dxm = cx - smoothMouse.x, dym = cy - smoothMouse.y, dsqM = dxm * dxm + dym * dym;
        var spot = dsqM < mouseReachSq ? Math.pow(1 - Math.sqrt(dsqM) / mouseReach, 2) * smoothMouse.strength : 0;
        var ripGlow = 0;
        for (var i = 0; i < activeRipples.length; i++) {
          var rp = activeRipples[i], rx = cx - rp.x, ry = cy - rp.y, dsqR = rx * rx + ry * ry;
          if (dsqR >= rp.minRSq && dsqR <= rp.maxRSq) ripGlow = Math.max(ripGlow, (1 - Math.abs(Math.sqrt(dsqR) - rp.r) / ringW) * rp.amp);
        }
        var wordDrawn = false;
        if (isWord) {
          var lit = (0.16 + spot * 2.2 + ripGlow * 1.8) * (1 - sub);
          if (lit > 0.05) {
            ctx.fillStyle = lit > 1.35 ? '#ffffff' : lit > 0.85 ? ('rgb(' + hotRgb + ')') : lit > 0.40 ? ('rgb(' + midRgb + ')') : ('rgb(' + Math.round(ar * 0.28) + ',' + Math.round(ag * 0.28) + ',' + Math.round(ab * 0.28) + ')');
            ctx.fillRect(px, py, cellPx - 1, cellPx - 1);
            wordDrawn = true;
          }
        }
        if (!wordDrawn) {
          var nx = c * 0.07 + sec * 0.16, ny = r * 0.07 - sec * 0.11;
          var nVal = 0.6 * sampleNoise(nx, ny) + 0.4 * sampleNoise(nx * 0.5 - sec * 0.08, ny * 0.5 + sec * 0.07);
          var energy = nVal * 0.75 + (0.5 + 0.5 * Math.sin(sec * 1.8 + (r * 37 + c * 11) % 6.283)) * 0.25;
          if (inWordBox) energy *= sub;
          var fieldVal = energy * 0.35 + spot * 0.90 + ripGlow * 0.95;
          var dither = BAYER[(r & 7) * 8 + (c & 7)] / 64;
          if (fieldVal > dither * 0.76) {
            ctx.fillStyle = (spot > 0.38 || ripGlow > 0.4) ? colorSpotHigh : (spot > 0.14 || ripGlow > 0.15) ? colorSpotMid : fieldVal > 0.54 ? colorFieldHigh : colorFieldLow;
            ctx.fillRect(px, py, cellPx - 1, cellPx - 1);
          }
        }
      }
    }
  }

  window.__getSpotlightState = function() {
    return { isRunning: rafId !== 0, rafId: rafId, mouseActive: mouse.active, strength: smoothMouse.strength, cellPx: cellPx, wordmarkWidth: WM_W * cellPx, wordmarkHeight: WM_H * cellPx, stageWidth: width, stageHeight: height };
  };

  window.idleRenderSpotlight = window.updateMainscreenSun = function() {
    wakeRender(); render(performance.now());
  };

  function start() {
    resize(); updateScroll();
    if (isVisible && isIntersecting && targetSubdued < 1.0) drawScene(performance.now());
    window.addEventListener('resize', function() { resize(); updateScroll(); }, { passive: true });
    window.addEventListener('scroll', updateScroll, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    stage.addEventListener('pointerdown', onPointerDown, { passive: true });
    document.addEventListener('pointerleave', deactivate, { passive: true });
    document.addEventListener('visibilitychange', function() {
      isVisible = !document.hidden;
      if (isVisible) wakeRender(); else { deactivate(); if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function(entries) {
        entries.forEach(function(e) {
          isIntersecting = e.isIntersecting;
          if (isIntersecting) wakeRender(); else if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
        });
      }, { threshold: 0.05 }).observe(stage);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
