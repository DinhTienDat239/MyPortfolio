/**
 * Sinh bản đồ hang cho thế giới 3D: 1 hang lớn hình elip quanh bệ pha lê (spawn),
 * các bệ trưng bày dự án xếp thành vòng, đuốc, quặng, hồ nước và vài "túi" hang phụ.
 * Tọa độ lưới (x, y) → thế giới (x - W/2 + .5, 0, y - H/2 + .5).
 */
import { hash2 } from '../engine/paint';

export const FLOOR = 0;
export const WALL = 1;
export const WATER = 2;

export type OreType = 'copper' | 'gold' | 'crystal';

export interface WorldMap {
  W: number;
  H: number;
  tiles: Uint8Array;
  ore: (OreType | null)[];
  torches: { x: number; y: number }[];
  pedestals: { x: number; y: number; index: number }[];
  spawn: { x: number; y: number };
  shrine: { x: number; y: number };
}

const noise = (x: number, y: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const s = (t: number) => t * t * (3 - 2 * t);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  return l(l(hash2(xi, yi, seed), hash2(xi + 1, yi, seed), s(xf)), l(hash2(xi, yi + 1, seed), hash2(xi + 1, yi + 1, seed), s(xf)), s(yf));
};

export function generateWorld(projectCount: number, seed = 239): WorldMap {
  const W = 46;
  const H = 36;
  const tiles = new Uint8Array(W * H).fill(WALL);
  const ore: (OreType | null)[] = new Array(W * H).fill(null);
  const idx = (x: number, y: number) => y * W + x;
  const cx = Math.floor(W / 2);
  const cy = Math.floor(H / 2);

  // hang chính
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const n = noise(x * 0.22, y * 0.22, seed);
      const e = ((x - cx) / 13) ** 2 + ((y - cy) / 10) ** 2 + (n - 0.5) * 0.7;
      if (e < 1) tiles[idx(x, y)] = FLOOR;
    }
  // vài túi hang phụ nối ra ngoài
  const pockets = [
    [cx - 15, cy - 6, 4, 3],
    [cx + 15, cy + 5, 4, 3],
    [cx + 5, cy - 13, 3, 3],
    [cx - 6, cy + 13, 4, 2.5],
  ];
  for (const [px, py, rx, ry] of pockets)
    for (let y = 1; y < H - 1; y++)
      for (let x = 1; x < W - 1; x++) {
        const e = ((x - px) / rx) ** 2 + ((y - py) / ry) ** 2 + (noise(x * 0.4, y * 0.4, seed + 3) - 0.5) * 0.6;
        if (e < 1) tiles[idx(x, y)] = FLOOR;
      }
  // đường hầm nối túi với hang chính
  for (const [px, py] of pockets) {
    let x = px;
    let y = py;
    while (Math.abs(x - cx) + Math.abs(y - cy) > 6) {
      tiles[idx(Math.round(x), Math.round(y))] = FLOOR;
      tiles[idx(Math.round(x) + 1, Math.round(y))] = FLOOR;
      x += Math.sign(cx - x) * 0.6;
      y += Math.sign(cy - y) * 0.45;
    }
  }
  // cột đá lẻ trong hang (tránh khu trung tâm)
  for (let y = 2; y < H - 2; y++)
    for (let x = 2; x < W - 2; x++) {
      const d = Math.hypot((x - cx) / 13, (y - cy) / 10);
      if (tiles[idx(x, y)] === FLOOR && d > 0.75 && d < 0.95 && hash2(x, y, seed + 5) < 0.12) tiles[idx(x, y)] = WALL;
    }
  // hồ nước
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      const e = ((x - (cx - 8)) / 3.2) ** 2 + ((y - (cy + 5)) / 2.2) ** 2 + (noise(x * 0.5, y * 0.5, seed + 9) - 0.5) * 0.5;
      if (e < 1 && tiles[idx(x, y)] === FLOOR) tiles[idx(x, y)] = WATER;
    }
  // dọn sạch khu spawn
  for (let y = cy - 3; y <= cy + 3; y++) for (let x = cx - 3; x <= cx + 3; x++) tiles[idx(x, y)] = FLOOR;

  // bệ trưng bày dự án: 1 vòng elip quanh bệ pha lê
  const pedestals: WorldMap['pedestals'] = [];
  const n = Math.max(1, projectCount);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const x = Math.round(cx + Math.cos(a) * 7.5);
    const y = Math.round(cy + Math.sin(a) * 5.2);
    for (let yy = y - 1; yy <= y + 1; yy++) for (let xx = x - 1; xx <= x + 1; xx++) if (tiles[idx(xx, yy)] !== FLOOR) tiles[idx(xx, yy)] = FLOOR;
    pedestals.push({ x, y, index: i });
  }

  // quặng ở tường lộ ra
  const exposed = (x: number, y: number) =>
    [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const xx = x + dx;
      const yy = y + dy;
      return xx >= 0 && yy >= 0 && xx < W && yy < H && tiles[idx(xx, yy)] !== WALL;
    });
  for (let y = 1; y < H - 1; y++)
    for (let x = 1; x < W - 1; x++) {
      if (tiles[idx(x, y)] !== WALL || !exposed(x, y)) continue;
      const r = hash2(x, y, seed + 2);
      if (r < 0.03) ore[idx(x, y)] = 'crystal';
      else if (r < 0.07) ore[idx(x, y)] = 'gold';
      else if (r < 0.15) ore[idx(x, y)] = 'copper';
    }

  // đuốc: 2 cạnh bệ + rải quanh hang (sàn sát tường phía bắc)
  const torches: WorldMap['torches'] = [
    { x: cx - 2, y: cy + 1 },
    { x: cx + 2, y: cy + 1 },
  ];
  const cand: [number, number][] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (tiles[idx(x, y)] === FLOOR && tiles[idx(x, y - 1)] === WALL) cand.push([x, y]);
  cand.sort((a, b) => hash2(a[0], a[1], seed + 7) - hash2(b[0], b[1], seed + 7));
  for (const [x, y] of cand) {
    if (torches.length >= 8) break;
    if (torches.every((t) => Math.hypot(t.x - x, t.y - y) >= 8) && pedestals.every((p) => Math.hypot(p.x - x, p.y - y) > 1.5)) torches.push({ x, y });
  }

  return { W, H, tiles, ore, torches, pedestals, spawn: { x: cx, y: cy + 2.2 }, shrine: { x: cx, y: cy } };
}

export const toWorld = (m: WorldMap, x: number, y: number) => [x - m.W / 2 + 0.5, y - m.H / 2 + 0.5] as const;
export const toTile = (m: WorldMap, wx: number, wz: number) => [Math.floor(wx + m.W / 2), Math.floor(wz + m.H / 2)] as const;
