/**
 * Engine hang động 2D nhìn 3/4 từ trên xuống, chiếu sáng động — hoàn toàn nguyên bản.
 *
 * Pipeline mỗi khung hình:
 *   1. vẽ lớp nền tĩnh (sàn, tường 3/4, quặng, trang trí) đã render sẵn
 *   2. vẽ vật thể động (nước gợn, bệ pha lê, đuốc, nhân vật, vết nứt, hạt)
 *   3. light map: nền tối (ambient) + cộng dồn các nguồn sáng → nhân (multiply) lên cảnh
 *   4. quầng sáng (bloom giả) + đom đóm cộng sáng (lighter) sau cùng
 * Canvas render ở độ phân giải thấp rồi phóng to nguyên lần → pixel sắc nét.
 */
import { BIOMES, type Biome, type BiomeId } from './biomes';
import type { SpriteName } from '../components/pixel/sprites';
import {
  FACE_H, TILE, hash2, paintDecor, paintFloor, paintFloorShadow, paintOre, paintWallFace, paintWallTop, paintWater, rng, spriteCanvas,
} from './paint';

export type MinedKind = 'stone' | 'dirt' | 'copper' | 'gold' | 'crystal';

const FLOOR = 0;
const WALL = 1;
const WATER = 2;

interface Light {
  x: number;
  y: number;
  r: number;
  c: [number, number, number];
  i: number;
  flicker?: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  size: number;
  kind: 'debris' | 'ember' | 'drop';
  ore?: MinedKind;
  glow?: boolean;
}

export interface CaveWorldOptions {
  biome?: BiomeId;
  seed?: number;
  /** vị trí tâm hang theo tỉ lệ khung (0..1) */
  focus?: { x: number; y: number };
  interactive?: boolean;
  calm?: boolean;
  onMine?: (kind: MinedKind) => void;
  /** chỉ vẽ 1 khung tĩnh (thumbnail) */
  still?: boolean;
  /** kích thước 1 pixel game tính bằng px CSS (mặc định tự chọn) */
  scale?: number;
  /** vật phẩm lơ lửng trên bệ (mặc định: pha lê) */
  relic?: SpriteName;
  showPlayer?: boolean;
}

const oreKind = (color: string): MinedKind =>
  color === '#e8873f' ? 'copper' : color === '#f2c14e' ? 'gold' : color === '#5ef2e6' || color === '#b48cff' ? 'crystal' : 'stone';

const noise = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(l(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), s(xf)), l(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), s(xf)), s(yf));
};

export class CaveWorld {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ground = document.createElement('canvas');
  private lightCanvas = document.createElement('canvas');
  private lctx: CanvasRenderingContext2D;
  private b: Biome;
  private opts: Required<Pick<CaveWorldOptions, 'seed' | 'focus' | 'interactive' | 'calm' | 'still'>> & CaveWorldOptions;

  private W = 0; // px game
  private H = 0;
  private cols = 0;
  private rows = 0;
  private tiles = new Uint8Array(0);
  private ore = new Int8Array(0);
  private decor = new Int8Array(0);
  private hits = new Uint8Array(0);
  private torches: { x: number; y: number; wall: boolean; phase: number }[] = [];
  private shrine = { x: 0, y: 0 };
  private player = { x: 0, y: 0, face: 1 };
  private particles: Particle[] = [];
  private flies: { x: number; y: number; p: number }[] = [];
  private pointer: { x: number; y: number } | null = null;
  private hover = -1;
  private raf = 0;
  private last = 0;
  private t = 0;
  private running = false;
  private intense = false;

  constructor(canvas: HTMLCanvasElement, options: CaveWorldOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.lctx = this.lightCanvas.getContext('2d')!;
    this.b = BIOMES[options.biome ?? 'burrow'];
    this.opts = { seed: 239, focus: { x: 0.5, y: 0.5 }, interactive: false, calm: false, still: false, ...options };
    canvas.style.imageRendering = 'pixelated';
  }

  // ---------------- Kích thước & sinh bản đồ ----------------
  resize(cssW: number, cssH: number) {
    const scale = this.opts.scale ?? Math.max(2, Math.min(4, Math.round(cssW / 470)));
    this.W = Math.ceil(cssW / scale);
    this.H = Math.ceil(cssH / scale);
    this.canvas.width = this.W;
    this.canvas.height = this.H;
    this.lightCanvas.width = this.W;
    this.lightCanvas.height = this.H;
    this.cols = Math.ceil(this.W / TILE) + 1;
    this.rows = Math.ceil(this.H / TILE) + 1;
    this.generate();
    this.renderGround();
    if (this.opts.still || !this.running) this.frame(0);
  }

  private idx = (x: number, y: number) => y * this.cols + x;
  private at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.cols || y >= this.rows ? WALL : this.tiles[this.idx(x, y)]);

  private generate() {
    const { cols, rows } = this;
    const seed = this.opts.seed;
    const n = cols * rows;
    this.tiles = new Uint8Array(n);
    this.ore = new Int8Array(n).fill(-1);
    this.decor = new Int8Array(n).fill(-1);
    this.hits = new Uint8Array(n);
    this.particles = [];

    const cx = Math.round((this.W * this.opts.focus.x) / TILE);
    const cy = Math.round((this.H * this.opts.focus.y) / TILE);
    const rx = Math.max(3, Math.min(cx - 1.5, cols - cx - 2, cols * 0.38));
    const ry = Math.max(2.5, Math.min(cy - 1.2, rows - cy - 1.5, rows * 0.4));
    this.shrine = { x: cx, y: cy };

    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const nz = noise(x * 0.28, y * 0.28, seed);
        const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + (nz - 0.5) * 0.75;
        let t = e > 1 ? WALL : FLOOR;
        // vài cột đá lẻ trong hang
        if (t === FLOOR && e > 0.5 && hash2(x, y, seed + 5) < 0.045) t = WALL;
        this.tiles[this.idx(x, y)] = t;
      }

    // hồ nước
    if (this.b.water) {
      const wx = cx - rx * 0.6;
      const wy = cy + ry * 0.35;
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          const d = ((x - wx) / (rx * 0.28)) ** 2 + ((y - wy) / (ry * 0.32)) ** 2 + (noise(x * 0.5, y * 0.5, seed + 9) - 0.5) * 0.6;
          if (d < 1 && this.at(x, y) === FLOOR) this.tiles[this.idx(x, y)] = WATER;
        }
    }

    // khoảng trống quanh bệ pha lê
    for (let y = cy - 2; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) this.tiles[this.idx(x, y)] = FLOOR;

    // quặng ở những bức tường nhìn thấy được
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (this.at(x, y) !== WALL || !this.exposed(x, y)) continue;
        if (hash2(x, y, seed + 2) < 0.13) this.ore[this.idx(x, y)] = Math.floor(hash2(x, y, seed + 3) * this.b.ore.length);
      }

    // đuốc gắn tường (sàn có tường ngay phía bắc) — cách nhau ≥ 6 ô
    this.torches = [];
    const cand: [number, number][] = [];
    for (let y = 1; y < rows; y++) for (let x = 1; x < cols - 1; x++) if (this.at(x, y) === FLOOR && this.at(x, y - 1) === WALL) cand.push([x, y]);
    cand.sort((a, b) => hash2(a[0], a[1], seed + 7) - hash2(b[0], b[1], seed + 7));
    for (const [x, y] of cand) {
      if (this.torches.length >= 9) break;
      if (Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3) continue;
      if (this.torches.every((t) => Math.hypot(t.x - x, t.y - y) >= 6)) this.torches.push({ x, y, wall: true, phase: hash2(x, y, 3) * 10 });
    }
    // 2 đuốc đứng hai bên bệ
    this.torches.push({ x: cx - 2, y: cy + 1, wall: false, phase: 1.3 }, { x: cx + 2, y: cy + 1, wall: false, phase: 4.1 });

    // trang trí
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (this.at(x, y) !== FLOOR || (Math.abs(x - cx) <= 2 && Math.abs(y - cy) <= 2)) continue;
        const r = hash2(x, y, seed + 11);
        let acc = 0;
        for (let i = 0; i < this.b.decor.length; i++) {
          acc += this.b.decor[i].chance;
          if (r < acc) {
            this.decor[this.idx(x, y)] = i;
            break;
          }
        }
      }

    this.player = { x: (cx + 1.6) * TILE, y: (cy + 2) * TILE, face: -1 };
    this.flies = Array.from({ length: this.opts.still ? 0 : 26 }, (_, i) => ({ x: hash2(i, 1, seed) * this.W, y: hash2(i, 2, seed) * this.H, p: i * 1.7 }));
  }

  private exposed(x: number, y: number) {
    return this.at(x + 1, y) !== WALL || this.at(x - 1, y) !== WALL || this.at(x, y + 1) !== WALL || this.at(x, y - 1) !== WALL;
  }

  /** Render lại lớp nền tĩnh (gọi khi sinh map hoặc khi 1 khối bị đào). */
  private renderGround() {
    const g = this.ground;
    g.width = this.cols * TILE;
    g.height = this.rows * TILE;
    const ctx = g.getContext('2d')!;
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.cols; x++) {
        const t = this.at(x, y);
        const ox = x * TILE;
        const oy = y * TILE;
        const r = rng(Math.floor(hash2(x, y, this.opts.seed) * 1e9));
        if (t === WALL) {
          paintWallTop(ctx, ox, oy, this.b, r);
          const face = this.at(x, y + 1) !== WALL;
          if (face) paintWallFace(ctx, ox, oy, this.b, r);
          const o = this.ore[this.idx(x, y)];
          if (o >= 0) paintOre(ctx, ox, oy, this.b.ore[o].color, r, face);
        } else {
          paintFloor(ctx, ox, oy, this.b, r);
          const d = this.decor[this.idx(x, y)];
          if (d >= 0) paintDecor(ctx, ox, oy, this.b.decor[d], r);
          if (this.at(x, y - 1) === WALL) paintFloorShadow(ctx, ox, oy);
          if (t === WATER) paintWater(ctx, ox, oy, this.b, r);
        }
      }
  }

  // ---------------- Vòng lặp ----------------
  start() {
    if (this.running || this.opts.still) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.frame(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }
  destroy() {
    this.stop();
  }
  setIntense(on: boolean) {
    this.intense = on;
  }

  // ---------------- Input ----------------
  private toGame(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.W, y: ((clientY - r.top) / r.height) * this.H };
  }
  pointerMove(clientX: number, clientY: number) {
    this.pointer = this.toGame(clientX, clientY);
    this.hover = this.mineableAt(this.pointer.x, this.pointer.y);
    if (this.pointer.x < this.player.x - 2) this.player.face = -1;
    else if (this.pointer.x > this.player.x + 18) this.player.face = 1;
  }
  pointerLeave() {
    this.pointer = null;
    this.hover = -1;
  }
  private mineableAt(gx: number, gy: number) {
    const x = Math.floor(gx / TILE);
    const y = Math.floor(gy / TILE);
    if (x <= 0 || y <= 0 || x >= this.cols - 1 || y >= this.rows - 1) return -1;
    if (this.at(x, y) !== WALL || !this.exposed(x, y)) return -1;
    return this.idx(x, y);
  }
  /** Click: gõ 3 lần thì khối vỡ. Trả về true nếu trúng tường. */
  click(clientX: number, clientY: number) {
    if (!this.opts.interactive) return false;
    const p = this.toGame(clientX, clientY);
    const i = this.mineableAt(p.x, p.y);
    if (i < 0) return false;
    const x = i % this.cols;
    const y = Math.floor(i / this.cols);
    const cx = (x + 0.5) * TILE;
    const cy = (y + 0.5) * TILE;
    this.hits[i]++;
    this.burst(cx, cy, 4, 0.5);
    if (this.hits[i] >= 3) {
      const o = this.ore[i];
      const kind: MinedKind = o >= 0 ? oreKind(this.b.ore[o].color) : hash2(x, y, 4) < 0.5 ? 'dirt' : 'stone';
      this.tiles[i] = FLOOR;
      this.ore[i] = -1;
      this.hits[i] = 0;
      this.renderGround();
      this.burst(cx, cy, 14, 1);
      this.particles.push({
        x: cx, y: cy, vx: (Math.random() - 0.5) * 30, vy: -60, life: 1.1, max: 1.1, size: 3,
        color: o >= 0 ? this.b.ore[o].color : this.b.wallFace[0], kind: 'drop', ore: kind, glow: o >= 0,
      });
      this.hover = -1;
    }
    return true;
  }
  private burst(x: number, y: number, n: number, power: number) {
    for (let k = 0; k < n; k++)
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 90 * power,
        vy: (-Math.random() * 70 - 20) * power,
        life: 0.5 + Math.random() * 0.3, max: 0.8,
        color: Math.random() < 0.3 ? this.b.wallLip : this.b.wallFace[k % this.b.wallFace.length],
        size: Math.random() < 0.3 ? 2 : 1, kind: 'debris',
      });
  }

  // ---------------- Render 1 khung ----------------
  private frame(dt: number) {
    const { ctx } = this;
    const calm = this.opts.calm;
    this.t += dt * (calm ? 0.4 : 1);
    const t = this.t;

    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.ground, 0, 0);

    // nước gợn sóng
    if (this.b.water) {
      for (let y = 0; y < this.rows; y++)
        for (let x = 0; x < this.cols; x++)
          if (this.at(x, y) === WATER) {
            const r = rng(Math.floor(hash2(x, y, 77) * 1e9));
            paintWater(ctx, x * TILE, y * TILE, this.b, r, t * 3);
            if (this.at(x, y - 1) === WALL) paintFloorShadow(ctx, x * TILE, y * TILE);
          }
    }

    // bệ pha lê (đá, mặt đứng 3/4) + pha lê lơ lửng
    const sx = this.shrine.x * TILE;
    const sy = this.shrine.y * TILE;
    ctx.fillStyle = '#5b5f7e';
    ctx.fillRect(sx - 14, sy - 2, 44, 10);
    ctx.fillStyle = '#7c81a6';
    ctx.fillRect(sx - 14, sy - 2, 44, 1);
    ctx.fillStyle = '#3c3f58';
    ctx.fillRect(sx - 14, sy + 8, 44, 7);
    ctx.fillStyle = '#2b2d40';
    for (let k = 0; k < 44; k += 4) ctx.fillRect(sx - 14 + k, sy + 8, 1, 7);
    ctx.fillStyle = '#6a6f92';
    ctx.fillRect(sx - 6, sy - 6, 28, 5);
    ctx.fillStyle = '#8f95bd';
    ctx.fillRect(sx - 6, sy - 6, 28, 1);
    const bob = Math.round(Math.sin(t * 1.6) * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(sx + 2, sy - 3, 12, 2);
    ctx.drawImage(spriteCanvas(this.opts.relic ?? 'gem'), sx, sy - 26 + bob);

    // đuốc
    const frameA = Math.floor(t * 6) % 2 === 0;
    for (const tc of this.torches) {
      const x = tc.x * TILE;
      const y = tc.y * TILE - (tc.wall ? 9 : 4);
      ctx.drawImage(spriteCanvas(frameA !== tc.phase > 5 ? 'torch' : 'torch2'), x, y);
      if (!calm && !this.opts.still && Math.random() < dt * 2.5)
        this.particles.push({ x: x + 8, y: y + 3, vx: (Math.random() - 0.5) * 6, vy: -14 - Math.random() * 10, life: 1, max: 1, color: '#ffb347', size: 1, kind: 'ember', glow: true });
    }

    // nhân vật (nguyên bản) cầm đèn
    const showPlayer = this.opts.showPlayer !== false;
    const pb = Math.round(Math.sin(t * 2.2));
    if (showPlayer) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(this.player.x + 4, this.player.y + 14, 9, 2);
      ctx.save();
      if (this.player.face < 0) {
        ctx.translate(this.player.x + 16, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(spriteCanvas('explorer'), 0, this.player.y - 2 + pb);
      } else ctx.drawImage(spriteCanvas('explorer'), this.player.x, this.player.y - 2 + pb);
      ctx.restore();
    }

    // ô tường đang trỏ + vết nứt
    if (this.opts.interactive) {
      for (let i = 0; i < this.hits.length; i++) if (this.hits[i]) this.drawCracks(i, this.hits[i]);
      if (this.hover >= 0) {
        const x = (this.hover % this.cols) * TILE;
        const y = Math.floor(this.hover / this.cols) * TILE;
        ctx.fillStyle = 'rgba(255,240,200,0.85)';
        for (const [dx, dy] of [[0, 0], [TILE - 3, 0], [0, TILE - 1], [TILE - 3, TILE - 1]]) ctx.fillRect(x + dx, y + dy, 3, 1);
        for (const [dx, dy] of [[0, 0], [TILE - 1, 0], [0, TILE - 3], [TILE - 1, TILE - 3]]) ctx.fillRect(x + dx, y + dy, 1, 3);
      }
    }

    // hạt: mảnh vụn, tàn lửa, vật phẩm rơi
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        if (p.kind === 'drop' && p.ore) this.opts.onMine?.(p.ore);
        return false;
      }
      if (p.kind === 'drop') {
        const k = 1 - p.life / p.max;
        if (k < 0.45) {
          p.vy += 220 * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        } else p.y -= 40 * dt; // bay lên như được nhặt
      } else if (p.kind === 'ember') {
        p.x += p.vx * dt + Math.sin((p.life + p.y) * 6) * 0.1;
        p.y += p.vy * dt;
      } else {
        p.vy += 260 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
      }
      if (p.kind !== 'ember') {
        ctx.globalAlpha = Math.min(1, p.life * 3);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        if (p.kind === 'drop') {
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
      return true;
    });

    // ---------- Ánh sáng ----------
    const lights: Light[] = [];
    const L = this.b.light;
    for (const tc of this.torches) lights.push({ x: tc.x * TILE + 8, y: tc.y * TILE - (tc.wall ? 4 : 0), r: 78, c: L, i: 0.95, flicker: tc.phase });
    lights.push({ x: sx + 8, y: sy - 18, r: 96 + Math.sin(t * 1.6) * 6, c: [80, 225, 215], i: 0.9 });
    if (showPlayer) lights.push({ x: this.player.x + 8, y: this.player.y + 6, r: 46, c: [255, 210, 150], i: 0.7 });
    if (this.pointer) lights.push({ x: this.pointer.x, y: this.pointer.y, r: 58, c: [255, 214, 160], i: 0.75 });
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.cols; x++) {
        const i = this.idx(x, y);
        const o = this.ore[i];
        if (o >= 0 && this.b.ore[o].light) lights.push({ x: x * TILE + 8, y: y * TILE + 10, r: 22, c: this.b.ore[o].light!, i: 0.55 });
        const d = this.decor[i];
        if (d >= 0 && this.tiles[i] === FLOOR && (this.b.decor[d].kind === 'shroom' || this.b.decor[d].kind === 'crystal')) lights.push({ x: x * TILE + 8, y: y * TILE + 8, r: 18, c: [90, 190, 255], i: 0.45 });
      }
    for (const p of this.particles) if (p.kind === 'drop' && p.glow) lights.push({ x: p.x, y: p.y, r: 14, c: [255, 230, 160], i: 0.6 });

    const lc = this.lctx;
    const amb = this.b.ambient.map((v) => Math.min(255, v * (this.intense ? 3.2 : 1)));
    lc.globalCompositeOperation = 'source-over';
    lc.fillStyle = `rgb(${amb[0]},${amb[1]},${amb[2]})`;
    lc.fillRect(0, 0, this.W, this.H);
    lc.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      const f = l.flicker !== undefined ? 0.88 + Math.sin(t * 9 + l.flicker) * 0.06 + Math.sin(t * 23 + l.flicker * 2) * 0.04 : 1;
      const r = l.r * (l.flicker !== undefined ? 0.96 + f * 0.04 : 1);
      const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
      const [cr, cg, cb] = l.c;
      g.addColorStop(0, `rgba(${cr},${cg},${cb},${l.i * f})`);
      g.addColorStop(0.45, `rgba(${cr},${cg},${cb},${l.i * f * 0.42})`);
      g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
      lc.fillStyle = g;
      lc.fillRect(l.x - r, l.y - r, r * 2, r * 2);
    }
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.lightCanvas, 0, 0);

    // ---------- Quầng sáng + đom đóm (cộng sáng) ----------
    ctx.globalCompositeOperation = 'lighter';
    const glow = (x: number, y: number, r: number, c: string) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const tc of this.torches) glow(tc.x * TILE + 8, tc.y * TILE - (tc.wall ? 6 : 1), 9, 'rgba(255,170,80,0.55)');
    glow(sx + 8, sy - 18 + bob, 16, 'rgba(94,242,230,0.45)');
    for (const p of this.particles)
      if (p.kind === 'ember') {
        ctx.fillStyle = `rgba(255,${150 + Math.floor(p.life * 80)},80,${p.life})`;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
      }
    for (const f of this.flies) {
      f.x += Math.sin(t * 0.7 + f.p) * dt * 8;
      f.y += Math.cos(t * 0.5 + f.p * 1.3) * dt * 6;
      const a = 0.35 + 0.35 * Math.sin(t * 2 + f.p * 3);
      ctx.fillStyle = `rgba(214,255,140,${a})`;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
      glow(f.x, f.y, 4, `rgba(200,255,120,${a * 0.35})`);
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  private drawCracks(i: number, stage: number) {
    const ctx = this.ctx;
    const x = (i % this.cols) * TILE;
    const y = Math.floor(i / this.cols) * TILE;
    const r = rng(i * 13);
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    const lines = stage === 1 ? 3 : 7;
    for (let k = 0; k < lines; k++) {
      let cx = x + 3 + Math.floor(r() * 10);
      let cy = y + TILE - FACE_H + Math.floor(r() * (FACE_H - 2));
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(cx, cy, 1, 1);
        cx += r() < 0.5 ? 1 : -1;
        cy += r() < 0.6 ? 1 : 0;
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(x + 2, y + TILE - FACE_H + 1, TILE - 4, 1);
  }
}
