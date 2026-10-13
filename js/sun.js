/* js/sun.js — Global 16-Bit Pixel Grid & Wordmark Engine (Dark/Light, Circle-Free Background) */
(function () {
  'use strict';
  var canvas = document.getElementById('spotlight-canvas') || document.getElementById('mainscreen-canvas');
  if (!canvas) return;
  var stage = document.getElementById('mainscreen'), ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  var BAYER = [0, 32, 8, 40, 2, 34, 10, 42, 48, 16, 56, 24, 50, 18, 58, 26, 12, 44, 4, 36, 14, 46, 6, 38, 60, 28, 52, 20, 62, 30, 54, 22, 3, 35, 11, 43, 1, 33, 9, 41, 51, 19, 59, 27, 49, 17, 57, 25, 15, 47, 7, 39, 13, 45, 5, 37, 63, 31, 55, 23, 61, 29, 53, 21];
  var N = 128, WM_W = 96, WM_H = 24, smoothAcc = null;
  var noiseTable = (function () {
    var seed = 10407530, buf = new Float32Array(N * N);
    for (var i = 0; i < buf.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; buf[i] = seed / 4294967296; }
    for (var p = 0; p < 2; p++) {
      var next = new Float32Array(N * N);
      for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
        var sum = 0; for (var dy = -1; dy <= 1; dy++) for (var dx = -1; dx <= 1; dx++) sum += buf[((y + dy + N) % N) * N + ((x + dx + N) % N)];
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

  var WM_ROWS = [
    '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', '000000111110110011011111001111110111110000000000000000000000000000000000000000000000000000000000', '000001100000110011011001101100000110011000000000000000000000000000000000000000000000000000000000', '000001111100110011011111101111100111111000000000000000000000000000000000000000000000000000000000', '000000000110110011011000001100000110110000000000000000000000000000000000000000000000000000000000', '000000000110110011011000001100000110011000000000000000000000000000000000000000000000000000000000', '000001111100011110011000001111110110011000000000000000000000000000000000000000000000000000000000', '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000', '000111111111111000111111111111000111111111000000000111111110000001111111110000000000011110000000', '000111111111111000111111111111000111111111110000001111111111000001111111111100000001111111100000', '000111111111111000111111111111000111111111111000011111111111100001111111111100000001111111100000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111110011111000',
    '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000', '000111000000000000111000000000000111000000111000011100000011100001111111111100000111000000111000', '000111111111000000111111111000000111000000111000011100000011100001111111110000000111000000111000', '000111111111000000111111111000000111000000111000011100000011100001111111110000000111111111111000', '000111111111000000111111111000000111000000111000011100000011100001110001110000000111111111111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111111111111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000', '000111000000000000111000000000000111000000111000011100000011100001110000011100000111000000111000', '000111000000000000111111111111000111111111111000011111111111100001110000000111000111000000111000', '000111000000000000111111111111000111111111110000001111111111000001110000000111000111000000111000', '000111000000000000111111111111000111111111000000000111111110000001110000000111000111000000111000', '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  ];

  function hasWordNeighbor(wmRow, wmCol) {
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      var nr = wmRow + dr, nc = wmCol + dc;
      if (nr >= 0 && nr < WM_H && nc >= 0 && nc < WM_W && WM_ROWS[nr][nc] === '1') return true;
    }
    return false;
  }

  var TEXT_SEL = 'h1,h2,h3,h4,h5,h6,p,pre,code,kbd,samp,ul,ol,li,dl,dt,dd,table,tr,th,td,blockquote,cite,label,input,textarea,button,select,a,strong,em,b,i,small,span,' +
    '.snes-panel,.rpg-window,.compare-card,.terminal-install-box,.module-card,.key-row,.preinstalled-card,.wallpaper-card,.marquee-chip,.marquee-stream,.dual-marquee-wrap,.site-header,.site-footer,.footer-dock,.snes-eyebrow,.hero-rotating-wrap';

  function isOverTextElement(target) {
    if (!target || target === document.body || target === document.documentElement || target === canvas) return false;
    var node = target.nodeType === 3 ? target.parentElement : target;
    if (!node || typeof node.closest !== 'function' || node.id === 'spotlight-canvas' || node.id === 'mainscreen' || (stage && node.closest('#mainscreen'))) return false;
    var match = node.closest(TEXT_SEL);
    return !!(match && match.textContent && match.textContent.trim().length > 0);
  }
  window.IdleScreenIsText = isOverTextElement;

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = 1, width = 0, height = 0, cellPx = 10, originX = 0, originY = 0, gridCols = 0, gridRows = 0;
  var mouse = { x: -2000, y: -2000, active: false }, smoothMouse = { x: -2000, y: -2000, strength: 0 };
  var isOverText = false, smoothText = 0, lastPointerX = -2000, lastPointerY = -2000, lastHitTime = 0;
  var wander = { x: 0, y: 0, reach: 180 }, rafId = 0, isVisible = true;
  var currentSubdued = 0, targetSubdued = 0, cachedStageRect = null, scrollScheduled = false, hitTimer = null;

  function hexToRgb(hex) {
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var n = parseInt(hex, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function getAccentRgb() {
    try {
      var key = (window.SuperTheme && window.SuperTheme.getCurrent && window.SuperTheme.getCurrent()) || 'blue';
      var pal = (window.SuperTheme && window.SuperTheme.palettes && window.SuperTheme.palettes[key]);
      if (pal && pal.primary) return hexToRgb(pal.primary);
      var p = getComputedStyle(document.documentElement).getPropertyValue('--jewel-primary').trim() || '#7aa2f7';
      return hexToRgb(p.charAt(0) === '#' ? p : '#7aa2f7');
    } catch (e) { return [122, 162, 247]; }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.round(window.innerWidth * dpr); height = Math.round(window.innerHeight * dpr);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    var maxCellW = Math.floor((width * 0.95) / WM_W), stageH = stage ? Math.round(stage.getBoundingClientRect().height * dpr) : height;
    cellPx = Math.max(3, Math.min(maxCellW, Math.floor((stageH * 0.78) / WM_H)));
    originX = Math.round((width - WM_W * cellPx) / 2);
    originY = stage ? Math.round(stage.getBoundingClientRect().top * dpr + (stageH - WM_H * cellPx) / 2) : Math.round((height - WM_H * cellPx) / 2);
    gridCols = Math.ceil(width / cellPx) + 1; gridRows = Math.ceil(height / cellPx) + 1; wander.reach = 190 * dpr;
    if (stage) cachedStageRect = stage.getBoundingClientRect();
    if (reducedMotion) render(0);
  }

  function checkTextHit(target, x, y) {
    var now = performance.now(), apply = function () {
      isOverText = Boolean((target && isOverTextElement(target)) || (x >= 0 && y >= 0 && isOverTextElement(document.elementFromPoint(x, y))));
    };
    if (now - lastHitTime < 40) {
      if (hitTimer) clearTimeout(hitTimer);
      hitTimer = setTimeout(function () { hitTimer = null; lastHitTime = performance.now(); apply(); }, 40);
      return;
    }
    if (hitTimer) { clearTimeout(hitTimer); hitTimer = null; }
    lastHitTime = now; apply();
  }

  function wakeRender() { if (!rafId && !reducedMotion && isVisible) rafId = requestAnimationFrame(render); }

  function updateScroll() {
    if (!stage) { targetSubdued = 1; cachedStageRect = null; return; }
    cachedStageRect = stage.getBoundingClientRect();
    var stageH = stage.offsetHeight || window.innerHeight;
    targetSubdued = Math.min(1, Math.max(0, -cachedStageRect.top / (stageH * 0.55)));
    checkTextHit(null, lastPointerX, lastPointerY); wakeRender();
  }

  function deactivate() {
    if (hitTimer) { clearTimeout(hitTimer); hitTimer = null; }
    if (!mouse.active) return;
    mouse.active = isOverText = false; wakeRender();
  }
  function onLeave(e) {
    if (!e || e.type === 'pointerleave' || e.type === 'mouseleave' || !e.relatedTarget || e.clientX < 0 || e.clientY < 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) deactivate();
  }

  function onPointerMove(e) {
    if (!e || e.clientX < 0 || e.clientY < 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) { deactivate(); return; }
    var px = e.clientX * dpr, py = e.clientY * dpr;
    lastPointerX = e.clientX; lastPointerY = e.clientY; checkTextHit(e.target, lastPointerX, lastPointerY);
    if (smoothMouse.x < -1000 || smoothMouse.strength < 0.01) { smoothMouse.x = px; smoothMouse.y = py; smoothMouse.strength = 1.0; }
    mouse.x = px; mouse.y = py; mouse.active = true;
    if (reducedMotion) render(performance.now()); else wakeRender();
  }

  function onPointerDown(e) {
    if (!e) return;
    var px = e.clientX * dpr, py = e.clientY * dpr;
    lastPointerX = e.clientX; lastPointerY = e.clientY; checkTextHit(e.target, lastPointerX, lastPointerY);
    mouse.x = px; mouse.y = py; mouse.active = true;
    if (window.SFX && window.SFX.playBlip) window.SFX.playBlip(540);
    if (reducedMotion) render(performance.now()); else wakeRender();
  }

  function updateLights(t) {
    var sec = t * 0.001, wmcX = originX + (WM_W * cellPx) * 0.5;
    var stageRect = cachedStageRect;
    var curOriginY = stageRect ? Math.round((stageRect.top + stageRect.height * 0.5) * dpr - (WM_H * cellPx) * 0.5) : originY;
    var wmcY = curOriginY + (WM_H * cellPx) * 0.5;
    var orbAngle = reducedMotion ? 0 : sec * 0.95, orbRx = (WM_W * cellPx) * 0.44, orbRy = Math.max((WM_H * cellPx) * 0.88, 85 * dpr);
    var orbitX = wmcX + Math.cos(orbAngle) * orbRx, orbitY = wmcY + Math.sin(orbAngle) * orbRy;
    var wanderX = width * (0.5 + 0.35 * Math.sin(sec * 0.72)), wanderY = height * (0.47 + 0.22 * Math.sin(sec * 1.15 + 1.3));
    wander.x = orbitX * (1 - currentSubdued) + wanderX * currentSubdued;
    wander.y = orbitY * (1 - currentSubdued) + wanderY * currentSubdued;

    var targetText = (isOverText && mouse.active) ? 1 : 0;
    if (mouse.active) {
      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.22; smoothMouse.y += (mouse.y - smoothMouse.y) * 0.22;
      smoothMouse.strength += (1.0 - smoothMouse.strength) * 0.18;
    } else {
      smoothMouse.x += (wander.x - smoothMouse.x) * 0.08; smoothMouse.y += (wander.y - smoothMouse.y) * 0.08;
      smoothMouse.strength += ((1.0 - currentSubdued * 0.45) - smoothMouse.strength) * 0.08;
    }
    if (smoothMouse.strength > 0.99) smoothMouse.strength = 1.0;
    smoothText += (targetText - smoothText) * 0.22;
    if (Math.abs(targetText - smoothText) < 0.005) smoothText = targetText;
    currentSubdued += (targetSubdued - currentSubdued) * 0.15;
    if (Math.abs(targetSubdued - currentSubdued) < 0.005) currentSubdued = targetSubdued;

    var acc = getAccentRgb();
    if (!smoothAcc) smoothAcc = [acc[0], acc[1], acc[2]];
    for (var i = 0; i < 3; i++) smoothAcc[i] += (acc[i] - smoothAcc[i]) * 0.10;
  }

  function render(t) {
    if (!isVisible && !reducedMotion) { rafId = 0; return; }
    updateLights(t);
    var isLight = document.documentElement.dataset.mode === 'light';
    ctx.fillStyle = isLight ? '#e6e8f0' : '#07080b'; ctx.fillRect(0, 0, width, height);
    var sub = currentSubdued, textDim = smoothText, sec = t * 0.001;
    var ar = Math.round(smoothAcc[0]), ag = Math.round(smoothAcc[1]), ab = Math.round(smoothAcc[2]);
    var hr = Math.min(255, Math.round(ar + (255 - ar) * 0.55)), hg = Math.min(255, Math.round(ag + (255 - ag) * 0.55)), hb = Math.min(255, Math.round(ab + (255 - ab) * 0.55));
    var br = Math.round(ar * 0.72), bg = Math.round(ag * 0.72), bb = Math.round(ab * 0.72);
    var wordSpec = isLight ? ('rgb(' + hr + ',' + hg + ',' + hb + ')') : '#ffffff';
    var wordHot = 'rgb(' + (isLight ? ar : hr) + ',' + (isLight ? ag : hg) + ',' + (isLight ? ab : hb) + ')';
    var wordMid = 'rgb(' + (isLight ? br : ar) + ',' + (isLight ? bg : ag) + ',' + (isLight ? bb : ab) + ')';
    var wordBase = 'rgb(' + Math.round(ar * 0.55) + ',' + Math.round(ag * 0.55) + ',' + Math.round(ab * 0.55) + ')';
    var fRgb = isLight ? (Math.round(ar * 0.65) + ',' + Math.round(ag * 0.65) + ',' + Math.round(ab * 0.65)) : (ar + ',' + ag + ',' + ab);
    var aHigh = ((0.16 - 0.05 * sub) * (1 - 0.25 * textDim)).toFixed(3), aMid = ((0.11 - 0.04 * sub) * (1 - 0.25 * textDim)).toFixed(3), aLow = ((0.06 - 0.02 * sub) * (1 - 0.25 * textDim)).toFixed(3);
    var colorFieldHigh = 'rgba(' + fRgb + ',' + aHigh + ')', colorFieldMid = 'rgba(' + fRgb + ',' + aMid + ')', colorFieldLow = 'rgba(' + fRgb + ',' + aLow + ')';
    var stageRect = cachedStageRect, wordmarkVisible = Boolean(stageRect && stageRect.top > -stageRect.height && sub < 0.95);
    var curOriginY = stageRect ? Math.round((stageRect.top + stageRect.height * 0.5) * dpr - (WM_H * cellPx) * 0.5) : originY;
    for (var r = 0; r < gridRows; r++) {
      var py = r * cellPx, wmRow = Math.floor((py - curOriginY) / cellPx);
      var nearRow = wordmarkVisible && wmRow >= -1 && wmRow <= WM_H;
      for (var c = 0; c < gridCols; c++) {
        var px = c * cellPx, wmCol = Math.floor((px - originX) / cellPx);
        var inWordBox = nearRow && wmRow >= 0 && wmRow < WM_H && wmCol >= 0 && wmCol < WM_W;
        var isWord = inWordBox && WM_ROWS[wmRow][wmCol] === '1';
        var isOutline = !isWord && nearRow && wmCol >= -1 && wmCol <= WM_W && hasWordNeighbor(wmRow, wmCol);
        var nx = c * 0.065 + sec * 0.16, ny = r * 0.065 - sec * 0.11;
        var nVal = 0.6 * sampleNoise(nx, ny) + 0.4 * sampleNoise(nx * 0.5 - sec * 0.08, ny * 0.5 + sec * 0.07);

        if (isWord && (1 - sub) > 0.08) {
          ctx.fillStyle = (wmRow === 1 || wmRow === 8) ? (((wmCol + wmRow) % 3 !== 0) ? wordSpec : wordHot)
            : (wmRow === 2 || wmRow === 9 || wmRow === 10) ? wordHot
            : (wmRow === 6 || wmRow === 21 || wmRow === 22) ? wordBase
            : (nVal > 0.68 ? wordHot : wordMid);
          ctx.fillRect(px, py, cellPx - 1, cellPx - 1);
          continue;
        }
        if (isOutline && (1 - sub) > 0.08) {
          if (isLight) { ctx.fillStyle = '#1a1b26'; ctx.fillRect(px, py, cellPx - 1, cellPx - 1); }
          continue;
        }
        var wave = 0.5 + 0.5 * Math.sin(sec * 1.8 + (r * 37 + c * 11) % 6.283);
        var fieldVal = nVal * 0.78 + wave * 0.22, dither = BAYER[(r & 7) * 8 + (c & 7)] / 64;
        if (fieldVal > dither * 0.82) {
          ctx.fillStyle = fieldVal > 0.66 ? colorFieldHigh : fieldVal > 0.48 ? colorFieldMid : colorFieldLow;
          ctx.fillRect(px, py, cellPx - 1, cellPx - 1);
        }
      }
    }
    if (!reducedMotion && isVisible) rafId = requestAnimationFrame(render);
  }

  window.__getSpotlightState = function () {
    return { isRunning: rafId !== 0, rafId: rafId, mouseActive: mouse.active, isOverText: isOverText, smoothText: smoothText, strength: smoothMouse.strength, cellPx: cellPx, wordmarkWidth: WM_W * cellPx, wordmarkHeight: WM_H * cellPx, stageWidth: width, stageHeight: height };
  };
  window.idleRenderSpotlight = window.updateMainscreenSun = function () { wakeRender(); render(performance.now()); };

  function start() {
    resize(); updateScroll();
    currentSubdued = targetSubdued; isVisible = !document.hidden;
    if (isVisible) render(performance.now());
    window.addEventListener('resize', function () { resize(); updateScroll(); wakeRender(); }, { passive: true });
    window.addEventListener('scroll', function () {
      if (!scrollScheduled) { scrollScheduled = true; requestAnimationFrame(function () { updateScroll(); scrollScheduled = false; }); }
    }, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerup', function (e) { if (e && e.pointerType === 'touch') deactivate(); }, { passive: true });
    ['pointercancel', 'blur'].forEach(function (ev) { window.addEventListener(ev, deactivate, { passive: true }); });
    ['pointerleave', 'mouseleave', 'mouseout'].forEach(function (ev) { document.addEventListener(ev, onLeave, { passive: true }); window.addEventListener(ev, onLeave, { passive: true }); });
    document.addEventListener('visibilitychange', function () {
      isVisible = !document.hidden;
      if (isVisible) wakeRender(); else { deactivate(); smoothMouse.strength = 0; if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
