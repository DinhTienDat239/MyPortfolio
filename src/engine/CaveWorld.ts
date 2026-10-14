/**
 * CaveWorld v2 — hang động 2D nhìn 3/4, vẽ & chiếu sáng hoàn toàn bằng code (nguyên bản).
 *
 * Đồ hoạ:
 *  - Sàn vẽ từng pixel: fbm noise + dither Bayer 4×4 trên 4 tông màu, thảm rêu loang theo noise,
 *    bóng đổ mềm sát chân tường (AO), sỏi.
 *  - Tường: mặt trên có viền bắt sáng + bo góc, mặt đứng 3/4 có vân đá dọc, gradient tối dần, vết nứt.
 *  - Ánh sáng theo lưới nửa ô: mỗi nguồn sáng bắn tia kiểm tra tường → tường che sáng thật;
 *    nội suy mượt lên toàn màn hình, nhân (multiply) vào cảnh. Thêm lõi sáng + bloom (blur).
 *
 * Tương tác: nhân vật đi theo click/WASD (tìm đường BFS), đào tường (3 nhát), mở rương (dự án),
 * bật/tắt đuốc, chạm bệ cổ (sóng sáng), chọc slime, nấm phun bào tử, nước gợn sóng, biển gỗ.
 */
import { BIOMES, type Biome, type BiomeId } from './biomes';
import { hash2, rng, spriteCanvas, TILE } from './paint';
import type { SpriteName } from '../components/pixel/sprites';

export type MinedKind = 'stone' | 'dirt' | 'copper' | 'gold' | 'crystal';
export type Interaction =
  | { type: 'chest'; index: number }
  | { type: 'sign' }
  | { type: 'relic' }
  | { type: 'torch'; lit: boolean }
  | { type: 'slime' }
  | { type: 'shroom' }
  | { type: 'water' };
export interface HoverInfo {
  label: string;
  x: number; // client px
  y: number;
}

const FLOOR = 0;
const WALL = 1;
const WATER = 2;
const FACE = 10; // chiều cao mặt đứng (px)
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16);

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lum = (c: RGB) => c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11;
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shade = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

function vnoise(x: number, y: number, seed: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(l(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), s(xf)), l(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), s(xf)), s(yf));
}
const fbm = (x: number, y: number, seed: number) => vnoise(x, y, seed) * 0.62 + vnoise(x * 2.1, y * 2.1, seed + 17) * 0.28 + vnoise(x * 4.3, y * 4.3, seed + 31) * 0.1;

interface Light {
  x: number;
  y: number;
  r: number;
  c: RGB;
  i: number;
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
  kind: 'debris' | 'ember' | 'drop' | 'spore' | 'coin' | 'ripple' | 'smoke' | 'heart';
  ore?: MinedKind;
  glow?: boolean;
  g?: number;
}
interface Entity {
  kind: 'chest' | 'torch' | 'slime' | 'sign' | 'shroom';
  x: number; // px (tâm chân)
  y: number;
  open?: boolean;
  lit?: boolean;
  wall?: boolean;
  index?: number;
  phase: number;
  // slime
  tx?: number;
  ty?: number;
  hop?: number;
  wait?: number;
  squish?: number;
}

export interface CaveWorldOptions {
  biome?: BiomeId;
  seed?: number;
  focus?: { x: number; y: number };
  interactive?: boolean;
  calm?: boolean;
  still?: boolean;
  scale?: number;
  relic?: SpriteName;
  showPlayer?: boolean;
  chestLabels?: string[];
  onMine?: (kind: MinedKind) => void;
  onHit?: () => void;
  onInteract?: (i: Interaction) => void;
  onHover?: (h: HoverInfo | null) => void;
}

const oreKind = (color: string): MinedKind =>
  color === '#e8873f' ? 'copper' : color === '#f2c14e' ? 'gold' : color === '#5ef2e6' || color === '#b48cff' ? 'crystal' : 'stone';

export class CaveWorld {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private ground = document.createElement('canvas');
  private lightCanvas = document.createElement('canvas');
  private lightSmall = document.createElement('canvas');
  private glowCanvas = document.createElement('canvas');
  private lctx: CanvasRenderingContext2D;
  private b: Biome;
  private floorTones: RGB[];
  private o: CaveWorldOptions & { seed: number; focus: { x: number; y: number } };

  private W = 0;
  private H = 0;
  private cols = 0;
  private rows = 0;
  private tiles = new Uint8Array(0);
  private ore = new Int8Array(0);
  private decor = new Int8Array(0);
  private hits = new Uint8Array(0);
  private moss = new Float32Array(0);
  private relic = { x: 0, y: 0, pulse: 0 };
  private player = { x: 0, y: 0, dir: 'down' as 'down' | 'up' | 'side', flip: false, walk: 0, swing: 0, path: [] as [number, number][], task: null as null | (() => void), mining: -1 };
  private entities: Entity[] = [];
  private grass: { x: number; y: number; h: number; c: string; a: string; bend: number }[] = [];
  private particles: Particle[] = [];
  private flies: { x: number; y: number; vx: number; vy: number; p: number }[] = [];
  private pointer: { x: number; y: number } | null = null;
  private hoverTile = -1;
  private keys = new Set<string>();
  private raf = 0;
  private last = 0;
  private t = 0;
  private running = false;
  private intense = false;
  /** thời gian render trung bình 1 khung (ms) — để đo hiệu năng */
  frameMs = 0;
  private lightR = new Float32Array(0);
  private lightG = new Float32Array(0);
  private lightB = new Float32Array(0);

  constructor(canvas: HTMLCanvasElement, options: CaveWorldOptions = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.lctx = this.lightCanvas.getContext('2d')!;
    this.b = BIOMES[options.biome ?? 'burrow'];
    this.floorTones = this.b.floor.map(hex).sort((a, b) => lum(a) - lum(b));
    this.o = { seed: 239, focus: { x: 0.5, y: 0.5 }, ...options };
    canvas.style.imageRendering = 'pixelated';
  }

  // ======================================================================
  // Kích thước & sinh bản đồ
  // ======================================================================
  resize(cssW: number, cssH: number) {
    const scale = this.o.scale ?? Math.max(2, Math.min(4, Math.round(cssW / 470)));
    this.W = Math.ceil(cssW / scale);
    this.H = Math.ceil(cssH / scale);
    for (const c of [this.canvas, this.lightCanvas]) {
      c.width = this.W;
      c.height = this.H;
    }
    this.glowCanvas.width = Math.ceil(this.W / 2);
    this.glowCanvas.height = Math.ceil(this.H / 2);
    this.cols = Math.ceil(this.W / TILE) + 1;
    this.rows = Math.ceil(this.H / TILE) + 1;
    this.lightSmall.width = this.cols * 2;
    this.lightSmall.height = this.rows * 2;
    const n = this.cols * 2 * this.rows * 2;
    this.lightR = new Float32Array(n);
    this.lightG = new Float32Array(n);
    this.lightB = new Float32Array(n);
    this.generate();
    this.renderGround();
    if (this.o.still || !this.running) this.frame(0);
  }

  private idx = (x: number, y: number) => y * this.cols + x;
  private at = (x: number, y: number) => (x < 0 || y < 0 || x >= this.cols || y >= this.rows ? WALL : this.tiles[this.idx(x, y)]);
  private solid = (x: number, y: number) => this.at(x, y) !== FLOOR;

  private generate() {
    const { cols, rows } = this;
    const seed = this.o.seed;
    const n = cols * rows;
    let t = new Uint8Array(n);
    this.ore = new Int8Array(n).fill(-1);
    this.decor = new Int8Array(n).fill(-1);
    this.hits = new Uint8Array(n);
    this.moss = new Float32Array(n);
    this.particles = [];
    this.entities = [];
    this.grass = [];

    const cx = Math.round((this.W * this.o.focus.x) / TILE);
    const cy = Math.round((this.H * this.o.focus.y) / TILE);
    this.relic = { x: cx, y: cy, pulse: 0 };
    const rx = Math.max(3, Math.min(cx - 1, cols - cx - 2, cols * 0.42));
    const ry = Math.max(2.5, Math.min(cy - 1, rows - cy - 1.5, rows * 0.42));
    const ell = (x: number, y: number) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;

    // 1. noise ban đầu, 2. cellular automata cho hình hang tự nhiên
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const e = ell(x, y);
        const border = x === 0 || y === 0 || x === cols - 1 || y === rows - 1;
        t[this.idx(x, y)] = border || e > 1.25 ? WALL : e < 0.45 ? FLOOR : hash2(x, y, seed) < 0.42 + (e - 0.45) * 0.35 ? WALL : FLOOR;
      }
    for (let it = 0; it < 4; it++) {
      const nt = new Uint8Array(n);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
            nt[this.idx(x, y)] = WALL;
            continue;
          }
          let c = 0;
          for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) c += t[this.idx(x + dx, y + dy)] === WALL ? 1 : 0;
          nt[this.idx(x, y)] = c >= 5 ? WALL : FLOOR;
        }
      t = nt;
    }
    this.tiles = t;
    // khoảng trống quanh bệ cổ
    for (let y = cy - 2; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) this.tiles[this.idx(x, y)] = FLOOR;

    // 3. giữ vùng nối liền với bệ cổ, lấp các túi kín
    const reach = this.flood(cx, cy);
    for (let i = 0; i < n; i++) if (this.tiles[i] === FLOOR && !reach[i]) this.tiles[i] = WALL;

    // 4. hồ nước (lõm noise, tránh khu trung tâm)
    if (this.b.water) {
      for (let y = 1; y < rows - 1; y++)
        for (let x = 1; x < cols - 1; x++) {
          if (this.at(x, y) !== FLOOR || Math.hypot(x - cx, y - cy) < 4.5) continue;
          if (vnoise(x * 0.22, y * 0.22, seed + 9) > 0.7) this.tiles[this.idx(x, y)] = WATER;
        }
      // nước không được cắt hang làm đôi: mở lối đi cạn xuyên qua hồ ở chỗ bị chặn
      for (let guard = 0; guard < 30; guard++) {
        const r2 = this.flood(cx, cy, true);
        let lost = -1;
        for (let i = 0; i < n; i++)
          if (this.tiles[i] === FLOOR && !r2[i]) {
            lost = i;
            break;
          }
        if (lost < 0) break;
        const prev = new Int32Array(n).fill(-2);
        prev[lost] = -1;
        const q = [lost];
        let hit = -1;
        for (let h = 0; h < q.length && hit < 0; h++) {
          const i = q[h];
          const x = i % cols;
          const y = (i / cols) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const j = this.idx(x + dx, y + dy);
            if (this.at(x + dx, y + dy) === WALL || prev[j] !== -2) continue;
            prev[j] = i;
            if (r2[j]) {
              hit = j;
              break;
            }
            q.push(j);
          }
        }
        if (hit < 0) break;
        for (let i = hit; i >= 0; i = prev[i]) if (this.tiles[i] === WATER) this.tiles[i] = FLOOR;
      }
    }

    // 5. rêu + quặng + trang trí
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const i = this.idx(x, y);
        this.moss[i] = vnoise(x * 0.18, y * 0.18, seed + 3);
        if (this.at(x, y) === WALL && this.exposed(x, y) && hash2(x, y, seed + 2) < 0.12) this.ore[i] = Math.floor(hash2(x, y, seed + 3) * this.b.ore.length);
        if (this.at(x, y) === FLOOR && Math.hypot(x - cx, y - cy) > 2.5) {
          const r = hash2(x, y, seed + 11);
          let acc = 0;
          for (let k = 0; k < this.b.decor.length; k++) {
            const d = this.b.decor[k];
            if (d.kind === 'grass') continue; // cỏ là vật thể động
            acc += d.chance * 1.4;
            if (r < acc) {
              this.decor[i] = k;
              break;
            }
          }
        }
      }

    // 6. cỏ động (đung đưa, rẽ ra khi đi qua) — mọc theo thảm rêu
    const grassDef = this.b.decor.find((d) => d.kind === 'grass');
    if (grassDef) {
      const r = rng(seed + 41);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          if (this.at(x, y) !== FLOOR || Math.hypot(x - cx, y - cy) < 2.5) continue;
          const m = this.moss[this.idx(x, y)];
          const count = m > 0.62 ? 3 : m > 0.5 ? 1 : 0;
          for (let k = 0; k < count; k++) if (r() < 0.75) this.grass.push({ x: x * TILE + 2 + r() * 12, y: y * TILE + 4 + r() * 11, h: 3 + Math.floor(r() * 4), c: grassDef.color, a: grassDef.accent ?? grassDef.color, bend: 0 });
        }
      this.grass.sort((a, b) => a.y - b.y);
    }

    // 7. vật thể
    const floorCells: [number, number][] = [];
    for (let y = 1; y < rows - 1; y++) for (let x = 1; x < cols - 1; x++) if (this.at(x, y) === FLOOR) floorCells.push([x, y]);
    const free = (x: number, y: number) => this.entities.every((e) => Math.hypot(e.x / TILE - x - 0.5, e.y / TILE - y - 0.5) > 2.2) && Math.hypot(x - cx, y - cy) > 2.8;

    // đuốc gắn tường
    const wallSpots = floorCells.filter(([x, y]) => this.at(x, y - 1) === WALL).sort((a, b) => hash2(a[0], a[1], seed + 7) - hash2(b[0], b[1], seed + 7));
    const torches: [number, number][] = [];
    for (const [x, y] of wallSpots) {
      if (torches.length >= 10) break;
      if (Math.abs(x - cx) <= 3 && Math.abs(y - cy) <= 3) continue;
      if (torches.every(([tx, ty]) => Math.hypot(tx - x, ty - y) >= 5)) torches.push([x, y]);
    }
    for (const [x, y] of torches) this.entities.push({ kind: 'torch', x: x * TILE + 8, y: y * TILE + 2, lit: true, wall: true, phase: hash2(x, y, 3) * 10 });
    this.entities.push({ kind: 'torch', x: (cx - 2) * TILE + 8, y: (cy + 1) * TILE + 12, lit: true, phase: 1.3 }, { kind: 'torch', x: (cx + 3) * TILE + 8, y: (cy + 1) * TILE + 12, lit: true, phase: 4.1 });

    if (!this.o.still) {
      // rương dự án — ở xa trung tâm, trải đều các hướng
      const chestCount = Math.min(3, this.o.chestLabels?.length ?? 3);
      const far = floorCells
        .filter(([x, y]) => this.at(x, y + 1) !== WATER && this.at(x, y - 1) !== WATER)
        .map(([x, y]) => ({ x, y, d: Math.hypot(x - cx, y - cy), a: Math.atan2(y - cy, x - cx) }))
        .filter((c) => c.d > 4)
        .sort((a, b) => b.d - a.d);
      const placed: typeof far = [];
      for (const c of far) {
        if (placed.length >= chestCount) break;
        if (placed.every((p) => Math.hypot(p.x - c.x, p.y - c.y) > 6) && free(c.x, c.y)) {
          placed.push(c);
          this.entities.push({ kind: 'chest', x: c.x * TILE + 8, y: c.y * TILE + 14, open: false, index: placed.length - 1, phase: 0 });
        }
      }
      // biển gỗ gần chỗ xuất phát
      const sx = cx - 3;
      const sy = cy + 2;
      if (this.at(sx, sy) === FLOOR) this.entities.push({ kind: 'sign', x: sx * TILE + 8, y: sy * TILE + 14, phase: 0 });
      // slime
      for (let k = 0; k < 2; k++) {
        const c = floorCells[Math.floor(hash2(k, 9, seed) * floorCells.length)];
        if (c && free(c[0], c[1])) this.entities.push({ kind: 'slime', x: c[0] * TILE + 8, y: c[1] * TILE + 12, tx: c[0] * TILE + 8, ty: c[1] * TILE + 12, hop: 0, wait: 1 + k, squish: 0, phase: k });
      }
      // nấm phát sáng lớn sát chân tường
      let shrooms = 0;
      for (const [x, y] of wallSpots.slice().reverse()) {
        if (shrooms >= 4) break;
        if (free(x, y) && hash2(x, y, seed + 19) < 0.5) {
          this.entities.push({ kind: 'shroom', x: x * TILE + 8, y: y * TILE + 9, phase: hash2(x, y, 5) * 6 });
          shrooms++;
        }
      }
    }

    this.player = { x: (cx + 1) * TILE + 8, y: (cy + 2) * TILE + 12, dir: 'down', flip: false, walk: 0, swing: 0, path: [], task: null, mining: -1 };
    this.flies = Array.from({ length: this.o.still ? 0 : 30 }, (_, i) => ({ x: hash2(i, 1, seed) * this.W, y: hash2(i, 2, seed) * this.H, vx: 0, vy: 0, p: i * 1.7 }));
  }

  private flood(sx: number, sy: number, blockWater = false) {
    const seen = new Uint8Array(this.cols * this.rows);
    const q: number[] = [this.idx(sx, sy)];
    seen[q[0]] = 1;
    while (q.length) {
      const i = q.pop()!;
      const x = i % this.cols;
      const y = (i / this.cols) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        const tt = this.at(nx, ny);
        if (tt === WALL || (blockWater && tt === WATER)) continue;
        const j = this.idx(nx, ny);
        if (!seen[j]) {
          seen[j] = 1;
          q.push(j);
        }
      }
    }
    return seen;
  }

  private exposed(x: number, y: number) {
    return this.at(x + 1, y) !== WALL || this.at(x - 1, y) !== WALL || this.at(x, y + 1) !== WALL || this.at(x, y - 1) !== WALL;
  }

  // ======================================================================
  // Vẽ lớp nền tĩnh (từng pixel)
  // ======================================================================
  private renderGround() {
    const g = this.ground;
    const GW = this.cols * TILE;
    const GH = this.rows * TILE;
    g.width = GW;
    g.height = GH;
    const ctx = g.getContext('2d')!;
    const img = ctx.createImageData(GW, GH);
    const d = img.data;
    const seed = this.o.seed;
    const b = this.b;
    const tones = this.floorTones;
    const grass = b.decor.find((k) => k.kind === 'grass');
    const mossTones: RGB[] | null = grass ? [shade(hex(grass.color), 0.7), hex(grass.color), mix(hex(grass.color), hex(grass.accent ?? grass.color), 0.5)] : null;
    const wt0 = hex(b.wallTop[0]);
    const wt1 = hex(b.wallTop[1]);
    const lip = hex(b.wallLip);
    const faces = b.wallFace.map(hex);
    const water = b.water ? [hex(b.water[0]), hex(b.water[1])] : null;

    for (let py = 0; py < GH; py++) {
      const ty = (py / TILE) | 0;
      const ly = py - ty * TILE;
      for (let px = 0; px < GW; px++) {
        const tx = (px / TILE) | 0;
        const lx = px - tx * TILE;
        const t = this.at(tx, ty);
        const bay = BAYER[(py & 3) * 4 + (px & 3)];
        let c: RGB;
        if (t === WALL) {
          const faceVisible = this.at(tx, ty + 1) !== WALL;
          if (faceVisible && ly >= TILE - FACE) {
            // mặt đứng: sọc dọc theo cột, sáng ở trên, tối dần xuống chân
            const col = (px / 2) | 0;
            const fy = (ly - (TILE - FACE)) / FACE;
            let fc = faces[Math.floor(hash2(col, ty, seed + 1) * faces.length)];
            fc = shade(fc, 1.08 - fy * 0.45 + (hash2(col, (py / 3) | 0, seed + 4) - 0.5) * 0.12);
            if (ly === TILE - FACE) fc = lip;
            else if (ly === TILE - FACE + 1) fc = mix(lip, fc, 0.5);
            if (hash2(px >> 2, py, seed + 8) < 0.04) fc = shade(fc, 0.6); // vết nứt ngang
            c = fc;
          } else {
            // mặt trên: tối, vân nhẹ, viền bắt sáng ở cạnh giáp sàn
            const nz = fbm(px * 0.12, py * 0.12, seed + 5);
            c = mix(wt0, wt1, nz > 0.55 ? 1 : nz > 0.45 && bay > 0.5 ? 1 : 0);
            const topEdgeLimit = faceVisible ? TILE - FACE : TILE;
            const nearN = this.at(tx, ty - 1) !== WALL && ly <= 1;
            const nearW = this.at(tx - 1, ty) !== WALL && lx <= 1;
            const nearE = this.at(tx + 1, ty) !== WALL && lx >= TILE - 2;
            const nearS = faceVisible && ly >= topEdgeLimit - 2;
            if (nearN || nearW || nearE || nearS) c = mix(c, lip, (ly === 0 || lx === 0 || lx === TILE - 1 || ly === topEdgeLimit - 1) ? 0.55 : 0.28);
          }
          // bo góc: góc ngoài giáp 2 phía sàn → vẽ như sàn
          const cornerNW = this.at(tx - 1, ty) !== WALL && this.at(tx, ty - 1) !== WALL && lx + ly < 3;
          const cornerNE = this.at(tx + 1, ty) !== WALL && this.at(tx, ty - 1) !== WALL && TILE - 1 - lx + ly < 3;
          if (cornerNW || cornerNE) c = this.floorPixel(px, py, tones, mossTones, bay, seed);
        } else if (t === WATER && water) {
          const depth = Math.min(1, this.edgeDist(tx, ty, lx, ly, (k) => k !== WATER) / 6);
          c = mix(mix(water[1], water[0], 0.35), water[0], depth);
          if (depth < 0.2) c = mix(c, [210, 235, 240], 0.25 * (1 - depth / 0.2) * (bay > 0.4 ? 1 : 0.5));
        } else {
          c = this.floorPixel(px, py, tones, mossTones, bay, seed);
          // AO sát chân tường: phía bắc (dưới mặt đứng) đậm hơn
          const dN = this.at(tx, ty - 1) === WALL ? ly : 99;
          const dW = this.at(tx - 1, ty) === WALL ? lx : 99;
          const dE = this.at(tx + 1, ty) === WALL ? TILE - 1 - lx : 99;
          const dS = this.at(tx, ty + 1) === WALL ? TILE - 1 - ly : 99;
          const ao = Math.max(Math.max(0, 1 - dN / 8) * 0.6, Math.max(0, 1 - Math.min(dW, dE) / 5) * 0.35, Math.max(0, 1 - dS / 4) * 0.25);
          c = shade(c, 1 - ao * (bay > 0.25 ? 1 : 0.8));
        }
        const o = (py * GW + px) * 4;
        d[o] = c[0];
        d[o + 1] = c[1];
        d[o + 2] = c[2];
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);

    // sỏi, quặng, trang trí tĩnh
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.cols; x++) {
        const i = this.idx(x, y);
        const r = rng(Math.floor(hash2(x, y, seed) * 1e9));
        const ox = x * TILE;
        const oy = y * TILE;
        if (this.tiles[i] === FLOOR) {
          if (r() < 0.28) {
            const px = ox + 2 + Math.floor(r() * 11);
            const py = oy + 3 + Math.floor(r() * 10);
            ctx.fillStyle = b.pebble;
            ctx.fillRect(px, py, 3, 2);
            ctx.fillStyle = b.speck[1];
            ctx.fillRect(px, py, 1, 1);
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(px, py + 2, 3, 1);
          }
          const dk = this.decor[i];
          if (dk >= 0) this.paintDecorItem(ctx, ox, oy, dk, r);
        } else if (this.tiles[i] === WALL && this.ore[i] >= 0) {
          this.paintOreCluster(ctx, ox, oy, this.b.ore[this.ore[i]].color, r, this.at(x, y + 1) !== WALL);
        }
      }
  }

  private floorPixel(px: number, py: number, tones: RGB[], mossTones: RGB[] | null, bay: number, seed: number): RGB {
    const n = fbm(px * 0.07, py * 0.07, seed) + (hash2(px, py, seed + 13) - 0.5) * 0.12;
    const k = Math.max(0, Math.min(tones.length - 1, Math.floor((n - 0.18) * tones.length * 1.35 + (bay - 0.5) * 0.9)));
    let c = tones[k];
    if (mossTones) {
      const m = fbm(px * 0.045, py * 0.045, seed + 3) + (bay - 0.5) * 0.08;
      if (m > 0.6) c = mossTones[m > 0.7 ? 2 : m > 0.64 ? 1 : 0];
      else if (m > 0.57 && bay > 0.6) c = mossTones[0];
    }
    return c;
  }

  private edgeDist(tx: number, ty: number, lx: number, ly: number, isEdge: (t: number) => boolean) {
    let d = 99;
    if (isEdge(this.at(tx, ty - 1))) d = Math.min(d, ly);
    if (isEdge(this.at(tx, ty + 1))) d = Math.min(d, TILE - 1 - ly);
    if (isEdge(this.at(tx - 1, ty))) d = Math.min(d, lx);
    if (isEdge(this.at(tx + 1, ty))) d = Math.min(d, TILE - 1 - lx);
    return d;
  }

  private paintDecorItem(ctx: CanvasRenderingContext2D, ox: number, oy: number, k: number, r: () => number) {
    const dd = this.b.decor[k];
    const x = ox + 3 + Math.floor(r() * 8);
    const y = oy + 4 + Math.floor(r() * 8);
    const c = dd.color;
    const a = dd.accent ?? c;
    const p = (px: number, py: number, col: string, w = 1, h = 1) => {
      ctx.fillStyle = col;
      ctx.fillRect(px, py, w, h);
    };
    p(x - 1, y + 4, 'rgba(0,0,0,0.3)', 5, 1);
    switch (dd.kind) {
      case 'flower':
        p(x + 1, y + 2, '#3f7a32', 1, 3);
        p(x, y + 1, c, 3, 1);
        p(x + 1, y, c, 1, 3);
        p(x + 1, y + 1, a);
        break;
      case 'shroom':
        p(x + 1, y + 2, '#e6dcc4', 1, 2);
        p(x, y + 1, c, 3, 1);
        p(x + 1, y, a);
        break;
      case 'crystal':
        p(x + 1, y - 1, a);
        p(x, y, c, 3, 4);
        p(x + 1, y, a, 1, 3);
        p(x + 3, y + 1, c, 1, 3);
        p(x - 1, y + 2, c, 1, 2);
        break;
      case 'bones':
        p(x, y + 1, c, 4, 1);
        p(x, y, c);
        p(x + 3, y + 2, c);
        break;
    }
  }

  private paintOreCluster(ctx: CanvasRenderingContext2D, ox: number, oy: number, color: string, r: () => number, face: boolean) {
    const yMin = face ? TILE - FACE + 2 : 3;
    const yMax = face ? TILE - 3 : TILE - 4;
    for (let k = 0; k < 3; k++) {
      const x = ox + 2 + Math.floor(r() * 10);
      const y = oy + yMin + Math.floor(r() * Math.max(1, yMax - yMin));
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(x - 1, y, 4, 3);
      ctx.fillRect(x, y - 1, 2, 4);
      ctx.fillStyle = color;
      ctx.fillRect(x, y, 2, 2);
      ctx.fillRect(x + (k % 2 ? 1 : -0), y + 1, 2, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fillRect(x, y, 1, 1);
    }
  }

  // ======================================================================
  // Vòng lặp
  // ======================================================================
  start() {
    if (this.running || this.o.still) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      const t0 = performance.now();
      this.frame(dt);
      this.frameMs = this.frameMs * 0.9 + (performance.now() - t0) * 0.1;
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
  setKey(key: string, down: boolean) {
    if (down) this.keys.add(key);
    else this.keys.delete(key);
    if (down) {
      this.player.path = [];
      this.player.task = null;
      this.player.mining = -1;
    }
  }

  // ======================================================================
  // Input
  // ======================================================================
  private toGame(clientX: number, clientY: number) {
    const r = this.canvas.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * this.W, y: ((clientY - r.top) / r.height) * this.H };
  }

  /** Thứ đang nằm dưới con trỏ (vật thể ưu tiên hơn tường). */
  private pick(gx: number, gy: number): { e?: Entity; relic?: boolean; wall?: number; water?: boolean } {
    for (const e of [...this.entities].sort((a, b) => b.y - a.y)) {
      const h = e.kind === 'torch' && e.wall ? 18 : 16;
      if (gx >= e.x - 8 && gx <= e.x + 8 && gy >= e.y - h && gy <= e.y + 2) return { e };
    }
    const rx = this.relic.x * TILE + 8;
    const ry = this.relic.y * TILE;
    if (Math.abs(gx - rx) < 16 && gy > ry - 28 && gy < ry + 14) return { relic: true };
    const tx = Math.floor(gx / TILE);
    const ty = Math.floor(gy / TILE);
    if (tx > 0 && ty > 0 && tx < this.cols - 1 && ty < this.rows - 1) {
      if (this.at(tx, ty) === WALL && this.exposed(tx, ty)) return { wall: this.idx(tx, ty) };
      if (this.at(tx, ty) === WATER) return { water: true };
    }
    return {};
  }

  pointerMove(clientX: number, clientY: number) {
    this.pointer = this.toGame(clientX, clientY);
    if (!this.o.interactive) return;
    const p = this.pick(this.pointer.x, this.pointer.y);
    this.hoverTile = p.wall ?? -1;
    const label = p.e
      ? p.e.kind === 'chest'
        ? p.e.open
          ? `Opened · ${this.o.chestLabels?.[p.e.index ?? 0] ?? 'Chest'}`
          : `Open chest · ${this.o.chestLabels?.[p.e.index ?? 0] ?? 'loot'}`
        : p.e.kind === 'torch'
          ? p.e.lit ? 'Snuff torch' : 'Light torch'
          : p.e.kind === 'slime'
            ? 'Pet the slime'
            : p.e.kind === 'sign'
              ? 'Read sign'
              : 'Glowshroom'
      : p.relic
        ? 'Touch the relic'
        : p.wall !== undefined
          ? this.ore[p.wall] >= 0
            ? `Mine ${oreKind(this.b.ore[this.ore[p.wall]].color)} ore`
            : 'Mine rock'
          : null;
    this.o.onHover?.(label ? { label, x: clientX, y: clientY } : null);
  }
  pointerLeave() {
    this.pointer = null;
    this.hoverTile = -1;
    this.o.onHover?.(null);
  }

  /** Click/tap: đi tới & tương tác. Trả về true nếu đã xử lý. */
  click(clientX: number, clientY: number) {
    if (!this.o.interactive) return false;
    const g = this.toGame(clientX, clientY);
    const p = this.pick(g.x, g.y);
    const pl = this.player;
    pl.mining = -1;

    if (p.e) {
      const e = p.e;
      if (e.kind === 'slime') {
        e.squish = 0.5;
        e.hop = 0;
        this.spawn(e.x, e.y - 8, 5, 'heart');
        this.o.onInteract?.({ type: 'slime' });
        return true;
      }
      if (e.kind === 'shroom') {
        this.spawn(e.x, e.y - 8, 14, 'spore');
        e.phase = this.t; // loé sáng
        this.o.onInteract?.({ type: 'shroom' });
        return true;
      }
      if (e.kind === 'torch') {
        e.lit = !e.lit;
        if (!e.lit) this.spawn(e.x, e.y - (e.wall ? 12 : 8), 6, 'smoke');
        else this.spawn(e.x, e.y - (e.wall ? 12 : 8), 8, 'ember');
        this.o.onInteract?.({ type: 'torch', lit: !!e.lit });
        return true;
      }
      // rương / biển: đi tới cạnh rồi mở
      this.walkNear(Math.floor(e.x / TILE), Math.floor((e.y - 2) / TILE), () => {
        if (e.kind === 'chest') {
          if (!e.open) {
            e.open = true;
            this.spawn(e.x, e.y - 10, 16, 'coin');
          }
          this.o.onInteract?.({ type: 'chest', index: e.index ?? 0 });
        } else this.o.onInteract?.({ type: 'sign' });
      });
      return true;
    }
    if (p.relic) {
      this.relic.pulse = 1.6;
      this.spawn(this.relic.x * TILE + 8, this.relic.y * TILE - 16, 18, 'spore');
      this.o.onInteract?.({ type: 'relic' });
      return true;
    }
    if (p.wall !== undefined) {
      const wi = p.wall;
      const tx = wi % this.cols;
      const ty = (wi / this.cols) | 0;
      this.walkNear(tx, ty, () => {
        pl.mining = wi;
        pl.swing = 0;
        this.face(tx * TILE + 8, ty * TILE + 8);
      });
      return true;
    }
    if (p.water) {
      this.particles.push({ x: g.x, y: g.y, vx: 0, vy: 0, life: 1, max: 1, color: '#cfeffa', size: 1, kind: 'ripple' });
      this.o.onInteract?.({ type: 'water' });
      return true;
    }
    // đi tới ô sàn
    const tx = Math.floor(g.x / TILE);
    const ty = Math.floor(g.y / TILE);
    if (this.at(tx, ty) === FLOOR) {
      const path = this.findPath(tx, ty, (x, y) => x === tx && y === ty);
      if (path) {
        pl.path = path;
        pl.task = null;
        return true;
      }
    }
    return false;
  }

  private face(x: number, y: number) {
    const pl = this.player;
    const dx = x - pl.x;
    const dy = y - (pl.y - 6);
    if (Math.abs(dx) > Math.abs(dy)) {
      pl.dir = 'side';
      pl.flip = dx < 0;
    } else pl.dir = dy < 0 ? 'up' : 'down';
  }

  /** Đi tới ô sàn kề (4 hướng) với ô (tx,ty), xong thì chạy task. */
  private walkNear(tx: number, ty: number, task: () => void) {
    const pl = this.player;
    const ptx = Math.floor(pl.x / TILE);
    const pty = Math.floor((pl.y - 4) / TILE);
    const isAdj = (x: number, y: number) => Math.abs(x - tx) + Math.abs(y - ty) === 1;
    if (isAdj(ptx, pty) || (ptx === tx && pty === ty)) {
      pl.path = [];
      pl.task = null;
      task();
      return;
    }
    const path = this.findPath(tx, ty, isAdj);
    if (path) {
      pl.path = path;
      pl.task = task;
    }
  }

  /** BFS 8 hướng trên lưới (không cắt góc tường). */
  private findPath(_tx: number, _ty: number, goal: (x: number, y: number) => boolean): [number, number][] | null {
    const sx = Math.floor(this.player.x / TILE);
    const sy = Math.floor((this.player.y - 4) / TILE);
    const prev = new Int32Array(this.cols * this.rows).fill(-2);
    const start = this.idx(sx, sy);
    prev[start] = -1;
    const q = [start];
    let head = 0;
    let found = -1;
    while (head < q.length) {
      const i = q[head++];
      const x = i % this.cols;
      const y = (i / this.cols) | 0;
      if (goal(x, y)) {
        found = i;
        break;
      }
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const nx = x + dx;
        const ny = y + dy;
        if (this.solid(nx, ny)) continue;
        if (dx && dy && (this.solid(x + dx, y) || this.solid(x, y + dy))) continue;
        const j = this.idx(nx, ny);
        if (prev[j] !== -2) continue;
        prev[j] = i;
        q.push(j);
      }
    }
    if (found < 0) return null;
    const path: [number, number][] = [];
    for (let i = found; i !== start && i >= 0; i = prev[i]) path.push([(i % this.cols) * TILE + 8, ((i / this.cols) | 0) * TILE + 12]);
    return path.reverse();
  }

  private spawn(x: number, y: number, n: number, kind: Particle['kind']) {
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random();
      const base = { x, y, life: 0.8, max: 0.8, size: 1, kind } as Particle;
      if (kind === 'spore') Object.assign(base, { vx: Math.cos(a) * 30 * s, vy: -10 - Math.random() * 25, color: '#9fe8ff', life: 1.4, max: 1.4, glow: true });
      else if (kind === 'coin') Object.assign(base, { vx: Math.cos(a) * 50 * s, vy: -60 - Math.random() * 50, color: Math.random() < 0.5 ? '#f2c14e' : '#fff0a8', life: 1.1, max: 1.1, size: 2, glow: true, g: 220 });
      else if (kind === 'ember') Object.assign(base, { vx: (Math.random() - 0.5) * 16, vy: -20 - Math.random() * 20, color: '#ffb347', life: 0.9, max: 0.9, glow: true });
      else if (kind === 'smoke') Object.assign(base, { vx: (Math.random() - 0.5) * 8, vy: -12 - Math.random() * 10, color: 'rgba(160,150,170,0.6)', life: 1.3, max: 1.3, size: 2 });
      else if (kind === 'heart') Object.assign(base, { vx: (Math.random() - 0.5) * 20, vy: -25 - Math.random() * 15, color: '#ff8fb1', life: 1, max: 1, size: 2 });
      else Object.assign(base, { vx: (Math.random() - 0.5) * 90, vy: -Math.random() * 70 - 20, color: this.b.wallFace[k % this.b.wallFace.length], life: 0.6, max: 0.6, g: 260, size: Math.random() < 0.3 ? 2 : 1 });
      this.particles.push(base);
    }
  }

  private hitWall(i: number) {
    const x = i % this.cols;
    const y = (i / this.cols) | 0;
    const cx = x * TILE + 8;
    const cy = y * TILE + 10;
    this.hits[i]++;
    this.o.onHit?.();
    this.spawn(cx, cy, 5, 'debris');
    if (this.hits[i] >= 3) {
      const o = this.ore[i];
      const kind: MinedKind = o >= 0 ? oreKind(this.b.ore[o].color) : hash2(x, y, 4) < 0.5 ? 'dirt' : 'stone';
      this.tiles[i] = FLOOR;
      this.ore[i] = -1;
      this.hits[i] = 0;
      this.renderGround();
      this.spawn(cx, cy, 14, 'debris');
      this.particles.push({ x: cx, y: cy, vx: (Math.random() - 0.5) * 30, vy: -70, life: 1.1, max: 1.1, size: 3, color: o >= 0 ? this.b.ore[o].color : this.b.wallFace[0], kind: 'drop', ore: kind, glow: o >= 0, g: 220 });
      this.hoverTile = -1;
      this.player.mining = -1;
    }
  }

  // ======================================================================
  // Cập nhật + vẽ 1 khung
  // ======================================================================
  private update(dt: number) {
    const pl = this.player;
    const SPEED = 54;
    // bàn phím
    let kx = 0;
    let ky = 0;
    if (this.keys.has('a')) kx -= 1;
    if (this.keys.has('d')) kx += 1;
    if (this.keys.has('w')) ky -= 1;
    if (this.keys.has('s')) ky += 1;
    let moving = false;
    if (kx || ky) {
      const l = Math.hypot(kx, ky);
      this.moveBy((kx / l) * SPEED * dt, (ky / l) * SPEED * dt);
      this.face(pl.x + kx * 10, pl.y - 6 + ky * 10);
      moving = true;
    } else if (pl.path.length) {
      const [nx, ny] = pl.path[0];
      const dx = nx - pl.x;
      const dy = ny - pl.y;
      const d = Math.hypot(dx, dy);
      if (d < 1.5) {
        pl.path.shift();
        if (!pl.path.length && pl.task) {
          const t = pl.task;
          pl.task = null;
          t();
        }
      } else {
        const step = Math.min(d, SPEED * dt);
        pl.x += (dx / d) * step;
        pl.y += (dy / d) * step;
        this.face(pl.x + dx, pl.y - 6 + dy);
        moving = true;
      }
    }
    pl.walk = moving ? pl.walk + dt * 9 : 0;

    // đào: vung cuốc liên tục tới khi vỡ
    if (pl.mining >= 0) {
      pl.swing += dt;
      if (pl.swing >= 0.3) {
        pl.swing = 0;
        this.hitWall(pl.mining);
      }
    }

    // cỏ rẽ ra khi nhân vật đi qua
    for (const gr of this.grass) {
      const dx = gr.x - pl.x;
      const dy = gr.y - pl.y;
      const target = Math.abs(dy) < 6 && Math.abs(dx) < 9 ? Math.sign(dx || 1) * (1 - Math.abs(dx) / 9) * 3 : 0;
      gr.bend += (target - gr.bend) * Math.min(1, dt * 10);
    }

    // slime nhảy lung tung
    for (const e of this.entities) {
      if (e.kind !== 'slime') continue;
      e.squish = Math.max(0, (e.squish ?? 0) - dt);
      if ((e.wait ?? 0) > 0) {
        e.wait! -= dt;
        if (e.wait! <= 0) {
          const ang = Math.random() * Math.PI * 2;
          const tx = e.x + Math.cos(ang) * 22;
          const ty = e.y + Math.sin(ang) * 16;
          if (!this.solid(Math.floor(tx / TILE), Math.floor((ty - 4) / TILE))) {
            e.tx = tx;
            e.ty = ty;
            e.hop = 0.01;
          } else e.wait = 0.5;
        }
      } else if ((e.hop ?? 0) > 0) {
        e.hop! += dt * 1.6;
        e.x += ((e.tx ?? e.x) - e.x) * Math.min(1, dt * 3);
        e.y += ((e.ty ?? e.y) - e.y) * Math.min(1, dt * 3);
        if (e.hop! >= 1) {
          e.hop = 0;
          e.wait = 1 + Math.random() * 2.5;
        }
      }
    }

    // đom đóm né nhân vật & con trỏ
    for (const f of this.flies) {
      f.vx += Math.sin(this.t * 0.7 + f.p) * 4 * dt;
      f.vy += Math.cos(this.t * 0.5 + f.p * 1.3) * 3 * dt;
      for (const q of [pl, this.pointer]) {
        if (!q) continue;
        const dx = f.x - q.x;
        const dy = f.y - (q === pl ? pl.y - 8 : q.y);
        const d = Math.hypot(dx, dy);
        if (d < 22 && d > 0.1) {
          f.vx += (dx / d) * 60 * dt;
          f.vy += (dy / d) * 60 * dt;
        }
      }
      f.vx *= 0.96;
      f.vy *= 0.96;
      f.x = (f.x + f.vx * dt + this.W) % this.W;
      f.y = (f.y + f.vy * dt + this.H) % this.H;
    }
    this.relic.pulse = Math.max(0, this.relic.pulse - dt);
  }

  private moveBy(dx: number, dy: number) {
    const pl = this.player;
    const R = 4;
    const blocked = (x: number, y: number) => this.solid(Math.floor((x - R) / TILE), Math.floor((y - 6) / TILE)) || this.solid(Math.floor((x + R) / TILE), Math.floor((y - 6) / TILE)) || this.solid(Math.floor((x - R) / TILE), Math.floor((y - 1) / TILE)) || this.solid(Math.floor((x + R) / TILE), Math.floor((y - 1) / TILE));
    if (!blocked(pl.x + dx, pl.y)) pl.x += dx;
    if (!blocked(pl.x, pl.y + dy)) pl.y += dy;
  }

  private frame(dt: number) {
    const { ctx } = this;
    const calm = !!this.o.calm;
    this.t += dt * (calm ? 0.45 : 1);
    const t = this.t;
    if (!this.o.still) this.update(dt);

    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1;
    ctx.drawImage(this.ground, 0, 0);

    // nước: vệt sáng trôi + lấp lánh
    if (this.b.water) {
      for (let y = 0; y < this.rows; y++)
        for (let x = 0; x < this.cols; x++) {
          if (this.at(x, y) !== WATER) continue;
          for (let k = 0; k < 2; k++) {
            const yy = y * TILE + 3 + ((k * 7 + Math.floor(hash2(x, y, k) * 8)) % 12);
            const xx = x * TILE + ((Math.floor(t * 6 + hash2(x, y, k + 5) * 16) % 16) + 16) % 16;
            ctx.fillStyle = 'rgba(190,230,245,0.35)';
            ctx.fillRect(Math.min(xx, x * TILE + 12), yy, 4, 1);
          }
          if (hash2(x, y, Math.floor(t * 2)) < 0.05) {
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.fillRect(x * TILE + Math.floor(hash2(x, y, 3) * 14), y * TILE + Math.floor(hash2(y, x, 3) * 14), 1, 1);
          }
        }
    }

    // vết nứt + ô đang trỏ
    if (this.o.interactive) {
      for (let i = 0; i < this.hits.length; i++) if (this.hits[i]) this.drawCracks(i, this.hits[i]);
      if (this.hoverTile >= 0) {
        const x = (this.hoverTile % this.cols) * TILE;
        const y = Math.floor(this.hoverTile / this.cols) * TILE;
        const a = 0.55 + Math.sin(t * 6) * 0.25;
        ctx.fillStyle = `rgba(255,236,190,${a})`;
        for (const [dx, dy, w, h] of [[0, 0, 4, 1], [0, 0, 1, 4], [TILE - 4, 0, 4, 1], [TILE - 1, 0, 1, 4], [0, TILE - 1, 4, 1], [0, TILE - 4, 1, 4], [TILE - 4, TILE - 1, 4, 1], [TILE - 1, TILE - 4, 1, 4]]) ctx.fillRect(x + dx, y + dy, w, h);
      }
    }

    // ---- vật thể sắp theo chiều sâu (y) ----
    type Drawable = { y: number; draw: () => void };
    const list: Drawable[] = [];
    // bệ cổ
    const sx = this.relic.x * TILE + 8;
    const sy = this.relic.y * TILE;
    const bob = Math.round(Math.sin(t * 1.6) * 2);
    list.push({
      y: sy + 12,
      draw: () => {
        const p = (x: number, y: number, w: number, h: number, c: string) => {
          ctx.fillStyle = c;
          ctx.fillRect(x, y, w, h);
        };
        p(sx - 21, sy + 13, 42, 2, 'rgba(0,0,0,0.35)');
        p(sx - 20, sy - 2, 40, 9, '#555977');
        p(sx - 20, sy - 2, 40, 1, '#7c81a6');
        p(sx - 20, sy + 7, 40, 6, '#363950');
        for (let k = 0; k < 40; k += 5) p(sx - 20 + k, sy + 7, 1, 6, '#2a2c40');
        p(sx - 12, sy - 7, 24, 6, '#6a6f92');
        p(sx - 12, sy - 7, 24, 1, '#9aa0c8');
        p(sx - 12, sy - 2, 24, 1, '#44476a');
        // rune phát sáng trên bệ
        const glow = 0.4 + Math.sin(t * 2) * 0.2 + this.relic.pulse * 0.4;
        p(sx - 8, sy + 9, 2, 2, `rgba(94,242,230,${glow})`);
        p(sx + 6, sy + 9, 2, 2, `rgba(94,242,230,${glow})`);
        p(sx - 1, sy + 9, 2, 2, `rgba(94,242,230,${glow})`);
        p(sx - 6, sy - 9, 12, 2, 'rgba(0,0,0,0.3)');
        ctx.drawImage(spriteCanvas(this.o.relic ?? 'gem'), sx - 8, sy - 28 + bob);
      },
    });
    // nhân vật
    if (this.o.showPlayer !== false && !this.o.still) {
      const pl = this.player;
      list.push({
        y: pl.y,
        draw: () => {
          const step = pl.walk ? Math.floor(pl.walk) % 2 : 0;
          const lift = pl.walk ? (step ? 1 : 0) : Math.round(Math.sin(t * 2.2) * 0.6);
          ctx.fillStyle = 'rgba(0,0,0,0.35)';
          ctx.fillRect(Math.round(pl.x) - 5, Math.round(pl.y) - 1, 10, 2);
          const spr = spriteCanvas(pl.dir === 'up' ? 'explorerBack' : pl.dir === 'side' ? 'explorerSide' : 'explorer');
          const x = Math.round(pl.x) - 8;
          const y = Math.round(pl.y) - 16 - lift;
          ctx.save();
          if (pl.dir === 'side' && pl.flip) {
            ctx.translate(x + 16, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(spr, 0, y);
          } else ctx.drawImage(spr, x, y);
          ctx.restore();
          // cuốc khi đang đào
          if (pl.mining >= 0) {
            const a = pl.swing < 0.18 ? -1.2 + (pl.swing / 0.18) * 2.0 : 0.8 - ((pl.swing - 0.18) / 0.12) * 2.0;
            ctx.save();
            const hx = Math.round(pl.x) + (pl.dir === 'side' ? (pl.flip ? -4 : 4) : 5);
            ctx.translate(hx, Math.round(pl.y) - 9);
            ctx.scale(pl.dir === 'side' && pl.flip ? -1 : 1, 1);
            ctx.rotate(a);
            ctx.drawImage(spriteCanvas('pickaxe'), -3, -13, 11, 11);
            ctx.restore();
          }
        },
      });
    }
    for (const e of this.entities) {
      if (e.kind === 'torch' && e.wall) continue;
      list.push({ y: e.y, draw: () => this.drawEntity(e) });
    }
    for (const gr of this.grass) list.push({ y: gr.y, draw: () => this.drawGrass(gr) });
    // đuốc gắn tường vẽ trên tường (trước các vật thể ở phía nam)
    for (const e of this.entities) if (e.kind === 'torch' && e.wall) this.drawEntity(e);
    list.sort((a, b) => a.y - b.y).forEach((d) => d.draw());

    // ---- hạt ----
    this.particles = this.particles.filter((p) => {
      p.life -= dt;
      if (p.life <= 0) {
        if (p.kind === 'drop' && p.ore) this.o.onMine?.(p.ore);
        return false;
      }
      if (p.kind === 'drop') {
        const k = 1 - p.life / p.max;
        if (k < 0.45) {
          p.vy += (p.g ?? 220) * dt;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        } else {
          // bay về phía nhân vật như được nhặt
          p.x += (this.player.x - p.x) * Math.min(1, dt * 6);
          p.y += (this.player.y - 10 - p.y) * Math.min(1, dt * 6);
        }
      } else if (p.kind === 'ripple') {
        // vòng gợn sóng
      } else {
        if (p.g) p.vy += p.g * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.kind === 'spore' || p.kind === 'smoke' || p.kind === 'heart') {
          p.vx *= 0.97;
          p.vy *= 0.97;
        }
      }
      if (p.kind === 'ripple') {
        const r = (1 - p.life / p.max) * 12;
        ctx.strokeStyle = `rgba(200,235,250,${p.life * 0.7})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(p.x - r), Math.round(p.y - r * 0.5), Math.round(r * 2), Math.round(r));
      } else if (p.kind === 'heart') {
        ctx.globalAlpha = Math.min(1, p.life * 2);
        ctx.fillStyle = p.color;
        const x = Math.round(p.x);
        const y = Math.round(p.y);
        ctx.fillRect(x, y, 1, 1);
        ctx.fillRect(x + 2, y, 1, 1);
        ctx.fillRect(x - 0, y + 1, 3, 1);
        ctx.fillRect(x + 1, y + 2, 1, 1);
        ctx.globalAlpha = 1;
      } else if (!p.glow || p.kind === 'drop' || p.kind === 'coin') {
        ctx.globalAlpha = Math.min(1, p.life * 3);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
        if (p.kind === 'drop') {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
        }
        ctx.globalAlpha = 1;
      }
      return true;
    });

    this.renderLighting(t);
  }

  private drawGrass(gr: { x: number; y: number; h: number; c: string; a: string; bend: number }) {
    const ctx = this.ctx;
    const sway = Math.sin(this.t * 1.8 + gr.x * 0.3) * 0.8 + gr.bend;
    const x = Math.round(gr.x);
    const y = Math.round(gr.y);
    for (let k = 0; k < 3; k++) {
      const bx = x + k * 2 - 2;
      const h = gr.h - (k === 1 ? 0 : 1);
      for (let s = 0; s < h; s++) {
        const off = Math.round(sway * (s / h));
        ctx.fillStyle = s === h - 1 ? gr.a : gr.c;
        ctx.fillRect(bx + off, y - s, 1, 1);
      }
    }
  }

  private drawEntity(e: Entity) {
    const ctx = this.ctx;
    const x = Math.round(e.x);
    const y = Math.round(e.y);
    const shadow = (w: number) => {
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(x - w / 2, y - 1, w, 2);
    };
    switch (e.kind) {
      case 'torch': {
        const frame = Math.floor(this.t * 7 + e.phase) % 2 === 0;
        if (!e.wall) shadow(6);
        const yy = e.wall ? y - 14 : y - 16;
        ctx.globalAlpha = e.lit ? 1 : 0.85;
        if (e.lit) ctx.drawImage(spriteCanvas(frame ? 'torch' : 'torch2'), x - 8, yy);
        else ctx.drawImage(spriteCanvas('torch', { y: '#3a3436', o: '#2a2426', r: '#1c1819' }), x - 8, yy);
        ctx.globalAlpha = 1;
        if (e.lit && !this.o.calm && !this.o.still && Math.random() < 0.04) this.spawn(x, yy + 3, 1, 'ember');
        break;
      }
      case 'chest': {
        shadow(14);
        const glint = !e.open && Math.sin(this.t * 3 + (e.index ?? 0)) > 0.92;
        ctx.drawImage(spriteCanvas(e.open ? 'chestOpen' : 'chest'), x - 8, y - 15);
        if (glint) {
          ctx.fillStyle = 'rgba(255,255,255,0.9)';
          ctx.fillRect(x + 3, y - 10, 1, 3);
          ctx.fillRect(x + 2, y - 9, 3, 1);
        }
        break;
      }
      case 'sign':
        shadow(10);
        ctx.drawImage(spriteCanvas('sign'), x - 8, y - 15);
        break;
      case 'slime': {
        const hop = e.hop ?? 0;
        const jump = hop > 0 ? Math.sin(hop * Math.PI) * 6 : 0;
        const sq = (e.squish ?? 0) > 0 ? Math.sin((e.squish ?? 0) * 20) * 0.25 : hop > 0 ? -0.1 : Math.sin(this.t * 3 + e.phase) * 0.06;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(x - 5 + Math.round(jump / 3), y - 1, 10 - Math.round(jump / 2), 2);
        const w = Math.round(16 * (1 + sq));
        const h = Math.round(16 * (1 - sq));
        ctx.drawImage(spriteCanvas('slime', { l: '#e8873f', L: '#a8521f', e: '#fff3e0' }), x - w / 2, y - h + 2 - jump, w, h);
        break;
      }
      case 'shroom': {
        const p = (px: number, py: number, w: number, h: number, c: string) => {
          ctx.fillStyle = c;
          ctx.fillRect(px, py, w, h);
        };
        p(x - 4, y, 8, 1, 'rgba(0,0,0,0.3)');
        p(x - 1, y - 5, 2, 5, '#e6dcc4');
        p(x - 4, y - 8, 8, 3, '#3aa8e8');
        p(x - 3, y - 9, 6, 1, '#57c7ff');
        p(x - 2, y - 8, 2, 1, '#c6f1ff');
        p(x + 3, y - 3, 1, 3, '#e6dcc4');
        p(x + 2, y - 5, 3, 2, '#57c7ff');
        break;
      }
    }
  }

  private drawCracks(i: number, stage: number) {
    const ctx = this.ctx;
    const x = (i % this.cols) * TILE;
    const y = Math.floor(i / this.cols) * TILE;
    const r = rng(i * 13);
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    const lines = stage === 1 ? 3 : 7;
    const face = this.at(i % this.cols, Math.floor(i / this.cols) + 1) !== WALL;
    for (let k = 0; k < lines; k++) {
      let cx = x + 3 + Math.floor(r() * 10);
      let cy = y + (face ? TILE - FACE : 2) + Math.floor(r() * (FACE - 2));
      for (let s = 0; s < 4; s++) {
        ctx.fillRect(cx, cy, 1, 1);
        cx += r() < 0.5 ? 1 : -1;
        cy += r() < 0.6 ? 1 : 0;
      }
    }
  }

  // ======================================================================
  // Ánh sáng: lưới nửa ô, tường che sáng, nội suy mượt + lõi sáng + bloom
  // ======================================================================
  private renderLighting(t: number) {
    const lights: Light[] = [];
    const L = hex(`#${this.b.light.map((v) => v.toString(16).padStart(2, '0')).join('')}`);
    for (const e of this.entities) {
      if (e.kind === 'torch' && e.lit) {
        const f = 0.9 + Math.sin(t * 9 + e.phase) * 0.06 + Math.sin(t * 23 + e.phase * 2) * 0.04;
        lights.push({ x: e.x, y: e.y - (e.wall ? 8 : 10), r: 92 * (0.97 + f * 0.03), c: L, i: 1.15 * f });
      }
      if (e.kind === 'shroom') {
        const flash = Math.max(0, 1 - (t - e.phase) * 1.2);
        lights.push({ x: e.x, y: e.y - 6, r: 34 + flash * 40, c: [70, 180, 255], i: 0.55 + flash * 0.8 + Math.sin(t * 1.5 + e.phase) * 0.08 });
      }
      if (e.kind === 'chest' && e.open) lights.push({ x: e.x, y: e.y - 8, r: 30, c: [255, 210, 110], i: 0.7 });
    }
    const pulse = this.relic.pulse;
    lights.push({ x: this.relic.x * TILE + 8, y: this.relic.y * TILE - 16, r: 104 + Math.sin(t * 1.6) * 6 + pulse * 160, c: [80, 225, 215], i: 0.95 + pulse * 0.6 });
    if (!this.o.still && this.o.showPlayer !== false) lights.push({ x: this.player.x, y: this.player.y - 8, r: 56, c: [255, 205, 150], i: 0.85 });
    if (this.pointer && this.o.interactive) lights.push({ x: this.pointer.x, y: this.pointer.y, r: 48, c: [255, 214, 160], i: 0.5 });
    for (let y = 0; y < this.rows; y++)
      for (let x = 0; x < this.cols; x++) {
        const i = this.idx(x, y);
        const o = this.ore[i];
        if (o >= 0 && this.b.ore[o].light) lights.push({ x: x * TILE + 8, y: y * TILE + 11, r: 26, c: this.b.ore[o].light as RGB, i: 0.6 });
        const d = this.decor[i];
        if (d >= 0 && this.tiles[i] === FLOOR && (this.b.decor[d].kind === 'shroom' || this.b.decor[d].kind === 'crystal')) lights.push({ x: x * TILE + 8, y: y * TILE + 8, r: 20, c: hex(this.b.decor[d].color), i: 0.4 });
      }
    for (const p of this.particles) if (p.glow && p.kind !== 'ripple') lights.push({ x: p.x, y: p.y, r: p.kind === 'drop' ? 16 : 10, c: p.kind === 'spore' ? [120, 220, 255] : [255, 200, 120], i: 0.4 * Math.min(1, p.life * 2) });

    // lưới nửa ô
    const gw = this.cols * 2;
    const gh = this.rows * 2;
    const R = this.lightR;
    const G = this.lightG;
    const B = this.lightB;
    const amb = this.b.ambient.map((v) => v * (this.intense ? 3 : 1));
    R.fill(amb[0]);
    G.fill(amb[1]);
    B.fill(amb[2]);
    for (const l of lights) {
      const cx0 = Math.max(0, Math.floor((l.x - l.r) / 8));
      const cx1 = Math.min(gw - 1, Math.ceil((l.x + l.r) / 8));
      const cy0 = Math.max(0, Math.floor((l.y - l.r) / 8));
      const cy1 = Math.min(gh - 1, Math.ceil((l.y + l.r) / 8));
      const ltx = Math.floor(l.x / TILE);
      const lty = Math.floor(l.y / TILE);
      for (let gy = cy0; gy <= cy1; gy++)
        for (let gx = cx0; gx <= cx1; gx++) {
          const px = gx * 8 + 4;
          const py = gy * 8 + 4;
          const d = Math.hypot(px - l.x, py - l.y);
          if (d >= l.r) continue;
          // tia từ đèn tới ô: bị tường chặn thì tối (trừ chính ô tường đích → mặt tường vẫn được soi)
          const ttx = Math.floor(px / TILE);
          const tty = Math.floor(py / TILE);
          let blocked = false;
          const steps = Math.ceil(d / 5);
          for (let s = 1; s < steps; s++) {
            const sx = Math.floor((l.x + ((px - l.x) * s) / steps) / TILE);
            const sy = Math.floor((l.y + ((py - l.y) * s) / steps) / TILE);
            if ((sx === ttx && sy === tty) || (sx === ltx && sy === lty)) continue;
            if (this.at(sx, sy) === WALL) {
              blocked = true;
              break;
            }
          }
          if (blocked) continue;
          const k = (1 - d / l.r) ** 1.7 * l.i * 255;
          const j = gy * gw + gx;
          R[j] += (k * l.c[0]) / 255;
          G[j] += (k * l.c[1]) / 255;
          B[j] += (k * l.c[2]) / 255;
        }
    }
    const sctx = this.lightSmall.getContext('2d')!;
    const img = sctx.createImageData(gw, gh);
    for (let j = 0; j < gw * gh; j++) {
      img.data[j * 4] = Math.min(255, R[j]);
      img.data[j * 4 + 1] = Math.min(255, G[j]);
      img.data[j * 4 + 2] = Math.min(255, B[j]);
      img.data[j * 4 + 3] = 255;
    }
    sctx.putImageData(img, 0, 0);

    const lc = this.lctx;
    lc.globalCompositeOperation = 'source-over';
    lc.imageSmoothingEnabled = true;
    lc.drawImage(this.lightSmall, 0, 0, gw * 8, gh * 8);
    // lõi sáng ấm sát nguồn (không bị lưới làm nhoè)
    lc.globalCompositeOperation = 'lighter';
    for (const l of lights) {
      if (l.r < 40) continue;
      const g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, 22);
      g.addColorStop(0, `rgba(${l.c[0]},${l.c[1]},${l.c[2]},${0.35 * l.i})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lc.fillStyle = g;
      lc.fillRect(l.x - 22, l.y - 22, 44, 44);
    }
    const ctx = this.ctx;
    ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(this.lightCanvas, 0, 0);

    // ---- bloom: quầng sáng mờ quanh lửa, pha lê, hạt sáng ----
    const gc = this.glowCanvas.getContext('2d')!;
    gc.globalCompositeOperation = 'source-over';
    gc.clearRect(0, 0, this.glowCanvas.width, this.glowCanvas.height);
    gc.globalCompositeOperation = 'lighter';
    const blob = (x: number, y: number, r: number, c: string) => {
      const g = gc.createRadialGradient(x / 2, y / 2, 0, x / 2, y / 2, r / 2);
      g.addColorStop(0, c);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      gc.fillStyle = g;
      gc.fillRect(x / 2 - r / 2, y / 2 - r / 2, r, r);
    };
    for (const e of this.entities) {
      if (e.kind === 'torch' && e.lit) blob(e.x, e.y - (e.wall ? 12 : 13), 18, 'rgba(255,170,70,0.75)');
      if (e.kind === 'shroom') blob(e.x, e.y - 7, 14, 'rgba(90,200,255,0.5)');
    }
    blob(this.relic.x * TILE + 8, this.relic.y * TILE - 20, 30 + this.relic.pulse * 30, `rgba(94,242,230,${0.55 + this.relic.pulse * 0.3})`);
    for (const p of this.particles) if (p.glow) blob(p.x, p.y, 6, p.kind === 'spore' ? 'rgba(160,230,255,0.6)' : 'rgba(255,200,110,0.6)');
    for (const f of this.flies) {
      const a = 0.35 + 0.35 * Math.sin(t * 2 + f.p * 3);
      blob(f.x, f.y, 6, `rgba(200,255,120,${a * 0.6})`);
    }
    // phóng to canvas nửa độ phân giải có làm mượt = đủ mềm như bloom, không cần filter blur (rất chậm)
    ctx.globalCompositeOperation = 'screen';
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.glowCanvas, 0, 0, this.W, this.H);
    ctx.imageSmoothingEnabled = false;

    // ---- hạt phát sáng vẽ sau ánh sáng ----
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      if (!p.glow || p.kind === 'drop' || p.kind === 'coin') continue;
      ctx.fillStyle = p.kind === 'spore' ? `rgba(170,235,255,${p.life})` : `rgba(255,${150 + Math.floor(p.life * 80)},80,${p.life})`;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
    }
    for (const f of this.flies) {
      const a = 0.4 + 0.4 * Math.sin(t * 2 + f.p * 3);
      ctx.fillStyle = `rgba(220,255,150,${a})`;
      ctx.fillRect(Math.round(f.x), Math.round(f.y), 1, 1);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}
