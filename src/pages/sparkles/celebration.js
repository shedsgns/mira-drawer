/**
 * Quiet Rise — Mira's congratulation moment for completing the daily 3/3.
 *
 * A calm, ~3.5s celebration of lightness instead of fireworks:
 * a soft mint bloom breathes up from the bottom of the screen,
 * a sparse drift of luminous motes rises through it, one hairline
 * ripple expands like an exhale, and a few tiny glints twinkle
 * near the top as everything settles.
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
    var W, H, S;
    function resize() {
      var r = container === document.body
        ? { width: window.innerWidth, height: window.innerHeight }
        : container.getBoundingClientRect();
      W = r.width;
      H = r.height;
      S = H / 660; /* scale sizes to screen height */
      canvas.width = Math.round(W * DPR);
      canvas.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();

    var DUR = 3.7;

    /* Rising motes: a lively lift that settles. A few "hero" motes
       are larger and brighter so the rise has moments to follow. */
    var motes = [];
    for (var i = 0; i < 46; i++) {
      var hero = i % 6 === 0;
      motes.push({
        x: W * (0.08 + 0.84 * Math.random()),
        y: H * (0.82 + 0.16 * Math.random()),
        rise: H * (0.24 + 0.2 * Math.random()),
        sway: (5 + 11 * Math.random()) * S,
        swf: 0.5 + 0.7 * Math.random(),
        ph: Math.random() * TAU,
        size: (hero ? 6 + 4 * Math.random() : 4.5 + 4.5 * Math.random()) * S,
        bright: hero ? 1 : 0.8,
        hero: hero,
        twf: 5 + 4 * Math.random(),
        dot: DOTS[Math.floor(Math.random() * DOTS.length)],
        delay: Math.random() * 0.9,
        ttl: 1.5 + 0.9 * Math.random()
      });
    }

    /* A very light layer of confetti: few pieces, crisp edges,
       brand palette, 3D tumble via single-axis flip. Drawn in
       source-over so the colors stay clean, never glowing. */
    var CONFETTI_COLORS = ['#ffffff', '#ffffff', '#9fe8c4', '#8fc6ff', '#4eb97f', '#ffd27a'];
    var confetti = [];
    for (var ci = 0; ci < 22; ci++) {
      confetti.push({
        x: W * (0.06 + 0.88 * Math.random()),
        y: -H * (0.02 + 0.06 * Math.random()),
        vy: H * (0.2 + 0.13 * Math.random()),
        sway: (10 + 15 * Math.random()) * S,
        swf: 0.35 + 0.45 * Math.random(),
        ph: Math.random() * TAU,
        w: (2.4 + 1.6 * Math.random()) * S,
        h: (5.5 + 3.5 * Math.random()) * S,
        rot: Math.random() * TAU,
        rv: -1.8 + 3.6 * Math.random(),
        flipf: 1.1 + 1.3 * Math.random(),
        flph: Math.random() * TAU,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        delay: Math.random() * 0.7,
        ttl: 2.3 + 0.7 * Math.random()
      });
    }

    /* Glints twinkling across the upper half as the rise settles */
    var glints = [];
    for (var gi = 0; gi < 5; gi++) {
      glints.push({
        x: W * (0.16 + 0.68 * Math.random()),
        y: H * (0.18 + 0.34 * Math.random()),
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

      /* Bloom: a soft light breathing up from the bottom */
      /* Bloom: restrained — a hint of light, not a wash over the UI */
      var bloom = smoothstep(0.05, 0.65, tSim) * (1 - smoothstep(2.3, 3.3, tSim));
      if (bloom > 0.01) {
        var bw = W * 1.3;
        var bh = H * 0.6;
        ctx.globalAlpha = bloom * 0.2;
        ctx.drawImage(BLOOM_MINT, W / 2 - bw / 2, H - bh / 2, bw, bh);
        ctx.globalAlpha = bloom * 0.09;
        ctx.drawImage(BLOOM_WHITE, W / 2 - bw * 0.3, H * 0.99 - bh * 0.25, bw * 0.6, bh * 0.5);
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
        var y = p.y - p.rise * (1 - Math.pow(1 - k, 2.2));
        var x = p.x + Math.sin(life * p.swf * TAU + p.ph) * p.sway * Math.min(1, life);
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

      /* Confetti drift — crisp, unlit, over the glow layers */
      for (var c = 0; c < confetti.length; c++) {
        var cf = confetti[c];
        var cl = tSim - cf.delay;
        if (cl < 0) { alive++; continue; }
        var ck = cl / cf.ttl;
        if (ck >= 1) continue;
        alive++;

        var cy = cf.y + cf.vy * cl;
        var cx = cf.x + Math.sin(cl * cf.swf * TAU + cf.ph) * cf.sway * Math.min(1, cl);
        var ca = smoothstep(0, 0.1, ck) * (1 - smoothstep(0.72, 1, ck));
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
