/**
 * Texture pixel cho thế giới 3D, vẽ bằng chính các "cọ" của engine 2D → cùng một ngôn ngữ hình ảnh.
 * Tất cả dùng NearestFilter để giữ pixel sắc nét.
 */
import * as THREE from 'three';
import { BIOMES, type Biome } from '../engine/biomes';
import { TILE, hash2, paintDecor, paintFloor, paintFloorShadow, paintWater, rng, spriteCanvas } from '../engine/paint';
import type { SpriteName } from '../components/pixel/sprites';
import { WALL, WATER, type OreType, type WorldMap } from './map';

const ORE_COLOR: Record<OreType, string> = { copper: '#e8873f', gold: '#f2c14e', crystal: '#5ef2e6' };

function tex(canvas: HTMLCanvasElement, repeat = false) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!] as const;
}

/** Sàn của cả bản đồ: vẽ sàn ở mọi ô (kể cả dưới tường, để đào xong là thấy sàn). */
export function floorTexture(m: WorldMap, b: Biome = BIOMES.burrow) {
  const [c, ctx] = canvas(m.W * TILE, m.H * TILE);
  for (let y = 0; y < m.H; y++)
    for (let x = 0; x < m.W; x++) {
      const r = rng(Math.floor(hash2(x, y, 31) * 1e9));
      const t = m.tiles[y * m.W + x];
      paintFloor(ctx, x * TILE, y * TILE, b, r);
      if (t === WATER) paintWater(ctx, x * TILE, y * TILE, b, r);
      else if (t !== WALL) {
        const roll = r();
        let acc = 0;
        for (const d of b.decor) {
          acc += d.chance;
          if (roll < acc) {
            paintDecor(ctx, x * TILE, y * TILE, d, r);
            break;
          }
        }
      }
      if (y > 0 && m.tiles[(y - 1) * m.W + x] === WALL && t !== WALL) paintFloorShadow(ctx, x * TILE, y * TILE);
    }
  return tex(c);
}

/** Mặt trên tường: gần như đen, có vân. */
export function wallTopTexture(b: Biome = BIOMES.burrow) {
  const [c, ctx] = canvas(TILE, TILE);
  const r = rng(11);
  ctx.fillStyle = b.wallTop[0];
  ctx.fillRect(0, 0, TILE, TILE);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = b.wallTop[1];
    ctx.fillRect(Math.floor(r() * TILE), Math.floor(r() * TILE), r() < 0.5 ? 2 : 1, 1);
  }
  // mép sáng nhẹ ở cạnh để khối đọc được hình dạng
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.fillRect(0, 0, TILE, 1);
  return tex(c);
}

/** Mặt đứng tường: sọc dọc, mép trên bắt sáng, chân tối, (tuỳ chọn) quặng. */
export function wallFaceTexture(b: Biome = BIOMES.burrow, ore?: OreType, seed = 5) {
  const [c, ctx] = canvas(TILE, TILE);
  const r = rng(seed + (ore ? ore.length * 17 : 0));
  for (let x = 0; x < TILE; x += 2) {
    ctx.fillStyle = b.wallFace[Math.floor(r() * b.wallFace.length)];
    ctx.fillRect(x, 0, 2, TILE);
  }
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = b.wallTop[1];
    ctx.fillRect(Math.floor(r() * 12), 3 + Math.floor(r() * 10), 3 + Math.floor(r() * 3), 1);
  }
  ctx.fillStyle = b.wallLip;
  ctx.fillRect(0, 0, TILE, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(0, TILE - 2, TILE, 2);
  if (ore) {
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(r() * 11);
      const y = 3 + Math.floor(r() * 9);
      ctx.fillStyle = ORE_COLOR[ore];
      ctx.fillRect(x, y, 2, 2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillRect(x, y, 1, 1);
    }
  }
  return tex(c);
}

const spriteTexCache = new Map<string, THREE.Texture>();
export function spriteTexture(name: SpriteName, recolor?: Record<string, string>) {
  const key = name + JSON.stringify(recolor ?? {});
  let t = spriteTexCache.get(key);
  if (!t) {
    t = tex(spriteCanvas(name, recolor));
    spriteTexCache.set(key, t);
  }
  return t;
}

/** Vòng sáng mềm (dùng cho quầng dưới bệ trưng bày, ánh sáng giả trên sàn). */
let glowTex: THREE.Texture | null = null;
export function glowTexture() {
  if (glowTex) return glowTex;
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.4, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  return glowTex;
}
