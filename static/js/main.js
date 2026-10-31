/* ==========================================================
   StreamGaze project page: interactions
   ========================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fmt = function (v) { return v == null ? 'N/A' : v.toFixed(3); };
  var cssVar = function (n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); };

  /* ========================================================
     DATA (from the paper)
     ======================================================== */
  var COLS = [
    { key: 'NFI', label: 'NFI', fam: 'past' },
    { key: 'OTP', label: 'OTP', fam: 'past' },
    { key: 'SR',  label: 'SR',  fam: 'past' },
    { key: 'GSM', label: 'GSM', fam: 'past' },
    { key: 'OIE', label: 'OI (E)', fam: 'present' },
    { key: 'OIH', label: 'OI (H)', fam: 'present' },
    { key: 'OAR', label: 'OAR', fam: 'present' },
    { key: 'FAP', label: 'FAP', fam: 'present' },
    { key: 'GTA', label: 'GTA', fam: 'proactive' },
    { key: 'OAA', label: 'OAA', fam: 'proactive' },
    { key: 'Overall', label: 'Overall', fam: 'overall' }
  ];
  var GROUPS = {
    closed:    { label: 'Closed-Source MLLMs',            short: 'Closed',     color: '--series-1' },
    finetuned: { label: 'GazeQA-based Fine-tuned Models', short: 'Fine-tuned', color: '--series-ft' },
    open:      { label: 'Open-Source MLLMs',              short: 'Open',       color: '--series-2' },
    streaming: { label: 'Open-Source Streaming MLLMs',    short: 'Streaming',  color: '--series-3' }
  };
  function row(name, group, params, frames, v) {
    var o = { name: name, group: group, params: params, frames: frames };
    COLS.forEach(function (c, i) { o[c.key] = v[i]; });
    return o;
  }
  var HUMAN = row('Human', 'human', '-', '-', [.700, .889, .903, .707, .960, .920, .800, .840, .765, .780, .827]);
  var MODELS = [
    row('GPT-4o',          'closed',    '-',   '16',       [.601, .449, .535, .580, .729, .730, .596, .370, .597, .149, .535]),
    row('Claude Sonnet4',  'closed',    '-',   '16',       [.500, .554, .425, .325, .521, .533, .561, .439, .535, .350, .474]),
    row('Claude Opus4',    'closed',    '-',   '16',       [.372, .392, .460, .166, .431, .436, .430, .351, .466, .490, .399]),
    row('AssistGaze',      'finetuned', '26M', '32',       [.294, .131, .310, .294, .278, .250, .109, .254, null, null, .223]),
    row('InternVL3.5',     'open',      '8B',  'Adaptive', [.490, .311, .573, .548, .627, .628, .466, .372, .373, .051, .444]),
    row('Qwen2.5-VL',      'open',      '7B',  'Adaptive', [.518, .350, .450, .483, .590, .558, .548, .391, .486, .407, .478]),
    row('VITA 1.5',        'open',      '7B',  '16',       [.474, .365, .346, .378, .455, .396, .437, .370, .351, .267, .384]),
    row('MiniCPM-V',       'open',      '8B',  '32',       [.430, .374, .354, .296, .334, .379, .438, .345, .480, .216, .365]),
    row('Kangaroo',        'open',      '7B',  '64',       [.363, .365, .319, .275, .454, .484, .402, .412, .242, .198, .351]),
    row('ViSpeak',         'streaming', '7B',  '1 fps',    [.463, .358, .417, .473, .572, .581, .406, .309, .635, .458, .467]),
    row('Dispider',        'streaming', '7B',  '1 fps',    [.366, .365, .381, .263, .336, .338, .353, .321, .252, .261, .323]),
    row('Flash-VStream',   'streaming', '7B',  '1 fps',    [.249, .202, .336, .220, .289, .147, .044, .280, .443, .217, .243]),
    row('VideoLLM-online', 'streaming', '8B',  '2 fps',    [.000, .000, .000, .000, .006, .006, .002, .000, .458, .333, .080])
  ];
  function best(key) {
    var b = null;
    MODELS.forEach(function (m) { if (m[key] != null && (!b || m[key] > b[key])) b = m; });
    return b;
  }
  function mean(key) {
    var vals = MODELS.map(function (m) { return m[key]; }).filter(function (v) { return v != null; });
    return vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
  }

  var TASKS = [
    { id: 'NFI', fam: 'past', name: 'Non-Fixated Object Identification', keys: ['NFI'],
      q: 'Among {kettle, stove, microwave, faucet}, which did the user never <span class="gz">gaze</span> at?',
      opts: ['Kettle', 'Stove', 'Microwave', 'Faucet'], ans: 2 },
    { id: 'OTP', fam: 'past', name: 'Object Transition Prediction', keys: ['OTP'],
      q: 'What object does the user <span class="gz">gaze</span> at next after looking at {pot and kettle}?',
      opts: ['Cup', 'Faucet', 'Knife', 'Counter'], ans: 1 },
    { id: 'SR', fam: 'past', name: 'Scene Recall', keys: ['SR'],
      q: 'When the user was <span class="gz">gazing</span> at the {tomato, knife, plate}, which background object was NOT visible?',
      opts: ['Plate', 'Counter', 'Curtain', 'Stove'], ans: 3 },
    { id: 'GSM', fam: 'past', name: 'Gaze Sequence Matching', keys: ['GSM'],
      q: 'Which transition best matches the user’s <span class="gz">gaze</span> pattern?',
      opts: ['{pot, kettle} → {faucet} → {tomato}', '{pot, knife} → {plate} → {cucumber}',
             '{cup} → {bottle} → {sink}', '{pan} → {refrigerator} → {counter}'], ans: 0, single: true },
    { id: 'OI', fam: 'present', name: 'Object Identification (Easy/Hard)', keys: ['OIE', 'OIH'],
      q: 'Which object is the user currently <span class="gz">gazing</span>?',
      opts: ['Lid', 'Pan', 'Cucumber', 'Spoon'], ans: 2 },
    { id: 'OAR', fam: 'present', name: 'Object Attribute Recognition', keys: ['OAR'],
      q: 'What color is this currently <span class="gz">gazed</span> object?',
      opts: ['Red', 'Blue', 'Yellow', 'Green'], ans: 2 },
    { id: 'FAP', fam: 'present', name: 'Future Action Prediction', keys: ['FAP'],
      q: 'Based on recent <span class="gz">fixations</span>, what will the user do next?',
      opts: ['Pour water to the pot', 'Move around pasta', 'Close the container', 'Put the trash'], ans: 1 },
    { id: 'GTA', fam: 'proactive', name: 'Gaze Triggered Alert', keys: ['GTA'],
      sim: { ask: 'Monitor my gaze and alert me when I gaze on the boiling pot.', at: 653, reply: 'You are gazing the pot now!' } },
    { id: 'OAA', fam: 'proactive', name: 'Object Appearance Alert', keys: ['OAA'],
      sim: { ask: 'Alert me when the lid appears.', at: 350, reply: 'It first appears!' } }
  ];
  var FAM_LABEL = { past: '⏮️ Past task', present: '▶️ Present task', proactive: '⏭️ Proactive task' };
  var KEY_LABEL = { OIE: ' (Easy)', OIH: ' (Hard)' };

  var BENCH = [
    { g: 'Gaze-based QA benchmarks' },
    { name: 'GazeVQA',       len: 150, qa: 25040, type: 'MC',    ann: 'Human',        proac: 0, gaze: 1, all: 0, ego: 1 },
    { name: 'EgoGazeVQA',    len: 52,  qa: 1757,  type: 'MC',    ann: 'Auto',         proac: 0, gaze: 1, all: 0, ego: 1 },
    { g: 'Streaming QA benchmarks' },
    { name: 'StreamingBench', len: 268, qa: 4500, type: 'MC+OE', ann: 'Auto & Human', proac: 1, gaze: 0, all: 1, ego: 0 },
    { name: 'SVBench',       len: 147, qa: 7374,  type: 'OE',    ann: 'Auto & Human', proac: 0, gaze: 0, all: 0, ego: .5 },
    { name: 'OVO-Bench',     len: 428, qa: 2814,  type: 'MC+OE', ann: 'Auto & Human', proac: 1, gaze: 0, all: 1, ego: .5 },
    { name: 'OmniMMI',       len: 324, qa: 2290,  type: 'OE',    ann: 'Auto & Human', proac: 1, gaze: 0, all: 0, ego: .5 },
    { name: 'ProAssist',     len: 710, qa: 1020,  type: 'OE',    ann: 'Auto',         proac: 1, gaze: 0, all: 0, ego: 1 },
    { name: 'StreamBench',   len: 270, qa: 1800,  type: 'OE',    ann: 'Auto & Human', proac: 0, gaze: 0, all: 0, ego: 1 },
    { name: 'Vispeak-Bench', len: 21,  qa: 1000,  type: 'OE',    ann: 'Auto & Human', proac: 1, gaze: 0, all: 0, ego: 0 },
    { name: 'StreamGaze (Ours)', len: 815, qa: 8521, type: 'MC+OE', ann: 'Auto & Human', proac: 1, gaze: 1, all: 1, ego: 1, ours: true }
  ];

  /* ========================================================
     THEME / NAV / PROGRESS
     ======================================================== */
  var themeListeners = [];
  $('#theme-toggle').addEventListener('click', function () {
    var t = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('sg-theme', t);
    themeListeners.forEach(function (f) { f(); });
  });

  var nav = $('#nav'), progress = $('#progress');
  function onScroll() {
    var y = window.scrollY, h = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    nav.classList.toggle('scrolled', y > window.innerHeight * 0.75);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var navLinks = $$('.nav-links a');
  var secObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) secObs.observe(s); });

  /* ========================================================
     REVEAL + COUNT-UP
     ======================================================== */
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      var num = $('.stat-num', e.target);
      if (num) countUp(num);
      revObs.unobserve(e.target);
    });
  }, { threshold: 0.15 });
  $$('.reveal').forEach(function (el) { revObs.observe(el); });

  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '';
    if (reduceMotion) { el.textContent = target.toLocaleString('en-US') + suffix; return; }
    var t0 = performance.now(), dur = 1500;
    (function tick(t) {
      var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  /* ========================================================
     HERO: live gaze scanpath canvas
     ======================================================== */
  (function gazeCanvas() {
    var canvas = $('#gaze-canvas'), hero = $('.hero');
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var target = { x: 0, y: 0 }, gaze = { x: 0, y: 0 };
    var lastMouse = -1e9, autoNext = 0;
    var fix = null;              // current fixation candidate
    var fixations = [];          // finished fixations
    var heat = [];               // soft glow spots
    var running = false, visible = true;
    var FIX_R = 30, FIX_MIN = 160, LIFE = 7000;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!gaze.x) { gaze.x = target.x = W * 0.5; gaze.y = target.y = H * 0.3; }
    }
    window.addEventListener('resize', resize);
    resize();

    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = hero.getBoundingClientRect();
      target.x = e.clientX - r.left; target.y = e.clientY - r.top;
      lastMouse = performance.now();
    });

    function autoGaze(now) {
      // synthetic scanpath: saccade to a random point, then dwell
      if (now < autoNext) return;
      var m = 80;
      target.x = m + Math.random() * (W - 2 * m);
      target.y = m + Math.random() * (H - 2 * m);
      autoNext = now + 450 + Math.random() * 900;
    }

    function endFix(now) {
      if (fix && fix.dur >= FIX_MIN) {
        fixations.push({ x: fix.x, y: fix.y, dur: fix.dur, t: now });
        heat.push({ x: fix.x, y: fix.y, r: 60 + Math.min(fix.dur, 2000) / 18, t: now });
        if (fixations.length > 14) fixations.shift();
        if (heat.length > 40) heat.shift();
      }
      fix = null;
    }

    var prev = performance.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(50, now - prev); prev = now;
      if (now - lastMouse > 2500) autoGaze(now);

      var k = 1 - Math.pow(0.001, dt / 1000 * 2.2);
      gaze.x += (target.x - gaze.x) * k;
      gaze.y += (target.y - gaze.y) * k;
      var jx = gaze.x + (Math.random() - .5) * 1.6, jy = gaze.y + (Math.random() - .5) * 1.6;

      // fixation detection (dispersion threshold)
      if (fix && Math.hypot(gaze.x - fix.x, gaze.y - fix.y) < FIX_R) {
        fix.n++; fix.x += (gaze.x - fix.x) / fix.n; fix.y += (gaze.y - fix.y) / fix.n; fix.dur += dt;
      } else {
        endFix(now);
        fix = { x: gaze.x, y: gaze.y, n: 1, dur: 0 };
      }

      ctx.clearRect(0, 0, W, H);

      // heat glow
      heat = heat.filter(function (h) { return now - h.t < LIFE * 1.6; });
      heat.forEach(function (h) {
        var a = 0.20 * (1 - (now - h.t) / (LIFE * 1.6));
        var g = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, h.r);
        g.addColorStop(0, 'rgba(255,90,140,' + a + ')');
        g.addColorStop(1, 'rgba(255,90,140,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(h.x, h.y, h.r, 0, Math.PI * 2); ctx.fill();
      });

      // scanpath
      fixations = fixations.filter(function (f) { return now - f.t < LIFE; });
      var pts = fixations.slice();
      if (fix && fix.dur >= FIX_MIN) pts.push({ x: fix.x, y: fix.y, dur: fix.dur, t: now, live: true });
      for (var i = 1; i < pts.length; i++) {
        var a0 = 1 - (now - pts[i - 1].t) / LIFE;
        ctx.strokeStyle = 'rgba(160,175,255,' + (0.5 * a0) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      }
      pts.forEach(function (f, idx) {
        var a = f.live ? 1 : 1 - (now - f.t) / LIFE;
        var r = 7 + Math.min(Math.sqrt(f.dur) * 0.75, 30);
        ctx.fillStyle = 'rgba(120,140,255,' + (0.16 * a) + ')';
        ctx.strokeStyle = 'rgba(150,165,255,' + (0.75 * a) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(225,230,255,' + (0.9 * a) + ')';
        ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(idx + 1), f.x, f.y);
      });

      // field-of-view ring + gaze point (as in the paper's figures)
      ctx.strokeStyle = 'rgba(255,70,90,0.85)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(jx, jy, 46, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#2ee87a';
      ctx.shadowColor = 'rgba(46,232,122,.9)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(jx, jy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#0a2f1a'; ctx.lineWidth = 1.5; ctx.stroke();

      requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; prev = performance.now(); requestAnimationFrame(frame); }
    function stop() { running = false; }
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting; visible ? start() : stop();
    }).observe(hero);
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : visible && start(); });
  })();

  /* ========================================================
     TASK EXPLORER
     ======================================================== */
  (function explorer() {
    var pills = $('#task-pills'), panel = $('#task-panel');
    var simTimer = null;

    TASKS.forEach(function (t, i) {
      var b = document.createElement('button');
      b.className = 'pill ' + t.fam;
      b.innerHTML = '<b>' + t.id + '</b><small>' + t.name.replace(' (Easy/Hard)', '') + '</small>';
      b.addEventListener('click', function () { select(i); });
      pills.appendChild(b);
    });

    function scoreBars(t) {
      var html = '<h4>Accuracy on this task</h4>';
      t.keys.forEach(function (k) {
        var b = best(k), suf = KEY_LABEL[k] || '';
        html += bar('Human' + suf, HUMAN[k], 'var(--human)') +
                bar(b.name + suf, b[k], 'var(' + GROUPS[b.group].color + ')') +
                bar('MLLM avg' + suf, mean(k), 'var(--muted)');
      });
      var k0 = t.keys[0], b0 = best(k0);
      html += '<div class="tp-gap">Best model (' + b0.name + ') trails humans by <b>' +
              Math.round((HUMAN[k0] - b0[k0]) * 100) + ' pts</b>' + (KEY_LABEL[k0] || '') + '.</div>';
      return html;
    }
    function bar(label, v, color) {
      return '<div class="mini-bar"><span class="lab" title="' + label + '">' + label + '</span>' +
             '<span class="trk"><span class="fill" style="background:' + color + '" data-w="' + (v * 100) + '"></span></span>' +
             '<span class="val">' + v.toFixed(3) + '</span></div>';
    }

    function select(i) {
      var t = TASKS[i];
      clearInterval(simTimer);
      $$('.pill', pills).forEach(function (p, j) { p.classList.toggle('active', j === i); });
      panel.className = 'task-panel ' + t.fam;
      void panel.offsetWidth; // restart fade-in

      var left = '<div><div class="tp-tag c-' + t.fam + '">' + FAM_LABEL[t.fam] + '</div>' +
                 '<div class="tp-name">' + t.name + '</div>';
      if (t.opts) {
        left += '<p class="tp-q"><b>Q.</b> ' + t.q + '</p><div class="options' + (t.single ? ' single' : '') + '">';
        t.opts.forEach(function (o, j) {
          left += '<button class="opt" data-j="' + j + '"><span class="k">(' + 'ABCD'[j] + ')</span><span>' + o + '</span><span class="res"></span></button>';
        });
        left += '</div><div class="tp-feedback">Pick an answer, as the model would.</div>';
      } else {
        left += '<div class="sim"><div class="sim-head"><span class="sim-clock">00:00</span><span class="sim-live">LIVE STREAM</span></div>' +
                '<div class="sim-bar"><i></i></div><div class="sim-log"></div>' +
                '<button class="sim-btn"><i class="fa-solid fa-play"></i>&nbsp; Play stream</button></div>';
      }
      left += '</div>';
      panel.innerHTML = left + '<div class="tp-side">' + scoreBars(t) + '</div>';

      requestAnimationFrame(function () {
        $$('.fill', panel).forEach(function (f) { f.style.width = f.dataset.w + '%'; });
      });

      if (t.opts) {
        $$('.opt', panel).forEach(function (btn) {
          btn.addEventListener('click', function () {
            var j = +btn.dataset.j, ok = j === t.ans;
            $$('.opt', panel).forEach(function (b2) {
              b2.disabled = true;
              var jj = +b2.dataset.j;
              if (jj === t.ans) { b2.classList.add('correct'); $('.res', b2).innerHTML = '<i class="fa-solid fa-check"></i>'; }
              else if (jj === j) { b2.classList.add('wrong'); $('.res', b2).innerHTML = '<i class="fa-solid fa-xmark"></i>'; }
            });
            $('.tp-feedback', panel).innerHTML = ok
              ? '<b class="ok">Correct!</b> To answer, you have to follow where the user was looking.'
              : '<b class="no">Not quite.</b> The answer is (' + 'ABCD'[t.ans] + '). Gaze is the key signal here.';
          });
        });
      } else {
        $('.sim-btn', panel).addEventListener('click', function () { runSim(t.sim); });
        runSim(t.sim);
      }
    }

    function mmss(s) { return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function runSim(sim) {
      clearInterval(simTimer);
      var clock = $('.sim-clock', panel), log = $('.sim-log', panel), fill = $('.sim-bar i', panel);
      var end = sim.at + 40, s = 0, step = Math.max(1, Math.round(end / 90)), fired = false;
      log.innerHTML = '<div class="u">[00:00] User: ' + sim.ask + '</div><div class="w">… watching the stream</div>';
      simTimer = setInterval(function () {
        s = Math.min(end, s + step);
        clock.textContent = mmss(s);
        fill.style.width = (s / end * 100) + '%';
        if (!fired && s >= sim.at) {
          fired = true;
          clock.textContent = mmss(sim.at);
          log.lastChild.remove();
          log.insertAdjacentHTML('beforeend', '<div class="a">🔔 [' + mmss(sim.at) + '] ' + sim.reply + '</div>');
          clearInterval(simTimer);
          fill.style.width = (sim.at / end * 100) + '%';
        }
      }, 30);
    }

    select(2);
  })();

  /* ========================================================
     PIPELINE STEPPER
     ======================================================== */
  (function pipeline() {
    // regions of pipeline.png (percent of width/height)
    var RECTS = [
      [0.2, 0.3, 18.6, 48.5],
      [19.2, 0.3, 80.5, 51],
      [0.2, 51.8, 41.4, 47.8],
      [42.4, 51.8, 57.2, 47.8]
    ];
    var steps = $$('.step'), spot = $('#spotlight'), bar = $('#pipe-bar');
    var cur = 0, auto = true, inView = false, t0 = 0, DWELL = 4500;

    function go(i) {
      cur = i;
      steps.forEach(function (s, j) { s.classList.toggle('active', j === i); s.setAttribute('aria-selected', j === i); });
      var r = RECTS[i];
      spot.style.left = r[0] + '%'; spot.style.top = r[1] + '%';
      spot.style.width = r[2] + '%'; spot.style.height = r[3] + '%';
      t0 = performance.now();
    }
    steps.forEach(function (s, i) {
      s.addEventListener('click', function () { auto = false; bar.style.width = '0'; go(i); });
    });
    new IntersectionObserver(function (es) { inView = es[0].isIntersecting; }, { threshold: 0.4 }).observe($('.pipeline'));
    (function loop(now) {
      if (auto && inView && !reduceMotion) {
        var p = (now - t0) / DWELL;
        if (p >= 1) { go((cur + 1) % steps.length); p = 0; }
        bar.style.width = (p * 100) + '%';
      } else if (!inView) { t0 = now - ((parseFloat(bar.style.width) || 0) / 100) * DWELL; }
      requestAnimationFrame(loop);
    })(performance.now());
    go(0);
  })();

  /* ========================================================
     BENCHMARK COMPARISON
     ======================================================== */
  (function comparison() {
    var tbody = $('#cmp-table tbody'), msg = $('#cmp-msg');
    var FEATS = ['proac', 'gaze', 'all', 'ego'];
    var mark = function (v) { return v === 1 ? '<span class="ok">✓</span>' : v ? '<span class="part">△</span>' : '<span class="no">✗</span>'; };
    BENCH.forEach(function (b) {
      var tr = document.createElement('tr');
      if (b.g) { tr.className = 'group-row'; tr.innerHTML = '<td colspan="9">' + b.g + '</td>'; }
      else {
        if (b.ours) tr.className = 'ours';
        tr.innerHTML = '<td class="left">' + (b.ours ? '<b>StreamGaze</b> (Ours)' : b.name) + '</td><td>' + b.len + '</td><td>' + b.qa + '</td><td>' + b.type +
          '</td><td>' + b.ann + '</td>' + FEATS.map(function (f) { return '<td>' + mark(b[f]) + '</td>'; }).join('');
        tr._b = b;
      }
      tbody.appendChild(tr);
    });
    var chips = $$('#feat-filters .chip[data-feat]');
    function apply() {
      var on = chips.filter(function (c) { return c.classList.contains('on'); }).map(function (c) { return c.dataset.feat; });
      var n = 0, total = 0;
      $$('tr', tbody).forEach(function (tr) {
        if (!tr._b) return;
        total++;
        var pass = on.every(function (f) { return tr._b[f] === 1; });
        tr.classList.toggle('dim', !pass);
        if (pass) n++;
      });
      if (!on.length) msg.textContent = '';
      else if (n === 1 && on.length === 4) msg.textContent = '🎯 Only StreamGaze has all four.';
      else msg.textContent = n + ' of ' + total + ' benchmarks match.';
      $('#feat-all').textContent = on.length === 4 ? 'Clear' : 'Select all';
    }
    chips.forEach(function (c) { c.addEventListener('click', function () { c.classList.toggle('on'); apply(); }); });
    $('#feat-all').addEventListener('click', function () {
      var all = chips.every(function (c) { return c.classList.contains('on'); });
      chips.forEach(function (c) { c.classList.toggle('on', !all); });
      apply();
    });
  })();

  /* ========================================================
     RESULTS: bar chart + leaderboard
     ======================================================== */
  (function results() {
    var chart = $('#bar-chart'), tip = $('#tooltip');
    var state = { task: 'Overall', metric: 'acc' };
    var ROW_H = 28;

    // controls
    var taskSel = $('#task-select');
    COLS.forEach(function (c) {
      var b = document.createElement('button');
      b.textContent = c.label; b.dataset.key = c.key;
      b.className = (c.fam !== 'overall' ? c.fam : '') + (c.key === state.task ? ' active' : '');
      b.addEventListener('click', function () {
        state.task = c.key;
        $$('button', taskSel).forEach(function (x) { x.classList.toggle('active', x === b); });
        update();
      });
      taskSel.appendChild(b);
    });
    $$('#metric-select button').forEach(function (b) {
      b.addEventListener('click', function () {
        state.metric = b.dataset.metric;
        $$('#metric-select button').forEach(function (x) { x.classList.toggle('active', x === b); });
        update();
      });
    });
    $('#chart-legend').innerHTML = Object.keys(GROUPS).map(function (g) {
      return '<span><i style="background:var(' + GROUPS[g].color + ')"></i>' + GROUPS[g].short + '</span>';
    }).join('') + '<span><i class="line"></i>Human</span>';

    // skeleton
    chart.innerHTML = '<div class="chart-plot"><div class="chart-grid"></div><div class="chart-rows"></div><div class="human-line"><span>Human</span></div></div>';
    var plot = $('.chart-plot', chart), rows = $('.chart-rows', chart), grid = $('.chart-grid', chart), hline = $('.human-line', chart);
    rows.style.height = (MODELS.length * ROW_H + 26) + 'px';
    grid.innerHTML = [0, .2, .4, .6, .8, 1].map(function (v) {
      return '<div class="gl' + (v === 0 ? ' base' : '') + '" style="left:' + (v * 100) + '%"><span>' + (v === 0 ? '0' : v.toFixed(1)) + '</span></div>';
    }).join('');

    var rowEls = MODELS.map(function (m) {
      var el = document.createElement('div');
      el.className = 'bar-row'; el.tabIndex = 0;
      el.innerHTML = '<span class="bar-name">' + m.name + '</span><span class="bar" style="background:var(' + GROUPS[m.group].color + ')"></span><span class="bar-val"></span>';
      el._m = m;
      el.addEventListener('mouseenter', function () { showTip(el); });
      el.addEventListener('focus', function () { showTip(el); });
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('blur', hideTip);
      rows.appendChild(el);
      return el;
    });

    function value(m) {
      var v = m[state.task];
      if (v == null) return null;
      return state.metric === 'acc' ? v : HUMAN[state.task] - v;
    }

    function update() {
      var sorted = rowEls.slice().sort(function (a, b) {
        var va = value(a._m), vb = value(b._m);
        if (va == null) return 1; if (vb == null) return -1;
        return state.metric === 'acc' ? vb - va : va - vb;
      });
      sorted.forEach(function (el, i) {
        var v = value(el._m);
        el.style.transform = 'translateY(' + (i * ROW_H + 12) + 'px)';
        el.classList.toggle('na', v == null);
        el.classList.toggle('labeled', i === 0 && v != null);
        $('.bar', el).style.width = v == null ? '0' : Math.max(0, v) * 100 + '%';
        $('.bar-val', el).textContent = v == null ? 'N/A' : (state.metric === 'gap' ? '−' : '') + v.toFixed(3);
      });
      hline.style.left = HUMAN[state.task] * 100 + '%';
      hline.style.opacity = state.metric === 'acc' ? 1 : 0;
      $('span', hline).textContent = 'Human ' + HUMAN[state.task].toFixed(3);
    }

    function showTip(el) {
      var m = el._m, k = state.task, v = m[k];
      var col = COLS.filter(function (c) { return c.key === k; })[0];
      tip.innerHTML = '<div class="tt-title"><i class="tag" style="display:inline-block;width:9px;height:9px;border-radius:2px;background:var(' + GROUPS[m.group].color + ')"></i>' + m.name + '</div>' +
        '<div class="tt-row"><span>Group</span><b>' + GROUPS[m.group].short + '</b></div>' +
        '<div class="tt-row"><span>Params / Frames</span><b>' + m.params + ' / ' + m.frames + '</b></div>' +
        '<div class="tt-row"><span>' + col.label + ' accuracy</span><b>' + fmt(v) + '</b></div>' +
        '<div class="tt-row"><span>Human</span><b>' + fmt(HUMAN[k]) + '</b></div>' +
        (v != null ? '<div class="tt-row"><span>Gap to human</span><b>' + Math.round((HUMAN[k] - v) * 100) + ' pts</b></div>' : '');
      var card = chart.parentElement.getBoundingClientRect(), r = el.getBoundingClientRect(), bar = $('.bar', el).getBoundingClientRect();
      var x = Math.min(bar.right - card.left + 16, card.width - 200);
      tip.style.left = Math.max(12, x) + 'px';
      tip.style.top = (r.top - card.top - 10) + 'px';
      tip.classList.add('show');
    }
    function hideTip() { tip.classList.remove('show'); }

    update();

    // ---------- leaderboard ----------
    var table = $('#res-table'), groupSel = $('#group-select'), heatToggle = $('#heat-toggle');
    var sortState = { key: null, dir: -1 }, groupFilter = 'all';
    var BEST = {};
    COLS.forEach(function (c) { var b = best(c.key); BEST[c.key] = b && b[c.key]; });

    [['all', 'All']].concat(Object.keys(GROUPS).map(function (g) { return [g, GROUPS[g].short]; })).forEach(function (g) {
      var b = document.createElement('button');
      b.textContent = g[1]; b.dataset.g = g[0];
      if (g[0] === 'all') b.className = 'active';
      b.addEventListener('click', function () {
        groupFilter = g[0];
        $$('button', groupSel).forEach(function (x) { x.classList.toggle('active', x === b); });
        render();
      });
      groupSel.appendChild(b);
    });
    heatToggle.addEventListener('change', render);
    themeListeners.push(render);

    function heat(v) {
      if (!heatToggle.checked || v == null) return '';
      var lo = cssVar('--heat-lo').split(',').map(Number), hi = cssVar('--heat-hi').split(',').map(Number);
      // model scores top out around 0.75, so stretch the ramp over [0, 0.75]
      var t = Math.max(0, Math.min(1, v / 0.75));
      var c = lo.map(function (l, i) { return Math.round(l + (hi[i] - l) * t); });
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var fg = dark ? '#f0efec' : (t > 0.7 ? '#ffffff' : '#0b0b0b');
      return ' style="background:rgb(' + c.join(',') + ');color:' + fg + '"';
    }

    function render() {
      var head = '<thead><tr class="fam"><th colspan="3"></th><th colspan="4" class="past">Past</th><th colspan="4" class="present">Present</th>' +
        '<th colspan="2" class="proactive">Proactive</th><th></th></tr><tr>' +
        '<th class="left sortable" data-key="name">Method<span class="arrow">' + (sortState.key ? '↺' : '') + '</span></th><th>Params</th><th>Frames</th>' +
        COLS.map(function (c) {
          var on = sortState.key === c.key;
          return '<th class="sortable' + (on ? ' sorted' : '') + '" data-key="' + c.key + '">' + c.label +
                 '<span class="arrow">' + (on ? (sortState.dir < 0 ? '▼' : '▲') : '▼') + '</span></th>';
        }).join('') + '</tr></thead>';

      var list = MODELS.filter(function (m) { return groupFilter === 'all' || m.group === groupFilter; });
      var body = '<tbody>' + rowHtml(HUMAN, true);
      if (sortState.key) {
        var k = sortState.key;
        list = list.slice().sort(function (a, b) {
          if (a[k] == null) return 1; if (b[k] == null) return -1;
          return sortState.dir * (a[k] - b[k]);
        });
        list.forEach(function (m) { body += rowHtml(m); });
      } else {
        var lastG = null;
        list.forEach(function (m) {
          if (m.group !== lastG) { body += '<tr class="group-row"><td colspan="14">' + GROUPS[m.group].label + '</td></tr>'; lastG = m.group; }
          body += rowHtml(m);
        });
      }
      table.innerHTML = head + body + '</tbody>';

      $$('th.sortable', table).forEach(function (th) {
        th.addEventListener('click', function () {
          var k = th.dataset.key;
          if (k === 'name') { sortState.key = null; }
          else if (sortState.key === k) { sortState.dir *= -1; }
          else { sortState.key = k; sortState.dir = -1; }
          render();
        });
      });
    }

    function rowHtml(m, isHuman) {
      var name = isHuman ? '<b>Human</b>' : '<i class="tag" style="background:var(' + GROUPS[m.group].color + ')"></i>' + m.name;
      return '<tr' + (isHuman ? ' class="human"' : '') + '><td class="left">' + name + '</td><td>' + m.params + '</td><td>' + m.frames + '</td>' +
        COLS.map(function (c, i) {
          var v = m[c.key];
          var cls = ['cell'];
          if (!isHuman && v != null && v === BEST[c.key]) cls.push('best');
          if (c.key === 'Overall') cls.push('overall');
          if (i === 4 || i === 8) cls.push('bl');
          return '<td class="' + cls.join(' ') + '"' + (isHuman ? '' : heat(v)) + '>' + fmt(v) + '</td>';
        }).join('') + '</tr>';
    }

    render();
  })();

  /* ========================================================
     CONTRIBUTION CARDS: tilt + glow
     ======================================================== */
  if (!reduceMotion) {
    $$('.contrib').forEach(function (c) {
      c.addEventListener('mousemove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.transform = 'perspective(800px) rotateY(' + ((x - .5) * 6) + 'deg) rotateX(' + ((.5 - y) * 6) + 'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave', function () { c.style.transform = ''; });
    });
  }

  /* ========================================================
     LIGHTBOX + BIBTEX COPY
     ======================================================== */
  var lb = $('#lightbox'), lbImg = $('img', lb);
  function openLB(src) { lbImg.src = src; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); }
  function closeLB() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
  $$('.zoomable').forEach(function (img) { img.addEventListener('click', function () { openLB(img.src); }); });
  $$('[data-zoom]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); openLB(a.dataset.zoom); }); });
  lb.addEventListener('click', closeLB);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLB(); });

  $('#copy-bib').addEventListener('click', function () {
    var btn = this;
    navigator.clipboard.writeText($('#bib-code').textContent).then(function () {
      btn.classList.add('done'); $('span', btn).textContent = 'Copied!';
      $('i', btn).className = 'fa-solid fa-check';
      setTimeout(function () { btn.classList.remove('done'); $('span', btn).textContent = 'Copy'; $('i', btn).className = 'fa-regular fa-copy'; }, 1800);
    });
  });
})();
