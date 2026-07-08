/**
 * NeuralLoader — залипательный лоадер «нейросеть собирается из хаоса».
 *
 * Бесшовный цикл (~6.4 с): рассыпанные светящиеся точки дрейфуют,
 * волной от центра выстраиваются в ровную структуру (вид сверху),
 * по связям расходятся волны света и бегут импульсы, затем сеть
 * мягко рассыпается — и собирается уже в ДРУГУЮ структуру.
 *
 * Девять структур в трёх категориях силуэтов:
 *   круглые — кольца, цветок-лотос, восьмиконечная звезда, знак Mira;
 *   широкие — волна-«коса», лента из ромбов, инженерная сетка;
 *   гексагональные — кристалл, снежинка.
 * Категории чередуются строго по кругу (соседние фигуры всегда
 * визуально различны), внутри категории фигура выбирается случайно
 * и не повторяет предыдущую из той же категории. Стартовая
 * категория случайна — при коротких загрузках пользователь
 * видит разные фигуры, без хранения состояния между сессиями.
 *
 * Использование:
 *   import { NeuralLoader } from './neural-loader.js';
 *   const loader = new NeuralLoader(canvasEl, { theme: 'dark' });
 *   loader.start();
 *   // ...
 *   loader.destroy();
 *
 * Опции:
 *   theme:  'dark'  — белое аддитивное свечение (для синей шторки / тёмного фона)
 *           'light' — индиго/фиолетовые точки (для белого фона)
 *   cycle:  длительность цикла в мс (по умолчанию 6400)
 *
 * PWA-friendly: Canvas 2D без shadowBlur (пререндеренные спрайты),
 * devicePixelRatio с капом 2, авто-пауза при скрытой вкладке,
 * поддержка prefers-reduced-motion (статичная сеть с мягким дыханием),
 * ResizeObserver для адаптивного размера.
 */

const TAU = Math.PI * 2;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, t) => {
  const x = clamp((t - a) / (b - a), 0, 1);
  return x * x * (3 - 2 * x);
};
// easeOutBack — едва заметный overshoot при сборке: узел «садится»
// на место, а не пружинит
const backOut = (t) => {
  const c = 0.7;
  const x = t - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

// Спектральное поле: холодный циан слева → белый в центре → мягкий
// фиолет справа. Оттенок задаётся ПОЗИЦИЕЙ, а не случайностью, —
// композиция читается как одно световое явление (дисперсия),
// а не как разноцветные точки.
const PALETTES = {
  dark: {
    composite: 'lighter',
    node: ['#CFE8FF', '#FFFFFF', '#E4D9FF'],
    spectrum: [[184, 226, 255], [242, 247, 255], [226, 214, 255]],
    pulse: '#FFFFFF',
  },
  light: {
    composite: 'source-over',
    node: ['#3E7BD6', '#4F5BD5', '#7A5AE8'],
    spectrum: [[62, 123, 214], [86, 98, 214], [122, 90, 232]],
    pulse: '#4F5BD5',
  },
};

// Линейная интерполяция по трём опорным цветам спектра, u ∈ [0..1]
const mix3 = (stops, u) => {
  const t = clamp(u, 0, 1) * 2;
  const [a, b] = t < 1 ? [stops[0], stops[1]] : [stops[1], stops[2]];
  const k = t < 1 ? t : t - 1;
  return [
    Math.round(lerp(a[0], b[0], k)),
    Math.round(lerp(a[1], b[1], k)),
    Math.round(lerp(a[2], b[2], k)),
  ];
};

// Широкая мягкая аура — атмосфера под собранной сетью
function makeAura(size = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(235,242,255,0.5)');
  grad.addColorStop(0.5, 'rgba(235,242,255,0.16)');
  grad.addColorStop(1, 'rgba(235,242,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

function makeSprite(color, size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  // плотное ядро и длинный мягкий ореол — свет, а не «шарик»
  grad.addColorStop(0, color);
  grad.addColorStop(0.18, color + 'E6');
  grad.addColorStop(0.45, color + '2E');
  grad.addColorStop(1, color + '00');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export class NeuralLoader {
  constructor(canvas, opts = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.theme = opts.theme === 'light' ? 'light' : 'dark';
    this.cycle = opts.cycle || 6400;
    this.speed = 1;
    this.phase = 0; // нормализованное время цикла [0..1)
    this.structIdx = 0;
    this.running = false;
    this.paused = false;
    this._lastT = 0;
    this._raf = 0;

    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.palette = PALETTES[this.theme];
    this.sprites = this.palette.node.map((c) => makeSprite(c));
    this.pulseSprite = makeSprite(this.palette.pulse);
    this.aura = makeAura();

    this._onVis = () => {
      if (document.hidden) this._stopRaf();
      else if (this.running && !this.paused) this._startRaf();
    };
    document.addEventListener('visibilitychange', this._onVis);

    this._ro = new ResizeObserver(() => this._resize());
    this._ro.observe(canvas);
    this._resize();
  }

  setTheme(theme) {
    this.theme = theme === 'light' ? 'light' : 'dark';
    this.palette = PALETTES[this.theme];
    this.sprites = this.palette.node.map((c) => makeSprite(c));
    this.pulseSprite = makeSprite(this.palette.pulse);
  }

  setSpeed(v) { this.speed = clamp(v, 0.1, 4); }

  start() {
    this.running = true;
    this.paused = false;
    this._startRaf();
  }

  pause() { this.paused = true; this._stopRaf(); }

  resume() {
    if (!this.running) return this.start();
    this.paused = false;
    this._startRaf();
  }

  replay() { this.phase = 0; if (this.paused) this._drawFrame(); }

  /** Принудительно переключить целевую структуру, не дожидаясь конца цикла. */
  nextStructure() {
    this._applyStructure(this._pickNext());
    if (this.paused || this.reduced) this._drawFrame();
  }

  /**
   * Выбор следующей фигуры: категории идут по кругу, внутри категории —
   * случайный выбор без повтора предыдущей фигуры этой категории.
   */
  _pickNext() {
    this.catIdx = (this.catIdx + 1) % this.categories.length;
    const group = this.categories[this.catIdx];
    const last = this._lastPick[this.catIdx];
    const choices = group.length > 1 && last !== undefined
      ? group.filter((i) => i !== last)
      : group;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    this._lastPick[this.catIdx] = pick;
    this.structIdx = pick;
    return pick;
  }

  stop() { this.running = false; this._stopRaf(); }

  destroy() {
    this.stop();
    this._ro.disconnect();
    document.removeEventListener('visibilitychange', this._onVis);
  }

  // ---------------------------------------------------------------- internal

  _startRaf() {
    if (this._raf) return;
    this._lastT = performance.now();
    const tick = (now) => {
      this._raf = 0;
      if (!this.running || this.paused || document.hidden) return;
      const dt = Math.min(64, now - this._lastT);
      this._lastT = now;
      if (!this.reduced) {
        const prev = this.phase;
        this.phase = (this.phase + (dt * this.speed) / this.cycle) % 1;
        if (this.phase < prev) {
          // цикл завершён — следующая сборка в фигуру из следующей
          // категории; переключаемся в момент полного хаоса
          this._applyStructure(this._pickNext());
        }
      }
      this._updatePulses(dt * this.speed);
      this._drawFrame();
      this._raf = requestAnimationFrame(tick);
    };
    this._raf = requestAnimationFrame(tick);
  }

  _stopRaf() {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = 0;
  }

  _resize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * dpr);
    this.canvas.height = Math.round(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._buildFadeMask(w, h);
    this._buildBrandGlow(w, h);
    this._build();
    if (!this._raf) this._drawFrame();
  }

  // Мягкая виньетка по краям холста: композиция «растворяется»
  // в фоне, а не обрезается рамкой
  _buildFadeMask(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    g.save();
    g.translate(w / 2, h / 2);
    g.scale(w / 2, h / 2);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, 1);
    grad.addColorStop(0, 'rgba(0,0,0,1)');
    grad.addColorStop(0.72, 'rgba(0,0,0,1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grad;
    g.fillRect(-1, -1, 2, 2);
    g.restore();
    this._fadeMask = c;
  }

  // Фирменный градиент Mira (зелёный из правого верхнего угла → синий),
  // как в логотипе: radial-gradient(... at 106% -30%, #4EB97F, #4086DE).
  // Появляется только вместе с собранным логотипом, очень тихо.
  _buildBrandGlow(w, h) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(w));
    c.height = Math.max(1, Math.round(h));
    const g = c.getContext('2d');
    const grad = g.createRadialGradient(
      w * 1.06, -h * 0.3, 0,
      w * 1.06, -h * 0.3, Math.hypot(w * 1.06, h * 1.3),
    );
    grad.addColorStop(0, 'rgba(78, 185, 127, 0.42)');
    grad.addColorStop(0.55, 'rgba(64, 134, 222, 0.14)');
    grad.addColorStop(1, 'rgba(64, 134, 222, 0)');
    g.fillStyle = grad;
    g.fillRect(0, 0, w, h);
    this._brandGlow = c;
  }

  _build() {
    const { w, h } = this;
    const cx = w / 2;
    const cy = h / 2;
    // Радиус с равным масштабом по осям — структуры выглядят
    // как вид строго сверху, без «сплюснутого» ракурса.
    const R = Math.min(h * 0.46, w * 0.3);
    this.structures = this._makeStructures(cx, cy, R);

    // Категории силуэтов (индексы в this.structures):
    // круглые, широкие, гексагональные.
    this.categories = [
      [0, 2, 5, 8], // кольца, лотос, звезда, логотип Mira
      [6, 7, 3],    // коса, ромбы, сетка
      [1, 4],       // кристалл, снежинка
    ];
    if (this._lastPick === undefined) {
      // первый показ — всегда логотип Mira: сеть сразу
      // «додумывается» до знака, дальше — обычная ротация
      this._lastPick = { 0: 8 };
      this.catIdx = 0;
      this.structIdx = 8;
    }

    // Пул частиц — по максимальному числу узлов среди структур.
    // Хаотичная траектория — сумма синусоид с целыми частотами,
    // поэтому цикл замыкается идеально бесшовно.
    const pool = Math.max(...this.structures.map((s) => s.nodes.length));
    this.particles = Array.from({ length: pool }, (_, i) => ({
      tx: cx,
      ty: cy,
      bx: 10 + Math.random() * (w - 20),
      by: 8 + Math.random() * (h - 16),
      ax1: 8 + Math.random() * 12, fx1: 1 + Math.floor(Math.random() * 2), px1: Math.random(),
      ay1: 6 + Math.random() * 10, fy1: 1 + Math.floor(Math.random() * 2), py1: Math.random(),
      ax2: 3 + Math.random() * 6, fx2: 2 + Math.floor(Math.random() * 2), px2: Math.random(),
      ay2: 2 + Math.random() * 5, fy2: 2 + Math.floor(Math.random() * 2), py2: Math.random(),
      stagger: 0,
      wave: 0,
      r: 2.4,
      sprite: 1,
    }));
    // оттенок запасных частиц — по их позиции в хаосе
    this.particles.forEach((p) => {
      p.sprite = Math.round(clamp(p.bx / w, 0, 1) * 2);
    });
    this.pos = new Float32Array(pool * 2);
    this.sVal = new Float32Array(pool);
    this._applyStructure(this.structIdx);
  }

  // Девять целевых структур. Каждая возвращает узлы + рёбра;
  // финализация добавляет stagger (волна сборки от центра),
  // wave (фаза световой волны) и смежность для импульсов.
  _makeStructures(cx, cy, R) {
    const structs = [];
    const node = (x, y, r = 2.4) => ({ x: cx + x, y: cy + y, r });
    const nearest = (nodes, i, cands) => {
      let best = cands[0];
      let bd = Infinity;
      for (const j of cands) {
        const d = (nodes[i].x - nodes[j].x) ** 2 + (nodes[i].y - nodes[j].y) ** 2;
        if (d < bd) { bd = d; best = j; }
      }
      return best;
    };

    // 1. Кольца с триангуляцией (соседние кольца сдвинуты на полшага)
    {
      const nodes = [node(0, 0, 4.6)];
      const edges = [];
      let prev = [0];
      [[0.38, 8], [0.7, 12], [1, 16]].forEach(([f, m], ri) => {
        const start = nodes.length;
        const shift = ri % 2 ? Math.PI / m : 0;
        const cur = [];
        for (let i = 0; i < m; i++) {
          const a = shift + (i / m) * TAU;
          nodes.push(node(Math.cos(a) * R * f, Math.sin(a) * R * f));
          cur.push(start + i);
        }
        cur.forEach((idx, i) => {
          edges.push([idx, cur[(i + 1) % m]]);
          edges.push([idx, prev.length === 1 ? 0 : nearest(nodes, idx, prev)]);
        });
        prev = cur;
      });
      structs.push({ nodes, edges });
    }

    // 2. Гексагональный кристалл (треугольная решётка)
    {
      const nodes = [];
      const a = R / 1.9;
      for (let q = -2; q <= 2; q++) {
        for (let r = -2; r <= 2; r++) {
          if (Math.abs(q + r) > 2) continue;
          nodes.push(node(a * (q + r / 2), a * r * (Math.sqrt(3) / 2),
            q === 0 && r === 0 ? 4.2 : 2.4));
        }
      }
      const edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < a * 1.15) edges.push([i, j]);
        }
      }
      structs.push({ nodes, edges });
    }

    // 3. Цветок-лотос: пять ромбовидных лепестков с прожилками.
    // Точная 5-кратная симметрия: лепестки через 72°, стороны ±18°.
    {
      const nodes = [node(0, 0, 4.2)];
      const edges = [];
      const petals = 5;
      const base = [];
      for (let k = 0; k < petals; k++) {
        const axis = (k / petals) * TAU - Math.PI / 2;
        const b = nodes.length;
        nodes.push(node(Math.cos(axis) * R * 0.3, Math.sin(axis) * R * 0.3, 2.4));
        base.push(b);
        const sl = nodes.length;
        nodes.push(node(Math.cos(axis - TAU / 20) * R * 0.66, Math.sin(axis - TAU / 20) * R * 0.66, 2.2));
        const sr = nodes.length;
        nodes.push(node(Math.cos(axis + TAU / 20) * R * 0.66, Math.sin(axis + TAU / 20) * R * 0.66, 2.2));
        const tip = nodes.length;
        nodes.push(node(Math.cos(axis) * R, Math.sin(axis) * R, 2.8));
        edges.push([0, b]);
        edges.push([b, sl]);
        edges.push([b, sr]);
        edges.push([sl, tip]);
        edges.push([sr, tip]);
        edges.push([sl, sr]); // прожилка поперёк лепестка
      }
      for (let k = 0; k < petals; k++) edges.push([base[k], base[(k + 1) % petals]]);
      structs.push({ nodes, edges });
    }

    // 4. Инженерная сетка с редкими диагоналями
    {
      const nodes = [];
      const cols = 6;
      const rows = 3;
      const cell = R * 0.62;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          nodes.push(node((c - (cols - 1) / 2) * cell, (r - (rows - 1) / 2) * cell));
        }
      }
      nodes[cols + 2].r = 3.4; // узлы-акценты у центра
      nodes[cols + 3].r = 3.4;
      const edges = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          if (c < cols - 1) edges.push([i, i + 1]);
          if (r < rows - 1) edges.push([i, i + cols]);
        }
      }
      // раскосы каждой второй ячейки, зеркально относительно центра
      const mid = (cols - 2) / 2;
      for (let r = 0; r < rows - 1; r++) {
        for (let c = 0; c < cols - 1; c++) {
          if ((c + r) % 2 !== 0) continue;
          const i = r * cols + c;
          if (c < mid) edges.push([i, i + cols + 1]);
          else if (c > mid) edges.push([i + 1, i + cols]);
          else { edges.push([i, i + cols + 1]); edges.push([i + 1, i + cols]); }
        }
      }
      structs.push({ nodes, edges });
    }

    // 5. Снежинка: 6 лучей + два шестиугольных кольца
    {
      const nodes = [node(0, 0, 4.4)];
      const edges = [];
      const levels = [0.36, 0.68, 1];
      const ringIdx = levels.map(() => []);
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU - Math.PI / 2;
        let prevI = 0;
        levels.forEach((f, li) => {
          const i = nodes.length;
          nodes.push(node(Math.cos(a) * R * f, Math.sin(a) * R * f, li === 2 ? 2.8 : 2.4));
          edges.push([prevI, i]);
          ringIdx[li].push(i);
          prevI = i;
        });
      }
      [1, 2].forEach((li) => {
        const ring = ringIdx[li];
        ring.forEach((idx, i) => edges.push([idx, ring[(i + 1) % ring.length]]));
      });
      structs.push({ nodes, edges });
    }

    // 6. Восьмиконечная звезда: зигзаг-контур из внешних и внутренних
    // вершин, внутренний восьмиугольник и ядро со спицами
    {
      const nodes = [node(0, 0, 4.2)];
      const edges = [];
      const points = 8;
      const outer = [];
      const inner = [];
      for (let k = 0; k < points; k++) {
        const ao = (k / points) * TAU - Math.PI / 2;
        const ai = ao + TAU / (2 * points);
        outer.push(nodes.length);
        nodes.push(node(Math.cos(ao) * R, Math.sin(ao) * R, 2.6));
        inner.push(nodes.length);
        nodes.push(node(Math.cos(ai) * R * 0.48, Math.sin(ai) * R * 0.48, 2.2));
      }
      for (let k = 0; k < points; k++) {
        edges.push([outer[k], inner[k]]);
        edges.push([inner[k], outer[(k + 1) % points]]);
        edges.push([0, inner[k]]);
        edges.push([inner[k], inner[(k + 1) % points]]);
      }
      structs.push({ nodes, edges });
    }

    // 7. Волна-«коса»: две зеркальные косинусоиды, узлы ровно через
    // 1/8 периода. В точках пересечения — общий узел, на пиках — перекладины.
    {
      const nodes = [];
      const edges = [];
      const m = 13; // 1.5 периода
      const X = R * 1.55;
      const A = R * 0.5;
      const dx = (2 * X) / (m - 1);
      const idxA = [];
      const idxB = [];
      for (let i = 0; i < m; i++) {
        const c = Math.cos(TAU * (i / 8));
        const x = -X + dx * i;
        if (Math.abs(c) < 1e-6) {
          const shared = nodes.length;
          nodes.push(node(x, 0, i === 6 ? 3.4 : 2.6));
          idxA.push(shared);
          idxB.push(shared);
        } else {
          idxA.push(nodes.length);
          nodes.push(node(x, -A * c, 2.4));
          idxB.push(nodes.length);
          nodes.push(node(x, A * c, 2.4));
        }
      }
      for (let i = 1; i < m; i++) {
        edges.push([idxA[i - 1], idxA[i]]);
        edges.push([idxB[i - 1], idxB[i]]);
      }
      for (let i = 0; i < m; i += 4) edges.push([idxA[i], idxB[i]]);
      structs.push({ nodes, edges });
    }

    // 8. Лента из ромбов: цепочка квадратов, повёрнутых на 45°
    {
      const nodes = [];
      const edges = [];
      const nMid = 6;
      const X = R * 1.5;
      const dx = (2 * X) / (nMid - 1);
      const dY = dx * 0.5;
      const mid = [];
      const top = [];
      const bot = [];
      for (let i = 0; i < nMid; i++) {
        mid.push(nodes.length);
        nodes.push(node(-X + dx * i, 0, i === 2 || i === 3 ? 3.2 : 2.4));
      }
      for (let i = 0; i < nMid - 1; i++) {
        top.push(nodes.length);
        nodes.push(node(-X + dx * (i + 0.5), -dY, 2.4));
        bot.push(nodes.length);
        nodes.push(node(-X + dx * (i + 0.5), dY, 2.4));
      }
      for (let i = 0; i < nMid - 1; i++) {
        edges.push([mid[i], mid[i + 1]]);
        edges.push([mid[i], top[i]]);
        edges.push([top[i], mid[i + 1]]);
        edges.push([mid[i], bot[i]]);
        edges.push([bot[i], mid[i + 1]]);
      }
      structs.push({ nodes, edges });
    }

    // 9. Знак Mira: внешний круг из узлов и четырёхлучевая
    // «искра» внутри — сеть «додумывается» до логотипа.
    // Пропорции повторяют знак Mira: лучи ≈ 0.55 радиуса круга,
    // талии на диагоналях ≈ 0.21.
    {
      const nodes = [node(0, 0, 3.4)];
      const edges = [];
      const tips = [];
      const waists = [];
      const rt = R * 0.64;
      const rw = R * 0.22;
      for (let k = 0; k < 4; k++) {
        const at = (k / 4) * TAU - Math.PI / 2;
        tips.push(nodes.length);
        nodes.push(node(Math.cos(at) * rt, Math.sin(at) * rt, 3.6));
        const aw = at + TAU / 8;
        waists.push(nodes.length);
        nodes.push(node(Math.cos(aw) * rw, Math.sin(aw) * rw, 2.2));
      }
      // вогнутые стороны: промежуточный узел каждой стороны втянут
      // к центру — силуэт читается как «искра», а не ромб
      const concave = (i, j) => {
        const mx = (nodes[i].x + nodes[j].x) / 2 - cx;
        const my = (nodes[i].y + nodes[j].y) / 2 - cy;
        const mi = nodes.length;
        nodes.push(node(mx * 0.78, my * 0.78, 1.9));
        edges.push([i, mi]);
        edges.push([mi, j]);
      };
      for (let k = 0; k < 4; k++) {
        concave(tips[k], waists[k]);
        concave(waists[k], tips[(k + 1) % 4]);
        edges.push([0, waists[k]]);
      }
      const ring = [];
      const m = 16; // кратно 4 — узлы круга напротив лучей искры
      for (let i = 0; i < m; i++) {
        const a = (i / m) * TAU - Math.PI / 2;
        ring.push(nodes.length);
        nodes.push(node(Math.cos(a) * R, Math.sin(a) * R, i % 4 === 0 ? 2.8 : 2.4));
      }
      ring.forEach((idx, i) => edges.push([idx, ring[(i + 1) % m]]));
      for (let k = 0; k < 4; k++) edges.push([tips[k], ring[k * 4]]);
      structs.push({ nodes, edges });
    }

    // Финализация
    return structs.map(({ nodes, edges }) => {
      const maxD = Math.max(1, ...nodes.map((nd) => Math.hypot(nd.x - cx, nd.y - cy)));
      const finNodes = nodes.map((nd) => {
        const d = Math.hypot(nd.x - cx, nd.y - cy) / maxD;
        return { ...nd, stagger: 0.06 * d, wave: d };
      });
      const finEdges = edges.map(([a, b]) => {
        const mx = (nodes[a].x + nodes[b].x) / 2;
        const my = (nodes[a].y + nodes[b].y) / 2;
        const d = Math.min(1, Math.hypot(mx - cx, my - cy) / maxD);
        // позиция ребра в спектральном поле (по горизонтали холста)
        return { a, b, grow: 0.14 * d, wave: d, u: clamp(mx / this.w, 0, 1) };
      });
      const adj = finNodes.map(() => []);
      finEdges.forEach((e, i) => { adj[e.a].push(i); adj[e.b].push(i); });
      return { nodes: finNodes, edges: finEdges, adj };
    });
  }

  _applyStructure(idx) {
    const st = this.structures[idx % this.structures.length];
    this.activeCount = st.nodes.length;
    st.nodes.forEach((nd, i) => {
      const p = this.particles[i];
      p.tx = nd.x;
      p.ty = nd.y;
      p.r = nd.r;
      p.stagger = nd.stagger;
      p.wave = nd.wave;
      p.sprite = Math.round(clamp(nd.x / this.w, 0, 1) * 2);
    });
    this.edges = st.edges;
    this.adj = st.adj;
    const runners = Math.max(4, Math.round(this.activeCount / 5));
    this.pulses = Array.from({ length: runners }, () => this._spawnPulse());
  }

  _spawnPulse() {
    const e = Math.floor(Math.random() * this.edges.length);
    return { edge: e, dir: Math.random() < 0.5 ? 1 : -1, t: Math.random(), v: 0.55 + Math.random() * 0.5 };
  }

  _updatePulses(dt) {
    if (!this.pulses) return;
    for (const p of this.pulses) {
      p.t += (dt / 1000) * p.v;
      if (p.t >= 1) {
        // прыжок на соседнее ребро — сигнал «бежит» по сети
        const e = this.edges[p.edge];
        const node = p.dir > 0 ? e.b : e.a;
        const options = this.adj[node].filter((i) => i !== p.edge);
        const next = options.length
          ? options[Math.floor(Math.random() * options.length)]
          : Math.floor(Math.random() * this.edges.length);
        p.edge = next;
        p.dir = this.edges[next].a === node ? 1 : -1;
        p.t = 0;
        p.v = 0.55 + Math.random() * 0.5;
      }
    }
  }

  _drawFrame() {
    const { ctx, w, h, particles, edges } = this;
    if (!particles) return;
    const t = this.reduced ? 0.62 : this.phase;

    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = this.palette.composite;
    ctx.lineCap = 'round';

    // --- позиции частиц + степень сборки ---
    const pool = particles.length;
    for (let i = 0; i < pool; i++) {
      const p = particles[i];
      const chX = p.bx
        + p.ax1 * Math.sin(TAU * (p.fx1 * t + p.px1))
        + p.ax2 * Math.sin(TAU * (p.fx2 * t + p.px2));
      const chY = p.by
        + p.ay1 * Math.sin(TAU * (p.fy1 * t + p.py1))
        + p.ay2 * Math.sin(TAU * (p.fy2 * t + p.py2));

      if (i >= this.activeCount) {
        // запасные частицы живут только в хаосе
        this.pos[i * 2] = chX;
        this.pos[i * 2 + 1] = chY;
        this.sVal[i] = 0;
        continue;
      }

      const sIn = smoothstep(0.12 + p.stagger, 0.32 + p.stagger, t);
      const sOut = 1 - smoothstep(0.8 + p.stagger * 0.3, 0.945 + p.stagger * 0.3, t);
      const s = backOut(sIn) * sOut;

      this.pos[i * 2] = lerp(chX, p.tx, s);
      this.pos[i * 2 + 1] = lerp(chY, p.ty, s);
      this.sVal[i] = clamp(s, 0, 1);
    }

    const chaosGlobal = 1 - smoothstep(0.14, 0.3, t) + smoothstep(0.84, 0.97, t);
    const netEnv = this.reduced ? 1
      : smoothstep(0.3, 0.4, t) * (1 - smoothstep(0.8, 0.92, t));
    const spectrum = this.palette.spectrum;

    // --- ambient-аура: сеть сидит в атмосфере, а не на плоском фоне ---
    if (this.palette.composite === 'lighter') {
      const auraA = 0.04 + netEnv * (0.07 + 0.03 * Math.sin(TAU * 2 * t));
      const as = Math.min(w, h) * 2.4;
      ctx.globalAlpha = clamp(auraA, 0, 1);
      ctx.drawImage(this.aura, w / 2 - as / 2, h / 2 - as / 2, as, as);

      // фирменный градиент — только пока собран логотип Mira
      if (this.structIdx === 8 && this._brandGlow) {
        ctx.globalAlpha = clamp(netEnv * 0.55, 0, 1);
        ctx.drawImage(this._brandGlow, 0, 0, w, h);
      }
      ctx.globalAlpha = 1;
    }

    // --- эфемерные связи в хаосе (короткие, по близости) ---
    if (chaosGlobal > 0.03) {
      const maxD = Math.min(w, h * 2) * 0.22;
      ctx.lineWidth = 0.8;
      for (let i = 0; i < pool; i++) {
        for (let j = i + 1; j < pool; j++) {
          const dx = this.pos[i * 2] - this.pos[j * 2];
          const dy = this.pos[i * 2 + 1] - this.pos[j * 2 + 1];
          const d = Math.hypot(dx, dy);
          if (d > maxD) continue;
          const a = (1 - d / maxD) * 0.15 * clamp(chaosGlobal, 0, 1)
            * (1 - this.sVal[i] * 0.7) * (1 - this.sVal[j] * 0.7);
          if (a < 0.01) continue;
          const [er, eg, eb] = mix3(spectrum, (this.pos[i * 2] + this.pos[j * 2]) / 2 / w);
          ctx.strokeStyle = `rgba(${er},${eg},${eb},${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(this.pos[i * 2], this.pos[i * 2 + 1]);
          ctx.lineTo(this.pos[j * 2], this.pos[j * 2 + 1]);
          ctx.stroke();
        }
      }
    }

    // --- структурные рёбра: прорастают от центра, затем по ним
    // --- расходятся волны света (гребень ярче и толще) ---
    if (netEnv > 0.01) {
      for (const e of edges) {
        const grow = this.reduced ? 1 : smoothstep(0.3 + e.grow, 0.42 + e.grow, t);
        const wv = 0.5 + 0.5 * Math.sin(TAU * (2 * t - e.wave));
        const a = (0.16 + 0.36 * wv * netEnv) * grow * netEnv
          * Math.min(this.sVal[e.a], this.sVal[e.b]);
        if (a < 0.01) continue;
        const [er, eg, eb] = mix3(spectrum, e.u);
        ctx.lineWidth = 0.8 + 0.5 * wv * netEnv;
        ctx.strokeStyle = `rgba(${er},${eg},${eb},${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(this.pos[e.a * 2], this.pos[e.a * 2 + 1]);
        ctx.lineTo(this.pos[e.b * 2], this.pos[e.b * 2 + 1]);
        ctx.stroke();
      }
    }

    // --- импульсы, бегущие по рёбрам ---
    const pulseEnv = this.reduced ? 0.5
      : smoothstep(0.4, 0.5, t) * (1 - smoothstep(0.76, 0.86, t));
    if (pulseEnv > 0.02 && this.pulses) {
      for (const p of this.pulses) {
        const e = edges[p.edge];
        if (!e) continue;
        for (let g = 0; g < 4; g++) {
          const tt = clamp(p.t - g * 0.05, 0, 1);
          const pt = p.dir > 0 ? tt : 1 - tt;
          const x = lerp(this.pos[e.a * 2], this.pos[e.b * 2], pt);
          const y = lerp(this.pos[e.a * 2 + 1], this.pos[e.b * 2 + 1], pt);
          const size = (g === 0 ? 7.5 : 6 - g) * 1.2;
          ctx.globalAlpha = pulseEnv * (g === 0 ? 0.72 : 0.26 / g);
          ctx.drawImage(this.pulseSprite, x - size / 2, y - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;
    }

    // --- узлы: в хаосе «дышат» вразнобой, в строю пульсируют
    // --- той же радиальной волной, что и связи ---
    const globalBreathe = this.reduced
      ? 0.85 + 0.1 * Math.sin((performance.now() / 2400) * TAU * 0.2)
      : 1;
    for (let i = 0; i < pool; i++) {
      const p = particles[i];
      const s = this.sVal[i];
      const wvN = 0.5 + 0.5 * Math.sin(TAU * (3 * t - p.wave));
      const scale = 1
        + 0.12 * (1 - s) * Math.sin(TAU * (2 * t + p.px1 * 7))
        + 0.24 * s * (wvN - 0.5) * netEnv;
      const r = p.r * scale * (0.72 + 0.45 * s);
      const size = r * 6; // спрайт с ореолом свечения
      let alpha = (0.5 + 0.5 * s) * globalBreathe;
      if (i >= this.activeCount) alpha *= clamp(chaosGlobal, 0, 1);
      else alpha *= 1 + 0.2 * s * (wvN - 0.5) * netEnv;
      ctx.globalAlpha = clamp(alpha, 0, 1);
      ctx.drawImage(
        this.sprites[p.sprite],
        this.pos[i * 2] - size / 2,
        this.pos[i * 2 + 1] - size / 2,
        size, size,
      );
    }
    ctx.globalAlpha = 1;

    if (this._fadeMask) {
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(this._fadeMask, 0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
