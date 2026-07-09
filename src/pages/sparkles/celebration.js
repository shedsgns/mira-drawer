/**
 * Quiet Rise — Mira's congratulation moment for completing the daily 3/3.
 *
 * A calm, ~3.5s celebration of lightness instead of fireworks:
 * soft mint blooms enter from the left and right sides,
 * a sparse drift of luminous motes crosses inward, and a few tiny
 * glints twinkle below the status bar as everything settles.
 *
 * Usage:
 *   import './celebration.js';
 *   MiraCelebration.play();
 *
 * Options, all optional:
 *   MiraCelebration.play({
 *     container: document.body,  // where to draw; body = full screen
 *     zIndex: 9999,              // stacking level for the canvas
 *     vibrate: true,             // one soft haptic tick (Android)
 *     onDone: function () {}     // callback after the fade completes
 *   });
 *
 * If container is not body, it should be position: relative.
 * The effect never blocks the UI (pointer-events: none), creates and
 * removes its own canvas, and ignores repeat calls while playing.
 * With "Reduce motion" enabled it shows a single soft glow instead.
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;
  var playing = false;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function smoothstep(a, b, x) {
    var t = clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  }
  /* ---------- Sprites, drawn once on load ---------- */
  function makeDot(rgb) {
    var s = document.createElement('canvas');
    s.width = s.height = 64;
    var g = s.getContext('2d');
    /* tight core, short halo — crisp light, no haze */
    var gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + rgb + ',1)');
    gr.addColorStop(0.28, 'rgba(' + rgb + ',0.7)');
    gr.addColorStop(0.55, 'rgba(' + rgb + ',0.1)');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return s;
  }
  /* Mira light: mostly white, with brand green #4EB97F and blue #4086DE */
  var DOTS = [
    makeDot('255,255,255'),
    makeDot('255,255,255'),
    makeDot('255,255,255'),
    makeDot('78,185,127'),
    makeDot('86,160,235')
  ];
  var BLOOM_MINT = makeDot('120,214,160');
  var BLOOM_WHITE = makeDot('235,245,255');

  /* Four-point star glint with a soft core */
  var GLINT = (function () {
    var s = document.createElement('canvas');
    s.width = s.height = 96;
    var g = s.getContext('2d');
    g.globalCompositeOperation = 'lighter';
    [[92, 2.4], [2.4, 92]].forEach(function (a) {
      var gr = a[0] > a[1]
        ? g.createLinearGradient(2, 48, 94, 48)
        : g.createLinearGradient(48, 2, 48, 94);
      gr.addColorStop(0, 'rgba(255,255,255,0)');
      gr.addColorStop(0.5, 'rgba(255,255,255,0.9)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(48 - a[0] / 2, 48 - a[1] / 2, a[0], a[1]);
    });
    var core = g.createRadialGradient(48, 48, 0, 48, 48, 12);
    core.addColorStop(0, 'rgba(255,255,255,1)');
    core.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = core;
    g.fillRect(0, 0, 96, 96);
    return s;
  })();

  /* ---------- Fallback for prefers-reduced-motion ---------- */
  function playReduced(container, zIndex, onDone) {
    var glow = document.createElement('div');
    glow.style.cssText =
      'position:' + (container === document.body ? 'fixed' : 'absolute') + ';' +
      'inset:0;pointer-events:none;z-index:' + zIndex + ';opacity:0;' +
      'background:radial-gradient(90% 70% at 50% 88%, rgba(110,214,150,.3), rgba(110,214,150,0) 70%);' +
      'transition:opacity 1.2s ease;';
    container.appendChild(glow);
    requestAnimationFrame(function () { glow.style.opacity = '1'; });
    setTimeout(function () { glow.style.opacity = '0'; }, 1700);
    setTimeout(function () {
      glow.remove();
      playing = false;
      if (onDone) onDone();
    }, 3000);
  }

  /* ---------- Main effect ---------- */
  function play(options) {
    if (playing) return;
    playing = true;

    var opts = options || {};
    var container = opts.container || document.body;
    var zIndex = opts.zIndex != null ? opts.zIndex : 9999;
    var onDone = opts.onDone || null;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      playReduced(container, zIndex, onDone);
      return;
    }
    if (opts.vibrate !== false && navigator.vibrate) navigator.vibrate([10, 70, 12]);

    var canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:' + (container === document.body ? 'fixed' : 'absolute') + ';' +
      'inset:0;width:100%;height:100%;pointer-events:none;z-index:' + zIndex + ';';
    container.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var W, H, S, SAFE_TOP;
    function resize() {
      var r = container === document.body
        ? { width: window.innerWidth, height: window.innerHeight }
        : container.getBoundingClientRect();
      W = r.width;
      H = r.height;
      S = H / 660; /* scale sizes to screen height */
      SAFE_TOP = Math.max(72 * S, 64);
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    var DUR = 3.7;

    /* Side motes: the energy enters from the edges and arcs inward,
       keeping the top status bar visually calm. */
    var motes = [];
    for (var i = 0; i < 46; i++) {
      var hero = i % 6 === 0;
      var fromLeft = i % 2 === 0;
      var startY = SAFE_TOP + (H - SAFE_TOP) * (0.28 + 0.58 * Math.random());
      var travelX = W * (0.26 + 0.42 * Math.random());
      var lift = H * (0.08 + 0.2 * Math.random());
      motes.push({
        x: fromLeft ? W * (-0.02 - 0.12 * Math.random()) : W * (1.02 + 0.12 * Math.random()),
        y: startY,
        targetX: fromLeft ? W * (0.12 + 0.18 * Math.random()) + travelX : W * (0.88 - 0.18 * Math.random()) - travelX,
        rise: lift,
        sway: (5 + 11 * Math.random()) * S,
        swf: 0.5 + 0.7 * Math.random(),
        ph: Math.random() * TAU,
        size: (hero ? 6.8 + 4.5 * Math.random() : 5.1 + 5 * Math.random()) * S,
        bright: hero ? 1 : 0.8,
        hero: hero,
        twf: 5 + 4 * Math.random(),
        dot: DOTS[Math.floor(Math.random() * DOTS.length)],
        delay: Math.random() * 0.9,
        ttl: 1.9 + 1 * Math.random()
      });
    }

    /* A very light side burst of confetti: crisp pieces with a quick
       inward kick, upward pop, and gravity. No top-origin pieces. */
    var CONFETTI_COLORS = ['#ffffff', '#ffffff', '#dfffee', '#9fe8c4', '#8fc6ff', '#4eb97f', '#ffd27a', '#ff9fb7', '#b9a7ff'];
    var confetti = [];
    for (var ci = 0; ci < 34; ci++) {
      var confettiFromLeft = ci % 2 === 0;
      confetti.push({
        x: confettiFromLeft ? -W * (0.02 + 0.04 * Math.random()) : W * (1.02 + 0.04 * Math.random()),
        y: SAFE_TOP + (H - SAFE_TOP) * (0.38 + 0.34 * Math.random()),
        vx: (confettiFromLeft ? 1 : -1) * W * (0.74 + 0.4 * Math.random()),
        vy: -H * (0.28 + 0.24 * Math.random()),
        gravity: H * (0.46 + 0.24 * Math.random()),
        drag: 0.34 + 0.1 * Math.random(),
        sway: (2 + 6 * Math.random()) * S,
        swf: 1.2 + 0.8 * Math.random(),
        ph: Math.random() * TAU,
        w: (2.4 + 1.6 * Math.random()) * S,
        h: (5.5 + 3.5 * Math.random()) * S,
        rot: Math.random() * TAU,
        rv: -8 + 16 * Math.random(),
        flipf: 2.8 + 2.2 * Math.random(),
        flph: Math.random() * TAU,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: 0.04 + Math.random() * 0.26,
        ttl: 1.02 + 0.34 * Math.random()
      });
    }

    /* Glints twinkling across the upper half as the rise settles */
    var glints = [];
    for (var gi = 0; gi < 5; gi++) {
      glints.push({
        x: W * (0.16 + 0.68 * Math.random()),
        y: SAFE_TOP + (H - SAFE_TOP) * (0.12 + 0.28 * Math.random()),
        size: (8 + 5 * Math.random()) * S,
        delay: 0.9 + gi * 0.38 + Math.random() * 0.25,
        ttl: 0.85 + Math.random() * 0.25
      });
    }

    var tSim = 0;
    var last = performance.now();

    function frame(now) {
      var dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tSim += dt;

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      /* Bloom: restrained side light, not a wash over the UI or status bar */
      var bloom = smoothstep(0.05, 0.65, tSim) * (1 - smoothstep(2.3, 3.3, tSim));
      if (bloom > 0.01) {
        var bw = W * 0.82;
        var bh = H * 0.56;
        ctx.globalAlpha = bloom * 0.16;
        ctx.drawImage(BLOOM_MINT, -bw * 0.44, H * 0.42, bw, bh);
        ctx.drawImage(BLOOM_MINT, W - bw * 0.56, H * 0.42, bw, bh);
        ctx.globalAlpha = bloom * 0.075;
        ctx.drawImage(BLOOM_WHITE, -bw * 0.2, H * 0.5, bw * 0.52, bh * 0.42);
        ctx.drawImage(BLOOM_WHITE, W - bw * 0.32, H * 0.5, bw * 0.52, bh * 0.42);
      }

      /* Rising motes */
      var alive = 0;
      for (var i = 0; i < motes.length; i++) {
        var p = motes[i];
        var life = tSim - p.delay;
        if (life < 0) { alive++; continue; }
        var k = life / p.ttl;
        if (k >= 1) continue;
        alive++;

        /* Ease-out rise: an energetic lift that gently settles */
        var ease = 1 - Math.pow(1 - k, 2.2);
        var y = Math.max(SAFE_TOP + p.size, p.y - p.rise * ease);
        var x = p.x + (p.targetX - p.x) * ease + Math.sin(life * p.swf * TAU + p.ph) * p.sway * Math.min(1, life);
        var a = smoothstep(0, 0.14, k) * (1 - smoothstep(0.62, 1, k));
        var sz = p.size * (1 - 0.25 * k);

        ctx.globalAlpha = a * p.bright;
        ctx.drawImage(p.dot, x - sz / 2, y - sz / 2, sz, sz);

        /* Hero motes get a small twinkling star cross — a fine shine */
        if (p.hero) {
          var tw = 0.5 + 0.5 * Math.sin(life * p.twf + p.ph);
          var gsz = sz * (1.05 + 0.35 * tw);
          ctx.globalAlpha = a * tw * 0.5;
          ctx.drawImage(GLINT, x - gsz, y - gsz, gsz * 2, gsz * 2);
        }
      }

      /* Glints */
      for (var g = 0; g < glints.length; g++) {
        var gl = glints[g];
        var gk = (tSim - gl.delay) / gl.ttl;
        if (gk <= 0 || gk >= 1) continue;
        alive++;
        var ga = Math.sin(Math.PI * gk);
        var gs = gl.size * (0.7 + 0.3 * ga);
        ctx.globalAlpha = ga * 0.75;
        ctx.drawImage(GLINT, gl.x - gs, gl.y - gs, gs * 2, gs * 2);
      }

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';

      /* Confetti burst — crisp, unlit, over the glow layers */
      for (var c = 0; c < confetti.length; c++) {
        var cf = confetti[c];
        var cl = tSim - cf.delay;
        if (cl < 0) { alive++; continue; }
        var ck = cl / cf.ttl;
        if (ck >= 1) continue;
        alive++;

        var burst = 1 - Math.exp(-cl / cf.drag);
        var cy = Math.max(SAFE_TOP + cf.h, cf.y + cf.vy * cl + 0.5 * cf.gravity * cl * cl);
        var cx = cf.x + cf.vx * burst + Math.sin(cl * cf.swf * TAU + cf.ph) * cf.sway;
        var ca = smoothstep(0, 0.06, ck) * (1 - smoothstep(0.66, 1, ck));
        var flip = 0.22 + 0.78 * Math.abs(Math.sin(cl * cf.flipf * TAU + cf.flph));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(cf.rot + cf.rv * cl);
        ctx.scale(1, flip);
        ctx.globalAlpha = ca * 0.9;
        ctx.fillStyle = cf.color;
        ctx.fillRect(-cf.w / 2, -cf.h / 2, cf.w, cf.h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      if (tSim < DUR || alive > 0) {
        requestAnimationFrame(frame);
      } else {
        canvas.remove();
        playing = false;
        if (onDone) onDone();
      }
    }
    requestAnimationFrame(frame);
  }

  global.MiraCelebration = { play: play };
})(window);
