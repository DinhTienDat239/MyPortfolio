import { useEffect, useRef } from 'react';
import { PALETTE, SPRITES, type SpriteName } from './sprites';
import { cn } from '../../lib/utils';

const W = 80;
const H = 50;

/** Random tất định theo seed (mulberry32) */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hashStr = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

const BIOMES = [
  { bg: '#0d0e1c', wall: ['#2b2d48', '#25273f', '#33365a'], floor: '#3b3d5e', ore: '#f5c542', glow: 'rgba(245,197,66,0.25)' },
  { bg: '#0b1313', wall: ['#1d3328', '#173025', '#24402f'], floor: '#2c5a33', ore: '#4fd6ff', glow: 'rgba(79,214,255,0.25)' },
  { bg: '#0f1726', wall: ['#1d2c4a', '#18253f', '#223559'], floor: '#1f9c9a', ore: '#5ef2e6', glow: 'rgba(94,242,230,0.25)' },
  { bg: '#1a0f14', wall: ['#3a2026', '#311a20', '#45262e'], floor: '#6e4d36', ore: '#e07a3f', glow: 'rgba(224,122,63,0.25)' },
];

/**
 * Khung cảnh hang pixel tự sinh cho project chưa có thumbnail:
 * trần/sàn lởm chởm, quặng, bào tử, và 1 vật phẩm lơ lửng giữa phòng.
 */
export default function PixelScene({ seed, icon, className }: { seed: string; icon: SpriteName; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    const rand = rng(hashStr(seed));
    const biome = BIOMES[Math.floor(rand() * BIOMES.length)];

    ctx.fillStyle = biome.bg;
    ctx.fillRect(0, 0, W, H);

    // quầng sáng giữa phòng
    const g = ctx.createRadialGradient(W / 2, H / 2, 2, W / 2, H / 2, 30);
    g.addColorStop(0, biome.glow);
    g.addColorStop(1, 'transparent');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // trần & sàn lởm chởm theo cột 2px
    let top = 6 + Math.floor(rand() * 6);
    let bottom = 8 + Math.floor(rand() * 6);
    for (let x = 0; x < W; x += 2) {
      top = Math.max(3, Math.min(14, top + Math.floor(rand() * 5) - 2));
      bottom = Math.max(5, Math.min(14, bottom + Math.floor(rand() * 5) - 2));
      for (let y = 0; y < top; y++) {
        ctx.fillStyle = biome.wall[Math.floor(rand() * biome.wall.length)];
        ctx.fillRect(x, y, 2, 1);
      }
      for (let y = H - bottom; y < H; y++) {
        ctx.fillStyle = y === H - bottom ? biome.floor : biome.wall[Math.floor(rand() * biome.wall.length)];
        ctx.fillRect(x, y, 2, 1);
      }
      // quặng gắn trong tường
      if (rand() < 0.12) {
        ctx.fillStyle = biome.ore;
        ctx.fillRect(x, Math.floor(rand() * top), 2, 2);
      }
      if (rand() < 0.1) {
        ctx.fillStyle = biome.ore;
        ctx.fillRect(x, H - 1 - Math.floor(rand() * (bottom - 1)), 2, 2);
      }
    }
    // bào tử
    for (let i = 0; i < 18; i++) {
      ctx.fillStyle = rand() < 0.5 ? 'rgba(255,215,106,0.8)' : 'rgba(159,247,239,0.8)';
      ctx.fillRect(Math.floor(rand() * W), 14 + Math.floor(rand() * (H - 28)), 1, 1);
    }
    // vật phẩm ở giữa (sprite 16×16 vẽ x1.5 → làm tròn x1 cho sắc nét, vẽ 2 lần cho to: x2 = 32px)
    const rows = SPRITES[icon];
    const ox = W / 2 - 16;
    const oy = H / 2 - 16;
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        if (ch === '.') return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(ox + x * 2, oy + y * 2, 2, 2);
      }),
    );
  }, [seed, icon]);

  return <canvas ref={ref} width={W} height={H} aria-hidden className={cn('pixelated h-full w-full', className)} />;
}
