import { useEffect, useRef } from 'react';
import { CaveWorld } from '../../engine/CaveWorld';
import type { BiomeId } from '../../engine/biomes';
import { hashStr } from '../../engine/paint';
import type { SpriteName } from './sprites';
import { cn } from '../../lib/utils';

const BIOME_ORDER: BiomeId[] = ['burrow', 'clay', 'ruins', 'crystal', 'garden'];

/**
 * Ảnh minh hoạ tự sinh cho project chưa có thumbnail: một gian hang nhỏ được chiếu sáng,
 * vật phẩm của project lơ lửng trên bệ. Biome chọn theo slug → mỗi project một vẻ.
 */
export default function PixelScene({ seed, icon, className }: { seed: string; icon: SpriteName; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const h = hashStr(seed);
    const world = new CaveWorld(canvas, {
      biome: BIOME_ORDER[h % BIOME_ORDER.length],
      seed: h % 100000,
      still: true,
      scale: 1,
      relic: icon,
      showPlayer: false,
      focus: { x: 0.5, y: 0.52 },
    });
    world.resize(176, 110);
    return () => world.destroy();
  }, [seed, icon]);

  return <canvas ref={ref} aria-hidden className={cn('pixelated h-full w-full', className)} />;
}
