/* js/starfield.js — Ambient 16-Bit SNES Parallax Starfield Canvas */
(function() {
  var canvas = document.getElementById("snes-starfield");
  if (!canvas) return;

  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Check prefers-reduced-motion
  var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var prefersReducedMotion = motionQuery.matches;

  var width = 0;
  var height = 0;
  var stars = [];
  var animFrameId = null;
  var isRunning = false;

  var mouseX = 0;
  var mouseY = 0;
  var mouseTargetX = 0;
  var mouseTargetY = 0;

  // Color state
  var starColorPrimary = "#7aa2f7";
  var starColorHot = "#89b4fa";

  function updateColors() {
    try {
      var cs = getComputedStyle(document.documentElement);
      var p = cs.getPropertyValue("--jewel-primary").trim();
      var h = cs.getPropertyValue("--jewel-hot").trim();
      if (p) starColorPrimary = p;
      if (h) starColorHot = h;
    } catch (e) {}
  }

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    initStars();
  }

  function initStars() {
    stars = [];
    var count = Math.floor((width * height) / 22000);
    count = Math.max(36, Math.min(count, 72));

    for (var i = 0; i < count; i++) {
      var depth = Math.random(); // 0 (far) to 1 (near)
      var size = 1;
      var speed = 0.15 + depth * 0.45;
      if (depth > 0.8) {
        size = 3; // Cross star
      } else if (depth > 0.45) {
        size = 2; // Mid pixel
      }

      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: size,
        speed: speed,
        depth: depth,
        twinklePhase: Math.random() * Math.PI * 2,
        twinkleSpeed: 0.02 + Math.random() * 0.04
      });
    }
  }

  function drawPixelCross(x, y, color, alpha) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    var ix = Math.floor(x);
    var iy = Math.floor(y);
    // Center pixel
    ctx.fillRect(ix, iy, 2, 2);
    // 4 cardinal sparkles
    ctx.fillRect(ix - 2, iy, 2, 2);
    ctx.fillRect(ix + 2, iy, 2, 2);
    ctx.fillRect(ix, iy - 2, 2, 2);
    ctx.fillRect(ix, iy + 2, 2, 2);
  }

  function render() {
    if (!isRunning) return;

    ctx.clearRect(0, 0, width, height);

    // Smooth mouse follow
    mouseX += (mouseTargetX - mouseX) * 0.05;
    mouseY += (mouseTargetY - mouseY) * 0.05;

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];

      if (!prefersReducedMotion) {
        s.y += s.speed;
        s.x += mouseX * (s.depth * 0.3);

        // Wrap edges
        if (s.y > height + 4) {
          s.y = -4;
          s.x = Math.random() * width;
        }
        if (s.x > width + 4) s.x = -4;
        if (s.x < -4) s.x = width + 4;

        s.twinklePhase += s.twinkleSpeed;
      }

      var brightness = 0.5 + Math.sin(s.twinklePhase) * 0.5;

      if (s.size === 3) {
        // Foreground 16-bit cross star with jewel tint
        var alpha = 0.4 + brightness * 0.5;
        drawPixelCross(s.x, s.y, starColorHot, alpha);
      } else if (s.size === 2) {
        // Midground jewel pixel
        ctx.fillStyle = starColorPrimary;
        ctx.globalAlpha = 0.35 + brightness * 0.4;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 2, 2);
      } else {
        // Background dim slate star
        ctx.fillStyle = "#8a94b8";
        ctx.globalAlpha = 0.2 + brightness * 0.25;
        ctx.fillRect(Math.floor(s.x), Math.floor(s.y), 1, 1);
      }
    }

    ctx.globalAlpha = 1.0;
    animFrameId = requestAnimationFrame(render);
  }

  function start() {
    if (!isRunning) {
      isRunning = true;
      animFrameId = requestAnimationFrame(render);
    }
  }

  function stop() {
    isRunning = false;
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  // Window Listeners
  window.addEventListener("resize", function() {
    resize();
  });

  window.addEventListener("mousemove", function(e) {
    mouseTargetX = (e.clientX / width - 0.5) * 1.5;
    mouseTargetY = (e.clientY / height - 0.5) * 1.5;
  });

  document.addEventListener("visibilitychange", function() {
    if (document.hidden) {
      stop();
    } else {
      updateColors();
      start();
    }
  });

  // Export theme hook to window so theme.js can notify starfield
  window.updateStarfieldTheme = function() {
    updateColors();
  };

  // Init
  updateColors();
  resize();
  start();
})();
