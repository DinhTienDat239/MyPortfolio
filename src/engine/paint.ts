/**
 * Các "cọ vẽ" pixel cho tile: sàn, tường 3/4 (mặt trên + mặt đứng), nước, trang trí.
 * Dùng chung cho hang ở Hero, thumbnail project và texture nền của section.
 */
import type { Biome } from './biomes';
import { PALETTE, SPRITES, type SpriteName } from '../components/pixel/sprites';

export const TILE = 16;

/** Random tất định (mulberry32) */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash2 = (x: number, y: number, seed = 1) => {
  let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 982451653);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
};
export const hashStr = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

const px = (ctx: CanvasRenderingContext2D, x: number, y: number, c: string, w = 1, h = 1) => {
  ctx.fillStyle = c;
  ctx.fillRect(x, y, w, h);
};

/** Sàn: nền + sỏi lấm tấm + thỉnh thoảng 1 viên cuội. */
export function paintFloor(ctx: CanvasRenderingContext2D, ox: number, oy: number, b: Biome, r: () => number) {
  px(ctx, ox, oy, b.floor[Math.floor(r() * b.floor.length)], TILE, TILE);
  // vệt màu lớn hơn để sàn không phẳng lì
  if (r() < 0.5) px(ctx, ox + Math.floor(r() * 10), oy + Math.floor(r() * 10), b.floor[Math.floor(r() * b.floor.length)], 6, 5);
  for (let i = 0; i < 7; i++) px(ctx, ox + Math.floor(r() * TILE), oy + Math.floor(r() * TILE), b.speck[r() < 0.6 ? 0 : 1]);
  if (r() < 0.22) {
    const x = ox + 2 + Math.floor(r() * 11);
    const y = oy + 2 + Math.floor(r() * 11);
    px(ctx, x, y, b.pebble, 3, 2);
    px(ctx, x, y, b.speck[1]);
  }
}

/** Bóng đổ mềm ngay dưới chân tường (ambient occlusion giả). */
export function paintFloorShadow(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  px(ctx, ox, oy, 'rgba(0,0,0,0.45)', TILE, 2);
  px(ctx, ox, oy + 2, 'rgba(0,0,0,0.25)', TILE, 2);
  px(ctx, ox, oy + 4, 'rgba(0,0,0,0.1)', TILE, 2);
}

/** Mặt trên tường: gần như đen, vân nhẹ. */
export function paintWallTop(ctx: CanvasRenderingContext2D, ox: number, oy: number, b: Biome, r: () => number) {
  px(ctx, ox, oy, b.wallTop[0], TILE, TILE);
  for (let i = 0; i < 5; i++) px(ctx, ox + Math.floor(r() * TILE), oy + Math.floor(r() * TILE), b.wallTop[1], r() < 0.5 ? 2 : 1, 1);
}

export const FACE_H = 11;

/** Mặt đứng 3/4 ở nửa dưới tile tường: sọc dọc + mép trên bắt sáng + chân tối. */
export function paintWallFace(ctx: CanvasRenderingContext2D, ox: number, oy: number, b: Biome, r: () => number) {
  const top = oy + TILE - FACE_H;
  for (let x = 0; x < TILE; x += 2) {
    px(ctx, ox + x, top, b.wallFace[Math.floor(r() * b.wallFace.length)], 2, FACE_H);
  }
  // các vết nứt ngang lẻ tẻ
  for (let i = 0; i < 2; i++) px(ctx, ox + Math.floor(r() * 12), top + 3 + Math.floor(r() * 6), b.wallTop[1], 3 + Math.floor(r() * 3), 1);
  px(ctx, ox, top, b.wallLip, TILE, 1);
  px(ctx, ox, top + 1, 'rgba(255,255,255,0.06)', TILE, 1);
  px(ctx, ox, oy + TILE - 1, 'rgba(0,0,0,0.45)', TILE, 1);
}

/** Quặng gắn trong tường: vài cụm pixel màu + điểm sáng. */
export function paintOre(ctx: CanvasRenderingContext2D, ox: number, oy: number, color: string, r: () => number, face: boolean) {
  const yMin = face ? TILE - FACE_H + 2 : 2;
  for (let i = 0; i < 3; i++) {
    const x = ox + 2 + Math.floor(r() * 11);
    const y = oy + yMin + Math.floor(r() * (TILE - yMin - 4));
    px(ctx, x, y, color, 2, 2);
    px(ctx, x, y, 'rgba(255,255,255,0.55)');
  }
}

export function paintWater(ctx: CanvasRenderingContext2D, ox: number, oy: number, b: Biome, r: () => number, t = 0) {
  const [deep, hi] = b.water ?? ['#0f2a3a', '#1f4f66'];
  px(ctx, ox, oy, deep, TILE, TILE);
  for (let i = 0; i < 3; i++) {
    const y = oy + Math.floor(r() * 14);
    const x = ox + ((Math.floor(r() * 12) + Math.floor(t)) % 12);
    px(ctx, x, y, hi, 4, 1);
  }
}

/** Trang trí nhỏ trên sàn. */
export function paintDecor(ctx: CanvasRenderingContext2D, ox: number, oy: number, d: Biome['decor'][number], r: () => number) {
  const x = ox + 3 + Math.floor(r() * 8);
  const y = oy + 4 + Math.floor(r() * 8);
  const c = d.color;
  const a = d.accent ?? c;
  switch (d.kind) {
    case 'grass':
      px(ctx, x, y + 2, c, 1, 3);
      px(ctx, x + 2, y, c, 1, 5);
      px(ctx, x + 4, y + 1, c, 1, 4);
      px(ctx, x + 2, y, a);
      px(ctx, x + 1, y + 3, a);
      break;
    case 'flower':
      px(ctx, x + 1, y + 2, '#3f7a32', 1, 3);
      px(ctx, x, y + 1, c, 3, 1);
      px(ctx, x + 1, y, c, 1, 3);
      px(ctx, x + 1, y + 1, a);
      break;
    case 'shroom':
      px(ctx, x + 1, y + 2, '#e6dcc4', 1, 2);
      px(ctx, x, y + 1, c, 3, 1);
      px(ctx, x + 1, y, a);
      break;
    case 'crystal':
      px(ctx, x + 1, y, a, 1, 1);
      px(ctx, x, y + 1, c, 3, 3);
      px(ctx, x + 1, y + 1, a, 1, 2);
      px(ctx, x + 3, y + 2, c, 1, 2);
      break;
    case 'bones':
      px(ctx, x, y + 1, c, 4, 1);
      px(ctx, x, y, c);
      px(ctx, x + 3, y + 2, c);
      break;
  }
}

// ---------------- Sprite → canvas (cache) ----------------
const spriteCache = new Map<string, HTMLCanvasElement>();
export function spriteCanvas(name: SpriteName, recolor?: Record<string, string>) {
  const key = name + JSON.stringify(recolor ?? {});
  let c = spriteCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = 16;
    c.height = 16;
    const ctx = c.getContext('2d')!;
    SPRITES[name].forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = recolor?.[ch] ?? PALETTE[ch];
        ctx.fillRect(x, y, 1, 1);
      }),
    );
    spriteCache.set(key, c);
  }
  return c;
}

// ---------------- Texture nền cho section (data URL) ----------------
const texCache = new Map<string, string>();

/** Ô sàn lặp lại được (8×8 tile = 128px) cho nền section. */
export function floorTexture(b: Biome, seed = 7) {
  const key = `floor-${b.id}-${seed}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const c = document.createElement('canvas');
  c.width = c.height = TILE * 8;
  const ctx = c.getContext('2d')!;
  const r = rng(seed + b.id.length * 97);
  for (let y = 0; y < 8; y++)
    for (let x = 0; x < 8; x++) {
      paintFloor(ctx, x * TILE, y * TILE, b, r);
      const d = b.decor.find((dd) => r() < dd.chance * 1.5);
      if (d) paintDecor(ctx, x * TILE, y * TILE, d, r);
    }
  const url = c.toDataURL();
  texCache.set(key, url);
  return url;
}

/** Dải tường 3/4 lặp ngang: 2 hàng mặt trên + 1 hàng có mặt đứng + bóng đổ xuống sàn. */
export function wallBandTexture(b: Biome, seed = 3) {
  const key = `wall-${b.id}-${seed}`;
  if (texCache.has(key)) return texCache.get(key)!;
  const cols = 8;
  const c = document.createElement('canvas');
  c.width = TILE * cols;
  c.height = TILE * 2 + 6;
  const ctx = c.getContext('2d')!;
  const r = rng(seed + b.id.length * 31);
  for (let x = 0; x < cols; x++) {
    paintWallTop(ctx, x * TILE, 0, b, r);
    paintWallTop(ctx, x * TILE, TILE, b, r);
    paintWallFace(ctx, x * TILE, TILE, b, r);
    if (r() < 0.18) paintOre(ctx, x * TILE, TILE, b.ore[Math.floor(r() * b.ore.length)].color, r, true);
  }
  // bóng đổ xuống phần sàn bên dưới (trong suốt dần)
  for (let i = 0; i < 6; i++) px(ctx, 0, TILE * 2 + i, `rgba(0,0,0,${0.5 - i * 0.08})`, c.width, 1);
  const url = c.toDataURL();
  texCache.set(key, url);
  return url;
}
